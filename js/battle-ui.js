/**
 * battle-ui.js
 * Game state, battle loop, chart, dan UI controls.
 * Menggunakan data dari data/player.json & data/enemies.json via fetch().
 */

import { chooseAction, setMode, currentMode, AI_MODE } from './battle-ai.js';
import { applyAction } from './battle-ai.js';
import { animState, setCurEnemyName, spawnParticles, spawnProjectile, spawnPopup, initRenderer } from './battle-renderer.js';


// ── Data (di-load dari JSON) ─────────────────────────────────────────────────
let BASE_PLAYER = null;
let ENEMIES     = null;

async function loadData() {
    const [p, e] = await Promise.all([
        fetch('./data/player.json').then(r => r.json()),
        fetch('./data/enemies.json').then(r => r.json())
    ]);
    BASE_PLAYER = p;
    ENEMIES     = e;
}

// ── Game state ───────────────────────────────────────────────────────────────
let player       = null;
let gameRunning  = false;
let gamePaused   = false;
let pauseResolve = null;
let totalDmgDealt = 0;
let turnCount     = 0;
let waveResults   = [];
let dmgHistory    = [];

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function waitFrames(n) {
    return new Promise(r => {
        let c = 0;
        const id = setInterval(() => { if (++c >= n) { clearInterval(id); r(); } }, 16);
    });
}
function checkPause() {
    if (!gamePaused) return Promise.resolve();
    return new Promise(r => { pauseResolve = r; });
}

// ── UI Update ─────────────────────────────────────────────────────────────────
function updatePlayerStats() {
    if (!player) return;
    const maxHp = BASE_PLAYER.hp;
    document.getElementById('bar-php').style.width = Math.max(0, player.hp / maxHp * 100) + '%';
    document.getElementById('val-php').textContent = `${Math.max(0, player.hp)} / ${maxHp}`;
    document.getElementById('bar-ep').style.width  = (player.energy / 100 * 100) + '%';
    document.getElementById('val-ep').textContent  = `${player.energy} / 100`;
    const maxSp = 5;
    document.getElementById('bar-sp').style.width  = Math.min(100, player.sp / maxSp * 100) + '%';
    document.getElementById('val-sp').textContent  = `${player.sp}`;
}

function updateEnemyStats(enemy, maxHp) {
    document.getElementById('enemy-name').textContent  = '▶ ' + enemy.name.toUpperCase();
    document.getElementById('bar-ehp').style.width     = Math.max(0, enemy.hp / maxHp * 100) + '%';
    document.getElementById('val-ehp').textContent     = `${Math.max(0, enemy.hp)} / ${maxHp}`;
    document.getElementById('val-eatk').textContent    = enemy.attack;
    setCurEnemyName(enemy.name);

}

export function addLog(text, cls) {
    const div = document.createElement('div');
    div.className = 'log-line ' + cls;
    div.textContent = text;
    const s = document.getElementById('log-scroll');
    s.appendChild(div);
    s.scrollTop = s.scrollHeight;
}

function initGame() {
    player = structuredClone(BASE_PLAYER);
    gameRunning = false; gamePaused = false;
    totalDmgDealt = 0; turnCount = 0; waveResults = []; dmgHistory = [];
    document.getElementById('log-scroll').innerHTML    = '';
    document.getElementById('val-total-dmg').textContent = '0';
    document.getElementById('val-turn').textContent    = '0';
    document.getElementById('val-action').textContent  = '─';
    document.getElementById('val-dmg').textContent     = '─';
    document.getElementById('player-skill-info').textContent =
        `● Skill: ${BASE_PLAYER.skills.skill.name} (${BASE_PLAYER.skills.skill.damage}dmg, ${BASE_PLAYER.skills.skill.sp_cost}SP)`;
    document.getElementById('player-ult-info').textContent =
        `★ Ult: ${BASE_PLAYER.skills.ultimate.name} (${BASE_PLAYER.skills.ultimate.damage}dmg, ${BASE_PLAYER.skills.ultimate.energy_cost}en)`;
    document.getElementById('player-stat-atk').textContent = BASE_PLAYER.attack;
    for (let i = 0; i < ENEMIES.length; i++) {
        const d = document.getElementById('wd' + i);
        if (d) d.className = 'wave-dot';
    }
    document.getElementById('wave-label').textContent = '─';
    document.getElementById('wave-name').textContent  = '─';
    document.getElementById('enemy-name').textContent = '▶ ENEMY';
    document.getElementById('val-ehp').textContent    = '─';
    document.getElementById('val-eatk').textContent   = '─';
    document.getElementById('bar-ehp').style.width    = '0%';
    animState.enemyVisible = true;
    updatePlayerStats();
    redrawChart();
}

