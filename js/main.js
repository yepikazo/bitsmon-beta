import { loadJSON } from './loader.js';
import { battleTurn } from './core/battle.js';

async function run() {

    const player = await loadJSON("./data/player.json");
    const enemy = await loadJSON("./data/enemy.json");

    console.log("PLAYER:", player);
    console.log("ENEMY:", enemy);

    console.log("=== Battle Start ===");

    let turn = 1;

    while (true) {

        console.log("Turn", turn);

        let result = battleTurn(player, enemy);
        console.log(result);

        if (result.result !== "continue") {
            console.log("RESULT:", result.result);
            break;
        }

        turn++;
    }
}

run();