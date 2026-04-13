// belum dipake

export function chooseAction(player) {

    if (player.energy >= 100) {
        return { type: "ultimate" };
    }

    if (player.sp > 0) {
        let best = null;
        let bestValue = 0;

        player.skills.forEach(skill => {
            let value = skill.damage / skill.cost;

            if (value > bestValue) {
                bestValue = value;
                best = skill;
            }
        });

        return { type: "skill", skill: best };
    }

    return { type: "basic" };
}