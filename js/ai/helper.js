export function cloneState(player, enemy) {
    return {
        player: structuredClone(player),
        enemy: structuredClone(enemy)
    };
}

export function getPossibleActions(player) {
    let actions = [];

    actions.push({ type: "basic" });

    if (player.sp >= player.skills.skill.sp_cost) {
        actions.push({
            type: "skill",
            data: player.skills.skill
        });
    }

    if (player.energy >= player.skills.ultimate.energy_cost) {
        actions.push({
            type: "ultimate",
            data: player.skills.ultimate
        });
    }

    return actions;
}

export function evaluateImmediate(action, player) {
    if (action.type === "basic") return player.attack;
    return action.data.damage;
}

export function simulateAction(state, action) {
    let { player, enemy } = state;
    let damage = 0;

    if (action.type === "basic") {
        damage = player.attack;
        player.energy += 30;
        player.sp += 1;
    }

    else if (action.type === "skill") {
        damage = action.data.damage;
        player.sp -= action.data.sp_cost;
        player.energy += 10;
    }

    else if (action.type === "ultimate") {
        damage = action.data.damage;
        player.energy -= action.data.energy_cost;
    }

    enemy.hp -= damage;

    if (player.sp < 0) player.sp = 0;
    if (player.energy < 0) player.energy = 0;
    if (enemy.hp < 0) enemy.hp = 0;

    return damage;
}