-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT,
    xp_reward INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for achievements
CREATE POLICY "Everyone can view achievements"
    ON achievements FOR SELECT
    USING (true);

-- Create policies for user_achievements
CREATE POLICY "Users can view their own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
    ON user_achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO achievements (title, description, icon, xp_reward) VALUES
    ('Първи стъпки', 'Завърши първия си урок', 'star', 100),
    ('Постоянство', 'Поддържай серия от 7 дни', 'fire', 200),
    ('Експерт', 'Завърши 10 урока', 'book', 300),
    ('Майстор на тестовете', 'Завърши 5 теста с отличен резултат', 'pencil', 250),
    ('Социална пеперуда', 'Свържи профила си със социални мрежи', 'share', 150),
    ('Ученолюбив', 'Достигни ниво 5', 'trophy', 500),
    ('Приятелски дух', 'Покани приятел да се присъедини към приложението и получи XP', 'account-multiple', 300); 