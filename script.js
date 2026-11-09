// Debug: Log immediately on script load
console.log('🚀 Script starting...');

// Set random flag for splash screen - ALL world flags so everyone feels included
const allWorldFlags = [
    '🇦🇫','🇦🇱','🇩🇿','🇦🇸','🇦🇩','🇦🇴','🇦🇮','🇦🇶','🇦🇬','🇦🇷','🇦🇲','🇦🇼','🇦🇺','🇦🇹','🇦🇿',
    '🇧🇸','🇧🇭','🇧🇩','🇧🇧','🇧🇾','🇧🇪','🇧🇿','🇧🇯','🇧🇲','🇧🇹','🇧🇴','🇧🇦','🇧🇼','🇧🇷','🇧🇳',
    '🇧🇬','🇧🇫','🇧🇮','🇰🇭','🇨🇲','🇨🇦','🇨🇻','🇨🇫','🇹🇩','🇨🇱','🇨🇳','🇨🇴','🇰🇲','🇨🇬','🇨🇩',
    '🇨🇷','🇨🇮','🇭🇷','🇨🇺','🇨🇾','🇨🇿','🇩🇰','🇩🇯','🇩🇲','🇩🇴','🇪🇨','🇪🇬','🇸🇻','🇬🇶','🇪🇷',
    '🇪🇪','🇸🇿','🇪🇹','🇫🇯','🇫🇮','🇫🇷','🇬🇦','🇬🇲','🇬🇪','🇩🇪','🇬🇭','🇬🇷','🇬🇩','🇬🇹','🇬🇳',
    '🇬🇼','🇬🇾','🇭🇹','🇭🇳','🇭🇺','🇮🇸','🇮🇳','🇮🇩','🇮🇷','🇮🇶','🇮🇪','🇮🇱','🇮🇹','🇯🇲','🇯🇵',
    '🇯🇴','🇰🇿','🇰🇪','🇰🇮','🇰🇵','🇰🇷','🇰🇼','🇰🇬','🇱🇦','🇱🇻','🇱🇧','🇱🇸','🇱🇷','🇱🇾','🇱🇮',
    '🇱🇹','🇱🇺','🇲🇬','🇲🇼','🇲🇾','🇲🇻','🇲🇱','🇲🇹','🇲🇭','🇲🇷','🇲🇺','🇲🇽','🇫🇲','🇲🇩','🇲🇨',
    '🇲🇳','🇲🇪','🇲🇦','🇲🇿','🇲🇲','🇳🇦','🇳🇷','🇳🇵','🇳🇱','🇳🇿','🇳🇮','🇳🇪','🇳🇬','🇲🇰','🇳🇴',
    '🇴🇲','🇵🇰','🇵🇼','🇵🇸','🇵🇦','🇵🇬','🇵🇾','🇵🇪','🇵🇭','🇵🇱','🇵🇹','🇶🇦','🇷🇴','🇷🇺','🇷🇼',
    '🇰🇳','🇱🇨','🇻🇨','🇼🇸','🇸🇲','🇸🇹','🇸🇦','🇸🇳','🇷🇸','🇸🇨','🇸🇱','🇸🇬','🇸🇰','🇸🇮','🇸🇧',
    '🇸🇴','🇿🇦','🇸🇸','🇪🇸','🇱🇰','🇸🇩','🇸🇷','🇸🇪','🇨🇭','🇸🇾','🇹🇼','🇹🇯','🇹🇿','🇹🇭','🇹🇱',
    '🇹🇬','🇹🇴','🇹🇹','🇹🇳','🇹🇷','🇹🇲','🇹🇻','🇺🇬','🇺🇦','🇦🇪','🇬🇧','🇺🇸','🇺🇾','🇺🇿','🇻🇺',
    '🇻🇪','🇻🇳','🇾🇪','🇿🇲','🇿🇼','🇵🇷','🇭🇰','🇲🇴','🇽🇰','🇪🇭','🇧🇶','🇨🇼','🇸🇽','🇲🇫','🇧🇱'
];
const randomFlagEl = document.getElementById('random-flag');
if (randomFlagEl) {
    randomFlagEl.textContent = allWorldFlags[Math.floor(Math.random() * allWorldFlags.length)];
}

// Global variables
let countries = {};
let currentCountry = null;

// Convert country code to flag emoji (e.g., "PH" → "🇵🇭")
function countryCodeToFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
let options = [];
let score = 0;
let streak = 0;
let bestStreak = parseInt(localStorage.getItem('bestStreak')) || 0;
let lives = 3;
let gameMode = 'challenge'; // 'daily' or 'challenge' or 'multiplayer'
let usedCountries = [];
let totalXP = parseInt(localStorage.getItem('totalXP')) || 0;
let isMultiplayerMode = false; // Global flag for multiplayer mode
let countdownIntervalId = null; // Track countdown interval to prevent memory leaks
let difficulty = localStorage.getItem('difficulty') || 'easy'; // easy, medium, hard
let questionTimerId = null; // Timer for hard mode
let questionTimeLeft = 10; // Seconds for hard mode

// Initialize classes
let continentFilter;
let flagFacts;
let dailyChallenge;
let achievementSystem;
let soundEffects;
let multiplayerGame;

// Configure Capacitor plugins for native app
async function initializeCapacitor() {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
            const { StatusBar } = window.Capacitor.Plugins;
            if (StatusBar) {
                await StatusBar.setOverlaysWebView({ overlay: true });
                await StatusBar.setStyle({ style: 'LIGHT' });
            }
        } catch (e) {
            console.log('StatusBar plugin not available:', e);
        }

        // Handle deep links when app is opened from a URL
        try {
            const { App } = window.Capacitor.Plugins;
            if (App) {
                // Listen for app opened via URL while running
                App.addListener('appUrlOpen', (event) => {
                    console.log('App opened with URL:', event.url);
                    handleDeepLink(event.url);
                });
            }
        } catch (e) {
            console.log('App plugin not available:', e);
        }

        // Prevent zoom on double-tap and pinch
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        });
    }
}

// Handle deep links (game invites)
function handleDeepLink(url) {
    try {
        const urlObj = new URL(url);
        const gameId = urlObj.searchParams.get('game');

        if (gameId && multiplayerGame) {
            console.log('Joining game from deep link:', gameId);
            // Auto-join the game
            multiplayerGame.joinChallengeFromLink(gameId);
        }
    } catch (e) {
        console.log('Error handling deep link:', e);
    }
}

// Check for game parameter on page load
function checkForGameInvite() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');

    if (gameId) {
        console.log('Found game invite in URL:', gameId);
        // Wait for multiplayerGame to be initialized
        setTimeout(() => {
            if (multiplayerGame) {
                multiplayerGame.joinChallengeFromLink(gameId);
            }
        }, 500);
    }
}

// Load countries and initialize the game
async function loadCountries() {
    try {
        // Initialize Capacitor plugins first
        console.log('Starting loadCountries...');
        await initializeCapacitor();
        console.log('Capacitor initialized');

        // Use absolute path for iOS Capacitor compatibility
        let response;
        let lastError;
        const paths = ['/countries.json', './countries.json', 'countries.json'];

        for (const path of paths) {
            try {
                console.log('Trying path:', path);
                response = await fetch(path);
                console.log('Response for', path, ':', response.status, response.ok);
                if (response.ok) break;
            } catch (e) {
                console.log('Fetch error for', path, ':', e.name, e.message);
                lastError = e;
            }
        }

        if (!response || !response.ok) {
            throw new Error(`Could not load countries.json. Status: ${response?.status || 'none'}. Error: ${lastError?.message || 'unknown'}`);
        }

        countries = await response.json();
        console.log('Countries parsed successfully');

        // Initialize all systems after countries are loaded
        continentFilter = new ContinentFilter();
        flagFacts = new FlagFacts();
        dailyChallenge = new DailyChallenge(countries);
        achievementSystem = new AchievementSystem();
        soundEffects = new SoundEffects();
        multiplayerGame = new MultiplayerGame(countries, continentFilter, flagFacts, soundEffects);

        console.log('Countries loaded:', Object.keys(countries).length);
        initializeGame();

        // Hide animated splash screen after animation plays
        setTimeout(() => {
            const splash = document.getElementById('app-splash');
            if (splash) {
                splash.classList.add('hidden');
                setTimeout(() => splash.remove(), 500);
            }
        }, 3000);

        // Check if opened with a game invite link
        checkForGameInvite();
    } catch (error) {
        console.error('Error loading countries:', JSON.stringify(error));
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        const errorMsg = error.message || error.name || String(error) || 'Unknown error';
        document.body.innerHTML = `<div style="padding: 20px; font-family: sans-serif;">
            <h1>Error loading game data</h1>
            <p><strong>Error:</strong> ${errorMsg}</p>
            <p><strong>Type:</strong> ${error.name || 'Unknown'}</p>
            <p style="font-size: 12px; color: #666;">${error.stack || ''}</p>
            <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px;">Retry</button>
        </div>`;
    }
}

