# User Flow Diagrams for Physician Portal

## Overview
This document outlines the key user flows for physicians using the admin portal, designed to optimize workflows for non-technical medical professionals managing clinical trial data.

## Primary User Flows

### 1. Initial Login and Dashboard Overview
```
[Login Page]
     ↓
[MFA Verification] (if enabled)
     ↓
[Dashboard Landing]
     ├─ View Key Statistics
     ├─ Check Notifications
     ├─ Review Recent Activity
     └─ Quick Actions Access
```

**Detailed Flow:**
```
START: Physician visits portal URL
  ↓
1. Login Form
   - Email/Username input
   - Password input
   - Remember me option
   - Forgot password link
  ↓
2. Authentication Validation
   - Valid? → Continue
   - Invalid? → Error message + retry
  ↓
3. MFA Challenge (if configured)
   - SMS/Email/Authenticator code
   - Valid? → Continue
   - Invalid? → Error + retry (max 3 attempts)
  ↓
4. Dashboard Loading
   - Fetch user profile
   - Load statistics
   - Check notifications
   - Display welcome message
  ↓
END: Dashboard displayed with overview
```

### 2. Creating a New Questionnaire
```
[Dashboard] → [Questionnaires] → [+ New Questionnaire]
     ↓
[Basic Information Setup]
     ↓
[Question Builder Interface]
     ├─ Add Questions
     ├─ Configure Logic
     ├─ Preview & Test
     └─ Save Draft
     ↓
[Review & Publish]
     ↓
[Patient Assignment] (optional)
     ↓
[Confirmation & Next Steps]
```

**Detailed Flow:**
```
START: From Dashboard or Questionnaires page
  ↓
1. Create New Questionnaire
   - Click "New Questionnaire" button
   - System creates draft questionnaire
  ↓
2. Basic Information Form
   - Title (required)
   - Description
   - Study phase
   - Estimated completion time
   - Save & Continue
  ↓
3. Question Builder
   3a. Add Questions
       - Select question type from palette
       - Configure question settings
       - Add answer options
       - Set validation rules
   3b. Conditional Logic (optional)
       - Select trigger question
       - Define conditions
       - Set actions (show/hide/skip)
       - Test logic flow
   3c. Preview & Test
       - View patient experience
       - Test on different devices
       - Validate logic flows
       - Check accessibility
  ↓
4. Save Options
   - Save as draft (continue later)
   - Save template (reuse pattern)
   - Proceed to review
  ↓
5. Review & Validation
   - Check all questions
   - Verify logic flows
   - Accessibility scan
   - Preview final version
  ↓
6. Publishing Decision
   - Publish immediately?
   - Schedule for later?
   - Assign to patients now?
  ↓
7. Patient Assignment (if selected)
   - Select patient cohort
   - Choose assignment method
   - Set deadlines
   - Configure reminders
  ↓
END: Questionnaire published/scheduled
```

### 3. Patient Management and Monitoring
```
[Dashboard] → [Patients]
     ↓
[Patient Roster View]
     ├─ Filter/Search Patients
     ├─ View Patient Progress
     ├─ Send Communications
     └─ Manage Individual Patient
     ↓
[Individual Patient Detail]
     ├─ View Response History
     ├─ Monitor Progress
     ├─ Send Messages
     └─ Export Patient Data
```

**Detailed Flow:**
```
START: From Dashboard or direct navigation
  ↓
1. Patient Roster
   - Load patient list (paginated)
   - Display status indicators
   - Show progress bars
   - Recent activity timestamps
  ↓
2. Filtering/Search (optional)
   - Status filter (active/pending/complete)
   - Date range selection
   - Progress filter
   - Text search by ID
  ↓
3. Patient Selection
   - Click on patient row
   - Or select multiple for bulk actions
  ↓
4. Patient Detail View
   4a. Overview Tab
       - Progress summary
       - Timeline view
       - Engagement metrics
       - Contact information
   4b. Responses Tab
       - Questionnaire completion status
       - Response quality scores
       - Detailed answer review
       - Media submissions
   4c. Communication Tab
       - Message history
       - Reminder schedule
       - Response tracking
       - Custom message compose
  ↓
5. Available Actions
   - Send message/reminder
   - Export patient data
   - Flag for review
   - Archive patient
   - Schedule follow-up
  ↓
END: Action completed or return to roster
```

