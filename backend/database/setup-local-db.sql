-- Clinical Trial Platform - Local Development Database Setup
-- This script initializes the local PostgreSQL database for development

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set application environment variable
SELECT set_config('app.environment', 'development', false);

-- Create custom user roles for local development
CREATE ROLE authenticated_user;
CREATE ROLE api_user WITH LOGIN PASSWORD 'api_password';
GRANT authenticated_user TO api_user;

-- Core tables for clinical trial platform

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'hospital', -- 'hospital', 'clinic', 'research_center'
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    license_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_organizations_status (status),
    INDEX idx_organizations_type (type)
);

-- Studies table
CREATE TABLE IF NOT EXISTS studies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    study_type VARCHAR(50) DEFAULT 'clinical_trial', -- 'clinical_trial', 'observational', 'survey'
    phase VARCHAR(20), -- 'phase_1', 'phase_2', 'phase_3', 'phase_4'
    status VARCHAR(50) DEFAULT 'planning', -- 'planning', 'recruiting', 'active', 'completed', 'suspended'
    organization_id INTEGER REFERENCES organizations(id),
    start_date DATE,
    end_date DATE,
    target_enrollment INTEGER,
    current_enrollment INTEGER DEFAULT 0,
    inclusion_criteria TEXT,
    exclusion_criteria TEXT,
    primary_endpoints TEXT,
    secondary_endpoints TEXT,
    ethics_approval_number VARCHAR(100),
    ethics_approval_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_studies_status (status),
    INDEX idx_studies_organization (organization_id),
    INDEX idx_studies_phase (phase)
);

-- Physicians table
CREATE TABLE IF NOT EXISTS physicians (
    id SERIAL PRIMARY KEY,
    cognito_user_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255), -- For local development only
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(50), -- 'Dr.', 'Prof.', 'Mr.', 'Ms.'
    specialization VARCHAR(100),
    license_number VARCHAR(100),
    organization_id INTEGER REFERENCES organizations(id),
    phone VARCHAR(20),
    department VARCHAR(100),
    role VARCHAR(50) DEFAULT 'physician', -- 'physician', 'principal_investigator', 'research_coordinator'
    permissions JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    email_verified BOOLEAN DEFAULT false,
    profile_completed BOOLEAN DEFAULT false,
    
    -- Authentication fields
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_methods JSONB DEFAULT '[]',
    totp_secret_encrypted TEXT,
    sms_phone_number VARCHAR(20),
    mfa_backup_codes_count INTEGER DEFAULT 0,
    mfa_setup_at TIMESTAMP WITH TIME ZONE,
    mfa_disabled_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMP WITH TIME ZONE,
    last_failed_ip INET,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    emergency_access_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    password_history JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_physicians_email (email),
    INDEX idx_physicians_organization (organization_id),
    INDEX idx_physicians_status (status),
    INDEX idx_physicians_cognito (cognito_user_id)
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    cognito_user_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255), -- For local development only
    patient_id VARCHAR(50) UNIQUE, -- External patient identifier
    first_name_encrypted TEXT, -- Encrypted with pgcrypto
    last_name_encrypted TEXT, -- Encrypted with pgcrypto
    date_of_birth_encrypted TEXT, -- Encrypted date of birth
    gender VARCHAR(20),
    phone_encrypted TEXT, -- Encrypted phone number
    address_encrypted TEXT, -- Encrypted address
    emergency_contact_encrypted TEXT, -- Encrypted emergency contact info
    medical_history_encrypted TEXT, -- Encrypted medical history
    medications_encrypted TEXT, -- Encrypted current medications
    allergies_encrypted TEXT, -- Encrypted allergies information
    
    -- Non-encrypted fields for system use
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'withdrawn', 'completed')),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    withdrawal_date DATE,
    withdrawal_reason TEXT,
    consent_signed BOOLEAN DEFAULT false,
    consent_date DATE,
    consent_version VARCHAR(20),
    
    -- Authentication fields
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_methods JSONB DEFAULT '[]',
    totp_secret_encrypted TEXT,
    sms_phone_number VARCHAR(20),
    mfa_backup_codes_count INTEGER DEFAULT 0,
    mfa_setup_at TIMESTAMP WITH TIME ZONE,
    mfa_disabled_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMP WITH TIME ZONE,
    last_failed_ip INET,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    password_history JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_patients_email (email),
    INDEX idx_patients_patient_id (patient_id),
    INDEX idx_patients_status (status),
    INDEX idx_patients_cognito (cognito_user_id)
);

