-- Create a new function specifically for financial personality test
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

    -- Insert quiz attempt with personality type
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