# Patient Portal Profile Management Wireframes

## Overview
These wireframes demonstrate the profile management interface designed for clinical trial participants, emphasizing security, privacy control, and accessibility. The interface allows patients to manage their account settings, view their data, and control privacy preferences.

## Flow 1: Profile Dashboard and Settings Overview

### Screen 1: Profile Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                        🔐 Secure Session    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [👤 Profile Photo]              My Profile & Settings          │
│                                                                 │
│  ┌─── Account Information ───┐                                  │
│  │                            │                                  │
│  │  👤 John Doe               │  ┌─ [Edit Profile] ─┐           │
│  │  📧 john.doe@email.com     │  │                 │           │
│  │  📅 Born: January 15, 1975 │  └─────────────────┘           │
│  │  📱 (555) 987-6543         │                                  │
│  │                            │                                  │
│  │  🏥 Study: Heart Health    │                                  │
│  │     Protocol ABC-2024-001  │                                  │
│  │  👨‍⚕️ Dr. Sarah Smith        │                                  │
│  │                            │                                  │
│  │  📊 Member since: Mar 1    │                                  │
│  │  ✅ Account verified       │                                  │
│  └────────────────────────────┘                                  │
│                                                                 │
│  ┌─── Quick Actions ───┐                                        │
│  │                      │                                        │
│  │  🔐 Security         │  ┌─ [Manage] ─┐                       │
│  │     Password & 2FA   │  │           │                       │
│  │                      │  └───────────┘                       │
│  │                      │                                        │
│  │  🔔 Notifications    │  ┌─ [Settings] ─┐                     │
│  │     Email & reminders│  │             │                     │
│  │                      │  └─────────────┘                     │
│  │                      │                                        │
│  │  🗂️  My Data          │  ┌─ [View] ─┐                        │
│  │     Responses & files │  │         │                        │
│  │                      │  └─────────┘                        │
│  │                      │                                        │
│  │  🔒 Privacy          │  ┌─ [Control] ─┐                      │
│  │     Data & consent    │  │           │                      │
│  │                      │  └───────────┘                      │
│  └──────────────────────┘                                        │
│                                                                 │
│  ┌─── Account Status ───┐                                       │
│  │                       │                                       │
│  │  ✅ Email verified    │                                       │
│  │  ✅ 2FA enabled       │                                       │
│  │  ✅ Profile complete  │                                       │
│  │  ✅ Consent current   │                                       │
│  │                       │                                       │
│  │  🏆 Security Score    │                                       │
│  │     ████████████░░░░░░ 85% (Excellent)                      │
│  │                       │                                       │
│  │  💡 Tip: Enable app   │                                       │
│  │     notifications for │                                       │
│  │     better security   │                                       │
│  └───────────────────────┘                                       │
│                                                                 │
│  ┌─── Support ───┐                                              │
│  │                │                                              │
│  │  📞 Need help? │  ┌─ [Contact Support] ─┐                   │
│  │     Study      │  │                     │                   │
│  │     coordinator│  └─────────────────────┘                   │
│  │     available  │                                              │
│  └────────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Screen 2: Edit Profile Information
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Profile                        Save Changes           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         Edit Profile Information                │
│                                                                 │
│  ┌─── Personal Information ───┐                                │
│  │                             │                                │
│  │  👤 First Name *            │                                │
│  │  ┌─────────────────────────┐ │                                │
│  │  │ John                    │ │                                │
│  │  └─────────────────────────┘ │                                │
│  │                             │                                │
│  │  👤 Last Name *             │                                │
│  │  ┌─────────────────────────┐ │                                │
│  │  │ Doe                     │ │                                │
│  │  └─────────────────────────┘ │                                │
│  │                             │                                │
│  │  📧 Email Address *         │                                │
│  │  ┌─────────────────────────┐ │                                │
│  │  │ john.doe@email.com      │ │                                │
│  │  └─────────────────────────┘ │                                │
│  │                             │                                │
│  │  ⚠️  Changing email requires │                                │
│  │     verification            │                                │
│  │                             │                                │
│  │  📱 Phone Number *          │                                │
│  │  ┌─────────────────────────┐ │                                │
│  │  │ (555) 987-6543          │ │                                │
│  │  └─────────────────────────┘ │                                │
│  │                             │                                │
│  │  📅 Date of Birth *         │                                │
│  │  ┌─────────┐ ┌─────┐ ┌─────┐ │                                │
│  │  │ January │ │ 15  │ │1975 │ │                                │
│  │  └─────────┘ └─────┘ └─────┘ │                                │
│  │                             │                                │
│  │  ℹ️  Required for study     │                                │
│  │     eligibility             │                                │
│  └─────────────────────────────┘                                │
│                                                                 │
│  ┌─── Contact Preferences ───┐                                  │
│  │                            │                                  │
│  │  🌐 Preferred Language     │                                  │
│  │  ┌─────────────────────┐   │                                  │
│  │  │ English ▼           │   │                                  │
│  │  └─────────────────────┘   │                                  │
│  │                            │                                  │
│  │  ⏰ Best Contact Time      │                                  │
│  │  ☑️ Morning (8AM-12PM)     │                                  │
│  │  ☐ Afternoon (12PM-5PM)    │                                  │
│  │  ☐ Evening (5PM-8PM)       │                                  │
│  │                            │                                  │
│  │  📞 Contact Methods        │                                  │
│  │  ☑️ Email                  │                                  │
│  │  ☑️ Phone calls            │                                  │
│  │  ☐ Text messages           │                                  │
│  │                            │                                  │
│  │  🔔 Reminders              │                                  │
│  │  ☑️ Survey reminders       │                                  │
│  │  ☑️ Appointment alerts     │                                  │
│  │  ☐ Study updates           │                                  │
│  └────────────────────────────┘                                  │
│                                                                 │
│  🔒 Your information is encrypted and only shared with your     │
│     medical team as needed for the research study.             │
│                                                                 │
│  ┌─ [Cancel] ─┐                        ┌─ [Save Changes] ─┐    │
│  │            │                        │                  │    │
│  │ (Secondary)│                        │ (Primary button) │    │
│  └────────────┘                        └──────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Flow 2: Security Management

