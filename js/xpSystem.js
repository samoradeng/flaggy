class XPSystem {
    constructor() {
        this.xp = parseInt(localStorage.getItem('totalXP') || '0');
        this.level = this.calculateLevel(this.xp);
        this.unlockedFeatures = this.loadUnlockedFeatures();
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
        if (leveledUp) {
            this.updateUnlockedFeatures();
        }
        
        return {
            xpGained: totalXP,
            leveledUp,
            newLevel: this.level,
            oldLevel
        };
    }

    updateUnlockedFeatures() {
        this.unlockedFeatures = {
            streakTracker: this.level >= 2,
            mysteryMode: this.level >= 5,
            hardcoreMode: this.level >= 8,
            continentsUnlocked: this.getContinentsUnlocked(),
            badgeUI: this.level >= 7,
            fullPassport: this.level >= 9,
            leaderboard: this.level >= 10
        };
        
        localStorage.setItem('unlockedFeatures', JSON.stringify(this.unlockedFeatures));
    }

    getContinentsUnlocked() {
        const continents = [];
        if (this.level >= 3) continents.push('Africa');
        if (this.level >= 6) continents.push('Europe', 'Asia');
        if (this.level >= 8) continents.push('Americas', 'Oceania');
        return continents;
    }

    loadUnlockedFeatures() {
        const saved = localStorage.getItem('unlockedFeatures');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Initialize based on current level
        this.updateUnlockedFeatures();
        return this.unlockedFeatures;
    }

    getLevelTitle(level) {
        const titles = {
            1: '🌱 Rookie Traveler',
            2: '🧳 Novice Nomad',
            3: '🌍 Map Scout',
            4: '📸 World Watcher',
            5: '🔎 Flag Sleuth',
            6: '✈️ Continental Champ',
            7: '🎖️ Badge Collector',
            8: '🧠 Geo Mastermind',
            9: '🚩 Flag Legend',
            10: '👑 Supreme Sovereign'
        };
        return titles[level] || `🌟 Level ${level} Master`;
    }

    getLevelUnlock(level) {
        const unlocks = {
            2: '🔓 Streak tracking unlocked!',
            3: '🔓 Africa-only filter unlocked!',
            4: '🔓 Daily streak progress unlocked!',
            5: '🔓 Mystery Mode unlocked!',
            6: '🔓 Europe & Asia filters unlocked!',
            7: '🔓 Badge system unlocked!',
            8: '🔓 Hardcore Mode unlocked!',
            9: '🔓 Full Passport access unlocked!',
            10: '🔓 Leaderboard access unlocked!'
        };
        return unlocks[level] || '🔓 New features unlocked!';
    }
}

window.XPSystem = XPSystem;