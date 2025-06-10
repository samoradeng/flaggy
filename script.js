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
    let currentGameStreak = 0;
    
    // Multiplayer variables
    let multiplayerGame = null;
    let isHost = false;
    let playerId = null;
    let gameTimer = null;
    let currentQuestionIndex = 0;
    let multiplayerAnswers = [];
    let gameStartTime = null;
    let hasAnsweredCurrentQuestion = false;
    
    // Initialize game systems
    let dailyChallenge;
    let achievementSystem;
    let soundEffects;
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
    const challengeModeBtn = document.getElementById('challenge-mode-btn');
    const zenModeBtn = document.getElementById('zen-mode-btn');
    const dailyChallengeBtn = document.getElementById('daily-challenge-btn');
    const challengeFriendsBtn = document.getElementById('challenge-friends-btn');
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

    // Multiplayer elements
    const createChallengeModal = document.getElementById('create-challenge-modal');
    const joinChallengeModal = document.getElementById('join-challenge-modal');
    const multiplayerLobby = document.getElementById('multiplayer-lobby');
    const multiplayerResults = document.getElementById('multiplayer-results');

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

        // Generate unique player ID
        playerId = 'player_' + Math.random().toString(36).substr(2, 9);

        // Update UI
        updateTopBar();
        updateMainMenuStats();
        updateSoundToggle();
        updateContinentFilterButton();

        // Check if daily challenge is available
        updateDailyChallengeButton();

        // Check for multiplayer game in URL
        checkForMultiplayerGame();

        // Attach event listeners
        options.forEach(button => button.addEventListener('click', checkAnswer));
        nextBtn.addEventListener('click', nextCountry);
        challengeModeBtn.addEventListener('click', startChallengeMode);
        zenModeBtn.addEventListener('click', startZenMode);
        dailyChallengeBtn.addEventListener('click', startDailyChallenge);
        challengeFriendsBtn.addEventListener('click', showCreateChallengeModal);
        playEndlessFromGameOver.addEventListener('click', startChallengeMode);
        tryAgainBtn.addEventListener('click', startChallengeMode);
        seeStatsFromGameOver.addEventListener('click', showStatsModal);
        settingsBtn.addEventListener('click', showSettingsModal);
        settingsClose.addEventListener('click', hideSettingsModal);
        soundToggle.addEventListener('click', toggleSound);
        continentFilterBtn.addEventListener('click', showContinentFilterModal);
        continentFilterClose.addEventListener('click', hideContinentFilterModal);
        applyContinentFilter.addEventListener('click', applyContinentFilterSelection);

        // Multiplayer event listeners
        document.getElementById('create-challenge-btn').addEventListener('click', createChallenge);
        document.getElementById('copy-challenge-link').addEventListener('click', copyChallengeLink);
        document.getElementById('join-challenge-btn').addEventListener('click', joinChallenge);
        document.getElementById('start-multiplayer-game').addEventListener('click', startMultiplayerGame);
        document.getElementById('share-multiplayer-result').addEventListener('click', shareMultiplayerResult);
        document.getElementById('play-again-multiplayer').addEventListener('click', () => {
            multiplayerResults.style.display = 'none';
            modeSelection.style.display = 'flex';
        });

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

        // Page visibility API to handle tab switching
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    function handleVisibilityChange() {
        if (isMultiplayerMode && multiplayerGame) {
            if (document.hidden) {
                // Player switched away from tab
                console.log('Player switched away from tab');
            } else {
                // Player returned to tab
                console.log('Player returned to tab');
                // Sync with current game state
                syncMultiplayerState();
            }
        }
    }

    function syncMultiplayerState() {
        if (!multiplayerGame) return;
        
        const gameData = JSON.parse(localStorage.getItem(`multiplayer_${multiplayerGame.gameId}`) || '{}');
        
        if (gameData.gameState === 'playing' && gameData.currentQuestionIndex !== undefined) {
            // Game is in progress, sync to current question
            currentQuestionIndex = gameData.currentQuestionIndex;
            
            if (currentQuestionIndex < multiplayerGame.flags.length) {
                // Show current question
                currentCountry = multiplayerGame.flags[currentQuestionIndex];
                displayCountry();
                
                // Check if we already answered this question
                const playerAnswer = gameData.answers?.[playerId]?.[currentQuestionIndex];
                if (playerAnswer) {
                    hasAnsweredCurrentQuestion = true;
                    // Show the answer state
                    showAnswerResult(playerAnswer.correct, playerAnswer.selectedAnswer);
                } else {
                    hasAnsweredCurrentQuestion = false;
                    resetQuestionUI();
                }
                
                // Update timer if still running
                if (gameData.questionStartTime) {
                    const elapsed = Date.now() - gameData.questionStartTime;
                    const remaining = Math.max(0, 10000 - elapsed);
                    if (remaining > 0 && !hasAnsweredCurrentQuestion) {
                        startQuestionTimer(remaining);
                    }
                }
            }
        }
    }

    function checkForMultiplayerGame() {
        const urlParams = new URLSearchParams(window.location.search);
        const gameId = urlParams.get('game');
        
        if (gameId) {
            // Show join modal
            document.getElementById('join-game-id').value = gameId;
            joinChallengeModal.style.display = 'block';
            modeSelection.style.display = 'none';
        }
    }

    function showCreateChallengeModal() {
        // Update continent display
        document.getElementById('challenge-continents').textContent = continentFilter.getSelectionText();
        createChallengeModal.style.display = 'block';
    }

    function createChallenge() {
        const flagCount = parseInt(document.getElementById('flag-count-select').value);
        const gameId = generateGameId();
        
        // Filter countries based on current continent selection
        const filteredCountries = continentFilter.filterCountries(countries);
        const countryCodes = Object.keys(filteredCountries);
        
        // Select random flags
        const selectedFlags = [];
        const usedCodes = [];
        
        for (let i = 0; i < flagCount && i < countryCodes.length; i++) {
            let randomCode;
            do {
                randomCode = countryCodes[Math.floor(Math.random() * countryCodes.length)];
            } while (usedCodes.includes(randomCode));
            
            usedCodes.push(randomCode);
            selectedFlags.push(filteredCountries[randomCode]);
        }
        
        // Create game data
        const gameData = {
            gameId: gameId,
            hostId: playerId,
            flags: selectedFlags,
            continents: continentFilter.getSelectionText(),
            players: {
                [playerId]: {
                    nickname: 'Host',
                    isHost: true,
                    joinedAt: Date.now(),
                    isReady: true
                }
            },
            gameState: 'lobby',
            createdAt: Date.now()
        };
        
        // Save game data
        localStorage.setItem(`multiplayer_${gameId}`, JSON.stringify(gameData));
        
        // Show challenge link
        const challengeLink = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
        document.getElementById('challenge-link').value = challengeLink;
        document.getElementById('challenge-link-display').style.display = 'block';
        
        // Set up as host
        multiplayerGame = gameData;
        isHost = true;
        
        // Hide create modal and show lobby after a delay
        setTimeout(() => {
            createChallengeModal.style.display = 'none';
            showMultiplayerLobby();
        }, 2000);
    }

    function copyChallengeLink() {
        const linkInput = document.getElementById('challenge-link');
        linkInput.select();
        linkInput.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            const button = document.getElementById('copy-challenge-link');
            const originalText = button.textContent;
            button.textContent = '✅ Copied!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    }

    function joinChallenge() {
        const gameId = document.getElementById('join-game-id').value.trim();
        const nickname = document.getElementById('player-nickname').value.trim() || `Player${Math.floor(Math.random() * 1000)}`;
        
        if (!gameId) {
            alert('Please enter a game ID');
            return;
        }
        
        // Load game data
        const gameData = JSON.parse(localStorage.getItem(`multiplayer_${gameId}`) || '{}');
        
        if (!gameData.gameId) {
            alert('Game not found. Please check the game ID.');
            return;
        }
        
        if (gameData.gameState !== 'lobby') {
            alert('This game has already started or ended.');
            return;
        }
        
        // Add player to game
        gameData.players[playerId] = {
            nickname: nickname,
            isHost: false,
            joinedAt: Date.now(),
            isReady: true
        };
        
        // Save updated game data
        localStorage.setItem(`multiplayer_${gameId}`, JSON.stringify(gameData));
        
        // Set up as player
        multiplayerGame = gameData;
        isHost = false;
        
        // Hide join modal and show lobby
        joinChallengeModal.style.display = 'none';
        showMultiplayerLobby();
    }

    function showMultiplayerLobby() {
        modeSelection.style.display = 'none';
        multiplayerLobby.style.display = 'block';
        
        updateLobbyDisplay();
        
        // Start polling for updates
        startLobbyPolling();
    }

    function updateLobbyDisplay() {
        if (!multiplayerGame) return;
        
        // Reload game data to get latest updates
        const gameData = JSON.parse(localStorage.getItem(`multiplayer_${multiplayerGame.gameId}`) || '{}');
        multiplayerGame = gameData;
        
        document.getElementById('lobby-game-id').textContent = multiplayerGame.gameId;
        document.getElementById('lobby-flag-count').textContent = `${multiplayerGame.flags.length} flags`;
        document.getElementById('lobby-continents').textContent = multiplayerGame.continents;
        
        // Update players list
        const playersList = document.getElementById('players-list');
        playersList.innerHTML = '';
        
        Object.entries(multiplayerGame.players).forEach(([id, player]) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <span>${player.nickname}</span>
                <div>
                    ${player.isHost ? '<span class="host-badge">HOST</span>' : '<span class="player-status">Ready</span>'}
                </div>
            `;
            playersList.appendChild(playerDiv);
        });
        
        // Show/hide start button for host
        const startButton = document.getElementById('start-multiplayer-game');
        const waitingText = document.getElementById('lobby-waiting');
        
        if (isHost) {
            startButton.style.display = 'block';
            waitingText.style.display = 'none';
            
            // Add share link button for host
            if (!document.getElementById('share-lobby-link')) {
                const shareButton = document.createElement('button');
                shareButton.id = 'share-lobby-link';
                shareButton.className = 'start-game-btn';
                shareButton.style.marginTop = '10px';
                shareButton.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                shareButton.innerHTML = '📤 Share Link Again';
                shareButton.addEventListener('click', shareLobbyLink);
                startButton.parentNode.insertBefore(shareButton, startButton.nextSibling);
            }
        } else {
            startButton.style.display = 'none';
            waitingText.style.display = 'block';
        }
    }

    function shareLobbyLink() {
        const challengeLink = `${window.location.origin}${window.location.pathname}?game=${multiplayerGame.gameId}`;
        shareToClipboard(`🧑‍🤝‍🧑 Join my Flagtriv challenge!\n${challengeLink}`);
    }

    function startLobbyPolling() {
        const pollInterval = setInterval(() => {
            if (!multiplayerGame || multiplayerGame.gameState !== 'lobby') {
                clearInterval(pollInterval);
                return;
            }
            
            // Check for game state changes
            const gameData = JSON.parse(localStorage.getItem(`multiplayer_${multiplayerGame.gameId}`) || '{}');
            
            if (gameData.gameState === 'playing') {
                clearInterval(pollInterval);
                startMultiplayerGameplay();
            } else {
                updateLobbyDisplay();
            }
        }, 1000);
    }

    function startMultiplayerGame() {
        if (!isHost || !multiplayerGame) return;
        
        // Update game state
        multiplayerGame.gameState = 'playing';
        multiplayerGame.startedAt = Date.now();
        multiplayerGame.currentQuestionIndex = 0;
        multiplayerGame.answers = {};
        
        // Save updated game data
        localStorage.setItem(`multiplayer_${multiplayerGame.gameId}`, JSON.stringify(multiplayerGame));
        
        startMultiplayerGameplay();
    }

    function startMultiplayerGameplay() {
        isMultiplayerMode = true;
        isChallengeMode = false;
        isZenMode = false;
        isDailyMode = false;
        
        score = 0;
        total = 0;
        currentQuestionIndex = 0;
        multiplayerAnswers = [];
        hasAnsweredCurrentQuestion = false;
        
        multiplayerLobby.style.display = 'none';
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        
        headingText.textContent = "🧑‍🤝‍🧑 Challenge Mode";
        subHeadingText.textContent = `Playing with ${Object.keys(multiplayerGame.players).length} players`;
        
        updateTopBar();
        showNextMultiplayerQuestion();
    }

    function showNextMultiplayerQuestion() {
        if (currentQuestionIndex >= multiplayerGame.flags.length) {
            endMultiplayerGame();
            return;
        }
        
        currentCountry = multiplayerGame.flags[currentQuestionIndex];
        hasAnsweredCurrentQuestion = false;
        
        displayCountry();
        resetQuestionUI();
        
        // Update game data with current question
        const gameData = JSON.parse(localStorage.getItem(`multiplayer_${multiplayerGame.gameId}`) || '{}');
        gameData.currentQuestionIndex = currentQuestionIndex;
        gameData.questionStartTime = Date.now();
        localStorage.setItem(`multiplayer_${multiplayerGame.gameId}`, JSON.stringify(gameData));
        
        // Start 10-second timer
        startQuestionTimer(10000);
        
        updateTopBar();
    }

    function startQuestionTimer(duration) {
        let timeLeft = Math.floor(duration / 1000);
        
        // Add timer display to top bar
        const timerDisplay = document.createElement('div');
        timerDisplay.className = 'multiplayer-timer';
        timerDisplay.textContent = `⏱️ ${timeLeft}s`;
        
        // Remove existing timer if any
        const existingTimer = document.querySelector('.multiplayer-timer');
        if (existingTimer) {
            existingTimer.remove();
        }
        
        topBar.appendChild(timerDisplay);
        
        gameTimer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `⏱️ ${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(gameTimer);
                timerDisplay.remove();
                
                if (!hasAnsweredCurrentQuestion) {
                    // Auto-submit wrong answer
                    submitMultiplayerAnswer(null, false);
                }
            }
        }, 1000);
    }

    function submitMultiplayerAnswer(selectedAnswer, isCorrect) {
        if (hasAnsweredCurrentQuestion) return;
        
        hasAnsweredCurrentQuestion = true;
        
        // Clear timer
        if (gameTimer) {
            clearInterval(gameTimer);
            const timerDisplay = document.querySelector('.multiplayer-timer');
            if (timerDisplay) {
                timerDisplay.remove();
            }
        }
        
        // Record answer
        const answerData = {
            questionIndex: currentQuestionIndex,
            selectedAnswer: selectedAnswer,
            correct: isCorrect,
            answeredAt: Date.now()
        };
        
        multiplayerAnswers.push(answerData);
        
        // Update score
        total++;
        if (isCorrect) {
            score++;
            currentGameStreak++;
        } else {
            currentGameStreak = 0;
        }
        
        // Save answer to game data
        const gameData = JSON.parse(localStorage.getItem(`multiplayer_${multiplayerGame.gameId}`) || '{}');
        if (!gameData.answers) gameData.answers = {};
        if (!gameData.answers[playerId]) gameData.answers[playerId] = [];
        gameData.answers[playerId][currentQuestionIndex] = answerData;
        localStorage.setItem(`multiplayer_${multiplayerGame.gameId}`, JSON.stringify(gameData));
        
        // Show answer result
        showAnswerResult(isCorrect, selectedAnswer);
        
        // Move to next question after delay
        setTimeout(() => {
            currentQuestionIndex++;
            showNextMultiplayerQuestion();
        }, 3000);
    }

    function showAnswerResult(isCorrect, selectedAnswer) {
        // Disable all options
        options.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
        });
        
        // Show correct answer
        options.forEach(button => {
            if (button.textContent === currentCountry.name) {
                button.classList.add('correct-answer');
            }
            if (selectedAnswer && button.textContent === selectedAnswer && !isCorrect) {
                button.classList.add('wrong-answer');
            }
        });
        
        // Show message
        message.textContent = isCorrect ? "🎉 Correct! Well done!" : "😢 Oops, that's not correct.";
        
        // Show facts and trivia
        showFacts(currentCountry);
        showFlagTrivia(currentCountry);
        
        // Hide headings
        headingText.style.display = 'none';
        subHeadingText.style.display = 'none';
        
        updateTopBar();
    }

    function endMultiplayerGame() {
        isMultiplayerMode = false;
        
        gameContainer.style.display = 'none';
        topBar.style.display = 'none';
        
        // Calculate final stats
        const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
        
        // Show results
        document.getElementById('final-score').textContent = `${score}/${total}`;
        document.getElementById('final-accuracy').textContent = `${accuracy}%`;
        
        // Determine result message
        const resultMessage = document.getElementById('result-message');
        if (accuracy >= 80) {
            resultMessage.textContent = '🏆 Excellent!';
        } else if (accuracy >= 60) {
            resultMessage.textContent = '👏 Well Done!';
        } else {
            resultMessage.textContent = '📚 Keep Learning!';
        }
        
        multiplayerResults.style.display = 'block';
        
        // Show confetti for good performance
        if (accuracy >= 70) {
            AnimationEffects.showConfetti();
        }
    }

    function shareMultiplayerResult() {
        const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
        const shareText = `🧑‍🤝‍🧑 Flagtriv Challenge Results\nScore: ${score}/${total} (${accuracy}%)\nBest Streak: ${currentGameStreak}\nflagtriv.com`;
        shareToClipboard(shareText);
    }

    function generateGameId() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    function updateDailyChallengeButton() {
        if (dailyChallenge.hasPlayedToday()) {
            dailyChallengeBtn.textContent = '✅ Completed Today';
            dailyChallengeBtn.disabled = true;
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
        if (selectionText) {
            selectionText.textContent = continentFilter.getSelectionText();
        }
    }

    function updateContinentFilterButton() {
        if (continentFilterBtn) {
            continentFilterBtn.textContent = continentFilter.getSelectionText().split(' ')[0]; // Just the emoji
            continentFilterBtn.title = continentFilter.getSelectionText();
        }
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
        
        if (selectionSummary) {
            selectionSummary.textContent = continentFilter.getSelectionText();
        }
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
        lives = 3;
        score = 0;
        total = 0;
        gameState = "playing";
        currentGameStreak = 0;
        
        modeSelection.style.display = 'none';
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        
        // Set today's country
        currentCountry = dailyChallenge.getTodaysCountry();
        displayCountry();
        
        headingText.textContent = "📅 Daily Challenge";
        subHeadingText.textContent = "One flag per day - make it count!";
        
        updateTopBar();
    }

    function startChallengeMode() {
        modeSelection.style.display = 'none';
        endlessGameOverScreen.style.display = 'none';
        dailyCompleteScreen.style.display = 'none';
        multiplayerResults.style.display = 'none';
        
        isDailyMode = false;
        isChallengeMode = true;
        isZenMode = false;
        isMultiplayerMode = false;
        lives = 3;
        score = 0;
        total = 0;
        gameState = "playing";
        usedCountries = [];
        currentGameStreak = 0;
        
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        
        challengeStats.timesPlayed++;
        updateTopBar();
        
        headingText.textContent = "🧠 Challenge Mode";
        subHeadingText.textContent = "Test your flag knowledge!";
        
        nextCountry();
    }

    function startZenMode() {
        modeSelection.style.display = 'none';
        endlessGameOverScreen.style.display = 'none';
        dailyCompleteScreen.style.display = 'none';
        multiplayerResults.style.display = 'none';
        
        isDailyMode = false;
        isChallengeMode = false;
        isZenMode = true;
        isMultiplayerMode = false;
        lives = Infinity;
        score = 0;
        total = 0;
        gameState = "playing";
        usedCountries = [];
        currentGameStreak = 0;
        
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        
        zenStats.sessionsPlayed++;
        updateTopBar();
        
        headingText.textContent = "🌿 Zen Mode";
        subHeadingText.textContent = "Relax and explore flags at your own pace";
        
        nextCountry();
    }

    function updateTopBar() {
        // Update streak - use current game streak
        const streakEmoji = getStreakEmoji(currentGameStreak);
        streakDisplayTop.textContent = `${streakEmoji} ${currentGameStreak} Streak`.trim();
        
        // Update lives (hide in zen mode)
        if (isZenMode || isMultiplayerMode) {
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
        if (soundIcon) {
            soundIcon.textContent = soundEffects.enabled ? '🔊' : '🔇';
        }
    }

    function nextCountry() {
        if (isDailyMode || isMultiplayerMode) return;
        
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
        
        if (isMultiplayerMode) {
            submitMultiplayerAnswer(selectedCountryName, isCorrect);
            return;
        }
        
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
        currentGameStreak++;
        button.classList.add('correct-answer');
        
        // Sound effect
        soundEffects.playCorrect();
        
        if (isChallengeMode) {
            AnimationEffects.showConfetti();
            
            // Unlock country and check achievements
            achievementSystem.unlockCountry(currentCountry.alpha2Code, currentCountry);
            const newAchievements = achievementSystem.checkAchievements();
            newAchievements.forEach(achievement => {
                AnimationEffects.showAchievementUnlock(achievement);
            });
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

    function completeDailyChallenge(correct) {
        dailyChallenge.submitResult(correct, dailyAttempts);
        
        gameContainer.style.display = 'none';
        topBar.style.display = 'none';
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
        // Challenge stats
        const bestStreak = Math.max(
            parseInt(localStorage.getItem('bestStreak') || '0'),
            currentGameStreak
        );
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
            }).catch((error) => {
                if (error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                }
            });
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
        if (event.target === createChallengeModal) {
            createChallengeModal.style.display = 'none';
        }
        if (event.target === joinChallengeModal) {
            joinChallengeModal.style.display = 'none';
        }
    });
});