-- Create a function to update profile quiz completion
CREATE OR REPLACE FUNCTION update_profile_quiz_completion(
  p_user_id UUID,
  p_xp INTEGER,
  p_completed_quizzes INTEGER[],
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