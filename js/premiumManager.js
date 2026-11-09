/**
 * Premium Manager - Handles subscriptions, feature gating, and monetization
 *
 * Free Tier:
 * - Daily Flag: Unlimited
 * - Practice Mode: 5 rounds/day
 * - Multiplayer: Join unlimited, create 2/day
 * - Ads between games
 * - Streak save: Watch ad
 *
 * Premium ($3.99/mo or $19.99/yr):
 * - Unlimited practice
 * - Unlimited challenge creation
 * - Ad-free
 * - Offline practice mode
 * - 1 free streak save/week
 * - Hints
 */

// Set to true to enable premium gates (practice limits, challenge limits, etc.)
// For launch: false (everything free, but still tracking usage for analytics)
const GATES_ENABLED = false;

class PremiumManager {
    constructor() {
        this.loadState();
        this.checkDailyReset();
    }

    loadState() {
        const saved = localStorage.getItem('premiumState');
        if (saved) {
            this.state = JSON.parse(saved);
        } else {
            this.state = {
                isPremium: false,
                premiumExpiry: null,
                practiceCountToday: 0,
                challengesCreatedToday: 0,
                streakSavesThisWeek: 0,
                lastResetDate: this.getTodayString(),
                lastWeekReset: this.getWeekString(),
                offlineDataCached: false
            };
        }
    }

    saveState() {
        localStorage.setItem('premiumState', JSON.stringify(this.state));
    }

    getTodayString() {
        const now = new Date();
        return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
    }

