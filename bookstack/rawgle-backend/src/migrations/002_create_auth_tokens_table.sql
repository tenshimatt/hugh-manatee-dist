-- Migration: Create Authentication Tokens Tables for RAWGLE MVP
-- Separate tables for email verification and password reset tokens
-- Created: 2025-09-07
-- Component: Authentication Token Management

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create password reset tokens table  
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires ON email_verification_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_used ON password_reset_tokens(used);

-- Function to cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER := 0;
    row_count_temp INTEGER;
BEGIN
    -- Delete expired email verification tokens
    DELETE FROM email_verification_tokens 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS row_count_temp = ROW_COUNT;
    cleaned_count := cleaned_count + row_count_temp;
    
    -- Delete expired password reset tokens
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS row_count_temp = ROW_COUNT;
    cleaned_count := cleaned_count + row_count_temp;
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create email verification token
CREATE OR REPLACE FUNCTION create_email_verification_token(user_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    new_token TEXT;
BEGIN
    -- Generate secure random token
    new_token := gen_random_uuid()::TEXT || gen_random_uuid()::TEXT;
    new_token := REPLACE(new_token, '-', '');
    
    -- Delete any existing tokens for this user
    DELETE FROM email_verification_tokens WHERE user_id = user_id_param;
    
    -- Insert new token
    INSERT INTO email_verification_tokens (user_id, token, expires_at)
    VALUES (user_id_param, new_token, NOW() + INTERVAL '24 hours');
    
    RETURN new_token;
END;
$$ LANGUAGE plpgsql;

-- Function to create password reset token
CREATE OR REPLACE FUNCTION create_password_reset_token(user_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    new_token TEXT;
BEGIN
    -- Generate secure random token
    new_token := gen_random_uuid()::TEXT || gen_random_uuid()::TEXT;
    new_token := REPLACE(new_token, '-', '');
    
    -- Delete any existing unused tokens for this user
    DELETE FROM password_reset_tokens WHERE user_id = user_id_param AND used = FALSE;
    
    -- Insert new token
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES (user_id_param, new_token, NOW() + INTERVAL '1 hour');
    
    RETURN new_token;
END;
$$ LANGUAGE plpgsql;

-- Function to verify email verification token
CREATE OR REPLACE FUNCTION verify_email_token(token_param TEXT)
RETURNS UUID AS $$
DECLARE
    user_id_found UUID;
BEGIN
    -- Find valid token
    SELECT user_id INTO user_id_found
    FROM email_verification_tokens
    WHERE token = token_param 
      AND expires_at > NOW();
    
    IF user_id_found IS NOT NULL THEN
        -- Mark user as verified
        UPDATE users 
        SET email_verified = TRUE,
            updated_at = NOW()
        WHERE id = user_id_found;
        
        -- Delete the used token
        DELETE FROM email_verification_tokens WHERE token = token_param;
        
        RETURN user_id_found;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to verify password reset token
CREATE OR REPLACE FUNCTION verify_password_reset_token(token_param TEXT)
RETURNS UUID AS $$
DECLARE
    user_id_found UUID;
BEGIN
    -- Find valid unused token
    SELECT user_id INTO user_id_found
    FROM password_reset_tokens
    WHERE token = token_param 
      AND expires_at > NOW()
      AND used = FALSE;
    
    IF user_id_found IS NOT NULL THEN
        -- Mark token as used
        UPDATE password_reset_tokens 
        SET used = TRUE
        WHERE token = token_param;
        
        RETURN user_id_found;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON email_verification_tokens TO rawgle_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON password_reset_tokens TO rawgle_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO rawgle_user;

-- Success message
SELECT 'Authentication tokens tables created successfully!' as result;