### 4. Data Export and Reporting
```
[Dashboard] → [Data & Reports]
     ↓
[Export Options]
     ├─ Quick Export (predefined)
     └─ Custom Export Builder
     ↓
[Data Selection & Filtering]
     ↓
[Format Selection]
     ↓
[Privacy & Security Options]
     ↓
[Generate & Download]
```

**Detailed Flow:**
```
START: From Dashboard or navigation menu
  ↓
1. Export Options
   1a. Quick Export
       - All patient data (CSV/JSON)
       - Demographics only
       - Response data only
       - Media files
   1b. Custom Export Builder
       - Advanced filtering
       - Field selection
       - Format customization
  ↓
2. Custom Export Builder (if selected)
   2a. Data Source Selection
       - Patient demographics
       - Medical history
       - Questionnaire responses
       - Media files
       - Communication logs
   2b. Field Selection
       - Check specific fields
       - Preview data structure
       - Estimate file size
   2c. Filter Application
       - Date ranges
       - Patient status
       - Response quality
       - Medical conditions
   2d. Format Options
       - File format (CSV/JSON/PDF/XML)
       - Data labels (codes vs text)
       - Privacy settings
       - Statistical summaries
  ↓
3. Validation & Preview
   - Check filter results
   - Preview data sample
   - Validate selections
   - Confirm privacy settings
  ↓
4. Export Generation
   - Show progress indicator
   - Handle large datasets
   - Error handling
   - Security scanning
  ↓
5. Download & Completion
   - Secure download link
   - File size confirmation
   - Export log entry
   - Cleanup temporary files
  ↓
END: File downloaded successfully
```

### 5. Patient Invitation Process
```
[Patients] → [Invite Patients]
     ↓
[Invitation Method Selection]
     ↓
[Contact Information Entry]
     ↓
[Message Customization]
     ↓
[Send Settings Configuration]
     ↓
[Send Invitations]
     ↓
[Tracking & Follow-up]
```

**Detailed Flow:**
```
START: From Patient Management page
  ↓
1. Invitation Method
   - Individual email
   - Bulk email list
   - SMS invitations
   - Link sharing
  ↓
2. Contact Information
   2a. Individual
       - Email address
       - Patient identifier
       - Personal details
   2b. Bulk
       - CSV file upload
       - Paste email list
       - Validate format
  ↓
3. Message Customization
   - Select template
   - Customize subject line
   - Edit message body
   - Add study information
   - Include contact details
  ↓
4. Send Settings
   - Send immediately or schedule
   - Reminder settings
   - Follow-up schedule
   - Expiration date
  ↓
5. Validation & Preview
   - Check all recipients
   - Preview message
   - Validate settings
   - Confirm send
  ↓
6. Send Process
   - Queue invitations
   - Show send progress
   - Handle delivery failures
   - Log all activities
  ↓
7. Post-Send Tracking
   - Monitor delivery status
   - Track registration responses
   - Schedule follow-up reminders
   - Update patient roster
  ↓
END: Invitations sent and tracked
```

## Secondary User Flows

### 6. Questionnaire Editing and Versioning
```
[Questionnaires] → [Select Existing] → [Edit]
     ↓
[Version Management]
     ├─ Create New Version
     ├─ Edit Current Draft
     └─ Clone Questionnaire
     ↓
[Impact Analysis]
     ↓
[Make Changes]
     ↓
[Publish New Version]
```

### 7. Communication Management
```
[Patient Detail] → [Send Message]
     ↓
[Message Type Selection]
     ├─ Individual Message
     ├─ Reminder Notice
     └─ Bulk Communication
     ↓
[Compose Message]
     ↓
[Schedule & Send]
     ↓
[Track Delivery]
```

### 8. Data Quality Review
```
[Dashboard] → [Data Quality Alert]
     ↓
[Issue Identification]
     ↓
[Patient Response Review]
     ↓
[Quality Assessment]
     ├─ Flag for Follow-up
     ├─ Accept Response
     └─ Request Clarification
     ↓
[Update Status]
```

## Error Handling Flows

### Login Failures
```
[Login Attempt]
     ↓
[Authentication Fails]
     ├─ Wrong Password → [Error Message] → [Retry/Reset]
     ├─ Account Locked → [Contact Admin] → [Support Process]
     ├─ MFA Failure → [Error Message] → [Retry/Backup Codes]
     └─ System Error → [Technical Error] → [Retry Later]
```

