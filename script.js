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
    // Reset daily challenge data for testing
    localStorage.removeItem('dailyStats');
    localStorage.removeItem('dailyUsedCountries');
    
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
    document.getElementById('daily-challenge-btn').addEventListener('click', handleDailyChallengeClick);
    document.getElementById('challenge-mode-btn').addEventListener('click', startChallengeMode);

    // Game controls
    document.getElementById('next').addEventListener('click', nextQuestion);
    document.getElementById('try-again').addEventListener('click', startChallengeMode);
    document.getElementById('play-endless-from-daily').addEventListener('click', startChallengeMode);
    document.getElementById('play-endless-from-gameover').addEventListener('click', startChallengeMode);

    // Home logo button
    document.getElementById('home-logo-btn').addEventListener('click', goHome);

    // Settings
    document.getElementById('settings-btn').addEventListener('click', openSettings);
    document.querySelector('.settings-close').addEventListener('click', closeSettings);
    document.getElementById('continent-filter-btn').addEventListener('click', openContinentFilter);
    document.getElementById('sound-toggle-setting').addEventListener('click', toggleSound);
    document.getElementById('stats-btn').addEventListener('click', openStats);

    // Continent filter
    document.querySelector('.continent-filter-close').addEventListener('click', closeContinentFilter);
    document.getElementById('apply-continent-filter').addEventListener('click', applyContinentFilter);

    // Daily challenge modals
    document.querySelector('.daily-name-close').addEventListener('click', closeDailyNameModal);
    document.getElementById('submit-daily-name').addEventListener('click', submitDailyName);
    document.getElementById('skip-daily-name').addEventListener('click', skipDailyName);
    document.querySelector('.daily-leaderboard-close').addEventListener('click', closeDailyLeaderboard);
    document.getElementById('close-leaderboard').addEventListener('click', closeDailyLeaderboard);
    document.getElementById('copy-leaderboard').addEventListener('click', copyLeaderboard);

    // Stats modal
    document.querySelector('.close-btn').addEventListener('click', closeStats);
    document.getElementById('share-button').addEventListener('click', shareStats);

    // Share buttons
    document.getElementById('share-daily-result').addEventListener('click', shareDailyResult);
    document.getElementById('share-endless-result').addEventListener('click', shareEndlessResult);
    document.getElementById('see-stats-from-gameover').addEventListener('click', openStats);

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
    document.getElementById('continent-selection-text').textContent = selectionText;
    
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
    const selectionText = continentFilter.getSelectionText();
    summary.textContent = selectionText;
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
    document.getElementById('continent-filter-modal').style.display = 'block';
}

function closeContinentFilter() {
    document.getElementById('continent-filter-modal').style.display = 'none';
}

function updateSoundSettingUI() {
    const soundIcon = document.getElementById('sound-icon-setting');
    const soundStatus = document.getElementById('sound-status');
    
    if (soundEffects.enabled) {
        soundIcon.textContent = '🔊';
        soundStatus.textContent = 'On';
    } else {
        soundIcon.textContent = '🔇';
        soundStatus.textContent = 'Off';
    }
}

function toggleSound() {
    const enabled = soundEffects.toggle();
    updateSoundSettingUI();
}

function updateDailyStreakDisplay() {
    const dailyStreakInfo = document.getElementById('daily-streak-info');
    const dailyStreakCount = document.getElementById('daily-streak-count');
    
    if (dailyChallenge.dailyStats.streak > 0) {
        dailyStreakInfo.style.display = 'block';
        dailyStreakCount.textContent = dailyChallenge.dailyStats.streak;
    } else {
        dailyStreakInfo.style.display = 'none';
    }
}

function checkDailyStatus() {
    const dailyBtn = document.getElementById('daily-challenge-btn');
    
    if (dailyChallenge.hasPlayedToday()) {
        dailyBtn.textContent = '🏆 View Leaderboard';
        dailyBtn.disabled = false; // Keep button enabled so users can view leaderboard
    } else {
        dailyBtn.textContent = 'Daily Streak';
        dailyBtn.disabled = false;
    }
}

