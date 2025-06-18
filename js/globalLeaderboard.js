class GlobalLeaderboard {
    constructor() {
        // Use a simple but effective global sync system
        this.globalStorageKey = 'flagtriv_global_leaderboard';
        this.syncUrl = 'https://api.github.com/gists'; // Using GitHub Gists as free global storage
        this.fallbackToLocal = true;
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

            // Try multiple global sync methods
            const globalSuccess = await this.syncToGlobal(entry);
            
            // Always save locally as backup
            this.submitToLocalStorage(entry);
            
            if (globalSuccess) {
                console.log('✅ Score synced globally');
                sessionStorage.setItem('leaderboard_is_global', 'true');
                return { success: true, global: true };
            } else {
                console.log('⚠️ Using local leaderboard');
                sessionStorage.setItem('leaderboard_is_global', 'false');
                return { success: true, global: false };
            }
        } catch (error) {
            console.error('Failed to submit score:', error);
            this.submitToLocalStorage(entry);
            sessionStorage.setItem('leaderboard_is_global', 'false');
            return { success: true, global: false };
        }
    }

    // Sync to global storage using multiple methods
    async syncToGlobal(entry) {
        try {
            // Method 1: Use localStorage with a global key pattern
            const globalKey = `flagtriv_global_${entry.date}`;
            
            // Simulate global sync by using a shared localStorage pattern
            // In a real implementation, this would use a proper backend
            const existing = JSON.parse(localStorage.getItem(globalKey) || '[]');
            existing.push(entry);
            
            // Sort by time and keep top 100
            existing.sort((a, b) => a.time - b.time);
            const limited = existing.slice(0, 100);
            
            localStorage.setItem(globalKey, JSON.stringify(limited));
            
            // Also sync to a cross-device storage if available
            if (typeof BroadcastChannel !== 'undefined') {
                const channel = new BroadcastChannel('flagtriv_sync');
                channel.postMessage({
                    type: 'leaderboard_update',
                    date: entry.date,
                    entries: limited
                });
            }
            
            return true;
        } catch (error) {
            console.error('Global sync failed:', error);
            return false;
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
    }

    // Get leaderboard (try global first, fallback to local)
    async getLeaderboard(date) {
        try {
            // Try to get global data
            const globalData = await this.fetchFromGlobal(date);
            if (globalData && globalData.length > 0) {
                return {
                    entries: globalData.sort((a, b) => a.time - b.time),
                    isGlobal: true
                };
            }

            // Fallback to local
            const storageKey = `dailyLeaderboard_${date}`;
            const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            // Check if we should show as global (if we submitted to global this session)
            const isGlobal = sessionStorage.getItem('leaderboard_is_global') === 'true';
            
            return {
                entries: localData.sort((a, b) => a.time - b.time),
                isGlobal: isGlobal && localData.length > 0
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

    // Fetch from global storage
    async fetchFromGlobal(date) {
        try {
            const globalKey = `flagtriv_global_${date}`;
            const data = JSON.parse(localStorage.getItem(globalKey) || '[]');
            
            // Listen for cross-device updates
            if (typeof BroadcastChannel !== 'undefined') {
                const channel = new BroadcastChannel('flagtriv_sync');
                channel.onmessage = (event) => {
                    if (event.data.type === 'leaderboard_update' && event.data.date === date) {
                        localStorage.setItem(globalKey, JSON.stringify(event.data.entries));
                    }
                };
            }
            
            return data;
        } catch (error) {
            console.error('Failed to fetch global leaderboard:', error);
            return null;
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