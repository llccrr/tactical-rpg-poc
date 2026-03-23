import { DEFAULT_AP, DEFAULT_MOVE_RANGE } from "../config";
import type { EnemyState } from "../core/gameState";
import type { GridPos } from "../core/grid";

/**
 * Enemy behavior archetype — drives AI decisions.
 * - melee: rushes the player to attack in close range
 * - ranged: keeps distance, attacks from afar
 * - tank: slow, high HP/def, tries to position between player and allies
 * - boss: enhanced AI — picks best spell, repositions smartly
 */
export type EnemyBehavior = "melee" | "ranged" | "tank" | "boss";

/** Template definition (no position) */
export type EnemyDef = Omit<EnemyState, "pos">;

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  // ── Gobelins ────────────────────────────────────────────────
  gobelin: {
    id: "gobelin",
    name: "Gobelin",
    hp: 8, maxHp: 8,
    attack: 2, defense: 0,
    moveRange: 4, ap: DEFAULT_AP,
    behavior: "melee",
    spells: [{ name: "Griffe", range: 1, cost: 3, baseDamage: 3 }],
  },
  gobelin_chef: {
    id: "gobelin_chef",
    name: "Gobelin Chef",
    hp: 14, maxHp: 14,
    attack: 4, defense: 1,
    moveRange: 3, ap: DEFAULT_AP,
    behavior: "melee",
    spells: [{ name: "Estoc", range: 1, cost: 3, baseDamage: 5 }],
  },
  roi_gobelins: {
    id: "roi_gobelins",
    name: "Roi des Gobelins",
    hp: 30, maxHp: 30,
    attack: 5, defense: 2,
    moveRange: 3, ap: DEFAULT_AP,
    behavior: "boss",
    spells: [
      { name: "Lame royale", range: 2, cost: 4, baseDamage: 7 },
      { name: "Cri de guerre", range: 1, cost: 3, baseDamage: 4 },
    ],
  },

  // ── Squelettes ──────────────────────────────────────────────
  squelette: {
    id: "squelette",
    name: "Squelette",
    hp: 12, maxHp: 12,
    attack: 3, defense: 1,
    moveRange: DEFAULT_MOVE_RANGE, ap: DEFAULT_AP,
    behavior: "melee",
    spells: [{ name: "Os tranchant", range: 1, cost: 3, baseDamage: 4 }],
  },
  archer_squelette: {
    id: "archer_squelette",
    name: "Archer Squelette",
    hp: 10, maxHp: 10,
    attack: 4, defense: 0,
    moveRange: 3, ap: DEFAULT_AP,
    behavior: "ranged",
    spells: [{ name: "Fleche d'os", range: 4, cost: 3, baseDamage: 3 }],
  },
  liche: {
    id: "liche",
    name: "Liche",
    hp: 35, maxHp: 35,
    attack: 6, defense: 2,
    moveRange: 2, ap: DEFAULT_AP,
    behavior: "boss",
    spells: [
      { name: "Sort de mort", range: 3, cost: 4, baseDamage: 6 },
      { name: "Drain de vie", range: 2, cost: 3, baseDamage: 4 },
    ],
  },

  // ── Slimes ──────────────────────────────────────────────────
  slime: {
    id: "slime",
    name: "Slime",
    hp: 20, maxHp: 20,
    attack: 2, defense: 3,
    moveRange: 2, ap: DEFAULT_AP,
    behavior: "tank",
    spells: [{ name: "Ecrasement", range: 1, cost: 3, baseDamage: 2 }],
  },
  slime_acide: {
    id: "slime_acide",
    name: "Slime Acide",
    hp: 15, maxHp: 15,
    attack: 4, defense: 1,
    moveRange: 3, ap: DEFAULT_AP,
    behavior: "ranged",
    spells: [{ name: "Jet acide", range: 3, cost: 3, baseDamage: 4 }],
  },
  slime_geant: {
    id: "slime_geant",
    name: "Slime Geant",
    hp: 45, maxHp: 45,
    attack: 3, defense: 5,
    moveRange: 2, ap: DEFAULT_AP,
    behavior: "boss",
    spells: [
      { name: "Engloutissement", range: 1, cost: 4, baseDamage: 8 },
      { name: "Vague toxique", range: 2, cost: 3, baseDamage: 5 },
    ],
  },

  // ── Demons (Tier 3) ────────────────────────────────────────
  demon: {
    id: "demon",
    name: "Démon",
    hp: 25, maxHp: 25,
    attack: 6, defense: 2,
    moveRange: 3, ap: DEFAULT_AP,
    behavior: "melee",
    spells: [{ name: "Griffe infernale", range: 1, cost: 3, baseDamage: 6 }],
  },
  demon_sorcier: {
    id: "demon_sorcier",
    name: "Démon Sorcier",
    hp: 18, maxHp: 18,
    attack: 7, defense: 1,
    moveRange: 3, ap: DEFAULT_AP,
    behavior: "ranged",
    spells: [
      { name: "Boule de feu", range: 4, cost: 3, baseDamage: 5 },
      { name: "Eclair sombre", range: 3, cost: 2, baseDamage: 3 },
    ],
  },
  demon_garde: {
    id: "demon_garde",
    name: "Démon Garde",
    hp: 40, maxHp: 40,
    attack: 4, defense: 5,
    moveRange: 2, ap: DEFAULT_AP,
    behavior: "tank",
    spells: [{ name: "Bouclier de flamme", range: 1, cost: 3, baseDamage: 4 }],
  },
  archidemon: {
    id: "archidemon",
    name: "Archidémon",
    hp: 60, maxHp: 60,
    attack: 8, defense: 4,
    moveRange: 3, ap: 8,
    behavior: "boss",
    spells: [
      { name: "Dechaînement", range: 2, cost: 4, baseDamage: 10 },
      { name: "Flamme noire", range: 3, cost: 3, baseDamage: 6 },
      { name: "Frappe sismique", range: 1, cost: 2, baseDamage: 5 },
    ],
  },
};

/** Instanciate an enemy from a definition at a given position */
export function makeEnemy(defId: string, pos: GridPos, instanceSuffix?: string): EnemyState {
  const def = ENEMY_DEFS[defId];
  if (!def) throw new Error(`Unknown enemy def: ${defId}`);
  const id = instanceSuffix ? `${defId}_${instanceSuffix}` : defId;
  return { ...def, id, pos: { ...pos } };
}