function initializeGame() {
    // Initialize UI elements
    initializeEventListeners();
    initializeSettings();
    initializeStats();
    updateMainMenuStats();

    // Validate and fix any stale streak data
    validateStreakData();

    // Show mode selection by default
    showModeSelection();
}

function validateStreakData() {
    // Fix stale streak data that might show incorrect values
    if (dailyChallenge) {
        const stats = dailyChallenge.dailyStats;
        const today = dailyChallenge.today;

        // If there's a streak but user hasn't played today and didn't play yesterday, reset it
        if (stats.streak > 0 && stats.lastPlayedDate) {
            const yesterday = new Date();
            yesterday.setUTCDate(yesterday.getUTCDate() - 1);
            const yesterdayStr = dailyChallenge.getStandardizedDateFromDate(yesterday);

            // If last played is not today and not yesterday, streak should be 0
            if (stats.lastPlayedDate !== today && stats.lastPlayedDate !== yesterdayStr) {
                console.log('Resetting stale streak from', stats.streak, 'to 0');
                dailyChallenge.dailyStats.streak = 0;
                dailyChallenge.saveDailyStats();
            }
        }

        // If no games have been played, ensure streak is 0
        if (stats.totalPlayed === 0 && stats.streak > 0) {
            console.log('Resetting invalid streak (no games played)');
            dailyChallenge.dailyStats.streak = 0;
            dailyChallenge.saveDailyStats();
        }
    }
}

