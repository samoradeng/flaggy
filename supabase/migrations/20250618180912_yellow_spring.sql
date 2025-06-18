/*
  # Daily Leaderboard System

  1. New Tables
    - `daily_leaderboard`
      - `id` (uuid, primary key)
      - `player_name` (text)
      - `country` (text)
      - `time_spent` (integer, seconds)
      - `attempts` (integer)
      - `date` (date)
      - `submitted_at` (timestamptz)

  2. Security
    - Enable RLS on daily_leaderboard table
    - Add policies for reading and submitting scores

  3. Indexes
    - Index on date for fast daily queries
    - Index on time_spent for leaderboard sorting
*/

-- Create daily_leaderboard table
CREATE TABLE IF NOT EXISTS daily_leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  country text NOT NULL DEFAULT 'Unknown',
  time_spent integer NOT NULL,
  attempts integer NOT NULL,
  date date NOT NULL,
  submitted_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_leaderboard_date ON daily_leaderboard(date);
CREATE INDEX IF NOT EXISTS idx_daily_leaderboard_time ON daily_leaderboard(date, time_spent);

-- Enable Row Level Security
ALTER TABLE daily_leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_leaderboard
CREATE POLICY "Anyone can read daily leaderboard"
  ON daily_leaderboard
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can submit to daily leaderboard"
  ON daily_leaderboard
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Function to clean up old leaderboard entries (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_leaderboard()
RETURNS void AS $$
BEGIN
    DELETE FROM daily_leaderboard 
    WHERE date < CURRENT_DATE - interval '30 days';
END;
$$ language 'plpgsql';