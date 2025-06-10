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

        // Share buttons
        document.getElementById('share-whatsapp').addEventListener('click', () => {
            this.shareViaWhatsApp();
        });

        document.getElementById('share-text').addEventListener('click', () => {
            this.shareViaText();
        });

        document.getElementById('share-email').addEventListener('click', () => {
            this.shareViaEmail();
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
        
        const result = await this.multiplayerSync.createGame(flagCount, continent);
        
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
            this.showLobby(gameId, result.gameState.continent, result.gameState.totalFlags);
        } else {
            alert('Failed to join challenge: ' + result.error);
        }
    }

    showLobby(gameId, continent, flagCount) {
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

    shareViaEmail() {
        const link = document.getElementById('lobby-challenge-link').value;
        const subject = '🌍 Flagtriv Challenge Invitation';
        const body = `Hi!\n\nI've created a flag guessing challenge on Flagtriv. Think you can beat me?\n\nJoin here: ${link}\n\nLet's see who knows geography better!`;
        const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(emailUrl);
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
        
        // Hide lobby
        document.getElementById('multiplayer-lobby').style.display = 'none';
        
        // Show game container
        document.getElementById('game-container').style.display = 'flex';
        document.getElementById('top-bar').style.display = 'flex';
        
        // Update UI for multiplayer
        document.getElementById('heading').textContent = 'Challenge Friends';
        document.getElementById('subHeading').textContent = 'Compete with friends in real-time!';
        
        // Initialize game state
        this.gameFlags = gameState.flags;
        this.currentFlagIndex = gameState.currentFlag;
        this.gameStartTime = Date.now();
        this.playerAnswers = [];
        
        // Start the first flag
        this.displayCurrentFlag();
        
        // Continue syncing for game updates
        this.multiplayerSync.startSync((updatedGameState) => {
            this.handleGameStateUpdate(updatedGameState);
        });
    }

    handleGameStateUpdate(gameState) {
        // Update timer display
        const timeRemaining = this.multiplayerSync.getTimeRemaining();
        this.updateTimerDisplay(timeRemaining);
        
        // Check if we need to advance to next flag
        if (gameState.currentFlag !== this.currentFlagIndex) {
            this.currentFlagIndex = gameState.currentFlag;
            
            if (this.currentFlagIndex >= gameState.totalFlags) {
                // Game finished
                this.endMultiplayerGame();
            } else {
                // Next flag
                this.displayCurrentFlag();
            }
        }
        
        // Update player count in top bar
        const playerCount = Object.keys(gameState.players).length;
        document.getElementById('score-display').textContent = `Players: ${playerCount}`;
    }

    displayCurrentFlag() {
        if (this.currentFlagIndex >= this.gameFlags.length) return;
        
        this.currentFlag = this.gameFlags[this.currentFlagIndex];
        this.roundStartTime = Date.now();
        
        // Safety check: ensure currentFlag is valid
        if (!this.currentFlag || !this.currentFlag.flag || !this.currentFlag.flag.large) {
            console.error('Invalid flag data at index:', this.currentFlagIndex, this.currentFlag);
            return;
        }
        
        // Update flag image
        document.getElementById('flag').src = this.currentFlag.flag.large;
        
        // Generate options
        this.updateMultiplayerOptions();
        
        // Reset UI
        this.resetQuestionUI();
        
        // Update progress
        const progress = `Flag ${this.currentFlagIndex + 1}/${this.gameFlags.length}`;
        document.getElementById('streak-display-top').textContent = progress;
    }

    updateMultiplayerOptions() {
        const options = document.querySelectorAll('.option');
        const allCountries = this.countries;
        const correctCountry = this.currentFlag;
        
        // Safety check: ensure we have a valid current flag
        if (!correctCountry || !correctCountry.alpha2Code || !correctCountry.name) {
            console.error('Invalid current flag for options generation:', correctCountry);
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
            console.error('No valid current flag available for answer handling');
            return;
        }
        
        const isCorrect = selectedAnswer === this.currentFlag.name;
        const timeSpent = Date.now() - this.roundStartTime;
        
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
            console.error('Invalid current flag for facts display:', this.currentFlag);
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
        const streakDisplay = document.getElementById('streak-display-top');
        
        if (timeRemaining > 0) {
            streakDisplay.innerHTML = `<span class="multiplayer-timer">⏱️ ${timeRemaining}s</span>`;
        } else {
            streakDisplay.textContent = `Flag ${this.currentFlagIndex + 1}/${this.gameFlags.length}`;
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
    }

    endMultiplayerGame() {
        // Reset multiplayer mode flag
        window.isMultiplayerMode = false;
        
        // Stop syncing
        this.multiplayerSync.stopSync();
        
        // Hide game UI
        document.getElementById('game-container').style.display = 'none';
        document.getElementById('top-bar').style.display = 'none';
        
        // Show results
        this.showMultiplayerResults();
    }

    showMultiplayerResults() {
        const results = this.multiplayerSync.getFinalResults();
        const myPlayer = results.find(p => p.id === this.multiplayerSync.playerId);
        const myRank = results.indexOf(myPlayer) + 1;
        
        // Show results screen
        document.getElementById('multiplayer-results').style.display = 'block';
        
        // Update result message
        const resultMessage = document.getElementById('result-message');
        if (myRank === 1) {
            resultMessage.textContent = '🏆 Congratulations! You Won!';
        } else if (myRank <= 3) {
            resultMessage.textContent = `🥉 Great Job! You Placed ${myRank}${this.getOrdinalSuffix(myRank)}`;
        } else {
            resultMessage.textContent = `🎯 Good Game! You Placed ${myRank}${this.getOrdinalSuffix(myRank)}`;
        }
        
        // Update final stats
        const correctAnswers = this.playerAnswers.filter(a => a && a.isCorrect).length;
        const accuracy = Math.round((correctAnswers / this.gameFlags.length) * 100);
        
        document.getElementById('final-score').textContent = `${correctAnswers}/${this.gameFlags.length}`;
        document.getElementById('final-accuracy').textContent = `${accuracy}%`;
        
        // Update leaderboard
        this.updateLeaderboard(results);
    }

    updateLeaderboard(results) {
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '';
        
        results.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-result';
            
            if (player.id === this.multiplayerSync.playerId) {
                playerDiv.classList.add('current-player');
            }
            
            const rank = index + 1;
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            
            playerDiv.innerHTML = `
                <span>${rankEmoji} ${player.nickname}</span>
                <span>${player.score}/${this.gameFlags.length}</span>
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
            });
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                this.showToast('📋 Results copied to clipboard!');
            });
        }
    }

    playAgain() {
        // Clean up current game
        this.multiplayerSync.cleanup();
        
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