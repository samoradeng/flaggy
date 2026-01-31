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

    static showPerfectRoundCelebration() {
        if (typeof confetti !== 'undefined') {
            // Big burst from center
            confetti({
                particleCount: 200,
                spread: 120,
                origin: { y: 0.5 },
                colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB']
            });

            // Delayed bursts from sides
            setTimeout(() => {
                confetti({
                    particleCount: 100,
                    angle: 60,
                    spread: 80,
                    origin: { x: 0, y: 0.6 },
                    colors: ['#FFD700', '#FFA500', '#FF6347']
                });
                confetti({
                    particleCount: 100,
                    angle: 120,
                    spread: 80,
                    origin: { x: 1, y: 0.6 },
                    colors: ['#00CED1', '#9370DB', '#32CD32']
                });
            }, 250);

            // Another burst
            setTimeout(() => {
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.7 },
                    colors: ['#FFD700', '#FF69B4', '#00FF7F', '#87CEEB']
                });
            }, 500);
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