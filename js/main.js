/**
 * main.js
 *
 * Usage:
 *   node js/main.js              → perbandingan GREEDY vs HYBRID (default)
 *   node js/main.js --compare    → sama
 *   node js/main.js --mode greedy
 *   node js/main.js --mode hybrid
 */

import { loadJSON }   from './loader.js';
import { runBattle }  from './core/battle.js';
import { setMode, AI_MODE } from './ai/config.js';

const args        = process.argv.slice(2);
const modeArg     = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : null;
const compareMode = !modeArg || args.includes('--compare');

// ── Cetak tabel result akhir ─────────────────────────────────────────────────
function printFinalResult(waveResults) {
    // Kumpulkan semua nilai terlebih dahulu untuk menghitung lebar kolom secara dinamis
    let grandTotal    = 0;
    let grandOverkill = 0;
    for (const wr of waveResults) {
        grandTotal    += wr.totalDamage;
        grandOverkill += wr.overkill;
    }

    // Hitung lebar setiap kolom dari nilai aktual + header
    const W_WAVE = Math.max(
        'Wave'.length,
        ...waveResults.map(wr => wr.enemyName.length)
    );

    const W_TURN = Math.max(
        'Giliran'.length,
        ...waveResults.flatMap(wr => wr.damageLog.map(l => String(l.turn).length))
    );

    const W_ACTION = Math.max(
        'Aksi'.length,
        'Total Damage'.length,
        'HP Musuh'.length,
        'Overkill'.length,
        ...waveResults.flatMap(wr => wr.damageLog.map(l => l.action.length))
    );

    const W_DMG = Math.max(
        'Damage'.length,
        ...waveResults.flatMap(wr => wr.damageLog.map(l => String(l.damage).length)),
        ...waveResults.map(wr => String(wr.totalDamage).length),
        ...waveResults.map(wr => String(wr.enemyMaxHp).length),
        ...waveResults.map(wr => String(wr.overkill).length),
        String(grandTotal).length,
        String(grandOverkill).length
    );

    const TOTAL_W  = W_WAVE + W_TURN + W_ACTION + W_DMG + 3; // 3 pemisah kolom
    const LABEL_W  = W_WAVE + W_TURN + W_ACTION + 1;         // lebar label grand total

    const line  = '─'.repeat(TOTAL_W);
    const dline = '═'.repeat(TOTAL_W);

    console.log(`\n${'═'.repeat(TOTAL_W)}`);
    console.log(` RESULT — DAMAGE PER GILIRAN PEMAIN`);
    console.log(dline);
    console.log(
        ` ${'Wave'.padEnd(W_WAVE)} ${'Giliran'.padEnd(W_TURN)} ${'Aksi'.padEnd(W_ACTION)} ${'Damage'.padStart(W_DMG)}`
    );
    console.log(` ${line}`);

    for (const wr of waveResults) {
        for (const log of wr.damageLog) {
            const waveName = log.turn === 1 ? wr.enemyName : '';
            console.log(
                ` ${waveName.padEnd(W_WAVE)} ${String(log.turn).padEnd(W_TURN)} ${log.action.padEnd(W_ACTION)} ${String(log.damage).padStart(W_DMG)}`
            );
        }

        // Subtotal per wave
        console.log(` ${line}`);
        console.log(
            ` ${' '.repeat(W_WAVE)} ${''.padEnd(W_TURN)} ${'Total Damage'.padEnd(W_ACTION)} ${String(wr.totalDamage).padStart(W_DMG)}`
        );
        console.log(
            ` ${' '.repeat(W_WAVE)} ${''.padEnd(W_TURN)} ${'HP Musuh'.padEnd(W_ACTION)} ${String(wr.enemyMaxHp).padStart(W_DMG)}`
        );
        console.log(
            ` ${' '.repeat(W_WAVE)} ${''.padEnd(W_TURN)} ${'Overkill'.padEnd(W_ACTION)} ${String(wr.overkill).padStart(W_DMG)}`
        );

        if (wr !== waveResults[waveResults.length - 1])
            console.log(` ${line}`);
    }

    console.log(` ${dline}`);
    console.log(
        ` ${'GRAND TOTAL DAMAGE'.padEnd(LABEL_W)} ${String(grandTotal).padStart(W_DMG)}`
    );
    console.log(
        ` ${'GRAND TOTAL OVERKILL'.padEnd(LABEL_W)} ${String(grandOverkill).padStart(W_DMG)}`
    );
    console.log(` ${dline}\n`);
}

// ── Jalankan satu kampanye ────────────────────────────────────────────────────
async function runCampaign(mode, basePlayer, enemies) {

    console.log(`\n${'═'.repeat(44)}`);
    console.log(`  MODE: ${mode.toUpperCase()}`);
    console.log(`${'═'.repeat(44)}`);

    setMode(mode);
    const player      = structuredClone(basePlayer);
    const waveResults = [];

    for (let i = 0; i < enemies.length; i++) {
        const enemy        = structuredClone(enemies[i]);
        const next         = enemies[i + 1] ?? null;
        const nextEnemyHp  = next ? next.hp     : 0;
        const nextEnemyAtk = next ? next.attack  : 0;

        const result = runBattle(player, enemy, nextEnemyHp, nextEnemyAtk);
        waveResults.push(result);

        if (!result.won) {
            console.log(`\n  ✗ GAME OVER pada wave ${i + 1} (${enemy.name})`);
            printFinalResult(waveResults);
            return { won: false, wavesCleared: i, finalHp: 0, finalEnergy: player.energy, finalSp: player.sp };
        }
    }

    console.log(`\n╔══════════════════════════════╗`);
    console.log(`  🏆 SEMUA WAVE SELESAI!`);
    console.log(`  HP akhir    : ${player.hp}`);
    console.log(`  Energy akhir: ${player.energy}`);
    console.log(`  SP akhir    : ${player.sp}`);
    console.log(`╚══════════════════════════════╝`);

    printFinalResult(waveResults);

    return { won: true, wavesCleared: enemies.length, finalHp: player.hp, finalEnergy: player.energy, finalSp: player.sp };
}

// ── Entry point ───────────────────────────────────────────────────────────────
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