function goHome() {
    // Hide all screens
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('endless-game-over-screen').style.display = 'none';
    document.getElementById('daily-complete-screen').style.display = 'none';
    document.getElementById('multiplayer-lobby').style.display = 'none';
    document.getElementById('multiplayer-results').style.display = 'none';
    
    // Show mode selection
    document.getElementById('mode-selection').style.display = 'flex';
    
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
    document.getElementById('message').textContent = '';
    document.getElementById('facts').hidden = true;
    document.getElementById('flag-trivia').hidden = true;
    document.getElementById('next').hidden = true;
    
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
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('top-bar').style.display = 'flex';
    
    // Update UI for daily challenge
    document.getElementById('heading').textContent = 'Daily Challenge';
    document.getElementById('subHeading').textContent = 'One flag, two chances. Can you guess it?';
    
    // Get today's flag
    currentFlag = dailyChallenge.getTodaysCountry();
    gameStartTime = Date.now();
    questionStartTime = Date.now();
    
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
        document.getElementById('streak-display-top').textContent = `⏱️ ${timeString}`;
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
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('endless-game-over-screen').style.display = 'none';
    document.getElementById('daily-complete-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('top-bar').style.display = 'flex';
    
    // Update UI for challenge mode
    document.getElementById('heading').textContent = 'Challenge Mode';
    document.getElementById('subHeading').textContent = 'How many can you get right?';
    
    gameStartTime = Date.now();
    nextQuestion();
}

function nextQuestion() {
    if (isMultiplayerMode) return; // Don't interfere with multiplayer
    
    // Reset UI
    document.getElementById('message').textContent = '';
    document.getElementById('facts').hidden = true;
    document.getElementById('flag-trivia').hidden = true;
    document.getElementById('next').hidden = true;
    
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
    
    document.getElementById('flag').src = currentFlag.flag.large;
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
    
    // Show confetti for streaks
    if (streak >= 5) {
        AnimationEffects.showStreakConfetti();
        soundEffects.playStreak();
    } else {
        AnimationEffects.showConfetti();
    }
    
    if (gameMode === 'daily') {
        // Stop the timer
        stopDailyTimer();
        
        document.getElementById('message').textContent = "🎉 Correct! Well done!";
        setTimeout(() => {
            completeDailyChallenge(true, 3 - lives, timeSpent);
        }, 2000);
    } else {
        document.getElementById('message').textContent = "🎉 Correct!";
        setTimeout(() => {
            document.getElementById('next').hidden = false;
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
            document.getElementById('message').textContent = "❌ Game Over! The correct answer was " + currentFlag.name;
            setTimeout(() => {
                completeDailyChallenge(false, 2, timeSpent);
            }, 3000);
        } else {
            // Don't show correct answer yet - they still have attempts left
            document.getElementById('message').textContent = `❌ Wrong! You have ${lives} chance${lives === 1 ? '' : 's'} left.`;
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
            document.getElementById('message').textContent = "❌ Game Over! The correct answer was " + currentFlag.name;
            setTimeout(() => {
                endChallengeMode();
            }, 3000);
        } else {
            document.getElementById('message').textContent = `❌ Wrong! You have ${lives} life${lives === 1 ? '' : 'ves'} left.`;
            setTimeout(() => {
                document.getElementById('next').hidden = false;
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
    facts.innerHTML = `
        <p class="fact-text"><strong>Capital:</strong> ${currentFlag.capital}</p>
        <p class="fact-text"><strong>Region:</strong> ${currentFlag.subregion}</p>
    `;
    facts.hidden = false;
    
    // Show flag trivia (removed as requested)
    document.getElementById('flag-trivia').hidden = true;
}

function updateTopBar() {
    if (gameMode === 'daily') {
        // Timer is handled by startDailyTimer function
        document.getElementById('lives-count').textContent = lives;
        document.getElementById('score-display').textContent = `Attempts: ${3 - lives}/2`;
    } else if (gameMode === 'challenge') {
        document.getElementById('streak-display-top').textContent = `${streak} Streak`;
        document.getElementById('lives-count').textContent = lives;
        document.getElementById('score-display').textContent = `Score: ${score}/${totalQuestions}`;
    }
    
    // Show lives display for both modes
    document.getElementById('lives-display').style.display = 'flex';
}

async function completeDailyChallenge(success, attempts, timeSpent) {
    // Submit result to daily challenge
    await dailyChallenge.submitResult(success, attempts, timeSpent);
    
    // Hide game UI
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('top-bar').style.display = 'none';
    
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
    document.getElementById('daily-name-modal').style.display = 'block';
    
    // Store the completion data for later submission
    window.dailyCompletionData = { attempts, timeSpent };
}

function closeDailyNameModal() {
    document.getElementById('daily-name-modal').style.display = 'none';
}

async function submitDailyName() {
    const playerName = document.getElementById('daily-player-name').value.trim();
    
    if (!playerName) {
        alert('Please enter your name');
        return;
    }
    
    if (playerName.length > 20) {
        alert('Name must be 20 characters or less');
        return;
    }
    
    const { attempts, timeSpent } = window.dailyCompletionData;
    
    // Submit to global leaderboard
    const result = await dailyChallenge.submitToLeaderboard(playerName, timeSpent, attempts);
    
    closeDailyNameModal();
    showDailyComplete(attempts, timeSpent, result.global);
}

function skipDailyName() {
    const { attempts, timeSpent } = window.dailyCompletionData;
    closeDailyNameModal();
    showDailyComplete(attempts, timeSpent, false);
}

function showDailyComplete(attempts, timeSpent, submittedToGlobal) {
    document.getElementById('daily-complete-screen').style.display = 'block';
    
    // Update result display
    document.getElementById('daily-result-heading').textContent = 'Well Done!';
    document.getElementById('daily-result-flag').src = currentFlag.flag.large;
    document.getElementById('daily-result-country').textContent = currentFlag.name;
    document.getElementById('daily-attempts-display').textContent = `Solved in ${attempts} attempt${attempts === 1 ? '' : 's'}`;
    document.getElementById('daily-streak-display').textContent = `🔥 Daily Streak: ${dailyChallenge.dailyStats.streak}`;
    
    // Show submission status instead of fake global stat
    const globalStatElement = document.getElementById('daily-global-stat');
    if (submittedToGlobal) {
        globalStatElement.textContent = '🌍 Score submitted to global leaderboard!';
    } else {
        globalStatElement.textContent = '📱 Score saved locally';
    }
    
    // Update countdown
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

function showDailyGameOver() {
    document.getElementById('game-over-screen').style.display = 'block';
    document.getElementById('flagem-logo-text').textContent = `The answer was ${currentFlag.name}`;
}

function updateCountdown() {
    const timeUntilNext = dailyChallenge.getTimeUntilNext();
    document.getElementById('countdown-timer').textContent = timeUntilNext;
}

function endChallengeMode() {
    // Hide game UI
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('top-bar').style.display = 'none';
    
    // Show game over screen
    document.getElementById('endless-game-over-screen').style.display = 'block';
    
    // Update displays
    document.getElementById('endless-score-display').textContent = `Final Score: ${score}/${totalQuestions}`;
    
    const highestScore = parseInt(localStorage.getItem('challengeHighestScore') || '0');
    if (score > highestScore) {
        localStorage.setItem('challengeHighestScore', score.toString());
        document.getElementById('endless-highest-score-display').textContent = `🎉 New High Score: ${score}!`;
    } else {
        document.getElementById('endless-highest-score-display').textContent = `Highest Score: ${highestScore}`;
    }
    
    document.getElementById('final-streak-display').textContent = `Best Streak: ${bestStreak}`;
    
    updateStats();
}

async function showDailyLeaderboard() {
    const leaderboardData = await dailyChallenge.getLeaderboard();
    const leaderboardList = document.getElementById('daily-leaderboard-list');
    
    // Update title and description based on scope
    const title = document.getElementById('leaderboard-title');
    const scopeElement = document.getElementById('leaderboard-scope');
    
    if (leaderboardData.isGlobal) {
        title.innerHTML = '🏆 Daily Leaderboard <span class="global-status global">GLOBAL</span>';
        scopeElement.textContent = '🌍 Global leaderboard - compete with players worldwide!';
    } else {
        title.innerHTML = '🏆 Daily Leaderboard <span class="global-status local">LOCAL</span>';
        scopeElement.textContent = '📱 Local leaderboard - global leaderboard unavailable';
    }
    
    // Clear existing entries
    leaderboardList.innerHTML = '';
    
    if (leaderboardData.entries.length === 0) {
        leaderboardList.innerHTML = '<div class="leaderboard-empty">No players yet - be the first! 🚀</div>';
    } else {
        leaderboardData.entries.slice(0, 10).forEach((entry, index) => {
            const rank = index + 1;
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            
            const leaderboardItem = document.createElement('div');
            leaderboardItem.className = 'leaderboard-item';
            
            leaderboardItem.innerHTML = `
                <span class="rank">${rankEmoji}</span>
                <span class="player-name">${entry.name} (${entry.country})</span>
                <span class="player-time">${entry.time}s</span>
            `;
            
            leaderboardList.appendChild(leaderboardItem);
        });
    }
    
    document.getElementById('daily-leaderboard-modal').style.display = 'block';
}

function closeDailyLeaderboard() {
    document.getElementById('daily-leaderboard-modal').style.display = 'none';
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
    document.getElementById('settings-modal').style.display = 'block';
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

function openStats() {
    updateStatsDisplay();
    document.getElementById('stats-modal').style.display = 'block';
}

function closeStats() {
    document.getElementById('stats-modal').style.display = 'none';
}

function updateStatsDisplay() {
    // Challenge stats
    document.getElementById('stats-best-streak').textContent = bestStreak;
    document.getElementById('challenge-times-played-value').textContent = localStorage.getItem('challengeTimesPlayed') || '0';
    document.getElementById('challenge-highest-score-value').textContent = localStorage.getItem('challengeHighestScore') || '0';
    document.getElementById('challenge-total-score-value').textContent = localStorage.getItem('challengeTotalScore') || '0';
    
    // Daily stats
    document.getElementById('daily-current-streak').textContent = dailyChallenge.dailyStats.streak;
    document.getElementById('daily-games-played').textContent = dailyChallenge.dailyStats.totalPlayed;
    
    const dailySuccessRate = dailyChallenge.dailyStats.totalPlayed > 0 
        ? Math.round((dailyChallenge.dailyStats.totalCorrect / dailyChallenge.dailyStats.totalPlayed) * 100)
        : 0;
    document.getElementById('daily-success-rate').textContent = dailySuccessRate + '%';
    
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
    // Get correctly answered countries from localStorage
    const correctlyAnsweredCountries = JSON.parse(localStorage.getItem('correctlyAnsweredCountries') || '[]');
    const countryDetails = JSON.parse(localStorage.getItem('countryDetails') || '{}');
    
    console.log('Correctly answered countries:', correctlyAnsweredCountries);
    console.log('Country details:', countryDetails);
    
    document.getElementById('countries-unlocked').textContent = `${correctlyAnsweredCountries.length} Countries Discovered`;
    
    // Update continent progress
    const continentProgress = document.getElementById('continent-progress');
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
    
    // Update passport grid - show correctly answered countries with flags and names
    const passportGrid = document.getElementById('passport-grid');
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
    document.getElementById(tabName + '-stats').classList.add('active');
    
    // Add active class to selected tab button
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
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
    toast.textContent = message;
    toast.className = 'show';
    
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000);
}