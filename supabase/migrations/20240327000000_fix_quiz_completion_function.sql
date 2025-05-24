-- Drop the existing function
DROP FUNCTION IF EXISTS update_profile_quiz_completion(UUID, INTEGER, INTEGER, TIMESTAMPTZ);

-- Create updated function with proper handling of completed_quizzes
CREATE OR REPLACE FUNCTION update_profile_quiz_completion(
  p_user_id UUID,
  p_xp INTEGER,
  p_completed_quizzes INTEGER,
  p_updated_at TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_quizzes INTEGER[];
BEGIN
  -- Get current completed quizzes
  SELECT completed_quizzes INTO v_current_quizzes
  FROM profiles
  WHERE id = p_user_id;

  -- If completed_quizzes is NULL, initialize it as an empty array
  IF v_current_quizzes IS NULL THEN
    v_current_quizzes := ARRAY[]::INTEGER[];
  END IF;

  -- Add the new quiz if it's not already in the array
  IF NOT (p_completed_quizzes = ANY(v_current_quizzes)) THEN
    v_current_quizzes := array_append(v_current_quizzes, p_completed_quizzes);
  END IF;

  -- Update the profile
  UPDATE profiles
  SET 
    xp = p_xp,
    completed_quizzes = v_current_quizzes,
    updated_at = p_updated_at
  WHERE id = p_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_profile_quiz_completion TO authenticated; 