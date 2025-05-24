-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS complete_quiz(UUID, TEXT, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS calculate_quiz_xp(INTEGER, INTEGER, INTEGER);

-- Recreate the calculate_quiz_xp function
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
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- Recreate the complete_quiz function
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION complete_quiz TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_quiz_xp TO authenticated;

-- Create policy to allow users to execute the function
CREATE POLICY "Users can execute complete_quiz"
    ON quiz_attempts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = profile_id);

-- Verify function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'complete_quiz' 
        AND pronamespace = 'public'::regnamespace
    ) THEN
        RAISE EXCEPTION 'complete_quiz function was not created successfully';
    END IF;
END $$; 