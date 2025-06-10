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
    let multiplayerGameId = null;
    let multiplayerTimer = null;
    let multiplayerTimeLeft = 0;
    let multiplayerQuestionIndex = 0;
    let multiplayerAnswers = [];
    let isHost = false;
    let playerNickname = '';
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

    // Check for multiplayer game ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameIdFromUrl = urlParams.get('game');
    
    // Fetch countries data and initialize game
    fetch('countries.json')
        .then(response => response.json())
        .then(data => {
            countries = data;
            initializeGame();
            
            // Handle multiplayer join from URL
            if (gameIdFromUrl) {
                handleMultiplayerJoin(gameIdFromUrl);
            }
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
        document.getElementById('copy-challenge-link').addEventListener('click', copyChallengeLink);
        document.getElementById('start-multiplayer-game').addEventListener('click', startMultiplayerGame);

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
        document.getElementById('share-multiplayer-result')?.addEventListener('click', shareMultiplayerResult);
        document.getElementById('play-again-multiplayer')?.addEventListener('click', playAgainMultiplayer);

        // Handle page visibility changes for multiplayer sync
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    function handleMultiplayerJoin(gameId) {
        // Show join challenge modal with pre-filled game ID
        document.getElementById('join-game-id').value = gameId;
        joinChallengeModal.style.display = 'block';
        modeSelection.style.display = 'none';
    }

    function showCreateChallengeModal() {
        // Update continent display
        document.getElementById('challenge-continents').textContent = continentFilter.getSelectionText();
        createChallengeModal.style.display = 'block';
    }

    function createChallenge() {
        const flagCount = document.getElementById('flag-count-select').value;
        const gameId = generateGameId();
        const continents = continentFilter.selectedContinents;
        
        // Create challenge data
        const challengeData = {
            id: gameId,
            flagCount: parseInt(flagCount),
            continents: continents,
            host: 'Host',
            players: [{ name: 'Host', isHost: true, score: 0 }],
            status: 'waiting',
            currentQuestion: 0,
            questions: [],
            createdAt: Date.now()
        };

        // Generate questions
        const filteredCountries = continentFilter.filterCountries(countries);
        const countryCodes = Object.keys(filteredCountries);
        const selectedCountries = [];
        
        for (let i = 0; i < flagCount && countryCodes.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * countryCodes.length);
            const countryCode = countryCodes[randomIndex];
            selectedCountries.push(filteredCountries[countryCode]);
            countryCodes.splice(randomIndex, 1);
        }
        
        challengeData.questions = selectedCountries;

        // Store challenge data with a more persistent key
        const storageKey = `challenge_${gameId}`;
        localStorage.setItem(storageKey, JSON.stringify(challengeData));
        
        // Also store in a global challenges list for easier access
        const allChallenges = JSON.parse(localStorage.getItem('allChallenges') || '{}');
        allChallenges[gameId] = challengeData;
        localStorage.setItem('allChallenges', JSON.stringify(allChallenges));

        // Show challenge link
        const challengeLink = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
        document.getElementById('challenge-link').value = challengeLink;
        document.getElementById('challenge-link-display').style.display = 'block';
        
        // Set up as host
        isHost = true;
        multiplayerGameId = gameId;
        playerNickname = 'Host';

        // Add "Go to Lobby" button after creating challenge
        setTimeout(() => {
            const goToLobbyBtn = document.createElement('button');
            goToLobbyBtn.textContent = '🏁 Go to Lobby';
            goToLobbyBtn.className = 'create-challenge-btn';
            goToLobbyBtn.style.marginTop = '16px';
            goToLobbyBtn.onclick = () => {
                createChallengeModal.style.display = 'none';
                showMultiplayerLobby(challengeData);
            };
            
            const linkDisplay = document.getElementById('challenge-link-display');
            if (!linkDisplay.querySelector('.go-to-lobby-btn')) {
                goToLobbyBtn.classList.add('go-to-lobby-btn');
                linkDisplay.appendChild(goToLobbyBtn);
            }
        }, 100);
    }

    function generateGameId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    function copyChallengeLink() {
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
        const gameId = document.getElementById('join-game-id').value.trim().toUpperCase();
        const nickname = document.getElementById('player-nickname').value.trim() || `Player${Math.floor(Math.random() * 1000)}`;
        
        if (!gameId) {
            alert('Please enter a game ID');
            return;
        }

        // Try to find the challenge data
        let challengeData = null;
        
        // First try the specific storage key
        const storageKey = `challenge_${gameId}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
            challengeData = JSON.parse(storedData);
        } else {
            // Try the global challenges list
            const allChallenges = JSON.parse(localStorage.getItem('allChallenges') || '{}');
            challengeData = allChallenges[gameId];
        }

        if (!challengeData) {
            alert('Game not found. Please check the game ID.');
            return;
        }

        // Add player to the challenge
        const existingPlayer = challengeData.players.find(p => p.name === nickname);
        if (!existingPlayer) {
            challengeData.players.push({
                name: nickname,
                isHost: false,
                score: 0,
                answers: []
            });
        }

        // Save updated challenge data
        localStorage.setItem(storageKey, JSON.stringify(challengeData));
        
        const allChallenges = JSON.parse(localStorage.getItem('allChallenges') || '{}');
        allChallenges[gameId] = challengeData;
        localStorage.setItem('allChallenges', JSON.stringify(allChallenges));

        // Set up player state
        isHost = false;
        multiplayerGameId = gameId;
        playerNickname = nickname;
        
        // Hide join modal and show lobby
        joinChallengeModal.style.display = 'none';
        showMultiplayerLobby(challengeData);
    }

    function showMultiplayerLobby(challengeData) {
        modeSelection.style.display = 'none';
        createChallengeModal.style.display = 'none';
        multiplayerLobby.style.display = 'block';
        
        // Update lobby info
        document.getElementById('lobby-game-id').textContent = challengeData.id;
        document.getElementById('lobby-flag-count').textContent = challengeData.flagCount;
        
        const continentText = challengeData.continents.includes('all') ? 
            '🌐 All Continents' : 
            `🌍 ${challengeData.continents.length} Continents`;
        document.getElementById('lobby-continents').textContent = continentText;
        
        // Update players list
        updatePlayersDisplay(challengeData);
        
        // Show start button only for host
        const startBtn = document.getElementById('start-multiplayer-game');
        const waitingText = document.getElementById('lobby-waiting');
        
        if (isHost) {
            startBtn.style.display = 'block';
            waitingText.style.display = 'none';
            
            // Add share link button for host in lobby
            addShareLinkToLobby();
        } else {
            startBtn.style.display = 'none';
            waitingText.style.display = 'block';
        }
        
        // Start polling for updates if not host
        if (!isHost) {
            startLobbyPolling();
        }
    }

    function addShareLinkToLobby() {
        // Add a share link button in the lobby for the host
        const lobbyContent = document.querySelector('.lobby-content');
        let shareSection = lobbyContent.querySelector('.lobby-share-section');
        
        if (!shareSection) {
            shareSection = document.createElement('div');
            shareSection.className = 'lobby-share-section';
            shareSection.style.marginTop = '16px';
            shareSection.style.padding = '16px';
            shareSection.style.backgroundColor = '#f8f9fa';
            shareSection.style.borderRadius = '8px';
            shareSection.style.borderLeft = '4px solid #9b59b6';
            
            const challengeLink = `${window.location.origin}${window.location.pathname}?game=${multiplayerGameId}`;
            
            shareSection.innerHTML = `
                <p style="margin: 0 0 12px 0; font-weight: 500;">📤 Share with more friends:</p>
                <div style="display: flex; gap: 8px;">
                    <input type="text" value="${challengeLink}" readonly style="flex: 1; padding: 8px; border: 2px solid #e0e0e0; border-radius: 4px; font-family: monospace; font-size: 12px;">
                    <button onclick="copyLobbyLink()" style="background: #9b59b6; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">📋 Copy</button>
                </div>
            `;
            
            // Insert before the start button
            const startBtn = document.getElementById('start-multiplayer-game');
            lobbyContent.insertBefore(shareSection, startBtn);
        }
    }

    // Make copyLobbyLink available globally
    window.copyLobbyLink = function() {
        const input = document.querySelector('.lobby-share-section input');
        input.select();
        input.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            showCopiedToast();
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    function updatePlayersDisplay(challengeData) {
        const playersList = document.getElementById('players-list');
        playersList.innerHTML = '';
        
        challengeData.players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <span>${player.name}</span>
                ${player.isHost ? '<span class="host-badge">HOST</span>' : '<span class="player-status">Ready</span>'}
            `;
            playersList.appendChild(playerDiv);
        });
    }

    function startLobbyPolling() {
        const pollInterval = setInterval(() => {
            if (!multiplayerGameId) {
                clearInterval(pollInterval);
                return;
            }
            
            const challengeData = getMultiplayerGameData();
            if (challengeData) {
                if (challengeData.status === 'playing') {
                    clearInterval(pollInterval);
                    startMultiplayerGameplay(challengeData);
                } else {
                    updatePlayersDisplay(challengeData);
                }
            }
        }, 2000);
    }

    function startMultiplayerGame() {
        if (!isHost) return;
        
        const challengeData = getMultiplayerGameData();
        if (!challengeData) return;
        
        challengeData.status = 'playing';
        challengeData.startTime = Date.now();
        saveMultiplayerGameData(challengeData);
        
        startMultiplayerGameplay(challengeData);
    }

    function startMultiplayerGameplay(challengeData) {
        isMultiplayerMode = true;
        multiplayerQuestionIndex = 0;
        multiplayerAnswers = [];
        score = 0;
        total = 0;
        
        // Hide lobby and show game
        multiplayerLobby.style.display = 'none';
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        
        // Update UI for multiplayer
        headingText.textContent = "🧑‍🤝‍🧑 Challenge Mode";
        subHeadingText.textContent = `Playing with ${challengeData.players.length} players`;
        
        // Start first question
        showMultiplayerQuestion(challengeData);
        updateTopBar();
    }

    function showMultiplayerQuestion(challengeData) {
        if (multiplayerQuestionIndex >= challengeData.questions.length) {
            endMultiplayerGame();
            return;
        }
        
        currentCountry = challengeData.questions[multiplayerQuestionIndex];
        hasAnsweredCurrentQuestion = false;
        
        // Display the flag and options
        displayCountry();
        resetQuestionUI();
        
        // Start timer
        multiplayerTimeLeft = 10;
        updateMultiplayerTimer();
        
        multiplayerTimer = setInterval(() => {
            multiplayerTimeLeft--;
            updateMultiplayerTimer();
            
            if (multiplayerTimeLeft <= 0) {
                clearInterval(multiplayerTimer);
                if (!hasAnsweredCurrentQuestion) {
                    submitMultiplayerAnswer(null, false);
                }
            }
        }, 1000);
    }

    function updateMultiplayerTimer() {
        // Update timer display in top bar
        const timerElement = document.querySelector('.multiplayer-timer');
        if (timerElement) {
            timerElement.textContent = `⏱️ ${multiplayerTimeLeft}s`;
        } else {
            // Create timer element if it doesn't exist
            const timer = document.createElement('div');
            timer.className = 'multiplayer-timer';
            timer.textContent = `⏱️ ${multiplayerTimeLeft}s`;
            topBar.appendChild(timer);
        }
    }

    function submitMultiplayerAnswer(selectedAnswer, isCorrect) {
        if (hasAnsweredCurrentQuestion) return;
        
        hasAnsweredCurrentQuestion = true;
        clearInterval(multiplayerTimer);
        
        // Record answer
        multiplayerAnswers.push({
            question: multiplayerQuestionIndex,
            answer: selectedAnswer,
            correct: isCorrect,
            timeLeft: multiplayerTimeLeft
        });
        
        if (isCorrect) {
            score++;
            currentGameStreak++;
        } else {
            currentGameStreak = 0;
        }
        
        total++;
        updateTopBar();
        
        // Show result briefly then move to next question
        setTimeout(() => {
            multiplayerQuestionIndex++;
            const challengeData = getMultiplayerGameData();
            if (challengeData) {
                showMultiplayerQuestion(challengeData);
            }
        }, 2000);
    }

    function endMultiplayerGame() {
        clearInterval(multiplayerTimer);
        
        // Remove timer from UI
        const timerElement = document.querySelector('.multiplayer-timer');
        if (timerElement) {
            timerElement.remove();
        }
        
        // Save final score
        const challengeData = getMultiplayerGameData();
        if (challengeData) {
            const player = challengeData.players.find(p => p.name === playerNickname);
            if (player) {
                player.score = score;
                player.answers = multiplayerAnswers;
            }
            saveMultiplayerGameData(challengeData);
        }
        
        // Show results
        showMultiplayerResults();
    }

    function showMultiplayerResults() {
        gameContainer.style.display = 'none';
        topBar.style.display = 'none';
        multiplayerResults.style.display = 'block';
        
        const challengeData = getMultiplayerGameData();
        if (!challengeData) return;
        
        // Sort players by score
        const sortedPlayers = [...challengeData.players].sort((a, b) => (b.score || 0) - (a.score || 0));
        
        // Update results display
        document.getElementById('final-score').textContent = `${score}/${total}`;
        const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
        document.getElementById('final-accuracy').textContent = `${accuracy}%`;
        
        // Show winner message
        const resultMessage = document.getElementById('result-message');
        if (sortedPlayers[0] && sortedPlayers[0].name === playerNickname) {
            resultMessage.textContent = '🏆 You Won!';
            AnimationEffects.showConfetti();
        } else {
            resultMessage.textContent = '🏁 Game Complete';
        }
    }

    function shareMultiplayerResult() {
        const challengeData = getMultiplayerGameData();
        if (!challengeData) return;
        
        const shareText = `🧑‍🤝‍🧑 Flagtriv Challenge\nI scored ${score}/${total} (${Math.round((score/total)*100)}%)\nPlay: ${window.location.origin}${window.location.pathname}`;
        shareToClipboard(shareText);
    }

    function playAgainMultiplayer() {
        // Reset to main menu
        multiplayerResults.style.display = 'none';
        modeSelection.style.display = 'flex';
        isMultiplayerMode = false;
        multiplayerGameId = null;
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    function getMultiplayerGameData() {
        if (!multiplayerGameId) return null;
        
        const storageKey = `challenge_${multiplayerGameId}`;
        const data = localStorage.getItem(storageKey);
        return data ? JSON.parse(data) : null;
    }

    function saveMultiplayerGameData(data) {
        if (!multiplayerGameId) return;
        
        const storageKey = `challenge_${multiplayerGameId}`;
        localStorage.setItem(storageKey, JSON.stringify(data));
        
        // Also update global challenges list
        const allChallenges = JSON.parse(localStorage.getItem('allChallenges') || '{}');
        allChallenges[multiplayerGameId] = data;
        localStorage.setItem('allChallenges', JSON.stringify(allChallenges));
    }

    function handleVisibilityChange() {
        if (!isMultiplayerMode || document.hidden) return;
        
        // Sync multiplayer state when returning to tab
        syncMultiplayerState();
    }

    function syncMultiplayerState() {
        const challengeData = getMultiplayerGameData();
        if (!challengeData || challengeData.status !== 'playing') return;
        
        // If we're behind on questions, catch up
        if (multiplayerQuestionIndex < challengeData.currentQuestion) {
            multiplayerQuestionIndex = challengeData.currentQuestion;
            showMultiplayerQuestion(challengeData);
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
        
        modeSelection.style.display = 'none';
        gameContainer.style.display = 'flex';
        topBar.style.display = 'flex';
        
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
        
        headingText.textContent = "🌿 Zen Mode";
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
        
        // Handle multiplayer mode
        if (isMultiplayerMode) {
            submitMultiplayerAnswer(selectedCountryName, isCorrect);
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
        
        if (!isDailyMode && !isMultiplayerMode) {
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
        
        if (isZenMode) {
            zenStats.totalCorrect++;
            if (currentGameStreak > zenStats.highestStreak) {
                zenStats.highestStreak = currentGameStreak;
            }
            updateTopBar();
            AnimationEffects.showConfetti();
        } else if (!isMultiplayerMode) {
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
        
        gameContainer.style.display = 'none';
        topBar.style.display = 'none';
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