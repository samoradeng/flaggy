/**
 * Analytics - Full funnel tracking via Supabase
 *
 * Tracks: Visit → Start → Finish → Share → Friend plays → Return
 * With source attribution for viral tracking.
 *
 * SQL to create/update tables in Supabase:
 *
 * -- Main events table (enhanced)
 * CREATE TABLE IF NOT EXISTS analytics_events (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   device_id TEXT NOT NULL,
 *   event_type TEXT NOT NULL,
 *   event_data JSONB DEFAULT '{}',
 *   app_version TEXT,
 *   platform TEXT,
 *   session_id TEXT,
 *   referrer_device_id TEXT,
 *   source TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 *
 * -- Users table for retention tracking
 * CREATE TABLE IF NOT EXISTS analytics_users (
 *   device_id TEXT PRIMARY KEY,
 *   first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   session_count INTEGER DEFAULT 1,
 *   total_games INTEGER DEFAULT 0,
 *   total_shares INTEGER DEFAULT 0,
 *   referred_by TEXT,
 *   referral_source TEXT,
 *   platform TEXT,
 *   is_test_device BOOLEAN DEFAULT FALSE
 * );
 *
 * -- Referrals table for viral tracking
 * CREATE TABLE IF NOT EXISTS analytics_referrals (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   referrer_device_id TEXT NOT NULL,
 *   referred_device_id TEXT NOT NULL,
 *   source TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   UNIQUE(referrer_device_id, referred_device_id)
 * );
 *
 * -- Indexes
 * CREATE INDEX IF NOT EXISTS idx_events_device ON analytics_events(device_id);
 * CREATE INDEX IF NOT EXISTS idx_events_type ON analytics_events(event_type);
 * CREATE INDEX IF NOT EXISTS idx_events_created ON analytics_events(created_at);
 * CREATE INDEX IF NOT EXISTS idx_events_source ON analytics_events(source);
 * CREATE INDEX IF NOT EXISTS idx_users_first_seen ON analytics_users(first_seen_at);
 * CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON analytics_referrals(referrer_device_id);
 *
 * -- RLS policies
 * ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE analytics_users ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE analytics_referrals ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Allow inserts" ON analytics_events FOR INSERT WITH CHECK (true);
 * CREATE POLICY "Allow inserts" ON analytics_users FOR INSERT WITH CHECK (true);
 * CREATE POLICY "Allow updates" ON analytics_users FOR UPDATE USING (true);
 * CREATE POLICY "Allow inserts" ON analytics_referrals FOR INSERT WITH CHECK (true);
 */

class Analytics {
    constructor() {
        this.deviceId = this.getOrCreateDeviceId();
        this.sessionId = this.createSessionId();
        this.appVersion = '1.0.0';
        this.platform = this.detectPlatform();
        this.queue = [];
        this.isOnline = navigator.onLine;
        this.source = null;
        this.referrerDeviceId = null;
        this.isFirstVisit = false;
        this.sessionCount = 0;

        // Game tracking - links start to complete
        this.currentGameId = null;
        this.currentGameMode = null;
        this.currentGameStartTime = null;

        // Parse URL for source attribution
        this.parseSourceFromUrl();

        // Load user state
        this.loadUserState();

        // Check for ?test=1 URL param to mark as test device
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('test') === '1') {
            this.markAsTestDevice();
        }

        // Listen for online/offline
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.flushQueue();
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    getOrCreateDeviceId() {
        let deviceId = localStorage.getItem('analytics_device_id');
        if (!deviceId) {
            deviceId = 'dev_' + crypto.randomUUID();
            localStorage.setItem('analytics_device_id', deviceId);
        }
        return deviceId;
    }

    createSessionId() {
        return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    detectPlatform() {
        const ua = navigator.userAgent;
        if (window.Capacitor?.isNativePlatform()) {
            if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
            if (/Android/.test(ua)) return 'android';
            return 'native';
        }
        if (/iPad|iPhone|iPod/.test(ua)) return 'ios-web';
        if (/Android/.test(ua)) return 'android-web';
        return 'web';
    }

    parseSourceFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);

        // Check for referral link (ref=deviceId)
        const ref = urlParams.get('ref');
        if (ref) {
            this.referrerDeviceId = ref;
            this.source = 'referral';
            // Store for later (in case page reloads)
            sessionStorage.setItem('referrer_device_id', ref);
        }

        // Check for campaign source (src=campaign_name)
        const src = urlParams.get('src');
        if (src) {
            this.source = src;
        }

        // Check for UTM source
        const utmSource = urlParams.get('utm_source');
        if (utmSource && !this.source) {
            this.source = utmSource;
        }

