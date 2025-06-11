class DailyChallenge {
    constructor(countries) {
        this.countries = countries;
        // Use a standardized date format that's consistent worldwide
        this.today = this.getStandardizedDate();
        this.dailyStats = this.loadDailyStats();
        this.usedCountries = this.loadUsedCountries();
        this.globalLeaderboard = new GlobalLeaderboard();
    }

    getStandardizedDate() {
        // Get current date in UTC and format as YYYY-MM-DD
        // This ensures everyone worldwide gets the same date
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    loadDailyStats() {
        const saved = localStorage.getItem('dailyStats');
        if (saved) {
            const stats = JSON.parse(saved);
            return stats;
        }
        return {
            streak: 0,
            lastPlayedDate: null,
            totalPlayed: 0,
            totalCorrect: 0,
            results: {} // date -> result object
        };
    }

    loadUsedCountries() {
        const saved = localStorage.getItem('dailyUsedCountries');
        if (saved) {
            return JSON.parse(saved);
        }
        return [];
    }

    saveUsedCountries() {
        localStorage.setItem('dailyUsedCountries', JSON.stringify(this.usedCountries));
    }

    saveDailyStats() {
        localStorage.setItem('dailyStats', JSON.stringify(this.dailyStats));
    }

    hasPlayedToday() {
        return this.dailyStats.results[this.today] !== undefined;
    }

    getTodaysCountry() {
        // Use a deterministic seed based on the standardized date
        const seed = this.dateToSeed(this.today);
        const countryCodes = Object.keys(this.countries);
        
        // Create a deterministic sequence using the date seed
        // This ensures the same country for everyone on the same date
        const index = seed % countryCodes.length;
        const selectedCountryCode = countryCodes[index];
        
        console.log(`📅 Daily country for ${this.today}: ${selectedCountryCode} (${this.countries[selectedCountryCode].name})`);
        console.log(`🔢 Seed: ${seed}, Index: ${index}, Total countries: ${countryCodes.length}`);
        
        return this.countries[selectedCountryCode];
    }

    dateToSeed(dateString) {
        // Create a simple, consistent hash from the date string
        // This will always produce the same number for the same date
        let hash = 0;
        for (let i = 0; i < dateString.length; i++) {
            const char = dateString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Ensure we get a positive number
        const positiveHash = Math.abs(hash);
        console.log(`🔢 Date "${dateString}" -> Hash: ${hash} -> Positive: ${positiveHash}`);
        
        return positiveHash;
    }

    async submitResult(correct, attempts, timeSpent = 0) {
        if (this.hasPlayedToday()) return false;

        const result = {
            correct,
            attempts,
            timeSpent,
            date: this.today,
            country: this.getTodaysCountry().name
        };

        this.dailyStats.results[this.today] = result;
        this.dailyStats.totalPlayed++;
        
        if (correct) {
            this.dailyStats.totalCorrect++;
            // Update streak
            const yesterday = new Date();
            yesterday.setUTCDate(yesterday.getUTCDate() - 1);
            const yesterdayStr = this.getStandardizedDateFromDate(yesterday);
            
            if (this.dailyStats.lastPlayedDate === yesterdayStr) {
                this.dailyStats.streak++;
            } else if (this.dailyStats.lastPlayedDate !== this.today) {
                this.dailyStats.streak = 1;
            }
        } else {
            this.dailyStats.streak = 0;
        }

        this.dailyStats.lastPlayedDate = this.today;
        this.saveDailyStats();
        return true;
    }

    // Submit to global leaderboard
    async submitToLeaderboard(playerName, timeSpent, attempts) {
        return await this.globalLeaderboard.submitScore(playerName, timeSpent, attempts, this.today);
    }

    // Get today's leaderboard
    async getLeaderboard() {
        return await this.globalLeaderboard.getLeaderboard(this.today);
    }

    // Generate share text for leaderboard
    async generateLeaderboardShareText() {
        const leaderboardData = await this.getLeaderboard();
        return this.globalLeaderboard.generateShareText(leaderboardData.entries, leaderboardData.isGlobal);
    }

    getStandardizedDateFromDate(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getShareText(result) {
        const attempts = result.attempts;
        const squares = [];
        
        for (let i = 0; i < attempts; i++) {
            if (i === attempts - 1 && result.correct) {
                squares.push('🟩');
            } else {
                squares.push('🟥');
            }
        }
        
        // Add empty squares for remaining attempts (max 2 for new daily challenge)
        while (squares.length < 2) {
            squares.push('⬜');
        }

        const flag = this.getTodaysCountry().flag?.emoji || '🏳️';
        const timeStr = result.timeSpent ? ` in ${Math.floor(result.timeSpent / 60)}:${(result.timeSpent % 60).toString().padStart(2, '0')}` : '';
        
        return `Flagtriv Daily ${flag}\n${squares.join('')}${timeStr}\nflagtriv.com`;
    }

    getTimeUntilNext() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);
        
        const diff = tomorrow - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }
}

window.DailyChallenge = DailyChallenge;