import { chooseAction } from '../ai/decision.js';
import { calculateDamage } from './damage.js';

export function battleTurn(player, enemy) {

    let action = chooseAction(player, enemy);

    let playerDamage = 0;

    if (action.type === "ultimate") {
        playerDamage = 80;
        player.energy = 0;
    }

    else if (action.type === "skill") {
        playerDamage = calculateDamage(player, enemy, action.skill);
        player.sp -= action.skill.cost;
        player.energy += 30;
    }

    else {
        playerDamage = calculateDamage(player, enemy);
        player.sp += 1;
        player.energy += 20;
    }

    enemy.hp -= playerDamage;

    if (enemy.hp <= 0) {
        return { result: "win" };
    }

    // enemy attack
    let enemyDamage = calculateDamage(enemy, player);
    player.hp -= enemyDamage;

    if (player.hp <= 0) {
        return { result: "lose" };
    }

    return {
        result: "continue",
        action: action.type,
        playerHP: player.hp,
        enemyHP: enemy.hp
    };
}