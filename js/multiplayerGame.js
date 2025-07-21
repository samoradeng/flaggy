class MultiplayerGame {
    constructor(countries, continentFilter, flagFacts, soundEffects) {
        this.countries = countries;
        this.continentFilter = continentFilter;
        this.flagFacts = flagFacts;
        this.soundEffects = soundEffects;
        this.multiplayerSync = new MultiplayerSync();
        
        this.currentFlag = null;
        this.gameFlags = [];
        this.currentFlagIndex = 0;
        this.playerAnswers = [];
        this.gameStartTime = null;
        this.roundStartTime = null;
        this.timerElement = null;
        this.gameEnded = false; // Track if game has ended
        this.lastFlagIndex = -1; // Track last displayed flag to prevent skipping
        this.totalFlagsInGame = 10; // Track total flags for UI display
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Create Challenge Modal
        document.getElementById('challenge-friends-btn').addEventListener('click', () => {
            this.showCreateChallengeModal();
        });

        document.getElementById('create-challenge-btn').addEventListener('click', () => {
            this.createChallenge();
        });

        // Join Challenge
        document.getElementById('join-challenge-btn').addEventListener('click', () => {
            this.joinChallenge();
        });

        // Lobby actions
        document.getElementById('start-multiplayer-game').addEventListener('click', () => {
            this.startMultiplayerGame();
        });

        document.getElementById('copy-lobby-link').addEventListener('click', () => {
            this.copyLobbyLink();
        });

        // Share buttons (removed email)
        document.getElementById('share-whatsapp').addEventListener('click', () => {
            this.shareViaWhatsApp();
        });

        document.getElementById('share-text').addEventListener('click', () => {
            this.shareViaText();
        });

        // Results actions
        document.getElementById('share-multiplayer-result').addEventListener('click', () => {
            this.shareResults();
        });

        document.getElementById('play-again-multiplayer').addEventListener('click', () => {
            this.playAgain();
        });

        // Handle URL parameters for joining games
        this.checkForGameInvite();
    }

    checkForGameInvite() {
        const urlParams = new URLSearchParams(window.location.search);
        const gameId = urlParams.get('game');
        
        if (gameId) {
            // Auto-open join modal
            document.getElementById('join-game-id').value = gameId;
            document.getElementById('join-challenge-modal').style.display = 'block';
            
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    showCreateChallengeModal() {
        document.getElementById('create-challenge-modal').style.display = 'block';
    }

    async createChallenge() {
        const flagCount = parseInt(document.getElementById('flag-count-select').value);
        const continent = document.getElementById('challenge-continent-select').value;
        const hostNickname = document.getElementById('host-nickname').value.trim();
        
        // Use provided nickname or default to "Host"
        const finalNickname = hostNickname || 'Host';
        
        console.log('🎮 Creating challenge with:', {
            flagCount,
            continent,
            hostNickname: finalNickname
        });
        
        const result = await this.multiplayerSync.createGame(flagCount, continent, finalNickname);
        
        if (result.success) {
            document.getElementById('create-challenge-modal').style.display = 'none';
            this.showLobby(result.gameId, continent, flagCount);
        } else {
            alert('Failed to create challenge: ' + result.error);
        }
    }

    async joinChallenge() {
        const gameId = document.getElementById('join-game-id').value.trim().toUpperCase();
        const nickname = document.getElementById('player-nickname').value.trim();
        
        if (!gameId) {
            alert('Please enter a game ID');
            return;
        }

        const result = await this.multiplayerSync.joinGame(gameId, nickname);
        
        if (result.success) {
            document.getElementById('join-challenge-modal').style.display = 'none';
            
            // Check if game is already finished
            if (result.gameState.status === 'finished') {
                this.showGameFinishedModal(result.gameState);
            } else {
                this.showLobby(gameId, result.gameState.continent, result.gameState.totalFlags);
            }
        } else {
            alert('Failed to join challenge: ' + result.error);
        }
    }

    showGameFinishedModal(gameState) {
        // Show the game finished modal for late joiners
        document.getElementById('game-finished-modal').style.display = 'block';
        
        // Populate the leaderboard
        const lateJoinerResults = document.getElementById('late-joiner-results');
        lateJoinerResults.innerHTML = '';
        
        // Sort players by score
        const players = Object.values(gameState.players);
        players.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            
            // Calculate total time for tiebreaker
            const aTime = a.answers.reduce((sum, answer) => sum + (answer?.timeSpent || 0), 0);
            const bTime = b.answers.reduce((sum, answer) => sum + (answer?.timeSpent || 0), 0);
            return aTime - bTime;
        });
        
        players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-result';
            
            const rank = index + 1;
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            
            playerDiv.innerHTML = `
                <span>${rankEmoji} ${player.nickname}</span>
                <span>${player.score}/${gameState.totalFlags}</span>
            `;
            
            lateJoinerResults.appendChild(playerDiv);
        });
    }

    showLobby(gameId, continent, flagCount) {
        // Store total flags for UI display
        this.totalFlagsInGame = flagCount;
        
        // Hide main menu
        document.getElementById('mode-selection').style.display = 'none';
        
        // Show lobby
        document.getElementById('multiplayer-lobby').style.display = 'block';
        
        // Update lobby info
        document.getElementById('lobby-game-id').textContent = gameId;
        document.getElementById('lobby-flag-count').textContent = flagCount;
        document.getElementById('lobby-continents').textContent = this.getContinentDisplayName(continent);
        
        // Generate and display challenge link
        const challengeLink = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
        document.getElementById('lobby-challenge-link').value = challengeLink;
        
        // Show/hide start button based on host status
        const startButton = document.getElementById('start-multiplayer-game');
        const waitingText = document.getElementById('lobby-waiting');
        
        if (this.multiplayerSync.isHost) {
            startButton.style.display = 'block';
            waitingText.style.display = 'none';
        } else {
            startButton.style.display = 'none';
            waitingText.style.display = 'block';
        }
        
        // Start syncing lobby state
        this.multiplayerSync.startSync((gameState) => {
            this.updateLobbyPlayers(gameState);
            
            // Check if game started
            if (gameState.status === 'playing' && !this.gameStartTime) {
                this.startGameplay(gameState);
            }
        });
    }

    updateLobbyPlayers(gameState) {
        const playersList = document.getElementById('players-list');
        playersList.innerHTML = '';
        
        Object.values(gameState.players).forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            
            console.log('🎭 Displaying player in lobby:', player.nickname, 'isHost:', player.isHost);
            
            playerDiv.innerHTML = `
                <span>${player.nickname}</span>
                <div>
                    ${player.isHost ? '<span class="host-badge">HOST</span>' : ''}
                    <span class="player-status">Ready</span>
                </div>
            `;
            
            playersList.appendChild(playerDiv);
        });
    }

    getContinentDisplayName(continent) {
        const continentNames = {
            'all': '🌐 All Continents',
            'Africa': '🌍 Africa',
            'Asia': '🌏 Asia',
            'Europe': '🇪🇺 Europe',
            'Americas': '🌎 Americas',
            'Oceania': '🏝️ Oceania'
        };
        return continentNames[continent] || continent;
    }

    copyLobbyLink() {
        const linkInput = document.getElementById('lobby-challenge-link');
        linkInput.select();
        linkInput.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            this.showToast('🔗 Link copied! Share it with your friends.');
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    }

    shareViaWhatsApp() {
        const link = document.getElementById('lobby-challenge-link').value;
        const text = `🌍 Join my Flagtriv challenge! Can you beat my geography knowledge? ${link}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    }

    shareViaText() {
        const link = document.getElementById('lobby-challenge-link').value;
        const text = `🌍 Join my Flagtriv challenge! ${link}`;
        const smsUrl = `sms:?body=${encodeURIComponent(text)}`;
        window.open(smsUrl);
    }

    async startMultiplayerGame() {
        if (!this.multiplayerSync.isHost) return;
        
        // Generate flags for the game
        this.generateGameFlags();
        
        const result = await this.multiplayerSync.startGame(this.gameFlags);
        
        if (result.success) {
            // Game will start automatically via sync
        } else {
            alert('Failed to start game: ' + result.error);
        }
    }

    generateGameFlags() {
        const gameState = this.multiplayerSync.localGameState;
        const filteredCountries = this.filterCountriesByContinent(gameState.continent);
        const countryCodes = Object.keys(filteredCountries);
        
        this.gameFlags = [];
        const usedCountries = [];
        
        // Ensure we don't try to get more flags than available countries
        const maxFlags = Math.min(gameState.totalFlags, countryCodes.length);
        
        console.log('🏳️ Generating flags:', {
            requested: gameState.totalFlags,
            available: countryCodes.length,
            willGenerate: maxFlags
        });
        
        for (let i = 0; i < maxFlags; i++) {
            let countryCode;
            let attempts = 0;
            const maxAttempts = countryCodes.length * 2; // Prevent infinite loop
            
            do {
                const randomIndex = Math.floor(Math.random() * countryCodes.length);
                countryCode = countryCodes[randomIndex];
                attempts++;
            } while (usedCountries.includes(countryCode) && attempts < maxAttempts);
            
            // Only add if we found a valid country and it exists
            if (countryCode && filteredCountries[countryCode] && !usedCountries.includes(countryCode)) {
                usedCountries.push(countryCode);
                this.gameFlags.push(filteredCountries[countryCode]);
            }
        }
        
        console.log('✅ Generated flags:', this.gameFlags.length, 'flags for game');
        
        // If we couldn't generate enough unique flags, log a warning
        if (this.gameFlags.length < gameState.totalFlags) {
            console.warn(`Could only generate ${this.gameFlags.length} unique flags out of ${gameState.totalFlags} requested`);
        }
    }

    filterCountriesByContinent(continent) {
        if (continent === 'all') {
            return this.countries;
        }
        
        const filtered = {};
        Object.keys(this.countries).forEach(code => {
            const country = this.countries[code];
            if (country.region === continent) {
                filtered[code] = country;
            }
        });
        
        return filtered;
    }

    startGameplay(gameState) {
        // Set multiplayer mode flag in main script
        window.isMultiplayerMode = true;
        this.gameEnded = false; // Reset game ended flag
        this.lastFlagIndex = -1; // Reset flag tracking
        
        // Store total flags for UI display
        this.totalFlagsInGame = gameState.totalFlags;
        
        // Hide lobby
        document.getElementById('multiplayer-lobby').style.display = 'none';
        
        // Show game container
        document.getElementById('game-container').style.display = 'flex';
        document.getElementById('top-bar').style.display = 'flex';
        
        // Create and show timer element
        this.createTimerElement();
        
        // Update UI for multiplayer
        document.getElementById('heading').textContent = 'Flag Duel';
        document.getElementById('subHeading').textContent = 'Compete with friends in real-time!';
        
        // HIDE LIVES DISPLAY IN MULTIPLAYER
        document.getElementById('lives-display').style.display = 'none';
        
        // Initialize game state
        this.gameFlags = gameState.flags;
        this.currentFlagIndex = gameState.currentFlag;
        this.gameStartTime = Date.now();
        this.roundStartTime = null;
        this.playerAnswers = [];
        
        console.log('🎮 Starting gameplay with:', {
            totalFlags: this.totalFlagsInGame,
            gameFlags: this.gameFlags.length,
            currentFlag: this.currentFlagIndex
        });
        
        // Start the first flag
        this.displayCurrentFlag();
        
        // Continue syncing for game updates
        this.multiplayerSync.startSync((gameState) => {
            this.handleGameStateUpdate(gameState);
        });
    }

    createTimerElement() {
        // Remove existing timer if any
        if (this.timerElement) {
            this.timerElement.remove();
        }
        
        // Create new timer element
        this.timerElement = document.createElement('div');
        this.timerElement.id = 'multiplayer-timer';
        this.timerElement.className = 'multiplayer-timer-display';
        this.timerElement.innerHTML = '⏱️ 6s';
        
        // Add to body
        document.body.appendChild(this.timerElement);
    }

    handleGameStateUpdate(gameState) {
        // Don't process updates if game has already ended
        if (this.gameEnded) return;
        
        console.log('🔄 Game state update:', {
            currentFlag: gameState.currentFlag,
            lastDisplayed: this.lastFlagIndex,
            status: gameState.status,
            totalFlags: gameState.totalFlags
        });
        
        // Update timer display
        const timeRemaining = this.multiplayerSync.getTimeRemaining();
        this.updateTimerDisplay(timeRemaining);
        
        // Check if game finished
        if (gameState.status === 'finished') {
            console.log('🏁 Game finished detected!');
            this.endMultiplayerGame();
            return;
        }
        
        // Check if we need to advance to next flag - IMPROVED LOGIC
        if (gameState.currentFlag !== this.lastFlagIndex) {
            console.log('🔄 Flag change detected:', {
                newFlag: gameState.currentFlag,
                lastDisplayed: this.lastFlagIndex,
                totalFlags: gameState.totalFlags
            });
            
            this.currentFlagIndex = gameState.currentFlag;
            this.lastFlagIndex = gameState.currentFlag;
            
            // FIXED: Use actual total flags from game state, not hardcoded 10
            if (this.currentFlagIndex >= gameState.totalFlags) {
                // Game finished
                console.log('🏁 All flags completed!');
                this.endMultiplayerGame();
            } else {
                // Next flag
                console.log('➡️ Displaying flag', this.currentFlagIndex + 1, 'of', gameState.totalFlags);
                this.displayCurrentFlag();
            }
        }
        
        // Update player count in top bar
        const playerCount = Object.keys(gameState.players).length;
        document.getElementById('score-display').textContent = `Players: ${playerCount}`;
    }

    displayCurrentFlag() {
        if (this.currentFlagIndex >= this.gameFlags.length) {
            console.log('❌ No more flags to display, ending game');
            this.endMultiplayerGame();
            return;
        }
        
        this.currentFlag = this.gameFlags[this.currentFlagIndex];
        this.roundStartTime = Date.now();
        
        // Safety check: ensure currentFlag is valid
        if (!this.currentFlag || !this.currentFlag.flag || !this.currentFlag.flag.large) {
            console.error('❌ Invalid flag data at index:', this.currentFlagIndex, this.currentFlag);
            return;
        }
        
        console.log('🏳️ Displaying flag:', this.currentFlag.name, 'Index:', this.currentFlagIndex);
        
        // Update flag image
        document.getElementById('flag').src = this.currentFlag.flag.large;
        
        // Generate options
        this.updateMultiplayerOptions();
        
        // Reset UI
        this.resetQuestionUI();
        
        // FIXED: Update progress with correct total flags
        const progress = `Flag ${this.currentFlagIndex + 1}/${this.totalFlagsInGame}`;
        document.getElementById('streak-display-top').textContent = progress;
        
        console.log('📊 Updated progress display:', progress);
    }

    updateMultiplayerOptions() {
        const options = document.querySelectorAll('.option');
        const allCountries = this.countries;
        const correctCountry = this.currentFlag;
        
        // Safety check: ensure we have a valid current flag
        if (!correctCountry || !correctCountry.alpha2Code || !correctCountry.name) {
            console.error('❌ Invalid current flag for options generation:', correctCountry);
            return;
        }
        
        // Get other countries for incorrect options
        const otherCountries = Object.values(allCountries).filter(
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
            button.onclick = (e) => this.handleMultiplayerAnswer(e);
        });
    }

    async handleMultiplayerAnswer(event) {
        const selectedAnswer = event.target.textContent;
        
        // Safety check: ensure we have a valid current flag
        if (!this.currentFlag || !this.currentFlag.name) {
            console.error('❌ No valid current flag available for answer handling');
            return;
        }
        
        const isCorrect = selectedAnswer === this.currentFlag.name;
        const timeSpent = Date.now() - this.roundStartTime;
        
        console.log('✅ Answer submitted:', {
            flag: this.currentFlag.name,
            answer: selectedAnswer,
            correct: isCorrect,
            timeSpent: timeSpent
        });
        
        // Disable all options
        document.querySelectorAll('.option').forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
        });
        
        // Visual feedback with confetti and sound
        if (isCorrect) {
            event.target.classList.add('correct-answer');
            this.soundEffects.playCorrect();
            document.getElementById('message').textContent = "🎉 Correct!";
            
            // Show confetti for correct answers in multiplayer
            if (typeof AnimationEffects !== 'undefined') {
                AnimationEffects.showConfetti();
            }
        } else {
            event.target.classList.add('wrong-answer');
            this.soundEffects.playWrong();
            document.getElementById('message').textContent = "❌ Incorrect";
            
            // Show correct answer
            document.querySelectorAll('.option').forEach(button => {
                if (button.textContent === this.currentFlag.name) {
                    button.classList.add('correct-answer');
                }
            });
        }
        
        // Submit answer to server
        await this.multiplayerSync.submitAnswer(
            this.currentFlagIndex,
            selectedAnswer,
            isCorrect,
            timeSpent
        );
        
        // Store locally
        this.playerAnswers[this.currentFlagIndex] = {
            answer: selectedAnswer,
            isCorrect,
            timeSpent
        };
        
        // Show facts (no trivia)
        this.showMultiplayerFacts();
    }

    showMultiplayerFacts() {
        const facts = document.getElementById('facts');
        
        // Safety check: ensure we have a valid current flag
        if (!this.currentFlag || !this.currentFlag.capital || !this.currentFlag.subregion) {
            console.error('❌ Invalid current flag for facts display:', this.currentFlag);
            return;
        }
        
        facts.innerHTML = `
            <p class="fact-text"><strong>Capital:</strong> ${this.currentFlag.capital}</p>
            <p class="fact-text"><strong>Location:</strong> ${this.currentFlag.subregion}</p>
        `;
        facts.hidden = false;
        
        // Hide trivia section
        document.getElementById('flag-trivia').hidden = true;
    }

    updateTimerDisplay(timeRemaining) {
        if (this.timerElement) {
            if (timeRemaining > 0) {
                this.timerElement.innerHTML = `${timeRemaining}s`;
                this.timerElement.className = 'multiplayer-timer-display';
                
                // Add urgency styling when time is low
                if (timeRemaining <= 2) {
                    this.timerElement.classList.add('timer-urgent');
                }
            } else {
                this.timerElement.innerHTML = '0s';
                this.timerElement.classList.add('timer-expired');
            }
        }
    }

    resetQuestionUI() {
        const options = document.querySelectorAll('.option');
        options.forEach(button => {
            button.disabled = false;
            button.classList.remove('disabled', 'correct-answer', 'wrong-answer');
        });
        
        document.getElementById('message').textContent = '';
        document.getElementById('facts').hidden = true;
        document.getElementById('flag-trivia').hidden = true;
        
        // Reset timer styling
        if (this.timerElement) {
            this.timerElement.classList.remove('timer-urgent', 'timer-expired');
        }
    }

    endMultiplayerGame() {
        // Prevent multiple calls
        if (this.gameEnded) return;
        this.gameEnded = true;
        
        console.log('🏁 Ending multiplayer game...');
        
        // Reset multiplayer mode flag
        window.isMultiplayerMode = false;
        
        // Stop syncing
        this.multiplayerSync.stopSync();
        
        // Remove timer element
        if (this.timerElement) {
            this.timerElement.remove();
            this.timerElement = null;
        }
        
        // Hide game UI
        document.getElementById('game-container').style.display = 'none';
        document.getElementById('top-bar').style.display = 'none';
        
        // Small delay to ensure all data is synced
        setTimeout(() => {
            this.showMultiplayerResults();
        }, 1000);
    }

    showMultiplayerResults() {
        console.log('🏆 Showing multiplayer results...');
        
        const results = this.multiplayerSync.getFinalResults();
        console.log('📊 Final results:', results);
        
        if (!results || results.length === 0) {
            console.error('❌ No results available');
            // Fallback - try to get results from current game state
            const gameState = this.multiplayerSync.useRealBackend ? 
                this.multiplayerSync.gameState : this.multiplayerSync.localGameState;
            
            if (gameState && gameState.players) {
                const fallbackResults = Object.values(gameState.players);
                fallbackResults.sort((a, b) => {
                    if (b.score !== a.score) {
                        return b.score - a.score;
                    }
                    
                    const aTime = a.answers.reduce((sum, answer) => sum + (answer?.timeSpent || 0), 0);
                    const bTime = b.answers.reduce((sum, answer) => sum + (answer?.timeSpent || 0), 0);
                    return aTime - bTime;
                });
                
                if (fallbackResults.length > 0) {
                    this.displayResults(fallbackResults);
                    return;
                }
            }
            
            // Final fallback - go back to main menu
            console.warn('⚠️ No results available, returning to main menu');
            this.playAgain();
            return;
        }
        
        this.displayResults(results);
    }

    displayResults(results) {
        const myPlayer = results.find(p => p.id === this.multiplayerSync.playerId);
        if (!myPlayer) {
            console.error('❌ Could not find current player in results');
            // Try to find by any available identifier
            const fallbackPlayer = results[0]; // Use first player as fallback
            if (fallbackPlayer) {
                console.warn('⚠️ Using fallback player for results display');
                this.displayResultsWithPlayer(results, fallbackPlayer, results.length);
                return;
            }
            this.playAgain();
            return;
        }
        
        const myRank = results.indexOf(myPlayer) + 1;
        this.displayResultsWithPlayer(results, myPlayer, myRank);
    }

    displayResultsWithPlayer(results, myPlayer, myRank) {
        console.log('🎯 Displaying results for player:', myPlayer.nickname, 'Rank:', myRank);
        
        // Show results screen
        document.getElementById('multiplayer-results').style.display = 'block';
        
        // Update result message
        const resultMessage = document.getElementById('result-message');
        if (myRank === 1) {
            resultMessage.textContent = '🏆 Congratulations! You Won!';
            resultMessage.style.color = '#FFD700';
        } else if (myRank <= 3) {
            resultMessage.textContent = `🥉 Great Job! You Placed ${myRank}${this.getOrdinalSuffix(myRank)}`;
            resultMessage.style.color = '#CD7F32';
        } else {
            resultMessage.textContent = `🎯 Good Game! You Placed ${myRank}${this.getOrdinalSuffix(myRank)}`;
            resultMessage.style.color = '#666';
        }
        
        // Update final stats
        const playerAnswers = myPlayer.answers || this.playerAnswers || [];
        const correctAnswers = playerAnswers.filter(a => a && a.isCorrect).length;
        const accuracy = Math.round((correctAnswers / this.totalFlagsInGame) * 100);
        
        document.getElementById('final-score').textContent = `${correctAnswers}/${this.totalFlagsInGame}`;
        document.getElementById('final-accuracy').textContent = `${accuracy}%`;
        
        // Update leaderboard
        this.updateLeaderboard(results);
        
        // Show confetti for winner
        if (myRank === 1 && typeof AnimationEffects !== 'undefined') {
            setTimeout(() => {
                AnimationEffects.showStreakConfetti();
            }, 500);
        }
    }

    updateLeaderboard(results) {
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '';
        
        console.log('📊 Updating leaderboard with results:', results);
        
        results.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-result';
            
            if (player.id === this.multiplayerSync.playerId) {
                playerDiv.classList.add('current-player');
            }
            
            const rank = index + 1;
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            
            // Calculate total time for display
            const answers = player.answers || [];
            const totalTime = answers.reduce((sum, answer) => sum + (answer?.timeSpent || 0), 0);
            const avgTime = answers.length > 0 ? Math.round(totalTime / answers.length / 1000) : 0;
            const score = player.score || 0;
            
            console.log('🏆 Displaying player in results:', player.nickname, 'Score:', score, 'Avg time:', avgTime);
            
            playerDiv.innerHTML = `
                <div class="player-rank">${rankEmoji}</div>
                <div class="player-info">
                    <div class="player-name">${player.nickname}</div>
                    <div class="player-stats">${score}/${this.totalFlagsInGame} • ${avgTime}s avg</div>
                </div>
                <div class="player-score">${score}</div>
            `;
            
            leaderboardList.appendChild(playerDiv);
        });
    }

    getOrdinalSuffix(num) {
        const j = num % 10;
        const k = num % 100;
        if (j === 1 && k !== 11) return 'st';
        if (j === 2 && k !== 12) return 'nd';
        if (j === 3 && k !== 13) return 'rd';
        return 'th';
    }

    shareResults() {
        const results = this.multiplayerSync.getFinalResults();
        const shareText = this.multiplayerSync.generateShareText(results);
        
        if (navigator.share) {
            navigator.share({
                title: 'Flagtriv Challenge Results',
                text: shareText
            }).then(() => {
                // Share was successful
            }).catch((error) => {
                // Share failed or was cancelled, fall back to clipboard
                console.log('Share failed:', error);
                this.fallbackToClipboard(shareText);
            });
        } else {
            // Web Share API not supported, use clipboard fallback
            this.fallbackToClipboard(shareText);
        }
    }

    fallbackToClipboard(shareText) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareText).then(() => {
                this.showToast('📋 Results copied to clipboard!');
            }).catch((error) => {
                console.error('Clipboard write failed:', error);
                this.showToast('❌ Unable to copy results');
            });
        } else {
            // Final fallback for older browsers
            this.showToast('❌ Sharing not supported on this device');
        }
    }

    playAgain() {
        // Clean up current game
        this.multiplayerSync.cleanup();
        
        // Remove timer element
        if (this.timerElement) {
            this.timerElement.remove();
            this.timerElement = null;
        }
        
        // Return to main menu
        document.getElementById('multiplayer-results').style.display = 'none';
        document.getElementById('mode-selection').style.display = 'flex';
        
        // Reset game state
        this.currentFlag = null;
        this.gameFlags = [];
        this.currentFlagIndex = 0;
        this.playerAnswers = [];
        this.gameStartTime = null;
        this.roundStartTime = null;
        this.gameEnded = false;
        this.lastFlagIndex = -1;
        this.totalFlagsInGame = 10; // Reset to default
        
        // Reset multiplayer mode flag
        window.isMultiplayerMode = false;
    }

    showToast(message) {
        const toast = document.getElementById('resultsToast');
        toast.textContent = message;
        toast.className = 'show';
        
        setTimeout(() => {
            toast.className = toast.className.replace('show', '');
        }, 3000);
    }
}

window.MultiplayerGame = MultiplayerGame;