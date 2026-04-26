/**
 * battle.js
 * Loop pertarungan per wave.
 *
 * Perubahan:
 *   - Meneruskan nextEnemyAtk ke chooseAction agar hybrid tahu
 *     seberapa berbahaya wave berikutnya (tidak hanya HP-nya).
 *   - Log mencatat alasan keputusan: overkill warning, resource warning.
 */

import { chooseAction } from '../ai/decision.js';

/**
 * @param player        State player (dimutasi langsung)
 * @param enemy         State musuh (dimutasi langsung)
 * @param nextEnemyHp   HP musuh berikutnya  (0 = wave terakhir)
 * @param nextEnemyAtk  ATK musuh berikutnya (0 = wave terakhir)
 */
export function runBattle(player, enemy, nextEnemyHp = 0, nextEnemyAtk = 0) {

    let turn = 1;

    console.log(`\n╔══════════════════════════════╗`);
    console.log(`  ⚔  VS ${enemy.name.toUpperCase()}`);
    if (nextEnemyHp > 0) {
        console.log(`  ↳ Wave berikutnya: HP ${nextEnemyHp} | ATK ${nextEnemyAtk}`);
    } else {
        console.log(`  ↳ (Wave terakhir)`);
    }
    console.log(`╚══════════════════════════════╝`);

    while (true) {

        console.log(`\n─── Turn ${turn} ─────────────────────`);
        console.log(`  Player  HP:${player.hp}  SP:${player.sp}  Energy:${player.energy}`);
        console.log(`  Musuh   HP:${enemy.hp}  ATK:${enemy.attack}`);

        const action = chooseAction(player, enemy, nextEnemyHp, nextEnemyAtk);

        let damage = 0;

        if (action.type === "basic") {
            damage          = player.attack;
            player.energy  += 20;
            player.sp      += 1;
            console.log(`  → AI: BASIC ATTACK  (+20 energy, +1 SP)`);
        }
        else if (action.type === "skill") {
            damage          = action.data.damage;
            player.sp      -= action.data.sp_cost;
            player.energy  += 25;
            console.log(`  → AI: SKILL [${action.data.name}]  (-${action.data.sp_cost} SP, +25 energy)`);

            const overkill = damage - enemy.hp;
            if (overkill > 20) {
                console.log(`    ⚠ Overkill ${overkill} poin — HP musuh hanya ${enemy.hp}`);
            }
        }
        else if (action.type === "ultimate") {
            damage          = action.data.damage;
            player.energy  -= action.data.energy_cost;
            console.log(`  → AI: ULTIMATE [${action.data.name}]  (-${action.data.energy_cost} energy)`);

            const overkill = damage - enemy.hp;
            if (player.attack >= enemy.hp) {
                console.log(`    ⚠ PEMBOROSAN — basic attack (${player.attack}) sudah cukup membunuh musuh (HP ${enemy.hp})`);
            } else if (player.skills?.skill?.damage >= enemy.hp && player.sp >= player.skills?.skill?.sp_cost) {
                console.log(`    ⚠ PEMBOROSAN — skill sudah cukup (damage ${player.skills.skill.damage} vs HP ${enemy.hp})`);
            } else if (overkill > 30) {
                console.log(`    ⚠ Overkill ${overkill} poin`);
            }
        }

        enemy.hp -= damage;
        if (enemy.hp < 0) enemy.hp = 0;

        console.log(`  Damage: ${damage}  |  Sisa HP musuh: ${enemy.hp}`);

        if (enemy.hp <= 0) {
            console.log(`  ✓ ${enemy.name} DIKALAHKAN!`);
            console.log(`  Resource tersisa → Energy:${player.energy}  SP:${player.sp}  HP:${player.hp}`);
            return true;
        }

        player.hp -= enemy.attack;
        if (player.hp < 0) player.hp = 0;
        console.log(`  ✗ ${enemy.name} menyerang: ${enemy.attack}  →  HP player: ${player.hp}`);

        if (player.hp <= 0) {
            console.log(`\n  ✗ PLAYER KALAH`);
            return false;
        }

        turn++;
    }
}
