-- Create a new function specifically for personality quizzes
CREATE OR REPLACE FUNCTION complete_personality_quiz(
    p_profile_id UUID,
    p_quiz_id TEXT,
    p_score INTEGER,
    p_time_taken INTEGER,
    p_total_questions INTEGER,
    p_personality_type TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_xp_earned INTEGER;
    v_is_perfect BOOLEAN;
    v_passed BOOLEAN;
    v_result JSONB;
BEGIN
    -- Calculate XP and pass status
    v_xp_earned := 100; -- Base XP for personality quiz
    v_is_perfect := p_score = p_total_questions;
    v_passed := true; -- Personality quizzes always pass as they're assessment tools

    -- Insert the quiz attempt
    INSERT INTO quiz_attempts (
        profile_id,
        quiz_id,
        score,
        total_questions,
        time_taken,
        personality_type
    ) VALUES (
        p_profile_id,
        p_quiz_id,
        p_score,
        p_total_questions,
        p_time_taken,
        p_personality_type
    );

    -- Return the result as JSONB
    v_result := jsonb_build_object(
        'xp_earned', v_xp_earned,
        'is_perfect', v_is_perfect,
        'passed', v_passed,
        'personality_type', p_personality_type
    );

    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_personality_quiz(UUID, TEXT, INTEGER, INTEGER, INTEGER, TEXT) TO authenticated; 