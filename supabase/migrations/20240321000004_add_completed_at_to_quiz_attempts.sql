-- Add completed_at column to quiz_attempts table
ALTER TABLE quiz_attempts
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Update existing records to set completed_at equal to created_at
UPDATE quiz_attempts
SET completed_at = created_at
WHERE completed_at IS NULL; 