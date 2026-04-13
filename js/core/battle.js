import { chooseAction } from '../ai/decision.js';

export function battleTurn(player, enemy) {

    let action = chooseAction(player, enemy);

    let damage = 0;

    if (action.type === "basic") {
        damage = player.attack;
        player.energy += 20;
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

    if (enemy.hp <= 0) return { result: "win" };

    let enemyDamage = enemy.attack;
    player.hp -= enemyDamage;

    if (player.hp <= 0) return { result: "lose" };

    return {
        result: "continue",
        action: action.type,
        playerHP: player.hp,
        enemyHP: enemy.hp
    };
}