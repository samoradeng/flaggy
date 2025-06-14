class MultiplayerSync {
    constructor() {
        this.gameId = null;
        this.playerId = null;
        this.isHost = false;
        this.gameState = null;
        this.syncInterval = null;
        this.serverUrl = 'https://flagtriv-server.herokuapp.com'; // Mock server for demo
        this.localFallback = true; // Use local simulation for now
        
        // Local simulation data
        this.localGameState = {
            gameId: null,
            status: 'waiting', // waiting, playing, finished
            currentFlag: 0,
            totalFlags: 10,
            roundStartTime: null,
            roundDuration: 10000, // 10 seconds per flag
            players: {},
            flags: [],
            continent: 'all',
            hostId: null
        };
        
        this.players = new Map();
    }

    // Generate a unique game ID
    generateGameId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Generate a unique player ID
    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substring(2, 10);
    }

    // Create a new multiplayer game
    async createGame(flagCount, continent) {
        try {
            this.gameId = this.generateGameId();
            this.playerId = this.generatePlayerId();
            this.isHost = true;

            if (this.localFallback) {
                // Local simulation
                this.localGameState.gameId = this.gameId;
                this.localGameState.totalFlags = flagCount;
                this.localGameState.continent = continent;
                this.localGameState.hostId = this.playerId;
                this.localGameState.players[this.playerId] = {
                    id: this.playerId,
                    nickname: 'Host',
                    isHost: true,
                    score: 0,
                    answers: [],
                    connected: true,
                    joinedAt: Date.now()
                };

                // Store in localStorage for persistence across tabs/devices
                const storageKey = 'multiplayerGame_' + this.gameId;
                localStorage.setItem(storageKey, JSON.stringify(this.localGameState));
                
                // Also store in a global games list for easier lookup
                const allGames = JSON.parse(localStorage.getItem('allMultiplayerGames') || '{}');
                allGames[this.gameId] = {
                    gameId: this.gameId,
                    status: this.localGameState.status,
                    createdAt: Date.now(),
                    hostId: this.playerId
                };
                localStorage.setItem('allMultiplayerGames', JSON.stringify(allGames));
                
                return {
                    success: true,
                    gameId: this.gameId,
                    playerId: this.playerId
                };
            }

            // Real server implementation would go here
            const response = await fetch(`${this.serverUrl}/api/games`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    flagCount,
                    continent,
                    hostId: this.playerId
                })
            });

            const data = await response.json();
            this.gameId = data.gameId;
            
            return data;
        } catch (error) {
            console.error('Failed to create game:', error);
            return { success: false, error: error.message };
        }
    }

    // Join an existing game
    async joinGame(gameId, nickname = '') {
        try {
            this.gameId = gameId;
            this.playerId = this.generatePlayerId();
            this.isHost = false;

            if (this.localFallback) {
                // Local simulation - check if game exists
                const storageKey = 'multiplayerGame_' + gameId;
                const gameData = localStorage.getItem(storageKey);
                
                if (!gameData) {
                    // Also check the global games list
                    const allGames = JSON.parse(localStorage.getItem('allMultiplayerGames') || '{}');
                    if (!allGames[gameId]) {
                        return { success: false, error: 'Game not found' };
                    }
                }

                this.localGameState = gameData ? JSON.parse(gameData) : {
                    gameId: gameId,
                    status: 'waiting',
                    currentFlag: 0,
                    totalFlags: 10,
                    roundStartTime: null,
                    roundDuration: 10000,
                    players: {},
                    flags: [],
                    continent: 'all',
                    hostId: null
                };

                // Add the new player
                this.localGameState.players[this.playerId] = {
                    id: this.playerId,
                    nickname: nickname || `Player ${Object.keys(this.localGameState.players).length + 1}`,
                    isHost: false,
                    score: 0,
                    answers: [],
                    connected: true,
                    joinedAt: Date.now()
                };

                // Save updated game state
                localStorage.setItem(storageKey, JSON.stringify(this.localGameState));
                
                return {
                    success: true,
                    gameId: this.gameId,
                    playerId: this.playerId,
                    gameState: this.localGameState
                };
            }

            // Real server implementation
            const response = await fetch(`${this.serverUrl}/api/games/${gameId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: this.playerId,
                    nickname
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to join game:', error);
            return { success: false, error: error.message };
        }
    }

    // Start the game (host only)
    async startGame(flags) {
        if (!this.isHost) {
            return { success: false, error: 'Only host can start the game' };
        }

        try {
            if (this.localFallback) {
                // Local simulation
                this.localGameState.status = 'playing';
                this.localGameState.flags = flags;
                this.localGameState.currentFlag = 0;
                this.localGameState.roundStartTime = Date.now();
                
                const storageKey = 'multiplayerGame_' + this.gameId;
                localStorage.setItem(storageKey, JSON.stringify(this.localGameState));
                
                return { success: true };
            }

            // Real server implementation
            const response = await fetch(`${this.serverUrl}/api/games/${this.gameId}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hostId: this.playerId,
                    flags
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Failed to start game:', error);
            return { success: false, error: error.message };
        }
    }

    // Submit an answer
    async submitAnswer(flagIndex, answer, isCorrect, timeSpent) {
        try {
            if (this.localFallback) {
                // Local simulation
                const storageKey = 'multiplayerGame_' + this.gameId;
                const gameData = localStorage.getItem(storageKey);
                if (gameData) {
                    const state = JSON.parse(gameData);
                    if (state.players[this.playerId]) {
                        state.players[this.playerId].answers[flagIndex] = {
                            answer,
                            isCorrect,
                            timeSpent,
                            submittedAt: Date.now()
                        };
                        
                        if (isCorrect) {
                            state.players[this.playerId].score++;
                        }
                        
                        localStorage.setItem(storageKey, JSON.stringify(state));
                        this.localGameState = state;
                    }
                }
                
                return { success: true };
            }

            // Real server implementation
            const response = await fetch(`${this.serverUrl}/api/games/${this.gameId}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: this.playerId,
                    flagIndex,
                    answer,
                    isCorrect,
                    timeSpent
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Failed to submit answer:', error);
            return { success: false, error: error.message };
        }
    }

    // Get current game state
    async getGameState() {
        try {
            if (this.localFallback) {
                // Local simulation
                const storageKey = 'multiplayerGame_' + this.gameId;
                const gameData = localStorage.getItem(storageKey);
                if (gameData) {
                    this.localGameState = JSON.parse(gameData);
                    return {
                        success: true,
                        gameState: this.localGameState
                    };
                }
                return { success: false, error: 'Game not found' };
            }

            // Real server implementation
            const response = await fetch(`${this.serverUrl}/api/games/${this.gameId}/state`);
            const data = await response.json();
            
            if (data.success) {
                this.gameState = data.gameState;
            }
            
            return data;
        } catch (error) {
            console.error('Failed to get game state:', error);
            return { success: false, error: error.message };
        }
    }

    // Calculate time remaining for current round
    getTimeRemaining() {
        if (!this.localGameState.roundStartTime || this.localGameState.status !== 'playing') {
            return 0;
        }

        const elapsed = Date.now() - this.localGameState.roundStartTime;
        const remaining = Math.max(0, this.localGameState.roundDuration - elapsed);
        return Math.ceil(remaining / 1000); // Return seconds
    }

    // Check if we should advance to next flag
    shouldAdvanceFlag() {
        if (this.localGameState.status !== 'playing') return false;
        
        const timeRemaining = this.getTimeRemaining();
        return timeRemaining <= 0;
    }

    // Advance to next flag (auto-sync)
    async advanceToNextFlag() {
        if (!this.isHost) return;

        if (this.localFallback) {
            this.localGameState.currentFlag++;
            
            if (this.localGameState.currentFlag >= this.localGameState.totalFlags) {
                this.localGameState.status = 'finished';
                this.localGameState.roundStartTime = null;
            } else {
                this.localGameState.roundStartTime = Date.now();
            }
            
            const storageKey = 'multiplayerGame_' + this.gameId;
            localStorage.setItem(storageKey, JSON.stringify(this.localGameState));
        }
    }

    // Start syncing with server
    startSync(onStateUpdate) {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(async () => {
            const result = await this.getGameState();
            if (result.success && onStateUpdate) {
                onStateUpdate(result.gameState);
                
                // Auto-advance if time is up and we're the host
                if (this.isHost && this.shouldAdvanceFlag()) {
                    await this.advanceToNextFlag();
                }
            }
        }, 1000); // Sync every second
    }

    // Stop syncing
    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    // Get final results
    getFinalResults() {
        const players = Object.values(this.localGameState.players);
        
        // Sort by score (descending), then by total time (ascending)
        players.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            
            // Calculate total time for tiebreaker
            const aTime = a.answers.reduce((sum, answer) => sum + (answer?.timeSpent || 0), 0);
            const bTime = b.answers.reduce((sum, answer) => sum + (answer?.timeSpent || 0), 0);
            return aTime - bTime;
        });

        return players;
    }

    // Generate share text for results
    generateShareText(playerResults) {
        const myResult = playerResults.find(p => p.id === this.playerId);
        const myRank = playerResults.indexOf(myResult) + 1;
        const totalPlayers = playerResults.length;
        
        let shareText = `🌍 Flagtriv Challenge Results!\n`;
        shareText += `🏆 Ranked ${myRank}/${totalPlayers}\n`;
        shareText += `🎯 Score: ${myResult.score}/${this.localGameState.totalFlags}\n`;
        
        if (myRank === 1) {
            shareText += `👑 Victory! I won the flag challenge!\n`;
        } else if (myRank <= 3) {
            shareText += `🥉 Made it to the podium!\n`;
        }
        
        shareText += `\nPlay at flagtriv.com`;
        
        return shareText;
    }

    // Clean up
    cleanup() {
        this.stopSync();
        
        // Clean up localStorage if we're the host
        if (this.isHost && this.gameId) {
            const storageKey = 'multiplayerGame_' + this.gameId;
            localStorage.removeItem(storageKey);
            
            // Also remove from global games list
            const allGames = JSON.parse(localStorage.getItem('allMultiplayerGames') || '{}');
            delete allGames[this.gameId];
            localStorage.setItem('allMultiplayerGames', JSON.stringify(allGames));
        }
        
        this.gameId = null;
        this.playerId = null;
        this.isHost = false;
        this.gameState = null;
    }
}

window.MultiplayerSync = MultiplayerSync;