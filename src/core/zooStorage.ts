import type { Temperament } from "./temperaments";

/**
 * The version of the Monster record below. Bump it whenever the record's
 * shape changes, so an old backup or a future server can tell what it holds.
 */
export const MONSTER_SCHEMA_VERSION = 1;

/** Where a Monster is: waiting for its Catch to finish, or living in the Zoo. */
export type MonsterStatus = "napping" | "zoo";

/**
 * One Monster as it's saved. Plain data a server could accept later: nothing
 * in it is tied to this device except the image blob.
 */
export interface MonsterRecord {
  readonly schemaVersion: number;
  /** Stable and unique: it never changes, and no two Monsters share one. */
  readonly id: string;
  readonly name: string;
  /** The drawing trimmed to its ink, with a see-through background (a PNG). */
  readonly image: Blob;
  /** The trimmed drawing's width and height, in drawing-screen pixels: its shape. */
  readonly drawingSize: { readonly width: number; readonly height: number };
  /** 1 to 5 Googly Eyes, relative to the drawing's box (0,0 top-left, 1,1 bottom-right). */
  readonly eyes: readonly { readonly x: number; readonly y: number }[];
  readonly temperament: Temperament;
  /** Empty until Bios are written (ticket 11). */
  readonly bio: string;
  /** The name of the color it was mostly drawn in, e.g. "purple". */
  readonly mainColor: string;
  /** When the drawing was finished, as an ISO 8601 date and time. */
  readonly drawnAt: string;
  readonly status: MonsterStatus;
}

/** A whole Zoo, as Backup writes it out and Restore reads it back. */
export interface ZooBackup {
  readonly schemaVersion: number;
  readonly monsters: readonly MonsterRecord[];
}

/**
 * Where a kid's Zoo is kept. All saving goes through here: the app uses an
 * IndexedDB version on the tablet, and tests use the in-memory one below.
 */
export interface ZooStorage {
  /** Saves a Monster, replacing any saved one with the same id. */
  save(monster: MonsterRecord): Promise<void>;
  /** Every saved Monster, oldest drawing first. */
  list(): Promise<MonsterRecord[]>;
  /** Only for Say Goodbye: the one way a Monster ever leaves. */
  remove(id: string): Promise<void>;
  /** The whole Zoo, for Backup. */
  exportZoo(): Promise<ZooBackup>;
  /**
   * Restore: adds every Monster in the backup, replacing saved ones with the
   * same id. Monsters missing from the backup are kept, so a Restore never
   * loses one.
   */
  importZoo(backup: ZooBackup): Promise<void>;
}

/** Oldest drawing first; ties broken by id so the order never wobbles. */
export function byDateDrawn(a: MonsterRecord, b: MonsterRecord): number {
  return a.drawnAt < b.drawnAt ? -1 : a.drawnAt > b.drawnAt ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** A Zoo kept in memory only: for tests, and gone on reload. */
export function inMemoryZooStorage(): ZooStorage {
  const monsters = new Map<string, MonsterRecord>();
  return {
    async save(monster) {
      monsters.set(monster.id, monster);
    },
    async list() {
      return [...monsters.values()].sort(byDateDrawn);
    },
    async remove(id) {
      monsters.delete(id);
    },
    async exportZoo() {
      return { schemaVersion: MONSTER_SCHEMA_VERSION, monsters: [...monsters.values()].sort(byDateDrawn) };
    },
    async importZoo(backup) {
      for (const monster of backup.monsters) monsters.set(monster.id, monster);
    },
  };
}
