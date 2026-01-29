/*
  # Add language and status fields to Novels table

  1. Changes
    - Add `language` column to Novels table
    - Add `status` column to Novels table with values 'ongoing' or 'completed'
  
  2. Notes
    - Uses safe ALTER TABLE operations with IF NOT EXISTS checks
    - Adds default values for backward compatibility
*/

-- Add language column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Novels' AND column_name = 'language'
  ) THEN
    ALTER TABLE "Novels" ADD COLUMN language TEXT DEFAULT 'English';
  END IF;
END $$;

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Novels' AND column_name = 'status'
  ) THEN
    ALTER TABLE "Novels" ADD COLUMN status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed'));
  END IF;
END $$;