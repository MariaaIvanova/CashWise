-- Add personality_type column to quiz_attempts table
ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS personality_type TEXT;

-- Add a comment to explain the column
COMMENT ON COLUMN quiz_attempts.personality_type IS 'Stores the personality type result for financial personality quizzes';

-- Update RLS policies to allow access to the new column
ALTER POLICY "Users can view their own quiz attempts" ON quiz_attempts
USING (auth.uid() = profile_id);

-- Create an index for faster queries on personality_type
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_personality_type 
ON quiz_attempts(profile_id, quiz_id, personality_type);

-- Update the complete_quiz function to handle personality type
CREATE OR REPLACE FUNCTION complete_quiz(
    p_profile_id UUID,
    p_quiz_id TEXT,
    p_score INTEGER,
    p_total_questions INTEGER,
    p_time_taken INTEGER,
    p_personality_type TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_xp INTEGER;
    v_is_perfect BOOLEAN;
    v_passed BOOLEAN;
    v_score_percentage FLOAT;
BEGIN
    -- Verify user has access
    IF p_profile_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized to complete quiz for this user';
    END IF;

    -- Calculate score percentage
    v_score_percentage := (p_score::FLOAT / p_total_questions) * 100;
    v_is_perfect := v_score_percentage = 100;
    v_passed := v_score_percentage >= 80;

    -- Calculate XP
    v_xp := calculate_quiz_xp(p_score, p_total_questions, p_time_taken);

    -- Insert quiz attempt with personality type if provided
    INSERT INTO quiz_attempts (
        profile_id, 
        quiz_id, 
        score, 
        total_questions, 
        time_taken, 
        xp_earned, 
        is_perfect,
        personality_type
    ) VALUES (
        p_profile_id, 
        p_quiz_id, 
        p_score, 
        p_total_questions, 
        p_time_taken, 
        v_xp, 
        v_is_perfect,
        p_personality_type
    );

    -- Update profile XP
    UPDATE profiles
    SET 
        xp = xp + v_xp,
        completed_quizzes = array_append(COALESCE(completed_quizzes, ARRAY[]::INTEGER[]), p_quiz_id::INTEGER),
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

    -- Return result as JSONB
    RETURN jsonb_build_object(
        'xp_earned', v_xp,
        'is_perfect', v_is_perfect,
        'passed', v_passed,
        'personality_type', p_personality_type
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_quiz TO authenticated; 