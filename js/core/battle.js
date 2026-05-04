/**
 * battle.js
 * Loop pertarungan per wave.
 * Mengembalikan waveResult berisi log damage per giliran, total damage, dan overkill.
 * Result ditampilkan di akhir oleh main.js setelah semua wave selesai.
 */

import { chooseAction } from '../ai/decision.js';

export function runBattle(player, enemy, nextEnemyHp = 0, nextEnemyAtk = 0) {

    let turn = 1;
    const damageLog = [];   // { turn, action, damage }
    let totalDamage = 0;
    const enemyMaxHp = enemy.hp;

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
        let actionLabel = '';

        if (action.type === 'basic') {
            damage         = player.attack;
            player.energy += 20;
            player.sp     += 1;
            actionLabel    = 'Basic Attack';
            console.log(`  → AI: BASIC ATTACK  (+20 energy, +1 SP)`);
        }
        else if (action.type === 'skill') {
            damage         = action.data.damage;
            player.sp     -= action.data.sp_cost;
            player.energy += 25;
            actionLabel    = `Skill (${action.data.name})`;
            console.log(`  → AI: SKILL [${action.data.name}]  (-${action.data.sp_cost} SP, +25 energy)`);
            if (damage - enemy.hp > 20)
                console.log(`    ⚠ Overkill ${damage - enemy.hp} poin — HP musuh hanya ${enemy.hp}`);
        }
        else if (action.type === 'ultimate') {
            damage         = action.data.damage;
            player.energy -= action.data.energy_cost;
            actionLabel    = `Ultimate (${action.data.name})`;
            console.log(`  → AI: ULTIMATE [${action.data.name}]  (-${action.data.energy_cost} energy)`);
            if (player.attack >= enemy.hp)
                console.log(`    ⚠ PEMBOROSAN — basic attack (${player.attack}) sudah cukup (HP musuh ${enemy.hp})`);
            else if (player.skills?.skill?.damage >= enemy.hp && player.sp >= player.skills?.skill?.sp_cost)
                console.log(`    ⚠ PEMBOROSAN — skill sudah cukup (damage ${player.skills.skill.damage} vs HP ${enemy.hp})`);
            else if (damage - enemy.hp > 30)
                console.log(`    ⚠ Overkill ${damage - enemy.hp} poin`);
        }

        enemy.hp    -= damage;
        if (enemy.hp < 0) enemy.hp = 0;
        totalDamage += damage;
        damageLog.push({ turn, action: actionLabel, damage });

        console.log(`  Damage: ${damage}  |  Sisa HP musuh: ${enemy.hp}`);

        if (enemy.hp <= 0) {
            console.log(`  ✓ ${enemy.name} DIKALAHKAN!`);
            console.log(`  Resource tersisa → Energy:${player.energy}  SP:${player.sp}  HP:${player.hp}`);
            return {
                won        : true,
                enemyName  : enemy.name,
                enemyMaxHp,
                totalDamage,
                overkill   : totalDamage - enemyMaxHp,
                damageLog,
            };
        }

        player.hp -= enemy.attack;
        if (player.hp < 0) player.hp = 0;
        console.log(`  ✗ ${enemy.name} menyerang: ${enemy.attack}  →  HP player: ${player.hp}`);

        if (player.hp <= 0) {
            console.log(`\n  ✗ PLAYER KALAH`);
            return {
                won        : false,
                enemyName  : enemy.name,
                enemyMaxHp,
                totalDamage,
                overkill   : Math.max(0, totalDamage - enemyMaxHp),
                damageLog,
            };
        }

        turn++;
    }
}