// ── Animations ────────────────────────────────────────────────────────────────
async function animDash(action) {
    const homeX = 160, targetX = animState.enemyX - 60;
    animState.playerAttacking = true;
    if (action.type === 'basic') {
        let x = homeX;
        while (x < targetX) { x = Math.min(x+14, targetX); animState.playerX = x; await waitFrames(1); }
        animState.enemyFlash = 8; spawnParticles(animState.enemyX, animState.enemyY, '#ffffff', 8);
        await waitFrames(6);
        while (x > homeX) { x = Math.max(x-14, homeX); animState.playerX = x; await waitFrames(1); }
    } else if (action.type === 'skill') {
        spawnProjectile(homeX+20, animState.playerY-10, (animState.enemyX-homeX)/18, 0, 'diamond');
        await sleep(300);
        animState.enemyFlash = 10; spawnParticles(animState.enemyX, animState.enemyY, '#00eeff', 12);
        await sleep(200);
    } else if (action.type === 'ultimate') {
        animState.ultimateFlash = 30;
        for (let i = 0; i < 7; i++) {
            spawnProjectile(homeX+20, animState.playerY-10+(i-3)*8, 28, 0, 'fist');
            await sleep(70);
        }
        animState.enemyFlash = 20;
        spawnParticles(animState.enemyX, animState.enemyY, '#ffcc00', 20);
        spawnParticles(animState.enemyX, animState.enemyY, '#ff4000', 10);
        await sleep(500);
    }
    animState.playerAttacking = false; animState.playerX = homeX;
}

async function animEnemyAttack(damage) {
    animState.enemyAttacking = true;
    const homeX = 540, targetX = animState.playerX + 60;
    let x = homeX;
    while (x > targetX) { x = Math.max(x-16, targetX); animState.enemyX = x; await waitFrames(1); }
    animState.playerFlash = 8;
    spawnParticles(animState.playerX, animState.playerY, '#ff4040', 6);
    spawnPopup(animState.playerX, animState.playerY-30, `-${damage}`, '#ff4040', false);
    await waitFrames(6);
    while (x < homeX) { x = Math.min(x+16, homeX); animState.enemyX = x; await waitFrames(1); }
    animState.enemyAttacking = false; animState.enemyX = homeX;
}

async function animEnemyDeath() {
    for (let i = 0; i < 6; i++) { animState.enemyVisible = i % 2 === 0; await sleep(80); }
    spawnParticles(animState.enemyX, animState.enemyY, '#60d060', 16);
    animState.enemyVisible = false; await sleep(400);
    animState.enemyVisible = true; animState.enemyX = 540;
}

