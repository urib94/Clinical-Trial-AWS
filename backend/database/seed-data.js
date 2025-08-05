const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class DatabaseSeeder {
    constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'clinical_trial_dev',
            user: process.env.DB_USER || 'api_user',
            password: process.env.DB_PASSWORD || 'api_password',
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    }

    async connect() {
        try {
            const client = await this.pool.connect();
            console.log('✅ Connected to PostgreSQL database for seeding');
            client.release();
            return true;
        } catch (error) {
            console.error('❌ Failed to connect to database:', error.message);
            return false;
        }
    }

    // Helper function to encrypt PII data
    encryptPII(data) {
        // Simple encryption for local development
        const cipher = crypto.createCipher('aes-256-cbc', 'dev_encryption_key');
        let encrypted = cipher.update(data, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    }

    async seedOrganizations() {
        const organizations = [
            {
                name: 'Central Medical Center',
                type: 'hospital',
                address: '123 Medical Drive, Health City, HC 12345',
                phone: '+1-555-0101',
                email: 'info@centralmedical.com',
                website: 'https://www.centralmedical.com',
                license_number: 'HOS-2023-001'
            },
            {
                name: 'Research Institute of Advanced Medicine',
                type: 'research_center',
                address: '456 Research Blvd, Science Park, SP 67890',
                phone: '+1-555-0102',
                email: 'contact@riam.org',
                website: 'https://www.riam.org',
                license_number: 'RES-2023-002'
            },
            {
                name: 'Community Health Clinic',
                type: 'clinic',
                address: '789 Community St, Hometown, HT 11111',
                phone: '+1-555-0103',
                email: 'help@communityclinic.org',
                license_number: 'CLI-2023-003'
            }
        ];

        try {
            for (const org of organizations) {
                await this.pool.query(`
                    INSERT INTO organizations (name, type, address, phone, email, website, license_number)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (name) DO NOTHING
                `, [org.name, org.type, org.address, org.phone, org.email, org.website, org.license_number]);
            }
            console.log('✅ Organizations seeded');
        } catch (error) {
            console.error('❌ Failed to seed organizations:', error.message);
            throw error;
        }
    }

    async seedStudies() {
        const studies = [
            {
                title: 'Phase II Study of Novel Cancer Treatment',
                description: 'A randomized, double-blind, placebo-controlled study evaluating the efficacy and safety of NCT-2024 in patients with advanced solid tumors.',
                study_type: 'clinical_trial',
                phase: 'phase_2',
                status: 'recruiting',
                organization_id: 1,
                start_date: '2024-01-15',
                end_date: '2025-12-31',
                target_enrollment: 200,
                current_enrollment: 45,
                inclusion_criteria: 'Adults 18+ with histologically confirmed advanced solid tumors; ECOG performance status 0-2; adequate organ function',
                exclusion_criteria: 'Pregnant or nursing women; active infection; prior treatment with similar agents',
                primary_endpoints: 'Overall response rate (ORR) and progression-free survival (PFS)',
                secondary_endpoints: 'Overall survival (OS), safety, and quality of life measures',
                ethics_approval_number: 'IRB-2023-001',
                ethics_approval_date: '2023-12-01'
            },
            {
                title: 'Observational Study on Heart Disease Risk Factors',
                description: 'Long-term observational study tracking cardiovascular risk factors in urban populations.',
                study_type: 'observational',
                phase: null,
                status: 'active',
                organization_id: 2,
                start_date: '2023-06-01',
                end_date: '2028-05-31',
                target_enrollment: 1000,
                current_enrollment: 324,
                inclusion_criteria: 'Adults 25-75 years; urban residents; willing to participate for 5 years',
                exclusion_criteria: 'History of major cardiovascular events; inability to provide informed consent',
                primary_endpoints: 'Incidence of cardiovascular events over 5 years',
                secondary_endpoints: 'Changes in biomarkers, lifestyle factors, and quality of life',
                ethics_approval_number: 'IRB-2023-002',
                ethics_approval_date: '2023-05-15'
            },
            {
                title: 'Mental Health Survey in Healthcare Workers',
                description: 'Cross-sectional survey assessing mental health outcomes in healthcare workers post-pandemic.',
                study_type: 'survey',
                phase: null,
                status: 'recruiting',
                organization_id: 3,
                start_date: '2024-03-01',
                end_date: '2024-09-30',
                target_enrollment: 500,
                current_enrollment: 128,
                inclusion_criteria: 'Healthcare workers employed during 2020-2023; English proficiency',
                exclusion_criteria: 'Students or temporary workers; inability to complete survey',
                primary_endpoints: 'Prevalence of anxiety and depression symptoms',
                secondary_endpoints: 'Burnout levels, coping mechanisms, and workplace satisfaction',
                ethics_approval_number: 'IRB-2024-001',
                ethics_approval_date: '2024-02-15'
            }
        ];

        try {
            for (const study of studies) {
                await this.pool.query(`
                    INSERT INTO studies (
                        title, description, study_type, phase, status, organization_id,
                        start_date, end_date, target_enrollment, current_enrollment,
                        inclusion_criteria, exclusion_criteria, primary_endpoints,
                        secondary_endpoints, ethics_approval_number, ethics_approval_date
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                    ON CONFLICT (title) DO NOTHING
                `, [
                    study.title, study.description, study.study_type, study.phase,
                    study.status, study.organization_id, study.start_date, study.end_date,
                    study.target_enrollment, study.current_enrollment, study.inclusion_criteria,
                    study.exclusion_criteria, study.primary_endpoints, study.secondary_endpoints,
                    study.ethics_approval_number, study.ethics_approval_date
                ]);
            }
            console.log('✅ Studies seeded');
        } catch (error) {
            console.error('❌ Failed to seed studies:', error.message);
            throw error;
        }
    }

    async seedPhysicians() {
        const physicians = [
            {
                email: 'dr.smith@centralmedical.com',
                password: 'DevPassword123!',
                first_name: 'Sarah',
                last_name: 'Smith',
                title: 'Dr.',
                specialization: 'Oncology',
                license_number: 'MD-12345',
                organization_id: 1,
                phone: '+1-555-1001',
                department: 'Oncology Department',
                role: 'principal_investigator',
                permissions: ['study_management', 'patient_management', 'data_analysis']
            },
            {
                email: 'dr.johnson@riam.org',
                password: 'DevPassword123!',
                first_name: 'Michael',
                last_name: 'Johnson',
                title: 'Prof.',
                specialization: 'Cardiology',
                license_number: 'MD-67890',
                organization_id: 2,
                phone: '+1-555-1002',
                department: 'Cardiovascular Research',
                role: 'physician',
                permissions: ['patient_management', 'data_collection']
            },
            {
                email: 'dr.davis@communityclinic.org',
                password: 'DevPassword123!',
                first_name: 'Emily',
                last_name: 'Davis',
                title: 'Dr.',
                specialization: 'Psychiatry',
                license_number: 'MD-11111',
                organization_id: 3,
                phone: '+1-555-1003',
                department: 'Mental Health',
                role: 'research_coordinator',
                permissions: ['survey_management', 'data_collection']
            }
        ];

        try {
            for (const physician of physicians) {
                const hashedPassword = await bcrypt.hash(physician.password, 12);
                
                await this.pool.query(`
                    INSERT INTO physicians (
                        email, password_hash, first_name, last_name, title,
                        specialization, license_number, organization_id, phone,
                        department, role, permissions, status, email_verified, profile_completed
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', true, true)
                    ON CONFLICT (email) DO NOTHING
                `, [
                    physician.email, hashedPassword, physician.first_name, physician.last_name,
                    physician.title, physician.specialization, physician.license_number,
                    physician.organization_id, physician.phone, physician.department,
                    physician.role, JSON.stringify(physician.permissions)
                ]);
            }
            console.log('✅ Physicians seeded');
        } catch (error) {
            console.error('❌ Failed to seed physicians:', error.message);
            throw error;
        }
    }

    async seedPatients() {
        const patients = [
            {
                email: 'patient1@example.com',
                password: 'PatientPass123!',
                patient_id: 'PAT-001',
                first_name: 'John',
                last_name: 'Doe',
                date_of_birth: '1975-06-15',
                gender: 'male',
                phone: '+1-555-2001',
                address: '123 Patient St, City, ST 12345',
                emergency_contact: 'Jane Doe, Spouse, +1-555-2002',
                medical_history: 'Hypertension, Type 2 Diabetes',
                medications: 'Metformin 500mg BID, Lisinopril 10mg daily',
                allergies: 'Penicillin, Shellfish'
            },
            {
                email: 'patient2@example.com',
                password: 'PatientPass123!',
                patient_id: 'PAT-002',
                first_name: 'Maria',
                last_name: 'Garcia',
                date_of_birth: '1982-03-22',
                gender: 'female',
                phone: '+1-555-2003',
                address: '456 Health Ave, Wellness City, WC 67890',
                emergency_contact: 'Carlos Garcia, Husband, +1-555-2004',
                medical_history: 'Asthma, Seasonal Allergies',
                medications: 'Albuterol inhaler PRN, Claritin 10mg daily',
                allergies: 'None known'
            },
            {
                email: 'patient3@example.com',
                password: 'PatientPass123!',
                patient_id: 'PAT-003',
                first_name: 'Robert',
                last_name: 'Wilson',
                date_of_birth: '1968-11-30',
                gender: 'male',
                phone: '+1-555-2005',
                address: '789 Care Blvd, Treatment Town, TT 11111',
                emergency_contact: 'Susan Wilson, Wife, +1-555-2006',
                medical_history: 'Coronary Artery Disease, Hyperlipidemia',
                medications: 'Atorvastatin 20mg daily, Metoprolol 50mg BID',
                allergies: 'Aspirin'
            }
        ];

        try {
            for (const patient of patients) {
                const hashedPassword = await bcrypt.hash(patient.password, 12);
                
                // Encrypt PII data
                const encryptedFirstName = this.encryptPII(patient.first_name);
                const encryptedLastName = this.encryptPII(patient.last_name);
                const encryptedDOB = this.encryptPII(patient.date_of_birth);
                const encryptedPhone = this.encryptPII(patient.phone);
                const encryptedAddress = this.encryptPII(patient.address);
                const encryptedEmergencyContact = this.encryptPII(patient.emergency_contact);
                const encryptedMedicalHistory = this.encryptPII(patient.medical_history);
                const encryptedMedications = this.encryptPII(patient.medications);
                const encryptedAllergies = this.encryptPII(patient.allergies);
                
                await this.pool.query(`
                    INSERT INTO patients (
                        email, password_hash, patient_id, first_name_encrypted, last_name_encrypted,
                        date_of_birth_encrypted, gender, phone_encrypted, address_encrypted,
                        emergency_contact_encrypted, medical_history_encrypted, medications_encrypted,
                        allergies_encrypted, status, consent_signed, consent_date, consent_version
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active', true, CURRENT_DATE, '1.0')
                    ON CONFLICT (email) DO NOTHING
                `, [
                    patient.email, hashedPassword, patient.patient_id,
                    encryptedFirstName, encryptedLastName, encryptedDOB,
                    patient.gender, encryptedPhone, encryptedAddress,
                    encryptedEmergencyContact, encryptedMedicalHistory,
                    encryptedMedications, encryptedAllergies
                ]);
            }
            console.log('✅ Patients seeded');
        } catch (error) {
            console.error('❌ Failed to seed patients:', error.message);
            throw error;
        }
    }

    async seedQuestionnaires() {
        const questionnaires = [
            {
                title: 'Baseline Health Assessment',
                description: 'Initial assessment questionnaire for all study participants',
                version: '1.0',
                study_id: 1,
                questionnaire_type: 'baseline',
                frequency: 'once',
                is_required: true,
                estimated_time_minutes: 15,
                instructions: 'Please answer all questions honestly and completely. This information will help us understand your current health status.',
                questions: [
                    {
                        id: 'q1',
                        type: 'multiple_choice',
                        question: 'How would you rate your overall health?',
                        options: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
                        required: true
                    },
                    {
                        id: 'q2',
                        type: 'text',
                        question: 'Please list any medications you are currently taking:',
                        required: false,
                        max_length: 500
                    },
                    {
                        id: 'q3',
                        type: 'scale',
                        question: 'On a scale of 1-10, how would you rate your current pain level?',
                        min: 1,
                        max: 10,
                        required: true
                    },
                    {
                        id: 'q4',
                        type: 'yes_no',
                        question: 'Have you experienced any side effects from previous treatments?',
                        required: true
                    }
                ],
                validation_rules: {
                    required_questions: ['q1', 'q3', 'q4'],
                    conditional_logic: {
                        'q4': {
                            'if_yes': 'show_followup_q4a'
                        }
                    }
                },
                created_by: 1
            },
            {
                title: 'Weekly Symptom Check',
                description: 'Weekly assessment of symptoms and side effects',
                version: '1.0',
                study_id: 1,
                questionnaire_type: 'followup',
                frequency: 'weekly',
                is_required: true,
                estimated_time_minutes: 10,
                instructions: 'Please complete this weekly assessment to help us monitor your progress.',
                questions: [
                    {
                        id: 'w1',
                        type: 'scale',
                        question: 'How has your energy level been this week? (1=Very Low, 10=Very High)',
                        min: 1,
                        max: 10,
                        required: true
                    },
                    {
                        id: 'w2',
                        type: 'multiple_choice',
                        question: 'Which symptoms have you experienced this week? (Select all that apply)',
                        options: ['Nausea', 'Fatigue', 'Headache', 'Dizziness', 'Loss of appetite', 'None'],
                        multiple: true,
                        required: true
                    },
                    {
                        id: 'w3',
                        type: 'text',
                        question: 'Please describe any new or concerning symptoms:',
                        required: false,
                        max_length: 300
                    }
                ],
                validation_rules: {
                    required_questions: ['w1', 'w2']
                },
                created_by: 1
            },
            {
                title: 'Quality of Life Survey',
                description: 'Assessment of quality of life measures for research purposes',
                version: '1.0',
                study_id: 2,
                questionnaire_type: 'assessment',
                frequency: 'monthly',
                is_required: false,
                estimated_time_minutes: 20,
                instructions: 'This survey helps us understand how various factors affect your quality of life.',
                questions: [
                    {
                        id: 'qol1',
                        type: 'scale',
                        question: 'How satisfied are you with your physical health? (1=Very Dissatisfied, 10=Very Satisfied)',
                        min: 1,
                        max: 10,
                        required: true
                    },
                    {
                        id: 'qol2',
                        type: 'scale',
                        question: 'How satisfied are you with your relationships? (1=Very Dissatisfied, 10=Very Satisfied)',
                        min: 1,
                        max: 10,
                        required: true
                    },
                    {
                        id: 'qol3',
                        type: 'multiple_choice',
                        question: 'How often do you feel stressed?',
                        options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
                        required: true
                    }
                ],
                validation_rules: {
                    required_questions: ['qol1', 'qol2', 'qol3']
                },
                created_by: 2
            }
        ];

        try {
            for (const questionnaire of questionnaires) {
                await this.pool.query(`
                    INSERT INTO questionnaires (
                        title, description, version, study_id, questionnaire_type,
                        frequency, questions, validation_rules, status, is_required,
                        estimated_time_minutes, instructions, created_by, published_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10, $11, $12, NOW())
                    ON CONFLICT (title, version) DO NOTHING
                `, [
                    questionnaire.title, questionnaire.description, questionnaire.version,
                    questionnaire.study_id, questionnaire.questionnaire_type,
                    questionnaire.frequency, JSON.stringify(questionnaire.questions),
                    JSON.stringify(questionnaire.validation_rules), questionnaire.is_required,
                    questionnaire.estimated_time_minutes, questionnaire.instructions,
                    questionnaire.created_by
                ]);
            }
            console.log('✅ Questionnaires seeded');
        } catch (error) {
            console.error('❌ Failed to seed questionnaires:', error.message);
            throw error;
        }
    }

    async seedRelationships() {
        try {
            // Physician-Patient relationships
            const relationships = [
                { physician_id: 1, patient_id: 1, relationship_type: 'primary' },
                { physician_id: 1, patient_id: 2, relationship_type: 'primary' },
                { physician_id: 2, patient_id: 3, relationship_type: 'primary' }
            ];

            for (const rel of relationships) {
                await this.pool.query(`
                    INSERT INTO physician_patient_relationships (physician_id, patient_id, relationship_type, created_by)
                    VALUES ($1, $2, $3, $1)
                    ON CONFLICT (physician_id, patient_id, relationship_type) DO NOTHING
                `, [rel.physician_id, rel.patient_id, rel.relationship_type]);
            }

            // Study-Physician relationships
            const studyPhysicians = [
                { study_id: 1, physician_id: 1, role: 'principal' },
                { study_id: 2, physician_id: 2, role: 'investigator' },
                { study_id: 3, physician_id: 3, role: 'coordinator' }
            ];

            for (const sp of studyPhysicians) {
                await this.pool.query(`
                    INSERT INTO study_physicians (study_id, physician_id, role, permissions)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (study_id, physician_id) DO NOTHING
                `, [sp.study_id, sp.physician_id, sp.role, JSON.stringify(['data_access', 'patient_management'])]);
            }

            // Patient-Study enrollments
            const patientStudies = [
                { patient_id: 1, study_id: 1, enrollment_status: 'enrolled' },
                { patient_id: 2, study_id: 1, enrollment_status: 'enrolled' },
                { patient_id: 3, study_id: 2, enrollment_status: 'enrolled' }
            ];

            for (const ps of patientStudies) {
                await this.pool.query(`
                    INSERT INTO patient_studies (patient_id, study_id, enrollment_status)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (patient_id, study_id) DO NOTHING
                `, [ps.patient_id, ps.study_id, ps.enrollment_status]);
            }

            // Patient questionnaire access
            const questionnaireAccess = [
                { patient_id: 1, questionnaire_id: 1, assigned_by: 1 },
                { patient_id: 1, questionnaire_id: 2, assigned_by: 1 },
                { patient_id: 2, questionnaire_id: 1, assigned_by: 1 },
                { patient_id: 2, questionnaire_id: 2, assigned_by: 1 },
                { patient_id: 3, questionnaire_id: 3, assigned_by: 2 }
            ];

            for (const access of questionnaireAccess) {
                await this.pool.query(`
                    INSERT INTO patient_questionnaire_access (patient_id, questionnaire_id, assigned_by)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (patient_id, questionnaire_id) DO NOTHING
                `, [access.patient_id, access.questionnaire_id, access.assigned_by]);
            }

            console.log('✅ Relationships seeded');
        } catch (error) {
            console.error('❌ Failed to seed relationships:', error.message);
            throw error;
        }
    }

    async seedAll() {
        console.log('🌱 Starting database seeding...\n');
        
        try {
            await this.seedOrganizations();
            await this.seedStudies();
            await this.seedPhysicians();
            await this.seedPatients();
            await this.seedQuestionnaires();
            await this.seedRelationships();
            
            console.log('\n✅ Database seeding completed successfully!');
            console.log('\n📋 Seeded Data Summary:');
            console.log('   • 3 Organizations');
            console.log('   • 3 Studies');
            console.log('   • 3 Physicians');
            console.log('   • 3 Patients');
            console.log('   • 3 Questionnaires');
            console.log('   • Various relationships and access permissions');
            
            console.log('\n🔐 Test Login Credentials:');
            console.log('   Physician: dr.smith@centralmedical.com / DevPassword123!');
            console.log('   Patient: patient1@example.com / PatientPass123!');
            
        } catch (error) {
            console.error('💥 Seeding failed:', error.message);
            throw error;
        }
    }

    async clearAll() {
        console.log('🗑️  Clearing all seed data...');
        
        const tables = [
            'patient_questionnaire_access',
            'patient_studies',
            'study_physicians',
            'physician_patient_relationships',
            'patient_responses',
            'media_uploads',
            'questionnaires',
            'patients',
            'physicians',
            'studies',
            'organizations'
        ];

        try {
            for (const table of tables) {
                await this.pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
            }
            console.log('✅ All seed data cleared');
        } catch (error) {
            console.error('❌ Failed to clear seed data:', error.message);
            throw error;
        }
    }

    async close() {
        await this.pool.end();
        console.log('✅ Database connection closed');
    }
}

// CLI interface
async function main() {
    const seeder = new DatabaseSeeder();
    const command = process.argv[2];
    
    try {
        if (!(await seeder.connect())) {
            process.exit(1);
        }
        
        switch (command) {
            case 'seed':
            case 'all':
                await seeder.seedAll();
                break;
                
            case 'clear':
                await seeder.clearAll();
                break;
                
            case 'reset':
                await seeder.clearAll();
                await seeder.seedAll();
                break;
                
            default:
                console.log('📖 Usage:');
                console.log('  node seed-data.js seed     - Seed all test data');
                console.log('  node seed-data.js clear    - Clear all seed data');
                console.log('  node seed-data.js reset    - Clear and re-seed all data');
                break;
        }
        
    } catch (error) {
        console.error('💥 Seeding failed:', error.message);
        process.exit(1);
    } finally {
        await seeder.close();
    }
}

// Export for use as module
module.exports = DatabaseSeeder;

// Run as CLI if called directly
if (require.main === module) {
    main();
}