/**
 * battle-renderer.js
 * Canvas pixel-art renderer untuk bitsmon-battle.html
 */

const W = 700, H = 240;
export let tick = 0;
let _curEnemyName = 'Slime Kecil';
export function setCurEnemyName(name) { _curEnemyName = name; }
export function getCurEnemyName() { return _curEnemyName; }

export const animState = {
    playerX: 160, playerY: 100,
    enemyX: 540, enemyY: 100,
    playerAttacking: false, enemyAttacking: false,
    enemyFlash: 0, playerFlash: 0,
    projectiles: [], popups: [], particles: [],
    ultimateFlash: 0, enemyVisible: true
};

let ctx;

export function initRenderer(canvas) {
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    renderLoop();
}

function px(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

export function getEnemyType(name) {
    if (name.includes('Batu')) return 'slime_rock';
    if (name.includes('Api'))  return 'slime_fire';
    if (name.includes('Raja')) return 'slime_king';
    return 'slime_small';
}

function drawPixelChar(x, y, type, frame, flash) {
    ctx.save();
    const bob = Math.sin(tick * 0.06) * 2;
    if (type === 'player') {
        const f = flash > 0 ? '#ffffff' : null;
        px(x-6,  y+bob-8,  12, 16, f||'#4080ff');
        px(x-8,  y+bob-24, 16, 14, f||'#ffd0a0');
        const hc = f||'#ff4080';
        px(x-10, y+bob-34, 4, 6, hc); px(x-5, y+bob-36, 4, 8, hc);
        px(x,    y+bob-34, 4, 6, hc); px(x+4, y+bob-38, 4, 10, hc);
        px(x+8,  y+bob-34, 3, 6, hc);
        px(x-4,  y+bob-20, 3, 3, '#000'); px(x+2, y+bob-20, 3, 3, '#000');
        if (animState.playerAttacking) {
            px(x+10, y+bob-4, 8, 8, f||'#ffd0a0');
        } else {
            px(x-12, y+bob-2, 6, 8, f||'#ffd0a0');
            px(x+8,  y+bob-2, 6, 8, f||'#ffd0a0');
        }
        px(x-6, y+bob+8, 5, 10, f||'#2040a0');
        px(x+2, y+bob+8, 5, 10, f||'#2040a0');
    } else {
        const fc  = flash > 0 ? '#ffffff' : '#60d060';
        const fc2 = flash > 0 ? '#ffffff' : '#40a040';
        const fc3 = flash > 0 ? '#ffffff' : '#80ff80';
        const wobble = frame === 0 ? 0 : 1;
        px(x-16, y+bob-16+wobble, 32, 18-wobble*2, fc);
        px(x-20, y+bob-8+wobble,  40, 10, fc);
        px(x-14, y+bob-22, 28, 8, fc);
        px(x-8,  y+bob-20, 6, 4, fc3);
        px(x-8,  y+bob-12, 5, 5, '#000'); px(x+4, y+bob-12, 5, 5, '#000');
        px(x-7,  y+bob-11, 2, 2, '#fff'); px(x+5, y+bob-11, 2, 2, '#fff');
        if (flash > 0) px(x-10, y+bob-14, 6, 2, '#ff0000');
        px(x-12, y+bob-2, 24, 4, fc2);
        if (type === 'slime_rock') {
            px(x-10, y+bob-18, 8, 6, '#888'); px(x+2, y+bob-14, 6, 4, '#aaa');
        } else if (type === 'slime_fire') {
            px(x-6, y+bob-26, 4, 8, '#ff8000'); px(x, y+bob-28, 4, 10, '#ffcc00'); px(x+4, y+bob-24, 4, 6, '#ff4000');
        } else if (type === 'slime_king') {
            px(x-14, y+bob-28, 4, 8, '#f0c000'); px(x-8, y+bob-32, 4, 12, '#f0c000');
            px(x-2,  y+bob-28, 4, 8, '#f0c000'); px(x+4, y+bob-32, 4, 12, '#f0c000');
            px(x+8,  y+bob-28, 4, 8, '#f0c000'); px(x-14, y+bob-28, 32, 4, '#f0c000');
            px(x-8,  y+bob-12, 5, 5, '#ff0000'); px(x+4, y+bob-12, 5, 5, '#ff0000');
        }
    }
    ctx.fillStyle = '#00000040';
    ctx.beginPath();
    ctx.ellipse(x, y+12, 20, 5, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
}

function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0820'); grad.addColorStop(1, '#1a1040');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff60';
    for (const [sx,sy] of [[50,20],[120,15],[250,30],[380,12],[480,25],[600,18],[660,35],[30,40],[700,10]])
        ctx.fillRect(sx, sy, 2, 2);
    ctx.fillStyle = '#2a1a3a'; ctx.fillRect(0, H-50, W, 50);
    ctx.fillStyle = '#3a2a4a'; ctx.fillRect(0, H-52, W, 4);
    ctx.fillStyle = '#221433';
    for (let i = 0; i < W; i += 32) ctx.fillRect(i, H-50, 30, 46);
    ctx.fillStyle = '#ffffff20';
    ctx.font = 'bold 28px "Press Start 2P", monospace';
    ctx.textAlign = 'center'; ctx.fillText('VS', W/2, H/2+8); ctx.textAlign = 'left';
}

function drawProjectiles() {
    for (const p of animState.projectiles) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot||0);
        if (p.type === 'diamond') {
            ctx.fillStyle = '#00eeff';
            ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(6,0); ctx.lineTo(0,8); ctx.lineTo(-6,0);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#aaffff';
            ctx.beginPath(); ctx.moveTo(0,-4); ctx.lineTo(3,0); ctx.lineTo(0,4); ctx.lineTo(-3,0);
            ctx.closePath(); ctx.fill();
        } else if (p.type === 'fist') {
            ctx.fillStyle = '#ffd0a0'; ctx.fillRect(-6,-6,12,12);
            ctx.fillStyle = '#ffaa60'; ctx.fillRect(-4,-4,8,8);
        }
        ctx.restore();
    }
}

