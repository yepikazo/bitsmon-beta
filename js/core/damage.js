/**
 * damage.js
 * Kalkulator damage sederhana.
 * Jika skill null → basic attack. Jika ada skill → pakai damage skill.
 */
export function calculateDamage(attacker, _defender, skill = null) {
    return skill ? skill.damage : attacker.attack;
}
