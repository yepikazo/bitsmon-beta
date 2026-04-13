export function calculateDamage(attacker, defender, skill = null) {
  return skill ? skill.damage : attacker.attack; //jika skill null, berarti basic attack jika tidak null, berarti pakai damage dari skill
}