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
    let bestStreak = parseInt(localStorage.getItem('bestStreak') || '0');
    let dailyStartTime = null;
    
    // Initialize game systems
    let dailyChallenge;
    let achievementSystem;
    let soundEffects;
    let continentFilter;
    let flagFacts;
    let multiplayerGame;

    // DOM elements
    const flagImg = document.getElementById('flag');
    const options = document.querySelectorAll('.option');
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

    // Home logo button
    const homeLogoBtn = document.getElementById('home-logo-btn');

    // Daily name modal elements
    const dailyNameModal = document.getElementById('daily-name-modal');
    const dailyNameClose = document.querySelector('.daily-name-close');
    const submitDailyName = document.getElementById('submit-daily-name');
    const skipDailyName = document.getElementById('skip-daily-name');
    const dailyPlayerName = document.getElementById('daily-player-name');

    // Daily leaderboard modal elements
    const dailyLeaderboardModal = document.getElementById('daily-leaderboard-modal');
    const dailyLeaderboardClose = document.querySelector('.daily-leaderboard-close');
    const closeLeaderboard = document.getElementById('close-leaderboard');

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
        options.forEach(button => button.addEventListener('click', checkAnswer));
        nextBtn.addEventListener('click', nextCountry);
        challengeModeBtn.addEventListener('click', startChallengeMode);
        zenModeBtn.addEventListener('click', startZenMode);
        dailyChallengeBtn.addEventListener('click', handleDailyChallengeClick);
        playEndlessFromGameOver.addEventListener('click', startChallengeMode);
        tryAgainBtn.addEventListener('click', startChallengeMode);
        seeStatsFromGameOver.addEventListener('click', showStatsModal);
        settingsBtn.addEventListener('click', showSettingsModal);
        settingsClose.addEventListener('click', hideSettingsModal);
        soundToggle.addEventListener('click', toggleSound);
        continentFilterBtn.addEventListener('click', showContinentFilterModal);
        continentFilterClose.addEventListener('click', hideContinentFilterModal);
        applyContinentFilter.addEventListener('click', applyContinentFilterSelection);
        homeLogoBtn.addEventListener('click', returnToMainMenu);

        // Daily name modal listeners
        dailyNameClose.addEventListener('click', hideDailyNameModal);
        submitDailyName.addEventListener('click', submitDailyNameToLeaderboard);
        skipDailyName.addEventListener('click', skipDailyNameSubmission);

        // Daily leaderboard modal listeners
        dailyLeaderboardClose.addEventListener('click', hideDailyLeaderboardModal);
        closeLeaderboard.addEventListener('click', hideDailyLeaderboardModal);

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

        // Enter key support for daily name input
        dailyPlayerName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitDailyNameToLeaderboard();
            }
        });
    }

    function updateDailyChallengeButton() {
        if (dailyChallenge.hasPlayedToday()) {
            dailyChallengeBtn.textContent = '📊 View Today\'s Challenge';
            dailyChallengeBtn.disabled = false; // Keep it enabled!
            dailyChallengeBtn.style.backgroundColor = '#4CAF50';
            dailyChallengeBtn.style.color = 'white';
        } else {
            dailyChallengeBtn.textContent = '📅 Daily Challenge';
            dailyChallengeBtn.disabled = false;
            dailyChallengeBtn.style.backgroundColor = '#ff6b35';
            dailyChallengeBtn.style.color = 'white';
        }
    }

    function handleDailyChallengeClick() {
        if (dailyChallenge.hasPlayedToday()) {
            // Show today's challenge info and leaderboard
            showTodaysChallengeInfo();
        } else {
            // Start new daily challenge
            startDailyChallenge();
        }
    }

    function showTodaysChallengeInfo() {
        // Get today's country and result
        const todaysCountry = dailyChallenge.getTodaysCountry();
        const result = dailyChallenge.dailyStats.results[dailyChallenge.today];
        
        // Show the daily complete screen with today's info
        dailyCompleteScreen.style.display = 'block';
        
        // Update the screen with today's information
        document.getElementById('daily-result-heading').textContent = result.correct ? 'Today\'s Challenge - Completed!' : 'Today\'s Challenge - Attempted';
        document.getElementById('daily-result-flag').src = todaysCountry.flag.large;
        document.getElementById('daily-result-country').textContent = todaysCountry.name;
        document.getElementById('daily-attempts-display').textContent = `Your attempts: ${result.attempts}/2`;
        document.getElementById('daily-streak-display').textContent = `Daily Streak: ${dailyChallenge.dailyStats.streak}`;
        
        // Hide the fake global stat
        document.getElementById('daily-global-stat').style.display = 'none';
        
        // Add country facts
        const factsContainer = document.createElement('div');
        factsContainer.className = 'daily-country-facts';
        factsContainer.innerHTML = `
            <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 16px; border-radius: 12px; margin: 16px 0; border-left: 4px solid #4CAF50;">
                <h4 style="margin: 0 0 12px 0; color: #333;">🌍 Country Facts</h4>
                <p style="margin: 4px 0;"><strong>Capital:</strong> ${todaysCountry.capital}</p>
                <p style="margin: 4px 0;"><strong>Region:</strong> ${todaysCountry.subregion}</p>
                <p style="margin: 4px 0;"><strong>Population:</strong> ${todaysCountry.population?.toLocaleString() || 'Unknown'}</p>
            </div>
        `;
        
        // Insert facts before buttons
        const existingButtons = dailyCompleteScreen.querySelector('.daily-complete-content');
        const shareButton = document.getElementById('share-daily-result');
        
        // Remove any existing facts
        const existingFacts = existingButtons.querySelector('.daily-country-facts');
        if (existingFacts) {
            existingFacts.remove();
        }
        
        existingButtons.insertBefore(factsContainer, shareButton);
        
        // Add leaderboard button
        let leaderboardBtn = existingButtons.querySelector('.view-leaderboard-btn');
        if (!leaderboardBtn) {
            leaderboardBtn = document.createElement('button');
            leaderboardBtn.textContent = '🏆 View Leaderboard';
            leaderboardBtn.className = 'create-challenge-btn view-leaderboard-btn';
            leaderboardBtn.style.marginTop = '16px';
            leaderboardBtn.onclick = showDailyLeaderboardModal;
            existingButtons.insertBefore(leaderboardBtn, shareButton);
        }
        
        // Start countdown timer
        startCountdownTimer();
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
        if (dailyChallenge.hasPlayedToday()) return;

        isDailyMode = true;
        isChallengeMode = false;
        isZenMode = false;
        isMultiplayerMode = false;
        dailyAttempts = 0;
        lives = 2; // Changed to 2 attempts for daily challenge
        score = 0;
        total = 0;
        gameState = "playing";
        currentGameStreak = 0; // Reset game streak
        dailyStartTime = Date.now(); // Track start time for leaderboard
        
        modeSelection.style.display = 'none';
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        
        // Set today's country
        currentCountry = dailyChallenge.getTodaysCountry();
        
        // Only display country and enable UI if we have a valid country
        if (currentCountry) {
            displayCountry();
        } else {
            console.error('Failed to get daily country');
            // Return to main menu if no valid country
            returnToMainMenu();
            return;
        }
        
        headingText.textContent = "Daily Challenge";
        subHeadingText.textContent = "Two guesses to get it right!";
        
        updateTopBar();
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
        
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        
        challengeStats.timesPlayed++;
        updateTopBar();
        
        headingText.textContent = "Challenge Mode";
        subHeadingText.textContent = "Test your geography knowledge!";
        
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
        
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        
        zenStats.sessionsPlayed++;
        updateTopBar();
        
        headingText.textContent = "Zen Mode";
        subHeadingText.textContent = "Relax and explore flags at your own pace";
        
        nextCountry();
    }

    function updateTopBar() {
        // Update streak - use current game streak
        const streakEmoji = getStreakEmoji(currentGameStreak);
        streakDisplayTop.textContent = `${streakEmoji} ${currentGameStreak} Streak`.trim();
        
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
        // Only enable options if we have a valid current country
        if (currentCountry) {
            options.forEach(button => {
                button.disabled = false;
                button.classList.remove('disabled', 'correct-answer', 'wrong-answer');
            });
        } else {
            // Disable options if no valid country
            options.forEach(button => {
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
        
        options.forEach(button => {
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
        options.forEach(button => {
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
        const timeSpent = Math.floor((Date.now() - dailyStartTime) / 1000); // Time in seconds
        dailyChallenge.submitResult(correct, dailyAttempts, timeSpent);
        
        gameContainer.style.display = 'none';
        topBar.style.display = 'none';
        
        if (correct) {
            // Show name input modal for successful completion
            showDailyNameModal(timeSpent);
        } else {
            // Show completion screen for failed attempt
            showDailyCompleteScreen(correct, timeSpent);
        }
    }

    function showDailyNameModal(timeSpent) {
        dailyNameModal.style.display = 'block';
        dailyPlayerName.focus();
        
        // Store time for later use
        window.dailyCompletionTime = timeSpent;
    }

    function hideDailyNameModal() {
        dailyNameModal.style.display = 'none';
        dailyPlayerName.value = '';
    }

    function submitDailyNameToLeaderboard() {
        const playerName = dailyPlayerName.value.trim();
        if (!playerName) {
            alert('Please enter your name');
            return;
        }

        const timeSpent = window.dailyCompletionTime;
        
        // Get player's country (simplified for demo)
        getUserCountry().then(country => {
            addToLeaderboard(playerName, timeSpent, country);
            hideDailyNameModal();
            showDailyCompleteScreen(true, timeSpent, playerName);
        });
    }

    function skipDailyNameSubmission() {
        const timeSpent = window.dailyCompletionTime;
        hideDailyNameModal();
        showDailyCompleteScreen(true, timeSpent);
    }

    async function getUserCountry() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            return data.country_name || 'Unknown';
        } catch (error) {
            console.error('Failed to get user country:', error);
            return 'Unknown';
        }
    }

    function addToLeaderboard(playerName, timeSpent, country) {
        const today = dailyChallenge.today;
        const leaderboardKey = `dailyLeaderboard_${today}`;
        
        // Get existing leaderboard
        let leaderboard = JSON.parse(localStorage.getItem(leaderboardKey) || '[]');
        
        // Add new entry
        const newEntry = {
            name: playerName,
            time: timeSpent,
            country: country,
            timestamp: Date.now()
        };
        
        leaderboard.push(newEntry);
        
        // Sort by time (fastest first)
        leaderboard.sort((a, b) => a.time - b.time);
        
        // Keep only top 100
        leaderboard = leaderboard.slice(0, 100);
        
        // Save updated leaderboard
        localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
        
        console.log('Added to leaderboard:', newEntry);
        console.log('Updated leaderboard:', leaderboard);
    }

    function showDailyCompleteScreen(correct, timeSpent, playerName = null) {
        dailyCompleteScreen.style.display = 'block';
        
        // Update daily complete screen
        document.getElementById('daily-result-heading').textContent = correct ? 'Well Done!' : 'Better Luck Tomorrow!';
        document.getElementById('daily-result-flag').src = currentCountry.flag.large;
        document.getElementById('daily-result-country').textContent = currentCountry.name;
        document.getElementById('daily-attempts-display').textContent = `Attempts: ${dailyAttempts}/2`;
        document.getElementById('daily-streak-display').textContent = `Daily Streak: ${dailyChallenge.dailyStats.streak}`;
        
        // Remove the fake global stat
        document.getElementById('daily-global-stat').style.display = 'none';
        
        // Add leaderboard button if completed successfully
        if (correct) {
            const existingButtons = dailyCompleteScreen.querySelector('.daily-complete-content');
            let leaderboardBtn = existingButtons.querySelector('.view-leaderboard-btn');
            
            if (!leaderboardBtn) {
                leaderboardBtn = document.createElement('button');
                leaderboardBtn.textContent = '🏆 View Leaderboard';
                leaderboardBtn.className = 'create-challenge-btn view-leaderboard-btn';
                leaderboardBtn.style.marginTop = '16px';
                leaderboardBtn.onclick = showDailyLeaderboardModal;
                
                // Insert before existing buttons
                const shareButton = document.getElementById('share-daily-result');
                existingButtons.insertBefore(leaderboardBtn, shareButton);
            }
        }
        
        // Start countdown timer
        startCountdownTimer();
        
        // Update main menu for tomorrow
        updateDailyChallengeButton();
    }

    function showDailyLeaderboardModal() {
        const today = dailyChallenge.today;
        const leaderboardKey = `dailyLeaderboard_${today}`;
        const leaderboard = JSON.parse(localStorage.getItem(leaderboardKey) || '[]');
        
        // Update leaderboard display
        updateDailyLeaderboardDisplay(leaderboard);
        
        dailyLeaderboardModal.style.display = 'block';
    }

    function hideDailyLeaderboardModal() {
        dailyLeaderboardModal.style.display = 'none';
    }

    function updateDailyLeaderboardDisplay(leaderboard) {
        const leaderboardList = document.getElementById('daily-leaderboard-list');
        leaderboardList.innerHTML = '';
        
        if (leaderboard.length === 0) {
            leaderboardList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No entries yet today. Be the first!</p>';
            return;
        }
        
        leaderboard.forEach((entry, index) => {
            const rank = index + 1;
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            
            const timeStr = formatTime(entry.time);
            
            const leaderboardItem = document.createElement('div');
            leaderboardItem.className = 'leaderboard-item';
            leaderboardItem.innerHTML = `
                <span class="rank">${rankEmoji}</span>
                <span class="player-name">${entry.name} (${entry.country})</span>
                <span class="player-time">${timeStr}</span>
            `;
            
            leaderboardList.appendChild(leaderboardItem);
        });
        
        // Add copy button
        const copyButton = document.createElement('button');
        copyButton.textContent = '📋 Copy Leaderboard';
        copyButton.className = 'create-challenge-btn';
        copyButton.style.marginTop = '16px';
        copyButton.onclick = copyLeaderboardToClipboard;
        
        leaderboardList.appendChild(copyButton);
    }

    function copyLeaderboardToClipboard() {
        const today = dailyChallenge.today;
        const leaderboardKey = `dailyLeaderboard_${today}`;
        const leaderboard = JSON.parse(localStorage.getItem(leaderboardKey) || '[]');
        
        if (leaderboard.length === 0) {
            showToast('No leaderboard data to copy');
            return;
        }
        
        let shareText = `🏆 Flagtriv Daily Leaderboard - ${today}\n\n`;
        
        leaderboard.slice(0, 10).forEach((entry, index) => {
            const rank = index + 1;
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            const timeStr = formatTime(entry.time);
            shareText += `${rankEmoji} ${entry.name} (${entry.country}) - ${timeStr}\n`;
        });
        
        shareText += '\nPlay at flagtriv.com';
        
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('📋 Leaderboard copied to clipboard!');
        }).catch(() => {
            showToast('Failed to copy leaderboard');
        });
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
        document.getElementById('final-streak-display').textContent = `Best Streak This Game: ${currentGameStreak}`;
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
        options.forEach(button => {
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
        endlessGameOverScreen.style.display = 'none';
        dailyCompleteScreen.style.display = 'none';
        dailyNameModal.style.display = 'none';
        dailyLeaderboardModal.style.display = 'none';
        modeSelection.style.display = 'block';
        currentCountry = null;
        
        // Reset game state
        isDailyMode = false;
        isChallengeMode = false;
        isZenMode = false;
        isMultiplayerMode = false;
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
        const shareText = `🌍 Flagtriv ${mode}\nScore: ${score}/${total}\nBest Streak: ${currentGameStreak}\nflagtriv.com`;
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
            // Fallback to clipboard
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
        showToast("🔥 Copied! Now challenge a friend.");
    }

    function showToast(message) {
        const resultsToast = document.getElementById("resultsToast");
        resultsToast.textContent = message;
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
            currentGameStreak: currentGameStreak
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
        if (event.target === dailyNameModal) {
            hideDailyNameModal();
        }
        if (event.target === dailyLeaderboardModal) {
            hideDailyLeaderboardModal();
        }
    });
});