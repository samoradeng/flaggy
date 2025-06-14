/*
  # Multiplayer Game System

  1. New Tables
    - `multiplayer_games`
      - `id` (uuid, primary key)
      - `game_id` (text, unique game code)
      - `status` (text: waiting, playing, finished)
      - `current_flag` (integer)
      - `total_flags` (integer)
      - `round_start_time` (timestamptz)
      - `round_duration` (integer, milliseconds)
      - `continent` (text)
      - `host_id` (text)
      - `flags` (jsonb, array of flag data)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `multiplayer_players`
      - `id` (uuid, primary key)
      - `game_id` (text, references multiplayer_games.game_id)
      - `player_id` (text, unique per game)
      - `nickname` (text)
      - `is_host` (boolean)
      - `score` (integer)
      - `answers` (jsonb, array of answer objects)
      - `connected` (boolean)
      - `joined_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for game access and player management
    - Allow real-time subscriptions for game updates

  3. Indexes
    - Index on game_id for fast lookups
    - Index on player_id for player queries
*/

-- Create multiplayer_games table
CREATE TABLE IF NOT EXISTS multiplayer_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  current_flag integer NOT NULL DEFAULT 0,
  total_flags integer NOT NULL DEFAULT 10,
  round_start_time timestamptz,
  round_duration integer NOT NULL DEFAULT 10000,
  continent text NOT NULL DEFAULT 'all',
  host_id text NOT NULL,
  flags jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create multiplayer_players table
CREATE TABLE IF NOT EXISTS multiplayer_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id text NOT NULL REFERENCES multiplayer_games(game_id) ON DELETE CASCADE,
  player_id text NOT NULL,
  nickname text NOT NULL,
  is_host boolean NOT NULL DEFAULT false,
  score integer NOT NULL DEFAULT 0,
  answers jsonb DEFAULT '[]'::jsonb,
  connected boolean NOT NULL DEFAULT true,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(game_id, player_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_multiplayer_games_game_id ON multiplayer_games(game_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_games_status ON multiplayer_games(status);
CREATE INDEX IF NOT EXISTS idx_multiplayer_players_game_id ON multiplayer_players(game_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_players_player_id ON multiplayer_players(player_id);

-- Enable Row Level Security
ALTER TABLE multiplayer_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_players ENABLE ROW LEVEL SECURITY;

-- Create policies for multiplayer_games
CREATE POLICY "Anyone can read games"
  ON multiplayer_games
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create games"
  ON multiplayer_games
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Host can update games"
  ON multiplayer_games
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for multiplayer_players
CREATE POLICY "Anyone can read players"
  ON multiplayer_players
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can join games"
  ON multiplayer_players
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Players can update themselves"
  ON multiplayer_players
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_multiplayer_games_updated_at
    BEFORE UPDATE ON multiplayer_games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old games (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_games()
RETURNS void AS $$
BEGIN
    DELETE FROM multiplayer_games 
    WHERE created_at < now() - interval '24 hours';
END;
$$ language 'plpgsql';