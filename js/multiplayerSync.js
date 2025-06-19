class MultiplayerSync {
    constructor() {
        this.gameId = null;
        this.playerId = null;
        this.isHost = false;
        this.gameState = null;
        this.syncInterval = null;
        this.subscription = null;
        this.lastAdvanceTime = 0; // Track when we last advanced to prevent rapid advances
        this.advancementInProgress = false; // Prevent concurrent advances
        this.currentRoundStartTime = null; // Track current round timing
        
        // Initialize Supabase client with proper error handling
        this.initializeSupabase();
        
        // Local simulation data (used as fallback)
        this.localGameState = {
            gameId: null,
            status: 'waiting',
            currentFlag: 0,
            totalFlags: 10,
            roundStartTime: null,
            roundDuration: 10000, // 10 seconds per flag
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

            // Always try Supabase first if available
            if (this.validateSupabaseConnection()) {
                console.log('🔄 Creating game with Supabase...', this.gameId);
                
                try {
                    // Create game in Supabase
                    const { data: gameData, error: gameError } = await this.supabase
                        .from('multiplayer_games')
                        .insert({
                            game_id: this.gameId,
                            total_flags: flagCount,
                            continent: continent,
                            host_id: this.playerId,
                            status: 'waiting',
                            round_duration: 10000 // 10 seconds per flag
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
                } catch (supabaseError) {
                    console.error('Supabase creation failed, falling back to localStorage:', supabaseError);
                    // Fall through to localStorage fallback
                }
            }
            
            // Use local fallback
            console.log('🔄 Creating game with localStorage fallback...');
            return this.createGameLocal(flagCount, continent);
            
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
            this.localGameState.roundDuration = 10000; // 10 seconds
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
            
            // Also store in a global registry for easier lookup
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
            this.gameId = gameId.toUpperCase(); // Ensure uppercase for consistency
            this.playerId = this.generatePlayerId();
            this.isHost = false;

            console.log('🔄 Attempting to join game:', this.gameId);

            // Always try Supabase first if available
            if (this.validateSupabaseConnection()) {
                console.log('🔄 Trying Supabase first...');
                
                try {
                    // Check if game exists and get its data
                    const { data: gameData, error: gameError } = await this.supabase
                        .from('multiplayer_games')
                        .select('*')
                        .eq('game_id', this.gameId)
                        .single();

                    if (gameError && gameError.code !== 'PGRST116') {
                        // Real error, not just "no rows"
                        console.error('Database error:', gameError);
                        throw new Error(`Database error: ${gameError.message}`);
                    }

                    if (gameData) {
                        console.log('✅ Game found in Supabase:', gameData);

                        // Check if game is still joinable
                        if (gameData.status === 'finished') {
                            // Get final game state for late joiners
                            const gameState = await this.fetchGameState();
                            return {
                                success: true,
                                gameId: this.gameId,
                                playerId: this.playerId,
                                gameState: gameState
                            };
                        }

                        // Add player to the game
                        const playerNickname = nickname || `Player ${Date.now().toString().slice(-4)}`;
                        const { error: playerError } = await this.supabase
                            .from('multiplayer_players')
                            .insert({
                                game_id: this.gameId,
                                player_id: this.playerId,
                                nickname: playerNickname,
                                is_host: false,
                                score: 0,
                                answers: []
                            });

                        if (playerError) {
                            console.error('Failed to add player:', playerError);
                            throw new Error(`Failed to join: ${playerError.message}`);
                        }

                        // Get current game state
                        const gameState = await this.fetchGameState();

                        console.log('✅ Joined game successfully with Supabase:', this.gameId);
                        
                        return {
                            success: true,
                            gameId: this.gameId,
                            playerId: this.playerId,
                            gameState: gameState
                        };
                    } else {
                        console.log('🔄 Game not found in Supabase, trying localStorage...');
                        // Fall through to localStorage
                    }
                } catch (supabaseError) {
                    console.error('Supabase join failed, trying localStorage:', supabaseError);
                    // Fall through to localStorage
                }
            }
            
            // Try localStorage fallback
            console.log('🔄 Trying localStorage fallback...');
            return this.joinGameLocal(this.gameId, nickname);
            
        } catch (error) {
            console.error('Failed to join game:', error);
            return { 
                success: false, 
                error: `Failed to join game: ${error.message}. Make sure the game ID is correct and the game was created recently.` 
            };
        }
    }

    // Local fallback for joining game
    joinGameLocal(gameId, nickname) {
        try {
            const storageKey = 'multiplayerGame_' + gameId;
            const gameData = localStorage.getItem(storageKey);
            
            console.log('🔍 Looking for local game:', gameId, gameData ? 'found' : 'not found');
            
            if (!gameData) {
                // Check in allMultiplayerGames registry
                const allGames = JSON.parse(localStorage.getItem('allMultiplayerGames') || '{}');
                console.log('🔍 All local games:', Object.keys(allGames));
                
                if (!allGames[gameId]) {
                    console.error('❌ Game not found in localStorage:', gameId);
                    return { 
                        success: false, 
                        error: 'Game not found. Make sure the game ID is correct and the game was created recently.' 
                    };
                }
                
                // Game exists in registry but no data - this shouldn't happen, but handle it
                console.warn('⚠️ Game found in registry but no game data, creating minimal state');
                this.localGameState = {
                    gameId: gameId,
                    status: 'waiting',
                    currentFlag: 0,
                    totalFlags: 10,
                    roundStartTime: null,
                    roundDuration: 10000, // 10 seconds
                    players: {},
                    flags: [],
                    continent: 'all',
                    hostId: allGames[gameId].hostId
                };
            } else {
                this.localGameState = JSON.parse(gameData);
            }

            // Add this player to the game
            const playerNickname = nickname || `Player ${Object.keys(this.localGameState.players).length + 1}`;
            this.localGameState.players[this.playerId] = {
                id: this.playerId,
                nickname: playerNickname,
                isHost: false,
                score: 0,
                answers: [],
                connected: true,
                joinedAt: Date.now()
            };

            // Save updated game state
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
            return { 
                success: false, 
                error: `Local join failed: ${error.message}` 
            };
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
            const now = Date.now();
            
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
                this.lastAdvanceTime = now;
                this.currentRoundStartTime = now;
                return { success: true };
            } else {
                // Local fallback
                this.localGameState.status = 'playing';
                this.localGameState.flags = flags;
                this.localGameState.currentFlag = 0;
                this.localGameState.roundStartTime = now;
                this.lastAdvanceTime = now;
                this.currentRoundStartTime = now;
                
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

    // Calculate time remaining for current round - FIXED
    getTimeRemaining() {
        const gameState = this.useRealBackend ? this.gameState : this.localGameState;
        if (!gameState || !gameState.roundStartTime || gameState.status !== 'playing') {
            return 0;
        }

        // Use the stored round start time from the game state
        const roundStartTime = gameState.roundStartTime;
        const elapsed = Date.now() - roundStartTime;
        const remaining = Math.max(0, gameState.roundDuration - elapsed);
        
        return Math.ceil(remaining / 1000);
    }

    // Check if we should advance to next flag - IMPROVED LOGIC
    shouldAdvanceFlag() {
        const gameState = this.useRealBackend ? this.gameState : this.localGameState;
        if (!gameState || gameState.status !== 'playing') {
            console.log('❌ Not advancing - game not playing or no state');
            return false;
        }
        
        // Prevent advancement if already in progress
        if (this.advancementInProgress) {
            console.log('❌ Not advancing - advancement already in progress');
            return false;
        }
        
        const now = Date.now();
        
        // Must wait at least 3 seconds since last advance to prevent rapid advances
        const timeSinceLastAdvance = now - this.lastAdvanceTime;
        if (timeSinceLastAdvance < 3000) {
            console.log('❌ Not advancing - only', timeSinceLastAdvance, 'ms since last advance (need 3000ms)');
            return false;
        }
        
        // Check if round time has actually elapsed
        const timeRemaining = this.getTimeRemaining();
        const shouldAdvance = timeRemaining <= 0;
        
        if (shouldAdvance) {
            console.log('✅ Should advance! Time remaining:', timeRemaining, 'Current flag:', gameState.currentFlag, 'Total:', gameState.totalFlags);
        } else {
            console.log('⏳ Not advancing yet - time remaining:', timeRemaining, 'seconds');
        }
        
        return shouldAdvance;
    }

    // Advance to next flag (auto-sync) - IMPROVED WITH LOCKS
    async advanceToNextFlag() {
        if (!this.isHost) {
            console.log('❌ Not host - cannot advance');
            return;
        }

        // Prevent concurrent advances
        if (this.advancementInProgress) {
            console.log('❌ Advancement already in progress - skipping');
            return;
        }

        this.advancementInProgress = true;
        const now = Date.now();
        
        try {
            // Double-check timing to prevent rapid advances
            const timeSinceLastAdvance = now - this.lastAdvanceTime;
            if (timeSinceLastAdvance < 3000) {
                console.log('❌ Skipping advance - too soon since last advance:', timeSinceLastAdvance, 'ms');
                return;
            }

            if (this.validateSupabaseConnection()) {
                const gameState = await this.fetchGameState();
                if (!gameState) {
                    console.log('❌ No game state - cannot advance');
                    return;
                }

                const nextFlag = gameState.currentFlag + 1;
                
                console.log('🚀 Host advancing from flag', gameState.currentFlag, 'to', nextFlag, 'of', gameState.totalFlags);
                
                if (nextFlag >= gameState.totalFlags) {
                    // Game finished
                    console.log('🏁 Game finished! All flags completed.');
                    await this.supabase
                        .from('multiplayer_games')
                        .update({
                            status: 'finished',
                            round_start_time: null
                        })
                        .eq('game_id', this.gameId);
                } else {
                    // Next flag - set new round start time
                    const newRoundStartTime = new Date().toISOString();
                    console.log('➡️ Moving to next flag:', nextFlag, 'New round start:', newRoundStartTime);
                    
                    await this.supabase
                        .from('multiplayer_games')
                        .update({
                            current_flag: nextFlag,
                            round_start_time: newRoundStartTime
                        })
                        .eq('game_id', this.gameId);
                }
                
                this.lastAdvanceTime = now;
                this.currentRoundStartTime = now;
            } else {
                // Local fallback
                const nextFlag = this.localGameState.currentFlag + 1;
                
                console.log('🚀 Local host advancing from flag', this.localGameState.currentFlag, 'to', nextFlag, 'of', this.localGameState.totalFlags);
                
                this.localGameState.currentFlag = nextFlag;
                
                if (nextFlag >= this.localGameState.totalFlags) {
                    this.localGameState.status = 'finished';
                    this.localGameState.roundStartTime = null;
                    console.log('🏁 Local game finished!');
                } else {
                    this.localGameState.roundStartTime = now;
                    this.currentRoundStartTime = now;
                    console.log('➡️ Local moving to next flag:', nextFlag);
                }
                
                const storageKey = 'multiplayerGame_' + this.gameId;
                localStorage.setItem(storageKey, JSON.stringify(this.localGameState));
                
                this.lastAdvanceTime = now;
            }
        } catch (error) {
            console.error('Error advancing to next flag:', error);
        } finally {
            // Always release the lock
            this.advancementInProgress = false;
        }
    }

    // Start syncing with real-time updates - IMPROVED TIMING
    startSync(onStateUpdate) {
        if (this.validateSupabaseConnection()) {
            // Use Supabase real-time subscriptions
            this.startRealtimeSync(onStateUpdate);
        } else {
            // Fallback to polling for localStorage
            this.startPollingSync(onStateUpdate);
        }
    }

    // Start real-time sync with Supabase - IMPROVED
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
                        console.log('🔄 Game updated via realtime:', payload);
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
                        console.log('🔄 Players updated via realtime:', payload);
                        const gameState = await this.fetchGameState();
                        if (gameState && onStateUpdate) {
                            onStateUpdate(gameState);
                        }
                    }
                )
                .subscribe();

            // Timer-based updates for host advancement - LESS FREQUENT
            this.syncInterval = setInterval(async () => {
                // Only host should check for auto-advance
                if (this.isHost && this.shouldAdvanceFlag()) {
                    console.log('⏰ Timer triggered advancement');
                    await this.advanceToNextFlag();
                }
                
                // Update timer display for all players (less frequently)
                const gameState = await this.fetchGameState();
                if (gameState && onStateUpdate) {
                    onStateUpdate(gameState);
                }
            }, 2000); // Check every 2 seconds instead of 1 second
        } catch (error) {
            console.error('Error starting realtime sync:', error);
            // Fallback to polling
            this.startPollingSync(onStateUpdate);
        }
    }

    // Start polling sync for localStorage fallback - IMPROVED
    startPollingSync(onStateUpdate) {
        this.syncInterval = setInterval(async () => {
            const result = await this.getGameState();
            if (result.success && onStateUpdate) {
                onStateUpdate(result.gameState);
                
                // Only host should check for auto-advance
                if (this.isHost && this.shouldAdvanceFlag()) {
                    console.log('⏰ Polling triggered advancement');
                    await this.advanceToNextFlag();
                }
            }
        }, 2000); // Check every 2 seconds instead of 1 second
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
        
        // Reset advancement state
        this.advancementInProgress = false;
        this.lastAdvanceTime = 0;
        this.currentRoundStartTime = null;
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
        this.lastAdvanceTime = 0;
        this.advancementInProgress = false;
        this.currentRoundStartTime = null;
    }
}

window.MultiplayerSync = MultiplayerSync;