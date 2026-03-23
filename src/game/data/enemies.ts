import { DEFAULT_AP, DEFAULT_MOVE_RANGE } from "../config";
import type { EnemyState } from "../core/gameState";
import type { GridPos } from "../core/grid";

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
    spells: [{ name: "Griffe", range: 1, cost: 3, baseDamage: 3 }],
  },
  gobelin_chef: {
    id: "gobelin_chef",
    name: "Gobelin Chef",
    hp: 14, maxHp: 14,
    attack: 4, defense: 1,
    moveRange: 3, ap: DEFAULT_AP,
    spells: [{ name: "Estoc", range: 1, cost: 3, baseDamage: 5 }],
  },
  roi_gobelins: {
    id: "roi_gobelins",
    name: "Roi des Gobelins",
    hp: 30, maxHp: 30,
    attack: 5, defense: 2,
    moveRange: 3, ap: DEFAULT_AP,
    spells: [{ name: "Lame royale", range: 2, cost: 4, baseDamage: 7 }],
  },

  // ── Squelettes ──────────────────────────────────────────────
  squelette: {
    id: "squelette",
    name: "Squelette",
    hp: 12, maxHp: 12,
    attack: 3, defense: 1,
    moveRange: DEFAULT_MOVE_RANGE, ap: DEFAULT_AP,
    spells: [{ name: "Os tranchant", range: 1, cost: 3, baseDamage: 4 }],
  },
  archer_squelette: {
    id: "archer_squelette",
    name: "Archer Squelette",
    hp: 10, maxHp: 10,
    attack: 4, defense: 0,
    moveRange: 3, ap: DEFAULT_AP,
    spells: [{ name: "Fleche d'os", range: 4, cost: 3, baseDamage: 3 }],
  },
  liche: {
    id: "liche",
    name: "Liche",
    hp: 35, maxHp: 35,
    attack: 6, defense: 2,
    moveRange: 2, ap: DEFAULT_AP,
    spells: [{ name: "Sort de mort", range: 3, cost: 4, baseDamage: 6 }],
  },

  // ── Slimes ──────────────────────────────────────────────────
  slime: {
    id: "slime",
    name: "Slime",
    hp: 20, maxHp: 20,
    attack: 2, defense: 3,
    moveRange: 2, ap: DEFAULT_AP,
    spells: [{ name: "Ecrasement", range: 1, cost: 3, baseDamage: 2 }],
  },
  slime_acide: {
    id: "slime_acide",
    name: "Slime Acide",
    hp: 15, maxHp: 15,
    attack: 4, defense: 1,
    moveRange: 3, ap: DEFAULT_AP,
    spells: [{ name: "Jet acide", range: 3, cost: 3, baseDamage: 4 }],
  },
  slime_geant: {
    id: "slime_geant",
    name: "Slime Geant",
    hp: 45, maxHp: 45,
    attack: 3, defense: 5,
    moveRange: 2, ap: DEFAULT_AP,
    spells: [{ name: "Engloutissement", range: 1, cost: 4, baseDamage: 8 }],
  },
};

/** Instanciate an enemy from a definition at a given position */
export function makeEnemy(defId: string, pos: GridPos, instanceSuffix?: string): EnemyState {
  const def = ENEMY_DEFS[defId];
  if (!def) throw new Error(`Unknown enemy def: ${defId}`);
  const id = instanceSuffix ? `${defId}_${instanceSuffix}` : defId;
  return { ...def, id, pos: { ...pos } };
}
