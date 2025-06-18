/*
  # Fair Leaderboard Scoring System

  1. Database Changes
    - Add `score` column for calculated ranking score
    - Add `milliseconds` column for precise timing
    - Update indexes for proper sorting
    - Add function to calculate fair scores

  2. Scoring Algorithm
    - Base score = time in milliseconds
    - Attempt penalty = (attempts - 1) * 10000ms
    - Final score = base_time + attempt_penalty
    - Lower score = better rank

  3. Examples
    - 1st attempt, 3000ms = 3000 points (rank 1)
    - 2nd attempt, 2000ms = 12000 points (rank 2)
    - This ensures first-attempt accuracy is rewarded
*/

-- Add new columns for fair scoring
ALTER TABLE daily_leaderboard 
ADD COLUMN IF NOT EXISTS time_milliseconds integer,
ADD COLUMN IF NOT EXISTS score integer;

-- Update existing records to use milliseconds (convert seconds to ms)
UPDATE daily_leaderboard 
SET time_milliseconds = time_spent * 1000
WHERE time_milliseconds IS NULL;

-- Function to calculate fair score
CREATE OR REPLACE FUNCTION calculate_leaderboard_score(time_ms integer, attempts integer)
RETURNS integer AS $$
BEGIN
    -- Base score is time in milliseconds
    -- Add penalty: (attempts - 1) * 10000ms (10 seconds per extra attempt)
    -- This ensures someone who gets it right first time always beats someone who needed multiple attempts
    RETURN time_ms + ((attempts - 1) * 10000);
END;
$$ language 'plpgsql';

-- Update score column for all existing records
UPDATE daily_leaderboard 
SET score = calculate_leaderboard_score(time_milliseconds, attempts)
WHERE score IS NULL;

-- Create trigger to automatically calculate score on insert/update
CREATE OR REPLACE FUNCTION update_leaderboard_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure we have milliseconds
    IF NEW.time_milliseconds IS NULL AND NEW.time_spent IS NOT NULL THEN
        NEW.time_milliseconds = NEW.time_spent * 1000;
    END IF;
    
    -- Calculate fair score
    NEW.score = calculate_leaderboard_score(NEW.time_milliseconds, NEW.attempts);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_leaderboard_score ON daily_leaderboard;
CREATE TRIGGER trigger_update_leaderboard_score
    BEFORE INSERT OR UPDATE ON daily_leaderboard
    FOR EACH ROW
    EXECUTE FUNCTION update_leaderboard_score();

-- Update indexes for proper sorting by score
DROP INDEX IF EXISTS idx_daily_leaderboard_time;
CREATE INDEX idx_daily_leaderboard_score ON daily_leaderboard(date, score);
CREATE INDEX idx_daily_leaderboard_score_global ON daily_leaderboard(score);

-- Make time_milliseconds and score NOT NULL for new records
ALTER TABLE daily_leaderboard 
ALTER COLUMN time_milliseconds SET NOT NULL,
ALTER COLUMN score SET NOT NULL;