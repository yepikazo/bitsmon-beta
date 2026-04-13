export function calculateDamage(attacker, defender, skill = null) {
  return skill ? skill.damage : attacker.attack;
}