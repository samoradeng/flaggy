// Global variables
let countries = {};
let currentFlag = null;
let score = 0;
let totalQuestions = 0;
let streak = 0;
let bestStreak = parseInt(localStorage.getItem('bestStreak') || '0');
let lives = 3;
let gameMode = 'challenge'; // 'challenge', 'daily'
let usedCountries = [];
let gameStartTime = null;
let questionStartTime = null;
let totalXP = parseInt(localStorage.getItem('totalXP') || '0');
let currentLevel = Math.floor(totalXP / 100) + 1;
let isMultiplayerMode = false;
let dailyTimer = null; // Timer for daily challenge

// Initialize classes
let continentFilter, flagFacts, dailyChallenge, achievementSystem, soundEffects, animationEffects, multiplayerGame;

// Load countries data and initialize the game
fetch('countries.json')
    .then(response => response.json())
    .then(data => {
        countries = data;
        initializeGame();
    })
    .catch(error => {
        console.error('Error loading countries:', error);
    });

function initializeGame() {
    // Initialize all systems
    continentFilter = new ContinentFilter();
    flagFacts = new FlagFacts();
    dailyChallenge = new DailyChallenge(countries);
    achievementSystem = new AchievementSystem();
    soundEffects = new SoundEffects();
    multiplayerGame = new MultiplayerGame(countries, continentFilter, flagFacts, soundEffects);

    // Update UI with current settings
    updateContinentFilterUI();
    updateSoundSettingUI();
    updateDailyStreakDisplay();

    // Set up event listeners
    setupEventListeners();

    // Check if daily challenge was already completed
    checkDailyStatus();
}