### Screen 3: Security Settings
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Profile                         Security Settings     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                          Security & Privacy                     │
│                                                                 │
│  ┌─── Password Security ───┐                                   │
│  │                          │                                   │
│  │  🔐 Current Password     │                                   │
│  │     Last changed: Feb 28 │  ┌─ [Change Password] ─┐         │
│  │                          │  │                     │         │
│  │  💪 Strength: Strong     │  └─────────────────────┘         │
│  │     ████████████████░░   │                                   │
│  │                          │                                   │
│  │  ✅ Meets requirements   │                                   │
│  │  ✅ Unique to this site  │                                   │
│  │  ✅ Not compromised      │                                   │
│  └──────────────────────────┘                                   │
│                                                                 │
│  ┌─── Two-Factor Authentication ───┐                           │
│  │                                  │                           │
│  │  📱 Method: Email codes          │                           │
│  │     Status: ✅ Active           │  ┌─ [Manage 2FA] ─┐       │
│  │                                  │  │              │       │
│  │  📧 Backup email:                │  └──────────────┘       │
│  │     john.doe@email.com           │                           │
│  │                                  │                           │
│  │  🔄 Last used: Today 3:45 PM    │                           │
│  │                                  │                           │
│  │  💡 Consider upgrading to        │                           │
│  │     authenticator app for        │                           │
│  │     better security              │                           │
│  └──────────────────────────────────┘                           │
│                                                                 │
│  ┌─── Login Activity ───┐                                      │
│  │                       │                                      │
│  │  🖥️  Current session: │  ┌─ [View All Sessions] ─┐          │
│  │     Desktop Chrome    │  │                       │          │
│  │     Started: 3:30 PM  │  └───────────────────────┘          │
│  │                       │                                      │
│  │  📱 Recent login:     │                                      │
│  │     Mobile Safari     │                                      │
│  │     Yesterday 8:15 AM │                                      │
│  │                       │                                      │
│  │  🔍 No suspicious     │                                      │
│  │     activity detected │                                      │
│  └───────────────────────┘                                      │
│                                                                 │
│  ┌─── Account Recovery ───┐                                    │
│  │                         │                                    │
│  │  📧 Recovery email:     │  ┌─ [Update] ─┐                   │
│  │     john.doe@email.com  │  │           │                   │
│  │                         │  └───────────┘                   │
│  │  📱 Recovery phone:     │                                    │
│  │     (555) 987-6543      │  ┌─ [Update] ─┐                   │
│  │                         │  │           │                   │
│  │  ✅ Both verified       │  └───────────┘                   │
│  └─────────────────────────┘                                    │
│                                                                 │
│  ┌─── Security Recommendations ───┐                            │
│  │                                  │                            │
│  │  💡 To improve your security:   │                            │
│  │                                  │                            │
│  │  ☐ Enable authenticator app     │                            │
│  │  ☑️ Use strong, unique password  │                            │
│  │  ☑️ Enable login notifications   │                            │
│  │  ☐ Review account regularly     │                            │
│  │                                  │                            │
│  │  🏆 Current score: 85/100       │                            │
│  └──────────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

