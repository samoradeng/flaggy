class DailyChallenge {
    constructor(countries) {
        this.countries = countries;
        this.today = new Date().toDateString();
        this.dailyStats = this.loadDailyStats();
        this.usedCountries = this.loadUsedCountries();
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
        // Use date as seed for consistent daily country
        const seed = this.dateToSeed(this.today);
        const countryCodes = Object.keys(this.countries);
        
        // Filter out already used countries if we haven't used all countries yet
        let availableCountries = countryCodes;
        if (this.usedCountries.length < countryCodes.length) {
            availableCountries = countryCodes.filter(code => !this.usedCountries.includes(code));
        } else {
            // If all countries have been used, reset the used list
            console.log('🔄 All countries used, resetting daily rotation');
            this.usedCountries = [];
            this.saveUsedCountries();
        }
        
        // Use the seed to pick from available countries
        const index = seed % availableCountries.length;
        const selectedCountryCode = availableCountries[index];
        
        // Add to used countries list if not already there
        if (!this.usedCountries.includes(selectedCountryCode)) {
            this.usedCountries.push(selectedCountryCode);
            this.saveUsedCountries();
        }
        
        console.log(`📅 Daily country: ${selectedCountryCode} (${this.countries[selectedCountryCode].name})`);
        console.log(`📊 Used countries: ${this.usedCountries.length}/${countryCodes.length}`);
        
        return this.countries[selectedCountryCode];
    }

    dateToSeed(dateString) {
        let hash = 0;
        for (let i = 0; i < dateString.length; i++) {
            const char = dateString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    submitResult(correct, attempts, timeSpent = 0) {
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
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();
            
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
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const diff = tomorrow - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }
}

window.DailyChallenge = DailyChallenge;