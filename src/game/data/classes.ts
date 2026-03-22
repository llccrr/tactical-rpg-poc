import type { Spell } from "../core/gameState";

export interface ClassDefinition {
  id: string;
  name: string;
  description: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  basePm: number;
  basePa: number;
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
    baseDefense: 3,
    basePm: 3,
    basePa: 6,
    spells: [
      { name: "Taillade", range: 1, cost: 2, baseDamage: 3 },
      { name: "Lame Ardente", range: 1, cost: 3, baseDamage: 6 },
      { name: "Charge", range: 3, cost: 4, baseDamage: 5 },
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
    baseDefense: 1,
    basePm: 4,
    basePa: 6,
    spells: [
      { name: "Tir Percant", range: 6, cost: 3, baseDamage: 3 },
      { name: "Fleche Explosive", range: 5, cost: 4, baseDamage: 5 },
      { name: "Salve", range: 4, cost: 2, baseDamage: 2 },
    ],
    color: "#44aa88",
  },
];

export function getClassById(id: string): ClassDefinition | undefined {
  return CLASSES.find((c) => c.id === id);
}
