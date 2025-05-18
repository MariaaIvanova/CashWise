-- Function to calculate user streaks
CREATE OR REPLACE FUNCTION calculate_user_streaks(
    p_user_id UUID,
    p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days'),
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    current_streak INTEGER,
    longest_streak INTEGER,
    total_days INTEGER,
    activity_dates DATE[]
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_activity_dates DATE[];
    v_current_streak INTEGER := 0;
    v_longest_streak INTEGER := 0;
    v_temp_streak INTEGER := 0;
    v_prev_date DATE;
    v_has_today BOOLEAN;
    v_has_yesterday BOOLEAN;
BEGIN
    -- Get all unique activity dates for the user within the date range
    SELECT ARRAY_AGG(DISTINCT activity_date ORDER BY activity_date)
    INTO v_activity_dates
    FROM learning_activity
    WHERE user_id = p_user_id
    AND activity_date BETWEEN p_start_date AND p_end_date;

    -- If no activities, return zeros
    IF v_activity_dates IS NULL OR array_length(v_activity_dates, 1) IS NULL THEN
        RETURN QUERY SELECT 0, 0, 0, ARRAY[]::DATE[];
        RETURN;
    END IF;

    -- Check for activity today and yesterday
    v_has_today := p_end_date = ANY(v_activity_dates);
    v_has_yesterday := (p_end_date - INTERVAL '1 day') = ANY(v_activity_dates);

    -- Calculate current streak
    IF v_has_today THEN
        -- Start counting from today
        v_current_streak := 1;
        v_prev_date := p_end_date;
    ELSIF v_has_yesterday THEN
        -- Start counting from yesterday
        v_current_streak := 1;
        v_prev_date := p_end_date - INTERVAL '1 day';
    ELSE
        -- No activity today or yesterday, streak is broken
        v_current_streak := 0;
        v_prev_date := NULL;
    END IF;

    -- If we have a current streak, count backwards
    IF v_current_streak > 0 THEN
        FOR i IN 1..array_length(v_activity_dates, 1) LOOP
            IF v_activity_dates[i] < v_prev_date THEN
                IF v_activity_dates[i] = v_prev_date - INTERVAL '1 day' THEN
                    v_current_streak := v_current_streak + 1;
                    v_prev_date := v_activity_dates[i];
                ELSE
                    EXIT;
                END IF;
            END IF;
        END LOOP;
    END IF;

    -- Calculate longest streak
    v_temp_streak := 1;
    v_prev_date := v_activity_dates[1];
    
    FOR i IN 2..array_length(v_activity_dates, 1) LOOP
        IF v_activity_dates[i] = v_prev_date + INTERVAL '1 day' THEN
            v_temp_streak := v_temp_streak + 1;
        ELSE
            v_longest_streak := GREATEST(v_longest_streak, v_temp_streak);
            v_temp_streak := 1;
        END IF;
        v_prev_date := v_activity_dates[i];
    END LOOP;
    
    -- Check the last streak
    v_longest_streak := GREATEST(v_longest_streak, v_temp_streak);

    -- Return the results
    RETURN QUERY 
    SELECT 
        v_current_streak,
        v_longest_streak,
        array_length(v_activity_dates, 1),
        v_activity_dates;
END;
$$; 