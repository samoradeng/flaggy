class AnimationEffects {
    static showConfetti() {
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }

    static showStreakConfetti() {
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 150,
                spread: 90,
                origin: { y: 0.6 },
                colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57']
            });
        }
    }

    static showLevelUpAnimation(level) {
        const levelUpDiv = document.createElement('div');
        levelUpDiv.className = 'level-up-animation';
        levelUpDiv.innerHTML = `
            <div class="level-up-content">
                <div class="level-up-text">LEVEL UP!</div>
                <div class="level-up-number">Level ${level}</div>
            </div>
        `;
        document.body.appendChild(levelUpDiv);

        setTimeout(() => {
            levelUpDiv.remove();
        }, 3000);

        this.showConfetti();
    }

    static showXPGain(xp, element) {
        const xpDiv = document.createElement('div');
        xpDiv.className = 'xp-gain-animation';
        xpDiv.textContent = `+${xp} XP`;
        
        const rect = element.getBoundingClientRect();
        xpDiv.style.left = rect.left + rect.width / 2 + 'px';
        xpDiv.style.top = rect.top + 'px';
        
        document.body.appendChild(xpDiv);

        setTimeout(() => {
            xpDiv.remove();
        }, 2000);
    }

    static showAchievementUnlock(achievement) {
        const achievementDiv = document.createElement('div');
        achievementDiv.className = 'achievement-unlock';
        achievementDiv.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-text">
                    <div class="achievement-title">Achievement Unlocked!</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                </div>
            </div>
        `;
        document.body.appendChild(achievementDiv);

        setTimeout(() => {
            achievementDiv.remove();
        }, 4000);

        this.showConfetti();
    }

    static pulseElement(element) {
        element.classList.add('pulse-animation');
        setTimeout(() => {
            element.classList.remove('pulse-animation');
        }, 600);
    }

    static shakeElement(element) {
        element.classList.add('shake-animation');
        setTimeout(() => {
            element.classList.remove('shake-animation');
        }, 600);
    }
}

window.AnimationEffects = AnimationEffects;