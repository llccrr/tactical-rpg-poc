/** Pure damage computation: max(1, baseDamage + attack - defense) */
export function computeDamage(attacker, defender, spell, defenderHp) {
    const damage = Math.max(1, spell.baseDamage + attacker.attack - defender.defense);
    return { damage, killed: defenderHp - damage <= 0 };
}
