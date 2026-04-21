/**
 * Types de ressources pour le craft d'armes (cf. INFO EDOUARD JEU).
 * Le type détermine l'effet de l'arme craftée ; le tier détermine
 * la puissance (dégâts + intensité de l'effet).
 */
export type ResourceType = "minerai" | "bois" | "cuir" | "gemme";

export const RESOURCE_TYPES: readonly ResourceType[] = [
  "minerai",
  "bois",
  "cuir",
  "gemme",
];

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  minerai: "Minerai",
  bois: "Bois",
  cuir: "Cuir",
  gemme: "Gemme",
};

export const RESOURCE_TYPE_ICONS: Record<ResourceType, string> = {
  minerai: "⛏️",
  bois: "🪵",
  cuir: "🧶",
  gemme: "💎",
};

export const RESOURCE_TYPE_COLORS: Record<ResourceType, string> = {
  minerai: "#a1a1aa",
  bois: "#a16207",
  cuir: "#d97706",
  gemme: "#c084fc",
};

export interface ResourceDef {
  id: string;
  name: string;
  icon: string;
  type: ResourceType;
  tier: 1 | 2 | 3;
}

/**
 * Mapping type + tier :
 *   MINERAI : pierre_brute (T1) → poussiere_os (T2) → corne_demon (T3)
 *   BOIS    : champignon_toxique (T1) → glu_slime (T2) → coeur_demon (T3)
 *   CUIR    : dent_gobelin (T1) → os_tranchant (T2) → noyau_slime (T3)
 *   GEMME   : gemme_maudite (T1) → cristal_visqueux (T2) → flamme_infernale (T3)
 */
export const RESOURCES: ResourceDef[] = [
  // Donjon 1 : Caverne des Gobelins (biome grass)
  { id: "pierre_brute", name: "Pierre brute", icon: "🪨", type: "minerai", tier: 1 },
  { id: "dent_gobelin", name: "Dent de Gobelin", icon: "🦷", type: "cuir", tier: 1 },
  { id: "champignon_toxique", name: "Champignon toxique", icon: "🍄", type: "bois", tier: 1 },
  // Donjon 2 : Crypte des Squelettes
  { id: "os_tranchant", name: "Os tranchant", icon: "🦴", type: "cuir", tier: 2 },
  { id: "poussiere_os", name: "Poussiere d'os", icon: "💀", type: "minerai", tier: 2 },
  { id: "gemme_maudite", name: "Gemme maudite", icon: "💎", type: "gemme", tier: 1 },
  // Donjon 3 : Marais du Slime
  { id: "glu_slime", name: "Glu de Slime", icon: "💧", type: "bois", tier: 2 },
  { id: "cristal_visqueux", name: "Cristal visqueux", icon: "🔮", type: "gemme", tier: 2 },
  { id: "noyau_slime", name: "Noyau de Slime", icon: "⚡", type: "cuir", tier: 3 },
  // Donjon 4 : Forteresse Demoniaque
  { id: "corne_demon", name: "Corne de Demon", icon: "🐏", type: "minerai", tier: 3 },
  { id: "flamme_infernale", name: "Flamme infernale", icon: "🔥", type: "gemme", tier: 3 },
  { id: "coeur_demon", name: "Coeur de Demon", icon: "♥️", type: "bois", tier: 3 },
];

export function getResourceById(id: string): ResourceDef | undefined {
  return RESOURCES.find((r) => r.id === id);
}

/** Retourne toutes les ressources d'un type + tier donné (généralement 1). */
export function getResourcesByTypeAndTier(type: ResourceType, tier: 1 | 2 | 3): ResourceDef[] {
  return RESOURCES.filter((r) => r.type === type && r.tier === tier);
}

/** La première ressource pour un (type, tier) donné — utilisée pour les recettes. */
export function getPrimaryResource(type: ResourceType, tier: 1 | 2 | 3): ResourceDef | undefined {
  return RESOURCES.find((r) => r.type === type && r.tier === tier);
}
