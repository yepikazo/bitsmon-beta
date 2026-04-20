import { getPossibleActions, cloneState, simulateAction } from './helper.js';

export function dp(state, depth) {

    if (depth === 0 || state.enemy.hp <= 0) {
        return 0;
    }

    let actions = getPossibleActions(state.player);
    let best = -Infinity;

    for (let action of actions) {

        let newState = cloneState(state.player, state.enemy);

        let value =
            simulateAction(newState, action) +
            dp(newState, depth - 1);

        if (value > best) {
            best = value;
        }
    }

    return best;
}