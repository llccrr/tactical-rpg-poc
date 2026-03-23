export type ItemSlot = "arme" | "armure" | "accessoire";

export interface StatBonuses {
  attack?: number;
  defense?: number;
  hp?: number;
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
  // ── Armes ────────────────────────────────────────────────────
  {
    id: "lame_de_pierre",
    name: "Lame de Pierre",
    icon: "⚔️",
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
    name: "Épée Maudite",
    icon: "🗡️",
    slot: "arme",
    tier: 2,
    bonuses: { attack: 6 },
    recipe: [
      { resourceId: "os_tranchant", qty: 2 },
      { resourceId: "gemme_maudite", qty: 1 },
    ],
    description: "+6 Attaque",
  },
  // ── Armures ───────────────────────────────────────────────────
  {
    id: "cape_de_spores",
    name: "Cape de Spores",
    icon: "🛡️",
    slot: "armure",
    tier: 1,
    bonuses: { defense: 2 },
    recipe: [
      { resourceId: "champignon_toxique", qty: 2 },
      { resourceId: "pierre_brute", qty: 1 },
    ],
    description: "+2 Défense",
  },
  {
    id: "armure_osseuse",
    name: "Armure Osseuse",
    icon: "🦴",
    slot: "armure",
    tier: 2,
    bonuses: { defense: 4, hp: 5 },
    recipe: [
      { resourceId: "poussiere_os", qty: 2 },
      { resourceId: "os_tranchant", qty: 1 },
    ],
    description: "+4 Défense, +5 PV",
  },
  // ── Accessoires ───────────────────────────────────────────────
  {
    id: "dent_porte_bonheur",
    name: "Dent Porte-Bonheur",
    icon: "🦷",
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
    name: "Noyau Énergétique",
    icon: "⚡",
    slot: "accessoire",
    tier: 2,
    bonuses: { attack: 2, defense: 2, hp: 5 },
    recipe: [
      { resourceId: "noyau_slime", qty: 1 },
      { resourceId: "cristal_visqueux", qty: 2 },
    ],
    description: "+2 Attaque, +2 Défense, +5 PV",
  },
  // ── Tier 3 ──────────────────────────────────────────────────
  {
    id: "lame_demoniaque",
    name: "Lame Démoniaque",
    icon: "🔥",
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
    icon: "🛡️",
    slot: "armure",
    tier: 3,
    bonuses: { defense: 6, hp: 10 },
    recipe: [
      { resourceId: "flamme_infernale", qty: 2 },
      { resourceId: "coeur_demon", qty: 1 },
    ],
    description: "+6 Défense, +10 PV",
  },
  {
    id: "pendentif_demon",
    name: "Pendentif du Démon",
    icon: "🔮",
    slot: "accessoire",
    tier: 3,
    bonuses: { attack: 4, defense: 3, hp: 8 },
    recipe: [
      { resourceId: "coeur_demon", qty: 1 },
      { resourceId: "corne_demon", qty: 2 },
    ],
    description: "+4 Attaque, +3 Défense, +8 PV",
  },
];

export function getItemById(id: string): ItemDef | undefined {
  return ITEMS.find((i) => i.id === id);
}
