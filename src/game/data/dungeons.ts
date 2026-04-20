import type { GridPos } from "../core/grid";

export interface RoomDef {
  enemies: Array<{ defId: string; pos: GridPos }>;
}

export interface LootEntry {
  resourceId: string;
  weight: number; // relative weight — higher = more likely
}

export type Biome = "grass" | "crypt" | "swamp" | "fortress";

export interface DungeonDef {
  id: string;
  name: string;
  description: string;
  tier: number;
  biome: Biome;
  rooms: RoomDef[];
  lootTable: LootEntry[];
  /** Training sandbox: no loot, no completion tracking. */
  isTraining?: boolean;
}

export const DUNGEONS: DungeonDef[] = [
  {
    id: "salle_entrainement",
    name: "Salle d'Entra\u00eenement",
    description: "Un poutch inerte avec 2000 PV qui passe son tour. Parfait pour tester tes sorts et ta classe.",
    tier: 1,
    biome: "grass",
    isTraining: true,
    rooms: [
      {
        enemies: [
          { defId: "training_dummy", pos: { x: 7, y: 4 } },
        ],
      },
    ],
    lootTable: [],
  },
  {
    id: "caverne_gobelins",
    name: "Caverne des Gobelins",
    description: "Une caverne humide infestee de gobelins. L'odeur de rouille et de sueur emplit l'air.",
    tier: 1,
    biome: "grass",
    rooms: [
      {
        enemies: [
          { defId: "gobelin", pos: { x: 7, y: 2 } },
          { defId: "gobelin", pos: { x: 2, y: 1 } },
        ],
      },
      {
        enemies: [
          { defId: "gobelin", pos: { x: 7, y: 2 } },
          { defId: "gobelin", pos: { x: 2, y: 1 } },
          { defId: "gobelin_chef", pos: { x: 5, y: 1 } },
        ],
      },
      {
        enemies: [
          { defId: "roi_gobelins", pos: { x: 5, y: 2 } },
          { defId: "gobelin", pos: { x: 8, y: 3 } },
        ],
      },
    ],
    lootTable: [
      { resourceId: "pierre_brute", weight: 5 },
      { resourceId: "dent_gobelin", weight: 3 },
      { resourceId: "champignon_toxique", weight: 2 },
    ],
  },
  {
    id: "crypte_squelettes",
    name: "Crypte des Squelettes",
    description: "Une crypte ancienne ou des squelettes errent sans repos. L'air sent la poussiere et la mort.",
    tier: 1,
    biome: "crypt",
    rooms: [
      {
        enemies: [
          { defId: "squelette", pos: { x: 7, y: 2 } },
          { defId: "squelette", pos: { x: 2, y: 1 } },
        ],
      },
      {
        enemies: [
          { defId: "squelette", pos: { x: 7, y: 2 } },
          { defId: "squelette", pos: { x: 2, y: 1 } },
          { defId: "archer_squelette", pos: { x: 5, y: 1 } },
        ],
      },
      {
        enemies: [
          { defId: "liche", pos: { x: 5, y: 2 } },
          { defId: "squelette", pos: { x: 8, y: 3 } },
        ],
      },
    ],
    lootTable: [
      { resourceId: "os_tranchant", weight: 5 },
      { resourceId: "poussiere_os", weight: 3 },
      { resourceId: "gemme_maudite", weight: 2 },
    ],
  },
  {
    id: "marais_slime",
    name: "Marais du Slime",
    description: "Un marecage visqueux peuple de slimes en tout genre. Chaque pas colle davantage.",
    tier: 2,
    biome: "swamp",
    rooms: [
      {
        enemies: [
          { defId: "slime", pos: { x: 7, y: 2 } },
          { defId: "slime", pos: { x: 2, y: 1 } },
        ],
      },
      {
        enemies: [
          { defId: "slime", pos: { x: 7, y: 2 } },
          { defId: "slime_acide", pos: { x: 2, y: 1 } },
          { defId: "slime", pos: { x: 8, y: 7 } },
        ],
      },
      {
        enemies: [
          { defId: "slime_geant", pos: { x: 5, y: 2 } },
          { defId: "slime_acide", pos: { x: 8, y: 3 } },
        ],
      },
    ],
    lootTable: [
      { resourceId: "glu_slime", weight: 5 },
      { resourceId: "cristal_visqueux", weight: 3 },
      { resourceId: "noyau_slime", weight: 2 },
    ],
  },
  {
    id: "forteresse_demoniaque",
    name: "Forteresse Demoniaque",
    description: "Une forteresse de basalte baignee de flammes. Les demons y regnent en maitres absolus.",
    tier: 3,
    biome: "fortress",
    rooms: [
      {
        enemies: [
          { defId: "demon", pos: { x: 7, y: 2 } },
          { defId: "demon", pos: { x: 2, y: 1 } },
          { defId: "demon_sorcier", pos: { x: 5, y: 1 } },
        ],
      },
      {
        enemies: [
          { defId: "demon_garde", pos: { x: 4, y: 2 } },
          { defId: "demon_sorcier", pos: { x: 8, y: 1 } },
          { defId: "demon", pos: { x: 7, y: 4 } },
        ],
      },
      {
        enemies: [
          { defId: "demon_garde", pos: { x: 3, y: 2 } },
          { defId: "demon", pos: { x: 7, y: 3 } },
          { defId: "demon_sorcier", pos: { x: 8, y: 1 } },
          { defId: "demon", pos: { x: 1, y: 4 } },
        ],
      },
      {
        enemies: [
          { defId: "archidemon", pos: { x: 5, y: 2 } },
          { defId: "demon_garde", pos: { x: 3, y: 3 } },
          { defId: "demon_sorcier", pos: { x: 7, y: 1 } },
        ],
      },
    ],
    lootTable: [
      { resourceId: "corne_demon", weight: 5 },
      { resourceId: "flamme_infernale", weight: 3 },
      { resourceId: "coeur_demon", weight: 2 },
    ],
  },
];

export function getDungeonById(id: string): DungeonDef | undefined {
  return DUNGEONS.find((d) => d.id === id);
}

/** Weighted random draw from a loot table */
export function rollLoot(lootTable: LootEntry[]): string {
  const total = lootTable.reduce((sum, e) => sum + e.weight, 0);
  let rand = Math.random() * total;
  for (const entry of lootTable) {
    rand -= entry.weight;
    if (rand <= 0) return entry.resourceId;
  }
  return lootTable[lootTable.length - 1].resourceId;
}