### Screen 4: Change Password Flow
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Security                      Change Password         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                          Change Your Password                   │
│                                                                 │
│  ┌─── Current Password ───┐                                    │
│  │                         │                                    │
│  │  🔐 Enter current       │                                    │
│  │     password to verify  │                                    │
│  │     your identity       │                                    │
│  │                         │                                    │
│  │  ┌─────────────────────┐ │                                    │
│  │  │ [•••••••••••••••]   │ │                                    │
│  │  └─────────────────────┘ │                                    │
│  │                         │                                    │
│  │  Status: ✅ Verified    │                                    │
│  └─────────────────────────┘                                    │
│                                                                 │
│  ┌─── New Password ───┐                                        │
│  │                     │                                        │
│  │  🔐 Create new      │                                        │
│  │     password        │                                        │
│  │                     │                                        │
│  │  ┌─────────────────┐ │                                        │
│  │  │ [•••••••••••••] │ │                                        │
│  │  └─────────────────┘ │                                        │
│  │                     │                                        │
│  │  🔐 Confirm new     │                                        │
│  │     password        │                                        │
│  │                     │                                        │
│  │  ┌─────────────────┐ │                                        │
│  │  │ [•••••••••••••] │ │                                        │
│  │  └─────────────────┘ │                                        │
│  │                     │                                        │
│  │  Strength: Strong   │                                        │
│  │  ████████████░░░░░░ │                                        │
│  └─────────────────────┘                                        │
│                                                                 │
│  ┌─── Password Requirements ───┐                               │
│  │                              │                               │
│  │  ✅ At least 8 characters   │                               │
│  │  ✅ One uppercase letter     │                               │
│  │  ✅ One lowercase letter     │                               │
│  │  ✅ One number               │                               │
│  │  ✅ One special character    │                               │
│  │  ✅ Different from current   │                               │
│  │                              │                               │
│  │  💡 Tips for strong         │                               │
│  │     passwords:              │                               │
│  │  • Use a unique phrase      │                               │
│  │  • Add numbers and symbols  │                               │
│  │  • Make it memorable        │                               │
│  └──────────────────────────────┘                               │
│                                                                 │
│  ⚠️  After changing your password:                             │
│  • You'll be logged out of all devices                         │
│  • You'll need to log in again with the new password           │
│  • We'll send a confirmation email                             │
│                                                                 │
│  ┌─ [Cancel] ─┐                        ┌─ [Change Password] ─┐ │
│  │            │                        │                     │ │
│  │ (Secondary)│                        │ (Primary, enabled   │ │
│  │            │                        │  when valid)        │ │
│  └────────────┘                        └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Flow 3: Data and Privacy Management

