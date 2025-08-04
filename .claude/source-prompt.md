Clinical Trial Data Collection Platform
ROLE & GOAL:

You are a world-class Full-Stack Software Architect and Development Team Lead. Your primary directive is to architect, develop, and outline the deployment of a highly secure, compliant, and user-friendly web platform for clinical trial data collection. Your output should be structured, detailed, and prioritize best practices in software engineering, security, and DevOps. Adhere strictly to the requested technology stack and architectural principles. Use LaTeX for all mathematical and scientific notations where appropriate.

PROJECT VISION:

To create a seamless and secure digital bridge between a clinical trial physician and their patients. The platform will empower the non-technical physician to dynamically manage data collection flows, while providing patients with an intuitive and accessible interface to submit their data. Security and patient privacy are the cornerstones of this project and must be reflected in every architectural decision and line of code.

I. KEY PERSONAS

The Physician (Admin): A medical professional with no technical background. Requires an extremely intuitive, visual, and simple-to-use management panel. Their goal is to efficiently manage the trial, monitor patient progress, and extract meaningful data.

The Patient (User): A participant in the clinical trial. May have varying levels of technical proficiency and potential accessibility needs. Requires a clear, simple, and trustworthy platform to answer questions and upload personal media. The system must accommodate up to 600 patients.

II. CORE FUNCTIONAL REQUIREMENTS

A. Physician's Admin Panel:

Dashboard: A high-level overview displaying key statistics: number of active patients, overall response completion rate, recent patient activity, and system notifications.

Questionnaire Builder: A drag-and-drop or highly intuitive interface for creating and modifying data collection flows.

Question Types: Support for various formats: Multiple Choice, Checkboxes, Text (short/long), Number, Date, and a designated Media Upload section.

Conditional Logic: Ability to show/hide questions based on previous answers (e.g., If patient answers 'Yes' to 'Are you experiencing side effects?', show a text box to describe them).

Versioning: Ability to modify questionnaires without affecting data from patients who have already completed a previous version.

Patient Management:

Invitation System: Securely invite new patients via a unique, time-sensitive registration link sent to their email.

Patient Roster: View a list of all patients, their registration status, and their overall progress in the questionnaire flow.

Individual Patient View: Ability to view a specific patient's complete submission history (answers and uploaded media) in a clean, organized format.

Data & Reporting:

Data Export: Export all collected data in structured formats like CSV or JSON. Exports must be filterable by date range, patient cohort, or questionnaire version.

Basic Statistics: Generate and display simple charts and graphs for multiple-choice questions (e.g., pie charts for answer distribution).

Media Gallery: A secure, filterable gallery to view all media uploaded by patients, clearly tagged with patient ID and question context.

B. Patient Portal:

Onboarding: A simple, secure registration process using the unique link from the physician. Requires two-factor authentication (2FA) setup (e.g., via email or authenticator app).

Data Submission Flow: A step-by-step, distraction-free interface to guide the patient through the questions defined by the physician.

Progress is saved automatically after each step.

Clear instructions for each question and media upload requirement.

A final review screen before submission.

User Profile: Patients can manage their password and 2FA settings.

III. NON-FUNCTIONAL & ARCHITECTURAL REQUIREMENTS

A. Security & Privacy (CRITICAL PRIORITY):

Compliance Framework: Architect the system with HIPAA (Health Insurance Portability and Accountability Act) principles in mind. This includes strict access controls, audit trails, and data encryption.

Authentication: Implement a robust user authentication system. Use AWS Cognito for managing user pools for both physicians and patients, enforcing strong password policies and MFA/2FA.

Data Encryption:

At Rest: All data in the database (e.g., AWS RDS) and storage (AWS S3) must be encrypted using AWS KMS.

In Transit: Enforce TLS 1.2 or higher for all communication between the client, backend, and AWS services.

Authorization: Implement strict Role-Based Access Control (RBAC). A physician can only see data for patients they have explicitly invited. Patients can only see and submit their own data.

Data Anonymization: When generating reports or statistics, ensure that any Personally Identifiable Information (PII) is masked or removed unless explicitly required for a specific, authorized view.

Audit Trails: Log all significant actions (e.g., physician login, data export, questionnaire modification, patient data submission) for security auditing.

B. Technology Stack & DevOps:

Cloud Provider: AWS.

Infrastructure as Code (IaC): All AWS infrastructure (VPC, Subnets, EC2/Fargate, RDS, S3, Cognito, etc.) must be defined in Terraform. Provide the complete, modularized Terraform code.

CI/CD: Implement a full CI/CD pipeline using GitHub Actions.

On Pull Request: Trigger static code analysis, linting, and unit tests.

On Merge to main: Automatically build artifacts (e.g., Docker containers), push them to AWS ECR, and deploy to a staging environment.

Manual Trigger for Production: A manual approval step in GitHub Actions to promote the staging build to the production environment.

Backend:

Choose a modern, scalable language/framework (e.g., Node.js with Express/NestJS, Python with Django/FastAPI, or Go).

Design it as a headless, API-first service. The API must be well-documented using the OpenAPI (Swagger) specification. This ensures future integration with the planned Android app.

The application should be containerized using Docker.

Frontend (Web):

Use a modern JavaScript framework like React (with Next.js) or Vue (with Nuxt.js) for a performant, server-rendered, or statically generated site.

The design must be clean, modern, and fully responsive (mobile-first).

Incorporate subtle, professional animations on scroll to enhance user experience.

Crucially, the UI must support Dynamic Type / Large Font Accessibility. The layout must not break when users increase their browser's base font size.

C. Secondary Data Collection Tools (Optional Enhancements):

Propose a plan for incorporating one or more of the following, to be developed after the core features are stable:

ePROs (Electronic Patient-Reported Outcomes): Scheduled push notifications or emails reminding patients to complete a questionnaire or daily check-in.

Symptom Tracker: A simple daily interface for patients to rate the severity of specific symptoms on a scale (e.g., 1-10).

Wearable Integration (Phase 2): An API endpoint structure to potentially receive basic data (e.g., step count, sleep duration) from health tracking services like Apple HealthKit or Google Fit APIs, with explicit patient consent.

IV. YOUR DELIVERABLES & TASK BREAKDOWN

Please proceed by providing a comprehensive project plan, breaking it down into the following phases. For each phase, describe the key activities, technologies to be used, and the expected artifacts.

Phase 1: Architecture & Project Setup

Detailed Architecture Diagram (showing AWS services, data flow, and user interaction).

Technology Stack Rationale (justification for your choice of backend/frontend frameworks).

Repository Structure Setup (for backend, frontend, terraform).

Initial Terraform scripts for the core network and security groups.

CI/CD pipeline structure (.github/workflows/main.yml).

Phase 2: Backend Development (API-First)

Database Schema Design.

AWS Cognito Setup and User Authentication/Authorization logic.

Development of all API endpoints for Patients and Physicians.

OpenAPI (Swagger) documentation for the API.

Unit and integration test suite.

Phase 3: Frontend Development

UI/UX wireframes or component design.

Development of the Patient Portal.

Development of the Physician's Admin Panel.

Integration with the backend API.

Implementation of animations and accessibility features.

Phase 4: Deployment & Finalization

Finalizing Terraform scripts for all environments (staging, production).

Full CI/CD pipeline execution and testing.

Security audit checklist and penetration testing plan.

Comprehensive documentation for the physician on how to use the admin panel.

Begin with Phase 1. Present the detailed architecture and setup plan.