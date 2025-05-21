-- Create function to handle challenge completion in a transaction
CREATE OR REPLACE FUNCTION complete_challenge(
    p_user_id UUID,
    p_challenge_id INTEGER,
    p_xp_amount INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_existing_completion UUID;
    v_current_xp INTEGER;
    v_current_streak INTEGER;
BEGIN
    -- Check if challenge was already completed today
    SELECT id INTO v_existing_completion
    FROM completed_challenges
    WHERE user_id = p_user_id
    AND challenge_id = p_challenge_id
    AND completed_date = v_today;

    IF v_existing_completion IS NOT NULL THEN
        RAISE EXCEPTION 'Challenge already completed today';
    END IF;

    -- Get current XP and streak
    SELECT xp, streak INTO v_current_xp, v_current_streak
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;  -- Lock the row for update

    -- Start transaction
    BEGIN
        -- Insert challenge completion
        INSERT INTO completed_challenges (
            user_id,
            challenge_id,
            completed_date,
            xp_earned
        ) VALUES (
            p_user_id,
            p_challenge_id,
            v_today,
            p_xp_amount
        );

        -- Record learning activity
        INSERT INTO learning_activity (
            user_id,
            activity_date,
            activity_type,
            xp_earned
        ) VALUES (
            p_user_id,
            v_today,
            'challenge',
            p_xp_amount
        );

        -- Update profile with new XP and streak
        UPDATE profiles
        SET 
            xp = v_current_xp + p_xp_amount,
            streak = v_current_streak + 1,  -- Increment streak
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_user_id;

        -- Commit transaction
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback transaction on error
            ROLLBACK;
            RAISE;
    END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_challenge TO authenticated; 