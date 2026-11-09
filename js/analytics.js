/**
 * Analytics - Anonymous event tracking via Supabase
 *
 * Tracks user behavior to inform monetization decisions.
 * No personal data collected - uses anonymous device ID only.
 *
 * SQL to create table in Supabase:
 *
 * CREATE TABLE analytics_events (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   device_id TEXT NOT NULL,
 *   event_type TEXT NOT NULL,
 *   event_data JSONB DEFAULT '{}',
 *   app_version TEXT,
 *   platform TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 *
 * -- Index for querying
 * CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
 * CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
 *
 * -- Allow anonymous inserts (no auth required)
 * ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Allow anonymous inserts" ON analytics_events
 *   FOR INSERT WITH CHECK (true);
 * -- No SELECT policy = users can't read others' data
 */

class Analytics {
    constructor() {
        this.deviceId = this.getOrCreateDeviceId();
        this.appVersion = '1.0.0';
        this.platform = this.detectPlatform();
        this.queue = [];
        this.isOnline = navigator.onLine;

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

    async track(eventType, eventData = {}) {
        const event = {
            device_id: this.deviceId,
            event_type: eventType,
            event_data: eventData,
            app_version: this.appVersion,
            platform: this.platform,
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
        // Keep queue bounded
        if (this.queue.length > 100) {
            this.queue.shift();
        }
        // Persist queue
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
                // Re-queue on failure
                this.queue = eventsToSend;
                localStorage.setItem('analytics_queue', JSON.stringify(this.queue));
            }
        } catch (e) {
            this.queue = eventsToSend;
            localStorage.setItem('analytics_queue', JSON.stringify(this.queue));
        }
    }

    // ========== Convenience Methods ==========

    trackAppOpen() {
        this.track('app_open', {
            referrer: document.referrer || null
        });
    }

    trackPracticeGame(score, streak) {
        this.track('practice_game', { score, streak });
    }

    trackDailyComplete(score, total, timeMs, dayNumber) {
        this.track('daily_complete', { score, total, timeMs, dayNumber });
    }

    trackShare(type, platform = null) {
        this.track('share', { type, platform });
    }

    trackChallengeCreated(flagCount, continent) {
        this.track('challenge_created', { flagCount, continent });
    }

    trackChallengeJoined(gameId) {
        this.track('challenge_joined', { gameId });
    }

    trackLeaderboardView() {
        this.track('leaderboard_view');
    }

    trackScreenView(screenName) {
        this.track('screen_view', { screen: screenName });
    }
}

// Global instance
window.analytics = new Analytics();

// Track app open on load
document.addEventListener('DOMContentLoaded', () => {
    window.analytics?.trackAppOpen();
});
