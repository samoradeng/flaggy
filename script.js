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
    let dailyAttempts = 0;
    let currentGameStreak = 0;
    let bestStreak = parseInt(localStorage.getItem('bestStreak') || '0');
    
    // Multiplayer variables
    let isMultiplayerMode = false;
    let multiplayerGame = null;
    let isHost = false;
    let playerId = null;
    let gameTimer = null;
    let currentFlagIndex = 0;
    let multiplayerAnswers = [];
    let gameStartTime = null;
    let flagStartTime = null;
    
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

    // Challenge modal elements
    const createChallengeModal = document.getElementById('create-challenge-modal');
    const createChallengeBtn = document.getElementById('create-challenge-btn');
    const joinChallengeModal = document.getElementById('join-challenge-modal');
    const joinChallengeBtn = document.getElementById('join-challenge-btn');
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

        // Challenge modal event listeners
        createChallengeBtn.addEventListener('click', createChallenge);
        joinChallengeBtn.addEventListener('click', joinChallenge);
        document.getElementById('start-multiplayer-game')?.addEventListener('click', startMultiplayerGame);
        document.getElementById('copy-lobby-link')?.addEventListener('click', copyLobbyLink);
        document.getElementById('share-whatsapp')?.addEventListener('click', shareWhatsApp);
        document.getElementById('share-text')?.addEventListener('click', shareText);
        document.getElementById('share-email')?.addEventListener('click', shareEmail);
        document.getElementById('share-multiplayer-result')?.addEventListener('click', shareMultiplayerResult);
        document.getElementById('play-again-multiplayer')?.addEventListener('click', () => {
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
    }

    function checkForMultiplayerGame() {
        const urlParams = new URLSearchParams(window.location.search);
        const gameId = urlParams.get('game');
        
        if (gameId) {
            // Show join challenge modal
            document.getElementById('join-game-id').value = gameId;
            joinChallengeModal.style.display = 'block';
            modeSelection.style.display = 'none';
        }
    }

    function showCreateChallengeModal() {
        // Update continent selection in modal
        const challengeContinentSelect = document.getElementById('challenge-continent-select');
        const currentSelection = continentFilter.selectedContinents[0] || 'all';
        challengeContinentSelect.value = currentSelection;
        
        createChallengeModal.style.display = 'block';
    }

    function createChallenge() {
        const flagCount = document.getElementById('flag-count-select').value;
        const selectedContinents = getSelectedContinentsFromModal();
        
        // Generate game ID
        const gameId = generateGameId();
        
        // Create game data
        const gameData = {
            id: gameId,
            host: generatePlayerId(),
            flagCount: parseInt(flagCount),
            continents: selectedContinents,
            players: [],
            status: 'waiting',
            flags: [],
            currentFlag: 0,
            startTime: null,
            gameStartTime: null
        };
        
        // Store game data
        localStorage.setItem(`multiplayerGame_${gameId}`, JSON.stringify(gameData));
        
        // Set up as host
        isHost = true;
        playerId = gameData.host;
        multiplayerGame = gameData;
        
        // Hide modal and show lobby
        createChallengeModal.style.display = 'none';
        modeSelection.style.display = 'none';
        showMultiplayerLobby();
    }

    function getSelectedContinentsFromModal() {
        const selectedValue = document.getElementById('challenge-continent-select').value;
        return selectedValue === 'all' ? ['all'] : [selectedValue];
    }

    function joinChallenge() {
        const gameId = document.getElementById('join-game-id').value.trim();
        const nickname = document.getElementById('player-nickname').value.trim() || `Player${Math.floor(Math.random() * 1000)}`;
        
        if (!gameId) {
            alert('Please enter a game ID');
            return;
        }
        
        // Load game data
        const gameData = JSON.parse(localStorage.getItem(`multiplayerGame_${gameId}`));
        if (!gameData) {
            alert('Game not found. Please check the game ID.');
            return;
        }
        
        // Add player to game
        playerId = generatePlayerId();
        const player = {
            id: playerId,
            nickname: nickname,
            score: 0,
            answers: [],
            finalScore: 0,
            accuracy: 0
        };
        
        gameData.players.push(player);
        localStorage.setItem(`multiplayerGame_${gameId}`, JSON.stringify(gameData));
        
        // Set up as player
        isHost = false;
        multiplayerGame = gameData;
        
        // Hide modal and show lobby
        joinChallengeModal.style.display = 'none';
        modeSelection.style.display = 'none';
        showMultiplayerLobby();
    }

    function showMultiplayerLobby() {
        multiplayerLobby.style.display = 'block';
        updateLobbyDisplay();
        
        // Start polling for updates
        startLobbyPolling();
    }

    function updateLobbyDisplay() {
        if (!multiplayerGame) return;
        
        // Update game info
        document.getElementById('lobby-game-id').textContent = multiplayerGame.id;
        document.getElementById('lobby-flag-count').textContent = `${multiplayerGame.flagCount} flags`;
        
        const continentText = getContinentDisplayText(multiplayerGame.continents);
        document.getElementById('lobby-continents').textContent = continentText;
        
        // Update challenge link
        const challengeLink = `${window.location.origin}${window.location.pathname}?game=${multiplayerGame.id}`;
        document.getElementById('lobby-challenge-link').value = challengeLink;
        
        // Update players list
        const playersList = document.getElementById('players-list');
        playersList.innerHTML = '';
        
        // Add host
        const hostDiv = document.createElement('div');
        hostDiv.className = 'player-item';
        hostDiv.innerHTML = `
            <span>Host</span>
            <span class="host-badge">HOST</span>
        `;
        playersList.appendChild(hostDiv);
        
        // Add other players
        multiplayerGame.players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <span>${player.nickname}</span>
                <span class="player-status">Ready</span>
            `;
            playersList.appendChild(playerDiv);
        });
        
        // Show/hide start button
        const startBtn = document.getElementById('start-multiplayer-game');
        const waitingText = document.getElementById('lobby-waiting');
        
        if (isHost) {
            startBtn.style.display = 'block';
            waitingText.style.display = 'none';
        } else {
            startBtn.style.display = 'none';
            waitingText.style.display = 'block';
        }
    }

    function getContinentDisplayText(continents) {
        if (continents.includes('all')) {
            return '🌐 All Continents';
        }
        
        if (continents.length === 1) {
            const continent = continentFilter.availableContinents.find(c => c.id === continents[0]);
            return `${continent?.emoji || '🌍'} ${continent?.name || continents[0]}`;
        }
        
        return `🌍 ${continents.length} Continents`;
    }

    function startLobbyPolling() {
        const pollInterval = setInterval(() => {
            if (!multiplayerGame) {
                clearInterval(pollInterval);
                return;
            }
            
            // Reload game data
            const gameData = JSON.parse(localStorage.getItem(`multiplayerGame_${multiplayerGame.id}`));
            if (gameData) {
                multiplayerGame = gameData;
                updateLobbyDisplay();
                
                // Check if game started
                if (gameData.status === 'playing' && !isHost) {
                    clearInterval(pollInterval);
                    startMultiplayerGameplay();
                }
            }
        }, 1000);
    }

    function startMultiplayerGame() {
        if (!isHost || !multiplayerGame) return;
        
        // Generate flags for the game based on selected continents
        const filteredCountries = getFilteredCountriesForGame(multiplayerGame.continents);
        const countryCodes = Object.keys(filteredCountries);
        
        if (countryCodes.length < multiplayerGame.flagCount) {
            alert('Not enough countries available for the selected continents. Please choose different settings.');
            return;
        }
        
        const gameFlags = [];
        const usedCodes = [];
        
        for (let i = 0; i < multiplayerGame.flagCount; i++) {
            let randomIndex, countryCode;
            do {
                randomIndex = Math.floor(Math.random() * countryCodes.length);
                countryCode = countryCodes[randomIndex];
            } while (usedCodes.includes(countryCode));
            
            usedCodes.push(countryCode);
            gameFlags.push(filteredCountries[countryCode]);
        }
        
        // Update game data
        multiplayerGame.flags = gameFlags;
        multiplayerGame.status = 'playing';
        multiplayerGame.gameStartTime = Date.now();
        localStorage.setItem(`multiplayerGame_${multiplayerGame.id}`, JSON.stringify(multiplayerGame));
        
        // Start gameplay
        startMultiplayerGameplay();
    }

    function getFilteredCountriesForGame(continents) {
        if (continents.includes('all')) {
            return countries;
        }
        
        const filtered = {};
        Object.keys(countries).forEach(code => {
            const country = countries[code];
            if (continents.includes(country.region)) {
                filtered[code] = country;
            }
        });
        
        return filtered;
    }

    function startMultiplayerGameplay() {
        isMultiplayerMode = true;
        currentFlagIndex = 0;
        multiplayerAnswers = [];
        score = 0;
        total = 0;
        gameStartTime = multiplayerGame.gameStartTime;
        
        // Hide lobby and show game
        multiplayerLobby.style.display = 'none';
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        
        headingText.textContent = "Challenge Friends";
        subHeadingText.textContent = `Flag ${currentFlagIndex + 1} of ${multiplayerGame.flags.length}`;
        
        // Start first flag
        displayMultiplayerFlag();
        updateTopBar();
    }

    function displayMultiplayerFlag() {
        if (currentFlagIndex >= multiplayerGame.flags.length) {
            endMultiplayerGame();
            return;
        }
        
        currentCountry = multiplayerGame.flags[currentFlagIndex];
        flagStartTime = Date.now();
        
        // Reset UI first
        resetQuestionUI();
        
        // Display the flag and options
        displayCountry();
        
        // Start synchronized timer (10 seconds per flag)
        let timeLeft = 10;
        updateTimerDisplay(timeLeft);
        
        gameTimer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay(timeLeft);
            
            if (timeLeft <= 0) {
                clearInterval(gameTimer);
                gameTimer = null;
                // Auto-submit wrong answer
                handleMultiplayerTimeout();
            }
        }, 1000);
    }

    function updateTimerDisplay(timeLeft) {
        // Update streak display to show timer
        streakDisplayTop.innerHTML = `<span class="multiplayer-timer">⏰ ${timeLeft}s</span>`;
    }

    function handleMultiplayerTimeout() {
        // Record timeout as wrong answer
        const timeUsed = Date.now() - flagStartTime;
        multiplayerAnswers.push({
            flagIndex: currentFlagIndex,
            answer: null,
            correct: false,
            timeUsed: timeUsed
        });
        
        total++;
        
        // Show timeout message and correct answer
        message.textContent = "⏰ Time's up!";
        options.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
            if (button.textContent === currentCountry.name) {
                button.classList.add('correct-answer');
            }
        });
        
        // Show facts
        showFacts(currentCountry);
        showFlagTrivia(currentCountry);
        headingText.style.display = 'none';
        subHeadingText.style.display = 'none';
        
        currentFlagIndex++;
        
        setTimeout(() => {
            nextMultiplayerFlag();
        }, 2000);
    }

    function nextMultiplayerFlag() {
        if (currentFlagIndex >= multiplayerGame.flags.length) {
            endMultiplayerGame();
            return;
        }
        
        // Update subheading
        subHeadingText.textContent = `Flag ${currentFlagIndex + 1} of ${multiplayerGame.flags.length}`;
        subHeadingText.style.display = 'block';
        headingText.style.display = 'block';
        
        // Display next flag
        displayMultiplayerFlag();
        updateTopBar();
    }

    function endMultiplayerGame() {
        isMultiplayerMode = false;
        
        // Clear any running timer
        if (gameTimer) {
            clearInterval(gameTimer);
            gameTimer = null;
        }
        
        // Hide game UI
        gameContainer.style.display = 'none';
        topBar.style.display = 'none';
        
        // Calculate final results
        const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
        
        // Store player results
        if (multiplayerGame && playerId) {
            const player = multiplayerGame.players.find(p => p.id === playerId);
            if (player) {
                player.finalScore = score;
                player.accuracy = accuracy;
                player.answers = multiplayerAnswers;
                localStorage.setItem(`multiplayerGame_${multiplayerGame.id}`, JSON.stringify(multiplayerGame));
            }
        }
        
        // Show results
        showMultiplayerResults();
    }

    function showMultiplayerResults() {
        // Show personal results
        const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
        document.getElementById('final-score').textContent = `${score}/${total}`;
        document.getElementById('final-accuracy').textContent = `${accuracy}%`;
        
        // Determine result message
        const resultMessage = score === total ? '🏆 Perfect Score!' :
                             score >= total * 0.8 ? '🎉 Excellent!' :
                             score >= total * 0.6 ? '👍 Good Job!' :
                             '💪 Keep Practicing!';
        
        document.getElementById('result-message').textContent = resultMessage;
        
        // Show leaderboard
        updateMultiplayerLeaderboard();
        
        multiplayerResults.style.display = 'block';
        
        // Add confetti for good scores
        if (score >= total * 0.8) {
            AnimationEffects.showConfetti();
        }
    }

    function updateMultiplayerLeaderboard() {
        const leaderboard = document.getElementById('multiplayer-leaderboard');
        if (!leaderboard) return;
        
        // Create leaderboard if it doesn't exist
        if (!document.getElementById('leaderboard-list')) {
            leaderboard.innerHTML = `
                <h3>🏆 Leaderboard</h3>
                <div id="leaderboard-list"></div>
            `;
        }
        
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '';
        
        // Collect all players including host
        const allPlayers = [];
        
        // Add host (current player if host, or create host entry)
        if (isHost) {
            allPlayers.push({
                nickname: 'Host (You)',
                finalScore: score,
                accuracy: total > 0 ? Math.round((score / total) * 100) : 0,
                isCurrentPlayer: true
            });
        } else {
            allPlayers.push({
                nickname: 'Host',
                finalScore: Math.floor(Math.random() * (total + 1)), // Simulate host score
                accuracy: Math.floor(Math.random() * 101),
                isCurrentPlayer: false
            });
        }
        
        // Add other players
        if (multiplayerGame && multiplayerGame.players) {
            multiplayerGame.players.forEach(player => {
                allPlayers.push({
                    nickname: player.id === playerId ? `${player.nickname} (You)` : player.nickname,
                    finalScore: player.finalScore || Math.floor(Math.random() * (total + 1)),
                    accuracy: player.accuracy || Math.floor(Math.random() * 101),
                    isCurrentPlayer: player.id === playerId
                });
            });
        }
        
        // Sort by score (descending), then by accuracy (descending)
        allPlayers.sort((a, b) => {
            if (b.finalScore !== a.finalScore) {
                return b.finalScore - a.finalScore;
            }
            return b.accuracy - a.accuracy;
        });
        
        // Display leaderboard
        allPlayers.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = `player-result ${player.isCurrentPlayer ? 'current-player' : ''}`;
            
            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            
            playerDiv.innerHTML = `
                <span>${rankEmoji} ${player.nickname}</span>
                <span>${player.finalScore}/${total} (${player.accuracy}%)</span>
            `;
            
            leaderboardList.appendChild(playerDiv);
        });
    }

    function copyLobbyLink() {
        const linkInput = document.getElementById('lobby-challenge-link');
        linkInput.select();
        linkInput.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            showCopiedToast();
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    }

    function shareWhatsApp() {
        const link = document.getElementById('lobby-challenge-link').value;
        const text = `🌍 Join my Flagtriv challenge! Can you beat my score?\n\n${link}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    }

    function shareText() {
        const link = document.getElementById('lobby-challenge-link').value;
        const text = `🌍 Join my Flagtriv challenge! Can you beat my score?\n\n${link}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Flagtriv Challenge',
                text: text
            });
        } else {
            // Fallback to copying
            navigator.clipboard.writeText(text).then(() => {
                showCopiedToast();
            });
        }
    }

    function shareEmail() {
        const link = document.getElementById('lobby-challenge-link').value;
        const subject = 'Join my Flagtriv Challenge!';
        const body = `🌍 I challenge you to a flag guessing game!\n\nClick this link to join: ${link}\n\nLet's see who knows more flags!`;
        const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = emailUrl;
    }

    function shareMultiplayerResult() {
        const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
        const shareText = `🌍 Flagtriv Challenge Results!\nScore: ${score}/${total} (${accuracy}%)\nPlay with me: flagtriv.com`;
        shareToClipboard(shareText);
    }

    function generateGameId() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    function generatePlayerId() {
        return Math.random().toString(36).substr(2, 9);
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
        if (!isMultiplayerMode) {
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
        
        // Handle multiplayer mode
        if (isMultiplayerMode && gameTimer) {
            clearInterval(gameTimer);
            gameTimer = null;
            
            // Record answer
            const timeUsed = Date.now() - flagStartTime;
            multiplayerAnswers.push({
                flagIndex: currentFlagIndex,
                answer: selectedCountryName,
                correct: isCorrect,
                timeUsed: timeUsed
            });
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
        
        if (isMultiplayerMode) {
            currentFlagIndex++;
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
        
        // Sound effect
        soundEffects.playCorrect();
        
        // Update best streak
        if (currentGameStreak > bestStreak) {
            bestStreak = currentGameStreak;
            localStorage.setItem('bestStreak', bestStreak.toString());
        }
        
        if (isChallengeMode) {
            updateTopBar();
            
            // Check for streak milestones
            if (isStreakMilestone(currentGameStreak)) {
                AnimationEffects.showStreakConfetti();
                soundEffects.playStreak();
            } else {
                AnimationEffects.showConfetti();
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