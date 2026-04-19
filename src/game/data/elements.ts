/**
 * Mod\u00e8le de d\u00e9g\u00e2ts \u00e9l\u00e9mentaire (ticket "Mod\u00e8le de d\u00e9g\u00e2ts").
 * Arme de r\u00e9f\u00e9rence = 10 d\u00e9g\u00e2ts. Tous les sorts sont exprim\u00e9s en
 * pourcentage de ce dommage d'arme. Les 5 \u00e9l\u00e9ments et les r\u00e9sistances
 * associ\u00e9es sont d\u00e9finis ici.
 */

export type Element = "feu" | "eau" | "vent" | "terre" | "neutre";

export const ELEMENTS: readonly Element[] = [
  "feu",
  "eau",
  "vent",
  "terre",
  "neutre",
];

export const WEAPON_BASE_DAMAGE = 10;

/** Cap par \u00e9l\u00e9ment impos\u00e9 par le spec. */
export const RESISTANCE_CAP = 0.7;

export const ELEMENT_LABELS: Record<Element, string> = {
  feu: "Feu",
  eau: "Eau",
  vent: "Vent",
  terre: "Terre",
  neutre: "Neutre",
};

export const ELEMENT_ICONS: Record<Element, string> = {
  feu: "\ud83d\udd25",
  eau: "\ud83d\udca7",
  vent: "\ud83c\udf2a\ufe0f",
  terre: "\ud83c\udf31",
  neutre: "\u2694\ufe0f",
};

export const ELEMENT_COLORS: Record<Element, string> = {
  feu: "#fb923c",
  eau: "#60a5fa",
  vent: "#a3e635",
  terre: "#a16207",
  neutre: "#a1a1aa",
};

/** Valeurs entre 0 et RESISTANCE_CAP. */
export type Resistances = Record<Element, number>;

export function createZeroResistances(): Resistances {
  return { feu: 0, eau: 0, vent: 0, terre: 0, neutre: 0 };
}

/** Clamp une valeur de r\u00e9sistance dans [0, RESISTANCE_CAP]. */
export function clampResistance(value: number): number {
  if (value < 0) return 0;
  if (value > RESISTANCE_CAP) return RESISTANCE_CAP;
  return value;
}

/**
 * Construit une table de r\u00e9sistances en partant de z\u00e9ros et en appliquant
 * un patch partiel. Les valeurs sont clamp\u00e9es \u00e0 [0, 70%].
 */
export function makeResistances(partial?: Partial<Resistances>): Resistances {
  const base = createZeroResistances();
  if (!partial) return base;
  for (const element of ELEMENTS) {
    const raw = partial[element];
    if (raw != null) base[element] = clampResistance(raw);
  }
  return base;
}
