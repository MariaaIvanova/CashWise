-- Add personality_type column to quiz_attempts table
ALTER TABLE quiz_attempts
ADD COLUMN IF NOT EXISTS personality_type TEXT;

-- Update existing records to set a default personality type if needed
UPDATE quiz_attempts
SET personality_type = 'Балансиран реалист'
WHERE personality_type IS NULL AND quiz_id = 'daily-challenge'; 