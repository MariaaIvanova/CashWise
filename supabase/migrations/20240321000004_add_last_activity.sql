-- Add last_activity_date column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_activity_date DATE DEFAULT CURRENT_DATE; 