-- Create learning_activity table to track user learning sessions
CREATE TABLE IF NOT EXISTS learning_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('lesson', 'quiz', 'challenge')),
    lesson_id TEXT,
    quiz_id TEXT,
    xp_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, activity_date, activity_type, lesson_id, quiz_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_learning_activity_user_date 
ON learning_activity(user_id, activity_date);

-- Enable Row Level Security
ALTER TABLE learning_activity ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own learning activity"
    ON learning_activity FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning activity"
    ON learning_activity FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning activity"
    ON learning_activity FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_learning_activity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_learning_activity_updated_at
    BEFORE UPDATE ON learning_activity
    FOR EACH ROW
    EXECUTE FUNCTION update_learning_activity_updated_at(); 