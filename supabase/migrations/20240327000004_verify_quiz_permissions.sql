-- Revoke and regrant permissions to ensure they are set correctly
REVOKE ALL ON FUNCTION complete_quiz FROM PUBLIC;
REVOKE ALL ON FUNCTION calculate_quiz_xp FROM PUBLIC;

-- Grant specific permissions to authenticated users
GRANT EXECUTE ON FUNCTION complete_quiz TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_quiz_xp TO authenticated;

-- Ensure the functions are in the public schema
ALTER FUNCTION complete_quiz SET SCHEMA public;
ALTER FUNCTION calculate_quiz_xp SET SCHEMA public;

-- Drop and recreate the policy to ensure it's correct
DROP POLICY IF EXISTS "Users can execute complete_quiz" ON quiz_attempts;
CREATE POLICY "Users can execute complete_quiz"
    ON quiz_attempts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = profile_id);

-- Verify permissions
DO $$
DECLARE
    v_has_execute BOOLEAN;
BEGIN
    -- Check if authenticated role has execute permission using function signature
    SELECT has_function_privilege(
        'authenticated',
        'complete_quiz(uuid,text,integer,integer,integer)',
        'EXECUTE'
    ) INTO v_has_execute;
    
    IF NOT v_has_execute THEN
        RAISE EXCEPTION 'Authenticated users do not have execute permission on complete_quiz function';
    END IF;
    
    -- Check if function is in public schema
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'complete_quiz'
        AND n.nspname = 'public'
    ) THEN
        RAISE EXCEPTION 'complete_quiz function is not in public schema';
    END IF;
END $$; 