### Screen 5: My Data Overview
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Profile                           My Data             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                            My Study Data                        │
│                                                                 │
│  ┌─── Data Summary ───┐                                        │
│  │                     │                                        │
│  │  📊 Total responses │  23 completed surveys                 │
│  │  📅 Data range      │  Mar 1 - Mar 8, 2024                 │
│  │  📁 Files uploaded  │  15 photos, 2 documents              │
│  │  💾 Storage used    │  127 MB of secure storage            │
│  │                     │                                        │
│  │  📈 Participation   │  ████████████████░░ 89%              │
│  │     rate            │  Excellent consistency!              │
│  └─────────────────────┘                                        │
│                                                                 │
│  ┌─── Recent Responses ───┐          ┌─ [View All] ─┐          │
│  │                         │          │             │          │
│  │  📋 Daily Check-in      │ Mar 8    │             │          │
│  │     Completed 3:45 PM   │          └─────────────┘          │
│  │                         │                                    │
│  │  📊 Weekly Assessment   │ Mar 7                              │
│  │     Completed 10:30 AM  │                                    │
│  │                         │                                    │
│  │  📋 Daily Check-in      │ Mar 7                              │
│  │     Completed 8:15 AM   │                                    │
│  │                         │                                    │
│  │  📸 Medication Photo    │ Mar 6                              │
│  │     Uploaded 7:45 PM    │                                    │
│  └─────────────────────────┘                                    │
│                                                                 │
│  ┌─── Data Actions ───┐                                        │
│  │                     │                                        │
│  │  📄 Export Data     │  ┌─ [Download] ─┐                     │
│  │     Get a copy of   │  │ PDF format   │                     │
│  │     all responses   │  └──────────────┘                     │
│  │                     │                                        │
│  │  📊 View Trends     │  ┌─ [Charts] ─┐                       │
│  │     See your        │  │ Visual data │                      │
│  │     progress charts │  └─────────────┘                      │
│  │                     │                                        │
│  │  🔍 Data Details    │  ┌─ [Inspect] ─┐                      │
│  │     Technical info  │  │ Metadata    │                      │
│  │     about storage   │  └─────────────┘                      │
│  └─────────────────────┘                                        │
│                                                                 │
│  ┌─── Data Protection ───┐                                     │
│  │                        │                                     │
│  │  🔒 Encryption Level   │  AES-256 (Military grade)          │
│  │  🏥 Storage Location   │  HIPAA-compliant AWS servers       │
│  │  👥 Access Control    │  Only your medical team             │
│  │  📝 Audit Trail       │  All access logged and monitored   │
│  │  🗑️  Retention Policy  │  Deleted after study completion   │
│  │                        │  (unless consent for extended)     │
│  └────────────────────────┘                                     │
│                                                                 │
│  ⚠️  Data Requests and Rights:                                 │
│  • Request data correction: Contact study coordinator          │
│  • Data portability: Export available anytime                  │
│  • Right to be forgotten: Contact to discuss data deletion     │
│                                                                 │
│  📞 Questions about your data? Call (555) 123-4567             │
└─────────────────────────────────────────────────────────────────┘
```

### Screen 6: Privacy Controls
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Profile                      Privacy Controls         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        Privacy & Consent Settings               │
│                                                                 │
│  ┌─── Current Consent Status ───┐                              │
│  │                               │                              │
│  │  ✅ Study Participation       │  📅 Signed: March 1, 2024   │
│  │     Required for study        │  🔒 Cannot be changed       │
│  │                               │                              │
│  │  ✅ Data Collection           │  📅 Signed: March 1, 2024   │
│  │     Health data & surveys     │  🔒 Cannot be changed       │
│  │                               │                              │
│  │  ☑️ Future Contact            │  📅 Signed: March 1, 2024   │
│  │     Related research studies  │  ┌─ [Modify] ─┐             │
│  │                               │  │           │             │
│  │  ☑️ Extended Data Retention   │  └───────────┘             │
│  │     Keep data after study     │                              │
│  │                               │  ┌─ [Modify] ─┐             │
│  │  ☐ Data Sharing               │  │           │             │
│  │     Share with other          │  └───────────┘             │
│  │     research institutions     │                              │
│  └───────────────────────────────┘                              │
│                                                                 │
│  ┌─── Data Usage Permissions ───┐                              │
│  │                                │                              │
│  │  What can be done with your   │                              │
│  │  data (based on your consent):│                              │
│  │                                │                              │
│  │  ✅ Analyze for this study     │                              │
│  │  ✅ Share with study team      │                              │
│  │  ✅ Include in publications    │                              │
│  │     (de-identified only)       │                              │
│  │  ✅ Store securely             │                              │
│  │  ✅ Contact for follow-up      │                              │
│  │                                │                              │
│  │  ❌ Share with other studies   │                              │
│  │  ❌ Sell or commercialize      │                              │
│  │  ❌ Share identifying info     │                              │
│  │  ❌ Use for marketing          │                              │
│  └────────────────────────────────┘                              │
│                                                                 │
│  ┌─── Communication Preferences ───┐                           │
│  │                                   │                           │
│  │  📧 Email Communications:        │                           │
│  │  ☑️ Survey reminders            │                           │
│  │  ☑️ Study updates               │                           │
│  │  ☑️ Safety alerts               │                           │
│  │  ☐ Research opportunities       │                           │
│  │                                   │                           │
│  │  📞 Phone Communications:        │                           │
│  │  ☑️ Urgent study matters        │                           │
│  │  ☐ Check-in calls               │                           │
│  │  ☐ Follow-up surveys            │                           │
│  │                                   │                           │
│  │  📱 Text Messages:               │                           │
│  │  ☐ Survey reminders             │                           │
│  │  ☐ Appointment reminders        │                           │
│  │  ☑️ Security alerts             │                           │
│  └───────────────────────────────────┘                           │
│                                                                 │
│  ┌─── Withdrawal Options ───┐                                  │
│  │                           │                                  │
│  │  🚪 Study Withdrawal      │  ┌─ [Request Withdrawal] ─┐     │
│  │     Stop participating    │  │                        │     │
│  │     (keeps collected data)│  └────────────────────────┘     │
│  │                           │                                  │
│  │  🗑️  Data Deletion        │  ┌─ [Request Deletion] ─┐      │
│  │     Remove all your data  │  │                       │      │
│  │     (where legally        │  └───────────────────────┘      │
│  │     possible)             │                                  │
│  └───────────────────────────┘                                  │
│                                                                 │
│             ┌─ [Save Privacy Preferences] ─┐                   │
│             │                              │                   │
│             │ (Updates notification        │                   │
│             │  and contact preferences)    │                   │
│             └──────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

## Flow 4: Account Activity and Support

### Screen 7: Account Activity
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Profile                     Account Activity          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                          Account Activity                       │
│                                                                 │
│  ┌─── Login History ───┐               ┌─ [Export Activity] ─┐  │
│  │                      │               │                    │  │
│  │  🖥️  Today 3:30 PM   │ Chrome       │                    │  │
│  │     Current session  │ Desktop      └────────────────────┘  │
│  │     Location: Home   │ ✅ Trusted                          │
│  │                      │                                      │
│  │  📱 Yesterday 8:15 AM│ Safari                              │
│  │     Mobile login     │ iPhone                              │
│  │     Location: Home   │ ✅ Trusted                          │
│  │                      │                                      │
│  │  🖥️  Mar 6 7:45 PM   │ Chrome                              │
│  │     Desktop login    │ Desktop                             │
│  │     Location: Home   │ ✅ Trusted                          │
│  │                      │                                      │
│  │  📱 Mar 5 2:30 PM    │ Chrome                              │
│  │     Mobile login     │ Android                             │
│  │     Location: Work   │ ⚠️  New location                   │
│  │                      │                                      │
│  │  🔍 No suspicious    │                                      │
│  │     activity         │                                      │
│  │     detected         │                                      │
│  └──────────────────────┘                                      │
│                                                                 │
│  ┌─── Study Participation ───┐                                 │
│  │                            │                                 │
│  │  📊 Surveys Completed: 23  │  📈 Completion Rate: 89%       │
│  │  📸 Photos Uploaded: 15    │  📅 Days Active: 8 of 9        │
│  │  📝 Notes Added: 12        │  🏆 Consistency: Excellent     │
│  │                            │                                 │
│  │  📅 Recent Activity:       │                                 │
│  │  • Survey completed (Today)│                                 │
│  │  • Photo uploaded (Mar 7)  │                                 │
│  │  • Profile updated (Mar 6) │                                 │
│  │  • Password changed (Feb 28)│                                │
│  └────────────────────────────┘                                 │
│                                                                 │
│  ┌─── Security Events ───┐                                     │
│  │                        │                                     │
│  │  🔐 Recent Events:     │                                     │
│  │                        │                                     │
│  │  ✅ 2FA code used      │  Today 3:30 PM                     │
│  │     Login successful   │                                     │
│  │                        │                                     │
│  │  📧 Password reset     │  Feb 28 2:15 PM                    │
│  │     requested (you)    │                                     │
│  │                        │                                     │
│  │  🔔 New device login   │  Mar 5 2:30 PM                     │
│  │     notification sent  │                                     │
│  │                        │                                     │
│  │  ✅ Account verified   │  Mar 1 10:00 AM                    │
│  │     Initial setup      │                                     │
│  │                        │                                     │
│  │  🔍 No security        │                                     │
│  │     alerts active      │                                     │
│  └────────────────────────┘                                     │
│                                                                 │
│  ┌─── Data Usage ───┐                                          │
│  │                   │                                          │
│  │  💾 Storage Used  │  127 MB of 1 GB limit                  │
│  │     ██░░░░░░░░░░  │  13% used                               │
│  │                   │                                          │
│  │  📊 Data Types:   │                                          │
│  │  • Survey responses: 45 MB                                  │
│  │  • Photos: 78 MB                                            │
│  │  • Documents: 4 MB                                          │
│  │                   │                                          │
│  │  🔄 Last backup   │  Today 3:00 AM                         │
│  │     All data safe │  ✅ Successful                         │
│  └───────────────────┘                                          │
│                                                                 │
│  ❓ See something unusual? ┌─ [Report Security Issue] ─┐       │
│                            │                           │       │
│                            └───────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Screen 8: Help and Support
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Profile                        Help & Support         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                           Get Help & Support                    │
│                                                                 │
│  ┌─── Contact Your Study Team ───┐                             │
│  │                                │                             │
│  │  👨‍⚕️ Principal Investigator     │                             │
│  │     Dr. Sarah Smith, MD        │                             │
│  │     Cardiology Department      │                             │
│  │                                │                             │
│  │  📞 Phone: (555) 123-4567     │  ┌─ [Call Now] ─┐           │
│  │     Mon-Fri 9AM-5PM           │  │              │           │
│  │                                │  └──────────────┘           │
│  │  📧 Email: study@hospital.com │  ┌─ [Send Email] ─┐         │
│  │     Response within 24 hours   │  │               │         │
│  │                                │  └───────────────┘         │
│  │                                │                             │
│  │  🏥 Central Medical Center     │                             │
│  │     123 Healthcare Blvd        │                             │
│  │     Medical City, ST 12345     │                             │
│  └────────────────────────────────┘                             │
│                                                                 │
│  ┌─── Quick Help Options ───┐                                  │
│  │                           │                                  │
│  │  💬 Live Chat             │  ┌─ [Start Chat] ─┐             │
│  │     Available 9AM-5PM     │  │ Online now     │             │
│  │     Mon-Fri               │  └────────────────┘             │
│  │                           │                                  │
│  │  📞 Emergency Line        │  ┌─ [(555) 987-6543] ─┐        │
│  │     24/7 for urgent       │  │ Call emergency    │        │
│  │     study-related issues  │  └───────────────────┘        │
│  │                           │                                  │
│  │  🎫 Submit Support Ticket │  ┌─ [Create Ticket] ─┐         │
│  │     For non-urgent issues │  │                   │         │
│  │                           │  └───────────────────┘         │
│  └───────────────────────────┘                                  │
│                                                                 │
│  ┌─── Frequently Asked Questions ───┐                          │
│  │                                    │                          │
│  │  ❓ How do I change my password?  │  ┌─ [View Answer] ─┐     │
│  │                                    │  │               │     │
│  │  ❓ What if I miss a survey?      │  └───────────────┘     │
│  │                                    │                          │
│  │  ❓ Is my data really secure?     │  ┌─ [View Answer] ─┐     │
│  │                                    │  │               │     │
│  │  ❓ Can I withdraw from the study?│  └───────────────┘     │
│  │                                    │                          │
│  │  ❓ How long is the study?        │  ┌─ [View Answer] ─┐     │
│  │                                    │  │               │     │
│  │  ❓ Who can see my responses?     │  └───────────────┘     │
│  │                                    │                          │
│  │              ┌─ [View All FAQs] ─┐                          │
│  │              │                   │                          │
│  │              └───────────────────┘                          │
│  └────────────────────────────────────┘                          │
│                                                                 │
│  ┌─── Study Resources ───┐                                     │
│  │                        │                                     │
│  │  📋 Study Information  │  ┌─ [Download PDF] ─┐               │
│  │     Protocol details   │  │                 │               │
│  │                        │  └─────────────────┘               │
│  │                        │                                     │
│  │  📖 Participant Guide  │  ┌─ [View Online] ─┐               │
│  │     How-to instructions│  │                 │               │
│  │                        │  └─────────────────┘               │
│  │                        │                                     │
│  │  🔒 Privacy Notice     │  ┌─ [Read Details] ─┐              │
│  │     Data protection    │  │                  │              │
│  │                        │  └──────────────────┘              │
│  │                        │                                     │
│  │  📱 Mobile App Guide   │  ┌─ [Download] ─┐                 │
│  │     Setup instructions │  │             │                 │
│  │                        │  └─────────────┘                 │
│  └────────────────────────┘                                     │
│                                                                 │
│  🚨 Medical Emergency?                                          │
│  This platform is not for emergencies. Call 911 or go to      │
│  your nearest emergency room for immediate medical attention.   │
└─────────────────────────────────────────────────────────────────┘
```

