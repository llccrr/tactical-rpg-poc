import type { StatusEffectDefinition } from "./types";

export const IOPLIKE_STATUSES: StatusEffectDefinition[] = [
  {
    id: "preparation",
    name: "Préparation",
    duration: -1, // consumed on next offensive spell, not time-based
    stackable: false,
    maxStacks: 1,
    rules:
      "Augmente les dégâts du prochain sort offensif de 40%. Consommé après utilisation. Gagné quand Concentration atteint 100.",
  },
  {
    id: "courroux",
    name: "Courroux",
    duration: -1, // persists until consumed
    stackable: true,
    maxStacks: 4,
    rules:
      "Augmente de 50% par stack les dégâts du prochain sort coûtant exactement 4 PA. Les stacks sont consommées à l'utilisation. Gagné quand Concentration atteint 100.",
  },
  {
    id: "ebranle",
    name: "Ébranlé",
    duration: 1,
    stackable: false,
    maxStacks: 1,
    rules: "Augmente les pertes d'armure subies pendant 1 tour.",
  },
];
