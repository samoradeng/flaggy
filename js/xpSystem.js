class XPSystem {
    constructor() {
        this.xp = parseInt(localStorage.getItem('totalXP') || '0');
        this.level = this.calculateLevel(this.xp);
    }

    calculateLevel(xp) {
        let level = 1;
        let requiredXP = 0;
        
        while (xp >= requiredXP + this.getXPForNextLevel(level)) {
            requiredXP += this.getXPForNextLevel(level);
            level++;
        }
        
        return level;
    }

    getXPForNextLevel(level) {
        return 10 + (level - 1) * 10;
    }

    getCurrentLevelXP() {
        let totalXP = 0;
        for (let i = 1; i < this.level; i++) {
            totalXP += this.getXPForNextLevel(i);
        }
        return this.xp - totalXP;
    }

    getXPProgress() {
        const currentLevelXP = this.getCurrentLevelXP();
        const requiredXP = this.getXPForNextLevel(this.level);
        return Math.min((currentLevelXP / requiredXP) * 100, 100);
    }

    addXP(baseXP, streak = 0) {
        let totalXP = baseXP;
        
        // Streak bonuses
        if (streak >= 3) totalXP += 5;
        if (streak >= 5) totalXP += 10;
        
        const oldLevel = this.level;
        this.xp += totalXP;
        this.level = this.calculateLevel(this.xp);
        
        localStorage.setItem('totalXP', this.xp.toString());
        
        const leveledUp = this.level > oldLevel;
        
        return {
            xpGained: totalXP,
            leveledUp,
            newLevel: this.level,
            oldLevel
        };
    }

    getLevelTitle(level) {
        const titles = {
            1: '🌱 Rookie Traveler',
            2: '🎯 Quick Pick',
            3: '🧭 Region Locked',
            4: '🧠 Blind Guess',
            5: '💥 One Life Left',
            6: '🤔 Fake or Real?',
            7: '⏳ Speed Demon',
            8: '🧪 Mystery Mode',
            9: '🕵️‍♂️ Reverse Challenge',
            10: '🌍 Flag Master Trial'
        };
        return titles[level] || `🌟 Level ${level} Master`;
    }

    getLevelDescription(level) {
        const descriptions = {
            1: '4 multiple choice, easy countries, tutorial-like',
            2: 'Only 3 options, 7s timer for bonus XP',
            3: 'Flags from one random region — not shown which',
            4: 'No multiple choice — shows only flag + region hint',
            5: '1 life, no retries, streak shown onscreen',
            6: 'One option is fake — spot the lie',
            7: '5s timer, fast reactions = more XP',
            8: 'Type answer only, fuzzy match OK',
            9: 'Given country name, pick correct flag from similar-looking ones',
            10: 'No UI hints, no retries, type-only, random continent, leaderboard unlocked'
        };
        return descriptions[level] || 'Advanced challenge mode';
    }

    getLevelUnlock(level) {
        const unlocks = {
            2: '🔓 Quick Pick mode unlocked! Only 3 choices with time bonus.',
            3: '🔓 Region Lock mode unlocked! Mystery continent challenges.',
            4: '🔓 Blind Guess mode unlocked! No multiple choice, just hints.',
            5: '🔓 One Life mode unlocked! High stakes, high rewards.',
            6: '🔓 Fake or Real mode unlocked! Spot the impostor flag.',
            7: '🔓 Speed Demon mode unlocked! Lightning-fast reactions.',
            8: '🔓 Mystery Mode unlocked! Type-only challenges.',
            9: '🔓 Reverse Challenge unlocked! Name to flag matching.',
            10: '🔓 Flag Master Trial unlocked! Ultimate challenge mode!'
        };
        return unlocks[level] || '🔓 New challenge mode unlocked!';
    }
}

window.XPSystem = XPSystem;