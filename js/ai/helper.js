/**
 * helper.js — ARSITEKTUR GREEDY + DYNAMIC PROGRAMMING
 *
 * Mode GREEDY  : evaluateImmediate — pilih damage terbesar sekarang, tanpa lookahead.
 *
 * Mode HYBRID  : dpSearch — untuk setiap kemungkinan aksi, hitung nilai optimal
 *                menggunakan DP dengan memoization. State yang identik tidak
 *                dihitung ulang; hasilnya di-cache di memo Map.
 *
 * Kunci DP (memo key):
 *   "playerHp|playerSp|playerEnergy|enemyHp|depth"
 *
 *   Nilai HP/SP/Energy dibulatkan ke kelipatan BUCKET_SIZE agar jumlah
 *   state unik tetap manageable dan peluang cache hit meningkat.
 *
 * Substruktur optimal terpenuhi karena:
 *   skor(state, depth) = max atas semua aksi dari
 *     [ applyAction(state, aksi) -> skor(state', depth-1) ]
 *   Nilai state' tidak bergantung pada jalur mana yang membawa kita ke state
 *   tersebut, hanya pada nilai (hp, sp, energy, enemyHp, depth) itu sendiri.
 *
 * Overlapping subproblems terpenuhi karena:
 *   Cabang yang berbeda di pohon aksi bisa menghasilkan state (hp, sp,
 *   energy, enemyHp) yang sama pada depth yang sama -> cache hit.
 */

// Ukuran bucket untuk diskretisasi state (nilai lebih kecil = lebih akurat, lebih banyak state)
const BUCKET_SIZE = 5;

function bucket(val) {
    return Math.floor(val / BUCKET_SIZE) * BUCKET_SIZE;
}

// Utilitas dasar

export function cloneState(player, enemy) {
    return { player: structuredClone(player), enemy: structuredClone(enemy) };
}

export function getPossibleActions(player) {
    const actions = [{ type: "basic" }];
    if (player.sp >= player.skills.skill.sp_cost)
        actions.push({ type: "skill", data: player.skills.skill });
    if (player.energy >= player.skills.ultimate.energy_cost)
        actions.push({ type: "ultimate", data: player.skills.ultimate });
    return actions;
}

// GREEDY: murni damage terbesar, tidak ada konteks
export function evaluateImmediate(action, player, enemy) {
    if (action.type === "basic") return player.attack;
    if (player.attack >= enemy.hp) return player.attack - 1;
    return action.data.damage;
}

// Eksekusi satu aksi, return damage
export function applyAction(player, enemy, action) {
    let damage = 0;
    if (action.type === "basic") {
        damage         = player.attack;
        player.energy += 30;
        player.sp     += 1;
    } else if (action.type === "skill") {
        damage         = action.data.damage;
        player.sp     -= action.data.sp_cost;
        player.energy += 10;
    } else if (action.type === "ultimate") {
        damage         = action.data.damage;
        player.energy -= action.data.energy_cost;
    }
    enemy.hp      -= damage;
    player.sp      = Math.max(0, player.sp);
    player.energy  = Math.max(0, player.energy);
    enemy.hp       = Math.max(0, enemy.hp);
    return damage;
}

// Evaluasi state terminal
function evaluateState(player, enemyHp, nextEnemyHp, nextEnemyAtk) {
    if (player.hp <= 0) return -99999;

    let estimatedHp = player.hp;
    if (enemyHp > 0) {
        const turnsLeft = Math.ceil(enemyHp / Math.max(player.attack, 1));
        estimatedHp = player.hp - turnsLeft * 3;
    }

    const HP_W     = 5.0;
    const ENERGY_W = nextEnemyHp > 0 ? (nextEnemyAtk >= 25 ? 0.6 : 0.35) : 0.0;
    const SP_W     = nextEnemyHp > 0 ? (nextEnemyAtk >= 25 ? 5.0 : 3.0)  : 0.0;

    let score  = Math.max(0, estimatedHp) * HP_W;
    score     += player.energy * ENERGY_W;
    score     += player.sp     * SP_W;
    return score;
}

// Buat memo key dari state saat ini
function makeKey(player, enemyHp, depth) {
    return `${bucket(player.hp)}|${bucket(player.sp)}|${bucket(player.energy)}|${bucket(enemyHp)}|${depth}`;
}

// DP dengan Memoization
//
// dpSearch(player, enemy, depth, nextEnemyHp, nextEnemyAtk, memo)
//
// @param player        state player  (tidak dimutasi)
// @param enemy         state musuh   (tidak dimutasi)
// @param depth         sisa giliran yang dieksplorasi
// @param nextEnemyHp   HP musuh wave berikutnya
// @param nextEnemyAtk  ATK musuh wave berikutnya
// @param memo          Map untuk memoization (dibagikan sepanjang satu keputusan)
//
// Substruktur optimal:
//   dpSearch(state, d) = max_aksi [ score setelah aksi + dpSearch(state', d-1) ]
// Overlapping subproblem:
//   Berbagai urutan aksi yang berbeda bisa menghasilkan (hp, sp, energy,
//   enemyHp) yang sama pada depth yang sama -> key yang sama -> cache hit.
//
export function dpSearch(player, enemy, depth, nextEnemyHp = 0, nextEnemyAtk = 0, memo = new Map()) {

    // Base cases
    if (enemy.hp <= 0)   return evaluateState(player, 0,        nextEnemyHp, nextEnemyAtk);
    if (player.hp <= 0)  return -99999;
    if (depth === 0)     return evaluateState(player, enemy.hp, nextEnemyHp, nextEnemyAtk);

    // Cek memo (overlapping subproblem)
    const key = makeKey(player, enemy.hp, depth);
    if (memo.has(key)) return memo.get(key);

    // Eksplorasi semua aksi (substruktur optimal)
    const actions = getPossibleActions(player);
    let best = -Infinity;

    for (const action of actions) {
        const p = structuredClone(player);
        const e = structuredClone(enemy);

        applyAction(p, e, action);

        let score;
        if (e.hp <= 0) {
            score = evaluateState(p, 0, nextEnemyHp, nextEnemyAtk);
        } else {
            p.hp -= e.attack;
            if (p.hp <= 0) {
                score = -99999;
            } else {
                // Rekursi ke subproblem berikutnya
                score = dpSearch(p, e, depth - 1, nextEnemyHp, nextEnemyAtk, memo);
            }
        }

        if (score > best) best = score;
    }

    // Simpan hasil ke memo sebelum return
    memo.set(key, best);
    return best;
}
