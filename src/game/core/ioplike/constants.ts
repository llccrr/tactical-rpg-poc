export const IOPLIKE = {
  // ── Resources ────────────────────────────────
  PA_MAX: 6,
  PM_MAX: 3,
  BLOOD_POINTS_MAX: 2,
  CONCENTRATION_MAX: 100,

  // ── Base stats ───────────────────────────────
  BASE_HP: 40,
  BASE_ATTACK: 5,
  BASE_DEFENSE: 3,

  // ── Concentration gains ──────────────────────
  CONCENTRATION_JABS: 20,
  CONCENTRATION_TORGNOLE: 25,
  CONCENTRATION_FULGUR: 10,
  CONCENTRATION_COMBO_PA: 15,
  CONCENTRATION_SUPER_IOP_PUNCH_KILL: 20,

  // ── Préparation ──────────────────────────────
  PREPARATION_DAMAGE_BONUS: 0.40,

  // ── Courroux ─────────────────────────────────
  COURROUX_DAMAGE_BONUS_PER_STACK: 0.50,
  COURROUX_MAX_STACKS: 4,
  COURROUX_TARGET_AP_COST: 4,

  // ── Super Iop Punch kill reward ──────────────
  SUPER_IOP_PUNCH_KILL_AP_REWARD: 2,
  SUPER_IOP_PUNCH_KILL_CONCENTRATION_REWARD: 20,

  // ── Combo PA reward ──────────────────────────
  COMBO_PA_AP_REWARD: 2,
  COMBO_PA_CONCENTRATION_REWARD: 15,
} as const;