function setupEventListeners() {
    // Mode selection buttons
    const dailyChallengeBtn = document.getElementById('daily-challenge-btn');
    if (dailyChallengeBtn) {
        dailyChallengeBtn.addEventListener('click', handleDailyChallengeClick);
    }
    
    const challengeModeBtn = document.getElementById('challenge-mode-btn');
    if (challengeModeBtn) {
        challengeModeBtn.addEventListener('click', startChallengeMode);
    }

    // Game controls
    const nextBtn = document.getElementById('next');
    if (nextBtn) {
        nextBtn.addEventListener('click', nextQuestion);
    }
    
    const tryAgainBtn = document.getElementById('try-again');
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', startChallengeMode);
    }
    
    const playEndlessFromDailyBtn = document.getElementById('play-endless-from-daily');
    if (playEndlessFromDailyBtn) {
        playEndlessFromDailyBtn.addEventListener('click', startChallengeMode);
    }
    
    const playEndlessFromGameoverBtn = document.getElementById('play-endless-from-gameover');
    if (playEndlessFromGameoverBtn) {
        playEndlessFromGameoverBtn.addEventListener('click', startChallengeMode);
    }

    // Home logo button
    const homeLogoBtn = document.getElementById('home-logo-btn');
    if (homeLogoBtn) {
        homeLogoBtn.addEventListener('click', goHome);
    }

    // Settings
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettings);
    }
    
    const settingsClose = document.querySelector('.settings-close');
    if (settingsClose) {
        settingsClose.addEventListener('click', closeSettings);
    }
    
    const continentFilterBtn = document.getElementById('continent-filter-btn');
    if (continentFilterBtn) {
        continentFilterBtn.addEventListener('click', openContinentFilter);
    }
    
    const soundToggleBtn = document.getElementById('sound-toggle-setting');
    if (soundToggleBtn) {
        soundToggleBtn.addEventListener('click', toggleSound);
    }
    
    const statsBtn = document.getElementById('stats-btn');
    if (statsBtn) {
        statsBtn.addEventListener('click', openStats);
    }

    // Continent filter
    const continentFilterClose = document.querySelector('.continent-filter-close');
    if (continentFilterClose) {
        continentFilterClose.addEventListener('click', closeContinentFilter);
    }
    
    const applyContinentFilterBtn = document.getElementById('apply-continent-filter');
    if (applyContinentFilterBtn) {
        applyContinentFilterBtn.addEventListener('click', applyContinentFilter);
    }

    // Daily challenge modals
    const dailyNameClose = document.querySelector('.daily-name-close');
    if (dailyNameClose) {
        dailyNameClose.addEventListener('click', closeDailyNameModal);
    }
    
    const submitDailyNameBtn = document.getElementById('submit-daily-name');
    if (submitDailyNameBtn) {
        submitDailyNameBtn.addEventListener('click', submitDailyName);
    }
    
    const skipDailyNameBtn = document.getElementById('skip-daily-name');
    if (skipDailyNameBtn) {
        skipDailyNameBtn.addEventListener('click', skipDailyName);
    }
    
    const dailyLeaderboardClose = document.querySelector('.daily-leaderboard-close');
    if (dailyLeaderboardClose) {
        dailyLeaderboardClose.addEventListener('click', closeDailyLeaderboard);
    }
    
    const closeLeaderboardBtn = document.getElementById('close-leaderboard');
    if (closeLeaderboardBtn) {
        closeLeaderboardBtn.addEventListener('click', closeDailyLeaderboard);
    }
    
    const copyLeaderboardBtn = document.getElementById('copy-leaderboard');
    if (copyLeaderboardBtn) {
        copyLeaderboardBtn.addEventListener('click', copyLeaderboard);
    }

    // View Leaderboard button from daily complete screen
    const viewLeaderboardBtn = document.getElementById('view-leaderboard-btn');
    if (viewLeaderboardBtn) {
        viewLeaderboardBtn.addEventListener('click', showDailyLeaderboard);
    }

    // Stats modal - Fixed close button event listener
    const statsModalCloseBtn = document.querySelector('#stats-modal .close-btn');
    if (statsModalCloseBtn) {
        statsModalCloseBtn.addEventListener('click', closeStats);
    }
    
    const shareButton = document.getElementById('share-button');
    if (shareButton) {
        shareButton.addEventListener('click', shareStats);
    }

    // Share buttons
    const shareDailyResultBtn = document.getElementById('share-daily-result');
    if (shareDailyResultBtn) {
        shareDailyResultBtn.addEventListener('click', shareDailyResult);
    }
    
    const shareEndlessResultBtn = document.getElementById('share-endless-result');
    if (shareEndlessResultBtn) {
        shareEndlessResultBtn.addEventListener('click', shareEndlessResult);
    }
    
    const seeStatsFromGameoverBtn = document.getElementById('see-stats-from-gameover');
    if (seeStatsFromGameoverBtn) {
        seeStatsFromGameoverBtn.addEventListener('click', openStats);
    }

    // Tab switching in stats
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    // Continent filter options
    document.querySelectorAll('.continent-option').forEach(option => {
        option.addEventListener('click', (e) => selectContinent(e.currentTarget.dataset.continent));
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

function handleDailyChallengeClick() {
    if (dailyChallenge.hasPlayedToday()) {
        // If already played today, show leaderboard
        showDailyLeaderboard();
    } else {
        // If not played today, start the challenge
        startDailyChallenge();
    }
}

function updateContinentFilterUI() {
    const selectionText = continentFilter.getSelectionText();
    const continentSelectionText = document.getElementById('continent-selection-text');
    if (continentSelectionText) {
        continentSelectionText.textContent = selectionText;
    }
    
    // Update continent options
    document.querySelectorAll('.continent-option').forEach(option => {
        const continentId = option.dataset.continent;
        if (continentFilter.selectedContinents.includes(continentId)) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    updateSelectionSummary();
}

function updateSelectionSummary() {
    const summary = document.getElementById('selection-summary');
    if (summary) {
        const selectionText = continentFilter.getSelectionText();
        summary.textContent = selectionText;
    }
}

function selectContinent(continentId) {
    continentFilter.toggleContinent(continentId);
    updateContinentFilterUI();
}

function applyContinentFilter() {
    closeContinentFilter();
    updateContinentFilterUI();
}

function openContinentFilter() {
    const modal = document.getElementById('continent-filter-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeContinentFilter() {
    const modal = document.getElementById('continent-filter-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateSoundSettingUI() {
    const soundIcon = document.getElementById('sound-icon-setting');
    const soundStatus = document.getElementById('sound-status');
    
    if (soundIcon && soundStatus) {
        if (soundEffects.enabled) {
            soundIcon.textContent = '🔊';
            soundStatus.textContent = 'On';
        } else {
            soundIcon.textContent = '🔇';
            soundStatus.textContent = 'Off';
        }
    }
}

function toggleSound() {
    const enabled = soundEffects.toggle();
    updateSoundSettingUI();
}

function updateDailyStreakDisplay() {
    const dailyStreakInfo = document.getElementById('daily-streak-info');
    const dailyStreakCount = document.getElementById('daily-streak-count');
    
    if (dailyStreakInfo && dailyStreakCount) {
        if (dailyChallenge.dailyStats.streak > 0) {
            dailyStreakInfo.style.display = 'block';
            dailyStreakCount.textContent = dailyChallenge.dailyStats.streak;
        } else {
            dailyStreakInfo.style.display = 'none';
        }
    }
}

function checkDailyStatus() {
    const dailyBtn = document.getElementById('daily-challenge-btn');
    
    if (dailyBtn) {
        if (dailyChallenge.hasPlayedToday()) {
            dailyBtn.textContent = '🏆 View Leaderboard';
            dailyBtn.disabled = false; // Keep button enabled so users can view leaderboard
        } else {
            dailyBtn.textContent = 'Daily Flag';
            dailyBtn.disabled = false;
        }
    }
}

function goHome() {
    // Hide all screens
    const gameContainer = document.getElementById('game-container');
    const topBar = document.getElementById('top-bar');
    const gameOverScreen = document.getElementById('game-over-screen');
    const endlessGameOverScreen = document.getElementById('endless-game-over-screen');
    const dailyCompleteScreen = document.getElementById('daily-complete-screen');
    const multiplayerLobby = document.getElementById('multiplayer-lobby');
    const multiplayerResults = document.getElementById('multiplayer-results');
    
    if (gameContainer) gameContainer.style.display = 'none';
    if (topBar) topBar.style.display = 'none';
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    if (endlessGameOverScreen) endlessGameOverScreen.style.display = 'none';
    if (dailyCompleteScreen) dailyCompleteScreen.style.display = 'none';
    if (multiplayerLobby) multiplayerLobby.style.display = 'none';
    if (multiplayerResults) multiplayerResults.style.display = 'none';
    
    // Show mode selection
    const modeSelection = document.getElementById('mode-selection');
    if (modeSelection) {
        modeSelection.style.display = 'flex';
    }
    
    // Reset game state
    resetGame();
    
    // Clear daily timer if running
    if (dailyTimer) {
        clearInterval(dailyTimer);
        dailyTimer = null;
    }
    
    // Update daily status
    checkDailyStatus();
    updateDailyStreakDisplay();
    
    // Reset multiplayer mode
    isMultiplayerMode = false;
}

function resetGame() {
    score = 0;
    totalQuestions = 0;
    streak = 0;
    lives = 3;
    usedCountries = [];
    currentFlag = null;
    gameStartTime = null;
    questionStartTime = null;
    
    // Clear daily timer if running
    if (dailyTimer) {
        clearInterval(dailyTimer);
        dailyTimer = null;
    }
    
    // Reset UI
    const message = document.getElementById('message');
    const facts = document.getElementById('facts');
    const flagTrivia = document.getElementById('flag-trivia');
    const nextBtn = document.getElementById('next');
    
    if (message) message.textContent = '';
    if (facts) facts.hidden = true;
    if (flagTrivia) flagTrivia.hidden = true;
    if (nextBtn) nextBtn.hidden = true;
    
    // Reset options
    const options = document.querySelectorAll('.option');
    options.forEach(button => {
        button.disabled = false;
        button.classList.remove('disabled', 'correct-answer', 'wrong-answer');
    });
}

function startDailyChallenge() {
    if (dailyChallenge.hasPlayedToday()) {
        showDailyLeaderboard();
        return;
    }
    
    gameMode = 'daily';
    resetGame();
    lives = 2; // Daily challenge has 2 attempts
    
    // Hide mode selection and show game
    const modeSelection = document.getElementById('mode-selection');
    const gameContainer = document.getElementById('game-container');
    const topBar = document.getElementById('top-bar');
    
    if (modeSelection) modeSelection.style.display = 'none';
    if (gameContainer) gameContainer.style.display = 'flex';
    if (topBar) topBar.style.display = 'flex';
    
    // Update UI for daily challenge
    const heading = document.getElementById('heading');
    const subHeading = document.getElementById('subHeading');
    
    if (heading) heading.textContent = 'Daily Challenge';
    if (subHeading) subHeading.textContent = 'One flag, two chances. Can you guess it?';
    
    // Get today's flag
    currentFlag = dailyChallenge.getTodaysCountry();
    gameStartTime = Date.now();
    questionStartTime = Date.now();
    
    // Start precise timing for leaderboard
    dailyChallenge.startTiming();
    
    // Start the timer for daily challenge
    startDailyTimer();
    
    displayFlag();
    updateTopBar();
}

function startDailyTimer() {
    if (dailyTimer) {
        clearInterval(dailyTimer);
    }
    
    const startTime = Date.now();
    
    dailyTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Update the streak display with timer
        const streakDisplay = document.getElementById('streak-display-top');
        if (streakDisplay) {
            streakDisplay.textContent = `⏱️ ${timeString}`;
        }
    }, 1000);
}

function stopDailyTimer() {
    if (dailyTimer) {
        clearInterval(dailyTimer);
        dailyTimer = null;
    }
}

function startChallengeMode() {
    gameMode = 'challenge';
    resetGame();
    lives = 3;
    
    // Hide all screens and show game
    const modeSelection = document.getElementById('mode-selection');
    const gameOverScreen = document.getElementById('game-over-screen');
    const endlessGameOverScreen = document.getElementById('endless-game-over-screen');
    const dailyCompleteScreen = document.getElementById('daily-complete-screen');
    const gameContainer = document.getElementById('game-container');
    const topBar = document.getElementById('top-bar');
    
    if (modeSelection) modeSelection.style.display = 'none';
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    if (endlessGameOverScreen) endlessGameOverScreen.style.display = 'none';
    if (dailyCompleteScreen) dailyCompleteScreen.style.display = 'none';
    if (gameContainer) gameContainer.style.display = 'flex';
    if (topBar) topBar.style.display = 'flex';
    
    // Update UI for challenge mode
    const heading = document.getElementById('heading');
    const subHeading = document.getElementById('subHeading');
    
    if (heading) heading.textContent = 'Challenge Mode';
    if (subHeading) subHeading.textContent = 'How many can you get right?';
    
    gameStartTime = Date.now();
    nextQuestion();
}

function nextQuestion() {
    if (isMultiplayerMode) return; // Don't interfere with multiplayer
    
    // Reset UI
    const message = document.getElementById('message');
    const facts = document.getElementById('facts');
    const flagTrivia = document.getElementById('flag-trivia');
    const nextBtn = document.getElementById('next');
    
    if (message) message.textContent = '';
    if (facts) facts.hidden = true;
    if (flagTrivia) flagTrivia.hidden = true;
    if (nextBtn) nextBtn.hidden = true;
    
    // Reset options
    const options = document.querySelectorAll('.option');
    options.forEach(button => {
        button.disabled = false;
        button.classList.remove('disabled', 'correct-answer', 'wrong-answer');
    });
    
    if (gameMode === 'daily') {
        // Daily challenge uses the predetermined flag
        displayFlag();
    } else {
        // Get filtered countries based on continent selection
        const filteredCountries = continentFilter.filterCountries(countries);
        const countryCodes = Object.keys(filteredCountries);
        
        // Ensure we don't repeat countries in challenge mode
        if (gameMode === 'challenge' && usedCountries.length >= countryCodes.length) {
            usedCountries = []; // Reset if we've used all countries
        }
        
        let countryCode;
        do {
            const randomIndex = Math.floor(Math.random() * countryCodes.length);
            countryCode = countryCodes[randomIndex];
        } while (gameMode === 'challenge' && usedCountries.includes(countryCode));
        
        if (gameMode === 'challenge') {
            usedCountries.push(countryCode);
        }
        
        currentFlag = filteredCountries[countryCode];
        displayFlag();
    }
    
    questionStartTime = Date.now();
    updateTopBar();
}

function displayFlag() {
    if (!currentFlag || !currentFlag.flag || !currentFlag.flag.large) {
        console.error('Invalid flag data:', currentFlag);
        return;
    }
    
    const flagImg = document.getElementById('flag');
    if (flagImg) {
        flagImg.src = currentFlag.flag.large;
    }
    updateOptions();
}

function updateOptions() {
    const options = document.querySelectorAll('.option');
    const filteredCountries = continentFilter.filterCountries(countries);
    const allCountries = Object.values(filteredCountries);
    const correctCountry = currentFlag;
    
    // Get other countries for incorrect options
    const otherCountries = allCountries.filter(
        country => country.alpha2Code !== correctCountry.alpha2Code
    );
    
    const incorrectAnswers = [];
    while (incorrectAnswers.length < 3 && otherCountries.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherCountries.length);
        incorrectAnswers.push(otherCountries[randomIndex].name);
        otherCountries.splice(randomIndex, 1);
    }
    
    // Combine and shuffle all answers
    const allAnswers = [...incorrectAnswers, correctCountry.name];
    
    options.forEach(button => {
        const randomIndex = Math.floor(Math.random() * allAnswers.length);
        button.textContent = allAnswers[randomIndex];
        allAnswers.splice(randomIndex, 1);
        
        // Add click handler
        button.onclick = (e) => checkAnswer(e);
    });
}

function checkAnswer(event) {
    if (isMultiplayerMode) return; // Don't interfere with multiplayer
    
    const selectedAnswer = event.target.textContent;
    const isCorrect = selectedAnswer === currentFlag.name;
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    
    // Disable all options
    const options = document.querySelectorAll('.option');
    options.forEach(button => {
        button.disabled = true;
        button.classList.add('disabled');
    });
    
    if (isCorrect) {
        handleCorrectAnswer(event.target, timeSpent);
    } else {
        handleWrongAnswer(event.target, timeSpent);
    }
}

function handleCorrectAnswer(selectedButton, timeSpent) {
    selectedButton.classList.add('correct-answer');
    soundEffects.playCorrect();
    
    // Update score and streak
    score++;
    totalQuestions++;
    streak++;
    
    // Update best streak
    if (streak > bestStreak) {
        bestStreak = streak;
        localStorage.setItem('bestStreak', bestStreak.toString());
    }
    
    // Add XP and check for level up
    const xpGained = gameMode === 'daily' ? 50 : 10;
    addXP(xpGained, selectedButton);
    
    // Save the correctly answered country to passport
    saveCorrectlyAnsweredCountry(currentFlag);
    
    // Unlock country in achievement system (for achievements)
    achievementSystem.unlockCountry(currentFlag.alpha2Code, currentFlag);
    
    // Check for new achievements
    const newAchievements = achievementSystem.checkAchievements();
    newAchievements.forEach(achievement => {
        AnimationEffects.showAchievementUnlock(achievement);
    });
    
    // Show confetti for streaks - but NOT for daily mode
    if (gameMode !== 'daily' && streak >= 5) {
        AnimationEffects.showStreakConfetti();
        soundEffects.playStreak();
    } else if (gameMode !== 'daily') {
        AnimationEffects.showConfetti();
    }
    
    if (gameMode === 'daily') {
        // Stop the timer
        stopDailyTimer();
        
        const message = document.getElementById('message');
        if (message) {
            message.textContent = "🎉 Correct! Well done!";
        }
        setTimeout(() => {
            completeDailyChallenge(true, 3 - lives, timeSpent);
        }, 2000);
    } else {
        const message = document.getElementById('message');
        if (message) {
            message.textContent = "🎉 Correct!";
        }
        setTimeout(() => {
            const nextBtn = document.getElementById('next');
            if (nextBtn) {
                nextBtn.hidden = false;
            }
        }, 1500);
    }
    
    showFacts();
    updateTopBar();
    updateStats();
}

function saveCorrectlyAnsweredCountry(country) {
    // Get existing correctly answered countries
    const correctlyAnswered = JSON.parse(localStorage.getItem('correctlyAnsweredCountries') || '[]');
    
    // Add this country if not already there
    if (!correctlyAnswered.includes(country.alpha2Code)) {
        correctlyAnswered.push(country.alpha2Code);
        localStorage.setItem('correctlyAnsweredCountries', JSON.stringify(correctlyAnswered));
    }
    
    // Store detailed country data for passport display
    const countryDetails = JSON.parse(localStorage.getItem('countryDetails') || '{}');
    countryDetails[country.alpha2Code] = {
        name: country.name,
        region: country.region,
        subregion: country.subregion,
        flag: country.flag,
        capital: country.capital,
        alpha2Code: country.alpha2Code
    };
    localStorage.setItem('countryDetails', JSON.stringify(countryDetails));
    
    // Debug logging
    console.log('Saved country:', country.alpha2Code, country.name);
    console.log('Total correctly answered:', correctlyAnswered.length);
}

function handleWrongAnswer(selectedButton, timeSpent) {
    selectedButton.classList.add('wrong-answer');
    soundEffects.playWrong();
    
    // Update stats
    totalQuestions++;
    streak = 0;
    
    if (gameMode === 'daily') {
        lives--;
        if (lives <= 0) {
            // Stop the timer
            stopDailyTimer();
            
            // Only show correct answer when all attempts are exhausted
            const options = document.querySelectorAll('.option');
            options.forEach(button => {
                if (button.textContent === currentFlag.name) {
                    button.classList.add('correct-answer');
                }
            });
            const message = document.getElementById('message');
            if (message) {
                message.textContent = "❌ Game Over! The correct answer was " + currentFlag.name;
            }
            setTimeout(() => {
                completeDailyChallenge(false, 2, timeSpent);
            }, 3000);
        } else {
            // Don't show correct answer yet - they still have attempts left
            const message = document.getElementById('message');
            if (message) {
                message.textContent = `❌ Wrong! You have ${lives} chance${lives === 1 ? '' : 's'} left.`;
            }
            setTimeout(() => {
                nextQuestion();
            }, 3000);
        }
    } else if (gameMode === 'challenge') {
        // Show correct answer for challenge mode
        const options = document.querySelectorAll('.option');
        options.forEach(button => {
            if (button.textContent === currentFlag.name) {
                button.classList.add('correct-answer');
            }
        });
        
        lives--;
        if (lives <= 0) {
            const message = document.getElementById('message');
            if (message) {
                message.textContent = "❌ Game Over! The correct answer was " + currentFlag.name;
            }
            setTimeout(() => {
                endChallengeMode();
            }, 3000);
        } else {
            const message = document.getElementById('message');
            if (message) {
                message.textContent = `❌ Wrong! You have ${lives} life${lives === 1 ? '' : 'ves'} left.`;
            }
            setTimeout(() => {
                const nextBtn = document.getElementById('next');
                if (nextBtn) {
                    nextBtn.hidden = false;
                }
            }, 2000);
        }
    }
    
    showFacts();
    updateTopBar();
    updateStats();
}

function addXP(amount, element) {
    totalXP += amount;
    localStorage.setItem('totalXP', totalXP.toString());
    
    const newLevel = Math.floor(totalXP / 100) + 1;
    if (newLevel > currentLevel) {
        currentLevel = newLevel;
        AnimationEffects.showLevelUpAnimation(currentLevel);
        soundEffects.playLevelUp();
    }
    
    AnimationEffects.showXPGain(amount, element);
}

function showFacts() {
    const facts = document.getElementById('facts');
    if (facts && currentFlag) {
        facts.innerHTML = `
            <p class="fact-text"><strong>Capital:</strong> ${currentFlag.capital}</p>
            <p class="fact-text"><strong>Region:</strong> ${currentFlag.subregion}</p>
        `;
        facts.hidden = false;
    }
    
    // Show flag trivia (removed as requested)
    const flagTrivia = document.getElementById('flag-trivia');
    if (flagTrivia) {
        flagTrivia.hidden = true;
    }
}

function updateTopBar() {
    if (gameMode === 'daily') {
        // Timer is handled by startDailyTimer function
        const livesCount = document.getElementById('lives-count');
        const scoreDisplay = document.getElementById('score-display');
        
        if (livesCount) livesCount.textContent = lives;
        if (scoreDisplay) scoreDisplay.textContent = `Attempts: ${3 - lives}/2`;
    } else if (gameMode === 'challenge') {
        const streakDisplay = document.getElementById('streak-display-top');
        const livesCount = document.getElementById('lives-count');
        const scoreDisplay = document.getElementById('score-display');
        
        if (streakDisplay) streakDisplay.textContent = `${streak} Streak`;
        if (livesCount) livesCount.textContent = lives;
        if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}/${totalQuestions}`;
    }
    
    // Show lives display for both modes
    const livesDisplay = document.getElementById('lives-display');
    if (livesDisplay) {
        livesDisplay.style.display = 'flex';
    }
}

async function completeDailyChallenge(success, attempts, timeSpent) {
    // Submit result to daily challenge
    await dailyChallenge.submitResult(success, attempts, timeSpent);
    
    // Hide game UI
    const gameContainer = document.getElementById('game-container');
    const topBar = document.getElementById('top-bar');
    
    if (gameContainer) gameContainer.style.display = 'none';
    if (topBar) topBar.style.display = 'none';
    
    if (success) {
        // Show name input modal for successful completion
        showDailyNameModal(attempts, timeSpent);
    } else {
        // Show game over screen
        showDailyGameOver();
    }
    
    // Update daily status
    checkDailyStatus();
    updateDailyStreakDisplay();
}

function showDailyNameModal(attempts, timeSpent) {
    const modal = document.getElementById('daily-name-modal');
    if (modal) {
        modal.style.display = 'block';
    }
    
    // Store the completion data for later submission
    window.dailyCompletionData = { attempts, timeSpent };
}

function closeDailyNameModal() {
    const modal = document.getElementById('daily-name-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function submitDailyName() {
    const playerNameInput = document.getElementById('daily-player-name');
    if (!playerNameInput) return;
    
    const playerName = playerNameInput.value.trim();
    
    if (!playerName) {
        alert('Please enter your name');
        return;
    }
    
    if (playerName.length > 6) {
        alert('Name must be 6 characters or less');
        return;
    }
    
    const { attempts, timeSpent } = window.dailyCompletionData;
    
    // Submit to global leaderboard
    const result = await dailyChallenge.submitToLeaderboard(playerName, timeSpent, attempts);
    
    if (!result.success) {
        // Show error message if submission failed
        alert(result.error || 'Failed to submit to leaderboard. Please try again.');
        return;
    }
    
    closeDailyNameModal();
    showDailyComplete(attempts, timeSpent, result.global);
}

function skipDailyName() {
    const { attempts, timeSpent } = window.dailyCompletionData;
    closeDailyNameModal();
    showDailyComplete(attempts, timeSpent, false);
}

function showDailyComplete(attempts, timeSpent, submittedToGlobal) {
    const dailyCompleteScreen = document.getElementById('daily-complete-screen');
    if (dailyCompleteScreen) {
        dailyCompleteScreen.style.display = 'block';
    }
    
    // Update result display
    const resultHeading = document.getElementById('daily-result-heading');
    const resultFlag = document.getElementById('daily-result-flag');
    const resultCountry = document.getElementById('daily-result-country');
    const attemptsDisplay = document.getElementById('daily-attempts-display');
    const streakDisplay = document.getElementById('daily-streak-display');
    const globalStat = document.getElementById('daily-global-stat');
    
    if (resultHeading) resultHeading.textContent = 'Well Done!';
    if (resultFlag && currentFlag) resultFlag.src = currentFlag.flag.large;
    if (resultCountry && currentFlag) resultCountry.textContent = currentFlag.name;
    if (attemptsDisplay) attemptsDisplay.textContent = `Solved in ${attempts} attempt${attempts === 1 ? '' : 's'}`;
    if (streakDisplay) streakDisplay.textContent = `🔥 Daily Streak: ${dailyChallenge.dailyStats.streak}`;
    
    // Show submission status
    if (globalStat) {
        if (submittedToGlobal) {
            globalStat.textContent = '🌍 Score submitted to global leaderboard!';
        } else {
            globalStat.textContent = '📱 Score saved locally - global leaderboard unavailable';
        }
    }
    
    // Update countdown
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

function showDailyGameOver() {
    const gameOverScreen = document.getElementById('game-over-screen');
    const logoText = document.getElementById('flagem-logo-text');
    
    if (gameOverScreen) gameOverScreen.style.display = 'block';
    if (logoText && currentFlag) logoText.textContent = `The answer was ${currentFlag.name}`;
}

function updateCountdown() {
    const timeUntilNext = dailyChallenge.getTimeUntilNext();
    const countdownTimer = document.getElementById('countdown-timer');
    if (countdownTimer) {
        countdownTimer.textContent = timeUntilNext;
    }
}

function endChallengeMode() {
    // Hide game UI
    const gameContainer = document.getElementById('game-container');
    const topBar = document.getElementById('top-bar');
    
    if (gameContainer) gameContainer.style.display = 'none';
    if (topBar) topBar.style.display = 'none';
    
    // Show game over screen
    const endlessGameOverScreen = document.getElementById('endless-game-over-screen');
    if (endlessGameOverScreen) {
        endlessGameOverScreen.style.display = 'block';
    }
    
    // Update displays
    const scoreDisplay = document.getElementById('endless-score-display');
    const highestScoreDisplay = document.getElementById('endless-highest-score-display');
    const finalStreakDisplay = document.getElementById('final-streak-display');
    
    if (scoreDisplay) {
        scoreDisplay.textContent = `Final Score: ${score}/${totalQuestions}`;
    }
    
    const highestScore = parseInt(localStorage.getItem('challengeHighestScore') || '0');
    if (score > highestScore) {
        localStorage.setItem('challengeHighestScore', score.toString());
        if (highestScoreDisplay) {
            highestScoreDisplay.textContent = `🎉 New High Score: ${score}!`;
        }
    } else {
        if (highestScoreDisplay) {
            highestScoreDisplay.textContent = `Highest Score: ${highestScore}`;
        }
    }
    
    if (finalStreakDisplay) {
        finalStreakDisplay.textContent = `Best Streak: ${bestStreak}`;
    }
    
    updateStats();
}

async function showDailyLeaderboard() {
    console.log('🔄 Loading daily leaderboard...');
    
    const leaderboardData = await dailyChallenge.getLeaderboard();
    const leaderboardList = document.getElementById('daily-leaderboard-list');
    
    console.log('📊 Leaderboard data:', leaderboardData);
    
    // Update title and description based on scope
    const title = document.getElementById('leaderboard-title');
    const scopeElement = document.getElementById('leaderboard-scope');
    
    if (title) {
        if (leaderboardData.isGlobal) {
            title.innerHTML = '🏆 Daily Leaderboard <span class="global-status global">GLOBAL</span>';
        } else {
            title.innerHTML = '🏆 Daily Leaderboard <span class="global-status local">LOCAL</span>';
        }
    }
    
    if (scopeElement) {
        if (leaderboardData.isGlobal) {
            scopeElement.textContent = '🌍 Global leaderboard - compete with players worldwide!';
        } else {
            if (leaderboardData.error) {
                scopeElement.textContent = `❌ ${leaderboardData.error}`;
            } else {
                scopeElement.textContent = '📱 Local leaderboard - global leaderboard unavailable';
            }
        }
    }
    
    // Clear existing entries
    if (leaderboardList) {
        leaderboardList.innerHTML = '';
        
        if (leaderboardData.entries.length === 0) {
            if (leaderboardData.error) {
                leaderboardList.innerHTML = `<div class="leaderboard-empty">❌ ${leaderboardData.error}</div>`;
            } else {
                leaderboardList.innerHTML = '<div class="leaderboard-empty">No players yet - be the first! 🚀</div>';
            }
        } else {
            console.log('📋 Displaying', leaderboardData.entries.length, 'leaderboard entries');
            
            leaderboardData.entries.slice(0, 10).forEach((entry, index) => {
                const rank = index + 1;
                const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                
                const leaderboardItem = document.createElement('div');
                leaderboardItem.className = 'leaderboard-item';
                
                // Show time and attempts for better context
                const attemptsDisplay = entry.attempts === 1 ? '1st try' : `${entry.attempts} tries`;
                
                leaderboardItem.innerHTML = `
                    <span class="rank">${rankEmoji}</span>
                    <span class="player-name">${entry.name} (${entry.country})</span>
                    <span class="player-time">${entry.time}s (${attemptsDisplay})</span>
                `;
                
                leaderboardList.appendChild(leaderboardItem);
            });
        }
    }
    
    const modal = document.getElementById('daily-leaderboard-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeDailyLeaderboard() {
    const modal = document.getElementById('daily-leaderboard-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function copyLeaderboard() {
    try {
        const shareText = await dailyChallenge.generateLeaderboardShareText();
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(shareText);
            showToast('📋 Leaderboard copied to clipboard!');
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('📋 Leaderboard copied to clipboard!');
        }
    } catch (error) {
        console.error('Failed to copy leaderboard:', error);
        showToast('❌ Failed to copy leaderboard');
    }
}

function updateStats() {
    // Challenge mode stats
    const challengeTimesPlayed = parseInt(localStorage.getItem('challengeTimesPlayed') || '0');
    const challengeHighestScore = parseInt(localStorage.getItem('challengeHighestScore') || '0');
    const challengeTotalScore = parseInt(localStorage.getItem('challengeTotalScore') || '0');
    
    if (gameMode === 'challenge' && lives <= 0) {
        localStorage.setItem('challengeTimesPlayed', (challengeTimesPlayed + 1).toString());
        localStorage.setItem('challengeTotalScore', (challengeTotalScore + score).toString());
        
        if (score > challengeHighestScore) {
            localStorage.setItem('challengeHighestScore', score.toString());
        }
    }
}

function openSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openStats() {
    updateStatsDisplay();
    const modal = document.getElementById('stats-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeStats() {
    const modal = document.getElementById('stats-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateStatsDisplay() {
    // Challenge stats
    const bestStreakElement = document.getElementById('stats-best-streak');
    const timesPlayedElement = document.getElementById('challenge-times-played-value');
    const highestScoreElement = document.getElementById('challenge-highest-score-value');
    const totalScoreElement = document.getElementById('challenge-total-score-value');
    
    if (bestStreakElement) bestStreakElement.textContent = bestStreak;
    if (timesPlayedElement) timesPlayedElement.textContent = localStorage.getItem('challengeTimesPlayed') || '0';
    if (highestScoreElement) highestScoreElement.textContent = localStorage.getItem('challengeHighestScore') || '0';
    if (totalScoreElement) totalScoreElement.textContent = localStorage.getItem('challengeTotalScore') || '0';
    
    // Daily stats
    const currentStreakElement = document.getElementById('daily-current-streak');
    const gamesPlayedElement = document.getElementById('daily-games-played');
    const successRateElement = document.getElementById('daily-success-rate');
    
    if (currentStreakElement) currentStreakElement.textContent = dailyChallenge.dailyStats.streak;
    if (gamesPlayedElement) gamesPlayedElement.textContent = dailyChallenge.dailyStats.totalPlayed;
    
    const dailySuccessRate = dailyChallenge.dailyStats.totalPlayed > 0 
        ? Math.round((dailyChallenge.dailyStats.totalCorrect / dailyChallenge.dailyStats.totalPlayed) * 100)
        : 0;
    if (successRateElement) successRateElement.textContent = dailySuccessRate + '%';
    
    // Achievements
    updateAchievementsDisplay();
    
    // Passport
    updatePassportDisplay();
}

function updateAchievementsDisplay() {
    const progress = achievementSystem.getProgress();
    const achievementCount = document.getElementById('achievement-count');
    const achievementProgressFill = document.getElementById('achievement-progress-fill');
    
    if (achievementCount) {
        achievementCount.textContent = `${progress.unlocked}/${progress.total} Achievements`;
    }
    if (achievementProgressFill) {
        achievementProgressFill.style.width = progress.percentage + '%';
    }
    
    const achievementsList = document.getElementById('achievements-list');
    if (achievementsList) {
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
}

function updatePassportDisplay() {
    // Get correctly answered countries from localStorage
    const correctlyAnsweredCountries = JSON.parse(localStorage.getItem('correctlyAnsweredCountries') || '[]');
    const countryDetails = JSON.parse(localStorage.getItem('countryDetails') || '{}');
    
    console.log('Correctly answered countries:', correctlyAnsweredCountries);
    console.log('Country details:', countryDetails);
    
    const countriesUnlockedElement = document.getElementById('countries-unlocked');
    if (countriesUnlockedElement) {
        countriesUnlockedElement.textContent = `${correctlyAnsweredCountries.length} Countries Discovered`;
    }
    
    // Update continent progress
    const continentProgress = document.getElementById('continent-progress');
    if (continentProgress) {
        continentProgress.innerHTML = '';
        
        const continents = ['Africa', 'Asia', 'Europe', 'Americas', 'Oceania'];
        
        continents.forEach(continent => {
            const continentCountries = Object.values(countries).filter(c => c.region === continent);
            
            // Count correctly answered countries in this continent
            const unlockedInContinent = correctlyAnsweredCountries.filter(countryCode => {
                const countryData = countryDetails[countryCode];
                return countryData && countryData.region === continent;
            }).length;
            
            const percentage = Math.round((unlockedInContinent / continentCountries.length) * 100);
            
            const progressDiv = document.createElement('div');
            progressDiv.className = 'continent-progress-item';
            progressDiv.innerHTML = `
                <div class="continent-progress-name">
                    <span>${continent}</span>
                </div>
                <div class="continent-progress-bar">
                    <div class="continent-progress-fill" style="width: ${percentage}%"></div>
                </div>
                <span>${unlockedInContinent}/${continentCountries.length}</span>
            `;
            
            continentProgress.appendChild(progressDiv);
        });
    }
    
    // Update passport grid - show correctly answered countries with flags and names
    const passportGrid = document.getElementById('passport-grid');
    if (passportGrid) {
        passportGrid.innerHTML = '';
        
        // Show correctly answered countries
        correctlyAnsweredCountries.forEach(countryCode => {
            const countryData = countryDetails[countryCode];
            
            if (countryData && countryData.flag && countryData.flag.large) {
                const countryDiv = document.createElement('div');
                countryDiv.className = 'passport-country';
                countryDiv.innerHTML = `
                    <img src="${countryData.flag.large}" alt="${countryData.name}" loading="lazy">
                    <span>${countryData.name}</span>
                `;
                passportGrid.appendChild(countryDiv);
            }
        });
        
        // If no countries in passport yet, show a message
        if (passportGrid.children.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'passport-empty';
            emptyMessage.innerHTML = `
                <div class="passport-empty-content">
                    <span class="passport-empty-icon">🗺️</span>
                    <p>Start playing to discover countries!</p>
                    <p class="passport-empty-hint">Correctly answered flags will appear here</p>
                </div>
            `;
            passportGrid.appendChild(emptyMessage);
        }
    }
}

function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab content
    const tabContent = document.getElementById(tabName + '-stats');
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    // Add active class to selected tab button
    const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (tabButton) {
        tabButton.classList.add('active');
    }
}

async function shareDailyResult() {
    const result = dailyChallenge.dailyStats.results[dailyChallenge.today];
    if (!result) return;
    
    const shareText = dailyChallenge.getShareText(result);
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Flagtriv Daily Challenge',
                text: shareText
            });
        } catch (error) {
            // User cancelled or share failed, fallback to clipboard
            copyToClipboard(shareText);
        }
    } else {
        copyToClipboard(shareText);
    }
}

function shareEndlessResult() {
    const shareText = `🌍 Flagtriv Challenge Mode\n🎯 Score: ${score}/${totalQuestions}\n🔥 Best Streak: ${bestStreak}\n\nPlay at flagtriv.com`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Flagtriv Challenge Results',
            text: shareText
        }).catch(() => {
            copyToClipboard(shareText);
        });
    } else {
        copyToClipboard(shareText);
    }
}

function shareStats() {
    const challengeHighest = localStorage.getItem('challengeHighestScore') || '0';
    const dailyStreak = dailyChallenge.dailyStats.streak;
    const correctlyAnsweredCountries = JSON.parse(localStorage.getItem('correctlyAnsweredCountries') || '[]');
    const countriesUnlocked = correctlyAnsweredCountries.length;
    
    const shareText = `🌍 My Flagtriv Stats\n🏆 Highest Score: ${challengeHighest}\n🔥 Daily Streak: ${dailyStreak}\n🗺️ Countries Unlocked: ${countriesUnlocked}\n\nPlay at flagtriv.com`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Flagtriv Stats',
            text: shareText
        }).catch(() => {
            copyToClipboard(shareText);
        });
    } else {
        copyToClipboard(shareText);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('📋 Copied to clipboard!');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('📋 Copied to clipboard!');
    } catch (err) {
        showToast('❌ Unable to copy');
    }
    
    document.body.removeChild(textArea);
}

function showToast(message) {
    const toast = document.getElementById('resultsToast');
    if (toast) {
        toast.textContent = message;
        toast.className = 'show';
        
        setTimeout(() => {
            toast.className = toast.className.replace('show', '');
        }, 3000);
    }
}