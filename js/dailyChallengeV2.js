/**
 * Daily Challenge V2 - Hint-based guessing system
 *
 * Instead of multiple choice, players type the country name with autocomplete.
 * Up to 6 guesses with progressive hints revealed after each wrong answer.
 * Timer runs throughout. Share format shows guess squares + time.
 *
 * Feature flag: Set DAILY_V2 = true in script.js to enable.
 * Set DAILY_V2 = false to revert to the original multiple-choice daily.
 */
class DailyChallengeV2 {
    constructor(countries, dailyChallengeV1) {
        this.countries = countries;
        this.v1 = dailyChallengeV1; // Reuse V1 for date/seed/stats/leaderboard
        this.maxGuesses = 6;
        this.guesses = []; // Array of { guess: string, correct: boolean }
        this.hintsRevealed = 0;
        this.gameActive = false;
        this.todaysCountry = null;
        this.countryNames = Object.values(countries).map(c => c.name).sort();
    }

    // Get hint data for today's country at each level
    getHints() {
        const country = this.todaysCountry;
        if (!country) return [];

        const populationRange = this.getPopulationRange(country.population);
        const capitalFirstLetter = country.capital ? country.capital.charAt(0).toUpperCase() : '?';

        return [
            null, // Guess 1: just the flag, no hint
            { label: 'Continent', value: country.region, icon: this.getContinentEmoji(country.region) },
            { label: 'Subregion', value: country.subregion || country.region, icon: '📍' },
            { label: 'Population', value: populationRange, icon: '👥' },
            { label: 'Capital starts with', value: `"${capitalFirstLetter}"`, icon: '🏛️' },
            { label: 'Capital', value: country.capital || 'Unknown', icon: '🏛️' }
        ];
    }

    getContinentEmoji(region) {
        const emojis = {
            'Africa': '🌍',
            'Asia': '🌏',
            'Europe': '🇪🇺',
            'Americas': '🌎',
            'Oceania': '🏝️'
        };
        return emojis[region] || '🌐';
    }

    getPopulationRange(pop) {
        if (!pop) return 'Unknown';
        if (pop < 100000) return 'Under 100K';
        if (pop < 1000000) return '100K - 1M';
        if (pop < 10000000) return '1M - 10M';
        if (pop < 50000000) return '10M - 50M';
        if (pop < 100000000) return '50M - 100M';
        if (pop < 500000000) return '100M - 500M';
        return '500M+';
    }

    // Start a new V2 daily game
    startGame() {
        this.todaysCountry = this.v1.getTodaysCountry();
        this.guesses = [];
        this.hintsRevealed = 0;
        this.gameActive = true;
        this.v1.startTiming();
        return this.todaysCountry;
    }

    // Submit a guess, returns { correct, gameOver, hintsRevealed }
    submitGuess(guessText) {
        if (!this.gameActive) return null;

        const correct = guessText.trim().toLowerCase() === this.todaysCountry.name.toLowerCase();
        this.guesses.push({ guess: guessText.trim(), correct });

        if (correct) {
            this.v1.lockFinalTime();
            this.gameActive = false;
            return { correct: true, gameOver: true, won: true, hintsRevealed: this.hintsRevealed };
        }

        // Wrong guess
        this.hintsRevealed++;

        if (this.guesses.length >= this.maxGuesses) {
            this.v1.lockFinalTime();
            this.gameActive = false;
            return { correct: false, gameOver: true, won: false, hintsRevealed: this.hintsRevealed };
        }

        return { correct: false, gameOver: false, won: false, hintsRevealed: this.hintsRevealed };
    }

    // Get the current guess number (1-indexed)
    getCurrentGuessNumber() {
        return this.guesses.length + 1;
    }

    // Get remaining guesses
    getRemainingGuesses() {
        return this.maxGuesses - this.guesses.length;
    }

    // Submit the V2 result using V1's infrastructure
    async submitResult(won) {
        const hintsUsed = this.hintsRevealed;
        const totalGuesses = this.guesses.length;
        // Map to V1's submitResult: correct=won, attempts=totalGuesses
        await this.v1.submitResult(won, totalGuesses);

        // Store V2-specific data alongside
        const v2Data = {
            version: 2,
            guesses: this.guesses,
            hintsUsed: hintsUsed,
            totalGuesses: totalGuesses,
            won: won,
            timeMs: this.v1.getFinalTime()
        };
        const today = this.v1.today;
        const v2Results = JSON.parse(localStorage.getItem('dailyV2Results') || '{}');
        v2Results[today] = v2Data;
        localStorage.setItem('dailyV2Results', JSON.stringify(v2Results));
    }

    // Submit to leaderboard (reuse V1)
    async submitToLeaderboard(playerName) {
        const totalGuesses = this.guesses.length;
        const timeMs = this.v1.getFinalTime();
        return await this.v1.submitToLeaderboard(playerName, timeMs, totalGuesses);
    }

    // Get day number for share text
    getDayNumber() {
        const launchDate = new Date('2025-01-01');
        const today = new Date();
        return Math.floor((today - launchDate) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Generate the iconic share text
    getShareText() {
        const dayNumber = this.getDayNumber();
        const country = this.todaysCountry;
        const flagEmoji = country?.flag?.emoji || countryCodeToFlag(country?.alpha2Code) || '🏳️';
        const won = this.guesses.length > 0 && this.guesses[this.guesses.length - 1].correct;

        // Build the guess squares
        const squares = this.guesses.map(g => g.correct ? '🟩' : '⬛');
        const squaresStr = squares.join('');

        // Score display: guesses/max or X if failed
        const scoreStr = won ? `${this.guesses.length}/${this.maxGuesses}` : `X/${this.maxGuesses}`;

        // Time display with centisecond precision
        const timeMs = this.v1.getFinalTime();
        const timeStr = typeof formatTimeMs === 'function' ? formatTimeMs(timeMs) : `${(timeMs / 1000).toFixed(2)}s`;

        return `🏁 Flagtriv #${dayNumber}\n${squaresStr} ${scoreStr}\n⏱️ ${timeStr}\n\nflagtriv.com`;
    }

    // Filter country names for autocomplete
    filterCountries(query) {
        if (!query || query.length < 1) return [];
        const q = query.toLowerCase();
        const matches = this.countryNames.filter(name =>
            name.toLowerCase().startsWith(q)
        );
        // Also match anywhere in name if few startsWith matches
        if (matches.length < 5) {
            const containsMatches = this.countryNames.filter(name =>
                !name.toLowerCase().startsWith(q) && name.toLowerCase().includes(q)
            );
            matches.push(...containsMatches);
        }
        return matches.slice(0, 8);
    }

    // Check if already played today (delegates to V1)
    hasPlayedToday() {
        return this.v1.hasPlayedToday();
    }
}

window.DailyChallengeV2 = DailyChallengeV2;
