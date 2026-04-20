import type { Spell } from "../core/gameState";
import type { Resistances } from "./elements";

export interface ClassDefinition {
  id: string;
  name: string;
  description: string;
  baseHp: number;
  baseAttack: number;
  /** Résistances natives de la classe (facultatif, 0 sinon). */
  resistances?: Partial<Resistances>;
  /** PP gained per turn (spec : 4) */
  basePm: number;
  /** PA gained per turn (spec : 1) */
  basePa: number;
  /** PF gained per turn (spec : 1) */
  basePf: number;
  /** PS cap (spec : 10) */
  basePsMax: number;
  spells: Spell[];
  color: string;
  /** La classe possède le passif Rage (actif uniquement sur Barbare). */
  hasRagePassive?: boolean;
}

/**
 * Spec Barbare (ticket Classe Barbare — passif Rage + 10 sorts complets).
 * PM = 3 (CAC agressif mais limité), PA/PF = 1, PS cap = 10 (spec globale).
 * baseHp = 40 pour tenir face aux sacrifices (Sacrifice de Chair / Surmenage).
 */
const BARBARE_SPELLS: Spell[] = [
  {
    id: "frappe_brutale",
    name: "Frappe Brutale",
    range: 1,
    cost: 1,
    pfCost: 1,
    damagePercent: 150,
    element: "neutre",
    damageType: "direct",
    description: "150% dégâts d'arme — ouvrant standard.\nBénéficie de Rage, Frénésie et Surmenage.",
    cooldown: 0,
    targetMode: "enemy",
  },
  {
    id: "coup_gratuit",
    name: "Coup Gratuit",
    range: 1,
    cost: 0,
    damagePercent: 10,
    element: "neutre",
    damageType: "direct",
    description: "Sans coût. 1x / tour. Pique gratuit qui génère PS et active Rage.",
    cooldown: 0,
    usesPerTurn: 1,
    targetMode: "enemy",
  },
  {
    id: "entaille",
    name: "Entaille",
    range: 1,
    cost: 1,
    damagePercent: 70,
    element: "terre",
    damageType: "direct",
    description: "70% arme + 3 stacks de Poison (Terre) sur la cible.",
    cooldown: 1,
    targetMode: "enemy",
    applyStacks: { element: "terre", count: 3 },
  },
  {
    id: "sacrifice_de_chair",
    name: "Sacrifice de Chair",
    range: 0,
    cost: 0,
    pfCost: 1,
    damagePercent: 0,
    element: "neutre",
    damageType: "indirect",
    description: "Sacrifie 20% des HP actuels, gagne +2 PP immédiatement.",
    cooldown: 1,
    targetMode: "self",
    selfHarmPercent: 20,
    gainsPm: 2,
  },
  {
    id: "surmenage",
    name: "Surmenage",
    range: 0,
    cost: 0,
    pfCost: 1,
    damagePercent: 0,
    element: "neutre",
    damageType: "indirect",
    description: "Sacrifie 20% des HP actuels, +20 dégâts finaux plats sur la prochaine attaque.",
    cooldown: 2,
    targetMode: "self",
    selfHarmPercent: 20,
    nextAttackFlat: 20,
  },
  {
    id: "frenesie",
    name: "Frénésie",
    range: 0,
    cost: 0,
    pfCost: 1,
    psCost: 2,
    damagePercent: 0,
    element: "neutre",
    damageType: "indirect",
    description: "Active Rage immédiatement + +20% dégâts finaux sur la prochaine attaque.",
    cooldown: 2,
    targetMode: "self",
    activatesRage: true,
    nextAttackPercent: 20,
  },
  {
    id: "charge",
    name: "Charge",
    range: 6,
    cost: 1,
    ppCost: 2,
    damagePercent: 100,
    element: "neutre",
    damageType: "direct",
    description: "Se déplace en ligne droite jusqu'à la cible. 100% arme + 20% par case traversée.",
    cooldown: 2,
    targetMode: "line-charge",
    distanceBonusPercent: 20,
  },
  {
    id: "intimidation",
    name: "Intimidation",
    range: 1,
    cost: 1,
    damagePercent: 50,
    element: "neutre",
    damageType: "direct",
    description: "50% arme + pousse la cible de 2 cases.",
    cooldown: 1,
    targetMode: "enemy",
    pushDistance: 2,
  },
  {
    id: "execution",
    name: "Exécution",
    range: 1,
    cost: 1,
    psCost: 5,
    damagePercent: 150,
    element: "neutre",
    damageType: "direct",
    description: "150% arme. Dégâts massivement bonifiés sur cible basse HP.",
    cooldown: 2,
    targetMode: "enemy",
    executionBonus: true,
  },
  {
    id: "resistance_brutale",
    name: "Résistance Brutale",
    range: 0,
    cost: 0,
    pfCost: 1,
    damagePercent: 0,
    element: "neutre",
    damageType: "indirect",
    description: "+20% résistances (tous éléments) pendant 1 tour.",
    cooldown: 3,
    targetMode: "self",
    resistBuffPercent: 20,
    resistBuffTurns: 1,
  },
];

export const CLASSES: ClassDefinition[] = [
  {
    id: "barbare",
    name: "Barbare",
    description:
      "Bruiser / DPS mêlée. Jeu agressif basé sur le tempo : sacrifie ses PV pour la puissance, maintient la Rage, enchaîne les bursts.",
    baseHp: 40,
    baseAttack: 0,
    basePm: 3,
    basePa: 1,
    basePf: 1,
    basePsMax: 10,
    hasRagePassive: true,
    spells: BARBARE_SPELLS,
    color: "#c0392b",
  },
  {
    id: "bretteur",
    name: "Bretteur",
    description:
      "Guerrier au corps-a-corps, devastateur en melee. Ses lames tranchent sans pitie ceux qui osent l'approcher.",
    baseHp: 35,
    baseAttack: 6,
    basePm: 4,
    basePa: 1,
    basePf: 1,
    basePsMax: 10,
    spells: [
      { id: "bretteur_taillade", name: "Taillade", range: 1, cost: 1, damagePercent: 30, element: "neutre", damageType: "direct", targetMode: "enemy" },
      { id: "bretteur_lame", name: "Lame Ardente", range: 1, cost: 1, damagePercent: 60, element: "feu", damageType: "direct", targetMode: "enemy" },
      { id: "bretteur_charge", name: "Charge", range: 3, cost: 1, damagePercent: 50, element: "neutre", damageType: "direct", targetMode: "enemy" },
    ],
    color: "#ee5533",
  },
  {
    id: "sentinelle",
    name: "Sentinelle",
    description:
      "Tireur d'elite a longue portee, precis et mobile. Garde ses distances pour mieux frapper.",
    baseHp: 22,
    baseAttack: 4,
    basePm: 4,
    basePa: 1,
    basePf: 1,
    basePsMax: 10,
    spells: [
      { id: "sentinelle_tir", name: "Tir Percant", range: 6, cost: 1, damagePercent: 30, element: "neutre", damageType: "direct", targetMode: "enemy" },
      { id: "sentinelle_fleche", name: "Fleche Explosive", range: 5, cost: 1, damagePercent: 50, element: "feu", damageType: "direct", targetMode: "enemy" },
      { id: "sentinelle_salve", name: "Salve", range: 4, cost: 1, damagePercent: 20, element: "neutre", damageType: "direct", targetMode: "enemy" },
    ],
    color: "#44aa88",
  },
];

export function getClassById(id: string): ClassDefinition | undefined {
  return CLASSES.find((c) => c.id === id);
}
