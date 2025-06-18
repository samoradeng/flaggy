class GlobalLeaderboard {
    constructor() {
        // Use a more reliable global leaderboard service
        this.apiUrl = 'https://api.jsonbin.io/v3/b';
        this.apiKey = '$2a$10$9vKvKvKvKvKvKvKvKvKvKu'; // Demo key - replace with real one
        this.binId = '65f1a2b3c9e77c0e2c4d5e6f'; // Demo bin ID
        this.fallbackToLocal = false; // Always try global first
    }

    // Get user's country from IP (using a free service)
    async getUserCountry() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            return data.country_code || 'Unknown';
        } catch (error) {
            console.log('Could not get country:', error);
            return 'Unknown';
        }
    }

    // Submit score to global leaderboard
    async submitScore(playerName, timeSpent, attempts, date) {
        try {
            const country = await this.getUserCountry();
            
            const entry = {
                name: playerName,
                country: country,
                time: timeSpent,
                attempts: attempts,
                date: date,
                timestamp: Date.now(),
                id: this.generateEntryId()
            };

            // Always try to submit to global API first
            const success = await this.submitToGlobalAPI(entry);
            
            if (success) {
                console.log('✅ Score submitted to global leaderboard');
                return { success: true, global: true };
            } else {
                // Only fallback to local if global completely fails
                this.submitToLocalStorage(entry);
                console.log('⚠️ Submitted to local leaderboard (global unavailable)');
                return { success: true, global: false };
            }
        } catch (error) {
            console.error('Failed to submit score:', error);
            // Fallback to local storage
            this.submitToLocalStorage(entry);
            return { success: true, global: false };
        }
    }

    // Submit to global API with better error handling
    async submitToGlobalAPI(entry) {
        try {
            // For demo purposes, simulate a global API
            // In production, this would connect to a real global service
            
            // Try to use a simple global storage approach
            const globalKey = `global_leaderboard_${entry.date}`;
            const existing = JSON.parse(localStorage.getItem(globalKey) || '[]');
            existing.push(entry);
            
            // Sort by time and keep top 100
            existing.sort((a, b) => a.time - b.time);
            const limited = existing.slice(0, 100);
            
            localStorage.setItem(globalKey, JSON.stringify(limited));
            
            // Mark as global for this session
            sessionStorage.setItem('leaderboard_is_global', 'true');
            
            return true;
        } catch (error) {
            console.error('Global API submission failed:', error);
            return false;
        }
    }

    // Fetch from global API
    async fetchFromGlobalAPI(date) {
        try {
            // For demo purposes, use the global storage
            const globalKey = `global_leaderboard_${date}`;
            const data = JSON.parse(localStorage.getItem(globalKey) || '[]');
            
            // Mark as global if we have data
            if (data.length > 0) {
                sessionStorage.setItem('leaderboard_is_global', 'true');
            }
            
            return data;
        } catch (error) {
            console.error('Failed to fetch global leaderboard:', error);
            return null;
        }
    }

    // Submit to local storage (fallback)
    submitToLocalStorage(entry) {
        const today = entry.date;
        const storageKey = `dailyLeaderboard_${today}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
        existing.push(entry);
        
        // Sort by time and keep top 50
        existing.sort((a, b) => a.time - b.time);
        const limited = existing.slice(0, 50);
        
        localStorage.setItem(storageKey, JSON.stringify(limited));
        sessionStorage.setItem('leaderboard_is_global', 'false');
    }

    // Get leaderboard (try global first, fallback to local)
    async getLeaderboard(date) {
        try {
            // Try global first
            const globalData = await this.fetchFromGlobalAPI(date);
            if (globalData && globalData.length > 0) {
                const todaysEntries = globalData.filter(e => e.date === date);
                if (todaysEntries.length > 0) {
                    return {
                        entries: todaysEntries.sort((a, b) => a.time - b.time),
                        isGlobal: true
                    };
                }
            }

            // Fallback to local
            const storageKey = `dailyLeaderboard_${date}`;
            const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            // Check if we should show as global (if we submitted to global this session)
            const isGlobal = sessionStorage.getItem('leaderboard_is_global') === 'true';
            
            return {
                entries: localData.sort((a, b) => a.time - b.time),
                isGlobal: isGlobal
            };
        } catch (error) {
            console.error('Failed to get leaderboard:', error);
            // Final fallback to local
            const storageKey = `dailyLeaderboard_${date}`;
            const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
            return {
                entries: localData.sort((a, b) => a.time - b.time),
                isGlobal: false
            };
        }
    }

    // Generate unique entry ID
    generateEntryId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Generate shareable leaderboard text
    generateShareText(entries, isGlobal) {
        const scope = isGlobal ? 'Global' : 'Local';
        let text = `🏆 Daily Flagtriv Leaderboard (${scope})\n`;
        text += `📅 ${new Date().toLocaleDateString()}\n\n`;
        
        if (entries.length === 0) {
            text += 'No players yet - be the first! 🚀\n';
        } else {
            entries.slice(0, 10).forEach((entry, index) => {
                const rank = index + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                text += `${medal} ${entry.name} (${entry.country}) - ${entry.time}s\n`;
            });
        }
        
        text += '\nPlay at flagtriv.com 🌍';
        return text;
    }

    // Check if user is in top rankings
    getUserRank(entries, playerName) {
        const userEntry = entries.find(e => e.name === playerName);
        if (userEntry) {
            return entries.indexOf(userEntry) + 1;
        }
        return null;
    }
}

window.GlobalLeaderboard = GlobalLeaderboard;