### Data Export Failures
```
[Export Request]
     ↓
[Processing Fails]
     ├─ Large Dataset → [Recommend Filters] → [Retry with Limits]
     ├─ System Error → [Error Log] → [Technical Support]
     ├─ Permission Error → [Access Denied] → [Admin Contact]
     └─ Timeout → [Background Processing] → [Email When Ready]
```

### Form Validation Errors
```
[Form Submission]
     ↓
[Validation Fails]
     ├─ Required Fields → [Highlight Fields] → [Fix & Retry]
     ├─ Format Errors → [Show Examples] → [Correct Format]
     ├─ Logic Conflicts → [Explain Issue] → [Resolve Conflict]
     └─ System Validation → [Technical Error] → [Save Draft]
```

## Mobile-Specific Flows

### Mobile Dashboard Navigation
```
[Mobile Login]
     ↓
[Dashboard (Mobile Layout)]
     ├─ Hamburger Menu
     ├─ Key Stats Cards
     ├─ Quick Actions
     └─ Recent Activity
     ↓
[Navigation Menu]
     ├─ Patients
     ├─ Questionnaires
     ├─ Data & Reports
     └─ Settings
```

### Mobile Patient Management
```
[Mobile Patient List]
     ↓
[Card-Based Layout]
     ├─ Swipe Actions
     ├─ Touch-Friendly Buttons
     └─ Collapsible Details
     ↓
[Patient Detail (Mobile)]
     ├─ Tabbed Interface
     ├─ Scroll Navigation
     └─ Touch Actions
```

## Accessibility Flow Considerations

### Screen Reader Navigation
```
[Page Load]
     ↓
[Skip Links Available]
     ├─ Skip to Main Content
     ├─ Skip to Navigation
     └─ Skip to Search
     ↓
[Logical Tab Order]
     ├─ Header Navigation
     ├─ Main Content
     ├─ Sidebar (if present)
     └─ Footer
     ↓
[Content Structure]
     ├─ Proper Headings (h1→h2→h3)
     ├─ Landmark Regions
     ├─ Form Labels
     └─ Alt Text for Images
```

### Keyboard Navigation
```
[Keyboard User]
     ↓
[Tab Navigation]
     ├─ All Interactive Elements Reachable
     ├─ Focus Indicators Visible
     ├─ Logical Tab Order
     └─ No Keyboard Traps
     ↓
[Keyboard Shortcuts]
     ├─ Common Actions (Ctrl+S for Save)
     ├─ Navigation Shortcuts
     └─ Custom Shortcuts (documented)
```

## Performance Optimization Flows

### Large Dataset Handling
```
[Large Export Request]
     ↓
[Size Detection]
     ├─ < 10MB → [Direct Download]
     ├─ 10-100MB → [Progress Indicator] → [Download]
     └─ > 100MB → [Background Processing] → [Email Link]
```

### Mobile Performance
```
[Mobile Device Detection]
     ↓
[Optimized Loading]
     ├─ Critical CSS Inline
     ├─ Lazy Load Images
     ├─ Simplified Interactions
     └─ Touch Optimizations
```

## User Flow Testing Checklist

### Critical Path Testing
- [ ] Login to dashboard (< 30 seconds)
- [ ] Create simple questionnaire (< 5 minutes)
- [ ] Invite 5 patients (< 2 minutes)
- [ ] Export basic data (< 1 minute)
- [ ] View patient progress (< 30 seconds)

### Error Recovery Testing
- [ ] Handle network disconnection gracefully
- [ ] Recover from session timeout
- [ ] Manage form validation errors
- [ ] Handle large file uploads
- [ ] Manage system maintenance mode

### Accessibility Testing
- [ ] Complete flows using only keyboard
- [ ] Navigate with screen reader
- [ ] Use with 200% zoom
- [ ] Test with high contrast mode
- [ ] Verify touch target sizes

### Mobile Testing
- [ ] Complete critical flows on mobile
- [ ] Test landscape/portrait orientation
- [ ] Verify touch interactions
- [ ] Test with poor network conditions
- [ ] Validate offline functionality (where applicable)

These user flows ensure that medical professionals can efficiently manage clinical trial data through intuitive, accessible, and error-resistant interfaces optimized for their specific workflows and technical expertise levels.