## Mobile Responsive Adaptations

### Mobile Profile Dashboard (360px width)
```
┌─────────────────────────────────────┐
│ ← Dashboard            🔐 Secure    │
├─────────────────────────────────────┤
│                                     │
│ [👤] My Profile & Settings          │
│                                     │
│ ┌─ Account Information ─┐           │
│ │                       │           │
│ │ 👤 John Doe           │           │
│ │ 📧 john.doe@email.com │           │
│ │ 📅 Born: Jan 15, 1975 │           │
│ │ 📱 (555) 987-6543     │           │
│ │                       │           │
│ │ 🏥 Study: Heart Health│           │
│ │    ABC-2024-001       │           │
│ │ 👨‍⚕️ Dr. Sarah Smith   │           │
│ │                       │           │
│ │ ┌─────────────────────┐ │           │
│ │ │    Edit Profile     │ │           │
│ │ └─────────────────────┘ │           │
│ └───────────────────────┘           │
│                                     │
│ ┌─ Quick Actions ─┐                 │
│ │                 │                 │
│ │ 🔐 Security     │ ┌─ [Manage] ─┐  │
│ │ Password & 2FA  │ │           │  │
│ │                 │ └───────────┘  │
│ │                 │                 │
│ │ 🔔 Notifications│ ┌─ [Settings]─┐ │
│ │ Email reminders │ │            │ │
│ │                 │ └────────────┘ │
│ │                 │                 │
│ │ 🗂️ My Data      │ ┌─ [View] ─┐   │
│ │ Responses       │ │         │   │
│ │                 │ └─────────┘   │
│ │                 │                 │
│ │ 🔒 Privacy      │ ┌─ [Control]─┐  │
│ │ Data & consent  │ │          │  │
│ │                 │ └──────────┘  │
│ └─────────────────┘                 │
│                                     │
│ ┌─ Account Status ─┐                │
│ │                  │                │
│ │ ✅ Email verified│                │
│ │ ✅ 2FA enabled   │                │
│ │ ✅ Profile done  │                │
│ │ ✅ Consent current                │
│ │                  │                │
│ │ 🏆 Security: 85% │                │
│ │ ████████████░░░░ │                │
│ └──────────────────┘                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         Contact Support        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Accessibility Features Summary

### Screen Reader Support
- **Comprehensive labeling**: All interactive elements properly labeled
- **Status announcements**: Changes announced via live regions
- **Logical structure**: Proper heading hierarchy and navigation
- **Form associations**: Labels properly connected to inputs
- **Error handling**: Clear error messages with correction guidance

### Keyboard Navigation
- **Full keyboard access**: All functionality available via keyboard
- **Logical tab order**: Follows visual flow through interface
- **Keyboard shortcuts**: Quick access to common actions
- **Focus management**: Clear focus indicators and logical flow
- **Modal handling**: Proper focus trapping in dialogs

### Visual Accessibility
- **High contrast**: All elements meet WCAG contrast requirements
- **Scalable text**: Typography adapts to user font size preferences
- **Clear hierarchy**: Consistent visual structure and spacing
- **Color independence**: Information conveyed through multiple channels
- **Icon support**: Meaningful icons with text alternatives

### Cognitive Accessibility
- **Clear language**: Simple, medical-appropriate terminology
- **Consistent patterns**: Repeated interaction models throughout
- **Progress indication**: Clear status and completion feedback
- **Error prevention**: Validation and confirmation before critical actions
- **Help integration**: Contextual assistance always available

### Security and Trust
- **Transparent operations**: Clear communication about data handling
- **User control**: Granular privacy and notification preferences
- **Activity monitoring**: Detailed account activity tracking
- **Recovery options**: Multiple ways to regain account access
- **Professional support**: Direct connection to medical team

This comprehensive profile management system ensures patients can securely manage their account settings, understand their privacy rights, and maintain control over their participation in clinical trials while meeting all accessibility and security requirements.