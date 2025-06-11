document.addEventListener("DOMContentLoaded", function () {
    let countries = [];
    let currentCountry = null;
    let usedCountries = [];
    let score = 0;
    let total = 0;
    let gameState = "playing";
    let challengeStats = {
        timesPlayed: 0,
        highestScore: 0,
        totalScore: 0
    };
    let zenStats = {
        sessionsPlayed: 0,
        highestStreak: 0,
        totalFlags: 0,
        totalCorrect: 0
    };
    let lives = 3;
    let isChallengeMode = false;
    let isZenMode = false;
    let isDailyMode = false;
    let isMultiplayerMode = false;
    let dailyAttempts = 0;
    let currentGameStreak = 0; // Track streak for current game session
    let maxGameStreak = 0; // Track the highest streak achieved in this game session
    let bestStreak = parseInt(localStorage.getItem('bestStreak') || '0');
    let dailyStartTime = null; // Track when daily challenge started
    
    // Initialize game systems
    let dailyChallenge;
    let achievementSystem;
    let soundEffects;
    let continentFilter;
    let flagFacts;
    let multiplayerGame;

    // DOM elements
    const flagImg = document.getElementById('flag');
    const message = document.getElementById('message');
    const facts = document.getElementById('facts');
    const flagTrivia = document.getElementById('flag-trivia');
    const nextBtn = document.getElementById('next');
    const headingText = document.getElementById('heading');
    const subHeadingText = document.getElementById('subHeading');
    const statsBtn = document.getElementById('stats-btn');
    const statsModal = document.getElementById('stats-modal');
    const closeBtn = document.querySelector('.close-btn');
    const challengeModeBtn = document.getElementById('challenge-mode-btn');
    const zenModeBtn = document.getElementById('zen-mode-btn');
    const dailyChallengeBtn = document.getElementById('daily-challenge-btn');
    const modeSelection = document.getElementById('mode-selection');
    const gameContainer = document.getElementById('game-container');
    const endlessGameOverScreen = document.getElementById('endless-game-over-screen');
    const dailyCompleteScreen = document.getElementById('daily-complete-screen');
    const playEndlessFromGameOver = document.getElementById('play-endless-from-gameover');
    const tryAgainBtn = document.getElementById('try-again');
    const seeStatsFromGameOver = document.getElementById('see-stats-from-gameover');

    // New consolidated UI elements
    const topBar = document.getElementById('top-bar');
    const streakDisplayTop = document.getElementById('streak-display-top');
    const livesCount = document.getElementById('lives-count');
    const scoreDisplay = document.getElementById('score-display');

    // Settings modal elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsClose = document.querySelector('.settings-close');
    const soundToggle = document.getElementById('sound-toggle-setting');
    const soundIcon = document.getElementById('sound-icon-setting');

    // Continent filter elements
    const continentFilterBtn = document.getElementById('continent-filter-btn');
    const continentFilterModal = document.getElementById('continent-filter-modal');
    const continentFilterClose = document.querySelector('.continent-filter-close');
    const applyContinentFilter = document.getElementById('apply-continent-filter');

    // Load stats from localStorage
    const savedChallengeStats = JSON.parse(localStorage.getItem('challengeStats'));
    if (savedChallengeStats) {
        challengeStats = savedChallengeStats;
    }

    const savedZenStats = JSON.parse(localStorage.getItem('zenStats'));
    if (savedZenStats) {
        zenStats = savedZenStats;
    }

    // Fetch countries data and initialize game
    fetch('countries.json')
        .then(response => response.json())
        .then(data => {
            countries = data;
            initializeGame();
        })
        .catch(error => console.error('Error loading countries data:', error));

    function initializeGame() {
        // Initialize game systems
        dailyChallenge = new DailyChallenge(countries);
        achievementSystem = new AchievementSystem();
        soundEffects = new SoundEffects();
        continentFilter = new ContinentFilter();
        flagFacts = new FlagFacts();
        multiplayerGame = new MultiplayerGame(countries, continentFilter, flagFacts, soundEffects);

        // Update UI
        updateTopBar();
        updateMainMenuStats();
        updateSoundToggle();
        updateContinentFilterButton();

        // Check if daily challenge is available
        updateDailyChallengeButton();

        // Attach event listeners
        attachOptionListeners(); // Separate function for option listeners
        nextBtn.addEventListener('click', nextCountry);
        challengeModeBtn.addEventListener('click', startChallengeMode);
        zenModeBtn.addEventListener('click', startZenMode);
        dailyChallengeBtn.addEventListener('click', startDailyChallenge);
        playEndlessFromGameOver.addEventListener('click', startChallengeMode);
        tryAgainBtn.addEventListener('click', startChallengeMode);
        seeStatsFromGameOver.addEventListener('click', showStatsModal);
        settingsBtn.addEventListener('click', showSettingsModal);
        settingsClose.addEventListener('click', hideSettingsModal);
        soundToggle.addEventListener('click', toggleSound);
        continentFilterBtn.addEventListener('click', showContinentFilterModal);
        continentFilterClose.addEventListener('click', hideContinentFilterModal);
        applyContinentFilter.addEventListener('click', applyContinentFilterSelection);

        // Stats modal tabs
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
        });

        // Continent filter options
        document.querySelectorAll('.continent-option').forEach(button => {
            button.addEventListener('click', toggleContinentOption);
        });

        // Daily challenge specific buttons
        document.getElementById('share-daily-result')?.addEventListener('click', shareDailyResult);
        document.getElementById('play-endless-from-daily')?.addEventListener('click', () => {
            dailyCompleteScreen.style.display = 'none';
            startChallengeMode();
        });
        document.getElementById('share-endless-result')?.addEventListener('click', shareEndlessResult);
    }

    function attachOptionListeners() {
        // Query for current option elements in the DOM
        const currentOptions = document.querySelectorAll('.option');
        
        currentOptions.forEach(button => {
            // Clone the button to remove all event listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Attach the event listener to the new button
            newButton.addEventListener('click', checkAnswer);
        });
    }

    function updateDailyChallengeButton() {
        if (dailyChallenge.hasPlayedToday()) {
            dailyChallengeBtn.textContent = '📅 View Today\'s Flag';
            dailyChallengeBtn.disabled = false;
        } else {
            dailyChallengeBtn.textContent = '📅 Daily Challenge';
            dailyChallengeBtn.disabled = false;
        }
    }

    function updateMainMenuStats() {
        const dailyStreakInfo = document.getElementById('daily-streak-info');
        const dailyStreakCount = document.getElementById('daily-streak-count');
        
        if (dailyChallenge.dailyStats.streak > 0) {
            dailyStreakCount.textContent = dailyChallenge.dailyStats.streak;
            dailyStreakInfo.style.display = 'block';
        }
    }

    function showSettingsModal() {
        updateSettingsModal();
        settingsModal.style.display = 'block';
    }

    function hideSettingsModal() {
        settingsModal.style.display = 'none';
    }

    function updateSettingsModal() {
        updateSoundToggle();
        updateContinentFilterInSettings();
    }

    function updateContinentFilterInSettings() {
        const selectionText = document.getElementById('continent-selection-text');
        // Add null check to prevent TypeError
        if (selectionText) {
            selectionText.textContent = continentFilter.getSelectionText();
        }
    }

    function updateContinentFilterButton() {
        continentFilterBtn.textContent = continentFilter.getSelectionText().split(' ')[0]; // Just the emoji
        continentFilterBtn.title = continentFilter.getSelectionText();
    }

    function showContinentFilterModal() {
        updateContinentFilterModal();
        continentFilterModal.style.display = 'block';
    }

    function hideContinentFilterModal() {
        continentFilterModal.style.display = 'none';
    }

    function updateContinentFilterModal() {
        const options = document.querySelectorAll('.continent-option');
        const selectionSummary = document.getElementById('selection-summary');
        
        options.forEach(option => {
            const continentId = option.dataset.continent;
            const isSelected = continentFilter.selectedContinents.includes(continentId);
            
            option.classList.toggle('active', isSelected);
        });
        
        selectionSummary.textContent = continentFilter.getSelectionText();
    }

    function toggleContinentOption(event) {
        const option = event.currentTarget;
        const continentId = option.dataset.continent;
        
        continentFilter.toggleContinent(continentId);
        updateContinentFilterModal();
    }

    function applyContinentFilterSelection() {
        updateContinentFilterButton();
        updateContinentFilterInSettings();
        hideContinentFilterModal();
        
        // If in a game mode, restart with new filter
        if (isChallengeMode) {
            startChallengeMode();
        } else if (isZenMode) {
            startZenMode();
        }
    }

    function startDailyChallenge() {
        if (dailyChallenge.hasPlayedToday()) {
            // Show today's flag and leaderboard
            showDailyResults();
            return;
        }

        isDailyMode = true;
        isChallengeMode = false;
        isZenMode = false;
        isMultiplayerMode = false;
        dailyAttempts = 0;
        lives = 2; // Two lives for daily challenge
        score = 0;
        total = 0;
        gameState = "playing";
        currentGameStreak = 0; // Reset game streak
        maxGameStreak = 0; // Reset max game streak
        dailyStartTime = Date.now(); // Start timer
        
        modeSelection.style.display = 'none';
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        
        // Set today's country
        currentCountry = dailyChallenge.getTodaysCountry();
        
        // Only display country and enable UI if we have a valid country
        if (currentCountry) {
            displayCountry();
            // Re-attach option listeners for daily mode
            attachOptionListeners();
        } else {
            console.error('Failed to get daily country');
            // Return to main menu if no valid country
            returnToMainMenu();
            return;
        }
        
        headingText.textContent = "Daily Challenge";
        subHeadingText.textContent = "One flag per day - you have 2 lives!";
        
        updateTopBar();
        startDailyTimer();
    }

    function startDailyTimer() {
        const timerInterval = setInterval(() => {
            if (!isDailyMode || gameState !== "playing") {
                clearInterval(timerInterval);
                return;
            }
            
            const elapsed = Math.floor((Date.now() - dailyStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Update timer in top bar
            streakDisplayTop.textContent = `⏱️ ${timeStr}`;
        }, 1000);
    }

    function showDailyResults() {
        // Show today's flag and facts with leaderboard option
        modeSelection.style.display = 'none';
        dailyCompleteScreen.style.display = 'block';
        
        const todaysCountry = dailyChallenge.getTodaysCountry();
        document.getElementById('daily-result-heading').textContent = 'Today\'s Flag';
        document.getElementById('daily-result-flag').src = todaysCountry.flag.large;
        document.getElementById('daily-result-country').textContent = todaysCountry.name;
        
        // Show facts
        document.getElementById('daily-attempts-display').innerHTML = `
            <p><strong>Capital:</strong> ${todaysCountry.capital}</p>
            <p><strong>Location:</strong> ${todaysCountry.subregion}</p>
        `;
        
        // Hide streak display and show leaderboard button
        document.getElementById('daily-streak-display').style.display = 'none';
        document.getElementById('daily-global-stat').style.display = 'none';
        document.getElementById('daily-next-challenge').style.display = 'none';
        
        // Update buttons
        document.getElementById('share-daily-result').textContent = 'View Leaderboard';
        document.getElementById('share-daily-result').onclick = showDailyLeaderboard;
    }

    function showDailyLeaderboard() {
        // For now, show a placeholder leaderboard
        alert('Daily Leaderboard\n\n🥇 Player1 (USA) - 0:15\n🥈 Player2 (UK) - 0:23\n🥉 Player3 (CAN) - 0:31\n\nYour best: Already completed today!');
    }

    function startChallengeMode() {
        modeSelection.style.display = 'none';
        endlessGameOverScreen.style.display = 'none';
        dailyCompleteScreen.style.display = 'none';
        
        isDailyMode = false;
        isChallengeMode = true;
        isZenMode = false;
        isMultiplayerMode = false;
        lives = 3;
        score = 0;
        total = 0;
        gameState = "playing";
        usedCountries = [];
        currentGameStreak = 0; // Reset game streak
        maxGameStreak = 0; // Reset max game streak
        
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        
        challengeStats.timesPlayed++;
        updateTopBar();
        
        headingText.textContent = "Challenge Mode";
        subHeadingText.textContent = "Test your geography knowledge!";
        
        // Re-attach option listeners
        attachOptionListeners();
        nextCountry();
    }

    function startZenMode() {
        modeSelection.style.display = 'none';
        endlessGameOverScreen.style.display = 'none';
        dailyCompleteScreen.style.display = 'none';
        
        isDailyMode = false;
        isChallengeMode = false;
        isZenMode = true;
        isMultiplayerMode = false;
        lives = Infinity; // No lives in zen mode
        score = 0;
        total = 0;
        gameState = "playing";
        usedCountries = [];
        currentGameStreak = 0; // Reset game streak
        maxGameStreak = 0; // Reset max game streak
        
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        
        zenStats.sessionsPlayed++;
        updateTopBar();
        
        headingText.textContent = "Zen Mode";
        subHeadingText.textContent = "Relax and explore flags at your own pace";
        
        // Re-attach option listeners
        attachOptionListeners();
        nextCountry();
    }

    function updateTopBar() {
        // Update streak - use current game streak
        if (isDailyMode && dailyStartTime) {
            // Timer is handled by startDailyTimer()
        } else {
            const streakEmoji = getStreakEmoji(currentGameStreak);
            streakDisplayTop.textContent = `${streakEmoji} ${currentGameStreak} Streak`.trim();
        }
        
        // Update lives (hide in zen mode)
        if (isZenMode) {
            document.getElementById('lives-display').style.display = 'none';
        } else {
            document.getElementById('lives-display').style.display = 'flex';
            livesCount.textContent = lives;
        }
        
        // Update score
        scoreDisplay.textContent = `Score: ${score}/${total}`;
    }

    function getStreakEmoji(streak) {
        if (streak >= 10) return '🔥🔥🔥';
        if (streak >= 5) return '🔥🔥';
        if (streak >= 3) return '🔥';
        return '';
    }

    function toggleSound() {
        const enabled = soundEffects.toggle();
        updateSoundToggle();
    }

    function updateSoundToggle() {
        soundIcon.textContent = soundEffects.enabled ? '🔊' : '🔇';
    }

    function nextCountry() {
        if (isDailyMode) return; // Daily mode only has one country
        
        nextBtn.disabled = false;
        saveGameState();
        fetchNewCountry();
        
        // Only reset UI if we successfully got a new country
        if (currentCountry) {
            resetQuestionUI();
        }
    }

    function fetchNewCountry() {
        const filteredCountries = continentFilter.filterCountries(countries);
        const countryCodes = Object.keys(filteredCountries);
        
        if (countryCodes.length === 0) {
            console.error('No countries available for selected continents');
            currentCountry = null;
            return;
        }
        
        let countryCode;
        do {
            const randomIndex = Math.floor(Math.random() * countryCodes.length);
            countryCode = countryCodes[randomIndex];
        } while (usedCountries.includes(countryCode) && usedCountries.length < countryCodes.length);
        
        usedCountries.push(countryCode);
        currentCountry = filteredCountries[countryCode];
        
        if (currentCountry) {
            displayCountry();
        } else {
            console.error('Failed to set current country');
        }
    }

    function displayCountry() {
        if (!currentCountry || !currentCountry.flag || !currentCountry.flag.large) {
            console.error('Invalid country data:', currentCountry);
            currentCountry = null;
            return;
        }

        flagImg.src = currentCountry.flag.large;
        updateOptions();
        localStorage.setItem('currentFlag', JSON.stringify(currentCountry));
    }

    function resetQuestionUI() {
        // Get current option elements
        const currentOptions = document.querySelectorAll('.option');
        
        // Only enable options if we have a valid current country
        if (currentCountry) {
            currentOptions.forEach(button => {
                button.disabled = false;
                button.classList.remove('disabled', 'correct-answer', 'wrong-answer');
            });
        } else {
            // Disable options if no valid country
            currentOptions.forEach(button => {
                button.disabled = true;
                button.classList.add('disabled');
            });
        }

        message.textContent = "";
        facts.hidden = true;
        flagTrivia.hidden = true;
        nextBtn.hidden = true;
        headingText.hidden = false;
        subHeadingText.hidden = false;
    }

    function checkAnswer(event) {
        // Safety check: ensure we have a valid current country
        if (!currentCountry || !currentCountry.name) {
            console.error('No valid current country available');
            message.textContent = "Error: No country loaded. Please try again.";
            return;
        }

        const selectedCountryName = event.target.textContent;
        const isCorrect = selectedCountryName === currentCountry.name;
        
        // Get current option elements
        const currentOptions = document.querySelectorAll('.option');
        currentOptions.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
        });

        localStorage.removeItem('currentFlag');

        if (isCorrect) {
            handleCorrectAnswer(event.target);
        } else {
            handleWrongAnswer(event.target);
        }

        // Show correct answer
        currentOptions.forEach(button => {
            if (button.textContent === currentCountry.name) {
                button.classList.add('correct-answer');
            }
        });

        total++;
        if (isDailyMode) {
            dailyAttempts++;
        }
        
        // Update zen stats
        if (isZenMode) {
            zenStats.totalFlags++;
        }
        
        updateTopBar();
        showFacts(currentCountry);
        headingText.style.display = 'none';
        subHeadingText.style.display = 'none';
        
        if (!isDailyMode && !isMultiplayerMode) {
            nextBtn.hidden = false;
        }

        // Handle end of daily challenge
        if (isDailyMode) {
            setTimeout(() => {
                completeDailyChallenge(isCorrect);
            }, 2000);
        }

        saveGameState();
    }

    function handleCorrectAnswer(button) {
        message.textContent = "🎉 Correct! Well done!";
        score++;
        currentGameStreak++; // Increment game streak
        
        // Update max streak for this game session
        if (currentGameStreak > maxGameStreak) {
            maxGameStreak = currentGameStreak;
        }
        
        button.classList.add('correct-answer');
        
        // Update best streak
        if (currentGameStreak > bestStreak) {
            bestStreak = currentGameStreak;
            localStorage.setItem('bestStreak', bestStreak.toString());
        }
        
        // Sound effect
        soundEffects.playCorrect();
        
        if (isChallengeMode || isMultiplayerMode) {
            updateTopBar();
            
            // Check for streak milestones
            if (isStreakMilestone(currentGameStreak)) {
                AnimationEffects.showStreakConfetti();
                soundEffects.playStreak();
            } else {
                AnimationEffects.showConfetti();
            }
            
            // Unlock country and check achievements (only in single player modes)
            if (!isMultiplayerMode) {
                achievementSystem.unlockCountry(currentCountry.alpha2Code, currentCountry);
                const newAchievements = achievementSystem.checkAchievements();
                newAchievements.forEach(achievement => {
                    AnimationEffects.showAchievementUnlock(achievement);
                });
            }
        } else if (isZenMode) {
            // Update zen stats
            zenStats.totalCorrect++;
            if (currentGameStreak > zenStats.highestStreak) {
                zenStats.highestStreak = currentGameStreak;
            }
            
            updateTopBar();
            AnimationEffects.showConfetti();
        } else if (isDailyMode) {
            // Daily mode - just show confetti
            AnimationEffects.showConfetti();
        }
    }

    function handleWrongAnswer(button) {
        message.textContent = "😢 Oops, that's not correct.";
        button.classList.add('wrong-answer');
        
        // Sound effect
        soundEffects.playWrong();
        
        // Reset game streak
        currentGameStreak = 0;
        updateTopBar();
        
        if (!isZenMode && !isMultiplayerMode) {
            loseLife();
        }
    }

    function isStreakMilestone(streak) {
        return streak > 0 && (streak % 3 === 0 || streak % 5 === 0 || streak % 10 === 0);
    }

    function completeDailyChallenge(correct) {
        const timeSpent = Math.floor((Date.now() - dailyStartTime) / 1000);
        dailyChallenge.submitResult(correct, dailyAttempts, timeSpent);
        
        gameContainer.style.display = 'none';
        topBar.style.display = 'none';
        dailyCompleteScreen.style.display = 'block';
        
        // Update daily complete screen
        document.getElementById('daily-result-heading').textContent = correct ? 'Well Done!' : 'Better Luck Tomorrow!';
        document.getElementById('daily-result-flag').src = currentCountry.flag.large;
        document.getElementById('daily-result-country').textContent = currentCountry.name;
        
        // Show facts instead of attempts
        document.getElementById('daily-attempts-display').innerHTML = `
            <p><strong>Capital:</strong> ${currentCountry.capital}</p>
            <p><strong>Location:</strong> ${currentCountry.subregion}</p>
            <p><strong>Your Time:</strong> ${Math.floor(timeSpent / 60)}:${(timeSpent % 60).toString().padStart(2, '0')}</p>
        `;
        
        document.getElementById('daily-streak-display').textContent = `Daily Streak: ${dailyChallenge.dailyStats.streak}`;
        
        // Show fake global stat
        const globalStat = flagFacts.getRandomGlobalStat();
        document.getElementById('daily-global-stat').textContent = globalStat;
        
        // Start countdown timer
        startCountdownTimer();
        
        // Update main menu for tomorrow
        updateDailyChallengeButton();
        
        // Show name input for leaderboard if correct
        if (correct) {
            showNameInputForLeaderboard(timeSpent);
        }
    }

    function showNameInputForLeaderboard(timeSpent) {
        const nameInput = prompt('Great job! Enter your name for the leaderboard (max 20 characters):');
        if (nameInput && nameInput.trim()) {
            const playerName = nameInput.trim().substring(0, 20);
            // Here you would normally save to a real leaderboard
            console.log(`Player ${playerName} completed in ${timeSpent} seconds`);
            
            // Update share button to show leaderboard
            document.getElementById('share-daily-result').textContent = 'View Leaderboard';
            document.getElementById('share-daily-result').onclick = showDailyLeaderboard;
        }
    }

    function startCountdownTimer() {
        const countdownElement = document.getElementById('countdown-timer');
        
        function updateCountdown() {
            countdownElement.textContent = dailyChallenge.getTimeUntilNext();
        }
        
        updateCountdown();
        setInterval(updateCountdown, 60000); // Update every minute
    }

    function loseLife() {
        if (lives > 0) {
            lives--;
            updateTopBar();
            saveGameState();
        }

        if (lives === 0) {
            gameState = "over";
            nextBtn.disabled = true;
            setTimeout(() => {
                if (isChallengeMode) {
                    showChallengeGameOver();
                } else if (isDailyMode) {
                    completeDailyChallenge(false);
                }
            }, 2000);
        }
    }

    function showChallengeGameOver() {
        lives = 0;

        challengeStats.totalScore += score;
        if (score > challengeStats.highestScore) {
            challengeStats.highestScore = score;
        }

        localStorage.setItem('challengeStats', JSON.stringify(challengeStats));

        endlessGameOverScreen.style.display = 'block';
        gameContainer.style.display = 'none';
        topBar.style.display = 'none';

        document.getElementById('endless-score-display').textContent = "Your Score: " + score;
        document.getElementById('endless-highest-score-display').textContent = "Highest Score: " + challengeStats.highestScore;
        document.getElementById('final-streak-display').textContent = `Best Streak This Game: ${maxGameStreak}`;
    }

    function updateOptions() {
        if (!currentCountry) {
            console.error('Cannot update options: no current country');
            return;
        }

        const filteredCountries = continentFilter.filterCountries(countries);
        const allOtherCountryCodes = Object.keys(filteredCountries).filter(code => code !== currentCountry.alpha2Code);
        const incorrectAnswers = [];
        
        while (incorrectAnswers.length < 3 && allOtherCountryCodes.length > 0) {
            const randomIndex = Math.floor(Math.random() * allOtherCountryCodes.length);
            const countryCode = allOtherCountryCodes[randomIndex];
            incorrectAnswers.push(filteredCountries[countryCode].name);
            allOtherCountryCodes.splice(randomIndex, 1);
        }

        const allAnswers = [...incorrectAnswers, currentCountry.name];
        const currentOptions = document.querySelectorAll('.option');
        currentOptions.forEach(button => {
            const randomIndex = Math.floor(Math.random() * allAnswers.length);
            button.textContent = allAnswers[randomIndex];
            allAnswers.splice(randomIndex, 1);
        });
    }

    function showFacts(country) {
        facts.innerHTML = `
            <p class="fact-text"><strong>Capital:</strong> ${country.capital}</p>
            <p class="fact-text"><strong>Location:</strong> ${country.subregion}</p>
        `;
        facts.hidden = false;
    }

    function returnToMainMenu() {
        gameContainer.style.display = 'none';
        topBar.style.display = 'none';
        modeSelection.style.display = 'block';
        currentCountry = null;
    }

    function switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-stats`).classList.add('active');
        
        // Update content based on tab
        if (tabName === 'achievements') {
            updateAchievementsTab();
        } else if (tabName === 'passport') {
            updatePassportTab();
        }
    }

    function updateAchievementsTab() {
        const progress = achievementSystem.getProgress();
        document.getElementById('achievement-count').textContent = `${progress.unlocked}/${progress.total} Achievements`;
        document.getElementById('achievement-progress-fill').style.width = `${progress.percentage}%`;
        
        const achievementsList = document.getElementById('achievements-list');
        achievementsList.innerHTML = '';
        
        achievementSystem.achievementsList.forEach(achievement => {
            const unlocked = achievementSystem.achievements[achievement.id];
            const div = document.createElement('div');
            div.className = `achievement-item ${unlocked ? 'unlocked' : 'locked'}`;
            div.innerHTML = `
                <span class="achievement-icon">${achievement.icon}</span>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
                ${unlocked ? '<span class="achievement-check">✓</span>' : ''}
            `;
            achievementsList.appendChild(div);
        });
    }

    function updatePassportTab() {
        const unlockedCountries = JSON.parse(localStorage.getItem('unlockedCountries') || '[]');
        document.getElementById('countries-unlocked').textContent = `${unlockedCountries.length} Countries Discovered`;
        
        // Update continent progress
        updateContinentProgress();
        
        const passportGrid = document.getElementById('passport-grid');
        passportGrid.innerHTML = '';
        
        // Show a sample of unlocked countries
        const countryDetails = JSON.parse(localStorage.getItem('countryDetails') || '{}');
        unlockedCountries.slice(0, 20).forEach(countryCode => {
            const country = countryDetails[countryCode];
            if (country) {
                const div = document.createElement('div');
                div.className = 'passport-country';
                div.innerHTML = `
                    <img src="flags/${countryCode.toLowerCase()}.svg" alt="${country.name}" onerror="this.style.display='none'">
                    <span>${country.name}</span>
                `;
                passportGrid.appendChild(div);
            }
        });
    }

    function updateContinentProgress() {
        const continentProgress = document.getElementById('continent-progress');
        const countryDetails = JSON.parse(localStorage.getItem('countryDetails') || '{}');
        const continentCounts = {};
        const continentTotals = {};
        
        // Count countries per continent
        Object.values(countries).forEach(country => {
            const region = country.region;
            continentTotals[region] = (continentTotals[region] || 0) + 1;
        });
        
        Object.values(countryDetails).forEach(country => {
            const region = country.region;
            continentCounts[region] = (continentCounts[region] || 0) + 1;
        });
        
        continentProgress.innerHTML = '';
        
        continentFilter.availableContinents.forEach(continent => {
            const count = continentCounts[continent.id] || 0;
            const total = continentTotals[continent.id] || 1;
            const percentage = Math.round((count / total) * 100);
            
            const div = document.createElement('div');
            div.className = 'continent-progress-item';
            div.innerHTML = `
                <div class="continent-progress-name">
                    <span>${continent.emoji}</span>
                    <span>${continent.name}</span>
                </div>
                <div class="continent-progress-bar">
                    <div class="continent-progress-fill" style="width: ${percentage}%"></div>
                </div>
                <span>${count}/${total}</span>
            `;
            continentProgress.appendChild(div);
        });
    }

    function showStatsModal() {
        updateStats();
        statsModal.style.display = 'block';
    }

    function updateStats() {
        // Challenge stats
        document.getElementById('stats-best-streak').textContent = bestStreak;
        document.getElementById('challenge-times-played-value').textContent = challengeStats.timesPlayed;
        document.getElementById('challenge-highest-score-value').textContent = challengeStats.highestScore;
        document.getElementById('challenge-total-score-value').textContent = challengeStats.totalScore;
        
        // Zen stats
        document.getElementById('zen-sessions-played').textContent = zenStats.sessionsPlayed;
        document.getElementById('zen-highest-streak').textContent = zenStats.highestStreak;
        document.getElementById('zen-total-flags').textContent = zenStats.totalFlags;
        const zenAccuracy = zenStats.totalFlags > 0 ? Math.round((zenStats.totalCorrect / zenStats.totalFlags) * 100) : 0;
        document.getElementById('zen-accuracy').textContent = `${zenAccuracy}%`;
        
        // Daily stats
        document.getElementById('daily-current-streak').textContent = dailyChallenge.dailyStats.streak;
        document.getElementById('daily-games-played').textContent = dailyChallenge.dailyStats.totalPlayed;
        const successRate = dailyChallenge.dailyStats.totalPlayed > 0 
            ? Math.round((dailyChallenge.dailyStats.totalCorrect / dailyChallenge.dailyStats.totalPlayed) * 100)
            : 0;
        document.getElementById('daily-success-rate').textContent = `${successRate}%`;
    }

    function shareDailyResult() {
        const result = dailyChallenge.dailyStats.results[dailyChallenge.today];
        if (result) {
            const shareText = dailyChallenge.getShareText(result);
            shareToClipboard(shareText);
        }
    }

    function shareEndlessResult() {
        const mode = isChallengeMode ? 'Challenge Mode' : 'Zen Mode';
        const shareText = `🌍 Flagtriv ${mode}\nScore: ${score}/${total}\nBest Streak: ${maxGameStreak}\nflagtriv.com`;
        shareToClipboard(shareText);
    }

    function shareScore() {
        const mode = isChallengeMode ? 'Challenge' : isZenMode ? 'Zen' : 'Daily';
        const shareText = `🌍 Flagtriv ${mode}: ${score}/${total}\nPlay: flagtriv.com`;
        shareToClipboard(shareText);
    }

    function shareToClipboard(text) {
        if (navigator.share) {
            navigator.share({
                title: 'Check out my Flagtriv score!',
                text: text,
                url: document.URL
            }).then(() => {
                console.log('Thanks for sharing!');
            }).catch(console.error);
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    showCopiedToast();
                }
            } catch (err) {
                console.error('Unable to copy', err);
            }
            document.body.removeChild(textArea);
        }
    }

    function showCopiedToast() {
        const resultsToast = document.getElementById("resultsToast");
        resultsToast.textContent = "🔥 Copied! Now challenge a friend.";
        resultsToast.className = "show";
        setTimeout(() => {
            resultsToast.className = resultsToast.className.replace("show", "");
        }, 3000);
    }

    function saveGameState() {
        const gameStateData = {
            gameState: gameState,
            score: score,
            total: total,
            lives: lives,
            usedCountries: usedCountries,
            currentCountry: currentCountry,
            challengeStats: challengeStats,
            zenStats: zenStats,
            isChallengeMode: isChallengeMode,
            isZenMode: isZenMode,
            isDailyMode: isDailyMode,
            isMultiplayerMode: isMultiplayerMode,
            currentGameStreak: currentGameStreak,
            maxGameStreak: maxGameStreak
        };
        localStorage.setItem('countryGame', JSON.stringify(gameStateData));
        
        // Save zen stats separately
        localStorage.setItem('zenStats', JSON.stringify(zenStats));
        localStorage.setItem('challengeStats', JSON.stringify(challengeStats));
    }

    // Event listeners
    closeBtn.addEventListener('click', () => {
        statsModal.style.display = 'none';
    });

    statsBtn.addEventListener('click', showStatsModal);
    document.getElementById('share-button').addEventListener('click', shareScore);

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === statsModal) {
            statsModal.style.display = 'none';
        }
        if (event.target === continentFilterModal) {
            hideContinentFilterModal();
        }
        if (event.target === settingsModal) {
            hideSettingsModal();
        }
    });
});