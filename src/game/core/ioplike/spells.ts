import type { SpellDefinition } from "./types";
import { IOPLIKE } from "./constants";

export const IOPLIKE_SPELLS: SpellDefinition[] = [
  // ══════════════════════════════════════════════
  // A. JABS
  // ══════════════════════════════════════════════
  {
    id: "jabs",
    name: "Jabs",
    apCost: 3,
    mpCost: 0,
    bloodPointCost: 0,
    rangeMin: 1,
    rangeMax: 1,
    element: "air",
    tags: ["melee", "damage", "concentrationGenerator", "combo3AP"],
    description: "Coups rapides au corps-à-corps. Génère beaucoup de Concentration.",
    effect: {
      baseDamage: 6,
      concentrationGain: IOPLIKE.CONCENTRATION_JABS,
    },
    implemented: true,
  },

  // ══════════════════════════════════════════════
  // B. RAFALE
  // ══════════════════════════════════════════════
  {
    id: "rafale",
    name: "Rafale",
    apCost: 1,
    mpCost: 0,
    bloodPointCost: 0,
    rangeMin: 1,
    rangeMax: 2,
    element: "air",
    tags: ["air", "utility", "pull", "combo1AP"],
    description: "Frappe légère qui attire la cible de 1 case vers le lanceur.",
    effect: {
      baseDamage: 2,
      concentrationGain: 0,
      pullDistance: 1,
    },
    implemented: true,
  },

  // ══════════════════════════════════════════════
  // C. TORGNOLE
  // ══════════════════════════════════════════════
  {
    id: "torgnole",
    name: "Torgnole",
    apCost: 2,
    mpCost: 0,
    bloodPointCost: 0,
    rangeMin: 1,
    rangeMax: 2,
    element: "air",
    tags: ["air", "damage", "concentrationGenerator"],
    description: "Coup puissant générant encore plus de Concentration que Jabs.",
    effect: {
      baseDamage: 4,
      concentrationGain: IOPLIKE.CONCENTRATION_TORGNOLE,
    },
    implemented: false,
  },

  // ══════════════════════════════════════════════
  // D. TANNÉE
  // ══════════════════════════════════════════════
  {
    id: "tannee",
    name: "Tannée",
    apCost: 4,
    mpCost: 0,
    bloodPointCost: 0,
    rangeMin: 1,
    rangeMax: 1,
    element: "air",
    tags: ["air", "damage", "fourAP", "wrathConsumer"],
    description:
      "Dégâts très lourds. Donne ensuite à la cible une armure proportionnelle aux dégâts subis. Consomme Courroux.",
    effect: {
      baseDamage: 10,
      concentrationGain: 0,
      armorGrantPercent: 0.3,
    },
    implemented: false,
  },

  // ══════════════════════════════════════════════
  // E. ÉPÉE DE IOP
  // ══════════════════════════════════════════════
  {
    id: "epee_de_iop",
    name: "Épée de Iop",
    apCost: 3,
    mpCost: 0,
    bloodPointCost: 0,
    rangeMin: 1,
    rangeMax: 1,
    element: "air",
    tags: ["air", "aoe", "buff", "combo3AP"],
    description: "Dégâts en zone croix. Augmente les dommages infligés pendant 1 tour.",
    effect: {
      baseDamage: 5,
      concentrationGain: 0,
      aoeShape: "cross",
      aoeRadius: 1,
      damageBuffDuration: 1,
    },
    implemented: false,
  },

  // ══════════════════════════════════════════════
  // F. ÉBRANLER
  // ══════════════════════════════════════════════
  {
    id: "ebranler",
    name: "Ébranler",
    apCost: 2,
    mpCost: 0,
    bloodPointCost: 0,
    rangeMin: 1,
    rangeMax: 3,
    element: "earth",
    tags: ["earth", "damage", "armorBreak"],
    description: "Inflige des dégâts et applique Ébranlé (pertes d'armure augmentées pendant 1 tour).",
    effect: {
      baseDamage: 3,
      concentrationGain: 0,
      applyEbranle: true,
    },
    implemented: true,
  },

  // ══════════════════════════════════════════════
  // G. ROGNOCEROK
  // ══════════════════════════════════════════════
  {
    id: "rognocerok",
    name: "Rognocerok",
    apCost: 4,
    mpCost: 0,
    bloodPointCost: 0,
    rangeMin: 1,
    rangeMax: 2,
    element: "earth",
    tags: ["earth", "damage", "ignoreArmor", "fourAP", "wrathConsumer"],
    description: "Dégâts ignorant l'armure. Consomme Courroux car sort à 4 PA.",
    effect: {
      baseDamage: 8,
      concentrationGain: 0,
      ignoreArmor: true,
    },
    implemented: false,
  },

  // ══════════════════════════════════════════════
  // H. FENDOIR
  // ══════════════════════════════════════════════
  {
    id: "fendoir",
    name: "Fendoir",
    apCost: 3,
    mpCost: 0,
    bloodPointCost: 0,
    rangeMin: 1,
    rangeMax: 1,
    element: "earth",
    tags: ["earth", "aoe", "support"],
    description: "Dégâts en zone croix. Bonus défensif aux alliés dans la zone.",
    effect: {
      baseDamage: 4,
      concentrationGain: 0,
      aoeShape: "cross",
      aoeRadius: 1,
      defenseBuffAlly: 2,
    },
    implemented: false,
  },

  // ══════════════════════════════════════════════
  // I. CHARGE
  // ══════════════════════════════════════════════
  {
    id: "charge",
    name: "Charge",
    apCost: 3,
    mpCost: 0,
    bloodPointCost: 0,
    rangeMin: 1,
    rangeMax: 4,
    element: "earth",
    tags: ["earth", "mobility", "dash"],
    description:
      "Déplacement vers la case cible et dégâts à l'arrivée. Coût s'adapte à la distance (1 à 4 PA).",
    effect: {
      baseDamage: 5,
      concentrationGain: 0,
      dashToTarget: true,
      variableCost: true,
    },
    implemented: false,
  },

  // ══════════════════════════════════════════════
  // J. RAVAGE
  // ══════════════════════════════════════════════
  {
    id: "ravage",
    name: "Ravage",
    apCost: 5,
    mpCost: 0,
    bloodPointCost: 0,
    rangeMin: 1,
    rangeMax: 3,
    element: "earth",
    tags: ["earth", "mobility", "aoe"],
    description: "Téléporte le IopLike et inflige des dégâts en zone autour de lui.",
    effect: {
      baseDamage: 7,
      concentrationGain: 0,
      dashToTarget: true,
      aoeShape: "circle",
      aoeRadius: 1,
    },
    implemented: false,
  },

  // ══════════════════════════════════════════════
  // K. ÉPÉE CÉLESTE
  // ══════════════════════════════════════════════
  {
    id: "epee_celeste",
    name: "Épée céleste",
    apCost: 2,
    mpCost: 0,
    bloodPointCost: 0,
    rangeMin: 1,
    rangeMax: 2,
    element: "fire",
    tags: ["fire", "aoe"],
    description: "Dégâts de zone. Utile pour le clean/farm.",
    effect: {
      baseDamage: 3,
      concentrationGain: 0,
      aoeShape: "cross",
      aoeRadius: 1,
    },
    implemented: false,
  },

  // ══════════════════════════════════════════════
  // L. FULGUR
  // ══════════════════════════════════════════════
  {
    id: "fulgur",
    name: "Fulgur",
    apCost: 3,
    mpCost: 0,
    bloodPointCost: 0,
    rangeMin: 1,
    rangeMax: 2,
    element: "fire",
    tags: ["fire", "damage", "combo3AP"],
    description: "Lourds dégâts mono-cible feu. Génère de la Concentration.",
    effect: {
      baseDamage: 7,
      concentrationGain: IOPLIKE.CONCENTRATION_FULGUR,
    },
    implemented: true,
  },

  // ══════════════════════════════════════════════
  // M. SUPER IOP PUNCH
  // ══════════════════════════════════════════════
  {
    id: "super_iop_punch",
    name: "Super Iop Punch",
    apCost: 4,
    mpCost: 0,
    bloodPointCost: 0,
    rangeMin: 1,
    rangeMax: 2,
    element: "fire",
    tags: ["fire", "damage", "finisher", "fourAP", "wrathConsumer"],
    description:
      "Très gros dégâts. Si la cible meurt : rend des PA et de la Concentration. Consomme Courroux.",
    effect: {
      baseDamage: 10,
      concentrationGain: 0,
      isFinisher: true,
      finisherApReward: IOPLIKE.SUPER_IOP_PUNCH_KILL_AP_REWARD,
      finisherConcentrationReward: IOPLIKE.SUPER_IOP_PUNCH_KILL_CONCENTRATION_REWARD,
    },
    implemented: true,
  },

  // ══════════════════════════════════════════════
  // N. JUGEMENT
  // ══════════════════════════════════════════════
  {
    id: "jugement",
    name: "Jugement",
    apCost: 1,
    mpCost: 0,
    bloodPointCost: 0,
    rangeMin: 1,
    rangeMax: 3,
    element: "fire",
    tags: ["fire", "setup", "combo1AP"],
    description: "Dégâts légers. Augmente les dommages du prochain sort feu.",
    effect: {
      baseDamage: 2,
      concentrationGain: 0,
      fireDamageBuffNext: true,
    },
    implemented: false,
  },

  // ══════════════════════════════════════════════
  // O. COLÈRE DE IOP
  // ══════════════════════════════════════════════
  {
    id: "colere_de_iop",
    name: "Colère de Iop",
    apCost: 6,
    mpCost: 0,
    bloodPointCost: 0,
    rangeMin: 0,
    rangeMax: 0,
    element: "fire",
    tags: ["fire", "aoe"],
    description: "Gros dégâts de zone autour du lanceur.",
    effect: {
      baseDamage: 9,
      concentrationGain: 0,
      aoeShape: "around-caster",
      aoeRadius: 2,
    },
    implemented: false,
  },

  // ══════════════════════════════════════════════
  // P. ÉVENTRAIL
  // ══════════════════════════════════════════════
  {
    id: "eventrail",
    name: "Éventrail",
    apCost: 0,
    mpCost: 1,
    bloodPointCost: 0,
    rangeMin: 1,
    rangeMax: 2,
    element: "neutral",
    tags: ["utility", "comboPM", "movementSkill"],
    description: "Sort de combo / mobilité courte. Combo PM non implémenté dans ce POC.",
    effect: {
      baseDamage: 0,
      concentrationGain: 0,
      isMobilitySpell: true,
    },
    implemented: false,
  },

  // ══════════════════════════════════════════════
  // Q. UPPERCUT
  // ══════════════════════════════════════════════
  {
    id: "uppercut",
    name: "Uppercut",
    apCost: 0,
    mpCost: 0,
    bloodPointCost: 1,
    rangeMin: 1,
    rangeMax: 1,
    element: "neutral",
    tags: ["bloodPoint", "comboBlood", "utility"],
    description: "Sort utilitaire de combo. Utilisé pour ouvrir ou terminer des séquences.",
    effect: {
      baseDamage: 1,
      concentrationGain: 0,
    },
    implemented: true,
  },

  // ══════════════════════════════════════════════
  // R. JUMP (BOND)
  // ══════════════════════════════════════════════
  {
    id: "jump",
    name: "Jump",
    apCost: 4,
    mpCost: 0,
    bloodPointCost: 0,
    rangeMin: 1,
    rangeMax: 5,
    element: "neutral",
    tags: ["mobility", "fourAP"],
    description: "Téléporte / bondit sur une case valide. Vrai outil de mobilité.",
    effect: {
      baseDamage: 0,
      concentrationGain: 0,
      isMobilitySpell: true,
    },
    implemented: true,
  },

  // ══════════════════════════════════════════════
  // S. ÉTENDARD
  // ══════════════════════════════════════════════
  {
    id: "etendard",
    name: "Étendard",
    apCost: 3,
    mpCost: 0,
    bloodPointCost: 0,
    rangeMin: 1,
    rangeMax: 3,
    element: "neutral",
    tags: ["banner", "utility", "zoneAnchor"],
    description: "Pose un étendard sur le terrain. Servira plus tard à d'autres mécaniques.",
    effect: {
      baseDamage: 0,
      concentrationGain: 0,
      summonBanner: true,
    },
    implemented: false,
  },
];

/** Lookup spell definition by id */
export function getSpellDef(id: string): SpellDefinition | undefined {
  return IOPLIKE_SPELLS.find((s) => s.id === id);
}

/** Get only implemented spells (for HUD spell bar) */
export function getImplementedSpells(): SpellDefinition[] {
  return IOPLIKE_SPELLS.filter((s) => s.implemented);
}
