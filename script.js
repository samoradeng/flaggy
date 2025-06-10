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
    let bestStreak = parseInt(localStorage.getItem('bestStreak') || '0');
    
    // Multiplayer variables
    let multiplayerGame = null;
    let playerName = '';
    let gameId = '';
    let multiplayerTimer = null;
    let gameUpdateInterval = null;
    let playerId = '';
    
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
    const multiplayerLobby = document.getElementById('multiplayer-lobby');
    const multiplayerResults = document.getElementById('multiplayer-results');
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
        playerId = generatePlayerId();

        // Update UI
        updateTopBar();
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

        // Multiplayer buttons
        document.getElementById('create-challenge-btn')?.addEventListener('click', createChallenge);
        document.getElementById('join-challenge-btn')?.addEventListener('click', joinChallenge);
        document.getElementById('start-multiplayer-game')?.addEventListener('click', startMultiplayerGame);
        document.getElementById('copy-challenge-link')?.addEventListener('click', copyChallengeLink);
    }

    function generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    function checkForMultiplayerGame() {
        const urlParams = new URLSearchParams(window.location.search);
        const gameIdParam = urlParams.get('game');
        
        if (gameIdParam) {
            gameId = gameIdParam;
            // Hide mode selection and show join modal
            modeSelection.style.display = 'none';
            showJoinChallengeModal();
        }
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
        if (selectionText && continentFilter) {
            selectionText.textContent = continentFilter.getSelectionText();
        }
    }

    function updateContinentFilterButton() {
        if (continentFilter && continentFilterBtn) {
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
        
        if (selectionSummary && continentFilter) {
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

    // Multiplayer functions
    function showCreateChallengeModal() {
        createChallengeModal.style.display = 'block';
        // Update continent display
        const challengeContinents = document.getElementById('challenge-continents');
        if (challengeContinents && continentFilter) {
            challengeContinents.textContent = continentFilter.getSelectionText();
        }
    }

    function showJoinChallengeModal() {
        document.getElementById('join-game-id').value = gameId;
        joinChallengeModal.style.display = 'block';
    }

    function createChallenge() {
        const flagCount = document.getElementById('flag-count-select').value;
        const selectedContinents = continentFilter.selectedContinents;
        
        // Generate unique game ID
        gameId = generateGameId();
        playerName = 'Host';
        
        // Create multiplayer game object
        multiplayerGame = {
            id: gameId,
            flagCount: parseInt(flagCount),
            continents: selectedContinents,
            players: {},
            flags: [],
            currentFlag: 0,
            status: 'waiting',
            createdAt: Date.now(),
            gameStarted: false,
            gameEnded: false
        };
        
        // Add host as first player
        multiplayerGame.players[playerId] = {
            id: playerId,
            name: playerName,
            score: 0,
            answers: [],
            isHost: true,
            joinedAt: Date.now()
        };
        
        // Generate flags for the game
        const filteredCountries = continentFilter.filterCountries(countries);
        const countryCodes = Object.keys(filteredCountries);
        const selectedFlags = [];
        
        // Shuffle and select flags
        const shuffledCodes = [...countryCodes].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < Math.min(flagCount, shuffledCodes.length); i++) {
            const countryCode = shuffledCodes[i];
            selectedFlags.push(filteredCountries[countryCode]);
        }
        
        multiplayerGame.flags = selectedFlags;
        
        // Store in localStorage
        saveMultiplayerGame();
        
        // Show challenge link
        const challengeLink = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
        document.getElementById('challenge-link').value = challengeLink;
        document.getElementById('challenge-link-display').style.display = 'block';
        
        // Auto-copy link to clipboard
        copyChallengeLink();
        
        createChallengeModal.style.display = 'none';
        showMultiplayerLobby();
    }

    function joinChallenge() {
        const inputGameId = document.getElementById('join-game-id').value.trim();
        const nickname = document.getElementById('player-nickname').value.trim() || generatePlayerName();
        
        if (!inputGameId) {
            alert('Please enter a game ID');
            return;
        }
        
        // Load game from localStorage
        const gameData = localStorage.getItem(`game_${inputGameId}`);
        if (!gameData) {
            alert('Game not found. Please check the game ID or ask your friend for a new link.');
            return;
        }
        
        multiplayerGame = JSON.parse(gameData);
        
        // Check if game is still valid (not too old)
        const gameAge = Date.now() - multiplayerGame.createdAt;
        if (gameAge > 24 * 60 * 60 * 1000) { // 24 hours
            alert('This game has expired. Please ask your friend to create a new challenge.');
            return;
        }
        
        // Check if game already started
        if (multiplayerGame.gameStarted) {
            alert('This game has already started. Please ask your friend to create a new challenge.');
            return;
        }
        
        gameId = inputGameId;
        playerName = nickname;
        
        // Add player to game
        multiplayerGame.players[playerId] = {
            id: playerId,
            name: playerName,
            score: 0,
            answers: [],
            isHost: false,
            joinedAt: Date.now()
        };
        
        // Save updated game
        saveMultiplayerGame();
        
        joinChallengeModal.style.display = 'none';
        showMultiplayerLobby();
    }

    function saveMultiplayerGame() {
        localStorage.setItem(`game_${gameId}`, JSON.stringify(multiplayerGame));
    }

    function loadMultiplayerGame() {
        const gameData = localStorage.getItem(`game_${gameId}`);
        if (gameData) {
            multiplayerGame = JSON.parse(gameData);
            return true;
        }
        return false;
    }

    function showMultiplayerLobby() {
        modeSelection.style.display = 'none';
        multiplayerLobby.style.display = 'block';
        
        document.getElementById('lobby-game-id').textContent = gameId;
        document.getElementById('lobby-flag-count').textContent = multiplayerGame.flagCount;
        
        // Show continent info
        const continentText = multiplayerGame.continents.includes('all') 
            ? '🌐 All Continents' 
            : `🌍 ${multiplayerGame.continents.length} Continents`;
        document.getElementById('lobby-continents').textContent = continentText;
        
        // Show/hide start button based on host status
        const isHost = multiplayerGame.players[playerId]?.isHost;
        if (isHost) {
            document.getElementById('start-multiplayer-game').style.display = 'block';
            document.getElementById('lobby-waiting').style.display = 'none';
        } else {
            document.getElementById('start-multiplayer-game').style.display = 'none';
            document.getElementById('lobby-waiting').style.display = 'block';
        }
        
        updatePlayersList();
        
        // Start polling for game updates
        startGamePolling();
    }

    function startGamePolling() {
        // Clear any existing interval
        if (gameUpdateInterval) {
            clearInterval(gameUpdateInterval);
        }
        
        gameUpdateInterval = setInterval(() => {
            if (loadMultiplayerGame()) {
                updatePlayersList();
                
                // Check if game started
                if (multiplayerGame.gameStarted && !isMultiplayerMode) {
                    clearInterval(gameUpdateInterval);
                    startMultiplayerGameplay();
                }
            }
        }, 1000); // Poll every second
    }

    function updatePlayersList() {
        const playersList = document.getElementById('players-list');
        playersList.innerHTML = '';
        
        // Show all players
        Object.values(multiplayerGame.players).forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <span>👤 ${player.name}</span>
                ${player.isHost ? '<span class="host-badge">Host</span>' : ''}
                <span class="player-status">✅ Ready</span>
            `;
            playersList.appendChild(playerDiv);
        });
        
        // Update player count
        const playerCount = Object.keys(multiplayerGame.players).length;
        document.getElementById('lobby-waiting').textContent = 
            `⏳ Waiting for host to start the game... (${playerCount} player${playerCount !== 1 ? 's' : ''} joined)`;
    }

    function startMultiplayerGame() {
        // Mark game as started
        multiplayerGame.gameStarted = true;
        multiplayerGame.status = 'playing';
        saveMultiplayerGame();
        
        // Clear polling interval
        if (gameUpdateInterval) {
            clearInterval(gameUpdateInterval);
        }
        
        startMultiplayerGameplay();
    }

    function startMultiplayerGameplay() {
        isMultiplayerMode = true;
        isChallengeMode = false;
        isZenMode = false;
        isDailyMode = false;
        
        multiplayerLobby.style.display = 'none';
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        
        score = 0;
        total = 0;
        currentGameStreak = 0;
        usedCountries = [];
        
        headingText.textContent = "Challenge Friends";
        subHeadingText.textContent = `Flag ${total + 1} of ${multiplayerGame.flagCount}`;
        
        // Start with first flag
        currentCountry = multiplayerGame.flags[0];
        displayCountry();
        updateTopBar();
        
        // Start timer
        startMultiplayerTimer();
    }

    function startMultiplayerTimer() {
        let timeLeft = 10;
        
        // Remove existing timer if any
        const existingTimer = document.getElementById('multiplayer-timer');
        if (existingTimer) {
            existingTimer.remove();
        }
        
        // Create new timer
        const timer = document.createElement('div');
        timer.id = 'multiplayer-timer';
        timer.className = 'multiplayer-timer';
        topBar.appendChild(timer);
        
        // Clear any existing timer
        if (multiplayerTimer) {
            clearInterval(multiplayerTimer);
        }
        
        multiplayerTimer = setInterval(() => {
            const timerElement = document.getElementById('multiplayer-timer');
            if (timerElement) {
                timerElement.textContent = `⏱️ ${timeLeft}s`;
                
                // Change color as time runs out
                if (timeLeft <= 3) {
                    timerElement.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
                } else if (timeLeft <= 5) {
                    timerElement.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
                }
            }
            timeLeft--;
            
            if (timeLeft < 0) {
                clearInterval(multiplayerTimer);
                // Auto-advance to next question or end game
                if (total < multiplayerGame.flagCount - 1) {
                    nextMultiplayerFlag();
                } else {
                    showMultiplayerResults();
                }
            }
        }, 1000);
    }

    function nextMultiplayerFlag() {
        total++;
        
        if (total < multiplayerGame.flagCount) {
            currentCountry = multiplayerGame.flags[total];
            displayCountry();
            resetQuestionUI();
            subHeadingText.textContent = `Flag ${total + 1} of ${multiplayerGame.flagCount}`;
            updateTopBar();
            startMultiplayerTimer();
        } else {
            showMultiplayerResults();
        }
    }

    function showMultiplayerResults() {
        // Clear timer
        if (multiplayerTimer) {
            clearInterval(multiplayerTimer);
        }
        
        // Remove timer element
        const timerElement = document.getElementById('multiplayer-timer');
        if (timerElement) {
            timerElement.remove();
        }
        
        gameContainer.style.display = 'none';
        topBar.style.display = 'none';
        multiplayerResults.style.display = 'block';
        
        const accuracy = Math.round((score / multiplayerGame.flagCount) * 100);
        
        document.getElementById('final-score').textContent = `${score}/${multiplayerGame.flagCount}`;
        document.getElementById('final-accuracy').textContent = `${accuracy}%`;
        
        // Show all players' results
        updateMultiplayerResultsDisplay();
        
        if (score === multiplayerGame.flagCount) {
            document.getElementById('result-message').textContent = '🏆 Perfect Score! Flag Champion!';
            AnimationEffects.showConfetti();
            soundEffects.playLevelUp();
        } else if (accuracy >= 80) {
            document.getElementById('result-message').textContent = '🔥 Excellent work!';
            AnimationEffects.showConfetti();
        } else if (accuracy >= 60) {
            document.getElementById('result-message').textContent = '👍 Good effort!';
        } else {
            document.getElementById('result-message').textContent = '💪 Keep practicing!';
        }
    }

    function updateMultiplayerResultsDisplay() {
        // Create a leaderboard section
        const resultsContent = document.querySelector('.results-content');
        
        // Remove existing leaderboard if any
        const existingLeaderboard = document.getElementById('multiplayer-leaderboard');
        if (existingLeaderboard) {
            existingLeaderboard.remove();
        }
        
        // Create leaderboard
        const leaderboard = document.createElement('div');
        leaderboard.id = 'multiplayer-leaderboard';
        leaderboard.innerHTML = '<h3>🏆 Final Results</h3>';
        
        // Sort players by score
        const sortedPlayers = Object.values(multiplayerGame.players).sort((a, b) => b.score - a.score);
        
        sortedPlayers.forEach((player, index) => {
            const playerResult = document.createElement('div');
            playerResult.className = 'player-result';
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
            const accuracy = Math.round((player.score / multiplayerGame.flagCount) * 100);
            
            playerResult.innerHTML = `
                <span>${medal} ${player.name}</span>
                <span>${player.score}/${multiplayerGame.flagCount} (${accuracy}%)</span>
            `;
            leaderboard.appendChild(playerResult);
        });
        
        // Insert leaderboard before final stats
        const finalStats = document.querySelector('.final-stats');
        resultsContent.insertBefore(leaderboard, finalStats);
    }

    function copyChallengeLink() {
        const linkInput = document.getElementById('challenge-link');
        linkInput.select();
        linkInput.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            showCopiedToast('Challenge link copied! Share it with your friends.');
            
            const copyBtn = document.getElementById('copy-challenge-link');
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                copyBtn.style.backgroundColor = '#4CAF50';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.style.backgroundColor = '';
                }, 2000);
            }
        } catch (err) {
            console.error('Failed to copy: ', err);
            // Fallback: show the link prominently
            alert('Copy this link to share with friends: ' + linkInput.value);
        }
    }

    function generateGameId() {
        return Math.random().toString(36).substr(2, 8).toUpperCase();
    }

    function generatePlayerName() {
        const adjectives = ['Quick', 'Smart', 'Cool', 'Fast', 'Clever', 'Sharp', 'Bright', 'Swift'];
        const nouns = ['Explorer', 'Traveler', 'Scout', 'Navigator', 'Wanderer', 'Adventurer', 'Voyager', 'Nomad'];
        return adjectives[Math.floor(Math.random() * adjectives.length)] + 
               nouns[Math.floor(Math.random() * nouns.length)];
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
        
        headingText.textContent = "Daily Challenge";
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
        
        headingText.textContent = "Challenge Mode";
        subHeadingText.textContent = "How many flags can you guess correctly?";
        
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
        
        headingText.textContent = "Zen Mode";
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
        if (isMultiplayerMode) {
            scoreDisplay.textContent = `Score: ${score}/${multiplayerGame.flagCount}`;
        } else {
            scoreDisplay.textContent = `Score: ${score}/${total}`;
        }
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
        if (soundIcon && soundEffects) {
            soundIcon.textContent = soundEffects.enabled ? '🔊' : '🔇';
            const soundStatus = document.getElementById('sound-status');
            if (soundStatus) {
                soundStatus.textContent = soundEffects.enabled ? 'On' : 'Off';
            }
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
        
        // Clear any existing timer in multiplayer mode
        if (isMultiplayerMode && multiplayerTimer) {
            clearInterval(multiplayerTimer);
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
        
        // Update multiplayer player data
        if (isMultiplayerMode) {
            multiplayerGame.players[playerId].answers.push({
                flag: currentCountry.name,
                answer: selectedCountryName,
                correct: isCorrect,
                timestamp: Date.now()
            });
            multiplayerGame.players[playerId].score = score;
            saveMultiplayerGame();
        }
        
        updateTopBar();
        showFacts(currentCountry);
        showFlagTrivia(currentCountry);
        headingText.style.display = 'none';
        subHeadingText.style.display = 'none';
        
        if (isMultiplayerMode) {
            setTimeout(() => {
                nextMultiplayerFlag();
            }, 2000);
        } else if (!isDailyMode) {
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
        
        // Update best streak
        if (currentGameStreak > bestStreak) {
            bestStreak = currentGameStreak;
            localStorage.setItem('bestStreak', bestStreak.toString());
        }
        
        // Sound effect
        soundEffects.playCorrect();
        
        if (isChallengeMode || isZenMode) {
            updateTopBar();
            AnimationEffects.showConfetti();
            
            // Check for streak milestones
            if (isStreakMilestone(currentGameStreak)) {
                AnimationEffects.showStreakConfetti();
                soundEffects.playStreak();
            }
            
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
        } else if (isDailyMode || isMultiplayerMode) {
            // Daily mode or multiplayer - just show confetti
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
        document.getElementById('challenge-times-played-value').textContent = challengeStats.timesPlayed;
        document.getElementById('challenge-highest-score-value').textContent = challengeStats.highestScore;
        document.getElementById('challenge-total-score-value').textContent = challengeStats.totalScore;
        document.getElementById('stats-best-streak').textContent = bestStreak;
        
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

    function shareMultiplayerResult() {
        const accuracy = Math.round((score / multiplayerGame.flagCount) * 100);
        const shareText = `🌍 Flagtriv Challenge Friends\nScore: ${score}/${multiplayerGame.flagCount} (${accuracy}%)\nBest Streak: ${currentGameStreak}\nPlay: flagtriv.com`;
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
                // Handle share cancellation gracefully
                if (error.name === 'AbortError') {
                    console.log('Share was cancelled by user');
                } else {
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
                    showCopiedToast('Results copied to clipboard!');
                }
            } catch (err) {
                console.error('Unable to copy', err);
            }
            document.body.removeChild(textArea);
        }
    }

    function showCopiedToast(message = "🔥 Copied! Now challenge a friend.") {
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
    document.getElementById('share-multiplayer-result')?.addEventListener('click', shareMultiplayerResult);
    document.getElementById('play-again-multiplayer')?.addEventListener('click', () => {
        multiplayerResults.style.display = 'none';
        modeSelection.style.display = 'flex';
        
        // Clear URL parameters
        const url = new URL(window.location);
        url.searchParams.delete('game');
        window.history.replaceState({}, document.title, url);
        
        // Clear multiplayer data
        isMultiplayerMode = false;
        multiplayerGame = null;
        gameId = '';
        playerName = '';
        
        // Clear any intervals
        if (gameUpdateInterval) {
            clearInterval(gameUpdateInterval);
        }
        if (multiplayerTimer) {
            clearInterval(multiplayerTimer);
        }
    });

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