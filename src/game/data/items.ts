import type { Resistances } from "./elements";

export type ItemSlot = "arme" | "armure" | "accessoire";

export interface StatBonuses {
  attack?: number;
  hp?: number;
  /** Bonus de r\u00e9sistance par \u00e9l\u00e9ment (additionn\u00e9 aux r\u00e9sistances de base). */
  resistances?: Partial<Resistances>;
}

export interface RecipeEntry {
  resourceId: string;
  qty: number;
}

export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  slot: ItemSlot;
  tier: number;
  bonuses: StatBonuses;
  recipe: RecipeEntry[];
  description: string;
}

export const ITEMS: ItemDef[] = [
  // \u2500\u2500 Armes \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  {
    id: "lame_de_pierre",
    name: "Lame de Pierre",
    icon: "\u2694\ufe0f",
    slot: "arme",
    tier: 1,
    bonuses: { attack: 3 },
    recipe: [
      { resourceId: "pierre_brute", qty: 2 },
      { resourceId: "dent_gobelin", qty: 1 },
    ],
    description: "+3 Attaque",
  },
  {
    id: "epee_maudite",
    name: "\u00c9p\u00e9e Maudite",
    icon: "\ud83d\udde1\ufe0f",
    slot: "arme",
    tier: 2,
    bonuses: { attack: 6 },
    recipe: [
      { resourceId: "os_tranchant", qty: 2 },
      { resourceId: "gemme_maudite", qty: 1 },
    ],
    description: "+6 Attaque",
  },
  // \u2500\u2500 Armures \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  {
    id: "cape_de_spores",
    name: "Cape de Spores",
    icon: "\ud83d\udee1\ufe0f",
    slot: "armure",
    tier: 1,
    bonuses: { resistances: { terre: 0.1, neutre: 0.05 } },
    recipe: [
      { resourceId: "champignon_toxique", qty: 2 },
      { resourceId: "pierre_brute", qty: 1 },
    ],
    description: "+10% Res Terre, +5% Res Neutre",
  },
  {
    id: "armure_osseuse",
    name: "Armure Osseuse",
    icon: "\ud83e\uddb4",
    slot: "armure",
    tier: 2,
    bonuses: { hp: 5, resistances: { neutre: 0.15, terre: 0.1 } },
    recipe: [
      { resourceId: "poussiere_os", qty: 2 },
      { resourceId: "os_tranchant", qty: 1 },
    ],
    description: "+5 PV, +15% Res Neutre, +10% Res Terre",
  },
  // \u2500\u2500 Accessoires \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  {
    id: "dent_porte_bonheur",
    name: "Dent Porte-Bonheur",
    icon: "\ud83e\uddb7",
    slot: "accessoire",
    tier: 1,
    bonuses: { hp: 8 },
    recipe: [
      { resourceId: "dent_gobelin", qty: 2 },
      { resourceId: "champignon_toxique", qty: 1 },
    ],
    description: "+8 PV max",
  },
  {
    id: "noyau_energetique",
    name: "Noyau \u00c9nerg\u00e9tique",
    icon: "\u26a1",
    slot: "accessoire",
    tier: 2,
    bonuses: { attack: 2, hp: 5, resistances: { neutre: 0.1 } },
    recipe: [
      { resourceId: "noyau_slime", qty: 1 },
      { resourceId: "cristal_visqueux", qty: 2 },
    ],
    description: "+2 Attaque, +5 PV, +10% Res Neutre",
  },
  // \u2500\u2500 Tier 3 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  {
    id: "lame_demoniaque",
    name: "Lame D\u00e9moniaque",
    icon: "\ud83d\udd25",
    slot: "arme",
    tier: 3,
    bonuses: { attack: 10 },
    recipe: [
      { resourceId: "corne_demon", qty: 2 },
      { resourceId: "flamme_infernale", qty: 1 },
    ],
    description: "+10 Attaque",
  },
  {
    id: "cuirasse_infernale",
    name: "Cuirasse Infernale",
    icon: "\ud83d\udee1\ufe0f",
    slot: "armure",
    tier: 3,
    bonuses: { hp: 10, resistances: { feu: 0.3, neutre: 0.15 } },
    recipe: [
      { resourceId: "flamme_infernale", qty: 2 },
      { resourceId: "coeur_demon", qty: 1 },
    ],
    description: "+10 PV, +30% Res Feu, +15% Res Neutre",
  },
  {
    id: "pendentif_demon",
    name: "Pendentif du D\u00e9mon",
    icon: "\ud83d\udd2e",
    slot: "accessoire",
    tier: 3,
    bonuses: { attack: 4, hp: 8, resistances: { feu: 0.15, neutre: 0.1 } },
    recipe: [
      { resourceId: "coeur_demon", qty: 1 },
      { resourceId: "corne_demon", qty: 2 },
    ],
    description: "+4 Attaque, +8 PV, +15% Res Feu, +10% Res Neutre",
  },
];

export function getItemById(id: string): ItemDef | undefined {
  return ITEMS.find((i) => i.id === id);
}