function initializeEventListeners() {
    // Mode selection buttons
    const dailyChallengeBtn = document.getElementById('daily-challenge-btn');
    const challengeModeBtn = document.getElementById('challenge-mode-btn');
    const homeLogo = document.getElementById('home-logo-btn');
    
    if (dailyChallengeBtn) {
        dailyChallengeBtn.addEventListener('click', startDailyChallenge);
    }
    
    if (challengeModeBtn) {
        challengeModeBtn.addEventListener('click', startChallengeMode);
    }
    
    if (homeLogo) {
        homeLogo.addEventListener('click', goBackToMenu);
    }

    // Passport preview click - opens stats modal to passport tab
    const passportPreview = document.getElementById('passport-preview');
    if (passportPreview) {
        passportPreview.addEventListener('click', () => {
            showStatsModal();
            switchTab('passport');
        });
    }

    // Game controls
    const nextButton = document.getElementById('next');
    if (nextButton) {
        nextButton.addEventListener('click', nextQuestion);
    }

    // Stats modal
    const statsBtn = document.getElementById('stats-btn');
    const statsModal = document.getElementById('stats-modal');
    const closeStatsBtn = statsModal?.querySelector('.close-btn');
    const shareButton = document.getElementById('share-button');
    const seeStatsFromGameover = document.getElementById('see-stats-from-gameover');

    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            showStatsModal();
        });
    }

    if (closeStatsBtn) {
        closeStatsBtn.addEventListener('click', () => {
            statsModal.style.display = 'none';
            showModeSelection();
        });
    }

    if (shareButton) {
        shareButton.addEventListener('click', shareStats);
    }

    if (seeStatsFromGameover) {
        seeStatsFromGameover.addEventListener('click', () => {
            document.getElementById('endless-game-over-screen').style.display = 'none';
            showStatsModal();
        });
    }

    // Game over actions
    const tryAgainBtn = document.getElementById('try-again');
    const playEndlessFromDaily = document.getElementById('play-endless-from-daily');
    const playEndlessFromGameover = document.getElementById('play-endless-from-gameover');
    const shareEndlessResult = document.getElementById('share-endless-result');
    const shareDailyResult = document.getElementById('share-daily-result');

    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', startChallengeMode);
    }

    if (playEndlessFromDaily) {
        playEndlessFromDaily.addEventListener('click', () => {
            document.getElementById('daily-complete-screen').style.display = 'none';
            startChallengeMode();
        });
    }

    if (playEndlessFromGameover) {
        playEndlessFromGameover.addEventListener('click', () => {
            document.getElementById('game-over-screen').style.display = 'none';
            startChallengeMode();
        });
    }

    if (shareEndlessResult) {
        shareEndlessResult.addEventListener('click', shareEndlessResultHandler);
    }

    if (shareDailyResult) {
        shareDailyResult.addEventListener('click', shareDailyResultHandler);
    }

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Settings modal
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsClose = document.querySelector('.settings-close');

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'block';
        });
    }

    if (settingsClose) {
        settingsClose.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });
    }

    // Continent filter
    const continentFilterBtn = document.getElementById('continent-filter-btn');
    const continentFilterModal = document.getElementById('continent-filter-modal');
    const continentFilterClose = document.querySelector('.continent-filter-close');
    const applyContinentFilter = document.getElementById('apply-continent-filter');

    if (continentFilterBtn) {
        continentFilterBtn.addEventListener('click', () => {
            continentFilterModal.style.display = 'block';
            updateContinentFilterModal();
        });
    }

    if (continentFilterClose) {
        continentFilterClose.addEventListener('click', () => {
            continentFilterModal.style.display = 'none';
        });
    }

    if (applyContinentFilter) {
        applyContinentFilter.addEventListener('click', () => {
            applyContinentFilterSelection();
            continentFilterModal.style.display = 'none';
        });
    }

    // Continent option clicks
    const continentOptions = document.querySelectorAll('.continent-option');
    continentOptions.forEach(option => {
        option.addEventListener('click', () => {
            const continent = option.getAttribute('data-continent');
            selectContinentOption(continent);
        });
    });

    // Sound toggle
    const soundToggle = document.getElementById('sound-toggle-setting');
    if (soundToggle) {
        soundToggle.addEventListener('click', toggleSound);
    }

    // Difficulty select
    const difficultySelect = document.getElementById('difficulty-select');
    if (difficultySelect) {
        difficultySelect.value = difficulty;
        difficultySelect.addEventListener('change', (e) => {
            difficulty = e.target.value;
            localStorage.setItem('difficulty', difficulty);
        });
    }

    // Daily name modal
    const submitDailyName = document.getElementById('submit-daily-name');
    const skipDailyName = document.getElementById('skip-daily-name');
    const dailyNameClose = document.querySelector('.daily-name-close');

    if (submitDailyName) {
        submitDailyName.addEventListener('click', submitDailyNameHandler);
    }

    if (skipDailyName) {
        skipDailyName.addEventListener('click', () => {
            document.getElementById('daily-name-modal').style.display = 'none';
        });
    }

    if (dailyNameClose) {
        dailyNameClose.addEventListener('click', () => {
            document.getElementById('daily-name-modal').style.display = 'none';
        });
    }

    // Daily leaderboard modal
    const viewLeaderboardBtn = document.getElementById('view-leaderboard-btn');
    const dailyLeaderboardClose = document.querySelector('.daily-leaderboard-close');
    const closeLeaderboard = document.getElementById('close-leaderboard');

    if (viewLeaderboardBtn) {
        viewLeaderboardBtn.addEventListener('click', showDailyLeaderboard);
    }

    if (dailyLeaderboardClose) {
        dailyLeaderboardClose.addEventListener('click', () => {
            document.getElementById('daily-leaderboard-modal').style.display = 'none';
        });
    }

    if (closeLeaderboard) {
        closeLeaderboard.addEventListener('click', () => {
            document.getElementById('daily-leaderboard-modal').style.display = 'none';
        });
    }

    // Daily complete screen close button
    const dailyCompleteClose = document.querySelector('.daily-complete-close');
    if (dailyCompleteClose) {
        dailyCompleteClose.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById('daily-complete-screen').style.display = 'none';
            showModeSelection();
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

function initializeSettings() {
    updateContinentFilterDisplay();
    updateSoundToggleDisplay();
}

function updateContinentFilterDisplay() {
    const selectionText = document.getElementById('continent-selection-text');
    if (selectionText && continentFilter) {
        selectionText.textContent = continentFilter.getSelectionText();
    }
}

function updateSoundToggleDisplay() {
    const soundIcon = document.getElementById('sound-icon-setting');
    const soundStatus = document.getElementById('sound-status');
    
    if (soundIcon && soundStatus && soundEffects) {
        if (soundEffects.enabled) {
            soundIcon.textContent = '🔊';
            soundStatus.textContent = 'On';
        } else {
            soundIcon.textContent = '🔇';
            soundStatus.textContent = 'Off';
        }
    }
}

function updateContinentFilterModal() {
    const options = document.querySelectorAll('.continent-option');
    const summary = document.getElementById('selection-summary');
    
    // Clear all active states
    options.forEach(option => option.classList.remove('active'));
    
    // Set active states based on current selection
    if (continentFilter.selectedContinents.includes('all')) {
        document.querySelector('[data-continent="all"]').classList.add('active');
    } else {
        continentFilter.selectedContinents.forEach(continent => {
            const option = document.querySelector(`[data-continent="${continent}"]`);
            if (option) option.classList.add('active');
        });
    }
    
    // Update summary
    if (summary) {
        summary.textContent = continentFilter.getSelectionText();
    }
}

function selectContinentOption(continent) {
    continentFilter.toggleContinent(continent);
    updateContinentFilterModal();
}

function applyContinentFilterSelection() {
    updateContinentFilterDisplay();
    // If currently in challenge mode, restart with new filter
    if (gameMode === 'challenge' && document.getElementById('game-container').style.display !== 'none') {
        startChallengeMode();
    }
}

function toggleSound() {
    const enabled = soundEffects.toggle();
    updateSoundToggleDisplay();
}

function showModeSelection() {
    // Stop any running timers
    stopQuestionTimer();

    // Hide all game screens
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('daily-complete-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('endless-game-over-screen').style.display = 'none';
    document.getElementById('multiplayer-lobby').style.display = 'none';
    document.getElementById('multiplayer-results').style.display = 'none';
    document.getElementById('home-logo-btn').style.display = 'none';

    // Show mode selection
    document.getElementById('mode-selection').style.display = 'flex';

    // Reset multiplayer mode flag
    isMultiplayerMode = false;

    updateMainMenuStats();
}

function goBackToMenu() {
    // For practice mode, confirm before leaving (they'll lose progress)
    if (gameMode === 'challenge' && score > 0) {
        if (!confirm('Leave game? Your current progress will be lost.')) {
            return;
        }
    }

    // For daily challenge, don't allow going back during play (it auto-saves)
    if (gameMode === 'daily') {
        if (!confirm('Leave daily challenge? You can return and continue later.')) {
            return;
        }
    }

    showModeSelection();
}

function updateMainMenuStats() {
    // Update Day number (days since launch: Jan 1, 2025)
    const dayNumberEl = document.getElementById('daily-day-number');
    if (dayNumberEl) {
        const launchDate = new Date('2025-01-01');
        const today = new Date();
        const dayNumber = Math.floor((today - launchDate) / (1000 * 60 * 60 * 24)) + 1;
        dayNumberEl.textContent = `Day #${dayNumber}`;
    }

    // Update streak badge (prominent display)
    const streakBadge = document.getElementById('daily-streak-badge');
    const streakCount = document.getElementById('streak-count');
    if (dailyChallenge && streakBadge && streakCount) {
        const streak = dailyChallenge.dailyStats.streak || 0;
        if (streak > 0) {
            streakCount.textContent = streak;
            streakBadge.style.display = 'inline';
        } else {
            streakBadge.style.display = 'none';
        }
    }

    // Update passport preview
    const passportPreview = document.getElementById('passport-preview');
    const passportPreviewCount = document.getElementById('passport-preview-count');
    if (achievementSystem && passportPreview && passportPreviewCount) {
        const countriesDiscovered = achievementSystem.getCorrectlyAnsweredCountries().size;
        passportPreviewCount.textContent = countriesDiscovered;
        passportPreview.style.display = 'block';
    }

    // Update social proof (track and display player count)
    updateSocialProof();
}

function updateSocialProof() {
    const socialProof = document.getElementById('social-proof');
    const socialProofText = document.getElementById('social-proof-text');

    if (!socialProof || !socialProofText) return;

    // Track this session if not already tracked today
    const today = new Date().toISOString().split('T')[0];
    const lastTracked = localStorage.getItem('lastSessionTracked');

    if (lastTracked !== today) {
        localStorage.setItem('lastSessionTracked', today);
        // Increment local play count
        const totalPlays = parseInt(localStorage.getItem('totalLocalPlays') || '0') + 1;
        localStorage.setItem('totalLocalPlays', totalPlays.toString());

        // Track to Supabase if available
        trackPlaySession();
    }

    // For now, show encouraging text based on their progress
    const gamesPlayed = parseInt(localStorage.getItem('challengeTimesPlayed') || '0');
    const dailyPlayed = dailyChallenge?.dailyStats?.totalPlayed || 0;
    const totalPlays = gamesPlayed + dailyPlayed;

    if (totalPlays > 0) {
        socialProofText.textContent = `🌍 You've played ${totalPlays} ${totalPlays === 1 ? 'game' : 'games'}`;
        socialProof.style.display = 'block';
    } else {
        socialProof.style.display = 'none';
    }
}

async function trackPlaySession() {
    // Track play session to Supabase for social proof
    if (!window.supabase) return;

    try {
        // Try to increment global play counter
        await window.supabase
            .from('play_stats')
            .upsert({
                id: 'global',
                total_plays: 1
            }, {
                onConflict: 'id',
                ignoreDuplicates: false
            });
    } catch (error) {
        // Silently fail - social proof is not critical
        console.log('Social proof tracking not available');
    }
}

function startDailyChallenge() {
    if (dailyChallenge.hasPlayedToday()) {
        showDailyComplete();
        return;
    }
    
    gameMode = 'daily';
    isMultiplayerMode = false;
    
    // Hide mode selection and show game
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('top-bar').style.display = 'flex';
    document.getElementById('home-logo-btn').style.display = 'flex';

    // Reset game state
    score = 0;
    streak = 0;
    lives = 2; // Daily challenge has 2 attempts
    usedCountries = [];
    
    // Update UI
    document.getElementById('heading').textContent = 'Daily Flag Challenge';
    document.getElementById('subHeading').textContent = 'One flag per day - can you guess it?';
    document.getElementById('lives-display').style.display = 'flex';
    updateUI();
    
    // Get today's country (timing starts when flag loads in displayQuestion)
    currentCountry = dailyChallenge.getTodaysCountry();

    displayQuestion();
}

function startChallengeMode() {
    // Check practice limit for free users
    if (!checkPracticeLimit()) {
        return; // Premium modal will show
    }

    // Record this practice session
    recordPracticeGame();

    gameMode = 'challenge';
    isMultiplayerMode = false;

    // Hide all screens and show game
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('endless-game-over-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('top-bar').style.display = 'flex';
    document.getElementById('home-logo-btn').style.display = 'flex';

    // Reset game state
    score = 0;
    streak = 0;
    lives = 3;
    usedCountries = [];
    
    // Update UI
    document.getElementById('heading').textContent = 'Practice Mode';
    document.getElementById('subHeading').textContent = 'How many flags can you identify?';
    document.getElementById('lives-display').style.display = 'flex';
    updateUI();
    
    // Start with first question using filtered countries
    nextQuestion();
}

function getFilteredCountries() {
    if (!continentFilter) {
        return countries;
    }
    return continentFilter.filterCountries(countries);
}

function getRandomCountry() {
    const filteredCountries = getFilteredCountries();
    const countryCodes = Object.keys(filteredCountries);

    // Filter out used countries
    const availableCountries = countryCodes.filter(code => !usedCountries.includes(code));

    // If all countries have been used, celebrate and reset!
    if (availableCountries.length === 0) {
        // Only celebrate in Practice Mode
        if (gameMode === 'challenge') {
            const totalFlags = countryCodes.length;
            console.log(`🏆 Perfect Round! All ${totalFlags} flags completed!`);

            // Show celebration
            showToast(`🏆 Perfect Round! All ${totalFlags} flags completed!`);
            if (typeof AnimationEffects !== 'undefined') {
                AnimationEffects.showPerfectRoundCelebration();
            }

            // Mark Perfect Run achievement if they completed all 250 flags
            if (totalFlags >= 250) {
                localStorage.setItem('perfectRunCompleted', 'true');
                // Check for new achievements
                const newAchievements = achievementSystem.checkAchievements();
                newAchievements.forEach(achievement => {
                    AnimationEffects.showAchievementUnlock(achievement);
                });
            }
        }

        // Reset and continue
        usedCountries = [];
        return getRandomCountry();
    }

    const randomIndex = Math.floor(Math.random() * availableCountries.length);
    const selectedCode = availableCountries[randomIndex];

    return filteredCountries[selectedCode];
}

function displayQuestion() {
    if (gameMode === 'daily') {
        // Daily mode uses predetermined country
        if (!currentCountry) {
            console.error('No current country for daily challenge');
            return;
        }
    } else {
        // Challenge mode gets random country from filtered set
        currentCountry = getRandomCountry();
    }
    
    // Update flag image
    const flagImg = document.getElementById('flag');

    // For daily challenge, start timing when flag is actually visible
    if (gameMode === 'daily') {
        flagImg.onload = () => {
            dailyChallenge.startTiming();
            console.log('⏱️ Daily timer started after flag loaded');
        };
    }

    if (currentCountry.flag && currentCountry.flag.large) {
        flagImg.src = currentCountry.flag.large;
    } else {
        console.error('Flag image not found for:', currentCountry.name);
        flagImg.src = 'flags/' + currentCountry.alpha2Code.toLowerCase() + '.svg';
    }

    // Generate options
    generateOptions();
    
    // Reset UI state
    resetQuestionUI();
    
    console.log('Displaying question for:', currentCountry.name, 'Region:', currentCountry.region);
}

function generateOptions() {
    const filteredCountries = getFilteredCountries();
    const allCountries = Object.values(filteredCountries);

    // Determine number of options based on difficulty
    const numOptions = difficulty === 'medium' ? 6 : 4;
    const numIncorrect = numOptions - 1;

    // Get random incorrect answers from the same filtered set
    const incorrectAnswers = [];
    const otherCountries = allCountries.filter(country =>
        country.alpha2Code !== currentCountry.alpha2Code
    );

    while (incorrectAnswers.length < numIncorrect && otherCountries.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherCountries.length);
        incorrectAnswers.push(otherCountries[randomIndex].name);
        otherCountries.splice(randomIndex, 1);
    }

    // Combine correct and incorrect answers
    options = [...incorrectAnswers, currentCountry.name];

    // Shuffle the options
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }

    // Update option buttons visibility based on difficulty
    const optionsContainer = document.getElementById('options');
    const extraOptions = document.querySelectorAll('.extra-option');

    if (difficulty === 'medium') {
        optionsContainer.classList.add('medium-mode');
        extraOptions.forEach(btn => btn.style.display = 'block');
    } else {
        optionsContainer.classList.remove('medium-mode');
        extraOptions.forEach(btn => btn.style.display = 'none');
    }

    // Update option buttons
    const optionButtons = document.querySelectorAll('.option');
    optionButtons.forEach((button, index) => {
        if (index < options.length) {
            button.textContent = options[index];
            button.onclick = () => selectAnswer(options[index]);
            button.disabled = false;
            button.classList.remove('correct-answer', 'wrong-answer', 'disabled');
        }
    });

    // Start timer for hard mode
    if (difficulty === 'hard' && gameMode !== 'daily') {
        startQuestionTimer();
    }
}

function startQuestionTimer() {
    const timerDisplay = document.getElementById('timer-display');
    const timerCount = document.getElementById('timer-count');

    // Clear any existing timer
    if (questionTimerId) {
        clearInterval(questionTimerId);
    }

    questionTimeLeft = 10;
    timerDisplay.style.display = 'flex';
    timerDisplay.classList.remove('warning');
    timerCount.textContent = questionTimeLeft;

    questionTimerId = setInterval(() => {
        questionTimeLeft--;
        timerCount.textContent = questionTimeLeft;

        if (questionTimeLeft <= 3) {
            timerDisplay.classList.add('warning');
        }

        if (questionTimeLeft <= 0) {
            clearInterval(questionTimerId);
            questionTimerId = null;
            // Time's up - treat as wrong answer
            handleTimeUp();
        }
    }, 1000);
}

function stopQuestionTimer() {
    if (questionTimerId) {
        clearInterval(questionTimerId);
        questionTimerId = null;
    }
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
        timerDisplay.style.display = 'none';
    }
}

