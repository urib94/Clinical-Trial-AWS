-- Authentication System Database Schema
-- Additional tables required for comprehensive authentication and security

-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Token blacklist table for revoked JWT tokens
CREATE TABLE IF NOT EXISTS token_blacklist (
    id SERIAL PRIMARY KEY,
    jti VARCHAR(255) NOT NULL UNIQUE, -- JWT ID from token
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_token_blacklist_jti (jti),
    INDEX idx_token_blacklist_expires (expires_at)
);

-- Rate limiting log table
CREATE TABLE IF NOT EXISTS rate_limit_log (
    id SERIAL PRIMARY KEY,
    rate_limit_type VARCHAR(50) NOT NULL, -- 'user', 'ip', 'auth'
    identifier VARCHAR(255) NOT NULL, -- email, IP address, or combination
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_rate_limit_type_id (rate_limit_type, identifier),
    INDEX idx_rate_limit_created (created_at)
);

-- User sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- Cognito user ID
    token_id VARCHAR(255) NOT NULL, -- JWT token ID
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('physician', 'patient')),
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    INDEX idx_user_sessions_user (user_id),
    INDEX idx_user_sessions_token (token_id),
    INDEX idx_user_sessions_active (is_active, last_activity)
);

-- MFA backup codes table
CREATE TABLE IF NOT EXISTS mfa_backup_codes (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    code_hash VARCHAR(255) NOT NULL, -- SHA-256 hash of the backup code
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_mfa_backup_email (user_email),
    INDEX idx_mfa_backup_hash (code_hash)
);

-- SMS verification codes table (temporary storage)
CREATE TABLE IF NOT EXISTS sms_verification_codes (
    phone_number VARCHAR(20) PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    failed_attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    INDEX idx_sms_codes_expires (expires_at)
);

-- MFA audit log table
CREATE TABLE IF NOT EXISTS mfa_audit_log (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- 'setup', 'verified', 'failed', 'disabled'
    identifier VARCHAR(255) NOT NULL, -- email or phone number
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_mfa_audit_type (event_type),
    INDEX idx_mfa_audit_identifier (identifier),
    INDEX idx_mfa_audit_created (created_at)
);

-- Access audit log table for RBAC events
CREATE TABLE IF NOT EXISTS access_audit_log (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    permissions_checked JSONB,
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_access_audit_user (user_email),
    INDEX idx_access_audit_resource (resource_type, resource_id),
    INDEX idx_access_audit_created (created_at)
);

-- Security incidents table for tracking security events
CREATE TABLE IF NOT EXISTS security_incidents (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255),
    incident_type VARCHAR(100) NOT NULL, -- 'access_denied', 'brute_force', 'suspicious_login'
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_security_incidents_type (incident_type),
    INDEX idx_security_incidents_user (user_email),
    INDEX idx_security_incidents_created (created_at),
    INDEX idx_security_incidents_resolved (resolved)
);

-- Physician invitations table (enhanced)
CREATE TABLE IF NOT EXISTS physician_invitations (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'physician',
    permissions JSONB DEFAULT '[]',
    invited_by_id INTEGER,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_physician_invitations_email (email),
    INDEX idx_physician_invitations_token (token_hash),
    INDEX idx_physician_invitations_status (status, expires_at)
);

-- Patient invitations table (enhanced)
CREATE TABLE IF NOT EXISTS patient_invitations (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER, -- References patients.id if patient already exists
    email VARCHAR(255),
    study_id INTEGER,
    physician_id INTEGER NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_patient_invitations_email (email),
    INDEX idx_patient_invitations_token (token_hash),
    INDEX idx_patient_invitations_physician (physician_id),
    INDEX idx_patient_invitations_status (status, expires_at)
);

-- Enhanced physicians table with authentication fields
ALTER TABLE physicians 
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mfa_methods JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS totp_secret_encrypted TEXT,
ADD COLUMN IF NOT EXISTS sms_phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS mfa_backup_codes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mfa_setup_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mfa_disabled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_failed_ip INET,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_ip INET,
ADD COLUMN IF NOT EXISTS emergency_access_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_history JSONB DEFAULT '[]';

-- Enhanced patients table with authentication fields
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mfa_methods JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS totp_secret_encrypted TEXT,
ADD COLUMN IF NOT EXISTS sms_phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS mfa_backup_codes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mfa_setup_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mfa_disabled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_failed_ip INET,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_ip INET,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_history JSONB DEFAULT '[]';

-- Physician-patient relationships table
CREATE TABLE IF NOT EXISTS physician_patient_relationships (
    id SERIAL PRIMARY KEY,
    physician_id INTEGER NOT NULL REFERENCES physicians(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'primary', -- 'primary', 'secondary', 'consultant'
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_by INTEGER REFERENCES physicians(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(physician_id, patient_id, relationship_type),
    INDEX idx_physician_patient_physician (physician_id),
    INDEX idx_physician_patient_patient (patient_id),
    INDEX idx_physician_patient_active (is_active)
);

-- Study physicians relationships table
CREATE TABLE IF NOT EXISTS study_physicians (
    id SERIAL PRIMARY KEY,
    study_id INTEGER NOT NULL,
    physician_id INTEGER NOT NULL REFERENCES physicians(id),
    role VARCHAR(50) DEFAULT 'investigator', -- 'principal', 'investigator', 'coordinator'
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(study_id, physician_id),
    INDEX idx_study_physicians_study (study_id),
    INDEX idx_study_physicians_physician (physician_id),
    INDEX idx_study_physicians_active (is_active)
);

-- Patient studies enrollment table
CREATE TABLE IF NOT EXISTS patient_studies (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    study_id INTEGER NOT NULL,
    enrollment_status VARCHAR(50) DEFAULT 'enrolled', -- 'enrolled', 'completed', 'withdrawn', 'suspended'
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    withdrawal_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, study_id),
    INDEX idx_patient_studies_patient (patient_id),
    INDEX idx_patient_studies_study (study_id),
    INDEX idx_patient_studies_status (enrollment_status)
);

-- Patient questionnaire access table
CREATE TABLE IF NOT EXISTS patient_questionnaire_access (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    questionnaire_id INTEGER NOT NULL,
    assigned_by INTEGER REFERENCES physicians(id),
    access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, questionnaire_id),
    INDEX idx_patient_questionnaire_patient (patient_id),
    INDEX idx_patient_questionnaire_questionnaire (questionnaire_id),
    INDEX idx_patient_questionnaire_active (is_active)
);

