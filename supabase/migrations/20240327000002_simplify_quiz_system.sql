-- Drop existing quiz-related functions and triggers
DROP TRIGGER IF EXISTS validate_quiz_attempt ON quiz_attempts;
DROP TRIGGER IF EXISTS record_quiz_learning_activity ON quiz_attempts;
DROP FUNCTION IF EXISTS validate_quiz_attempt();
DROP FUNCTION IF EXISTS record_quiz_learning_activity();
DROP FUNCTION IF EXISTS complete_quiz_transaction();
DROP FUNCTION IF EXISTS update_profile_quiz_completion();

-- Drop and recreate quiz_attempts table with simplified schema
DROP TABLE IF EXISTS quiz_attempts CASCADE;

CREATE TABLE quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    quiz_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_taken INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    is_perfect BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_score CHECK (score >= 0 AND score <= total_questions),
    CONSTRAINT valid_time CHECK (time_taken >= 0)
);

-- Create index for faster queries
CREATE INDEX idx_quiz_attempts_profile_quiz 
ON quiz_attempts(profile_id, quiz_id);

-- Enable RLS
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own quiz attempts"
    ON quiz_attempts FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own quiz attempts"
    ON quiz_attempts FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

-- Function to calculate XP for a quiz attempt
CREATE OR REPLACE FUNCTION calculate_quiz_xp(
    p_score INTEGER,
    p_total_questions INTEGER,
    p_time_taken INTEGER
) RETURNS INTEGER AS $$
DECLARE
    v_score_percentage FLOAT;
    v_base_xp INTEGER := 100;  -- Base XP for passing
    v_perfect_bonus INTEGER := 50;  -- Bonus for perfect score
    v_time_bonus INTEGER;  -- Bonus for quick completion
    v_xp INTEGER;
BEGIN
    -- Calculate score percentage
    v_score_percentage := (p_score::FLOAT / p_total_questions) * 100;
    
    -- Calculate time bonus (max 20 XP for completing in under 30 seconds)
    v_time_bonus := GREATEST(0, 20 - (p_time_taken / 30));
    
    -- Calculate total XP
    IF v_score_percentage >= 80 THEN  -- Passed quiz
        v_xp := v_base_xp + v_time_bonus;
        IF v_score_percentage = 100 THEN  -- Perfect score
            v_xp := v_xp + v_perfect_bonus;
        END IF;
    ELSE  -- Failed quiz
        v_xp := 0;
    END IF;
    
    RETURN v_xp;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to complete a quiz
CREATE OR REPLACE FUNCTION complete_quiz(
    p_profile_id UUID,
    p_quiz_id TEXT,
    p_score INTEGER,
    p_total_questions INTEGER,
    p_time_taken INTEGER
) RETURNS TABLE (
    xp_earned INTEGER,
    is_perfect BOOLEAN,
    passed BOOLEAN
) AS $$
DECLARE
    v_xp INTEGER;
    v_is_perfect BOOLEAN;
    v_passed BOOLEAN;
    v_score_percentage FLOAT;
BEGIN
    -- Calculate score percentage
    v_score_percentage := (p_score::FLOAT / p_total_questions) * 100;
    v_is_perfect := v_score_percentage = 100;
    v_passed := v_score_percentage >= 80;
    
    -- Calculate XP
    v_xp := calculate_quiz_xp(p_score, p_total_questions, p_time_taken);
    
    -- Insert quiz attempt
    INSERT INTO quiz_attempts (
        profile_id,
        quiz_id,
        score,
        total_questions,
        time_taken,
        xp_earned,
        is_perfect
    ) VALUES (
        p_profile_id,
        p_quiz_id,
        p_score,
        p_total_questions,
        p_time_taken,
        v_xp,
        v_is_perfect
    );
    
    -- Update profile XP
    UPDATE profiles
    SET 
        xp = xp + v_xp,
        completed_quizzes = array_append(
            COALESCE(completed_quizzes, ARRAY[]::INTEGER[]),
            p_quiz_id::INTEGER
        ),
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
        'quiz',
        p_quiz_id,
        v_xp
    );
    
    -- Return results
    RETURN QUERY SELECT v_xp, v_is_perfect, v_passed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_quiz TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_quiz_xp TO authenticated; 