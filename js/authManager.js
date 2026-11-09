/**
 * Auth Manager - Supabase Authentication & Cloud Sync
 *
 * Setup:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Get your project URL and anon key from Settings > API
 * 3. Replace SUPABASE_URL and SUPABASE_ANON_KEY below
 * 4. Enable Apple and Google auth providers in Authentication > Providers
 * 5. Create the user_progress table (SQL below)
 *
 * SQL to create table:
 *
 * CREATE TABLE user_progress (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
 *   daily_stats JSONB DEFAULT '{}',
 *   best_streak INTEGER DEFAULT 0,
 *   total_xp INTEGER DEFAULT 0,
 *   challenge_stats JSONB DEFAULT '{}',
 *   achievements JSONB DEFAULT '[]',
 *   premium_state JSONB DEFAULT '{}',
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   UNIQUE(user_id)
 * );
 *
 * -- Enable Row Level Security
 * ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
 *
 * -- Users can only access their own data
 * CREATE POLICY "Users can view own progress" ON user_progress
 *   FOR SELECT USING (auth.uid() = user_id);
 *
 * CREATE POLICY "Users can insert own progress" ON user_progress
 *   FOR INSERT WITH CHECK (auth.uid() = user_id);
 *
 * CREATE POLICY "Users can update own progress" ON user_progress
 *   FOR UPDATE USING (auth.uid() = user_id);
 */

// Supabase configuration
const SUPABASE_URL = 'https://piydwvszbczwaqerxhvd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpeWR3dnN6YmN6d2FxZXJ4aHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4ODM0NzIsImV4cCI6MjA2NTQ1OTQ3Mn0.nJ0IkdexK8IpULbdbkzORwrFMraGF0vkJfHCgBliOGk';

class AuthManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.syncCallbacks = [];
        this.isConfigured = SUPABASE_URL !== 'YOUR_SUPABASE_URL';

        if (this.isConfigured) {
            this.initSupabase();
        } else {
            console.log('⚠️ Supabase not configured - using local storage only');
            this.loadLocalUser();
        }
    }

    initSupabase() {
        // Load Supabase client if available
        if (typeof window.supabase !== 'undefined') {
            this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            this.setupAuthListener();
        } else {
            console.warn('Supabase client not loaded');
            this.loadLocalUser();
        }
    }

    setupAuthListener() {
        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Auth state changed:', event);
            if (session?.user) {
                this.currentUser = {
                    uid: session.user.id,
                    displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                    email: session.user.email,
                    provider: session.user.app_metadata?.provider || 'email',
                    avatar: session.user.user_metadata?.avatar_url
                };
                this.saveLocalUser();
                this.syncFromCloud();
            } else {
                this.currentUser = null;
                this.saveLocalUser();
            }
            this.notifyAuthChange();
            this.updateUI();
        });

        // Check initial session
        this.supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                this.currentUser = {
                    uid: session.user.id,
                    displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                    email: session.user.email,
                    provider: session.user.app_metadata?.provider || 'email',
                    avatar: session.user.user_metadata?.avatar_url
                };
                this.saveLocalUser();
                this.updateUI();
            }
        });
    }

    loadLocalUser() {
        const saved = localStorage.getItem('authUser');
        if (saved) {
            try {
                this.currentUser = JSON.parse(saved);
            } catch (e) {
                this.currentUser = null;
            }
        }
    }

    saveLocalUser() {
        if (this.currentUser) {
            localStorage.setItem('authUser', JSON.stringify(this.currentUser));
        } else {
            localStorage.removeItem('authUser');
        }
    }

    // ========== Auth State ==========

    isSignedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserDisplayName() {
        return this.currentUser?.displayName || 'Guest';
    }

    getUserId() {
        return this.currentUser?.uid || null;
    }

    // ========== Sign In Methods ==========

    getRedirectUrl() {
        // For Capacitor iOS/Android apps, use the custom URL scheme
        if (window.Capacitor?.isNativePlatform()) {
            return 'com.flagtriv.app://auth-callback';
        }
        // For web, use the current origin
        return window.location.origin;
    }

    async signInWithApple() {
        if (!this.isConfigured || !this.supabase) {
            return this.simulateSignIn('apple');
        }

        console.log('🍎 Signing in with Apple...');
        const redirectTo = this.getRedirectUrl();
        console.log('📍 Redirect URL:', redirectTo);

        const { data, error } = await this.supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: redirectTo,
                skipBrowserRedirect: window.Capacitor?.isNativePlatform() ? false : false
            }
        });

        if (error) {
            console.error('Apple sign in error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    }

    async signInWithGoogle() {
        if (!this.isConfigured || !this.supabase) {
            return this.simulateSignIn('google');
        }

        console.log('🔵 Signing in with Google...');
        const redirectTo = this.getRedirectUrl();
        console.log('📍 Redirect URL:', redirectTo);

        const { data, error } = await this.supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectTo
            }
        });

        if (error) {
            console.error('Google sign in error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    }

    async signOut() {
        if (this.supabase) {
            await this.supabase.auth.signOut();
        }
        this.currentUser = null;
        this.saveLocalUser();
        this.notifyAuthChange();
        this.updateUI();
        return { success: true };
    }

    // Simulate sign in for demo (when Supabase not configured)
    async simulateSignIn(provider) {
        console.log(`🔄 Simulating ${provider} sign in...`);
        await new Promise(resolve => setTimeout(resolve, 800));

        this.currentUser = {
            uid: `${provider}_${Math.random().toString(36).substring(2, 10)}`,
            displayName: provider === 'apple' ? 'Apple User' : 'Google User',
            email: provider === 'google' ? 'user@gmail.com' : null,
            provider: provider
        };

        this.saveLocalUser();
        await this.syncFromCloud();
        this.notifyAuthChange();
        this.updateUI();
        this.hideSignInModal();
        this.showToast(`✅ Signed in as ${this.currentUser.displayName}`);

        return { success: true, user: this.currentUser };
    }

    // ========== Cloud Sync ==========

    async syncFromCloud() {
        if (!this.isSignedIn()) return null;

        console.log('☁️ Syncing from cloud...');

        if (this.supabase && this.isConfigured) {
            // Fetch from Supabase
            const { data, error } = await this.supabase
                .from('user_progress')
                .select('*')
                .eq('user_id', this.currentUser.uid)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
                console.error('Sync error:', error);
                return null;
            }

            if (data) {
                this.mergeData(data);
                this.showToast('☁️ Progress synced!');
                return data;
            } else {
                // First time sync - upload local data
                await this.syncToCloud();
                return null;
            }
        } else {
            // Local simulation
            const cloudData = localStorage.getItem(`cloudData_${this.currentUser.uid}`);
            if (cloudData) {
                this.mergeData(JSON.parse(cloudData));
                return JSON.parse(cloudData);
            }
            await this.syncToCloud();
            return null;
        }
    }

    async syncToCloud() {
        if (!this.isSignedIn()) return false;

        console.log('☁️ Syncing to cloud...');

        const data = {
            user_id: this.currentUser.uid,
            daily_stats: JSON.parse(localStorage.getItem('dailyStats') || '{}'),
            best_streak: parseInt(localStorage.getItem('bestStreak') || '0'),
            total_xp: parseInt(localStorage.getItem('totalXP') || '0'),
            challenge_stats: {
                timesPlayed: localStorage.getItem('challengeTimesPlayed'),
                highestScore: localStorage.getItem('challengeHighestScore'),
                totalScore: localStorage.getItem('challengeTotalScore')
            },
            achievements: JSON.parse(localStorage.getItem('achievements') || '[]'),
            premium_state: JSON.parse(localStorage.getItem('premiumState') || '{}'),
            updated_at: new Date().toISOString()
        };

        if (this.supabase && this.isConfigured) {
            const { error } = await this.supabase
                .from('user_progress')
                .upsert(data, { onConflict: 'user_id' });

            if (error) {
                console.error('Sync to cloud error:', error);
                return false;
            }
        } else {
            // Local simulation
            localStorage.setItem(`cloudData_${this.currentUser.uid}`, JSON.stringify(data));
        }

        console.log('📤 Data synced to cloud');
        return true;
    }

    mergeData(cloudData) {
        // Daily stats - take cloud if streak is higher
        const localDailyStats = JSON.parse(localStorage.getItem('dailyStats') || '{}');
        const cloudDailyStats = cloudData.daily_stats || {};

        if (cloudDailyStats.streak > (localDailyStats.streak || 0)) {
            localStorage.setItem('dailyStats', JSON.stringify(cloudDailyStats));
            console.log('📥 Updated daily stats from cloud');
        }

        // Best streak - take higher
        const localBestStreak = parseInt(localStorage.getItem('bestStreak') || '0');
        if (cloudData.best_streak > localBestStreak) {
            localStorage.setItem('bestStreak', cloudData.best_streak.toString());
        }

        // XP - take higher
        const localXP = parseInt(localStorage.getItem('totalXP') || '0');
        if (cloudData.total_xp > localXP) {
            localStorage.setItem('totalXP', cloudData.total_xp.toString());
        }

        // Challenge stats - take higher scores
        if (cloudData.challenge_stats) {
            const cs = cloudData.challenge_stats;
            const localHigh = parseInt(localStorage.getItem('challengeHighestScore') || '0');
            if (parseInt(cs.highestScore || '0') > localHigh) {
                localStorage.setItem('challengeHighestScore', cs.highestScore);
            }
        }
    }

    // Auto-sync when data changes
    async autoSync() {
        if (this.isSignedIn()) {
            await this.syncToCloud();
        }
    }

    // ========== Callbacks ==========

    onAuthStateChange(callback) {
        this.syncCallbacks.push(callback);
    }

    notifyAuthChange() {
        this.syncCallbacks.forEach(cb => cb(this.currentUser));
    }

    // ========== UI ==========

    showSignInModal() {
        const modal = document.getElementById('sign-in-modal');
        if (modal) modal.style.display = 'flex';
    }

    hideSignInModal() {
        const modal = document.getElementById('sign-in-modal');
        if (modal) modal.style.display = 'none';
    }

    showSignInPrompt(reason = 'general') {
        const reasons = {
            'streak': '🔥 Sign in to protect your streak across devices!',
            'sync': '☁️ Sign in to sync your progress to the cloud!',
            'leaderboard': '🏆 Sign in to compete on global leaderboards!',
            'general': '✨ Sign in to never lose your progress!'
        };

        const reasonText = document.getElementById('sign-in-reason');
        if (reasonText) {
            reasonText.textContent = reasons[reason] || reasons.general;
        }

        this.showSignInModal();
    }

    updateUI() {
        const signInPrompt = document.getElementById('sign-in-prompt');
        const userInfo = document.getElementById('user-info');
        const userName = document.getElementById('user-name-display');

        if (this.isSignedIn()) {
            if (signInPrompt) signInPrompt.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex';
            if (userName) userName.textContent = this.getUserDisplayName();
        } else {
            if (signInPrompt) signInPrompt.style.display = 'flex';
            if (userInfo) userInfo.style.display = 'none';
        }
    }

    showToast(message) {
        const existingToast = document.querySelector('.auth-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'auth-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
}

// Global instance
window.authManager = new AuthManager();

// Handle deep links for OAuth callback (Capacitor apps)
if (window.Capacitor?.isNativePlatform()) {
    import('@capacitor/app').then(({ App }) => {
        App.addListener('appUrlOpen', async (event) => {
            console.log('🔗 Deep link received:', event.url);

            // Check if this is an auth callback
            if (event.url.includes('auth-callback') || event.url.includes('access_token') || event.url.includes('code=')) {
                // Extract the hash or query params
                const url = new URL(event.url);
                const hashParams = new URLSearchParams(url.hash.substring(1));
                const queryParams = url.searchParams;

                // Get access token from hash (implicit flow) or handle code (PKCE flow)
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');

                if (accessToken && window.authManager?.supabase) {
                    console.log('🔑 Setting session from deep link...');
                    const { data, error } = await window.authManager.supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });

                    if (error) {
                        console.error('Error setting session:', error);
                    } else {
                        console.log('✅ Session set successfully');
                        window.authManager.hideSignInModal();
                        window.authManager.showToast('✅ Signed in successfully!');
                    }
                }
            }
        });
    }).catch(err => {
        console.log('App plugin not available:', err);
    });
}

// Auto-sync on page unload
window.addEventListener('beforeunload', () => {
    if (window.authManager?.isSignedIn()) {
        window.authManager.syncToCloud();
    }
});