// ── Chart ─────────────────────────────────────────────────────────────────────
function drawChartOnCanvas(c, pad, dotR, fontSize) {
    const ctx2 = c.getContext('2d'), W2 = c.width, H2 = c.height;
    ctx2.clearRect(0,0,W2,H2);
    ctx2.fillStyle = '#0a0a1a'; ctx2.fillRect(0,0,W2,H2);
    ctx2.strokeStyle = '#2a2a5a'; ctx2.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = pad + (H2-pad*2)*i/4;
        ctx2.beginPath(); ctx2.moveTo(pad, y); ctx2.lineTo(W2-pad/2, y); ctx2.stroke();
    }
    if (dmgHistory.length < 2) {
        ctx2.fillStyle = '#8080aa'; ctx2.font = `${fontSize}px "Press Start 2P", monospace`;
        ctx2.textAlign = 'center'; ctx2.fillText('NO DATA', W2/2, H2/2); ctx2.textAlign = 'left'; return;
    }
    const max = Math.max(...dmgHistory.map(d => d.damage), 1);
    const xStep = (W2-pad*2) / Math.max(dmgHistory.length-1, 1);
    const colorMap = { basic:'#4080ff', skill:'#00d4aa', ultimate:'#f0c000' };
    ctx2.beginPath(); ctx2.strokeStyle = '#6080ff80'; ctx2.lineWidth = dotR < 4 ? 1 : 3;
    dmgHistory.forEach((d,i) => {
        const x = pad + i*xStep, y = pad + (1-d.damage/max)*(H2-pad*2);
        i === 0 ? ctx2.moveTo(x,y) : ctx2.lineTo(x,y);
    }); ctx2.stroke();
    ctx2.beginPath();
    dmgHistory.forEach((d,i) => {
        const x = pad+i*xStep, y = pad+(1-d.damage/max)*(H2-pad*2);
        i === 0 ? ctx2.moveTo(x,y) : ctx2.lineTo(x,y);
    });
    ctx2.lineTo(pad+(dmgHistory.length-1)*xStep, H2-pad); ctx2.lineTo(pad, H2-pad); ctx2.closePath();
    const grad = ctx2.createLinearGradient(0,0,0,H2);
    grad.addColorStop(0,'#6080ff44'); grad.addColorStop(1,'#6080ff00');
    ctx2.fillStyle = grad; ctx2.fill();
    dmgHistory.forEach((d,i) => {
        const x = pad+i*xStep, y = pad+(1-d.damage/max)*(H2-pad*2);
        ctx2.beginPath(); ctx2.arc(x,y,dotR,0,Math.PI*2);
        ctx2.fillStyle = colorMap[d.type]||'#aaaaff'; ctx2.fill();
        if (dotR > 3) { ctx2.strokeStyle = '#ffffff44'; ctx2.lineWidth=2; ctx2.stroke(); }
    });
    ctx2.fillStyle = '#8080aa'; ctx2.font = `${fontSize}px "Press Start 2P", monospace`;
    ctx2.fillText(max, 0, pad+6);
}

function redrawChart() {
    drawChartOnCanvas(document.getElementById('dmgChart'), 8, 3, 6);
    redrawChartMain();
}

function redrawChartMain() {
    const c = document.getElementById('dmgChartMain'); if (!c) return;
    const ctx2 = c.getContext('2d'), W2 = c.width, H2 = c.height;
    ctx2.clearRect(0,0,W2,H2); ctx2.fillStyle='#0a0a1a'; ctx2.fillRect(0,0,W2,H2);
    ctx2.strokeStyle='#2a2a5a'; ctx2.lineWidth=1;
    for (let i=0;i<=6;i++){const y=20+(H2-40)*i/6;ctx2.beginPath();ctx2.moveTo(20,y);ctx2.lineTo(W2-20,y);ctx2.stroke();}
    if (dmgHistory.length < 1) {
        ctx2.fillStyle='#8080aa'; ctx2.font='14px "Press Start 2P", monospace';
        ctx2.textAlign='center'; ctx2.fillText('WAITING FOR DAMAGE DATA',W2/2,H2/2); ctx2.textAlign='left'; return;
    }
    const max=Math.max(...dmgHistory.map(d=>d.damage),1);
    const xStep=(W2-40)/Math.max(dmgHistory.length-1,1);
    const colorMap={basic:'#4080ff',skill:'#00d4aa',ultimate:'#f0c000'};
    ctx2.beginPath(); ctx2.strokeStyle='#6080ff99'; ctx2.lineWidth=3;
    dmgHistory.forEach((d,i)=>{const x=20+i*xStep,y=20+(1-d.damage/max)*(H2-40);i===0?ctx2.moveTo(x,y):ctx2.lineTo(x,y);}); ctx2.stroke();
    ctx2.beginPath();
    dmgHistory.forEach((d,i)=>{const x=20+i*xStep,y=20+(1-d.damage/max)*(H2-40);i===0?ctx2.moveTo(x,y):ctx2.lineTo(x,y);});
    ctx2.lineTo(20+(dmgHistory.length-1)*xStep,H2-20); ctx2.lineTo(20,H2-20); ctx2.closePath();
    const grad=ctx2.createLinearGradient(0,0,0,H2); grad.addColorStop(0,'#6080ff55'); grad.addColorStop(1,'#6080ff00');
    ctx2.fillStyle=grad; ctx2.fill();
    dmgHistory.forEach((d,i)=>{const x=20+i*xStep,y=20+(1-d.damage/max)*(H2-40);ctx2.beginPath();ctx2.arc(x,y,6,0,Math.PI*2);ctx2.fillStyle=colorMap[d.type]||'#aaaaff';ctx2.fill();ctx2.strokeStyle='#ffffff44';ctx2.lineWidth=2;ctx2.stroke();});
    ctx2.fillStyle='#8080aa'; ctx2.font='10px "Press Start 2P", monospace'; ctx2.textAlign='right';
    for(let i=0;i<=5;i++){const val=Math.floor(max*(5-i)/5);ctx2.fillText(val,12,20+(H2-40)*i/5+4);}
    ctx2.textAlign='center'; ctx2.font='9px "Press Start 2P", monospace';
    const step=Math.max(1,Math.floor(dmgHistory.length/10));
    for(let i=0;i<dmgHistory.length;i+=step)ctx2.fillText((i+1),20+i*xStep,H2-4);
    ctx2.textAlign='left'; ctx2.font='8px "Press Start 2P", monospace';
    ctx2.fillStyle='#4080ff'; ctx2.fillText('● BASIC', W2-250,20);
    ctx2.fillStyle='#00d4aa'; ctx2.fillText('● SKILL', W2-150,20);
    ctx2.fillStyle='#f0c000'; ctx2.fillText('● ULTIMATE', W2-50,20);
}

