export function cloneState(player, enemy) {
    if (!player || !enemy) {
        throw new Error("STATE ERROR: player/enemy undefined");
    }

    return {
        player: JSON.parse(JSON.stringify(player)),
        enemy: JSON.parse(JSON.stringify(enemy))
    };
}

export function getPossibleActions(player) {
    let actions = [];

    actions.push({ type: "basic" });

    if (player.sp > 0 && player.skills) {
        player.skills.forEach(skill => {
            if (player.sp >= skill.cost) {
                actions.push({ type: "skill", skill });
            }
        });
    }

    if (player.energy >= 100) {
        actions.push({ type: "ultimate" });
    }

    return actions;
}

export function evaluateImmediate(action, player) {
    if (action.type === "ultimate") return 80;
    if (action.type === "skill") return action.skill.damage;
    return player.attack;
}

export function simulateAction(state, action) {
    let { player, enemy } = state;
    let damage = 0;

    if (action.type === "ultimate") {
        damage = 80;
        player.energy = 0;
    }

    else if (action.type === "skill") {
        damage = action.skill.damage;
        player.sp -= action.skill.cost;
        player.energy += 30;
    }

    else {
        damage = player.attack;
        player.sp += 1;
        player.energy += 20;
    }

    enemy.hp -= damage;

    return damage;
}