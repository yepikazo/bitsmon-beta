export function chooseAction(player, enemy) {

    let actions = getPossibleActions(player);

    // 🔹 STEP 1: greedy → ambil top 2
    let ranked = actions.map(a => ({
        action: a,
        value: evaluateImmediate(a, player, enemy)
    }));

    ranked.sort((a, b) => b.value - a.value);

    let topActions = ranked.slice(0, 2); // batasi

    // 🔹 STEP 2: DP depth kecil
    let bestAction = null;
    let bestScore = -Infinity;

    for (let item of topActions) {
        let clonedState = cloneState(player, enemy);

        let score =
            simulateAction(clonedState, item.action) +
            dp(clonedState, 2); // depth 2

        if (score > bestScore) {
            bestScore = score;
            bestAction = item.action;
        }
    }

    return bestAction;
}