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
    let multiplayerGameId = null;
    let isHost = false;
    let playerNickname = '';
    let multiplayerTimer = null;
    let lobbyUpdateInterval = null;
    
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

        // Update UI
        updateTopBar();
        updateMainMenuStats();
        updateSoundToggle();
        updateContinentFilterButton();

        // Check if daily challenge is available
        updateDailyChallengeButton();

        // Check for multiplayer join from URL
        checkForMultiplayerJoin();

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
        document.getElementById('copy-challenge-link').addEventListener('click', copyLink);
        document.getElementById('join-challenge-btn').addEventListener('click', joinChallenge);
        document.getElementById('start-multiplayer-game').addEventListener('click', startMultiplayerGame);
        document.getElementById('share-multiplayer-result').addEventListener('click', shareMultiplayerResult);
        document.getElementById('play-again-multiplayer').addEventListener('click', () => {
            hideAllScreens();
            showCreateChallengeModal();
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
    }

    // Multiplayer Functions
    function checkForMultiplayerJoin() {
        const urlParams = new URLSearchParams(window.location.search);
        const gameId = urlParams.get('game');
        
        if (gameId) {
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Show join modal with pre-filled game ID
            document.getElementById('join-game-id').value = gameId;
            joinChallengeModal.style.display = 'block';
        }
    }

    function showCreateChallengeModal() {
        // Update continent display
        document.getElementById('challenge-continents').textContent = continentFilter.getSelectionText();
        
        // Reset modal state
        document.getElementById('challenge-link-display').style.display = 'none';
        
        createChallengeModal.style.display = 'block';
    }

    function createChallenge() {
        const flagCount = document.getElementById('flag-count-select').value;
        const gameId = generateGameId();
        
        // Create game data
        const gameData = {
            id: gameId,
            host: 'Host',
            flagCount: parseInt(flagCount),
            continents: continentFilter.selectedContinents,
            players: [{ name: 'Host', isHost: true, ready: true, score: 0 }],
            status: 'waiting',
            currentQuestion: 0,
            questions: [],
            createdAt: Date.now()
        };
        
        // Store game data
        localStorage.setItem(`multiplayer_game_${gameId}`, JSON.stringify(gameData));
        
        // Set up host state
        multiplayerGameId = gameId;
        isHost = true;
        playerNickname = 'Host';
        
        // Show link
        const gameUrl = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
        document.getElementById('challenge-link').value = gameUrl;
        document.getElementById('challenge-link-display').style.display = 'block';
        
        // Add "Go to Lobby" button
        if (!document.getElementById('go-to-lobby-btn')) {
            const goToLobbyBtn = document.createElement('button');
            goToLobbyBtn.id = 'go-to-lobby-btn';
            goToLobbyBtn.className = 'create-challenge-btn';
            goToLobbyBtn.textContent = '🏁 Go to Lobby';
            goToLobbyBtn.style.marginTop = '16px';
            goToLobbyBtn.addEventListener('click', () => {
                createChallengeModal.style.display = 'none';
                showMultiplayerLobby();
            });
            document.getElementById('challenge-link-display').appendChild(goToLobbyBtn);
        }
    }

    function copyLink() {
        const linkInput = document.getElementById('challenge-link');
        linkInput.select();
        linkInput.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            showCopiedToast();
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    }

    function joinChallenge() {
        const gameId = document.getElementById('join-game-id').value.trim();
        const nickname = document.getElementById('player-nickname').value.trim() || 'Player';
        
        if (!gameId) {
            alert('Please enter a game ID');
            return;
        }
        
        // Load game data
        const gameData = JSON.parse(localStorage.getItem(`multiplayer_game_${gameId}`));
        
        if (!gameData) {
            alert('Game not found. Please check the game ID.');
            return;
        }
        
        if (gameData.status !== 'waiting') {
            alert('This game has already started or ended.');
            return;
        }
        
        // Add player to game
        const newPlayer = { 
            name: nickname, 
            isHost: false, 
            ready: true, 
            score: 0,
            joinedAt: Date.now()
        };
        
        gameData.players.push(newPlayer);
        localStorage.setItem(`multiplayer_game_${gameId}`, JSON.stringify(gameData));
        
        // Set up player state
        multiplayerGameId = gameId;
        isHost = false;
        playerNickname = nickname;
        
        // Hide modal and show lobby
        joinChallengeModal.style.display = 'none';
        showMultiplayerLobby();
    }

    function showMultiplayerLobby() {
        hideAllScreens();
        multiplayerLobby.style.display = 'block';
        
        // Update lobby info
        const gameData = JSON.parse(localStorage.getItem(`multiplayer_game_${multiplayerGameId}`));
        if (gameData) {
            document.getElementById('lobby-game-id').textContent = multiplayerGameId;
            document.getElementById('lobby-flag-count').textContent = gameData.flagCount;
            document.getElementById('lobby-continents').textContent = continentFilter.getSelectionText();
            
            updatePlayersList(gameData.players);
            
            // Show start button only for host
            const startBtn = document.getElementById('start-multiplayer-game');
            const waitingText = document.getElementById('lobby-waiting');
            
            if (isHost) {
                startBtn.style.display = 'block';
                waitingText.style.display = 'none';
                
                // Add share section for host in lobby
                if (!document.getElementById('lobby-share-section')) {
                    const shareSection = document.createElement('div');
                    shareSection.id = 'lobby-share-section';
                    shareSection.innerHTML = `
                        <div style="margin: 20px 0; padding: 16px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #4CAF50;">
                            <h4 style="margin: 0 0 12px 0;">📤 Invite More Friends</h4>
                            <div class="link-container">
                                <input type="text" id="lobby-share-link" value="${window.location.origin}${window.location.pathname}?game=${multiplayerGameId}" readonly>
                                <button id="lobby-copy-link">📋 Copy</button>
                            </div>
                        </div>
                    `;
                    document.querySelector('.lobby-content').insertBefore(shareSection, document.querySelector('.players-section'));
                    
                    document.getElementById('lobby-copy-link').addEventListener('click', () => {
                        const linkInput = document.getElementById('lobby-share-link');
                        linkInput.select();
                        try {
                            document.execCommand('copy');
                            showCopiedToast();
                        } catch (err) {
                            console.error('Failed to copy link:', err);
                        }
                    });
                }
            } else {
                startBtn.style.display = 'none';
                waitingText.style.display = 'block';
            }
        }
        
        // Start polling for updates
        startLobbyPolling();
    }

    function startLobbyPolling() {
        // Clear any existing interval
        if (lobbyUpdateInterval) {
            clearInterval(lobbyUpdateInterval);
        }
        
        // Poll every 2 seconds for updates
        lobbyUpdateInterval = setInterval(() => {
            const gameData = JSON.parse(localStorage.getItem(`multiplayer_game_${multiplayerGameId}`));
            if (gameData) {
                updatePlayersList(gameData.players);
                
                // Check if game has started
                if (gameData.status === 'playing' && !isHost) {
                    clearInterval(lobbyUpdateInterval);
                    startMultiplayerGameplay(gameData);
                }
            }
        }, 2000);
    }

    function updatePlayersList(players) {
        const playersList = document.getElementById('players-list');
        playersList.innerHTML = '';
        
        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <span>${player.name}</span>
                <div>
                    ${player.isHost ? '<span class="host-badge">HOST</span>' : '<span class="player-status">Ready</span>'}
                </div>
            `;
            playersList.appendChild(playerDiv);
        });
    }

    function startMultiplayerGame() {
        const gameData = JSON.parse(localStorage.getItem(`multiplayer_game_${multiplayerGameId}`));
        if (!gameData || !isHost) return;
        
        // Generate questions
        const filteredCountries = continentFilter.filterCountries(countries);
        const countryCodes = Object.keys(filteredCountries);
        const questions = [];
        
        for (let i = 0; i < gameData.flagCount; i++) {
            const randomIndex = Math.floor(Math.random() * countryCodes.length);
            const countryCode = countryCodes[randomIndex];
            questions.push({
                country: filteredCountries[countryCode],
                options: generateOptionsForCountry(filteredCountries[countryCode], filteredCountries)
            });
            countryCodes.splice(randomIndex, 1);
        }
        
        gameData.questions = questions;
        gameData.status = 'playing';
        gameData.startedAt = Date.now();
        
        localStorage.setItem(`multiplayer_game_${multiplayerGameId}`, JSON.stringify(gameData));
        
        // Clear polling
        clearInterval(lobbyUpdateInterval);
        
        // Start gameplay
        startMultiplayerGameplay(gameData);
    }

    function startMultiplayerGameplay(gameData) {
        hideAllScreens();
        
        isMultiplayerMode = true;
        score = 0;
        total = 0;
        currentGameStreak = 0;
        usedCountries = [];
        
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        
        headingText.textContent = "Multiplayer Challenge";
        subHeadingText.textContent = `Question ${total + 1} of ${gameData.flagCount}`;
        
        // Add timer to top bar
        if (!document.getElementById('multiplayer-timer')) {
            const timerDiv = document.createElement('div');
            timerDiv.id = 'multiplayer-timer';
            timerDiv.className = 'multiplayer-timer';
            timerDiv.textContent = '⏱️ 30s';
            topBar.insertBefore(timerDiv, topBar.firstChild);
        }
        
        updateTopBar();
        nextMultiplayerQuestion(gameData);
    }

    function nextMultiplayerQuestion(gameData) {
        if (total >= gameData.questions.length) {
            endMultiplayerGame();
            return;
        }
        
        const question = gameData.questions[total];
        currentCountry = question.country;
        
        displayCountry();
        resetQuestionUI();
        
        // Update question counter
        subHeadingText.textContent = `Question ${total + 1} of ${gameData.flagCount}`;
        
        // Start 30-second timer
        startQuestionTimer();
    }

    function startQuestionTimer() {
        let timeLeft = 30;
        const timerElement = document.getElementById('multiplayer-timer');
        
        if (multiplayerTimer) {
            clearInterval(multiplayerTimer);
        }
        
        multiplayerTimer = setInterval(() => {
            timeLeft--;
            timerElement.textContent = `⏱️ ${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(multiplayerTimer);
                // Auto-submit wrong answer
                handleMultiplayerTimeout();
            }
        }, 1000);
    }

    function handleMultiplayerTimeout() {
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
        });
        
        message.textContent = "⏰ Time's up!";
        total++;
        
        updateTopBar();
        showFacts(currentCountry);
        showFlagTrivia(currentCountry);
        
        // Continue after 2 seconds
        setTimeout(() => {
            const gameData = JSON.parse(localStorage.getItem(`multiplayer_game_${multiplayerGameId}`));
            nextMultiplayerQuestion(gameData);
        }, 2000);
    }

    function endMultiplayerGame() {
        clearInterval(multiplayerTimer);
        
        // Update player score in game data
        const gameData = JSON.parse(localStorage.getItem(`multiplayer_game_${multiplayerGameId}`));
        const playerIndex = gameData.players.findIndex(p => p.name === playerNickname);
        if (playerIndex !== -1) {
            gameData.players[playerIndex].score = score;
            gameData.players[playerIndex].total = total;
            gameData.players[playerIndex].completedAt = Date.now();
        }
        
        gameData.status = 'completed';
        localStorage.setItem(`multiplayer_game_${multiplayerGameId}`, JSON.stringify(gameData));
        
        showMultiplayerResults(gameData);
    }

    function showMultiplayerResults(gameData) {
        hideAllScreens();
        multiplayerResults.style.display = 'block';
        
        // Calculate accuracy
        const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
        
        // Update final stats
        document.getElementById('final-score').textContent = `${score}/${total}`;
        document.getElementById('final-accuracy').textContent = `${accuracy}%`;
        
        // Determine result message
        const resultMessage = document.getElementById('result-message');
        if (accuracy >= 80) {
            resultMessage.textContent = '🏆 Excellent!';
        } else if (accuracy >= 60) {
            resultMessage.textContent = '🥈 Well Done!';
        } else {
            resultMessage.textContent = '🥉 Good Try!';
        }
    }

    function shareMultiplayerResult() {
        const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
        const shareText = `🌍 Flagtriv Multiplayer Challenge\nScore: ${score}/${total} (${accuracy}%)\nPlay with friends: flagtriv.com`;
        shareToClipboard(shareText);
    }

    function generateOptionsForCountry(correctCountry, allCountries) {
        const countryCodes = Object.keys(allCountries).filter(code => code !== correctCountry.alpha2Code);
        const incorrectAnswers = [];
        
        while (incorrectAnswers.length < 3 && countryCodes.length > 0) {
            const randomIndex = Math.floor(Math.random() * countryCodes.length);
            const countryCode = countryCodes[randomIndex];
            incorrectAnswers.push(allCountries[countryCode].name);
            countryCodes.splice(randomIndex, 1);
        }
        
        const allAnswers = [...incorrectAnswers, correctCountry.name];
        return allAnswers.sort(() => Math.random() - 0.5);
    }

    function generateGameId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    function hideAllScreens() {
        modeSelection.style.display = 'none';
        gameContainer.style.display = 'none';
        endlessGameOverScreen.style.display = 'none';
        dailyCompleteScreen.style.display = 'none';
        multiplayerLobby.style.display = 'none';
        multiplayerResults.style.display = 'none';
        topBar.style.display = 'none';
        
        // Hide modals
        createChallengeModal.style.display = 'none';
        joinChallengeModal.style.display = 'none';
        
        // Clear timers
        if (multiplayerTimer) {
            clearInterval(multiplayerTimer);
        }
        if (lobbyUpdateInterval) {
            clearInterval(lobbyUpdateInterval);
        }
    }

    // Regular game functions
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
        continentFilterBtn.textContent = continentFilter.getSelectionText().split(' ')[0];
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
        
        hideAllScreens();
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        
        currentCountry = dailyChallenge.getTodaysCountry();
        displayCountry();
        
        headingText.textContent = "Daily Challenge";
        subHeadingText.textContent = "One flag per day - make it count!";
        
        updateTopBar();
    }

    function startChallengeMode() {
        hideAllScreens();
        
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
        subHeadingText.textContent = "Test your flag knowledge!";
        
        nextCountry();
    }

    function startZenMode() {
        hideAllScreens();
        
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
        // Update streak
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
        
        // Clear timer for multiplayer
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

        options.forEach(button => {
            if (button.textContent === currentCountry.name) {
                button.classList.add('correct-answer');
            }
        });

        total++;
        if (isDailyMode) {
            dailyAttempts++;
        }
        
        if (isZenMode) {
            zenStats.totalFlags++;
        }
        
        updateTopBar();
        showFacts(currentCountry);
        showFlagTrivia(currentCountry);
        headingText.style.display = 'none';
        subHeadingText.style.display = 'none';
        
        if (isMultiplayerMode) {
            setTimeout(() => {
                const gameData = JSON.parse(localStorage.getItem(`multiplayer_game_${multiplayerGameId}`));
                nextMultiplayerQuestion(gameData);
            }, 2000);
        } else if (!isDailyMode) {
            nextBtn.hidden = false;
        }

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
        
        soundEffects.playCorrect();
        
        if (isChallengeMode) {
            AnimationEffects.showConfetti();
            
            achievementSystem.unlockCountry(currentCountry.alpha2Code, currentCountry);
            const newAchievements = achievementSystem.checkAchievements();
            newAchievements.forEach(achievement => {
                AnimationEffects.showAchievementUnlock(achievement);
            });
        } else if (isZenMode) {
            zenStats.totalCorrect++;
            if (currentGameStreak > zenStats.highestStreak) {
                zenStats.highestStreak = currentGameStreak;
            }
            
            updateTopBar();
            AnimationEffects.showConfetti();
        } else if (isDailyMode || isMultiplayerMode) {
            AnimationEffects.showConfetti();
        }
    }

    function handleWrongAnswer(button) {
        message.textContent = "😢 Oops, that's not correct.";
        button.classList.add('wrong-answer');
        
        soundEffects.playWrong();
        
        currentGameStreak = 0;
        updateTopBar();
        
        if (!isZenMode && !isMultiplayerMode) {
            loseLife();
        }
    }

    function completeDailyChallenge(correct) {
        dailyChallenge.submitResult(correct, dailyAttempts);
        
        hideAllScreens();
        dailyCompleteScreen.style.display = 'block';
        
        document.getElementById('daily-result-heading').textContent = correct ? 'Well Done!' : 'Better Luck Tomorrow!';
        document.getElementById('daily-result-flag').src = currentCountry.flag.large;
        document.getElementById('daily-result-country').textContent = currentCountry.name;
        document.getElementById('daily-attempts-display').textContent = `Attempts: ${dailyAttempts}/3`;
        document.getElementById('daily-streak-display').textContent = `Daily Streak: ${dailyChallenge.dailyStats.streak}`;
        
        const globalStat = flagFacts.getRandomGlobalStat();
        document.getElementById('daily-global-stat').textContent = globalStat;
        
        startCountdownTimer();
        updateDailyChallengeButton();
    }

    function startCountdownTimer() {
        const countdownElement = document.getElementById('countdown-timer');
        
        function updateCountdown() {
            countdownElement.textContent = dailyChallenge.getTimeUntilNext();
        }
        
        updateCountdown();
        setInterval(updateCountdown, 60000);
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

        hideAllScreens();
        endlessGameOverScreen.style.display = 'block';

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
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-stats`).classList.add('active');
        
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
        
        updateContinentProgress();
        
        const passportGrid = document.getElementById('passport-grid');
        passportGrid.innerHTML = '';
        
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
        document.getElementById('stats-best-streak').textContent = localStorage.getItem('bestStreak') || '0';
        document.getElementById('challenge-times-played-value').textContent = challengeStats.timesPlayed;
        document.getElementById('challenge-highest-score-value').textContent = challengeStats.highestScore;
        document.getElementById('challenge-total-score-value').textContent = challengeStats.totalScore;
        
        document.getElementById('zen-sessions-played').textContent = zenStats.sessionsPlayed;
        document.getElementById('zen-highest-streak').textContent = zenStats.highestStreak;
        document.getElementById('zen-total-flags').textContent = zenStats.totalFlags;
        const zenAccuracy = zenStats.totalFlags > 0 ? Math.round((zenStats.totalCorrect / zenStats.totalFlags) * 100) : 0;
        document.getElementById('zen-accuracy').textContent = `${zenAccuracy}%`;
        
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
            currentGameStreak: currentGameStreak
        };
        localStorage.setItem('countryGame', JSON.stringify(gameStateData));
        
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