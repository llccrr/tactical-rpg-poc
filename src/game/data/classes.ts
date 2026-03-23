import type { Spell } from "../core/gameState";
import { getImplementedSpells } from "../core/ioplike";

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

/** Rich tooltip descriptions for implemented IopLike spells */
const SPELL_TOOLTIPS: Record<string, string> = {
  jabs:
    "Jabs — 3 PA | Mêlée | Air\n" +
    "Dégâts : 6 | Portée : 1\n" +
    "Génère +20 Concentration.\n" +
    "Utilisable dans le Combo PA (coût 3 PA).",
  rafale:
    "Rafale — 1 PA | Air\n" +
    "Dégâts : 2 | Portée : 1-2\n" +
    "Attire la cible de 1 case vers vous.\n" +
    "Utilisable dans le Combo PA (coût 1 PA).",
  ebranler:
    "Ébranler — 2 PA | Terre\n" +
    "Dégâts : 3 | Portée : 1-3\n" +
    "Applique Ébranlé (pertes d'armure augmentées, 1 tour).",
  fulgur:
    "Fulgur — 3 PA | Feu\n" +
    "Dégâts : 7 | Portée : 1-2\n" +
    "Gros dégâts mono-cible feu.\n" +
    "Génère +10 Concentration.\n" +
    "Utilisable dans le Combo PA (coût 3 PA).",
  super_iop_punch:
    "Super Iop Punch — 4 PA | Feu\n" +
    "Dégâts : 10 | Portée : 1-2\n" +
    "Très gros dégâts. Consomme Courroux (+50%/stack).\n" +
    "Si la cible meurt : +2 PA, +20 Concentration.",
  uppercut:
    "Uppercut — 1 Point de sang\n" +
    "Dégâts : 1 | Portée : 1\n" +
    "Sort utilitaire de combo.\n" +
    "Ouvre ou termine les séquences de combo.\n" +
    "Combo PA : Uppercut → 3PA → Uppercut → 1PA",
  jump:
    "Jump — 4 PA | Mobilité\n" +
    "Portée : 1-5\n" +
    "Téléporte sur une case libre.\n" +
    "Aucun dégât, pur déplacement.",
};

/** Convert IopLike SpellDefinitions to the simple Spell format used by the HUD/targeting */
function buildIopLikeSpells(): Spell[] {
  return getImplementedSpells().map((def) => ({
    name: def.name,
    range: def.rangeMax,
    cost: def.apCost,
    baseDamage: def.effect.baseDamage,
    rangeMin: def.rangeMin,
    bloodPointCost: def.bloodPointCost > 0 ? def.bloodPointCost : undefined,
    mpCost: def.mpCost > 0 ? def.mpCost : undefined,
    element: def.element,
    tags: def.tags,
    spellDefId: def.id,
    description: SPELL_TOOLTIPS[def.id] ?? def.description,
  }));
}

export const CLASSES: ClassDefinition[] = [
  {
    id: "ioplike",
    name: "IopLike",
    description:
      "Guerrier inspiré du Iop de Wakfu. Maîtrise la Concentration, le Courroux et les combos dévastateurs.",
    baseHp: 40,
    baseAttack: 5,
    baseDefense: 3,
    basePm: 3,
    basePa: 6,
    spells: buildIopLikeSpells(),
    color: "#ee5533",
  },
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
