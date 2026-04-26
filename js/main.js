/**
 * main.js
 *
 * Usage:
 *   node js/main.js              → perbandingan GREEDY vs HYBRID (default)
 *   node js/main.js --compare    → sama
 *   node js/main.js --mode greedy
 *   node js/main.js --mode hybrid
 */

import { loadJSON } from './loader.js';
import { runBattle } from './core/battle.js';
import { setMode, AI_MODE } from './ai/config.js';

const args       = process.argv.slice(2);
const modeArg    = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : null;
const compareMode = !modeArg || args.includes('--compare');

async function runCampaign(mode, basePlayer, enemies) {

    console.log(`\n${'═'.repeat(44)}`);
    console.log(`  MODE: ${mode.toUpperCase()}`);
    console.log(`${'═'.repeat(44)}`);

    setMode(mode);
    const player = structuredClone(basePlayer);

    for (let i = 0; i < enemies.length; i++) {
        const enemy        = structuredClone(enemies[i]);
        const next         = enemies[i + 1] ?? null;
        const nextEnemyHp  = next ? next.hp     : 0;
        const nextEnemyAtk = next ? next.attack  : 0;

        const result = runBattle(player, enemy, nextEnemyHp, nextEnemyAtk);

        if (!result) {
            console.log(`\n  ✗ GAME OVER pada wave ${i + 1} (${enemy.name})`);
            return { won: false, wavesCleared: i, finalHp: 0, finalEnergy: player.energy, finalSp: player.sp };
        }
    }

    console.log(`\n╔══════════════════════════════╗`);
    console.log(`  🏆 SEMUA WAVE SELESAI!`);
    console.log(`  HP akhir    : ${player.hp}`);
    console.log(`  Energy akhir: ${player.energy}`);
    console.log(`  SP akhir    : ${player.sp}`);
    console.log(`╚══════════════════════════════╝`);

    return { won: true, wavesCleared: enemies.length, finalHp: player.hp, finalEnergy: player.energy, finalSp: player.sp };
}

async function run() {

    const basePlayer = await loadJSON('./data/player.json');
    const enemies    = await loadJSON('./data/enemies.json');

    if (compareMode) {

        console.log(`\n${'#'.repeat(44)}`);
        console.log(`  BITSMON — GREEDY vs HYBRID`);
        console.log(`${'#'.repeat(44)}`);

        const gr = await runCampaign(AI_MODE.GREEDY, basePlayer, enemies);
        const hy = await runCampaign(AI_MODE.HYBRID, basePlayer, enemies);

        const grScore = gr.wavesCleared * 100 + gr.finalHp * 2 + gr.finalEnergy + gr.finalSp * 8;
        const hyScore = hy.wavesCleared * 100 + hy.finalHp * 2 + hy.finalEnergy + hy.finalSp * 8;

        console.log(`\n${'═'.repeat(44)}`);
        console.log(`  RINGKASAN PERBANDINGAN`);
        console.log(`${'═'.repeat(44)}`);
        console.log(`  ${'Metrik'.padEnd(22)} ${'GREEDY'.padEnd(10)} HYBRID`);
        console.log(`  ${'-'.repeat(40)}`);
        console.log(`  ${'Wave Selesai'.padEnd(22)} ${String(gr.wavesCleared).padEnd(10)} ${hy.wavesCleared}`);
        console.log(`  ${'HP Akhir'.padEnd(22)} ${String(gr.finalHp).padEnd(10)} ${hy.finalHp}`);
        console.log(`  ${'Energy Akhir'.padEnd(22)} ${String(gr.finalEnergy).padEnd(10)} ${hy.finalEnergy}`);
        console.log(`  ${'SP Akhir'.padEnd(22)} ${String(gr.finalSp).padEnd(10)} ${hy.finalSp}`);
        console.log(`  ${'-'.repeat(40)}`);
        console.log(`  ${'Skor Total'.padEnd(22)} ${String(grScore).padEnd(10)} ${hyScore}`);
        console.log(`  (wave×100 + HP×2 + Energy + SP×8)`);
        console.log(`  ${'-'.repeat(40)}`);

        if (hyScore > grScore) {
            console.log(`\n  ✓ HYBRID UNGGUL  (+${hyScore - grScore} poin)`);
            console.log(`    HP lebih tinggi : ${hy.finalHp} vs ${gr.finalHp} (${hy.finalHp >= gr.finalHp ? '+' : ''}${hy.finalHp - gr.finalHp})`);
            console.log(`    Energy tersisa  : ${hy.finalEnergy} vs ${gr.finalEnergy}`);
        } else if (grScore > hyScore) {
            console.log(`\n  ✓ GREEDY UNGGUL  (+${grScore - hyScore} poin)`);
        } else {
            console.log(`\n  ═ SERI`);
        }

        console.log(`${'═'.repeat(44)}\n`);

    } else {
        const mode = modeArg === 'greedy' ? AI_MODE.GREEDY : AI_MODE.HYBRID;
        await runCampaign(mode, basePlayer, enemies);
    }
}

run();
