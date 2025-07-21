// Global variables
let countries = {};
let currentCountry = null;
let options = [];
let score = 0;
let streak = 0;
let bestStreak = parseInt(localStorage.getItem('bestStreak')) || 0;
let lives = 3;
let gameMode = 'challenge'; // 'daily' or 'challenge' or 'multiplayer'
let usedCountries = [];
let totalXP = parseInt(localStorage.getItem('totalXP')) || 0;
let isMultiplayerMode = false; // Global flag for multiplayer mode

// Initialize classes
let continentFilter;
let flagFacts;
let dailyChallenge;
let achievementSystem;
let soundEffects;
let multiplayerGame;

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
    
    // Show mode selection by default
    showModeSelection();
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
        shareEndlessResult.addEventListener('click', shareEndlessResult);
    }

    if (shareDailyResult) {
        shareDailyResult.addEventListener('click', shareDailyResult);
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
    // Hide all game screens
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('daily-complete-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('endless-game-over-screen').style.display = 'none';
    document.getElementById('multiplayer-lobby').style.display = 'none';
    document.getElementById('multiplayer-results').style.display = 'none';
    
    // Show mode selection
    document.getElementById('mode-selection').style.display = 'flex';
    
    // Reset multiplayer mode flag
    isMultiplayerMode = false;
    
    updateMainMenuStats();
}

function updateMainMenuStats() {
    const dailyStreakInfo = document.getElementById('daily-streak-info');
    const dailyStreakCount = document.getElementById('daily-streak-count');
    
    if (dailyChallenge && dailyStreakInfo && dailyStreakCount) {
        const streak = dailyChallenge.dailyStats.streak || 0;
        if (streak > 0) {
            dailyStreakCount.textContent = streak;
            dailyStreakInfo.style.display = 'block';
        } else {
            dailyStreakInfo.style.display = 'none';
        }
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
    
    // Get today's country and start timing
    currentCountry = dailyChallenge.getTodaysCountry();
    dailyChallenge.startTiming();
    
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
    document.getElementById('heading').textContent = 'Flag Master';
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
    
    // If all countries have been used, reset the used list
    if (availableCountries.length === 0) {
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
    
    // Get 3 random incorrect answers from the same filtered set
    const incorrectAnswers = [];
    const otherCountries = allCountries.filter(country => 
        country.alpha2Code !== currentCountry.alpha2Code
    );
    
    while (incorrectAnswers.length < 3 && otherCountries.length > 0) {
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
    
    // Update option buttons
    const optionButtons = document.querySelectorAll('.option');
    optionButtons.forEach((button, index) => {
        button.textContent = options[index];
        button.onclick = () => selectAnswer(options[index]);
        button.disabled = false;
        button.classList.remove('correct-answer', 'wrong-answer', 'disabled');
    });
}

function selectAnswer(selectedAnswer) {
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
        // Game over
        if (gameMode === 'daily') {
            endDailyChallenge(false);
        } else {
            endChallengeMode();
        }
    } else {
        // Show facts and next button for another attempt
        showFacts();
        const nextButton = document.getElementById('next');
        nextButton.hidden = false;
        nextButton.textContent = gameMode === 'daily' ? 'Try Again' : 'Next Flag';
        
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
    
    // Update countdown every minute
    setInterval(() => {
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
    
    if (playerName.length > 6) {
        alert('Name must be 6 characters or less');
        return;
    }
    
    // Submit to leaderboard
    const attempts = 3 - lives;
    const timeSpent = Math.round(dailyChallenge.getElapsedTime() / 1000);
    
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
                
                entryDiv.innerHTML = `
                    <div class="rank">${rankEmoji}</div>
                    <div class="player-name">${entry.name} ${entry.country !== 'Unknown' ? entry.country : ''}</div>
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

function shareEndlessResult() {
    const shareText = `🌍 I scored ${score} points in Flagtriv Flag Master!\n🔥 Best streak: ${bestStreak}\n\nCan you beat my score? Play at flagtriv.com`;
    
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

function shareDailyResult() {
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
    document.getElementById('countries-unlocked').textContent = `${correctlyAnsweredCountries.size} Countries Discovered`;
    
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
                <p>No countries discovered yet!</p>
                <p class="passport-empty-hint">Play the game to unlock countries and build your passport</p>
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
    
    const shareText = `🌍 My Flagtriv Stats:\n🏆 Level ${level}\n🗺️ ${countriesCount} countries discovered\n🎯 ${achievementsCount} achievements unlocked\n🔥 Best streak: ${bestStreak}\n\nPlay at flagtriv.com`;
    
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

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', loadCountries);