    getWeekString() {
        const now = new Date();
        const startOfYear = new Date(now.getUTCFullYear(), 0, 1);
        const weekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getUTCDay() + 1) / 7);
        return `${now.getUTCFullYear()}-W${weekNum}`;
    }

    checkDailyReset() {
        const today = this.getTodayString();
        const thisWeek = this.getWeekString();

        if (this.state.lastResetDate !== today) {
            this.state.practiceCountToday = 0;
            this.state.challengesCreatedToday = 0;
            this.state.lastResetDate = today;
        }

        if (this.state.lastWeekReset !== thisWeek) {
            this.state.streakSavesThisWeek = 0;
            this.state.lastWeekReset = thisWeek;
        }

        this.saveState();
    }

    // ========== Premium Status ==========

    isPremium() {
        if (!this.state.isPremium) return false;
        if (this.state.premiumExpiry) {
            const expiry = new Date(this.state.premiumExpiry);
            if (expiry < new Date()) {
                this.state.isPremium = false;
                this.saveState();
                return false;
            }
        }
        return true;
    }

    setPremium(durationDays) {
        this.state.isPremium = true;
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + durationDays);
        this.state.premiumExpiry = expiry.toISOString();
        this.saveState();
    }

    // For testing/demo
    activatePremiumTrial(days = 7) {
        this.setPremium(days);
        this.showToast('🎉 Premium activated! Enjoy all features.');
    }

    // ========== Practice Mode Limits ==========

    canPlayPractice() {
        if (!GATES_ENABLED) return true; // Gates disabled for launch
        if (this.isPremium()) return true;
        return this.state.practiceCountToday < 5;
    }

    getPracticeRemaining() {
        if (!GATES_ENABLED) return Infinity; // Gates disabled for launch
        if (this.isPremium()) return Infinity;
        return Math.max(0, 5 - this.state.practiceCountToday);
    }

    recordPracticeGame() {
        // Always track for analytics, even when gates disabled
        this.state.practiceCountToday++;
        this.saveState();
    }

    // ========== Challenge Creation Limits ==========

    canCreateChallenge() {
        if (!GATES_ENABLED) return true; // Gates disabled for launch
        if (this.isPremium()) return true;
        return this.state.challengesCreatedToday < 2;
    }

    getChallengesRemaining() {
        if (!GATES_ENABLED) return Infinity; // Gates disabled for launch
        if (this.isPremium()) return Infinity;
        return Math.max(0, 2 - this.state.challengesCreatedToday);
    }

    recordChallengeCreated() {
        // Always track for analytics, even when gates disabled
        this.state.challengesCreatedToday++;
        this.saveState();
    }

    // ========== Streak Save ==========

    canSaveStreak() {
        return true; // Everyone can save, but method differs
    }

    getStreakSaveMethod() {
        if (!GATES_ENABLED) return 'free'; // Gates disabled for launch
        if (this.isPremium() && this.state.streakSavesThisWeek < 1) {
            return 'free'; // Premium gets 1 free save per week
        }
        return 'ad'; // Free users (or premium who used their free save) watch ad
    }

    useStreakSave() {
        if (this.isPremium() && this.state.streakSavesThisWeek < 1) {
            this.state.streakSavesThisWeek++;
            this.saveState();
            return 'free';
        }
        // For ad-based saves, the ad system handles it
        return 'ad';
    }

    // ========== Offline Mode ==========

    canUseOffline() {
        if (!GATES_ENABLED) return true; // Gates disabled for launch
        return this.isPremium();
    }

    isOfflineCached() {
        return this.state.offlineDataCached;
    }

    setOfflineCached(status) {
        this.state.offlineDataCached = status;
        this.saveState();
    }

    // ========== UI Helpers ==========

    showUpgradeModal(reason) {
        const modal = document.getElementById('premium-modal');
        const reasonText = document.getElementById('premium-reason');

        if (modal && reasonText) {
            const reasons = {
                'practice': "You've used all 5 practice rounds today!",
                'challenge': "You've created 2 challenges today!",
                'streak': "Save your streak and keep going!",
                'offline': "Play anywhere, even offline!",
                'general': "Unlock the full Flagtriv experience!"
            };
            reasonText.textContent = reasons[reason] || reasons.general;
            modal.style.display = 'flex';
        }
    }

    showStreakSaveModal(currentStreak, onSave, onLose) {
        const modal = document.getElementById('streak-save-modal');
        if (!modal) {
            this.createStreakSaveModal(currentStreak, onSave, onLose);
            return;
        }

        document.getElementById('streak-save-count').textContent = currentStreak;
        const saveMethod = this.getStreakSaveMethod();
        const saveBtn = document.getElementById('streak-save-btn');

        if (saveMethod === 'free') {
            saveBtn.innerHTML = '🛡️ Save Streak (Free)';
            saveBtn.onclick = () => {
                this.useStreakSave();
                modal.style.display = 'none';
                onSave();
            };
        } else {
            saveBtn.innerHTML = '📺 Watch Ad to Save';
            saveBtn.onclick = () => {
                // In production, show rewarded ad here
                // For now, simulate ad watched
                this.simulateAdWatched(() => {
                    modal.style.display = 'none';
                    onSave();
                });
            };
        }

        document.getElementById('streak-lose-btn').onclick = () => {
            modal.style.display = 'none';
            onLose();
        };

        modal.style.display = 'flex';
    }

    createStreakSaveModal(currentStreak, onSave, onLose) {
        const modal = document.createElement('div');
        modal.id = 'streak-save-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content streak-save-content">
                <div class="streak-save-icon">🔥</div>
                <h2>Don't Lose Your Streak!</h2>
                <p class="streak-save-message">
                    Your <strong><span id="streak-save-count">${currentStreak}</span> day streak</strong> is about to end!
                </p>
                <div class="streak-save-actions">
                    <button id="streak-save-btn" class="streak-save-button">
                        ${this.getStreakSaveMethod() === 'free' ? '🛡️ Save Streak (Free)' : '📺 Watch Ad to Save'}
                    </button>
                    <button id="streak-lose-btn" class="streak-lose-button">
                        Let it go
                    </button>
                </div>
                <p class="streak-save-premium-hint" ${this.isPremium() ? 'style="display:none"' : ''}>
                    ⭐ Premium members get 1 free save per week
                </p>
            </div>
        `;
        document.body.appendChild(modal);

        const saveMethod = this.getStreakSaveMethod();
        const saveBtn = document.getElementById('streak-save-btn');

        if (saveMethod === 'free') {
            saveBtn.onclick = () => {
                this.useStreakSave();
                modal.style.display = 'none';
                onSave();
            };
        } else {
            saveBtn.onclick = () => {
                this.simulateAdWatched(() => {
                    modal.style.display = 'none';
                    onSave();
                });
            };
        }

        document.getElementById('streak-lose-btn').onclick = () => {
            modal.style.display = 'none';
            onLose();
        };

        modal.style.display = 'flex';
    }

    simulateAdWatched(callback) {
        // In production, integrate with AdMob rewarded video
        // For now, show a simulated ad experience
        const adOverlay = document.createElement('div');
        adOverlay.className = 'ad-simulation-overlay';
        adOverlay.innerHTML = `
            <div class="ad-simulation-content">
                <p>📺 Ad Playing...</p>
                <div class="ad-progress-bar">
                    <div class="ad-progress-fill"></div>
                </div>
                <p class="ad-timer">3</p>
            </div>
        `;
        document.body.appendChild(adOverlay);

        let countdown = 3;
        const timer = setInterval(() => {
            countdown--;
            adOverlay.querySelector('.ad-timer').textContent = countdown;
            if (countdown <= 0) {
                clearInterval(timer);
                adOverlay.remove();
                this.showToast('✅ Streak saved!');
                callback();
            }
        }, 1000);
    }

    showToast(message) {
        const existingToast = document.querySelector('.premium-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'premium-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // ========== Premium Purchase (placeholder for RevenueCat/StoreKit) ==========

    async purchaseMonthly() {
        // In production, integrate with RevenueCat
        // For now, activate premium directly
        console.log('💳 Processing monthly subscription...');
        this.setPremium(30);
        this.showToast('🎉 Welcome to Flagtriv Premium!');
        return true;
    }

    async purchaseYearly() {
        console.log('💳 Processing yearly subscription...');
        this.setPremium(365);
        this.showToast('🎉 Welcome to Flagtriv Premium!');
        return true;
    }

    async restorePurchases() {
        // In production, check with RevenueCat for existing subscriptions
        console.log('🔄 Restoring purchases...');
        this.showToast('No purchases to restore');
        return false;
    }
}

// Global instance
window.premiumManager = new PremiumManager();
