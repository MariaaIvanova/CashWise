-- Drop the unique constraint from learning_activity table
ALTER TABLE learning_activity 
DROP CONSTRAINT IF EXISTS learning_activity_user_id_activity_date_activity_type_lesson_id_quiz_id_key; 