function handleTimeUp() {
    const optionButtons = document.querySelectorAll('.option');

    // Disable all buttons
    optionButtons.forEach(button => {
        button.disabled = true;
        button.classList.add('disabled');
        // Highlight correct answer
        if (button.textContent === currentCountry.name) {
            button.classList.add('correct-answer');
        }
    });

    soundEffects.playWrong();
    lives--;
    updateUI();

    document.getElementById('message').textContent = `⏱️ Time's up! The answer was ${currentCountry.name}`;

    if (lives <= 0) {
        endChallengeMode();
    } else {
        showFacts();
        const nextButton = document.getElementById('next');
        nextButton.hidden = false;
        nextButton.textContent = 'Next Flag';
    }
}

function selectAnswer(selectedAnswer) {
    // Stop timer if running
    stopQuestionTimer();

    const isCorrect = selectedAnswer === currentCountry.name;
    const optionButtons = document.querySelectorAll('.option');

    // Disable all buttons
    optionButtons.forEach(button => {
        button.disabled = true;
        button.classList.add('disabled');
    });
    
    // Visual feedback
    optionButtons.forEach(button => {
        if (button.textContent === selectedAnswer) {
            if (isCorrect) {
                button.classList.add('correct-answer');
                soundEffects.playCorrect();
            } else {
                button.classList.add('wrong-answer');
                soundEffects.playWrong();
            }
        } else if (button.textContent === currentCountry.name) {
            button.classList.add('correct-answer');
        }
    });
    
    // Handle answer
    if (isCorrect) {
        handleCorrectAnswer();
    } else {
        handleWrongAnswer();
    }
}

function handleCorrectAnswer() {
    // Lock in the time for daily challenge when correct answer is given
    if (gameMode === 'daily') {
        dailyChallenge.lockFinalTime();
    }

    score++;
    streak++;

    // Update best streak
    if (streak > bestStreak) {
        bestStreak = streak;
        localStorage.setItem('bestStreak', bestStreak.toString());
    }
    
    // Add to used countries for challenge mode
    if (gameMode === 'challenge') {
        usedCountries.push(currentCountry.alpha2Code);
    }
    
    // Unlock country and check achievements
    achievementSystem.unlockCountry(currentCountry.alpha2Code, currentCountry);
    const newAchievements = achievementSystem.checkAchievements();
    
    // Show achievement animations
    newAchievements.forEach(achievement => {
        if (typeof AnimationEffects !== 'undefined') {
            AnimationEffects.showAchievementUnlock(achievement);
        }
    });
    
    // Add XP and check for level up
    const xpGained = 10;
    totalXP += xpGained;
    localStorage.setItem('totalXP', totalXP.toString());
    
    const currentLevel = Math.floor(totalXP / 100) + 1;
    const previousLevel = Math.floor((totalXP - xpGained) / 100) + 1;
    
    if (currentLevel > previousLevel && typeof AnimationEffects !== 'undefined') {
        AnimationEffects.showLevelUpAnimation(currentLevel);
    }
    
    // Show confetti for correct answers
    if (typeof AnimationEffects !== 'undefined') {
        AnimationEffects.showConfetti();
    }
    
    // Show streak confetti for milestones
    if (streak > 0 && streak % 5 === 0 && typeof AnimationEffects !== 'undefined') {
        AnimationEffects.showStreakConfetti();
        soundEffects.playStreak();
    }
    
    updateUI();
    showFacts();
    
    // Show next button
    const nextButton = document.getElementById('next');
    nextButton.hidden = false;
    nextButton.textContent = gameMode === 'daily' ? 'Complete Challenge' : 'Next Flag';
    
    // Update message
    const messages = [
        "🎉 Correct!",
        "✅ Well done!",
        "🌟 Excellent!",
        "🎯 Perfect!",
        "👏 Great job!"
    ];
    document.getElementById('message').textContent = messages[Math.floor(Math.random() * messages.length)];
}

