/**
 * battle-ai.js
 * AI engine untuk bitsmon-battle.html
 * Logika identik dengan js/ai/config.js + js/ai/helper.js + js/ai/decision.js
 */

// ── Config (dari js/ai/config.js) ────────────────────────────────────────────
export const AI_MODE = { GREEDY: "greedy", HYBRID: "hybrid" };
export let currentMode = AI_MODE.HYBRID;
export function setMode(m) { currentMode = m; }

// ── Helper (dari js/ai/helper.js) ────────────────────────────────────────────
const BUCKET_SIZE = 5;
function bucket(v) { return Math.floor(v / BUCKET_SIZE) * BUCKET_SIZE; }

export function getPossibleActions(player) {
    const a = [{ type: "basic" }];
    if (player.sp >= player.skills.skill.sp_cost)
        a.push({ type: "skill", data: player.skills.skill });
    if (player.energy >= player.skills.ultimate.energy_cost)
        a.push({ type: "ultimate", data: player.skills.ultimate });
    return a;
}

export function evaluateImmediate(action, player, enemy) {
    if (action.type === "basic") return player.attack;
    if (player.attack >= enemy.hp) return player.attack - 1;
    return action.data.damage;
}

export function applyAction(player, enemy, action) {
    let dmg = 0;
    if (action.type === "basic") {
        dmg = player.attack; player.energy += 30; player.sp += 1;
    } else if (action.type === "skill") {
        dmg = action.data.damage; player.sp -= action.data.sp_cost; player.energy += 10;
    } else if (action.type === "ultimate") {
        dmg = action.data.damage; player.energy -= action.data.energy_cost;
    }
    enemy.hp -= dmg;
    player.sp = Math.max(0, player.sp);
    player.energy = Math.max(0, player.energy);
    enemy.hp = Math.max(0, enemy.hp);
    return dmg;
}

function evaluateState(player, enemyHp, nextEHp, nextEAtk) {
    if (player.hp <= 0) return -99999;
    let est = player.hp;
    if (enemyHp > 0) {
        const t = Math.ceil(enemyHp / Math.max(player.attack, 1));
        est = player.hp - t * 3;
    }
    const HP_W  = 5.0;
    const EN_W  = nextEHp > 0 ? (nextEAtk >= 25 ? 0.6 : 0.35) : 0.0;
    const SP_W  = nextEHp > 0 ? (nextEAtk >= 25 ? 5.0 : 3.0)  : 0.0;
    return Math.max(0, est) * HP_W + player.energy * EN_W + player.sp * SP_W;
}

function makeKey(player, enemyHp, depth) {
    return `${bucket(player.hp)}|${bucket(player.sp)}|${bucket(player.energy)}|${bucket(enemyHp)}|${depth}`;
}

export function dpSearch(player, enemy, depth, nextEHp = 0, nextEAtk = 0, memo = new Map()) {
    if (enemy.hp <= 0) return evaluateState(player, 0, nextEHp, nextEAtk);
    if (player.hp <= 0) return -99999;
    if (depth === 0) return evaluateState(player, enemy.hp, nextEHp, nextEAtk);
    const key = makeKey(player, enemy.hp, depth);
    if (memo.has(key)) return memo.get(key);
    const actions = getPossibleActions(player);
    let best = -Infinity;
    for (const action of actions) {
        const p = structuredClone(player), e = structuredClone(enemy);
        applyAction(p, e, action);
        let score;
        if (e.hp <= 0) {
            score = evaluateState(p, 0, nextEHp, nextEAtk);
        } else {
            p.hp -= e.attack;
            score = p.hp <= 0 ? -99999 : dpSearch(p, e, depth - 1, nextEHp, nextEAtk, memo);
        }
        if (score > best) best = score;
    }
    memo.set(key, best);
    return best;
}

// ── Decision (dari js/ai/decision.js) ────────────────────────────────────────
const SEARCH_DEPTH = 4;

export function chooseAction(player, enemy, nextEHp = 0, nextEAtk = 0) {
    const actions = getPossibleActions(player);
    if (currentMode === AI_MODE.GREEDY) {
        return actions
            .map((a, i) => ({ action: a, value: evaluateImmediate(a, player, enemy), index: i }))
            .sort((a, b) => b.value - a.value || a.index - b.index)[0].action;
    }
    const memo = new Map();
    let bestAction = actions[0], bestScore = -Infinity;
    for (const action of actions) {
        const p = structuredClone(player), e = structuredClone(enemy);
        applyAction(p, e, action);
        let score;
        if (e.hp <= 0) {
            score = dpSearch(p, e, 0, nextEHp, nextEAtk, memo);
        } else {
            p.hp -= e.attack;
            score = p.hp <= 0 ? -99999 : dpSearch(p, e, SEARCH_DEPTH - 1, nextEHp, nextEAtk, memo);
        }
        if (score > bestScore) { bestScore = score; bestAction = action; }
    }
    return bestAction;
}
