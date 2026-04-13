import { getPossibleActions, cloneState, simulateAction } from './helper.js';

export function dp(state, depth) {

    if (depth === 0 || state.enemy.hp <= 0) {
        return 0;
    }

    let actions = getPossibleActions(state.player);
    let best = 0;

    for (let action of actions) {

        let newState = cloneState(state.player, state.enemy);

        let score =
            simulateAction(newState, action) +
            dp(newState, depth - 1);

        if (score > best) {
            best = score;
        }
    }

    return best;
}