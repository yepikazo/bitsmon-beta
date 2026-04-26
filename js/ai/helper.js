/**
 * helper.js — ARSITEKTUR EXHAUSTIVE SEARCH
 *
 * Untuk setiap kemungkinan aksi pertama, kita jalankan pencarian exhaustive
 * (semua kombinasi aksi) hingga kedalaman tertentu, lalu evaluasi state akhir.
 * Ini jauh lebih robust dari DP akumulasi maupun single-path simulation.
 *
 * Perbedaan dengan versi sebelumnya:
 *   - Tidak ada "smartPickAction" yang bisa bias — semua jalur dieksplorasi
 *   - State akhir dievaluasi dengan fungsi yang jelas: HP tersisa adalah
 *     komponen UTAMA, resource adalah bonus sekunder
 *   - Greedy tetap murni: ambil damage tertinggi, tidak ada lookahead
 */

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

// ─── GREEDY: murni damage terbesar, tidak ada konteks ────────────────────────
export function evaluateImmediate(action, player, enemy) {
    if (action.type === "basic") return player.attack;
    if (player.attack >= enemy.hp) return player.attack - 1;
    return action.data.damage;
}

// ─── Eksekusi satu aksi, return damage ───────────────────────────────────────
export function applyAction(player, enemy, action) {
    let damage = 0;
    if (action.type === "basic") {
        damage = player.attack;
        player.energy += 30;
        player.sp     += 1;
    } else if (action.type === "skill") {
        damage = action.data.damage;
        player.sp     -= action.data.sp_cost;
        player.energy += 10;
    } else if (action.type === "ultimate") {
        damage = action.data.damage;
        player.energy -= action.data.energy_cost;
    }
    enemy.hp      -= damage;
    player.sp      = Math.max(0, player.sp);
    player.energy  = Math.max(0, player.energy);
    enemy.hp       = Math.max(0, enemy.hp);
    return damage;
}

// ─── Evaluasi state terminal ──────────────────────────────────────────────────
// Dipanggil ketika musuh mati, player mati, atau kedalaman habis.
// HP adalah komponen utama; resource adalah bonus sekunder yang bergantung
// pada seberapa berbahaya wave berikutnya.
function evaluateState(player, enemyHp, alive, nextEnemyHp, nextEnemyAtk) {
    if (!alive || player.hp <= 0) return -99999;

    // Jika musuh belum mati saat kedalaman habis, estimasi berapa turn lagi
    // dan kurangi HP player secara estimatif
    let estimatedHp = player.hp;
    if (enemyHp > 0) {
        const turnsLeft = Math.ceil(enemyHp / Math.max(player.attack, 1));
        estimatedHp = player.hp - turnsLeft * (player.skills ? 0 : 0); 
        // Penalti: musuh masih hidup di akhir kedalaman = situasi belum selesai
        // Kita tetap nilai tapi beri penalti proporsional
        estimatedHp = player.hp - turnsLeft * 3; // estimasi damage kena
    }

    const HP_W      = 5.0;
    const ENERGY_W  = nextEnemyHp > 0 ? (nextEnemyAtk >= 25 ? 0.6 : 0.35) : 0.0;
    const SP_W      = nextEnemyHp > 0 ? (nextEnemyAtk >= 25 ? 5.0 : 3.0)  : 0.0;

    let score = Math.max(0, estimatedHp) * HP_W;
    score    += player.energy * ENERGY_W;
    score    += player.sp     * SP_W;

    return score;
}

// ─── Exhaustive search: cari skor terbaik dari state saat ini ────────────────
// Menjelajahi SEMUA kombinasi aksi hingga `depth` gilir ke depan.
// Setiap gilir: aksi player → serangan balik musuh.
// Return skor state terbaik yang bisa dicapai.
//
// @param player        state player (tidak dimutasi)
// @param enemy         state musuh  (tidak dimutasi)
// @param depth         gilir ke depan yang dieksplorasi
// @param nextEnemyHp   HP musuh wave berikutnya
// @param nextEnemyAtk  ATK musuh wave berikutnya
export function exhaustiveSearch(player, enemy, depth, nextEnemyHp = 0, nextEnemyAtk = 0) {
    // Base case: musuh mati
    if (enemy.hp <= 0) {
        return evaluateState(player, 0, true, nextEnemyHp, nextEnemyAtk);
    }
    // Base case: player mati
    if (player.hp <= 0) {
        return -99999;
    }
    // Base case: kedalaman habis
    if (depth === 0) {
        return evaluateState(player, enemy.hp, true, nextEnemyHp, nextEnemyAtk);
    }

    const actions = getPossibleActions(player);
    let best = -Infinity;

    for (const action of actions) {
        const p = structuredClone(player);
        const e = structuredClone(enemy);

        applyAction(p, e, action);

        if (e.hp <= 0) {
            // Musuh mati dengan aksi ini
            const score = evaluateState(p, 0, true, nextEnemyHp, nextEnemyAtk);
            if (score > best) best = score;
            continue;
        }

        // Serangan balik musuh
        p.hp -= e.attack;
        if (p.hp <= 0) {
            if (-99999 > best) best = -99999;
            continue;
        }

        // Rekursi ke gilir berikutnya
        const score = exhaustiveSearch(p, e, depth - 1, nextEnemyHp, nextEnemyAtk);
        if (score > best) best = score;
    }

    return best;
}

// ─── simulateAction: wrapper untuk kompatibilitas dp.js (tidak aktif) ────────
export function simulateAction(state, action, nextEnemyHp = 0, nextEnemyAtk = 0) {
    applyAction(state.player, state.enemy, action);
    return 0;
}
