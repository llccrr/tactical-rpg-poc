import type { Spell } from "../core/gameState";
import type { Resistances } from "./elements";

export interface ClassDefinition {
  id: string;
  name: string;
  description: string;
  baseHp: number;
  baseAttack: number;
  /** R\u00e9sistances natives de la classe (facultatif, 0 sinon). */
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
}

export const CLASSES: ClassDefinition[] = [
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
      { name: "Taillade", range: 1, cost: 1, damagePercent: 30, element: "neutre", damageType: "direct" },
      { name: "Lame Ardente", range: 1, cost: 1, damagePercent: 60, element: "feu", damageType: "direct" },
      { name: "Charge", range: 3, cost: 1, damagePercent: 50, element: "neutre", damageType: "direct" },
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
      { name: "Tir Percant", range: 6, cost: 1, damagePercent: 30, element: "neutre", damageType: "direct" },
      { name: "Fleche Explosive", range: 5, cost: 1, damagePercent: 50, element: "feu", damageType: "direct" },
      { name: "Salve", range: 4, cost: 1, damagePercent: 20, element: "neutre", damageType: "direct" },
    ],
    color: "#44aa88",
  },
];

export function getClassById(id: string): ClassDefinition | undefined {
  return CLASSES.find((c) => c.id === id);
}
