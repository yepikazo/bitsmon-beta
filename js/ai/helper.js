// Clone state supaya simulasi tidak merusak state asli
export function cloneState(player, enemy) {
    return {
        player: structuredClone(player),
        enemy: structuredClone(enemy)
    };
}


// Generate semua aksi yang valid berdasarkan resource
export function getPossibleActions(player) {
    let actions = [];

    // BASIC selalu tersedia
    actions.push({ type: "basic" });

    // SKILL (cek SP)
    if (
        player.skills &&
        player.skills.skill &&
        player.sp >= player.skills.skill.sp_cost
    ) {
        actions.push({
            type: "skill",
            data: player.skills.skill
        });
    }

    // ULTIMATE (cek energy)
    if (
        player.skills &&
        player.skills.ultimate &&
        player.energy >= player.skills.ultimate.energy_cost
    ) {
        actions.push({
            type: "ultimate",
            data: player.skills.ultimate
        });
    }

    return actions;
}


// Evaluasi greedy (nilai langsung)
export function evaluateImmediate(action, player) {
    if (action.type === "basic") {
        return player.attack;
    }

    if (action.type === "skill") {
        return action.data.damage;
    }

    if (action.type === "ultimate") {
        return action.data.damage;
    }

    return 0;
}


// Simulasi aksi (dipakai di DP & hybrid)
export function simulateAction(state, action) {
    let { player, enemy } = state;
    let damage = 0;

    // BASIC
    if (action.type === "basic") {
        damage = player.attack;

        // gain resource
        player.energy += 20;
        player.sp += 1;
    }

    // SKILL
    else if (action.type === "skill") {
        damage = action.data.damage;

        // consume SP
        player.sp -= action.data.sp_cost;

        // gain energy
        player.energy += 25;
    }

    // ULTIMATE
    else if (action.type === "ultimate") {
        damage = action.data.damage;

        // consume energy
        player.energy -= action.data.energy_cost;
    }

    // apply damage
    enemy.hp -= damage;

    // safety clamp (biar gak aneh)
    if (player.sp < 0) player.sp = 0;
    if (player.energy < 0) player.energy = 0;
    if (enemy.hp < 0) enemy.hp = 0;

    return damage;
}