function handleWrongAnswer() {
    lives--;
    
    if (gameMode === 'daily') {
        // Daily challenge: reset timing for next attempt
        dailyChallenge.resetQuestionTiming();
    }
    
    updateUI();
    
    if (lives <= 0) {
        // Game over - but show the correct answer first
        if (gameMode === 'daily') {
            dailyChallenge.lockFinalTime();
            endDailyChallenge(false);
        } else {
            // Show the correct answer before game over
            showFacts();
            const nextButton = document.getElementById('next');
            nextButton.hidden = false;
            nextButton.textContent = 'See Results';
            nextButton.dataset.gameOver = 'true'; // Mark for game over handling

            document.getElementById('message').textContent = `❌ Game Over! The answer was ${currentCountry.name}.`;
        }
    } else {
        // Show facts and next button for another attempt
        showFacts();
        const nextButton = document.getElementById('next');
        nextButton.hidden = false;
        nextButton.textContent = gameMode === 'daily' ? 'Try Again' : 'Next Flag';
        nextButton.dataset.gameOver = 'false';

        // Update message
        document.getElementById('message').textContent = `❌ Incorrect. ${lives} ${lives === 1 ? 'life' : 'lives'} remaining.`;
    }
}

function showFacts() {
    const factsDiv = document.getElementById('facts');
    
    // Show country facts
    factsDiv.innerHTML = `
        <p class="fact-text"><strong>Capital:</strong> ${currentCountry.capital}</p>
        <p class="fact-text"><strong>Population:</strong> ${currentCountry.population?.toLocaleString() || 'Unknown'}</p>
        <p class="fact-text"><strong>Region:</strong> ${currentCountry.subregion || currentCountry.region}</p>
    `;
    factsDiv.hidden = false;
}

function nextQuestion() {
    const nextButton = document.getElementById('next');

    // Check if this is a game over situation (player saw the answer, now go to results)
    if (nextButton.dataset.gameOver === 'true') {
        nextButton.dataset.gameOver = 'false'; // Reset the flag
        if (gameMode === 'daily') {
            endDailyChallenge(false);
        } else {
            endChallengeMode();
        }
        return;
    }

    if (gameMode === 'daily') {
        if (lives <= 0) {
            endDailyChallenge(false);
        } else if (score > 0) {
            endDailyChallenge(true);
        } else {
            // Reset for another attempt
            resetQuestionUI();
            displayQuestion();
        }
    } else {
        // Challenge mode - continue to next question
        resetQuestionUI();
        displayQuestion();
    }
}

function resetQuestionUI() {
    document.getElementById('message').textContent = '';
    document.getElementById('facts').hidden = true;
    document.getElementById('next').hidden = true;

    // Stop any running timer
    stopQuestionTimer();

    const optionButtons = document.querySelectorAll('.option');
    optionButtons.forEach(button => {
        button.disabled = false;
        button.classList.remove('correct-answer', 'wrong-answer', 'disabled');
    });
}

function updateUI() {
    document.getElementById('streak-display-top').textContent = `${streak} Streak`;
    document.getElementById('lives-count').textContent = lives;
    document.getElementById('score-display').textContent = `Score: ${score}`;
}

async function endDailyChallenge(success) {
    const attempts = 3 - lives; // Calculate attempts used
    const timeSpent = dailyChallenge.getElapsedTime();

    // Submit result
    await dailyChallenge.submitResult(success, attempts, Math.round(timeSpent / 1000));

    if (success) {
        // Show name input modal for successful completion
        document.getElementById('daily-name-modal').style.display = 'block';
    } else {
        // Check if user has a streak to save
        if (dailyChallenge.hasPendingStreakLoss()) {
            const currentStreak = dailyChallenge.getPreLossStreak();
            window.premiumManager.showStreakSaveModal(
                currentStreak,
                () => {
                    // User saved their streak
                    dailyChallenge.saveStreak();
                    showDailyGameOver();
                },
                () => {
                    // User chose not to save
                    dailyChallenge.confirmStreakLoss();
                    showDailyGameOver();
                }
            );
        } else {
            // No streak to save, proceed directly
            showDailyGameOver();
        }
    }
}

function endChallengeMode() {
    // Update stats
    const timesPlayed = parseInt(localStorage.getItem('challengeTimesPlayed') || '0') + 1;
    const highestScore = parseInt(localStorage.getItem('challengeHighestScore') || '0');
    const totalScore = parseInt(localStorage.getItem('challengeTotalScore') || '0') + score;
    
    localStorage.setItem('challengeTimesPlayed', timesPlayed.toString());
    localStorage.setItem('challengeTotalScore', totalScore.toString());
    
    if (score > highestScore) {
        localStorage.setItem('challengeHighestScore', score.toString());
    }
    
    // Reset streak if game ended
    streak = 0;
    
    // Show game over screen
    showEndlessGameOver();
}

function showDailyComplete() {
    const result = dailyChallenge.dailyStats.results[dailyChallenge.today];
    const country = dailyChallenge.getTodaysCountry();

    // Safety check: if no valid result, clear stale data and let user play
    if (!result || typeof result !== 'object' || !('correct' in result)) {
        console.warn('No valid daily result found, clearing stale data');
        localStorage.removeItem('dailyPlayedToday');
        startDailyChallenge();
        return;
    }

    // Hide other screens
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('mode-selection').style.display = 'none';

    // Show daily complete screen
    document.getElementById('daily-complete-screen').style.display = 'block';

    // Update content
    document.getElementById('daily-result-heading').textContent = result.correct ? 'Well Done!' : 'Better Luck Tomorrow!';
    document.getElementById('daily-result-flag').src = country.flag.large;
    document.getElementById('daily-result-country').textContent = country.name;
    
    // Show attempts
    const attemptsText = result.attempts === 1 ? '1st try!' : `${result.attempts} tries`;
    document.getElementById('daily-attempts-display').textContent = `Completed in ${attemptsText}`;
    
    // Show streak
    const currentStreak = dailyChallenge.dailyStats.streak || 0;
    document.getElementById('daily-streak-display').textContent = `🔥 Current streak: ${currentStreak} days`;
    
    // Show countdown to next challenge
    document.getElementById('countdown-timer').textContent = dailyChallenge.getTimeUntilNext();

    // Clear any existing countdown interval to prevent memory leaks
    if (countdownIntervalId) {
        clearInterval(countdownIntervalId);
    }

    // Update countdown every minute
    countdownIntervalId = setInterval(() => {
        document.getElementById('countdown-timer').textContent = dailyChallenge.getTimeUntilNext();
    }, 60000);
}

function showDailyGameOver() {
    // Hide other screens
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('top-bar').style.display = 'none';
    
    // Show game over screen
    document.getElementById('game-over-screen').style.display = 'block';
    
    const logoText = document.getElementById('flagem-logo-text');
    logoText.textContent = `You'll get it tomorrow! The flag was ${currentCountry.name}.`;
}

function showEndlessGameOver() {
    // Hide other screens
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('top-bar').style.display = 'none';
    
    // Show endless game over screen
    document.getElementById('endless-game-over-screen').style.display = 'block';
    
    // Update content
    const highestScore = parseInt(localStorage.getItem('challengeHighestScore') || '0');
    document.getElementById('endless-score-display').textContent = `Final Score: ${score}`;
    document.getElementById('endless-highest-score-display').textContent = `Best Score: ${Math.max(score, highestScore)}`;
    document.getElementById('final-streak-display').textContent = `Best Streak: ${bestStreak}`;
}

