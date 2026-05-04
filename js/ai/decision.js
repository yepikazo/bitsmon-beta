/**
 * decision.js
 *
 * GREEDY : evaluateImmediate — damage terbesar, tanpa lookahead.
 *
 * HYBRID (Greedy + DP) :
 *   Untuk setiap aksi yang tersedia, terapkan aksi tersebut pada state tiruan,
 *   lalu jalankan dpSearch (depth 4) dengan memo Map yang SAMA untuk semua aksi.
 *
 *   Kunci perubahan vs versi exhaustive search:
 *   - memo dibuat SEKALI per pemanggilan chooseAction, lalu dioper ke dpSearch.
 *   - Subproblem yang sama persis (key identik) hanya dihitung satu kali,
 *     meskipun muncul di bawah cabang aksi yang berbeda.
 *   - Ini adalah DP top-down (memoization): rekursi tetap ada, tapi hasil
 *     intermediate di-cache sehingga tidak ada komputasi duplikat.
 *
 *   depth 4 = melihat 4 gilir ke depan.
 */

import { dpSearch, evaluateImmediate, getPossibleActions, applyAction } from './helper.js';
import { currentMode, AI_MODE } from './config.js';

const SEARCH_DEPTH = 4;

export function chooseAction(player, enemy, nextEnemyHp = 0, nextEnemyAtk = 0) {

    const actions = getPossibleActions(player);

    // GREEDY
    if (currentMode === AI_MODE.GREEDY) {
        return actions
            .map((a, i) => ({ action: a, value: evaluateImmediate(a, player, enemy), index: i }))
            .sort((a, b) => b.value - a.value || a.index - b.index)[0].action;
    }

    // HYBRID: Greedy + DP (memoization)
    // Satu memo Map dibagikan ke seluruh cabang dpSearch dalam satu keputusan.
    // Jika aksi A dan aksi B menghasilkan state yang sama di depth yang sama,
    // hanya satu yang dihitung — yang lain langsung ambil dari cache.
    const memo = new Map();

    let bestAction = actions[0];
    let bestScore  = -Infinity;

    for (const action of actions) {
        const p = structuredClone(player);
        const e = structuredClone(enemy);

        applyAction(p, e, action);

        let score;

        if (e.hp <= 0) {
            // Musuh langsung mati — evaluasi state setelah kill (depth 0)
            score = dpSearch(p, e, 0, nextEnemyHp, nextEnemyAtk, memo);
        } else {
            // Musuh masih hidup — serangan balik, lalu cari skor terbaik ke depan
            p.hp -= e.attack;
            if (p.hp <= 0) {
                score = -99999;
            } else {
                score = dpSearch(p, e, SEARCH_DEPTH - 1, nextEnemyHp, nextEnemyAtk, memo);
            }
        }

        if (score > bestScore) {
            bestScore  = score;
            bestAction = action;
        }
    }

    return bestAction;
}