        // Restore from session if page reloaded
        if (!this.referrerDeviceId) {
            this.referrerDeviceId = sessionStorage.getItem('referrer_device_id');
        }

        // Clean URL (remove tracking params)
        if (ref || src || utmSource) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }

    loadUserState() {
        const firstVisitDate = localStorage.getItem('analytics_first_visit');
        const sessionCount = parseInt(localStorage.getItem('analytics_session_count') || '0');

        if (!firstVisitDate) {
            // New user!
            this.isFirstVisit = true;
            this.sessionCount = 1;
            localStorage.setItem('analytics_first_visit', new Date().toISOString());
            localStorage.setItem('analytics_session_count', '1');
        } else {
            this.isFirstVisit = false;
            this.sessionCount = sessionCount + 1;
            localStorage.setItem('analytics_session_count', String(this.sessionCount));
        }

        // Store last visit
        localStorage.setItem('analytics_last_visit', new Date().toISOString());
    }

    getDaysSinceFirstVisit() {
        const firstVisit = localStorage.getItem('analytics_first_visit');
        if (!firstVisit) return 0;
        const days = Math.floor((Date.now() - new Date(firstVisit).getTime()) / (1000 * 60 * 60 * 24));
        return days;
    }

    // Generate a shareable referral link
    getShareLink(campaign = null) {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        params.set('ref', this.deviceId);
        if (campaign) {
            params.set('src', campaign);
        }
        return `${baseUrl}?${params.toString()}`;
    }

    async track(eventType, eventData = {}) {
        const event = {
            device_id: this.deviceId,
            event_type: eventType,
            event_data: {
                ...eventData,
                is_first_visit: this.isFirstVisit,
                session_count: this.sessionCount,
                days_since_first: this.getDaysSinceFirstVisit()
            },
            app_version: this.appVersion,
            platform: this.platform,
            session_id: this.sessionId,
            referrer_device_id: this.referrerDeviceId,
            source: this.source,
            created_at: new Date().toISOString()
        };

        // Try to send immediately
        if (this.isOnline && window.supabase) {
            try {
                const { error } = await window.supabase
                    .from('analytics_events')
                    .insert(event);

                if (error) {
                    console.warn('Analytics send failed, queuing:', error.message);
                    this.queueEvent(event);
                }
            } catch (e) {
                console.warn('Analytics error, queuing:', e.message);
                this.queueEvent(event);
            }
        } else {
            this.queueEvent(event);
        }
    }

    queueEvent(event) {
        this.queue.push(event);
        if (this.queue.length > 100) {
            this.queue.shift();
        }
        localStorage.setItem('analytics_queue', JSON.stringify(this.queue));
    }

    async flushQueue() {
        if (!window.supabase || this.queue.length === 0) return;

        const savedQueue = localStorage.getItem('analytics_queue');
        if (savedQueue) {
            try {
                this.queue = JSON.parse(savedQueue);
            } catch (e) {}
        }

        if (this.queue.length === 0) return;

        const eventsToSend = [...this.queue];
        this.queue = [];
        localStorage.removeItem('analytics_queue');

        try {
            const { error } = await window.supabase
                .from('analytics_events')
                .insert(eventsToSend);

            if (error) {
                this.queue = eventsToSend;
                localStorage.setItem('analytics_queue', JSON.stringify(this.queue));
            }
        } catch (e) {
            this.queue = eventsToSend;
            localStorage.setItem('analytics_queue', JSON.stringify(this.queue));
        }
    }

    // Update user record (for retention tracking)
    async updateUserRecord() {
        if (!window.supabase) return;

        try {
            const { error } = await window.supabase
                .from('analytics_users')
                .upsert({
                    device_id: this.deviceId,
                    last_seen_at: new Date().toISOString(),
                    session_count: this.sessionCount,
                    platform: this.platform,
                    referred_by: this.referrerDeviceId,
                    referral_source: this.source
                }, {
                    onConflict: 'device_id'
                });

            if (error) {
                console.warn('User record update failed:', error.message);
            }
        } catch (e) {
            console.warn('User record error:', e.message);
        }
    }

    // Record a referral
    async recordReferral() {
        if (!window.supabase || !this.referrerDeviceId || this.referrerDeviceId === this.deviceId) return;

        // Only record on first visit
        if (!this.isFirstVisit) return;

        try {
            const { error } = await window.supabase
                .from('analytics_referrals')
                .insert({
                    referrer_device_id: this.referrerDeviceId,
                    referred_device_id: this.deviceId,
                    source: this.source
                });

            if (error && !error.message.includes('duplicate')) {
                console.warn('Referral record failed:', error.message);
            }
        } catch (e) {
            console.warn('Referral error:', e.message);
        }
    }

    // ========== Convenience Methods ==========

    trackAppOpen() {
        // Debounce: don't fire if we fired in the last 30 seconds (prevents refresh spam)
        const lastOpen = sessionStorage.getItem('analytics_last_app_open');
        const now = Date.now();
        if (lastOpen && (now - parseInt(lastOpen)) < 30000) {
            return; // Skip duplicate within 30s
        }
        sessionStorage.setItem('analytics_last_app_open', String(now));

        this.track('app_open', {
            referrer: document.referrer || null,
            url_source: this.source,
            referred_by: this.referrerDeviceId,
            is_test: this.isTestDevice()
        });

        // Update user record and record referral
        this.updateUserRecord();
        if (this.isFirstVisit && this.referrerDeviceId) {
            this.recordReferral();
        }
    }

    trackGameStart(mode) {
        // Create a unique game ID to link start→complete
        this.currentGameId = 'game_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        this.currentGameMode = mode;
        this.currentGameStartTime = Date.now();

        this.track('game_start', {
            mode,
            game_id: this.currentGameId,
            is_test: this.isTestDevice()
        });
    }

    trackPracticeGame(score, streak) {
        this.track('practice_game', {
            score,
            streak,
            game_id: this.currentGameId,
            duration_ms: this.currentGameStartTime ? Date.now() - this.currentGameStartTime : null,
            is_test: this.isTestDevice()
        });
        this.currentGameId = null;
        this.incrementUserStat('total_games');
    }

    trackDailyComplete(score, total, timeMs, dayNumber) {
        this.track('daily_complete', {
            score,
            total,
            timeMs,
            dayNumber,
            game_id: this.currentGameId,
            is_test: this.isTestDevice()
        });
        this.currentGameId = null;
        this.incrementUserStat('total_games');
    }

    trackShare(type, platform = null) {
        this.track('share', {
            type,
            platform,
            share_link: this.getShareLink(type),
            is_test: this.isTestDevice()
        });
        this.incrementUserStat('total_shares');
    }

    trackChallengeCreated(flagCount, continent) {
        this.track('challenge_created', { flagCount, continent, is_test: this.isTestDevice() });
    }

    trackChallengeJoined(gameId) {
        this.track('challenge_joined', { gameId, is_test: this.isTestDevice() });
    }

    trackLeaderboardView() {
        this.track('leaderboard_view', { is_test: this.isTestDevice() });
    }

    trackScreenView(screenName) {
        this.track('screen_view', { screen: screenName, is_test: this.isTestDevice() });
    }

    // Increment a stat on the user record
    async incrementUserStat(stat) {
        if (!window.supabase) return;

        try {
            // Use RPC for atomic increment, or just update with current value
            const currentValue = parseInt(localStorage.getItem(`analytics_${stat}`) || '0') + 1;
            localStorage.setItem(`analytics_${stat}`, String(currentValue));
        } catch (e) {
            // Silent fail
        }
    }

    // Mark current device as test (for exclusion from analytics)
    markAsTestDevice() {
        localStorage.setItem('analytics_is_test', 'true');
        console.log('✅ This device marked as TEST - analytics will be tagged');
        if (window.supabase) {
            window.supabase
                .from('analytics_users')
                .update({ is_test_device: true })
                .eq('device_id', this.deviceId);
        }
    }

    // Unmark as test device
    unmarkAsTestDevice() {
        localStorage.removeItem('analytics_is_test');
        console.log('✅ This device unmarked as test');
        if (window.supabase) {
            window.supabase
                .from('analytics_users')
                .update({ is_test_device: false })
                .eq('device_id', this.deviceId);
        }
    }

    isTestDevice() {
        return localStorage.getItem('analytics_is_test') === 'true';
    }
}

// Global instance
window.analytics = new Analytics();

// Track app open on load - wait for Supabase to initialize
document.addEventListener('DOMContentLoaded', () => {
    // Give Supabase a moment to initialize (it also runs on DOMContentLoaded)
    const waitForSupabase = (retries = 10) => {
        if (window.supabase) {
            window.analytics?.trackAppOpen();
            window.analytics?.flushQueue();
        } else if (retries > 0) {
            setTimeout(() => waitForSupabase(retries - 1), 100);
        } else {
            // Send anyway - will queue if Supabase not available
            window.analytics?.trackAppOpen();
        }
    };
    waitForSupabase();
});