async function submitDailyNameHandler() {
    const nameInput = document.getElementById('daily-player-name');
    const playerName = nameInput.value.trim();
    
    if (!playerName) {
        alert('Please enter your name');
        return;
    }
    
    if (playerName.length > 12) {
        alert('Name must be 12 characters or less');
        return;
    }
    
    // Submit to leaderboard - use saved time from result, not current elapsed time
    const todayResult = dailyChallenge.dailyStats.results[dailyChallenge.today];
    const attempts = todayResult?.attempts || (3 - lives);
    const timeSpent = todayResult?.timeSpent || Math.round(dailyChallenge.getElapsedTime() / 1000);

    const result = await dailyChallenge.submitToLeaderboard(playerName, timeSpent, attempts);
    
    if (result.success) {
        document.getElementById('daily-name-modal').style.display = 'none';
        showDailyComplete();
    } else {
        alert('Failed to submit to leaderboard: ' + (result.error || 'Unknown error'));
    }
}

async function showDailyLeaderboard() {
    const modal = document.getElementById('daily-leaderboard-modal');
    const list = document.getElementById('daily-leaderboard-list');
    
    modal.style.display = 'block';
    list.innerHTML = '<div class="leaderboard-empty">Loading leaderboard...</div>';
    
    try {
        const leaderboardData = await dailyChallenge.getLeaderboard();
        
        if (leaderboardData.entries.length === 0) {
            list.innerHTML = '<div class="leaderboard-empty">No players yet - be the first! 🚀</div>';
        } else {
            list.innerHTML = '';
            
            leaderboardData.entries.slice(0, 50).forEach((entry, index) => {
                const rank = index + 1;
                const isCurrentPlayer = entry.name === document.getElementById('daily-player-name')?.value;
                
                const entryDiv = document.createElement('div');
                entryDiv.className = `leaderboard-item ${isCurrentPlayer ? 'your-entry' : ''}`;
                
                const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                const timeDisplay = `${entry.time}s`;
                const attemptsDisplay = entry.attempts === 1 ? '(1st try!)' : `(${entry.attempts} tries)`;
                const flagEmoji = entry.country !== 'Unknown' ? countryCodeToFlag(entry.country) : '';

                entryDiv.innerHTML = `
                    <div class="rank">${rankEmoji}</div>
                    <div class="player-name">${entry.name} ${flagEmoji}</div>
                    <div class="player-time">${timeDisplay} ${attemptsDisplay}</div>
                `;
                
                list.appendChild(entryDiv);
            });
        }
        
        // Update title with scope
        const title = document.getElementById('leaderboard-title');
        const globalStatus = leaderboardData.isGlobal ? 
            '<span class="global-status global">🌍 Global</span>' : 
            '<span class="global-status local">📱 Local</span>';
        title.innerHTML = `🏆 Daily Leaderboard ${globalStatus}`;
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        list.innerHTML = '<div class="leaderboard-empty">❌ Failed to load leaderboard</div>';
    }
}

function shareEndlessResultHandler() {
    const shareText = `🌍 I scored ${score} points in Flagtriv Practice Mode!\n🔥 Best streak: ${bestStreak}\n\nCan you beat my score? Play at flagtriv.com`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Flagtriv Score',
            text: shareText
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('📋 Score copied to clipboard!');
        });
    }
}

function shareDailyResultHandler() {
    const result = dailyChallenge.dailyStats.results[dailyChallenge.today];
    const shareText = dailyChallenge.getShareText(result);
    
    if (navigator.share) {
        navigator.share({
            title: 'Flagtriv Daily Challenge',
            text: shareText
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('📋 Result copied to clipboard!');
        });
    }
}

function showToast(message) {
    const toast = document.getElementById('resultsToast');
    toast.textContent = message;
    toast.className = 'show';
    
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000);
}

// Stats functions
function initializeStats() {
    updateStatsDisplay();
}

function showStatsModal() {
    // Hide other screens that might be visible
    document.getElementById('endless-game-over-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('home-logo-btn').style.display = 'none';

    // Show the stats modal
    document.getElementById('stats-modal').style.display = 'block';
    updateStatsDisplay();
}

function updateStatsDisplay() {
    // Challenge stats
    document.getElementById('stats-best-streak').textContent = bestStreak;
    document.getElementById('challenge-times-played-value').textContent = localStorage.getItem('challengeTimesPlayed') || '0';
    document.getElementById('challenge-highest-score-value').textContent = localStorage.getItem('challengeHighestScore') || '0';
    document.getElementById('challenge-total-score-value').textContent = localStorage.getItem('challengeTotalScore') || '0';
    
    // Daily stats
    if (dailyChallenge) {
        document.getElementById('daily-current-streak').textContent = dailyChallenge.dailyStats.streak || '0';
        document.getElementById('daily-games-played').textContent = dailyChallenge.dailyStats.totalPlayed || '0';
        
        const successRate = dailyChallenge.dailyStats.totalPlayed > 0 ? 
            Math.round((dailyChallenge.dailyStats.totalCorrect / dailyChallenge.dailyStats.totalPlayed) * 100) : 0;
        document.getElementById('daily-success-rate').textContent = successRate + '%';
    }
    
    // Achievements
    updateAchievementsDisplay();
    
    // Passport
    updatePassportDisplay();
}

function updateAchievementsDisplay() {
    const progress = achievementSystem.getProgress();
    document.getElementById('achievement-count').textContent = `${progress.unlocked}/${progress.total} Achievements`;
    document.getElementById('achievement-progress-fill').style.width = progress.percentage + '%';
    
    const achievementsList = document.getElementById('achievements-list');
    achievementsList.innerHTML = '';
    
    achievementSystem.achievementsList.forEach(achievement => {
        const isUnlocked = achievementSystem.achievements[achievement.id];
        
        const achievementDiv = document.createElement('div');
        achievementDiv.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
        
        achievementDiv.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
            ${isUnlocked ? '<div class="achievement-check">✓</div>' : ''}
        `;
        
        achievementsList.appendChild(achievementDiv);
    });
}

function updatePassportDisplay() {
    const correctlyAnsweredCountries = achievementSystem.getCorrectlyAnsweredCountries();
    document.getElementById('countries-unlocked').textContent = `${correctlyAnsweredCountries.size} Flags Discovered`;
    
    // Update continent progress
    updateContinentProgress();
    
    // Update passport grid
    updatePassportGrid();
}

function updateContinentProgress() {
    const continentProgressDiv = document.getElementById('continent-progress');
    const countryDetails = JSON.parse(localStorage.getItem('countryDetails') || '{}');
    
    const continents = {
        'Africa': { emoji: '🌍', total: 0, unlocked: 0 },
        'Asia': { emoji: '🌏', total: 0, unlocked: 0 },
        'Europe': { emoji: '🇪🇺', total: 0, unlocked: 0 },
        'Americas': { emoji: '🌎', total: 0, unlocked: 0 },
        'Oceania': { emoji: '🏝️', total: 0, unlocked: 0 }
    };
    
    // Count total countries per continent
    Object.values(countries).forEach(country => {
        if (continents[country.region]) {
            continents[country.region].total++;
        }
    });
    
    // Count unlocked countries per continent
    Object.values(countryDetails).forEach(country => {
        if (continents[country.region]) {
            continents[country.region].unlocked++;
        }
    });
    
    continentProgressDiv.innerHTML = '';
    Object.entries(continents).forEach(([name, data]) => {
        const percentage = data.total > 0 ? (data.unlocked / data.total) * 100 : 0;
        
        const progressDiv = document.createElement('div');
        progressDiv.className = 'continent-progress-item';
        progressDiv.innerHTML = `
            <div class="continent-progress-name">
                <span>${data.emoji}</span>
                <span>${name}</span>
            </div>
            <div class="continent-progress-bar">
                <div class="continent-progress-fill" style="width: ${percentage}%"></div>
            </div>
            <span>${data.unlocked}/${data.total}</span>
        `;
        
        continentProgressDiv.appendChild(progressDiv);
    });
}

function updatePassportGrid() {
    const passportGrid = document.getElementById('passport-grid');
    const countryDetails = JSON.parse(localStorage.getItem('countryDetails') || '{}');
    
    passportGrid.innerHTML = '';
    
    if (Object.keys(countryDetails).length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'passport-empty';
        emptyDiv.innerHTML = `
            <div class="passport-empty-content">
                <span class="passport-empty-icon">🗺️</span>
                <p>No flags discovered yet!</p>
                <p class="passport-empty-hint">Play the game to unlock flags and build your passport</p>
            </div>
        `;
        passportGrid.appendChild(emptyDiv);
        return;
    }
    
    // Sort countries by name
    const sortedCountries = Object.entries(countryDetails).sort((a, b) => a[1].name.localeCompare(b[1].name));
    
    sortedCountries.forEach(([code, country]) => {
        const countryDiv = document.createElement('div');
        countryDiv.className = 'passport-country';
        
        const flagSrc = countries[code]?.flag?.large || `flags/${code.toLowerCase()}.svg`;
        
        countryDiv.innerHTML = `
            <img src="${flagSrc}" alt="${country.name}" loading="lazy">
            <span>${country.name}</span>
        `;
        
        passportGrid.appendChild(countryDiv);
    });
}

function switchTab(tabName) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to selected tab and content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-stats`).classList.add('active');

    // Reset scroll position to top when switching tabs
    const modalContent = document.querySelector('#stats-modal .modal-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }

    // Update displays for the active tab
    if (tabName === 'achievements') {
        updateAchievementsDisplay();
    } else if (tabName === 'passport') {
        updatePassportDisplay();
    }
}

async function shareStats() {
    const activeTab = document.querySelector('.tab-button.active')?.dataset?.tab;
    console.log('Sharing tab:', activeTab);

    try {
        // Generate the share card image
        const canvas = await generateShareCard(activeTab);
        console.log('Canvas generated for tab:', activeTab);

        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
            if (!blob) {
                console.error('Failed to create blob from canvas');
                showToast('Failed to create image');
                return;
            }

            const file = new File([blob], 'flagtriv-stats.png', { type: 'image/png' });

            const appStoreLink = 'https://apps.apple.com/app/flagtriv';
            const shareText = activeTab === 'passport'
                ? `🌍 I've discovered ${achievementSystem.getCorrectlyAnsweredCountries().size} flags on Flagtriv! How many can you get?\n\n${appStoreLink}`
                : `🏆 I've unlocked ${achievementSystem.getProgress().unlocked} achievements on Flagtriv!\n\n${appStoreLink}`;

            // Try native share with image
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                try {
                    await navigator.share({
                        title: 'My Flagtriv Stats',
                        text: shareText,
                        files: [file]
                    });
                    return;
                } catch (e) {
                    console.log('Share cancelled or failed:', e);
                }
            }

            // Fallback: download the image
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'flagtriv-stats.png';
            a.click();
            URL.revokeObjectURL(url);
            showToast('📸 Image saved! Share it on Instagram');
        }, 'image/png');
    } catch (error) {
        console.error('Error generating share card:', error);
        showToast('Failed to generate share image');
    }
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function generateShareCard(tabType) {
    const canvas = document.createElement('canvas');
    // Instagram story size (1080x1920) or square (1080x1080)
    canvas.width = 1080;
    canvas.height = 1350; // 4:5 ratio - good for Instagram feed
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle pattern overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 100 + 50;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    // White card
    const cardX = 60;
    const cardY = 200;
    const cardWidth = canvas.width - 120;
    const cardHeight = canvas.height - 400;

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 40);
    ctx.fill();

    // Draw Flagtriv logo (yellow circle with white F, black outline)
    const logoSize = 120;
    const logoX = canvas.width / 2;
    const logoY = 110;

    // Yellow circle with black border
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFC00';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.stroke();

    // White F with black outline (stroke first, then fill)
    ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#000';
    ctx.strokeText('F', logoX, logoY);
    ctx.fillStyle = 'white';
    ctx.fillText('F', logoX, logoY);
    ctx.textBaseline = 'alphabetic';

    if (tabType === 'passport') {
        await drawPassportCard(ctx, canvas, cardX, cardY, cardWidth, cardHeight);
    } else if (tabType === 'achievements') {
        await drawAchievementsCard(ctx, canvas, cardX, cardY, cardWidth, cardHeight);
    } else {
        await drawStatsCard(ctx, canvas, cardX, cardY, cardWidth, cardHeight);
    }

    // Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '36px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📲 Download Flagtriv on the App Store', canvas.width / 2, canvas.height - 80);

    return canvas;
}

