-- Fix completed lessons count for all profiles
DO $$
DECLARE
    v_profile RECORD;
    v_completed_count INTEGER;
BEGIN
    -- Loop through all profiles
    FOR v_profile IN SELECT id FROM profiles LOOP
        -- Count actual completed lessons for this profile
        SELECT COUNT(*) INTO v_completed_count
        FROM user_progress
        WHERE user_id = v_profile.id
        AND completed = true;

        -- Update the profile with the correct count
        UPDATE profiles
        SET completed_lessons = v_completed_count
        WHERE id = v_profile.id;
    END LOOP;
END $$; 