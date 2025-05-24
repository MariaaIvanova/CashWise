-- Create a new table for personality test results
CREATE TABLE IF NOT EXISTS personality_test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    test_id TEXT NOT NULL,
    personality_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_taken INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_score CHECK (score >= 0 AND score <= total_questions),
    CONSTRAINT valid_time CHECK (time_taken >= 0)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_personality_tests_profile 
ON personality_test_results(profile_id, test_id);

CREATE INDEX IF NOT EXISTS idx_personality_tests_type 
ON personality_test_results(profile_id, personality_type);

-- Enable RLS
ALTER TABLE personality_test_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own personality test results"
    ON personality_test_results FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own personality test results"
    ON personality_test_results FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

-- Update the complete_financial_personality function to use the new table
CREATE OR REPLACE FUNCTION complete_financial_personality(
    p_profile_id UUID,
    p_quiz_id TEXT,
    p_score INTEGER,
    p_time_taken INTEGER,
    p_total_questions INTEGER,
    p_personality_type TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_xp INTEGER := 100; -- Base XP for completing personality test
    v_is_perfect BOOLEAN;
    v_passed BOOLEAN := true; -- Personality tests always pass
    v_result JSONB;
BEGIN
    -- Verify user has access
    IF p_profile_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized to complete quiz for this user';
    END IF;

    -- Calculate if perfect score
    v_is_perfect := p_score = p_total_questions;

    -- Insert personality test result
    INSERT INTO personality_test_results (
        profile_id,
        test_id,
        personality_type,
        score,
        total_questions,
        time_taken
    ) VALUES (
        p_profile_id,
        p_quiz_id,
        p_personality_type,
        p_score,
        p_total_questions,
        p_time_taken
    );

    -- Update profile XP without modifying completed_quizzes array
    UPDATE profiles
    SET 
        xp = xp + v_xp,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_profile_id;

    -- Record learning activity
    INSERT INTO learning_activity (
        user_id,
        activity_date,
        activity_type,
        quiz_id,
        xp_earned
    ) VALUES (
        p_profile_id,
        CURRENT_DATE,
        'personality_test',
        p_quiz_id,
        v_xp
    );

    -- Return result as JSONB
    v_result := jsonb_build_object(
        'xp_earned', v_xp,
        'is_perfect', v_is_perfect,
        'passed', v_passed,
        'personality_type', p_personality_type
    );

    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_financial_personality TO authenticated;

-- Verify the new table and function
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'personality_test_results'
    ) THEN
        RAISE EXCEPTION 'personality_test_results table was not created';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'complete_financial_personality'
        AND n.nspname = 'public'
    ) THEN
        RAISE EXCEPTION 'complete_financial_personality function was not created';
    END IF;
END $$; 