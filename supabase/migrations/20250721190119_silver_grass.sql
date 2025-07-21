/*
  # Fix multiplayer game results RLS policy

  1. Security Changes
    - Add new RLS policy to allow reading all player data for finished games
    - This enables the results screen to display all players' scores and rankings
    - Policy only applies when game status is 'finished' for security

  2. Problem Solved
    - Fixes "No results available" error in multiplayer games
    - Allows leaderboard to display properly after game completion
    - Maintains security by only allowing access to finished game data
*/

-- Create policy to allow reading all players for finished games
CREATE POLICY "Allow reading players for finished games"
  ON multiplayer_players
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM multiplayer_games
      WHERE multiplayer_games.game_id = multiplayer_players.game_id
        AND multiplayer_games.status = 'finished'
    )
  );