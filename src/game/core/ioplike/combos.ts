import type { ComboDefinition } from "./types";
import { IOPLIKE } from "./constants";

export const IOPLIKE_COMBOS: ComboDefinition[] = [
  {
    id: "combo_pa",
    name: "Combo PA",
    patternType: "cost-sequence",
    pattern: [
      { type: "blood", amount: 1 },
      { type: "ap", amount: 3 },
      { type: "blood", amount: 1 },
      { type: "ap", amount: 1 },
    ],
    oncePerTurn: true,
    reward: {
      ap: IOPLIKE.COMBO_PA_AP_REWARD,
      concentration: IOPLIKE.COMBO_PA_CONCENTRATION_REWARD,
    },
  },
];
