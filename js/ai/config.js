export const AI_MODE = {
    GREEDY: "greedy",
    HYBRID: "hybrid"
};

export let currentMode = AI_MODE.HYBRID;

export function setMode(mode) {
    currentMode = mode;
}