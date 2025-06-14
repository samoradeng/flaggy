class MultiplayerSync {
    constructor() {
        this.gameId = null;
        this.playerId = null;
        this.isHost = false;
        this.gameState = null;
        this.syncInterval = null;
        
        // Use a real-time database service for multiplayer
        // Options: Firebase Realtime Database, Supabase, or custom backend
        this.useRealBackend = true;
        this.backendUrl = 'https://flagtriv-multiplayer.herokuapp.com/api'; // Replace with your backend
        
        // Fallback to localStorage only for testing
        this.localFallback = !this.useRealBackend;
        
        // Local simulation data (only used if no backend)
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

            if (this.useRealBackend) {
                // Real backend implementation
                const response = await fetch(`${this.backendUrl}/games`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        gameId: this.gameId,
                        flagCount,
                        continent,
                        hostId: this.playerId,
                        hostNickname: 'Host'
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                return {
                    success: true,
                    gameId: this.gameId,
                    playerId: this.playerId
                };
            } else {
                // Local fallback (for testing only)
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

            if (this.useRealBackend) {
                // Real backend implementation
                const response = await fetch(`${this.backendUrl}/games/${gameId}/join`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        playerId: this.playerId,
                        nickname: nickname || `Player ${Date.now().toString().slice(-4)}`
                    })
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Game not found');
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return {
                    success: true,
                    gameId: this.gameId,
                    playerId: this.playerId,
                    gameState: data.gameState
                };
            } else {
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
            if (this.useRealBackend) {
                // Real backend implementation
                const response = await fetch(`${this.backendUrl}/games/${this.gameId}/start`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        hostId: this.playerId,
                        flags
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return await response.json();
            } else {
                this.localGameState.status = 'playing';
                this.localGameState.flags = flags;
                this.localGameState.currentFlag = 0;
                this.localGameState.roundStartTime = Date.now();
                
                const storageKey = 'multiplayerGame_' + this.gameId;
                localStorage.setItem(storageKey, JSON.stringify(this.localGameState));
                
                return { success: true };
            }
        } catch (error) {
            console.error('Failed to start game:', error);
            return { success: false, error: error.message };
        }
    }

    // Submit an answer
    async submitAnswer(flagIndex, answer, isCorrect, timeSpent) {
        try {
            if (this.useRealBackend) {
                // Real backend implementation
                const response = await fetch(`${this.backendUrl}/games/${this.gameId}/answer`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        playerId: this.playerId,
                        flagIndex,
                        answer,
                        isCorrect,
                        timeSpent
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return await response.json();
            } else {
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
        } catch (error) {
            console.error('Failed to submit answer:', error);
            return { success: false, error: error.message };
        }
    }

    // Get current game state
    async getGameState() {
        try {
            if (this.useRealBackend) {
                // Real backend implementation
                const response = await fetch(`${this.backendUrl}/games/${this.gameId}/state`, {
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    this.gameState = data.gameState;
                }
                
                return data;
            } else {
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
        } catch (error) {
            console.error('Failed to get game state:', error);
            return { success: false, error: error.message };
        }
    }

    // Calculate time remaining for current round
    getTimeRemaining() {
        const gameState = this.useRealBackend ? this.gameState : this.localGameState;
        if (!gameState || !gameState.roundStartTime || gameState.status !== 'playing') {
            return 0;
        }

        const elapsed = Date.now() - gameState.roundStartTime;
        const remaining = Math.max(0, gameState.roundDuration - elapsed);
        return Math.ceil(remaining / 1000); // Return seconds
    }

    // Check if we should advance to next flag
    shouldAdvanceFlag() {
        const gameState = this.useRealBackend ? this.gameState : this.localGameState;
        if (!gameState || gameState.status !== 'playing') return false;
        
        const timeRemaining = this.getTimeRemaining();
        return timeRemaining <= 0;
    }

    // Advance to next flag (auto-sync)
    async advanceToNextFlag() {
        if (!this.isHost) return;

        if (this.useRealBackend) {
            // Real backend will handle this automatically
            return;
        } else {
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
                
                // Auto-advance if time is up and we're the host (only for local fallback)
                if (!this.useRealBackend && this.isHost && this.shouldAdvanceFlag()) {
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
        const gameState = this.useRealBackend ? this.gameState : this.localGameState;
        const players = Object.values(gameState.players);
        
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
        const gameState = this.useRealBackend ? this.gameState : this.localGameState;
        
        let shareText = `🌍 Flagtriv Challenge Results!\n`;
        shareText += `🏆 Ranked ${myRank}/${totalPlayers}\n`;
        shareText += `🎯 Score: ${myResult.score}/${gameState.totalFlags}\n`;
        
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
        
        // Clean up localStorage if we're the host and using local fallback
        if (!this.useRealBackend && this.isHost && this.gameId) {
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