// ── Main Battle Loop ──────────────────────────────────────────────────────────
async function runCampaign() {
    for (let wi = 0; wi < ENEMIES.length; wi++) {
        const enemy = structuredClone(ENEMIES[wi]);
        const maxHp = enemy.hp;
        const nextE = ENEMIES[wi+1] ?? null;
        const nextEHp  = nextE?.hp     ?? 0;
        const nextEAtk = nextE?.attack ?? 0;
        setCurEnemyName(enemy.name);


        for (let i = 0; i < ENEMIES.length; i++) {
            const d = document.getElementById('wd'+i);
            if (d) d.className = 'wave-dot' + (i < wi ? ' done' : i === wi ? ' active' : '');
        }
        document.getElementById('wave-label').textContent = `WAVE ${wi+1}/${ENEMIES.length}`;
        document.getElementById('wave-name').textContent  = enemy.name.toUpperCase();
        addLog(`━━ WAVE ${wi+1}: ${enemy.name.toUpperCase()} ━━`, 'log-wave');
        addLog(`HP: ${enemy.hp}  ATK: ${enemy.attack}`, 'log-system');
        updateEnemyStats(enemy, maxHp);
        animState.enemyVisible = true; animState.enemyX = 540;
        await sleep(600);

        const waveDmgLog = []; let wTurn = 1;

        while (enemy.hp > 0 && player.hp > 0) {
            await checkPause();
            turnCount++;
            document.getElementById('val-turn').textContent = wTurn;

            const action = chooseAction(player, enemy, nextEHp, nextEAtk);
            await animDash(action);
            await checkPause();

            const damage = applyAction(player, enemy, action);
            totalDmgDealt += damage;

            const popColor = action.type==='basic' ? '#aaccff' : action.type==='skill' ? '#00d4aa' : '#f0c000';
            spawnPopup(animState.enemyX, animState.enemyY-40, `${damage}`, popColor, action.type==='ultimate');
            dmgHistory.push({ turn: dmgHistory.length+1, damage, type: action.type });
            waveDmgLog.push({ turn: wTurn, action, damage });

            const aNames = { basic:'⚔ Basic Attack', skill:`◆ ${action.data?.name||''}`, ultimate:`★ ${action.data?.name||''}` };
            const aClass = { basic:'log-basic', skill:'log-skill', ultimate:'log-ultimate' };
            addLog(`[T${wTurn}] ${aNames[action.type]} → ${damage} DMG`, aClass[action.type]);

            updateEnemyStats(enemy, maxHp); updatePlayerStats();
            document.getElementById('val-action').textContent    = aNames[action.type];
            document.getElementById('val-dmg').textContent       = damage;
            document.getElementById('val-total-dmg').textContent = totalDmgDealt;
            redrawChart();

            await sleep(300); await checkPause();
            if (enemy.hp <= 0) break;

            const eDmg = enemy.attack;
            player.hp -= eDmg; player.hp = Math.max(0, player.hp);
            addLog(`  ◀ ${enemy.name} attacks: ${eDmg} DMG`, 'log-enemy');
            await animEnemyAttack(eDmg);
            updatePlayerStats();
            await sleep(200); await checkPause();
            if (player.hp <= 0) break;
            wTurn++;
        }

        const overkill = Math.max(0, totalDmgDealt - maxHp);
        if (enemy.hp <= 0) {
            addLog(`✓ ${enemy.name} defeated! (${wTurn} turns)`, 'log-win');
            await animEnemyDeath();
            waveResults.push({ won:true, enemyName:enemy.name, totalDamage:waveDmgLog.reduce((s,e)=>s+e.damage,0), overkill, damageLog:waveDmgLog, enemyMaxHp:maxHp });
            document.getElementById('wd'+wi).className = 'wave-dot done';
            await sleep(500);
        } else {
            addLog(`✗ GAME OVER — Player defeated!`, 'log-lose');
            document.getElementById('wd'+wi).className = 'wave-dot fail';
            waveResults.push({ won:false, enemyName:enemy.name, totalDamage:waveDmgLog.reduce((s,e)=>s+e.damage,0), overkill, damageLog:waveDmgLog, enemyMaxHp:maxHp });
            showScore(false, wi+1); endGame(); return;
        }
    }
    addLog('★ ALL WAVES CLEARED! ★', 'log-win');
    showScore(true, ENEMIES.length); endGame();
}

