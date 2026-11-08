import { TEMPERAMENTS } from "../core/temperaments";
import { MONSTER_SCHEMA_VERSION, type MonsterRecord, type ZooStorage } from "../core/zooStorage";

/**
 * Dev only, for playtesting a full Zoo without drawing every Monster:
 * open the dev server with `?placeholders=10` to put 10 placeholder
 * Monsters in the Zoo. Running it again with the same number doesn't add
 * more; `?placeholders=0` takes them all away. Monsters you drew yourself
 * are never touched.
 */
export async function seedPlaceholders(storage: ZooStorage, wanted: number): Promise<void> {
  const existing = (await storage.list()).filter((m) => m.id.startsWith(ID_PREFIX));
  for (const m of existing) if (number(m) > wanted) await storage.remove(m.id);
  const have = new Set(existing.map(number));
  for (let n = 1; n <= wanted; n++) if (!have.has(n)) await storage.save(await placeholder(n));
}

const ID_PREFIX = "placeholder-";
const number = (m: MonsterRecord) => Number(m.id.slice(ID_PREFIX.length));
const COLORS = [
  { name: "red", css: "#e74c3c" },
  { name: "blue", css: "#3498db" },
  { name: "purple", css: "#9b59b6" },
  { name: "green", css: "#2ecc71" },
  { name: "orange", css: "#f39c12" },
];

/** A blob with its number on it, so you can tell placeholders apart. */
async function placeholder(n: number): Promise<MonsterRecord> {
  const color = COLORS[n % COLORS.length];
  const temperament = TEMPERAMENTS[n % TEMPERAMENTS.length].id;
  const canvas = new OffscreenCanvas(200, 200);
  const g = canvas.getContext("2d")!;
  g.fillStyle = color.css;
  g.beginPath();
  g.ellipse(100, 105, 90, 85, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#ffffff";
  g.font = "bold 64px sans-serif";
  g.textAlign = "center";
  g.fillText(String(n), 100, 140);
  return {
    schemaVersion: MONSTER_SCHEMA_VERSION,
    id: `${ID_PREFIX}${n}`,
    name: `Placeholder ${n}`,
    image: await canvas.convertToBlob({ type: "image/png" }),
    drawingSize: { width: 200, height: 200 },
    eyes: [{ x: 0.5, y: 0.3 }],
    temperament,
    bio: `Placeholder ${n} is a stand-in ${temperament} blob, here to fill up the Zoo for testing.`,
    mainColor: color.name,
    // Drawn long ago, so they come before the kid's own Monsters.
    drawnAt: new Date(Date.UTC(2000, 0, 1, 0, n)).toISOString(),
    status: "zoo",
  };
}
