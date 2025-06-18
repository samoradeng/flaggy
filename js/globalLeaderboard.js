class GlobalLeaderboard {
    constructor() {
        this.initializeSupabase();
        this.fallbackToLocal = true;
    }

    // Initialize Supabase with proper error handling
    initializeSupabase() {
        try {
            // Check if Supabase is available globally
            if (typeof window !== 'undefined' && window.supabase) {
                this.supabase = window.supabase;
                this.useRealBackend = true;
                console.log('✅ Global leaderboard using Supabase');
            } else {
                // Fallback to localStorage
                this.supabase = null;
                this.useRealBackend = false;
                console.warn('⚠️ Supabase not available - using localStorage fallback for leaderboard');
            }
        } catch (error) {
            console.error('Error initializing Supabase for leaderboard:', error);
            this.supabase = null;
            this.useRealBackend = false;
        }
    }

    // Validate Supabase connection before use
    validateSupabaseConnection() {
        if (!this.useRealBackend || !this.supabase) {
            return false;
        }
        
        // Check if the from method exists
        if (typeof this.supabase.from !== 'function') {
            console.error('❌ Supabase client is invalid for leaderboard');
            this.useRealBackend = false;
            return false;
        }
        
        return true;
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
                player_name: playerName,
                country: country,
                time_spent: timeSpent,
                attempts: attempts,
                date: date
            };

            // Always try Supabase first if available
            if (this.validateSupabaseConnection()) {
                console.log('🔄 Submitting to global leaderboard via Supabase...');
                
                try {
                    const { data, error } = await this.supabase
                        .from('daily_leaderboard')
                        .insert(entry)
                        .select()
                        .single();

                    if (error) {
                        console.error('Supabase leaderboard error:', error);
                        throw new Error(error.message);
                    }

                    console.log('✅ Score submitted to global leaderboard successfully');
                    
                    // Also save locally as backup
                    this.submitToLocalStorage({
                        name: playerName,
                        country: country,
                        time: timeSpent,
                        attempts: attempts,
                        date: date,
                        timestamp: Date.now(),
                        id: this.generateEntryId()
                    });
                    
                    return { success: true, global: true };
                } catch (supabaseError) {
                    console.error('Supabase submission failed, falling back to localStorage:', supabaseError);
                    // Fall through to localStorage fallback
                }
            }
            
            // Use local fallback
            console.log('🔄 Using localStorage fallback for leaderboard...');
            this.submitToLocalStorage({
                name: playerName,
                country: country,
                time: timeSpent,
                attempts: attempts,
                date: date,
                timestamp: Date.now(),
                id: this.generateEntryId()
            });
            
            return { success: true, global: false };
            
        } catch (error) {
            console.error('Failed to submit score:', error);
            // Final fallback to local
            this.submitToLocalStorage({
                name: playerName,
                country: country,
                time: timeSpent,
                attempts: attempts,
                date: date,
                timestamp: Date.now(),
                id: this.generateEntryId()
            });
            return { success: true, global: false };
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
            // Always try Supabase first if available
            if (this.validateSupabaseConnection()) {
                console.log('🔄 Fetching global leaderboard from Supabase...');
                
                try {
                    const { data, error } = await this.supabase
                        .from('daily_leaderboard')
                        .select('*')
                        .eq('date', date)
                        .order('time_spent', { ascending: true })
                        .order('submitted_at', { ascending: true })
                        .limit(100);

                    if (error) {
                        console.error('Error fetching leaderboard:', error);
                        throw new Error(error.message);
                    }

                    if (data && data.length > 0) {
                        console.log('✅ Global leaderboard fetched successfully:', data.length, 'entries');
                        
                        // Convert to expected format
                        const entries = data.map(entry => ({
                            name: entry.player_name,
                            country: entry.country,
                            time: entry.time_spent,
                            attempts: entry.attempts,
                            date: entry.date,
                            timestamp: new Date(entry.submitted_at).getTime(),
                            id: entry.id
                        }));
                        
                        return {
                            entries: entries,
                            isGlobal: true
                        };
                    } else {
                        console.log('📊 No global entries found for today');
                        // Fall through to local fallback
                    }
                } catch (supabaseError) {
                    console.error('Supabase fetch failed, trying localStorage:', supabaseError);
                    // Fall through to localStorage
                }
            }

            // Fallback to local
            console.log('🔄 Using localStorage fallback for leaderboard...');
            const storageKey = `dailyLeaderboard_${date}`;
            const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            return {
                entries: localData.sort((a, b) => a.time - b.time),
                isGlobal: false
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