-- Use a DO block to handle drops safely
DO $$ 
BEGIN
    -- Drop triggers if they exist
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
    DROP TRIGGER IF EXISTS update_profile_updated_at ON profiles;
    DROP TRIGGER IF EXISTS create_user_settings ON profiles;
    DROP TRIGGER IF EXISTS create_user_achievements ON profiles;
    DROP TRIGGER IF EXISTS create_user_progress ON profiles;

    -- Drop functions if they exist
    DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
    DROP FUNCTION IF EXISTS update_profile_updated_at();
    DROP FUNCTION IF EXISTS create_initial_user_settings() CASCADE;
    DROP FUNCTION IF EXISTS create_initial_user_achievements() CASCADE;
    DROP FUNCTION IF EXISTS create_initial_user_progress() CASCADE;

    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
    DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
    DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
    DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
    DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
    DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
    DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;
    DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
    DROP POLICY IF EXISTS "Authenticated users can view lessons" ON lessons;
    DROP POLICY IF EXISTS "Users can view their own quiz attempts" ON quiz_attempts;
    DROP POLICY IF EXISTS "Users can insert their own quiz attempts" ON quiz_attempts;
    DROP POLICY IF EXISTS "Everyone can view leaderboard" ON leaderboard;
    DROP POLICY IF EXISTS "Users can update their own leaderboard entry" ON leaderboard;
    DROP POLICY IF EXISTS "Users can insert their own leaderboard entry" ON leaderboard;
    DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;
    DROP POLICY IF EXISTS "Users can insert their own feedback" ON feedback;
    DROP POLICY IF EXISTS "Users can update their own feedback" ON feedback;

    -- Drop tables if they exist
    DROP TABLE IF EXISTS feedback CASCADE;
    DROP TABLE IF EXISTS leaderboard CASCADE;
    DROP TABLE IF EXISTS quiz_attempts CASCADE;
    DROP TABLE IF EXISTS user_progress CASCADE;
    DROP TABLE IF EXISTS user_achievements CASCADE;
    DROP TABLE IF EXISTS user_settings CASCADE;
    DROP TABLE IF EXISTS lessons CASCADE;
    DROP TABLE IF EXISTS profiles CASCADE;
EXCEPTION
    WHEN undefined_table THEN
        -- If a table doesn't exist, just continue
        NULL;
END $$;

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    xp_reward INTEGER DEFAULT 0,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert some default lessons
INSERT INTO lessons (id, title, description, content, difficulty, xp_reward, order_index) VALUES
    ('intro-to-finance', 'Introduction to Finance', 'Learn the basics of personal finance', 'Welcome to the world of finance!...', 'beginner', 50, 1),
    ('budgeting-101', 'Budgeting Basics', 'Master the art of budgeting', 'Budgeting is the foundation of financial success...', 'beginner', 50, 2),
    ('saving-strategies', 'Smart Saving Strategies', 'Learn how to save effectively', 'Saving money is a crucial financial habit...', 'beginner', 50, 3),
    ('investing-intro', 'Introduction to Investing', 'Start your investment journey', 'Investing is a powerful way to grow your wealth...', 'intermediate', 75, 4),
    ('debt-management', 'Managing Debt', 'Learn how to handle debt effectively', 'Understanding and managing debt is essential...', 'intermediate', 75, 5)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    content = EXCLUDED.content,
    difficulty = EXCLUDED.difficulty,
    xp_reward = EXCLUDED.xp_reward,
    order_index = EXCLUDED.order_index,
    updated_at = timezone('utc'::text, now());

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    avatar_url TEXT,
    age INTEGER,
    interests TEXT[],
    social_links JSONB DEFAULT '{"facebook": "", "linkedin": "", "instagram": ""}'::jsonb,
    xp INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    completed_lessons INTEGER DEFAULT 0,
    completed_quizzes INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
    referred_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    notifications_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    dark_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, achievement_id)
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, lesson_id)
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    quiz_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_taken INTEGER NOT NULL, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    rank INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(profile_id)
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('bug', 'suggestion', 'compliment')),
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create completed_challenges table
CREATE TABLE IF NOT EXISTS completed_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL,
    completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, challenge_id, completed_date)
);

-- Enable Row Level Security for all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles"
    ON profiles FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create policies for user_settings
CREATE POLICY "Users can view their own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create policies for user_achievements
CREATE POLICY "Users can view their own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
    ON user_achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policies for user_progress
CREATE POLICY "Users can view their own progress"
    ON user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
    ON user_progress FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
    ON user_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policies for lessons
CREATE POLICY "Authenticated users can view lessons"
    ON lessons FOR SELECT
    USING (auth.role() = 'authenticated');

-- Create policies for quiz_attempts
CREATE POLICY "Users can view their own quiz attempts"
    ON quiz_attempts FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own quiz attempts"
    ON quiz_attempts FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

-- Create policies for leaderboard
CREATE POLICY "Everyone can view leaderboard"
    ON leaderboard FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own leaderboard entry"
    ON leaderboard FOR UPDATE
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own leaderboard entry"
    ON leaderboard FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

-- Create policies for feedback
CREATE POLICY "Users can view their own feedback"
    ON feedback FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own feedback"
    ON feedback FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own feedback"
    ON feedback FOR UPDATE
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- Create policies for completed_challenges
CREATE POLICY "Users can view their own completed challenges"
    ON completed_challenges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed challenges"
    ON completed_challenges FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at on profiles
CREATE TRIGGER update_profile_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_updated_at();

-- Create function to create initial user settings
CREATE OR REPLACE FUNCTION create_initial_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create initial user achievements
CREATE OR REPLACE FUNCTION create_initial_user_achievements()
RETURNS TRIGGER AS $$
DECLARE
    has_is_initial BOOLEAN;
BEGIN
    -- Check if the is_initial column exists in the achievements table
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'achievements' 
        AND column_name = 'is_initial'
    ) INTO has_is_initial;

    -- If the column exists, use it to filter achievements
    IF has_is_initial THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT NEW.id, id
        FROM achievements
        WHERE is_initial = true
        ON CONFLICT DO NOTHING;
    ELSE
        -- If the column doesn't exist, just insert all achievements
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT NEW.id, id
        FROM achievements
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create initial user progress
CREATE OR REPLACE FUNCTION create_initial_user_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert initial progress records for all lessons
    INSERT INTO user_progress (user_id, lesson_id)
    SELECT NEW.id, id
    FROM lessons
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for initial data creation
CREATE TRIGGER create_user_settings
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_user_settings();

CREATE TRIGGER create_user_achievements
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_user_achievements();

CREATE TRIGGER create_user_progress
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_user_progress();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_achievements TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_progress TO service_role;
GRANT SELECT ON public.lessons TO authenticated;
GRANT SELECT ON public.lessons TO service_role;
GRANT USAGE ON TYPE uuid TO authenticated;
GRANT USAGE ON TYPE uuid TO service_role;

-- Grant permissions for completed_challenges
GRANT SELECT, INSERT ON public.completed_challenges TO authenticated;
GRANT SELECT, INSERT ON public.completed_challenges TO service_role; 