function drawPopups() {
    for (const p of animState.popups) {
        ctx.save(); ctx.globalAlpha = Math.min(1, p.life/20);
        ctx.font = `bold ${p.big?14:11}px "Press Start 2P", monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000'; ctx.fillText(p.text, p.x+2, p.y-p.rise+2);
        ctx.fillStyle = p.color||'#ffff00'; ctx.fillText(p.text, p.x, p.y-p.rise);
        ctx.restore(); p.rise += 0.8; p.life--;
    }
    animState.popups = animState.popups.filter(p => p.life > 0);
}

function drawParticles() {
    for (const p of animState.particles) {
        ctx.save(); ctx.globalAlpha = p.life/p.maxLife;
        ctx.fillStyle = p.color; ctx.fillRect(p.x-2, p.y-2, p.size, p.size);
        ctx.restore(); p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--;
    }
    animState.particles = animState.particles.filter(p => p.life > 0);
}

function drawUltimateFlash() {
    if (animState.ultimateFlash > 0) {
        ctx.save(); ctx.globalAlpha = animState.ultimateFlash/30*0.7;
        ctx.fillStyle = '#fff8e0'; ctx.fillRect(0,0,W,H);
        ctx.restore(); animState.ultimateFlash--;
    }
}

function renderLoop() {
    tick++;
    const frame = Math.floor(tick/18) % 2;
    ctx.clearRect(0, 0, W, H);
    drawBackground(); drawParticles(); drawUltimateFlash();
    drawPixelChar(animState.playerX, animState.playerY, 'player', frame, animState.playerFlash);
    if (animState.enemyVisible !== false)
        drawPixelChar(animState.enemyX, animState.enemyY, getEnemyType(_curEnemyName), frame, animState.enemyFlash);
    drawProjectiles(); drawPopups();
    if (animState.enemyFlash > 0) animState.enemyFlash--;
    if (animState.playerFlash > 0) animState.playerFlash--;
    for (const p of animState.projectiles) {
        p.x += p.vx; p.y += p.vy;
        if (p.type === 'diamond') p.rot += 0.15;
    }
    animState.projectiles = animState.projectiles.filter(p => p.x < W+20 && p.x > -20);
    requestAnimationFrame(renderLoop);
}

// ── Spawn helpers ─────────────────────────────────────────────────────────────
export function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++)
        animState.particles.push({ x, y:y-10, vx:(Math.random()-.5)*6, vy:-Math.random()*5-1, color, size:3+Math.random()*4, life:20+Math.random()*20, maxLife:40 });
}
export function spawnProjectile(x, y, vx, vy, type) {
    animState.projectiles.push({ x, y, vx, vy, type, rot:0 });
}
export function spawnPopup(x, y, text, color, big) {
    animState.popups.push({ x, y, text, color, big, rise:0, life:40 });
}