async function drawPassportCard(ctx, canvas, cardX, cardY, cardWidth, cardHeight) {
    const discoveredSet = achievementSystem.getCorrectlyAnsweredCountries();
    const countriesCount = discoveredSet.size;
    const isComplete = countriesCount >= 250;

    ctx.textAlign = 'center';

    // Rank title - the status/brag
    let rank;
    if (countriesCount >= 250) rank = 'WORLD CHAMPION';
    else if (countriesCount >= 200) rank = 'FLAG MASTER';
    else if (countriesCount >= 150) rank = 'GLOBE TROTTER';
    else if (countriesCount >= 100) rank = 'EXPLORER';
    else if (countriesCount >= 50) rank = 'ADVENTURER';
    else if (countriesCount >= 25) rank = 'TRAVELER';
    else if (countriesCount >= 10) rank = 'TOURIST';
    else rank = 'ROOKIE';

    ctx.font = '600 24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#667eea';
    ctx.letterSpacing = '3px';
    ctx.fillText(rank, canvas.width / 2, cardY + 50);

    // Big bold number
    if (isComplete) {
        const goldGrad = ctx.createLinearGradient(canvas.width/2 - 100, 0, canvas.width/2 + 100, 0);
        goldGrad.addColorStop(0, '#FFD700');
        goldGrad.addColorStop(0.5, '#FFF8DC');
        goldGrad.addColorStop(1, '#FFD700');
        ctx.fillStyle = goldGrad;
    } else {
        ctx.fillStyle = '#1a1a2e';
    }
    ctx.font = 'bold 120px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(countriesCount.toString(), canvas.width / 2, cardY + 155);

    // "flags" label
    ctx.font = '32px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('flags', canvas.width / 2, cardY + 195);

    // Challenge hook
    ctx.font = 'italic 28px Georgia, serif';
    ctx.fillStyle = '#888';
    ctx.fillText(isComplete ? '👑 All flags discovered!' : 'Think you can beat me?', canvas.width / 2, cardY + 240);

    // Flag mosaic - the visual proof
    const countryDetails = JSON.parse(localStorage.getItem('countryDetails') || '{}');
    const allCodes = Object.keys(countryDetails);

    // Available space for flags - start right after header
    const flagAreaTop = cardY + 265;
    const flagAreaBottom = cardY + cardHeight - 25;
    const flagAreaHeight = flagAreaBottom - flagAreaTop;
    const maxGridWidth = cardWidth - 60;

    // Calculate grid that fills the space well
    // Work backwards from available space to determine flag size
    let flagsPerRow, maxRows;

    if (countriesCount === 1) {
        flagsPerRow = 1; maxRows = 1;
    } else if (countriesCount <= 4) {
        flagsPerRow = 2; maxRows = 2;
    } else if (countriesCount <= 9) {
        flagsPerRow = 3; maxRows = 3;
    } else if (countriesCount <= 20) {
        flagsPerRow = 5; maxRows = 4;
    } else if (countriesCount <= 36) {
        flagsPerRow = 6; maxRows = 6;
    } else if (countriesCount <= 63) {
        flagsPerRow = 9; maxRows = 7;
    } else if (countriesCount <= 120) {
        flagsPerRow = 10; maxRows = 12;
    } else {
        flagsPerRow = 12; maxRows = 14;
    }

    const flagsToShow = Math.min(countriesCount, flagsPerRow * maxRows);
    const actualRows = Math.ceil(flagsToShow / flagsPerRow);

    // Calculate flag size to fill available space
    const gapRatio = 0.12; // gap as fraction of flag size
    const availableWidth = maxGridWidth;
    const availableHeight = flagAreaHeight - (countriesCount > flagsToShow ? 50 : 0); // room for "+X more"

    // Solve for flag size: rows * (h + gap) = availableHeight, cols * (w + gap) = availableWidth
    const flagWidth = Math.floor(availableWidth / (flagsPerRow * (1 + gapRatio)));
    const flagHeightFromWidth = Math.round(flagWidth * 0.67);
    const flagHeightFromRows = Math.floor(availableHeight / (actualRows * (1 + gapRatio * 0.67)));

    // Use smaller of the two to fit both constraints
    const finalFlagHeight = Math.min(flagHeightFromWidth, flagHeightFromRows, 160);
    const finalFlagSize = Math.round(finalFlagHeight / 0.67);
    const finalFlagGap = Math.max(8, Math.round(finalFlagSize * gapRatio));

    const gridWidth = flagsPerRow * finalFlagSize + (flagsPerRow - 1) * finalFlagGap;
    const gridHeight = actualRows * finalFlagHeight + (actualRows - 1) * finalFlagGap;

    // Position grid - horizontally centered, vertically centered in available space
    const gridX = cardX + (cardWidth - gridWidth) / 2;
    const verticalSpace = flagAreaHeight - gridHeight;
    const gridY = flagAreaTop + Math.max(10, verticalSpace / 2); // true center

    // Sort flags for display
    const sortedCodes = [...allCodes].sort((a, b) => {
        const hashA = a.charCodeAt(0) * 31 + (a.charCodeAt(1) || 0);
        const hashB = b.charCodeAt(0) * 31 + (b.charCodeAt(1) || 0);
        return hashA - hashB;
    }).slice(0, flagsToShow);

    for (let i = 0; i < sortedCodes.length; i++) {
        const code = sortedCodes[i];
        const row = Math.floor(i / flagsPerRow);
        const col = i % flagsPerRow;

        // Center incomplete rows
        const flagsInThisRow = Math.min(flagsPerRow, sortedCodes.length - row * flagsPerRow);
        const rowWidth = flagsInThisRow * finalFlagSize + (flagsInThisRow - 1) * finalFlagGap;
        const rowX = cardX + (cardWidth - rowWidth) / 2;

        const x = rowX + col * (finalFlagSize + finalFlagGap);
        const y = gridY + row * (finalFlagHeight + finalFlagGap);

        try {
            const flagSrc = countries[code]?.flag?.large || `flags/${code.toLowerCase()}.svg`;
            const flagImg = await loadImage(flagSrc);

            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 3;

            // Rounded corners
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(x, y, finalFlagSize, finalFlagHeight, 4);
            ctx.clip();
            ctx.drawImage(flagImg, x, y, finalFlagSize, finalFlagHeight);
            ctx.restore();

            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
        } catch (e) {
            ctx.fillStyle = '#f0f0f0';
            ctx.beginPath();
            ctx.roundRect(x, y, finalFlagSize, finalFlagHeight, 4);
            ctx.fill();
        }
    }

    // Show "+X more" if not all flags shown
    if (countriesCount > flagsToShow) {
        ctx.fillStyle = '#888';
        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`+${countriesCount - flagsToShow} more`, canvas.width / 2, gridY + gridHeight + 45);
    }
}

