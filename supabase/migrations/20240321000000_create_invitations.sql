-- Create invitations table to track user invitations
CREATE TABLE IF NOT EXISTS invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired')),
    invitation_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    xp_awarded BOOLEAN DEFAULT false
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_invitations_inviter 
ON invitations(inviter_id);

CREATE INDEX IF NOT EXISTS idx_invitations_code 
ON invitations(invitation_code);

-- Enable Row Level Security
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own invitations"
    ON invitations FOR SELECT
    USING (auth.uid() = inviter_id);

CREATE POLICY "Users can insert their own invitations"
    ON invitations FOR INSERT
    WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can update their own invitations"
    ON invitations FOR UPDATE
    USING (auth.uid() = inviter_id)
    WITH CHECK (auth.uid() = inviter_id);

-- Function to generate random invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    valid BOOLEAN;
BEGIN
    valid := false;
    WHILE NOT valid LOOP
        -- Generate a random 8-character code
        code := upper(substring(md5(random()::text) from 1 for 8));
        -- Check if code already exists
        SELECT NOT EXISTS(
            SELECT 1 FROM invitations WHERE invitation_code = code
        ) INTO valid;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to check and update expired invitations
CREATE OR REPLACE FUNCTION update_expired_invitations()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invitations
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to periodically check for expired invitations
CREATE TRIGGER check_expired_invitations
    AFTER INSERT OR UPDATE ON invitations
    EXECUTE FUNCTION update_expired_invitations(); 