-- Questionnaires table
CREATE TABLE IF NOT EXISTS questionnaires (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(20) DEFAULT '1.0',
    study_id INTEGER REFERENCES studies(id),
    questionnaire_type VARCHAR(50) DEFAULT 'assessment', -- 'screening', 'baseline', 'followup', 'assessment', 'adverse_event'
    frequency VARCHAR(50), -- 'once', 'daily', 'weekly', 'monthly', 'as_needed'
    schedule_data JSONB, -- Scheduling information for recurring questionnaires
    questions JSONB NOT NULL, -- Array of question objects
    validation_rules JSONB DEFAULT '{}', -- Validation rules for the questionnaire
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived', 'suspended')),
    is_required BOOLEAN DEFAULT false,
    estimated_time_minutes INTEGER,
    instructions TEXT,
    created_by INTEGER REFERENCES physicians(id),
    published_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_questionnaires_study (study_id),
    INDEX idx_questionnaires_status (status),
    INDEX idx_questionnaires_type (questionnaire_type),
    INDEX idx_questionnaires_created_by (created_by)
);

-- Patient responses table
CREATE TABLE IF NOT EXISTS patient_responses (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    questionnaire_id INTEGER NOT NULL REFERENCES questionnaires(id),
    questionnaire_version VARCHAR(20) NOT NULL,
    response_data_encrypted TEXT NOT NULL, -- Encrypted JSON response data
    response_hash VARCHAR(255), -- Hash for integrity verification
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'submitted', 'reviewed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by INTEGER REFERENCES physicians(id),
    auto_saved_at TIMESTAMP WITH TIME ZONE,
    submission_ip INET,
    device_info JSONB, -- Information about the device used for submission
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_patient_responses_patient (patient_id),
    INDEX idx_patient_responses_questionnaire (questionnaire_id),
    INDEX idx_patient_responses_status (status),
    INDEX idx_patient_responses_completed (completed_at),
    UNIQUE(patient_id, questionnaire_id, questionnaire_version)
);

-- Media uploads table
CREATE TABLE IF NOT EXISTS media_uploads (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    response_id INTEGER REFERENCES patient_responses(id),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'audio', 'document'
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_path TEXT NOT NULL, -- Path in storage system (S3/MinIO)
    file_hash VARCHAR(255), -- SHA-256 hash for integrity
    thumbnail_path TEXT, -- Path to thumbnail for images/videos
    encryption_key_id VARCHAR(255), -- Reference to encryption key
    virus_scan_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'clean', 'infected', 'error'
    virus_scan_result JSONB, -- Detailed scan results
    processing_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    metadata JSONB, -- File metadata (EXIF, duration, etc.)
    tags JSONB DEFAULT '[]', -- User-defined tags
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_media_uploads_patient (patient_id),
    INDEX idx_media_uploads_response (response_id),
    INDEX idx_media_uploads_type (file_type),
    INDEX idx_media_uploads_status (processing_status),
    INDEX idx_media_uploads_virus_scan (virus_scan_status)
);

-- Insert authentication-related tables from the existing schema
-- (This includes all the tables from the auth schema file)

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
    user_id VARCHAR(255) NOT NULL, -- Local user ID or email
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

-- Audit and security tables
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

