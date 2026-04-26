/**
 * decision.js
 *
 * GREEDY : evaluateImmediate — damage terbesar, tanpa lookahead.
 *
 * HYBRID : untuk setiap aksi yang tersedia, terapkan aksi tersebut pada
 *          state tiruan, lalu jalankan exhaustiveSearch (depth 4) untuk
 *          menilai seberapa baik state tersebut.
 *          Pilih aksi dengan skor exhaustive terbaik.
 *
 *          depth 4 = melihat 4 gilir ke depan = cukup untuk membedakan
 *          "buang ultimate sekarang" vs "simpan untuk nanti".
 */

import { exhaustiveSearch, evaluateImmediate, getPossibleActions, applyAction } from './helper.js';
import { currentMode, AI_MODE } from './config.js';

const SEARCH_DEPTH = 4;

export function chooseAction(player, enemy, nextEnemyHp = 0, nextEnemyAtk = 0) {

    const actions = getPossibleActions(player);

    // ── GREEDY ──────────────────────────────────────────────────────────
    if (currentMode === AI_MODE.GREEDY) {
        return actions
            .map((a, i) => ({ action: a, value: evaluateImmediate(a, player, enemy), index: i }))
            .sort((a, b) => b.value - a.value || a.index - b.index)[0].action;
    }

    // ── HYBRID ──────────────────────────────────────────────────────────
    let bestAction = actions[0];
    let bestScore  = -Infinity;

    for (const action of actions) {
        // Clone state, terapkan aksi
        const p = structuredClone(player);
        const e = structuredClone(enemy);

        applyAction(p, e, action);

        let score;

        if (e.hp <= 0) {
            // Musuh langsung mati — evaluasi state setelah kill
            score = exhaustiveSearch(p, e, 0, nextEnemyHp, nextEnemyAtk);
        } else {
            // Musuh masih hidup — serangan balik, lalu cari skor terbaik ke depan
            p.hp -= e.attack;
            if (p.hp <= 0) {
                score = -99999;
            } else {
                score = exhaustiveSearch(p, e, SEARCH_DEPTH - 1, nextEnemyHp, nextEnemyAtk);
            }
        }

        if (score > bestScore) {
            bestScore  = score;
            bestAction = action;
        }
    }

    return bestAction;
}