async function drawAchievementsCard(ctx, canvas, cardX, cardY, cardWidth, cardHeight) {
    const progress = achievementSystem.getProgress();

    // Title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('My Achievements', canvas.width / 2, cardY + 80);

    // Big number
    ctx.font = 'bold 180px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#667eea';
    ctx.fillText(progress.unlocked.toString(), canvas.width / 2, cardY + 280);

    ctx.font = '48px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(`of ${progress.total} unlocked`, canvas.width / 2, cardY + 350);

    // Progress bar
    const progressRatio = progress.unlocked / progress.total;
    const barWidth = cardWidth - 120;
    const barHeight = 30;
    const barX = cardX + 60;
    const barY = cardY + 400;

    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 15);
    ctx.fill();

    const progressGradient = ctx.createLinearGradient(barX, 0, barX + barWidth * progressRatio, 0);
    progressGradient.addColorStop(0, '#667eea');
    progressGradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = progressGradient;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * progressRatio, barHeight, 15);
    ctx.fill();

    // List unlocked achievements
    const unlockedAchievements = achievementSystem.achievements.filter(a => a.unlocked);
    let yPos = cardY + 500;

    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';

    for (const achievement of unlockedAchievements.slice(0, 6)) {
        ctx.fillStyle = '#333';
        ctx.fillText(`${achievement.icon} ${achievement.name}`, cardX + 80, yPos);

        ctx.fillStyle = '#22c55e';
        ctx.textAlign = 'right';
        ctx.fillText('✓', cardX + cardWidth - 80, yPos);
        ctx.textAlign = 'left';

        yPos += 60;
    }

    if (unlockedAchievements.length > 6) {
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText(`+${unlockedAchievements.length - 6} more`, canvas.width / 2, yPos + 20);
    }
}

async function drawStatsCard(ctx, canvas, cardX, cardY, cardWidth, cardHeight) {
    const level = Math.floor(totalXP / 100) + 1;
    const countriesCount = achievementSystem.getCorrectlyAnsweredCountries().size;
    const achievementsCount = achievementSystem.getProgress().unlocked;

    // Title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('My Stats', canvas.width / 2, cardY + 80);

    // Stats grid
    const stats = [
        { icon: '🏆', label: 'Level', value: level },
        { icon: '🔥', label: 'Best Streak', value: bestStreak },
        { icon: '🗺️', label: 'Flags', value: countriesCount },
        { icon: '🎯', label: 'Achievements', value: achievementsCount }
    ];

    const gridStartY = cardY + 180;
    const cellWidth = cardWidth / 2;
    const cellHeight = 200;

    stats.forEach((stat, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = cardX + col * cellWidth + cellWidth / 2;
        const y = gridStartY + row * cellHeight;

        // Icon
        ctx.font = '64px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(stat.icon, x, y);

        // Value
        ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#667eea';
        ctx.fillText(stat.value.toString(), x, y + 80);

        // Label
        ctx.font = '32px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText(stat.label, x, y + 120);
    });
}

function getContinentProgress() {
    const countryDetails = JSON.parse(localStorage.getItem('countryDetails') || '{}');

    const continents = {
        'Africa': { emoji: '🌍', total: 59, unlocked: 0 },
        'Asia': { emoji: '🌏', total: 50, unlocked: 0 },
        'Europe': { emoji: '🇪🇺', total: 53, unlocked: 0 },
        'Americas': { emoji: '🌎', total: 56, unlocked: 0 },
        'Oceania': { emoji: '🏝️', total: 27, unlocked: 0 }
    };

    // Count total countries per continent from countries array
    if (typeof countries !== 'undefined' && Array.isArray(countries)) {
        // Reset totals and count from actual data
        Object.keys(continents).forEach(k => continents[k].total = 0);
        countries.forEach(country => {
            if (continents[country.region]) {
                continents[country.region].total++;
            }
        });
    }

    // Count unlocked countries per continent
    Object.values(countryDetails).forEach(country => {
        if (continents[country.region]) {
            continents[country.region].unlocked++;
        }
    });

    return continents;
}

// ========== Premium Modal Functions ==========

let selectedPremiumPlan = 'yearly';

function selectPremiumOption(plan) {
    selectedPremiumPlan = plan;
    document.querySelectorAll('.premium-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
}

function subscribePremium() {
    if (selectedPremiumPlan === 'yearly') {
        window.premiumManager.purchaseYearly();
    } else {
        window.premiumManager.purchaseMonthly();
    }
    document.getElementById('premium-modal').style.display = 'none';
}

function showPremiumModal(reason) {
    window.premiumManager.showUpgradeModal(reason);
}

// Check practice limits before starting practice mode
function checkPracticeLimit() {
    if (!window.premiumManager.canPlayPractice()) {
        showPremiumModal('practice');
        return false;
    }
    return true;
}

// Record practice game played
function recordPracticeGame() {
    window.premiumManager.recordPracticeGame();
    updatePracticeCounter();
}

// Update practice counter display
function updatePracticeCounter() {
    const remaining = window.premiumManager.getPracticeRemaining();
    const counter = document.getElementById('practice-counter');
    if (counter) {
        if (remaining === Infinity) {
            counter.textContent = '♾️ Unlimited';
            counter.classList.add('premium');
        } else {
            counter.textContent = `${remaining}/5 today`;
            counter.classList.remove('premium');
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', loadCountries);