function endGame() {
    gameRunning = false; gamePaused = false;
    document.getElementById('btn-start').disabled   = false;
    document.getElementById('btn-start').textContent = '▶ RESTART';
    document.getElementById('btn-pause').disabled    = true;
}

// ── Score ─────────────────────────────────────────────────────────────────────
function showScore(won, waves) {
    const wavesC = won ? waves : waves - 1;
    const score  = wavesC*100 + Math.max(0,player.hp)*2 + player.energy + player.sp*8;
    document.getElementById('sc-waves').textContent = `${wavesC} / ${ENEMIES.length}`;
    document.getElementById('sc-hp').textContent    = player.hp;
    document.getElementById('sc-en').textContent    = player.energy;
    document.getElementById('sc-sp').textContent    = player.sp;
    document.getElementById('sc-total').textContent = score;
    document.getElementById('sc-mode').textContent  = `Mode: ${currentMode.toUpperCase()}`;
    document.getElementById('score-title').textContent = won ? '🏆 VICTORY! 🏆' : '💀 GAME OVER';
    document.getElementById('score-title').style.color = won ? 'var(--accent)' : 'var(--red)';
    document.getElementById('chart-main').classList.add('show');
    document.getElementById('score-modal').classList.add('show');
    redrawChartMain();
    setTimeout(() => document.getElementById('score-modal').scrollIntoView({ behavior:'smooth', block:'center' }), 300);
}

// ── Exported UI handlers (dipanggil dari HTML) ────────────────────────────────
export function selectMode(m) {
    setMode(m);
    document.getElementById('btn-greedy').className = 'mode-btn' + (m==='greedy'?' selected':'');
    document.getElementById('btn-hybrid').className = 'mode-btn' + (m==='hybrid'?' selected':'');
}

export function startBattle() {
    if (gameRunning) return;
    initGame(); gameRunning = true; gamePaused = false;
    document.getElementById('btn-start').disabled    = true;
    document.getElementById('btn-pause').disabled    = false;
    document.getElementById('btn-pause').textContent = '⏸ PAUSE';
    addLog(`>>> AUTO-BATTLE START (${currentMode.toUpperCase()}) <<<`, 'log-system');
    runCampaign();
}

export function togglePause() {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
    document.getElementById('btn-pause').textContent = gamePaused ? '▶ RESUME' : '⏸ PAUSE';
    if (!gamePaused && pauseResolve) { pauseResolve(); pauseResolve = null; }
}

export function closeScore() {
    document.getElementById('score-modal').classList.remove('show');
    document.getElementById('chart-main').classList.remove('show');
    initGame();
    document.getElementById('btn-start').disabled    = false;
    document.getElementById('btn-start').textContent = '▶ START';
    document.getElementById('btn-pause').disabled    = true;
}

export function toggleTutorial() {
    const b = document.getElementById('tutorial-body');
    const a = document.getElementById('tut-arrow');
    const open = b.classList.toggle('open');
    a.textContent = open ? '▲' : '▼';
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function bootstrap() {
    await loadData();
    initRenderer(document.getElementById('battleCanvas'));
    initGame();
    // expose handlers ke window agar onclick di HTML bisa memanggil
    window.selectMode   = selectMode;
    window.startBattle  = startBattle;
    window.togglePause  = togglePause;
    window.closeScore   = closeScore;
    window.toggleTutorial = toggleTutorial;
}

bootstrap();
