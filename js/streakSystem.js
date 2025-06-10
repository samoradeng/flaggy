class StreakSystem {
    constructor() {
        this.currentStreak = 0;
        this.bestStreak = parseInt(localStorage.getItem('bestStreak') || '0');
        this.xp = parseInt(localStorage.getItem('totalXP') || '0');
        this.level = this.calculateLevel(this.xp);
    }

    calculateLevel(xp) {
        return Math.floor(xp / 100) + 1; // Level up every 100 XP
    }

    addCorrectAnswer() {
        this.currentStreak++;
        let xpGained = 1 + Math.floor(this.currentStreak / 3) * 2; // Bonus XP for streaks
        this.xp += xpGained;
        
        const newLevel = this.calculateLevel(this.xp);
        const leveledUp = newLevel > this.level;
        this.level = newLevel;

        if (this.currentStreak > this.bestStreak) {
            this.bestStreak = this.currentStreak;
            localStorage.setItem('bestStreak', this.bestStreak.toString());
        }

        localStorage.setItem('totalXP', this.xp.toString());
        
        return {
            xpGained,
            leveledUp,
            newLevel: this.level,
            streak: this.currentStreak,
            isStreakMilestone: this.isStreakMilestone(this.currentStreak)
        };
    }

    resetStreak() {
        this.currentStreak = 0;
    }

    isStreakMilestone(streak) {
        return streak > 0 && (streak % 3 === 0 || streak % 5 === 0 || streak % 10 === 0);
    }

    getStreakEmoji(streak) {
        if (streak >= 10) return '🔥🔥🔥';
        if (streak >= 5) return '🔥🔥';
        if (streak >= 3) return '🔥';
        return '';
    }

    getXPProgress() {
        const currentLevelXP = (this.level - 1) * 100;
        const nextLevelXP = this.level * 100;
        const progress = ((this.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
        return Math.min(progress, 100);
    }
}

window.StreakSystem = StreakSystem;