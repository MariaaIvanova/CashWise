-- Drop existing function
DROP FUNCTION IF EXISTS complete_quiz(UUID, TEXT, INTEGER, INTEGER, INTEGER);

-- Recreate the function with JSONB return type and STABLE volatility
CREATE OR REPLACE FUNCTION complete_quiz(
    p_profile_id UUID,
    p_quiz_id TEXT,
    p_score INTEGER,
    p_total_questions INTEGER,
    p_time_taken INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
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

    -- Insert quiz attempt
    INSERT INTO quiz_attempts (
        profile_id, quiz_id, score, total_questions, time_taken, xp_earned, is_perfect
    ) VALUES (
        p_profile_id, p_quiz_id, p_score, p_total_questions, p_time_taken, v_xp, v_is_perfect
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
        user_id, activity_date, activity_type, quiz_id, xp_earned
    ) VALUES (
        p_profile_id, CURRENT_DATE, 'quiz', p_quiz_id, v_xp
    );

    -- Return result as JSONB
    RETURN jsonb_build_object(
        'xp_earned', v_xp,
        'is_perfect', v_is_perfect,
        'passed', v_passed
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_quiz TO authenticated;

-- Verify function exists and has correct signature
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'complete_quiz'
        AND n.nspname = 'public'
        AND p.proargtypes::text = 'uuid,text,integer,integer,integer'
    ) THEN
        RAISE EXCEPTION 'complete_quiz function was not restored correctly';
    END IF;
END $$; 