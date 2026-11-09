class GlobalLeaderboard {
    constructor() {
        this.initializeSupabase();
        this.retryAttempts = 3;
        this.retryDelay = 2000; // 2 seconds
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
                // NO FALLBACK - Supabase is required for global functionality
                this.supabase = null;
                this.useRealBackend = false;
                console.error('❌ Supabase not available - global leaderboard will not work');
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

    // Retry function for network operations
    async retryOperation(operation, maxRetries = this.retryAttempts) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();
                return result;
            } catch (error) {
                console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    throw error; // Final attempt failed
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    }

    // Calculate fair score (lower is better)
    calculateScore(timeMilliseconds, attempts) {
        // Base score is time in milliseconds
        // Add penalty: (attempts - 1) * 10000ms (10 seconds per extra attempt)
        // This ensures first-attempt accuracy is always rewarded
        return timeMilliseconds + ((attempts - 1) * 10000);
    }

    // Submit score to global leaderboard with retries
    // timeMs: time in milliseconds (precise)
    // Only keeps best score per player per day
    async submitScore(playerName, timeMs, attempts, date) {
        // Check if Supabase is available
        if (!this.validateSupabaseConnection()) {
            console.error('❌ Cannot submit to global leaderboard - Supabase not available');
            return {
                success: false,
                global: false,
                error: 'Global leaderboard unavailable. Please check your connection and try again.'
            };
        }

        try {
            const country = await this.getUserCountry();

            const timeMilliseconds = Math.round(timeMs);
            const score = this.calculateScore(timeMilliseconds, attempts);

            // Check if player already has an entry for today
            const { data: existing } = await this.supabase
                .from('daily_leaderboard')
                .select('id, score')
                .eq('player_name', playerName)
                .eq('date', date)
                .single();

            // If existing entry has better (lower) score, keep it
            if (existing && existing.score <= score) {
                console.log('📊 Existing score is better, keeping it');
                return { success: true, global: true, message: 'Your previous score was better!' };
            }

            // Delete existing entry if any (we'll insert the new better one)
            if (existing) {
                await this.supabase
                    .from('daily_leaderboard')
                    .delete()
                    .eq('id', existing.id);
            }

            const entry = {
                player_name: playerName,
                country: country,
                time_spent: Math.round(timeMilliseconds / 1000), // Backward compat (seconds)
                time_milliseconds: timeMilliseconds,
                attempts: attempts,
                score: score,
                date: date
            };

            console.log('🔄 Submitting to global leaderboard via Supabase...');
            console.log('📊 Score calculation:', {
                timeMs: timeMilliseconds,
                attempts: attempts,
                penalty: (attempts - 1) * 10000,
                finalScore: score
            });

            // Use retry mechanism for submission
            const result = await this.retryOperation(async () => {
                const { data, error } = await this.supabase
                    .from('daily_leaderboard')
                    .insert(entry)
                    .select()
                    .single();

                if (error) {
                    throw new Error(`Database error: ${error.message}`);
                }

                return data;
            });

            console.log('✅ Score submitted to global leaderboard successfully');
            return { success: true, global: true };

        } catch (error) {
            console.error('❌ Failed to submit to global leaderboard after retries:', error);
            return {
                success: false,
                global: false,
                error: `Failed to submit to global leaderboard: ${error.message}. Please try again.`
            };
        }
    }

    // Get leaderboard with retries
    async getLeaderboard(date) {
        // Check if Supabase is available
        if (!this.validateSupabaseConnection()) {
            console.error('❌ Cannot fetch global leaderboard - Supabase not available');
            return {
                entries: [],
                isGlobal: false,
                error: 'Global leaderboard unavailable. Please check your connection.'
            };
        }

        try {
            console.log('🔄 Fetching global leaderboard from Supabase...');
            
            // Use retry mechanism for fetching
            const data = await this.retryOperation(async () => {
                const { data, error } = await this.supabase
                    .from('daily_leaderboard')
                    .select('*')
                    .eq('date', date)
                    .order('score', { ascending: true }) // Lower score = better rank
                    .order('submitted_at', { ascending: true }) // Tiebreaker: who submitted first
                    .limit(100);

                if (error) {
                    throw new Error(`Database error: ${error.message}`);
                }

                return data;
            });

            console.log('✅ Global leaderboard fetched successfully:', data.length, 'entries');
            
            // Convert to expected format
            const entries = data.map(entry => ({
                name: entry.player_name,
                country: entry.country,
                time: entry.time_spent, // Display time in seconds
                timeMs: entry.time_milliseconds || (entry.time_spent * 1000),
                attempts: entry.attempts,
                score: entry.score,
                date: entry.date,
                timestamp: new Date(entry.submitted_at).getTime(),
                id: entry.id
            }));
            
            return {
                entries: entries,
                isGlobal: true
            };
            
        } catch (error) {
            console.error('❌ Failed to fetch global leaderboard after retries:', error);
            return {
                entries: [],
                isGlobal: false,
                error: `Failed to fetch global leaderboard: ${error.message}`
            };
        }
    }

    // Generate unique entry ID
    generateEntryId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
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
                
                // Show time and attempts for context
                const timeDisplay = entry.timeMs && typeof formatTimeMs === 'function'
                    ? formatTimeMs(entry.timeMs)
                    : `${entry.time}s`;
                const attemptsDisplay = entry.attempts === 1 ? '1st try' : `${entry.attempts} tries`;

                text += `${medal} ${entry.name} (${entry.country}) - ${timeDisplay} (${attemptsDisplay})\n`;
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