/*
  # Fix Library and Reading Progress Foreign Keys

  1. Changes
    - Drop existing foreign key constraints
    - Recreate foreign key constraints with proper ON DELETE CASCADE
    - Add indexes for better query performance
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing foreign key constraints
ALTER TABLE "Library" 
  DROP CONSTRAINT IF EXISTS "Library_user_id_fkey",
  DROP CONSTRAINT IF EXISTS "Library_novel_id_fkey";

ALTER TABLE "Reading_Progress"
  DROP CONSTRAINT IF EXISTS "Reading_Progress_user_id_fkey",
  DROP CONSTRAINT IF EXISTS "Reading_Progress_novel_id_fkey",
  DROP CONSTRAINT IF EXISTS "Reading_Progress_chapter_id_fkey";

-- Recreate foreign key constraints with ON DELETE CASCADE
ALTER TABLE "Library"
  ADD CONSTRAINT "Library_user_id_fkey" 
    FOREIGN KEY (user_id) 
    REFERENCES "Users"(user_id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT "Library_novel_id_fkey" 
    FOREIGN KEY (novel_id) 
    REFERENCES "Novels"(novel_id) 
    ON DELETE CASCADE;

ALTER TABLE "Reading_Progress"
  ADD CONSTRAINT "Reading_Progress_user_id_fkey" 
    FOREIGN KEY (user_id) 
    REFERENCES "Users"(user_id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT "Reading_Progress_novel_id_fkey" 
    FOREIGN KEY (novel_id) 
    REFERENCES "Novels"(novel_id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT "Reading_Progress_chapter_id_fkey" 
    FOREIGN KEY (chapter_id) 
    REFERENCES "Chapters"(chapter_id) 
    ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_library_user_id" ON "Library"(user_id);
CREATE INDEX IF NOT EXISTS "idx_library_novel_id" ON "Library"(novel_id);
CREATE INDEX IF NOT EXISTS "idx_reading_progress_user_id" ON "Reading_Progress"(user_id);
CREATE INDEX IF NOT EXISTS "idx_reading_progress_novel_id" ON "Reading_Progress"(novel_id);
CREATE INDEX IF NOT EXISTS "idx_reading_progress_chapter_id" ON "Reading_Progress"(chapter_id);