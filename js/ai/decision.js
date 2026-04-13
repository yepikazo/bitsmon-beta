import { dp } from './dp.js';
import {
    evaluateImmediate,
    getPossibleActions,
    cloneState,
    simulateAction
} from './helper.js';

import { currentMode, AI_MODE } from './config.js';

export function chooseAction(player, enemy) {

    let actions = getPossibleActions(player);

    let ranked = actions.map((a, i) => ({
        action: a,
        value: evaluateImmediate(a),
        index: i
    }));

    ranked.sort((a, b) => {
        if (b.value !== a.value) return b.value - a.value;
        return a.index - b.index;
    });

    // GREEDY ONLY
    if (currentMode === AI_MODE.GREEDY) {
        return ranked[0].action;
    }

    // HYBRID (DP + GREEDY)
    let bestAction = ranked[0].action;
    let bestScore = -Infinity;

    for (let item of ranked) {

        let state = cloneState(player, enemy);

        let score =
            simulateAction(state, item.action) +
            dp(state, 2);

        if (score > bestScore) {
            bestScore = score;
            bestAction = item.action;
        }
    }

    return bestAction;
}