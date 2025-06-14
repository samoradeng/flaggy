class MultiplayerSync {
    constructor() {
        this.gameId = null;
        this.playerId = null;
        this.isHost = false;
        this.gameState = null;
        this.syncInterval = null;
        this.subscription = null;
        
        // Initialize Supabase client with proper error handling
        this.initializeSupabase();
        
        // Local simulation data (used as fallback)
        this.localGameState = {
            gameId: null,
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
    }

    // Initialize Supabase with proper error handling
    initializeSupabase() {
        try {
            // Check if Supabase is available globally
            if (typeof window !== 'undefined' && window.supabase) {
                this.supabase = window.supabase;
                this.useRealBackend = true;
                this.localFallback = false;
                console.log('✅ Supabase client initialized for real multiplayer');
            } else {
                // Fallback to localStorage
                this.supabase = null;
                this.useRealBackend = false;
                this.localFallback = true;
                console.warn('⚠️ Supabase not available - using localStorage fallback (single device only)');
            }
        } catch (error) {
            console.error('Error initializing Supabase:', error);
            this.supabase = null;
            this.useRealBackend = false;
            this.localFallback = true;
        }
    }

    // Validate Supabase connection before use
    validateSupabaseConnection() {
        if (!this.useRealBackend || !this.supabase) {
            return false;
        }
        
        // Check if the from method exists
        if (typeof this.supabase.from !== 'function') {
            console.error('❌ Supabase client is invalid - missing from() method');
            this.useRealBackend = false;
            this.localFallback = true;
            return false;
        }
        
        return true;
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

            // Validate Supabase connection before using
            if (this.validateSupabaseConnection()) {
                console.log('🔄 Creating game with Supabase...');
                
                // Create game in Supabase
                const { data: gameData, error: gameError } = await this.supabase
                    .from('multiplayer_games')
                    .insert({
                        game_id: this.gameId,
                        total_flags: flagCount,
                        continent: continent,
                        host_id: this.playerId,
                        status: 'waiting'
                    })
                    .select()
                    .single();

                if (gameError) {
                    console.error('Game creation error:', gameError);
                    throw new Error(gameError.message);
                }

                // Add host as first player
                const { error: playerError } = await this.supabase
                    .from('multiplayer_players')
                    .insert({
                        game_id: this.gameId,
                        player_id: this.playerId,
                        nickname: 'Host',
                        is_host: true,
                        score: 0,
                        answers: []
                    });

                if (playerError) {
                    console.error('Player creation error:', playerError);
                    throw new Error(playerError.message);
                }

                console.log('✅ Game created successfully with Supabase:', this.gameId);
                
                return {
                    success: true,
                    gameId: this.gameId,
                    playerId: this.playerId
                };
            } else {
                // Use local fallback
                console.log('🔄 Creating game with localStorage fallback...');
                return this.createGameLocal(flagCount, continent);
            }
        } catch (error) {
            console.error('Failed to create game:', error);
            // Try local fallback on error
            console.log('🔄 Falling back to localStorage...');
            return this.createGameLocal(flagCount, continent);
        }
    }

    // Local fallback for game creation
    createGameLocal(flagCount, continent) {
        try {
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

            const storageKey = 'multiplayerGame_' + this.gameId;
            localStorage.setItem(storageKey, JSON.stringify(this.localGameState));
            
            const allGames = JSON.parse(localStorage.getItem('allMultiplayerGames') || '{}');
            allGames[this.gameId] = {
                gameId: this.gameId,
                status: this.localGameState.status,
                createdAt: Date.now(),
                hostId: this.playerId
            };
            localStorage.setItem('allMultiplayerGames', JSON.stringify(allGames));
            
            console.log('✅ Game created successfully with localStorage:', this.gameId);
            
            return {
                success: true,
                gameId: this.gameId,
                playerId: this.playerId
            };
        } catch (error) {
            console.error('Failed to create game locally:', error);
            return { success: false, error: error.message };
        }
    }

    // Join an existing game
    async joinGame(gameId, nickname = '') {
        try {
            this.gameId = gameId;
            this.playerId = this.generatePlayerId();
            this.isHost = false;

            // Validate Supabase connection before using
            if (this.validateSupabaseConnection()) {
                console.log('🔄 Joining game with Supabase...');
                
                // Check if game exists
                const { data: gameData, error: gameError } = await this.supabase
                    .from('multiplayer_games')
                    .select('*')
                    .eq('game_id', gameId)
                    .single();

                if (gameError || !gameData) {
                    console.error('Game not found in Supabase:', gameError);
                    // Try local fallback
                    return this.joinGameLocal(gameId, nickname);
                }

                // Add player to the game
                const { error: playerError } = await this.supabase
                    .from('multiplayer_players')
                    .insert({
                        game_id: gameId,
                        player_id: this.playerId,
                        nickname: nickname || `Player ${Date.now().toString().slice(-4)}`,
                        is_host: false,
                        score: 0,
                        answers: []
                    });

                if (playerError) {
                    console.error('Failed to join game:', playerError);
                    throw new Error(playerError.message);
                }

                // Get current game state
                const gameState = await this.fetchGameState();

                console.log('✅ Joined game successfully with Supabase:', gameId);
                
                return {
                    success: true,
                    gameId: this.gameId,
                    playerId: this.playerId,
                    gameState: gameState
                };
            } else {
                // Use local fallback
                console.log('🔄 Joining game with localStorage fallback...');
                return this.joinGameLocal(gameId, nickname);
            }
        } catch (error) {
            console.error('Failed to join game:', error);
            // Try local fallback on error
            console.log('🔄 Falling back to localStorage...');
            return this.joinGameLocal(gameId, nickname);
        }
    }

    // Local fallback for joining game
    joinGameLocal(gameId, nickname) {
        try {
            const storageKey = 'multiplayerGame_' + gameId;
            const gameData = localStorage.getItem(storageKey);
            
            if (!gameData) {
                const allGames = JSON.parse(localStorage.getItem('allMultiplayerGames') || '{}');
                if (!allGames[gameId]) {
                    console.error('Game not found in localStorage:', gameId);
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

            this.localGameState.players[this.playerId] = {
                id: this.playerId,
                nickname: nickname || `Player ${Object.keys(this.localGameState.players).length + 1}`,
                isHost: false,
                score: 0,
                answers: [],
                connected: true,
                joinedAt: Date.now()
            };

            localStorage.setItem(storageKey, JSON.stringify(this.localGameState));
            
            console.log('✅ Joined game successfully with localStorage:', gameId);
            
            return {
                success: true,
                gameId: this.gameId,
                playerId: this.playerId,
                gameState: this.localGameState
            };
        } catch (error) {
            console.error('Failed to join game locally:', error);
            return { success: false, error: error.message };
        }
    }

    // Fetch current game state from Supabase
    async fetchGameState() {
        if (!this.validateSupabaseConnection()) {
            return this.localGameState;
        }

        try {
            // Get game data
            const { data: gameData, error: gameError } = await this.supabase
                .from('multiplayer_games')
                .select('*')
                .eq('game_id', this.gameId)
                .single();

            if (gameError) {
                console.error('Error fetching game:', gameError);
                return null;
            }

            // Get players data
            const { data: playersData, error: playersError } = await this.supabase
                .from('multiplayer_players')
                .select('*')
                .eq('game_id', this.gameId);

            if (playersError) {
                console.error('Error fetching players:', playersError);
                return null;
            }

            // Convert to expected format
            const players = {};
            playersData.forEach(player => {
                players[player.player_id] = {
                    id: player.player_id,
                    nickname: player.nickname,
                    isHost: player.is_host,
                    score: player.score,
                    answers: player.answers || [],
                    connected: player.connected,
                    joinedAt: player.joined_at
                };
            });

            return {
                gameId: gameData.game_id,
                status: gameData.status,
                currentFlag: gameData.current_flag,
                totalFlags: gameData.total_flags,
                roundStartTime: gameData.round_start_time ? new Date(gameData.round_start_time).getTime() : null,
                roundDuration: gameData.round_duration,
                continent: gameData.continent,
                hostId: gameData.host_id,
                flags: gameData.flags || [],
                players: players
            };
        } catch (error) {
            console.error('Error fetching game state:', error);
            return null;
        }
    }

    // Start the game (host only)
    async startGame(flags) {
        if (!this.isHost) {
            return { success: false, error: 'Only host can start the game' };
        }

        try {
            if (this.validateSupabaseConnection()) {
                const { error } = await this.supabase
                    .from('multiplayer_games')
                    .update({
                        status: 'playing',
                        flags: flags,
                        current_flag: 0,
                        round_start_time: new Date().toISOString()
                    })
                    .eq('game_id', this.gameId);

                if (error) {
                    console.error('Error starting game:', error);
                    throw new Error(error.message);
                }

                console.log('✅ Game started successfully with Supabase');
                return { success: true };
            } else {
                // Local fallback
                this.localGameState.status = 'playing';
                this.localGameState.flags = flags;
                this.localGameState.currentFlag = 0;
                this.localGameState.roundStartTime = Date.now();
                
                const storageKey = 'multiplayerGame_' + this.gameId;
                localStorage.setItem(storageKey, JSON.stringify(this.localGameState));
                
                console.log('✅ Game started successfully with localStorage');
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
            if (this.validateSupabaseConnection()) {
                // Get current player data
                const { data: playerData, error: fetchError } = await this.supabase
                    .from('multiplayer_players')
                    .select('answers, score')
                    .eq('game_id', this.gameId)
                    .eq('player_id', this.playerId)
                    .single();

                if (fetchError) {
                    console.error('Error fetching player data:', fetchError);
                    throw new Error(fetchError.message);
                }

                // Update answers array
                const answers = playerData.answers || [];
                answers[flagIndex] = {
                    answer,
                    isCorrect,
                    timeSpent,
                    submittedAt: new Date().toISOString()
                };

                // Update score if correct
                const newScore = isCorrect ? playerData.score + 1 : playerData.score;

                // Update player in database
                const { error: updateError } = await this.supabase
                    .from('multiplayer_players')
                    .update({
                        answers: answers,
                        score: newScore
                    })
                    .eq('game_id', this.gameId)
                    .eq('player_id', this.playerId);

                if (updateError) {
                    console.error('Error updating player:', updateError);
                    throw new Error(updateError.message);
                }

                return { success: true };
            } else {
                // Local fallback
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
            if (this.validateSupabaseConnection()) {
                const gameState = await this.fetchGameState();
                if (gameState) {
                    this.gameState = gameState;
                    return {
                        success: true,
                        gameState: gameState
                    };
                } else {
                    return { success: false, error: 'Failed to fetch game state' };
                }
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
        return Math.ceil(remaining / 1000);
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

        try {
            if (this.validateSupabaseConnection()) {
                const gameState = await this.fetchGameState();
                if (!gameState) return;

                const nextFlag = gameState.currentFlag + 1;
                
                if (nextFlag >= gameState.totalFlags) {
                    // Game finished
                    await this.supabase
                        .from('multiplayer_games')
                        .update({
                            status: 'finished',
                            round_start_time: null
                        })
                        .eq('game_id', this.gameId);
                } else {
                    // Next flag
                    await this.supabase
                        .from('multiplayer_games')
                        .update({
                            current_flag: nextFlag,
                            round_start_time: new Date().toISOString()
                        })
                        .eq('game_id', this.gameId);
                }
            } else {
                // Local fallback
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
        } catch (error) {
            console.error('Error advancing to next flag:', error);
        }
    }

    // Start syncing with real-time updates
    startSync(onStateUpdate) {
        if (this.validateSupabaseConnection()) {
            // Use Supabase real-time subscriptions
            this.startRealtimeSync(onStateUpdate);
        } else {
            // Fallback to polling for localStorage
            this.startPollingSync(onStateUpdate);
        }
    }

    // Start real-time sync with Supabase
    startRealtimeSync(onStateUpdate) {
        try {
            // Subscribe to game changes
            this.subscription = this.supabase
                .channel(`game_${this.gameId}`)
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: 'multiplayer_games',
                        filter: `game_id=eq.${this.gameId}`
                    }, 
                    async (payload) => {
                        console.log('Game updated:', payload);
                        const gameState = await this.fetchGameState();
                        if (gameState && onStateUpdate) {
                            onStateUpdate(gameState);
                        }
                    }
                )
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: 'multiplayer_players',
                        filter: `game_id=eq.${this.gameId}`
                    }, 
                    async (payload) => {
                        console.log('Players updated:', payload);
                        const gameState = await this.fetchGameState();
                        if (gameState && onStateUpdate) {
                            onStateUpdate(gameState);
                        }
                    }
                )
                .subscribe();

            // Also poll for time-based updates (for round timer)
            this.syncInterval = setInterval(async () => {
                if (this.isHost && this.shouldAdvanceFlag()) {
                    await this.advanceToNextFlag();
                }
                
                // Update timer display
                const gameState = await this.fetchGameState();
                if (gameState && onStateUpdate) {
                    onStateUpdate(gameState);
                }
            }, 1000);
        } catch (error) {
            console.error('Error starting realtime sync:', error);
            // Fallback to polling
            this.startPollingSync(onStateUpdate);
        }
    }

    // Start polling sync for localStorage fallback
    startPollingSync(onStateUpdate) {
        this.syncInterval = setInterval(async () => {
            const result = await this.getGameState();
            if (result.success && onStateUpdate) {
                onStateUpdate(result.gameState);
                
                if (this.isHost && this.shouldAdvanceFlag()) {
                    await this.advanceToNextFlag();
                }
            }
        }, 1000);
    }

    // Stop syncing
    stopSync() {
        if (this.subscription && this.supabase) {
            try {
                this.supabase.removeChannel(this.subscription);
            } catch (error) {
                console.error('Error removing subscription:', error);
            }
            this.subscription = null;
        }
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    // Get final results
    getFinalResults() {
        const gameState = this.useRealBackend ? this.gameState : this.localGameState;
        const players = Object.values(gameState.players);
        
        players.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            
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
        
        if (!this.useRealBackend && this.isHost && this.gameId) {
            const storageKey = 'multiplayerGame_' + this.gameId;
            localStorage.removeItem(storageKey);
            
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