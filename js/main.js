import { loadJSON } from './loader.js';
import { runBattle } from './core/battle.js';
import { setMode, AI_MODE } from './ai/config.js';

async function run() {

    const basePlayer = await loadJSON("./data/player.json");
    const enemies = await loadJSON("./data/enemies.json");

    // for (let mode of [AI_MODE.GREEDY, AI_MODE.HYBRID]) {
    let mode = AI_MODE.HYBRID

        console.log(`\n======================`);
        console.log(`MODE: ${mode}`);
        console.log(`======================`);

        setMode(mode);

        let player = structuredClone(basePlayer);

        for (let enemyData of enemies) {

            let enemy = structuredClone(enemyData);

            let result = runBattle(player, enemy);

            if (!result) {
                console.log("GAME OVER");
                break;
            }
        }
    // }
}

run();