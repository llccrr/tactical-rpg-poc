import { DEFAULT_AP, DEFAULT_MOVE_RANGE } from "../config";
import type { EnemyState } from "../core/gameState";
import type { GridPos } from "../core/grid";
import { makeResistances, type Resistances } from "./elements";

/**
 * Enemy behavior archetype \u2014 drives AI decisions.
 * - melee: rushes the player to attack in close range
 * - ranged: keeps distance, attacks from afar
 * - tank: slow, high HP/def, tries to position between player and allies
 * - boss: enhanced AI \u2014 picks best spell, repositions smartly
 * - dummy: passes its turn (never moves, never attacks) \u2014 training sandbox
 */
export type EnemyBehavior = "melee" | "ranged" | "tank" | "boss" | "dummy";

/** Template definition (no position, resistances stored as a partial pour l'auteur). */
export type EnemyDef = Omit<EnemyState, "pos" | "resistances"> & {
  resistances?: Partial<Resistances>;
};

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  // \u2500\u2500 Gobelins \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  gobelin: {
    id: "gobelin",
    name: "Gobelin",
    hp: 8, maxHp: 8,
    attack: 2,
    moveRange: 4, ap: DEFAULT_AP,
    behavior: "melee",
    spells: [{ name: "Griffe", range: 1, cost: 3, damagePercent: 30, element: "neutre", damageType: "direct" }],
  },
  gobelin_chef: {
    id: "gobelin_chef",
    name: "Gobelin Chef",
    hp: 14, maxHp: 14,
    attack: 4,
    moveRange: 3, ap: DEFAULT_AP,
    behavior: "melee",
    resistances: { neutre: 0.1 },
    spells: [{ name: "Estoc", range: 1, cost: 3, damagePercent: 50, element: "neutre", damageType: "direct" }],
  },
  roi_gobelins: {
    id: "roi_gobelins",
    name: "Roi des Gobelins",
    hp: 30, maxHp: 30,
    attack: 5,
    moveRange: 3, ap: DEFAULT_AP,
    behavior: "boss",
    resistances: { neutre: 0.2 },
    spells: [
      { name: "Lame royale", range: 2, cost: 4, damagePercent: 70, element: "neutre", damageType: "direct" },
      { name: "Cri de guerre", range: 1, cost: 3, damagePercent: 40, element: "neutre", damageType: "direct" },
    ],
  },

  // \u2500\u2500 Squelettes \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  squelette: {
    id: "squelette",
    name: "Squelette",
    hp: 12, maxHp: 12,
    attack: 3,
    moveRange: DEFAULT_MOVE_RANGE, ap: DEFAULT_AP,
    behavior: "melee",
    resistances: { neutre: 0.2, feu: 0 },
    spells: [{ name: "Os tranchant", range: 1, cost: 3, damagePercent: 40, element: "neutre", damageType: "direct" }],
  },
  archer_squelette: {
    id: "archer_squelette",
    name: "Archer Squelette",
    hp: 10, maxHp: 10,
    attack: 4,
    moveRange: 3, ap: DEFAULT_AP,
    behavior: "ranged",
    resistances: { neutre: 0.1 },
    spells: [{ name: "Fleche d'os", range: 4, cost: 3, damagePercent: 30, element: "neutre", damageType: "direct" }],
  },
  liche: {
    id: "liche",
    name: "Liche",
    hp: 35, maxHp: 35,
    attack: 6,
    moveRange: 2, ap: DEFAULT_AP,
    behavior: "boss",
    resistances: { neutre: 0.3, feu: 0 },
    spells: [
      { name: "Sort de mort", range: 3, cost: 4, damagePercent: 60, element: "neutre", damageType: "direct" },
      { name: "Drain de vie", range: 2, cost: 3, damagePercent: 40, element: "neutre", damageType: "direct" },
    ],
  },

  // \u2500\u2500 Slimes \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  slime: {
    id: "slime",
    name: "Slime",
    hp: 20, maxHp: 20,
    attack: 2,
    moveRange: 2, ap: DEFAULT_AP,
    behavior: "tank",
    resistances: { eau: 0.3, terre: 0.3 },
    spells: [{ name: "Ecrasement", range: 1, cost: 3, damagePercent: 20, element: "terre", damageType: "direct" }],
  },
  slime_acide: {
    id: "slime_acide",
    name: "Slime Acide",
    hp: 15, maxHp: 15,
    attack: 4,
    moveRange: 3, ap: DEFAULT_AP,
    behavior: "ranged",
    resistances: { terre: 0.4, eau: 0.2 },
    spells: [{ name: "Jet acide", range: 3, cost: 3, damagePercent: 40, element: "terre", damageType: "direct" }],
  },
  slime_geant: {
    id: "slime_geant",
    name: "Slime Geant",
    hp: 45, maxHp: 45,
    attack: 3,
    moveRange: 2, ap: DEFAULT_AP,
    behavior: "boss",
    resistances: { eau: 0.5, terre: 0.5, neutre: 0.2 },
    spells: [
      { name: "Engloutissement", range: 1, cost: 4, damagePercent: 80, element: "terre", damageType: "direct" },
      { name: "Vague toxique", range: 2, cost: 3, damagePercent: 50, element: "terre", damageType: "direct" },
    ],
  },

  // \u2500\u2500 Demons (Tier 3) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  demon: {
    id: "demon",
    name: "D\u00e9mon",
    hp: 25, maxHp: 25,
    attack: 6,
    moveRange: 3, ap: DEFAULT_AP,
    behavior: "melee",
    resistances: { feu: 0.4, neutre: 0.2 },
    spells: [{ name: "Griffe infernale", range: 1, cost: 3, damagePercent: 60, element: "feu", damageType: "direct" }],
  },
  demon_sorcier: {
    id: "demon_sorcier",
    name: "D\u00e9mon Sorcier",
    hp: 18, maxHp: 18,
    attack: 7,
    moveRange: 3, ap: DEFAULT_AP,
    behavior: "ranged",
    resistances: { feu: 0.5, neutre: 0.1 },
    spells: [
      { name: "Boule de feu", range: 4, cost: 3, damagePercent: 50, element: "feu", damageType: "direct" },
      { name: "Eclair sombre", range: 3, cost: 2, damagePercent: 30, element: "neutre", damageType: "direct" },
    ],
  },
  demon_garde: {
    id: "demon_garde",
    name: "D\u00e9mon Garde",
    hp: 40, maxHp: 40,
    attack: 4,
    moveRange: 2, ap: DEFAULT_AP,
    behavior: "tank",
    resistances: { feu: 0.5, neutre: 0.3, terre: 0.2 },
    spells: [{ name: "Bouclier de flamme", range: 1, cost: 3, damagePercent: 40, element: "feu", damageType: "direct" }],
  },
  // \u2500\u2500 Training dummy (salle d'entra\u00eenement) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  training_dummy: {
    id: "training_dummy",
    name: "Poutch d'Entra\u00eenement",
    hp: 2000, maxHp: 2000,
    attack: 0,
    moveRange: 0, ap: 0,
    behavior: "dummy",
    spells: [],
  },

  archidemon: {
    id: "archidemon",
    name: "Archid\u00e9mon",
    hp: 60, maxHp: 60,
    attack: 8,
    moveRange: 3, ap: 8,
    behavior: "boss",
    resistances: { feu: 0.7, neutre: 0.3, terre: 0.2 },
    spells: [
      { name: "Dechainement", range: 2, cost: 4, damagePercent: 100, element: "feu", damageType: "direct" },
      { name: "Flamme noire", range: 3, cost: 3, damagePercent: 60, element: "feu", damageType: "direct" },
      { name: "Frappe sismique", range: 1, cost: 2, damagePercent: 50, element: "terre", damageType: "direct" },
    ],
  },
};

/** Instanciate an enemy from a definition at a given position */
export function makeEnemy(defId: string, pos: GridPos, instanceSuffix?: string): EnemyState {
  const def = ENEMY_DEFS[defId];
  if (!def) throw new Error(`Unknown enemy def: ${defId}`);
  const id = instanceSuffix ? `${defId}_${instanceSuffix}` : defId;
  const { resistances, ...rest } = def;
  return {
    ...rest,
    id,
    pos: { ...pos },
    resistances: makeResistances(resistances),
  };
}
