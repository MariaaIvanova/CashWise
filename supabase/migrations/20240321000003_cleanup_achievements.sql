-- Drop only the trigger that automatically creates achievements
DROP TRIGGER IF EXISTS create_user_achievements ON profiles;

-- Drop the function that creates initial achievements
DROP FUNCTION IF EXISTS create_initial_user_achievements(); 