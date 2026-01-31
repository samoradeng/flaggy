/*
  # Add rematch game ID column

  1. Changes
    - Add `rematch_game_id` column to `multiplayer_games` table
    - This allows storing the new game ID when host creates a rematch
    - Other players can poll this column to find and join the rematch

  2. Purpose
    - Enables "Quick Rematch" feature where host can create a new game
    - Other players are notified and can join with one click
    - No need to share game codes again
*/

-- Add rematch_game_id column to multiplayer_games
ALTER TABLE multiplayer_games
ADD COLUMN IF NOT EXISTS rematch_game_id text;

-- Add index for faster lookups when polling for rematch
CREATE INDEX IF NOT EXISTS idx_multiplayer_games_rematch_game_id
ON multiplayer_games(rematch_game_id)
WHERE rematch_game_id IS NOT NULL;
