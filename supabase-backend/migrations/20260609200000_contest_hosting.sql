-- ============================================================================
-- MIGRATION: Contest Hosting Feature
-- Timestamp: 20260609200000
-- ============================================================================

-- 1. Create contests table
CREATE TABLE IF NOT EXISTS public.contests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  prize TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  requires_new_novel BOOLEAN DEFAULT FALSE,
  banner_image_url TEXT,
  winner_novel_id UUID REFERENCES public.novels(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on contests
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;

-- Create policies for contests
DROP POLICY IF EXISTS "Allow public read access to contests" ON public.contests;
CREATE POLICY "Allow public read access to contests" 
  ON public.contests FOR SELECT 
  TO public 
  USING (true);

DROP POLICY IF EXISTS "Allow admins full access to contests" ON public.contests;
CREATE POLICY "Allow admins full access to contests" 
  ON public.contests FOR ALL 
  TO authenticated 
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 2. Create contest_submissions table
CREATE TABLE IF NOT EXISTS public.contest_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  votes_count INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contest_id, novel_id)
);

-- Enable RLS on contest_submissions
ALTER TABLE public.contest_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for contest_submissions
DROP POLICY IF EXISTS "Allow public read access to contest_submissions" ON public.contest_submissions;
CREATE POLICY "Allow public read access to contest_submissions" 
  ON public.contest_submissions FOR SELECT 
  TO public 
  USING (true);

DROP POLICY IF EXISTS "Allow users to submit their own novels" ON public.contest_submissions;
CREATE POLICY "Allow users to submit their own novels" 
  ON public.contest_submissions FOR INSERT 
  TO authenticated 
  WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM public.novels n
      JOIN public.contests c ON c.id = contest_submissions.contest_id
      WHERE n.id = novel_id 
        AND n.author_id = auth.uid()
        AND (NOT c.requires_new_novel OR n.created_at >= c.start_date)
    )
  );

DROP POLICY IF EXISTS "Allow users to withdraw their submissions" ON public.contest_submissions;
CREATE POLICY "Allow users to withdraw their submissions" 
  ON public.contest_submissions FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow admins full update control over submissions" ON public.contest_submissions;
CREATE POLICY "Allow admins full update control over submissions" 
  ON public.contest_submissions FOR UPDATE 
  TO authenticated 
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 3. Create contest_votes table
CREATE TABLE IF NOT EXISTS public.contest_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.contest_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contest_id, user_id)
);

-- Enable RLS on contest_votes
ALTER TABLE public.contest_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for contest_votes
DROP POLICY IF EXISTS "Allow public read access to contest_votes" ON public.contest_votes;
CREATE POLICY "Allow public read access to contest_votes" 
  ON public.contest_votes FOR SELECT 
  TO public 
  USING (true);

DROP POLICY IF EXISTS "Allow users to vote" ON public.contest_votes;
CREATE POLICY "Allow users to vote" 
  ON public.contest_votes FOR INSERT 
  TO authenticated 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.contest_submissions 
      WHERE id = submission_id AND contest_id = contest_votes.contest_id
    )
  );

DROP POLICY IF EXISTS "Allow users to remove their vote" ON public.contest_votes;
CREATE POLICY "Allow users to remove their vote" 
  ON public.contest_votes FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 4. Create trigger to update votes_count in contest_submissions
CREATE OR REPLACE FUNCTION update_contest_submission_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.contest_submissions
    SET votes_count = votes_count + 1
    WHERE id = NEW.submission_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.contest_submissions
    SET votes_count = GREATEST(votes_count - 1, 0)
    WHERE id = OLD.submission_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_contest_submission_vote_count ON public.contest_votes;
CREATE TRIGGER trigger_update_contest_submission_vote_count
AFTER INSERT OR DELETE ON public.contest_votes
FOR EACH ROW
EXECUTE FUNCTION update_contest_submission_vote_count();

-- 5. Create Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_contests_dates ON public.contests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_submissions_contest ON public.contest_submissions(contest_id);
CREATE INDEX IF NOT EXISTS idx_submissions_novel ON public.contest_submissions(novel_id);
CREATE INDEX IF NOT EXISTS idx_votes_contest_user ON public.contest_votes(contest_id, user_id);