-- Cleanup old tokens (run daily)
-- This should be implemented as a scheduled Lambda function or database job
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Clean up expired JWT tokens from blacklist
    DELETE FROM token_blacklist WHERE expires_at < NOW();
    
    -- Clean up old rate limit logs (keep 24 hours)
    DELETE FROM rate_limit_log WHERE created_at < NOW() - INTERVAL '24 hours';
    
    -- Clean up expired SMS codes
    DELETE FROM sms_verification_codes WHERE expires_at < NOW();
    
    -- Clean up old audit logs (keep 90 days for active logs, 7 years for security incidents)
    DELETE FROM mfa_audit_log WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM access_audit_log WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Mark expired invitations
    UPDATE physician_invitations 
    SET status = 'expired' 
    WHERE status = 'active' AND expires_at < NOW();
    
    UPDATE patient_invitations 
    SET status = 'expired' 
    WHERE status = 'active' AND expires_at < NOW();
    
    -- Clean up inactive sessions (older than 7 days)
    DELETE FROM user_sessions 
    WHERE is_active = false AND ended_at < NOW() - INTERVAL '7 days';
    
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_physicians_email_status ON physicians(email, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_email_status ON patients(email, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_physicians_cognito_user_id ON physicians(cognito_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_cognito_user_id ON patients(cognito_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_physicians_mfa_enabled ON physicians(mfa_enabled);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_mfa_enabled ON patients(mfa_enabled);

-- Add constraints for data integrity
ALTER TABLE physicians 
ADD CONSTRAINT chk_physicians_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE patients 
ADD CONSTRAINT chk_patients_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add row-level security policies (RLS) for enhanced data protection
ALTER TABLE physicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policy for physicians to access their own data
CREATE POLICY physician_self_access ON physicians
    FOR ALL
    TO authenticated_user
    USING (cognito_user_id = current_setting('app.current_user_id', true));

-- Policy for patients to access their own data
CREATE POLICY patient_self_access ON patients
    FOR ALL
    TO authenticated_user
    USING (cognito_user_id = current_setting('app.current_user_id', true));

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON token_blacklist TO authenticated_user;
GRANT SELECT, INSERT ON rate_limit_log TO authenticated_user;
GRANT SELECT, INSERT, UPDATE ON user_sessions TO authenticated_user;
GRANT SELECT, INSERT, UPDATE ON mfa_backup_codes TO authenticated_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON sms_verification_codes TO authenticated_user;
GRANT SELECT, INSERT ON mfa_audit_log TO authenticated_user;
GRANT SELECT, INSERT ON access_audit_log TO authenticated_user;
GRANT SELECT, INSERT ON security_incidents TO authenticated_user;

-- Comments for documentation
COMMENT ON TABLE token_blacklist IS 'Stores revoked JWT tokens to prevent reuse';
COMMENT ON TABLE rate_limit_log IS 'Tracks API requests for rate limiting enforcement';
COMMENT ON TABLE user_sessions IS 'Manages active user sessions with timeout tracking';
COMMENT ON TABLE mfa_backup_codes IS 'Stores hashed MFA backup codes for account recovery';
COMMENT ON TABLE sms_verification_codes IS 'Temporary storage for SMS verification codes';
COMMENT ON TABLE mfa_audit_log IS 'Audit trail for all MFA-related events';
COMMENT ON TABLE access_audit_log IS 'Audit trail for access control and permission checks';
COMMENT ON TABLE security_incidents IS 'Tracks security events and potential threats';
COMMENT ON TABLE physician_invitations IS 'Manages physician invitation tokens and status';
COMMENT ON TABLE patient_invitations IS 'Manages patient invitation tokens and status';

-- Sample data for testing (only in development environment)
-- This should be conditional based on environment
DO $$
BEGIN
    IF current_setting('app.environment', true) = 'development' THEN
        -- Insert sample physician invitation
        INSERT INTO physician_invitations (
            email, organization_id, role, token_hash, expires_at
        ) VALUES (
            'test.physician@hospital.com',
            'org_123',
            'physician',
            encode(digest('sample-physician-token', 'sha256'), 'hex'),
            NOW() + INTERVAL '7 days'
        ) ON CONFLICT DO NOTHING;
        
        -- Insert sample patient invitation
        INSERT INTO patient_invitations (
            email, physician_id, token_hash, expires_at
        ) VALUES (
            'test.patient@example.com',
            1,
            encode(digest('sample-patient-token', 'sha256'), 'hex'),
            NOW() + INTERVAL '7 days'
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;