-- Create completed_challenges table
CREATE TABLE IF NOT EXISTS completed_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL,
    completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, challenge_id, completed_date)
);

-- Enable Row Level Security
ALTER TABLE completed_challenges ENABLE ROW LEVEL SECURITY;

-- Create policies for completed_challenges
CREATE POLICY "Users can view their own completed challenges"
    ON completed_challenges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed challenges"
    ON completed_challenges FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT ON public.completed_challenges TO authenticated;
GRANT SELECT, INSERT ON public.completed_challenges TO service_role; 