-- Invitation tables
CREATE TABLE IF NOT EXISTS physician_invitations (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    organization_id INTEGER REFERENCES organizations(id),
    role VARCHAR(50) DEFAULT 'physician',
    permissions JSONB DEFAULT '[]',
    invited_by_id INTEGER REFERENCES physicians(id),
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by_id INTEGER REFERENCES physicians(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_physician_invitations_email (email),
    INDEX idx_physician_invitations_token (token_hash),
    INDEX idx_physician_invitations_status (status, expires_at)
);

CREATE TABLE IF NOT EXISTS patient_invitations (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    email VARCHAR(255),
    study_id INTEGER REFERENCES studies(id),
    physician_id INTEGER NOT NULL REFERENCES physicians(id),
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by_id INTEGER REFERENCES patients(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_patient_invitations_email (email),
    INDEX idx_patient_invitations_token (token_hash),
    INDEX idx_patient_invitations_physician (physician_id),
    INDEX idx_patient_invitations_status (status, expires_at)
);

-- Relationship tables
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

CREATE TABLE IF NOT EXISTS study_physicians (
    id SERIAL PRIMARY KEY,
    study_id INTEGER NOT NULL REFERENCES studies(id),
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

CREATE TABLE IF NOT EXISTS patient_studies (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    study_id INTEGER NOT NULL REFERENCES studies(id),
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

CREATE TABLE IF NOT EXISTS patient_questionnaire_access (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    questionnaire_id INTEGER NOT NULL REFERENCES questionnaires(id),
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

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_physicians_email_status ON physicians(email, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_email_status ON patients(email, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_physicians_mfa_enabled ON physicians(mfa_enabled);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_mfa_enabled ON patients(mfa_enabled);

-- Add email format constraints
ALTER TABLE physicians 
ADD CONSTRAINT chk_physicians_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE patients 
ADD CONSTRAINT chk_patients_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Grant permissions to api_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO api_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO api_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO api_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO api_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO api_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO api_user;

-- Create helper functions for local development
CREATE OR REPLACE FUNCTION encrypt_pii(data TEXT, key TEXT DEFAULT 'dev_encryption_key')
RETURNS TEXT AS $$
BEGIN
    -- Simple encryption for local development (not production-ready)
    RETURN encode(pgp_sym_encrypt(data, key), 'base64');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrypt_pii(encrypted_data TEXT, key TEXT DEFAULT 'dev_encryption_key')
RETURNS TEXT AS $$
BEGIN
    -- Simple decryption for local development (not production-ready)
    RETURN pgp_sym_decrypt(decode(encrypted_data, 'base64'), key);
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL; -- Return NULL if decryption fails
END;
$$ LANGUAGE plpgsql;

-- Create cleanup function for development
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Clean up expired JWT tokens from blacklist
    DELETE FROM token_blacklist WHERE expires_at < NOW();
    
    -- Clean up old rate limit logs (keep 24 hours)
    DELETE FROM rate_limit_log WHERE created_at < NOW() - INTERVAL '24 hours';
    
    -- Clean up expired SMS codes
    DELETE FROM sms_verification_codes WHERE expires_at < NOW();
    
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

-- Comments for documentation
COMMENT ON DATABASE clinical_trial_dev IS 'Local development database for Clinical Trial Platform';
COMMENT ON TABLE physicians IS 'Healthcare professionals managing clinical trials';
COMMENT ON TABLE patients IS 'Patients participating in clinical trials';
COMMENT ON TABLE studies IS 'Clinical trial studies and research projects';
COMMENT ON TABLE questionnaires IS 'Assessment questionnaires for patient data collection';
COMMENT ON TABLE patient_responses IS 'Patient responses to questionnaires with encryption';
COMMENT ON TABLE media_uploads IS 'Secure file uploads with virus scanning and encryption';
COMMENT ON FUNCTION encrypt_pii IS 'Helper function for encrypting PII data (development only)';
COMMENT ON FUNCTION decrypt_pii IS 'Helper function for decrypting PII data (development only)';