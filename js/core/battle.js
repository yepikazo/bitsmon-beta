import { chooseAction } from '../ai/decision.js';

export function runBattle(player, enemy) {

    let turn = 1;

    console.log(`\n=== VS ${enemy.name} ===`);

    while (true) {

        console.log(`\nTurn ${turn}`);
        console.log(`Player HP: ${player.hp} | SP: ${player.sp} | Energy: ${player.energy}`);
        console.log(`Enemy HP: ${enemy.hp}`);

        let action = chooseAction(player, enemy);
        let damage = 0;

        if (action.type === "basic") {
            damage = player.attack;
            player.energy += 20;
            player.sp += 1;

            console.log(`AI uses BASIC ATTACK`);
        }

        else if (action.type === "skill") {
            damage = action.data.damage;
            player.sp -= action.data.sp_cost;
            player.energy += 25;

            console.log(`AI uses SKILL: ${action.data.name}`);
            console.log(`SP Cost: ${action.data.sp_cost}`);
        }

        else if (action.type === "ultimate") {
            damage = action.data.damage;
            player.energy -= action.data.energy_cost;

            console.log(`AI uses ULTIMATE: ${action.data.name}`);
            console.log(`Energy Cost: ${action.data.energy_cost}`);
        }

        enemy.hp -= damage;

        console.log(`Damage Dealt: ${damage}`);

        if (enemy.hp <= 0) {
            console.log(`${enemy.name} defeated`);
            return true;
        }

        // Enemy attack
        player.hp -= enemy.attack;
        console.log(`Enemy attacks: ${enemy.attack}`);

        if (player.hp <= 0) {
            console.log("Player defeated");
            return false;
        }

        turn++;
    }
}