// ==============================
// Feature Flag: V2 Daily Challenge (hint-based)
// Set to false to revert to original multiple-choice daily
// ==============================
const DAILY_V2 = false;

// Format milliseconds into a readable time string with centisecond precision
// e.g. 1240 -> "1.24s", 65120 -> "1:05.12"
function formatTimeMs(ms) {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
        const wholeSeconds = Math.floor(seconds);
        const centiseconds = Math.floor((seconds - wholeSeconds) * 100);
        return `${minutes}:${wholeSeconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }
    return `${seconds.toFixed(2)}s`;
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
let dailyChallengeV2;
let v2TimerInterval = null;

// Load countries and initialize the game
async function loadCountries() {
    try {
        const response = await fetch('countries.json');
        countries = await response.json();
        
        // Initialize all systems after countries are loaded
        continentFilter = new ContinentFilter();
        flagFacts = new FlagFacts();
        dailyChallenge = new DailyChallenge(countries);
        achievementSystem = new AchievementSystem();
        soundEffects = new SoundEffects();
        multiplayerGame = new MultiplayerGame(countries, continentFilter, flagFacts, soundEffects);
        if (DAILY_V2) {
            dailyChallengeV2 = new DailyChallengeV2(countries, dailyChallenge);
        }

        console.log('Countries loaded:', Object.keys(countries).length);
        initializeGame();
    } catch (error) {
        console.error('Error loading countries:', error);
        document.body.innerHTML = '<h1>Error loading game data. Please refresh the page.</h1>';
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
        homeLogo.addEventListener('click', showModeSelection);
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
    document.getElementById('daily-v2-container').style.display = 'none';
    if (v2TimerInterval) { clearInterval(v2TimerInterval); v2TimerInterval = null; }

    // Show mode selection
    document.getElementById('mode-selection').style.display = 'flex';

    // Reset multiplayer mode flag
    isMultiplayerMode = false;

    updateMainMenuStats();
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
        if (DAILY_V2) {
            showDailyCompleteV2();
        } else {
            showDailyComplete();
        }
        return;
    }

    if (DAILY_V2) {
        startDailyChallengeV2();
        return;
    }

    gameMode = 'daily';
    isMultiplayerMode = false;

    // Hide mode selection and show game
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('top-bar').style.display = 'flex';

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
    gameMode = 'challenge';
    isMultiplayerMode = false;
    
    // Hide all screens and show game
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('endless-game-over-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('top-bar').style.display = 'flex';
    
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
        // Show game over for daily challenge
        showDailyGameOver();
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
    const timeMs = todayResult?.timeMs || dailyChallenge.getElapsedTime();

    const result = await dailyChallenge.submitToLeaderboard(playerName, timeMs, attempts);
    
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
                const timeDisplay = entry.timeMs ? formatTimeMs(entry.timeMs) : `${entry.time}s`;
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
    
    // Update displays for the active tab
    if (tabName === 'achievements') {
        updateAchievementsDisplay();
    } else if (tabName === 'passport') {
        updatePassportDisplay();
    }
}

function shareStats() {
    const level = Math.floor(totalXP / 100) + 1;
    const countriesCount = achievementSystem.getCorrectlyAnsweredCountries().size;
    const achievementsCount = achievementSystem.getProgress().unlocked;
    
    const shareText = `🌍 My Flagtriv Stats:\n🏆 Level ${level}\n🗺️ ${countriesCount} flags discovered\n🎯 ${achievementsCount} achievements unlocked\n🔥 Best streak: ${bestStreak}\n\nPlay at flagtriv.com`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Flagtriv Stats',
            text: shareText
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('📋 Stats copied to clipboard!');
        });
    }
}

// ============================================
// Daily Challenge V2 Functions (hint-based)
// ============================================

function startDailyChallengeV2() {
    gameMode = 'daily';
    isMultiplayerMode = false;

    // Hide everything, show V2 container
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('daily-v2-container').style.display = 'flex';

    // Start the game
    const country = dailyChallengeV2.startGame();

    // Load the flag (timer starts when flag loads)
    const flagImg = document.getElementById('v2-flag');
    flagImg.onload = () => {
        // Start the visual timer
        v2StartVisualTimer();
    };
    flagImg.src = country.flag?.large || `flags/${country.alpha2Code.toLowerCase()}.svg`;

    // Reset UI
    document.getElementById('v2-hints').innerHTML = '';
    document.getElementById('v2-message').textContent = '';
    document.getElementById('v2-message').className = 'v2-message';
    document.getElementById('v2-country-input').value = '';
    document.getElementById('v2-country-input').disabled = false;
    document.getElementById('v2-submit-btn').disabled = true;
    document.getElementById('v2-autocomplete').classList.remove('active');
    document.getElementById('v2-input-area').style.display = 'block';
    document.getElementById('v2-result-area').style.display = 'none';

    // Render guess tracker
    v2RenderGuessTracker();

    // Set up event listeners (only once)
    v2SetupInputListeners();
}

let v2InputListenersSet = false;

function v2SetupInputListeners() {
    if (v2InputListenersSet) return;
    v2InputListenersSet = true;

    const input = document.getElementById('v2-country-input');
    const submitBtn = document.getElementById('v2-submit-btn');
    const autocomplete = document.getElementById('v2-autocomplete');
    let selectedIndex = -1;

    input.addEventListener('input', () => {
        const query = input.value.trim();
        const matches = dailyChallengeV2.filterCountries(query);

        // Enable/disable submit button
        submitBtn.disabled = !query;

        if (matches.length > 0 && query.length >= 1) {
            autocomplete.innerHTML = '';
            selectedIndex = -1;
            matches.forEach((name, i) => {
                const item = document.createElement('div');
                item.className = 'v2-autocomplete-item';
                // Highlight matching portion
                const idx = name.toLowerCase().indexOf(query.toLowerCase());
                if (idx >= 0) {
                    item.innerHTML = name.substring(0, idx) +
                        '<mark>' + name.substring(idx, idx + query.length) + '</mark>' +
                        name.substring(idx + query.length);
                } else {
                    item.textContent = name;
                }
                item.addEventListener('mousedown', (e) => {
                    e.preventDefault(); // Prevent blur
                    input.value = name;
                    autocomplete.classList.remove('active');
                    submitBtn.disabled = false;
                });
                autocomplete.appendChild(item);
            });
            autocomplete.classList.add('active');
        } else {
            autocomplete.classList.remove('active');
        }
    });

    input.addEventListener('keydown', (e) => {
        const items = autocomplete.querySelectorAll('.v2-autocomplete-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            items.forEach((item, i) => item.classList.toggle('selected', i === selectedIndex));
            if (items[selectedIndex]) input.value = items[selectedIndex].textContent;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            items.forEach((item, i) => item.classList.toggle('selected', i === selectedIndex));
            if (items[selectedIndex]) input.value = items[selectedIndex].textContent;
        } else if (e.key === 'Enter') {
            e.preventDefault();
            autocomplete.classList.remove('active');
            if (input.value.trim()) {
                v2SubmitGuess();
            }
        } else if (e.key === 'Escape') {
            autocomplete.classList.remove('active');
        }
    });

    input.addEventListener('blur', () => {
        // Small delay to allow click on autocomplete items
        setTimeout(() => autocomplete.classList.remove('active'), 150);
    });

    input.addEventListener('focus', () => {
        if (input.value.trim().length >= 1) {
            const matches = dailyChallengeV2.filterCountries(input.value.trim());
            if (matches.length > 0) {
                // Re-show autocomplete
                input.dispatchEvent(new Event('input'));
            }
        }
    });

    submitBtn.addEventListener('click', v2SubmitGuess);

    // Result action buttons
    document.getElementById('v2-share-btn').addEventListener('click', v2ShareResult);
    document.getElementById('v2-leaderboard-btn').addEventListener('click', showDailyLeaderboard);
    document.getElementById('v2-name-submit-btn').addEventListener('click', () => {
        document.getElementById('v2-name-input-area').style.display = 'flex';
        document.getElementById('v2-name-submit-btn').style.display = 'none';
    });
    document.getElementById('v2-submit-name').addEventListener('click', v2SubmitName);
    document.getElementById('v2-practice-btn').addEventListener('click', () => {
        document.getElementById('daily-v2-container').style.display = 'none';
        startChallengeMode();
    });
}

function v2SubmitGuess() {
    const input = document.getElementById('v2-country-input');
    const guessText = input.value.trim();
    if (!guessText) return;

    // Check if the guess is a valid country name
    const validName = dailyChallengeV2.countryNames.find(
        n => n.toLowerCase() === guessText.toLowerCase()
    );
    if (!validName) {
        const msgEl = document.getElementById('v2-message');
        msgEl.textContent = 'Not a valid country name';
        msgEl.className = 'v2-message wrong';
        return;
    }

    const result = dailyChallengeV2.submitGuess(validName);
    if (!result) return;

    const msgEl = document.getElementById('v2-message');
    document.getElementById('v2-autocomplete').classList.remove('active');

    if (result.correct) {
        msgEl.textContent = 'Correct!';
        msgEl.className = 'v2-message correct';
        soundEffects.playCorrect();
        if (typeof AnimationEffects !== 'undefined') {
            AnimationEffects.showConfetti();
        }
        // Unlock country and check achievements
        const country = dailyChallengeV2.todaysCountry;
        achievementSystem.unlockCountry(country.alpha2Code, country);
        achievementSystem.checkAchievements();
    } else if (result.gameOver) {
        msgEl.textContent = `The answer was ${dailyChallengeV2.todaysCountry.name}`;
        msgEl.className = 'v2-message wrong';
        soundEffects.playWrong();
    } else {
        msgEl.textContent = `Not ${validName}`;
        msgEl.className = 'v2-message wrong';
        soundEffects.playWrong();
    }

    // Update guess tracker
    v2RenderGuessTracker();

    // Reveal next hint if wrong and game not over
    if (!result.correct && !result.gameOver) {
        v2RevealHint(result.hintsRevealed);
    }

    // Clear input
    input.value = '';
    document.getElementById('v2-submit-btn').disabled = true;

    if (result.gameOver) {
        v2EndGame(result.won);
    } else {
        // Focus input for next guess
        input.focus();
    }
}

function v2RenderGuessTracker() {
    const tracker = document.getElementById('v2-guess-tracker');
    const guesses = dailyChallengeV2.guesses;
    const maxGuesses = dailyChallengeV2.maxGuesses;
    let html = '';

    for (let i = 0; i < maxGuesses; i++) {
        if (i < guesses.length) {
            const cls = guesses[i].correct ? 'correct' : 'wrong';
            html += `<div class="v2-guess-square ${cls}"></div>`;
        } else if (i === guesses.length && dailyChallengeV2.gameActive) {
            html += `<div class="v2-guess-square current"></div>`;
        } else {
            html += `<div class="v2-guess-square empty"></div>`;
        }
    }

    tracker.innerHTML = html;
}

function v2RevealHint(hintIndex) {
    const hints = dailyChallengeV2.getHints();
    const hint = hints[hintIndex];
    if (!hint) return;

    const hintsContainer = document.getElementById('v2-hints');
    const card = document.createElement('div');
    card.className = 'v2-hint-card';
    card.innerHTML = `
        <span class="hint-icon">${hint.icon}</span>
        <span class="hint-label">${hint.label}:</span>
        <span class="hint-value">${hint.value}</span>
    `;
    hintsContainer.appendChild(card);
}

function v2StartVisualTimer() {
    const timerEl = document.getElementById('v2-timer');
    timerEl.classList.add('running');

    if (v2TimerInterval) clearInterval(v2TimerInterval);

    v2TimerInterval = setInterval(() => {
        const elapsed = dailyChallenge.getElapsedTime();
        timerEl.textContent = `⏱️ ${formatTimeMs(elapsed)}`;
    }, 50);
}

function v2StopVisualTimer() {
    if (v2TimerInterval) {
        clearInterval(v2TimerInterval);
        v2TimerInterval = null;
    }
    document.getElementById('v2-timer').classList.remove('running');
}

async function v2EndGame(won) {
    v2StopVisualTimer();

    // Disable input
    document.getElementById('v2-country-input').disabled = true;
    document.getElementById('v2-submit-btn').disabled = true;

    // Submit result
    await dailyChallengeV2.submitResult(won);

    // Show result area after a short delay
    setTimeout(() => {
        document.getElementById('v2-input-area').style.display = 'none';
        const resultArea = document.getElementById('v2-result-area');
        resultArea.style.display = 'block';

        const country = dailyChallengeV2.todaysCountry;

        // Flag and country name
        document.getElementById('v2-result-flag').src = country.flag?.large || `flags/${country.alpha2Code.toLowerCase()}.svg`;
        document.getElementById('v2-result-country').textContent = country.name;

        // Stats
        const timeMs = dailyChallenge.getFinalTime();
        const timeStr = formatTimeMs(timeMs);
        const guessStr = won ? `${dailyChallengeV2.guesses.length}/${dailyChallengeV2.maxGuesses}` : `X/${dailyChallengeV2.maxGuesses}`;
        const currentStreak = dailyChallenge.dailyStats.streak || 0;

        document.getElementById('v2-result-stats').innerHTML = `
            <div class="v2-result-stat">
                <span class="stat-value">${guessStr}</span>
                <span class="stat-label">Guesses</span>
            </div>
            <div class="v2-result-stat">
                <span class="stat-value">${timeStr}</span>
                <span class="stat-label">Time</span>
            </div>
            <div class="v2-result-stat">
                <span class="stat-value">${currentStreak}</span>
                <span class="stat-label">Streak</span>
            </div>
        `;

        // Share preview
        document.getElementById('v2-result-share-preview').textContent = dailyChallengeV2.getShareText();

        // Show leaderboard name submit if won
        if (won) {
            document.getElementById('v2-name-submit-btn').style.display = 'inline-block';
        } else {
            document.getElementById('v2-name-submit-btn').style.display = 'none';
        }
        document.getElementById('v2-name-input-area').style.display = 'none';

        // Countdown
        document.getElementById('v2-countdown').textContent = dailyChallenge.getTimeUntilNext();
    }, won ? 800 : 1500);
}

function v2ShareResult() {
    const shareText = dailyChallengeV2.getShareText();
    if (navigator.share) {
        navigator.share({ title: 'Flagtriv Daily', text: shareText });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('📋 Result copied to clipboard!');
        });
    }
}

async function v2SubmitName() {
    const nameInput = document.getElementById('v2-player-name');
    const playerName = nameInput.value.trim();
    if (!playerName) return;
    if (playerName.length > 12) {
        showToast('Name must be 12 characters or less');
        return;
    }

    const result = await dailyChallengeV2.submitToLeaderboard(playerName);
    if (result.success) {
        document.getElementById('v2-name-input-area').style.display = 'none';
        showToast('Submitted to leaderboard!');
    } else {
        showToast('Failed to submit: ' + (result.error || 'Unknown error'));
    }
}

// Show V2 daily complete screen (when revisiting after already played)
function showDailyCompleteV2() {
    // Hide everything
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('daily-v2-container').style.display = 'flex';

    const country = dailyChallenge.getTodaysCountry();
    const todayResult = dailyChallenge.dailyStats.results[dailyChallenge.today];

    if (!todayResult || typeof todayResult !== 'object') {
        // No valid result, let them play
        startDailyChallengeV2();
        return;
    }

    // Load V2-specific data
    const v2Results = JSON.parse(localStorage.getItem('dailyV2Results') || '{}');
    const v2Data = v2Results[dailyChallenge.today];

    // Show the flag
    const flagImg = document.getElementById('v2-flag');
    flagImg.src = country.flag?.large || `flags/${country.alpha2Code.toLowerCase()}.svg`;

    // Reconstruct state for display
    if (v2Data) {
        dailyChallengeV2.todaysCountry = country;
        dailyChallengeV2.guesses = v2Data.guesses || [];
        dailyChallengeV2.hintsRevealed = v2Data.hintsUsed || 0;
        dailyChallengeV2.gameActive = false;
    }

    // Render hints that were revealed
    const hintsContainer = document.getElementById('v2-hints');
    hintsContainer.innerHTML = '';
    if (v2Data && v2Data.hintsUsed > 0) {
        dailyChallengeV2.todaysCountry = country;
        const hints = dailyChallengeV2.getHints();
        for (let i = 1; i <= v2Data.hintsUsed; i++) {
            if (hints[i]) {
                const card = document.createElement('div');
                card.className = 'v2-hint-card';
                card.innerHTML = `
                    <span class="hint-icon">${hints[i].icon}</span>
                    <span class="hint-label">${hints[i].label}:</span>
                    <span class="hint-value">${hints[i].value}</span>
                `;
                hintsContainer.appendChild(card);
            }
        }
    }

    // Render guess tracker
    v2RenderGuessTracker();

    // Hide input, show result
    document.getElementById('v2-input-area').style.display = 'none';
    document.getElementById('v2-message').textContent = '';
    const resultArea = document.getElementById('v2-result-area');
    resultArea.style.display = 'block';

    document.getElementById('v2-result-flag').src = country.flag?.large || `flags/${country.alpha2Code.toLowerCase()}.svg`;
    document.getElementById('v2-result-country').textContent = country.name;

    // Stats
    const won = todayResult.correct;
    const totalGuesses = todayResult.attempts || (v2Data?.totalGuesses || 0);
    const timeMs = todayResult.timeMs || 0;
    const timeStr = formatTimeMs(timeMs);
    const guessStr = won ? `${totalGuesses}/${dailyChallengeV2.maxGuesses}` : `X/${dailyChallengeV2.maxGuesses}`;
    const currentStreak = dailyChallenge.dailyStats.streak || 0;

    document.getElementById('v2-result-stats').innerHTML = `
        <div class="v2-result-stat">
            <span class="stat-value">${guessStr}</span>
            <span class="stat-label">Guesses</span>
        </div>
        <div class="v2-result-stat">
            <span class="stat-value">${timeStr}</span>
            <span class="stat-label">Time</span>
        </div>
        <div class="v2-result-stat">
            <span class="stat-value">${currentStreak}</span>
            <span class="stat-label">Streak</span>
        </div>
    `;

    // Share preview
    if (v2Data) {
        document.getElementById('v2-result-share-preview').textContent = dailyChallengeV2.getShareText();
    } else {
        // Fallback share for V1 results viewed in V2 UI
        document.getElementById('v2-result-share-preview').textContent = dailyChallenge.getShareText(todayResult);
    }

    document.getElementById('v2-name-submit-btn').style.display = 'none';
    document.getElementById('v2-name-input-area').style.display = 'none';
    document.getElementById('v2-countdown').textContent = dailyChallenge.getTimeUntilNext();

    // Timer shows final time
    document.getElementById('v2-timer').textContent = `⏱️ ${timeStr}`;
    document.getElementById('v2-timer').classList.remove('running');

    // Set up listeners
    v2SetupInputListeners();
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', loadCountries);