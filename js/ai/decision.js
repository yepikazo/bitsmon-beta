import { dp } from './dp.js';
import {
    evaluateImmediate,
    getPossibleActions,
    cloneState,
    simulateAction
} from './helper.js';

export function chooseAction(player, enemy) {

    let actions = getPossibleActions(player);

    // greedy ranking
    let ranked = actions.map(a => ({
        action: a,
        value: evaluateImmediate(a, player)
    }));

    ranked.sort((a, b) => b.value - a.value);

    let topActions = ranked.slice(0, 2);

    let bestAction = topActions[0].action;
    let bestScore = -Infinity;

    for (let item of topActions) {

        let state = cloneState(player, enemy); // WAJIB duluan

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