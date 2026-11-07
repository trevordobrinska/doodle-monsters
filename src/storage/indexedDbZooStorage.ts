import { byDateDrawn, MONSTER_SCHEMA_VERSION, type MonsterRecord, type ZooStorage } from "../core/zooStorage";

const DB_NAME = "doodle-monsters";
const DB_VERSION = 1;
const MONSTERS = "monsters";

/**
 * The Zoo kept in the tablet's IndexedDB: one record per Monster, keyed by
 * its id, with the drawing stored as a Blob.
 *
 * Provisional until Night 1 shows what the Kids profile allows (ticket 14):
 * it doesn't ask for persistent storage yet, and isn't unit-tested (the
 * in-memory version stands in for it in tests).
 */
export function indexedDbZooStorage(): ZooStorage {
  let opening: Promise<IDBDatabase> | undefined;
  // If opening fails, try again next time rather than failing every save from now on.
  const db = () =>
    (opening ??= open().catch((error) => {
      opening = undefined;
      throw error;
    }));

  /** Runs one request in its own transaction and waits for the transaction to finish. */
  async function run<T>(mode: IDBTransactionMode, makeRequest: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T> {
    const tx = (await db()).transaction(MONSTERS, mode);
    const request = makeRequest(tx.objectStore(MONSTERS));
    await done(tx);
    return request ? (request.result as T) : (undefined as T);
  }

  const list = async () => (await run<MonsterRecord[]>("readonly", (store) => store.getAll())).sort(byDateDrawn);

  return {
    save: (monster) => run("readwrite", (store) => void store.put(monster)),
    list,
    remove: (id) => run("readwrite", (store) => void store.delete(id)),
    async exportZoo() {
      return { schemaVersion: MONSTER_SCHEMA_VERSION, monsters: await list() };
    },
    importZoo: (backup) =>
      run("readwrite", (store) => {
        for (const monster of backup.monsters) store.put(monster);
      }),
  };
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(MONSTERS)) request.result.createObjectStore(MONSTERS, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Saving the Zoo was cancelled"));
  });
}
