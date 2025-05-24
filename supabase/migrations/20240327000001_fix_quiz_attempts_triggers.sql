-- Drop any existing triggers on quiz_attempts
DROP TRIGGER IF EXISTS update_quiz_attempts_updated_at ON quiz_attempts;
DROP TRIGGER IF EXISTS check_quiz_score ON quiz_attempts;
DROP TRIGGER IF EXISTS update_learning_activity_on_quiz ON quiz_attempts;

-- Drop any functions that might be causing the issue
DROP FUNCTION IF EXISTS update_quiz_attempts_updated_at();
DROP FUNCTION IF EXISTS check_quiz_score();
DROP FUNCTION IF EXISTS update_learning_activity_on_quiz();

-- Create a new function to handle quiz attempt validation
CREATE OR REPLACE FUNCTION validate_quiz_attempt()
RETURNS TRIGGER AS $$
BEGIN
    -- Basic validation
    IF NEW.score < 0 OR NEW.score > NEW.total_questions THEN
        RAISE EXCEPTION 'Invalid score: must be between 0 and total questions';
    END IF;

    IF NEW.time_taken < 0 THEN
        RAISE EXCEPTION 'Invalid time taken: must be positive';
    END IF;

    -- Set completed_at if not provided
    IF NEW.completed_at IS NULL THEN
        NEW.completed_at := CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quiz attempt validation
CREATE TRIGGER validate_quiz_attempt
    BEFORE INSERT OR UPDATE ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION validate_quiz_attempt();

-- Create function to record learning activity
CREATE OR REPLACE FUNCTION record_quiz_learning_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Record learning activity for quiz completion
    INSERT INTO learning_activity (
        user_id,
        activity_date,
        activity_type,
        quiz_id,
        xp_earned
    ) VALUES (
        NEW.profile_id,
        CURRENT_DATE,
        'quiz',
        NEW.quiz_id,
        CASE 
            WHEN NEW.score = NEW.total_questions THEN 50  -- Perfect score bonus
            WHEN (NEW.score::float / NEW.total_questions) >= 0.8 THEN 30  -- Passed quiz
            ELSE 0  -- Failed quiz
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for recording learning activity
CREATE TRIGGER record_quiz_learning_activity
    AFTER INSERT ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION record_quiz_learning_activity(); 