/*
  # Add reading time tracking

  1. New Tables
    - `Reading_Time_Logs`
      - `log_id` (uuid, primary key)
      - `user_id` (uuid, references Users)
      - `novel_id` (uuid, references Novels)
      - `chapter_id` (uuid, references Chapters)
      - `reading_date` (date)
      - `reading_duration` (interval)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `Reading_Time_Logs` table
    - Add policies for authenticated users
*/

-- Create Reading Time Logs table
CREATE TABLE IF NOT EXISTS "Reading_Time_Logs" (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "Users"(user_id) ON DELETE CASCADE,
  novel_id UUID REFERENCES "Novels"(novel_id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES "Chapters"(chapter_id) ON DELETE CASCADE,
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reading_duration INTERVAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  CONSTRAINT valid_duration CHECK (reading_duration >= '0 seconds'::interval)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reading_logs_user_date 
ON "Reading_Time_Logs" (user_id, reading_date);

-- Enable RLS
ALTER TABLE "Reading_Time_Logs" ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own reading logs"
ON "Reading_Time_Logs"
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reading logs"
ON "Reading_Time_Logs"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to get reading stats for a user
CREATE OR REPLACE FUNCTION get_user_reading_stats(
  user_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  reading_date DATE,
  total_duration INTERVAL,
  novels_read INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rl.reading_date,
    SUM(rl.reading_duration) as total_duration,
    COUNT(DISTINCT rl.novel_id) as novels_read
  FROM "Reading_Time_Logs" rl
  WHERE 
    rl.user_id = user_uuid AND
    rl.reading_date BETWEEN start_date AND end_date
  GROUP BY rl.reading_date
  ORDER BY rl.reading_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;