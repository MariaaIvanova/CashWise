-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own learning activity" ON learning_activity;

-- Create new policies that allow viewing learning activities for all users
CREATE POLICY "Anyone can view learning activities"
    ON learning_activity FOR SELECT
    USING (true);  -- Allow anyone to view learning activities

-- Keep the insert and update policies restricted to own data
CREATE POLICY "Users can insert their own learning activity"
    ON learning_activity FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning activity"
    ON learning_activity FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Grant execute permission on the streak calculation function to authenticated users
GRANT EXECUTE ON FUNCTION calculate_user_streaks TO authenticated; 