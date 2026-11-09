class DailyChallenge {
    constructor(countries) {
        this.countries = countries;
        this.today = this.getStandardizedDate();
        this.dailyStats = this.loadDailyStats();

        // New 5-flag challenge state
        this.FLAGS_PER_DAY = 5;
        this.MAX_LIVES = 3;
        this.currentFlagIndex = 0;
        this.lives = this.MAX_LIVES;
        this.results = []; // Array of 'correct', 'wrong', or 'skipped'
        this.startTime = null;
        this.endTime = null;
        this.todaysFlags = null; // Cache today's flags
    }

    getStandardizedDate() {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Get day number since v2 launch (5-flag challenge)
    getDayNumber() {
        const startDate = new Date('2026-11-09'); // v2 launch date
        const today = new Date(this.today);
        const diffTime = today - startDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    }

    loadDailyStats() {
        const saved = localStorage.getItem('dailyStatsV2');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            streak: 0,
            lastPlayedDate: null,
            totalPlayed: 0,
            totalPerfect: 0, // 5/5 games
            results: {} // date -> result object
        };
    }

    saveDailyStats() {
        localStorage.setItem('dailyStatsV2', JSON.stringify(this.dailyStats));
    }

    hasPlayedToday() {
        const result = this.dailyStats.results[this.today];
        return result !== undefined && result !== null;
    }

    getTodayResult() {
        return this.dailyStats.results[this.today];
    }

    // Generate 5 deterministic flags for today
    getTodaysFlags() {
        if (this.todaysFlags) return this.todaysFlags;

        const seed = this.dateToSeed(this.today);
        const countryCodes = Object.keys(this.countries);
        const selectedFlags = [];
        const usedIndices = new Set();

        // Use seeded random to pick 5 unique flags
        let currentSeed = seed;
        while (selectedFlags.length < this.FLAGS_PER_DAY) {
            currentSeed = this.nextRandom(currentSeed);
            const index = currentSeed % countryCodes.length;

            if (!usedIndices.has(index)) {
                usedIndices.add(index);
                const code = countryCodes[index];
                selectedFlags.push({
                    code: code,
                    ...this.countries[code]
                });
            }
        }

        this.todaysFlags = selectedFlags;
        console.log('📅 Today\'s flags:', selectedFlags.map(f => f.name));
        return selectedFlags;
    }

    dateToSeed(dateString) {
        let hash = 0;
        for (let i = 0; i < dateString.length; i++) {
            const char = dateString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    // Simple seeded random number generator
    nextRandom(seed) {
        const a = 1664525;
        const c = 1013904223;
        const m = Math.pow(2, 32);
        return (a * seed + c) % m;
    }

    // Start the daily challenge
    startChallenge() {
        this.currentFlagIndex = 0;
        this.lives = this.MAX_LIVES;
        this.results = [];
        this.startTime = performance.now();
        this.endTime = null;
        return this.getCurrentFlag();
    }

    // Get current flag to display
    getCurrentFlag() {
        const flags = this.getTodaysFlags();
        if (this.currentFlagIndex >= flags.length) {
            return null;
        }
        return flags[this.currentFlagIndex];
    }

    // Get flag number (1-5) for display
    getCurrentFlagNumber() {
        return this.currentFlagIndex + 1;
    }

    // Submit answer for current flag
    submitAnswer(selectedCountryCode) {
        const currentFlag = this.getCurrentFlag();
        if (!currentFlag) return null;

        const isCorrect = selectedCountryCode === currentFlag.code;

        if (isCorrect) {
            this.results.push('correct');
        } else {
            this.results.push('wrong');
            this.lives--;
        }

        this.currentFlagIndex++;

        // Check if game is over
        const isGameOver = this.lives <= 0 || this.currentFlagIndex >= this.FLAGS_PER_DAY;

        if (isGameOver) {
            this.endTime = performance.now();
            // Mark remaining flags as skipped
            while (this.results.length < this.FLAGS_PER_DAY) {
                this.results.push('skipped');
            }
        }

        return {
            isCorrect,
            correctAnswer: currentFlag,
            isGameOver,
            livesRemaining: this.lives,
            nextFlag: isGameOver ? null : this.getCurrentFlag()
        };
    }

    // Get elapsed time in milliseconds
    getElapsedTimeMs() {
        if (!this.startTime) return 0;
        const endPoint = this.endTime || performance.now();
        return Math.round(endPoint - this.startTime);
    }

    // Get formatted time string (e.g., "8.42s")
    getFormattedTime() {
        const ms = this.getElapsedTimeMs();
        return (ms / 1000).toFixed(2) + 's';
    }

    // Get score (correct answers out of 5)
    getScore() {
        return this.results.filter(r => r === 'correct').length;
    }

    // Save the completed game
    saveResult() {
        if (this.hasPlayedToday()) return false;

        const score = this.getScore();
        const timeMs = this.getElapsedTimeMs();
        const isPerfect = score === this.FLAGS_PER_DAY;

        const result = {
            score,
            total: this.FLAGS_PER_DAY,
            results: [...this.results],
            timeMs,
            flags: this.getTodaysFlags().map(f => ({ code: f.code, name: f.name })),
            date: this.today
        };

        this.dailyStats.results[this.today] = result;
        this.dailyStats.totalPlayed++;

        if (isPerfect) {
            this.dailyStats.totalPerfect++;
        }

        // Update streak
        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const yesterdayStr = this.getStandardizedDateFromDate(yesterday);

        if (this.dailyStats.lastPlayedDate === yesterdayStr) {
            this.dailyStats.streak++;
        } else if (this.dailyStats.lastPlayedDate !== this.today) {
            this.dailyStats.streak = 1;
        }

        this.dailyStats.lastPlayedDate = this.today;
        this.saveDailyStats();

        return result;
    }

    getStandardizedDateFromDate(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Generate share text (Wordle-style)
    getShareText(result = null) {
        const r = result || this.getTodayResult();
        if (!r) return '';

        const dayNum = this.getDayNumber();
        const squares = r.results.map(res => {
            if (res === 'correct') return '🟩';
            if (res === 'wrong') return '⬛';
            return '❌'; // skipped (ran out of lives)
        }).join('');

        const timeStr = (r.timeMs / 1000).toFixed(2) + 's';
        const flagEmojis = r.flags.map(f => this.getCountryEmoji(f.code)).join(' ');

        return `Flagtriv Daily #${dayNum}\n${squares} ${r.score}/${r.total}\n⚡ ${timeStr}\n\n${flagEmojis}\n\nflagtriv.com`;
    }

    // Convert country code to flag emoji
    getCountryEmoji(code) {
        if (!code || code.length !== 2) return '🏳️';
        const codePoints = code
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
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

    // Get current streak
    getCurrentStreak() {
        return this.dailyStats.streak;
    }

    // Get leaderboard for today
    async getLeaderboard() {
        if (window.GlobalLeaderboard) {
            const leaderboard = new window.GlobalLeaderboard();
            return await leaderboard.getLeaderboard(this.today);
        }
        return { entries: [], isGlobal: false, error: 'Leaderboard not available' };
    }

    // Submit score to leaderboard
    async submitToLeaderboard(playerName, timeSeconds, attempts) {
        if (window.GlobalLeaderboard) {
            const leaderboard = new window.GlobalLeaderboard();
            const result = this.getTodayResult();
            const timeMs = result?.timeMs || this.getElapsedTimeMs();
            // Correct parameter order: playerName, timeMs, attempts, date
            return await leaderboard.submitScore(playerName, timeMs, attempts, this.today);
        }
        return { success: false, error: 'Leaderboard not available' };
    }
}

window.DailyChallenge = DailyChallenge;
