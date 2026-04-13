export function cloneState(player, enemy) {
    return {
        player: structuredClone(player),
        enemy: structuredClone(enemy)
    };
}

export function getPossibleActions(player) {

    let actions = [];

    actions.push({ type: "basic" });

    actions.push({
        type: "skill",
        data: player.skills.skill
    });

    if (player.energy >= player.skills.ultimate.cost) {
        actions.push({
            type: "ultimate",
            data: player.skills.ultimate
        });
    }

    return actions;
}

export function evaluateImmediate(action) {

    if (action.type === "ultimate") return 80;
    if (action.type === "skill") return 40;
    return 25;
}

export function simulateAction(state, action) {

    let { player, enemy } = state;
    let damage = 0;

    if (action.type === "basic") {
        damage = player.attack;
        player.energy += 20;
        player.sp += 1;
    }

    else if (action.type === "skill") {
        damage = action.data.damage;
        player.sp -= action.data.cost;
        player.energy += 30;
    }

    else if (action.type === "ultimate") {
        damage = action.data.damage;
        player.energy = 0;
    }

    enemy.hp -= damage;

    return damage;
}