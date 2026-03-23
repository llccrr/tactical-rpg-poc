export interface ResourceDef {
  id: string;
  name: string;
  icon: string;
}

export const RESOURCES: ResourceDef[] = [
  // Donjon 1 : Caverne des Gobelins
  { id: "pierre_brute", name: "Pierre brute", icon: "🪨" },
  { id: "dent_gobelin", name: "Dent de Gobelin", icon: "🦷" },
  { id: "champignon_toxique", name: "Champignon toxique", icon: "🍄" },
  // Donjon 2 : Crypte des Squelettes
  { id: "os_tranchant", name: "Os tranchant", icon: "🦴" },
  { id: "poussiere_os", name: "Poussiere d'os", icon: "💀" },
  { id: "gemme_maudite", name: "Gemme maudite", icon: "💎" },
  // Donjon 3 : Marais du Slime
  { id: "glu_slime", name: "Glu de Slime", icon: "💧" },
  { id: "cristal_visqueux", name: "Cristal visqueux", icon: "🔮" },
  { id: "noyau_slime", name: "Noyau de Slime", icon: "⚡" },
  // Donjon 4 : Forteresse Demoniaque
  { id: "corne_demon", name: "Corne de Demon", icon: "🐏" },
  { id: "flamme_infernale", name: "Flamme infernale", icon: "🔥" },
  { id: "coeur_demon", name: "Coeur de Demon", icon: "♥️" },
];

export function getResourceById(id: string): ResourceDef | undefined {
  return RESOURCES.find((r) => r.id === id);
}
