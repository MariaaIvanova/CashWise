-- Create function to handle lesson completion in a transaction
CREATE OR REPLACE FUNCTION complete_lesson(
    p_user_id UUID,
    p_lesson_id TEXT,
    p_xp_earned INTEGER,
    p_current_xp INTEGER,
    p_current_completed_lessons INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_progress user_progress;
    v_completed_count INTEGER;
BEGIN
    -- Check if the lesson is already completed
    SELECT * INTO v_existing_progress
    FROM user_progress
    WHERE user_id = p_user_id
    AND lesson_id = p_lesson_id
    AND completed = true;

    -- If lesson is already completed, do nothing
    IF v_existing_progress IS NOT NULL THEN
        RETURN;
    END IF;

    -- Record learning activity
    INSERT INTO learning_activity (
        user_id,
        activity_date,
        activity_type,
        lesson_id,
        xp_earned
    ) VALUES (
        p_user_id,
        CURRENT_DATE,
        'lesson',
        p_lesson_id,
        p_xp_earned
    );

    -- Update user progress
    INSERT INTO user_progress (
        user_id,
        lesson_id,
        completed,
        last_accessed
    ) VALUES (
        p_user_id,
        p_lesson_id,
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
    WHERE user_id = p_user_id
    AND completed = true;

    -- Update profile with new XP and actual completed lessons count
    UPDATE profiles
    SET 
        xp = p_current_xp + p_xp_earned,
        completed_lessons = v_completed_count,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_lesson TO authenticated; 