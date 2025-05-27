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
    v_current_xp INTEGER;
    v_completed_count INTEGER;
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

    -- Get current XP
    SELECT xp INTO v_current_xp
    FROM profiles
    WHERE id = p_profile_id;

    -- Insert quiz attempt
    INSERT INTO quiz_attempts (
        profile_id, quiz_id, score, total_questions, time_taken, xp_earned, is_perfect
    ) VALUES (
        p_profile_id, p_quiz_id, p_score, p_total_questions, p_time_taken, v_xp, v_is_perfect
    );

    -- If quiz is passed, mark the lesson as completed
    IF v_passed THEN
        -- Update user progress for the lesson
        INSERT INTO user_progress (
            user_id,
            lesson_id,
            completed,
            last_accessed
        ) VALUES (
            p_profile_id,
            p_quiz_id,
            true,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (user_id, lesson_id) 
        DO UPDATE SET 
            completed = true,
            last_accessed = CURRENT_TIMESTAMP;

        -- Count actual number of completed lessons
        SELECT COUNT(*) INTO v_completed_count
        FROM user_progress
        WHERE user_id = p_profile_id
        AND completed = true;

        -- Update profile with new XP and completed lessons count
        UPDATE profiles
        SET 
            xp = v_current_xp + v_xp,
            completed_lessons = v_completed_count,
            completed_quizzes = array_append(COALESCE(completed_quizzes, ARRAY[]::INTEGER[]), p_quiz_id::INTEGER),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_profile_id;

        -- Record learning activity for both quiz and lesson
        INSERT INTO learning_activity (
            user_id, activity_date, activity_type, quiz_id, lesson_id, xp_earned
        ) VALUES 
        (p_profile_id, CURRENT_DATE, 'quiz', p_quiz_id, NULL, v_xp),
        (p_profile_id, CURRENT_DATE, 'lesson', NULL, p_quiz_id, 50); -- 50 XP for completing the lesson
    ELSE
        -- If quiz is not passed, only update quiz-related data
        UPDATE profiles
        SET 
            xp = v_current_xp + v_xp,
            completed_quizzes = array_append(COALESCE(completed_quizzes, ARRAY[]::INTEGER[]), p_quiz_id::INTEGER),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_profile_id;

        -- Record learning activity for quiz only
        INSERT INTO learning_activity (
            user_id, activity_date, activity_type, quiz_id, xp_earned
        ) VALUES (
            p_profile_id, CURRENT_DATE, 'quiz', p_quiz_id, v_xp
        );
    END IF;

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