document.addEventListener("DOMContentLoaded", function () {
    let countries = [];
    let currentCountry = null;
    let usedCountries = [];
    let score = 0;
    let total = 0;
    let gameState = "playing";
    let endlessStats = {
        timesPlayed: 0,
        highestScore: 0,
        totalScore: 0
    };
    let lives = 3;
    let isEndlessMode = false;
    let isDailyMode = false;
    let dailyAttempts = 0;
    
    // Initialize game systems
    let streakSystem;
    let dailyChallenge;
    let achievementSystem;
    let soundEffects;
    let xpSystem;
    let continentFilter;
    let flagFacts;

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
    const endlessModeBtn = document.getElementById('endless-mode-btn');
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
    const topProgressBar = document.getElementById('top-progress-bar');
    const levelDisplay = document.getElementById('level-display');
    const streakDisplayTop = document.getElementById('streak-display-top');
    const livesCount = document.getElementById('lives-count');
    const scoreDisplay = document.getElementById('score-display');
    const xpProgressTop = document.getElementById('xp-progress-top');

    // Sound toggle
    const soundToggle = document.getElementById('sound-toggle');
    const soundIcon = document.getElementById('sound-icon');

    // Continent filter elements
    const continentFilterBtn = document.getElementById('continent-filter-btn');
    const continentFilterModal = document.getElementById('continent-filter-modal');
    const continentFilterClose = document.querySelector('.continent-filter-close');
    const applyContinentFilter = document.getElementById('apply-continent-filter');

    // Level up modal
    const levelUpModal = document.getElementById('level-up-modal');
    const levelUpContinue = document.getElementById('level-up-continue');

    // Load stats from localStorage
    const savedStats = JSON.parse(localStorage.getItem('countryGame'));
    if (savedStats && savedStats.endlessStats) {
        endlessStats = savedStats.endlessStats;
    }

    if (localStorage.getItem('highestScore')) {
        endlessStats.highestScore = parseInt(localStorage.getItem('highestScore'));
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
        streakSystem = new StreakSystem();
        dailyChallenge = new DailyChallenge(countries);
        achievementSystem = new AchievementSystem();
        soundEffects = new SoundEffects();
        xpSystem = new XPSystem();
        continentFilter = new ContinentFilter();
        flagFacts = new FlagFacts();

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
        endlessModeBtn.addEventListener('click', startEndlessMode);
        dailyChallengeBtn.addEventListener('click', startDailyChallenge);
        playEndlessFromGameOver.addEventListener('click', startEndlessMode);
        tryAgainBtn.addEventListener('click', startEndlessMode);
        seeStatsFromGameOver.addEventListener('click', showStatsModal);
        soundToggle.addEventListener('click', toggleSound);
        continentFilterBtn.addEventListener('click', showContinentFilterModal);
        continentFilterClose.addEventListener('click', hideContinentFilterModal);
        applyContinentFilter.addEventListener('click', applyContinentFilterSelection);
        levelUpContinue.addEventListener('click', hideLevelUpModal);

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
            startEndlessMode();
        });
        document.getElementById('share-endless-result')?.addEventListener('click', shareEndlessResult);
    }

    function updateDailyChallengeButton() {
        if (dailyChallenge.hasPlayedToday()) {
            dailyChallengeBtn.textContent = 'Completed Today';
            dailyChallengeBtn.disabled = true;
        } else {
            dailyChallengeBtn.textContent = 'Daily Challenge';
            dailyChallengeBtn.disabled = false;
        }
    }

    function updateMainMenuStats() {
        const dailyStreakInfo = document.getElementById('daily-streak-info');
        const dailyStreakCount = document.getElementById('daily-streak-count');
        const levelInfo = document.getElementById('level-info');
        const currentLevelDisplay = document.getElementById('current-level-display');
        
        if (dailyChallenge.dailyStats.streak > 0) {
            dailyStreakCount.textContent = dailyChallenge.dailyStats.streak;
            dailyStreakInfo.style.display = 'block';
        }

        // Update level display
        const levelTitle = xpSystem.getLevelTitle(xpSystem.level);
        currentLevelDisplay.textContent = levelTitle;
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
            const isUnlocked = continentId === 'all' || xpSystem.unlockedFeatures.continentsUnlocked.includes(continentId);
            
            option.classList.toggle('active', isSelected);
            option.classList.toggle('locked', !isUnlocked);
            
            const lockIcon = option.querySelector('.continent-lock');
            if (lockIcon) {
                lockIcon.style.display = isUnlocked ? 'none' : 'inline';
            }
        });
        
        selectionSummary.textContent = continentFilter.getSelectionText();
    }

    function toggleContinentOption(event) {
        const option = event.currentTarget;
        const continentId = option.dataset.continent;
        const isUnlocked = continentId === 'all' || xpSystem.unlockedFeatures.continentsUnlocked.includes(continentId);
        
        if (!isUnlocked) return;
        
        continentFilter.toggleContinent(continentId);
        updateContinentFilterModal();
    }

    function applyContinentFilterSelection() {
        updateContinentFilterButton();
        hideContinentFilterModal();
        
        // If in endless mode, restart with new filter
        if (isEndlessMode) {
            startEndlessMode();
        }
    }

    function startDailyChallenge() {
        if (dailyChallenge.hasPlayedToday()) return;

        isDailyMode = true;
        isEndlessMode = false;
        dailyAttempts = 0;
        lives = 3;
        score = 0;
        total = 0;
        gameState = "playing";
        
        modeSelection.style.display = 'none';
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        topProgressBar.style.display = 'none'; // Hide XP bar in daily mode
        
        // Set today's country
        currentCountry = dailyChallenge.getTodaysCountry();
        displayCountry();
        
        headingText.textContent = "Daily Challenge";
        subHeadingText.textContent = "One flag per day - make it count!";
        
        updateTopBar();
    }

    function startEndlessMode() {
        modeSelection.style.display = 'none';
        endlessGameOverScreen.style.display = 'none';
        dailyCompleteScreen.style.display = 'none';
        levelUpModal.style.display = 'none';
        
        isDailyMode = false;
        isEndlessMode = true;
        lives = 3;
        score = 0;
        total = 0;
        gameState = "playing";
        usedCountries = [];
        
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        topProgressBar.style.display = 'block';
        
        endlessStats.timesPlayed++;
        updateTopBar();
        
        headingText.textContent = "Guess the Flag";
        subHeadingText.textContent = "Can you identify which country or territory this is?";
        
        nextCountry();
    }

    function updateTopBar() {
        // Update level
        levelDisplay.textContent = `Level ${xpSystem.level}`;
        
        // Update streak
        const streakEmoji = streakSystem.getStreakEmoji(streakSystem.currentStreak);
        streakDisplayTop.textContent = `${streakEmoji} ${streakSystem.currentStreak} Streak`.trim();
        
        // Update lives
        livesCount.textContent = lives;
        
        // Update score
        scoreDisplay.textContent = `Score: ${score}/${total}`;
        
        // Update XP progress bar
        if (isEndlessMode) {
            xpProgressTop.style.width = `${xpSystem.getXPProgress()}%`;
        }
    }

    function toggleSound() {
        const enabled = soundEffects.toggle();
        soundIcon.textContent = enabled ? '🔊' : '🔇';
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
        resetQuestionUI();
    }

    function fetchNewCountry() {
        const filteredCountries = continentFilter.filterCountries(countries);
        const countryCodes = Object.keys(filteredCountries);
        
        if (countryCodes.length === 0) {
            console.error('No countries available for selected continents');
            return;
        }
        
        let countryCode;
        do {
            const randomIndex = Math.floor(Math.random() * countryCodes.length);
            countryCode = countryCodes[randomIndex];
        } while (usedCountries.includes(countryCode) && usedCountries.length < countryCodes.length);
        
        usedCountries.push(countryCode);
        currentCountry = filteredCountries[countryCode];
        
        displayCountry();
    }

    function displayCountry() {
        if (!currentCountry || !currentCountry.flag || !currentCountry.flag.large) {
            console.error('Invalid country data:', currentCountry);
            return;
        }

        flagImg.src = currentCountry.flag.large;
        updateOptions();
        localStorage.setItem('currentFlag', JSON.stringify(currentCountry));
    }

    function resetQuestionUI() {
        options.forEach(button => {
            button.disabled = false;
            button.classList.remove('disabled', 'correct-answer', 'wrong-answer');
        });

        message.textContent = "";
        facts.hidden = true;
        flagTrivia.hidden = true;
        nextBtn.hidden = true;
        headingText.hidden = false;
        subHeadingText.hidden = false;
    }

    function checkAnswer(event) {
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
        
        updateTopBar();
        showFacts(currentCountry);
        showFlagTrivia(currentCountry);
        headingText.style.display = 'none';
        subHeadingText.style.display = 'none';
        
        if (!isDailyMode) {
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
        button.classList.add('correct-answer');
        
        // Sound effect
        soundEffects.playCorrect();
        
        if (isEndlessMode) {
            // Update streak and XP
            const streakResult = streakSystem.addCorrectAnswer();
            const xpResult = xpSystem.addXP(10, streakSystem.currentStreak);
            
            updateTopBar();
            
            // Show XP gain animation
            AnimationEffects.showXPGain(xpResult.xpGained, button);
            
            // Check for streak milestones
            if (streakResult.isStreakMilestone) {
                AnimationEffects.showStreakConfetti();
                soundEffects.playStreak();
            } else {
                AnimationEffects.showConfetti();
            }
            
            // Level up handling
            if (xpResult.leveledUp) {
                setTimeout(() => {
                    showLevelUpModal(xpResult.newLevel);
                }, 1000);
                soundEffects.playLevelUp();
            }
            
            // Unlock country and check achievements
            achievementSystem.unlockCountry(currentCountry.alpha2Code, currentCountry);
            const newAchievements = achievementSystem.checkAchievements();
            newAchievements.forEach(achievement => {
                AnimationEffects.showAchievementUnlock(achievement);
            });
        }
    }

    function handleWrongAnswer(button) {
        message.textContent = "😢 Oops, that's not correct.";
        button.classList.add('wrong-answer');
        
        // Sound effect
        soundEffects.playWrong();
        
        if (isEndlessMode) {
            streakSystem.resetStreak();
            updateTopBar();
        }
        
        loseLife();
    }

    function showLevelUpModal(newLevel) {
        const levelTitle = xpSystem.getLevelTitle(newLevel);
        const levelUnlock = xpSystem.getLevelUnlock(newLevel);
        
        document.getElementById('level-up-title').textContent = 'Level Up!';
        document.getElementById('level-up-subtitle').textContent = levelTitle.split(' ').slice(1).join(' ');
        document.getElementById('level-up-level').textContent = `Level ${newLevel}`;
        document.getElementById('level-up-unlock').textContent = levelUnlock;
        
        levelUpModal.style.display = 'block';
        AnimationEffects.showConfetti();
        
        // Update main menu display
        updateMainMenuStats();
    }

    function hideLevelUpModal() {
        levelUpModal.style.display = 'none';
    }

    function completeDailyChallenge(correct) {
        dailyChallenge.submitResult(correct, dailyAttempts);
        
        gameContainer.style.display = 'none';
        topBar.style.display = 'none';
        topProgressBar.style.display = 'none';
        dailyCompleteScreen.style.display = 'block';
        
        // Update daily complete screen
        document.getElementById('daily-result-heading').textContent = correct ? 'Well Done!' : 'Better Luck Tomorrow!';
        document.getElementById('daily-result-flag').src = currentCountry.flag.large;
        document.getElementById('daily-result-country').textContent = currentCountry.name;
        document.getElementById('daily-attempts-display').textContent = `Attempts: ${dailyAttempts}/3`;
        document.getElementById('daily-streak-display').textContent = `Daily Streak: ${dailyChallenge.dailyStats.streak}`;
        
        // Show fake global stat
        const globalStat = flagFacts.getRandomGlobalStat();
        document.getElementById('daily-global-stat').textContent = globalStat;
        
        // Start countdown timer
        startCountdownTimer();
        
        // Update main menu for tomorrow
        updateDailyChallengeButton();
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
                if (isEndlessMode) {
                    showEndlessGameOver();
                } else if (isDailyMode) {
                    completeDailyChallenge(false);
                }
            }, 2000);
        }
    }

    function showEndlessGameOver() {
        lives = 0;

        endlessStats.totalScore += score;
        if (score > endlessStats.highestScore) {
            endlessStats.highestScore = score;
            localStorage.setItem('highestScore', endlessStats.highestScore);
        }

        localStorage.setItem('countryGame', JSON.stringify({ endlessStats }));

        endlessGameOverScreen.style.display = 'block';
        gameContainer.style.display = 'none';
        topBar.style.display = 'none';
        topProgressBar.style.display = 'none';

        document.getElementById('endless-score-display').textContent = "Your Score: " + score;
        document.getElementById('endless-highest-score-display').textContent = "Highest Score: " + endlessStats.highestScore;
        document.getElementById('final-streak-display').textContent = `Best Streak This Game: ${streakSystem.currentStreak}`;
    }

    function updateOptions() {
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

    function showFlagTrivia(country) {
        const trivia = flagFacts.getFact(country.alpha2Code);
        flagTrivia.innerHTML = `<p class="trivia-text">${trivia}</p>`;
        flagTrivia.hidden = false;
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
        // Endless stats
        document.getElementById('stats-level').textContent = xpSystem.level;
        document.getElementById('stats-xp').textContent = xpSystem.xp;
        document.getElementById('stats-best-streak').textContent = streakSystem.bestStreak;
        document.getElementById('endless-times-played-value').textContent = endlessStats.timesPlayed;
        document.getElementById('endless-highest-score-value').textContent = endlessStats.highestScore;
        document.getElementById('endless-total-score-value').textContent = endlessStats.totalScore;
        
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
        const shareText = `🌍 Flagtriv Endless Mode\nScore: ${score}/${total}\nBest Streak: ${streakSystem.currentStreak}\nflagtriv.com`;
        shareToClipboard(shareText);
    }

    function shareScore() {
        const shareText = `🌍 Flagtriv: ${score}/${total}\nPlay: flagtriv.com`;
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
            endlessStats: endlessStats,
            isEndlessMode: isEndlessMode,
            isDailyMode: isDailyMode
        };
        localStorage.setItem('countryGame', JSON.stringify(gameStateData));
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
        if (event.target === levelUpModal) {
            hideLevelUpModal();
        }
    });
});