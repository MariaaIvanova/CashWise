-- First, convert any existing data to an array
ALTER TABLE profiles 
  ALTER COLUMN completed_quizzes TYPE integer[] 
  USING CASE 
    WHEN completed_quizzes IS NULL THEN NULL 
    ELSE ARRAY[completed_quizzes]::integer[] 
  END;

-- Drop the old function first
DROP FUNCTION IF EXISTS update_profile_quiz_completion(UUID, INTEGER, integer[], TIMESTAMPTZ);

-- Update the function to use integer type
CREATE OR REPLACE FUNCTION update_profile_quiz_completion(
  p_user_id UUID,
  p_xp INTEGER,
  p_completed_quizzes INTEGER,  -- changed to single integer
  p_updated_at TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    xp = p_xp,
    completed_quizzes = p_completed_quizzes,
    updated_at = p_updated_at
  WHERE id = p_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_profile_quiz_completion TO authenticated; 