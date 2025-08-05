# Patient Portal Onboarding Wireframes

## Overview
These wireframes demonstrate the complete onboarding flow for clinical trial participants, emphasizing accessibility, trust-building, and progressive disclosure of information.

## Flow 1: Initial Welcome and Invitation Validation

### Screen 1: Landing Page from Email Link
```
┌─────────────────────────────────────────────────────────────────┐
│ 🔒 Secure Connection  |  HIPAA Compliant  |  Medical Grade      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [🏥 Central Medical Center Logo]    Clinical Trial Platform    │
│                                                                 │
│         ┌─── Welcome to Your Health Study ───┐                 │
│         │                                     │                 │
│         │  You've been invited to participate │                 │
│         │  in an important medical research   │                 │
│         │  study by your healthcare team.     │                 │
│         │                                     │                 │
│         │  ┌─────────────────────────────────┐ │                 │
│         │  │ 👨‍⚕️ Dr. Sarah Smith           │ │                 │
│         │  │    Central Medical Center      │ │                 │
│         │  │    Cardiology Department       │ │                 │
│         │  │                                │ │                 │
│         │  │ 📋 Study: Heart Health         │ │                 │
│         │  │    Protocol: ABC-2024-001      │ │                 │
│         │  └─────────────────────────────────┘ │                 │
│         │                                     │                 │
│         │  🔐 Your data is secure and        │                 │
│         │     HIPAA compliant                │                 │
│         │                                     │                 │
│         │  ┌─ [Continue to Registration] ─┐   │                 │
│         │                                     │                 │
│         │  📞 Need help? Call (555) 123-4567  │                 │
│         └─────────────────────────────────────┘                 │
│                                                                 │
│  ✓ Invitation verified  ✓ Secure connection  ✓ Expires Mar 15  │
└─────────────────────────────────────────────────────────────────┘
```

### Screen 2: Privacy and Consent Overview
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Welcome                           Step 1 of 4         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              Before You Begin - Your Privacy Rights             │
│                                                                 │
│  ┌─── Important Information ───┐                               │
│  │                              │                               │
│  │  📋 Voluntary Participation  │                               │
│  │  You can stop at any time    │                               │
│  │  without affecting your care │                               │
│  │                              │                               │
│  │  🔒 Data Protection          │                               │
│  │  Your information is         │                               │
│  │  encrypted and private       │                               │
│  │                              │                               │
│  │  👥 Limited Access           │                               │
│  │  Only your medical team      │                               │
│  │  can see your responses      │                               │
│  │                              │                               │
│  │  🗑️ Your Control             │                               │
│  │  View, change, or delete     │                               │
│  │  your data at any time       │                               │
│  └──────────────────────────────┘                               │
│                                                                 │
│  ┌─ How long will this take? ─┐                                │
│  │                             │                                │
│  │  📝 Registration: 3 minutes │                                │
│  │  📊 First survey: 5 minutes │                                │
│  │  🔄 Daily check-ins: 2 min  │                                │
│  └─────────────────────────────┘                                │
│                                                                 │
│  ┌───────────────────┐  ┌─ [I Understand, Continue] ─┐        │
│  │ [Read Full        │  │                             │        │
│  │  Consent Document]│  │ (Large, primary button)    │        │
│  └───────────────────┘  └─────────────────────────────┘        │
│                                                                 │
│  💡 You can review this information again at any time          │
└─────────────────────────────────────────────────────────────────┘
```

## Flow 2: Account Creation

### Screen 3: Email Verification
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back                                      Step 2 of 4         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    Create Your Secure Account                   │
│                                                                 │
│  ┌───────── Email Verification ─────────┐                      │
│  │                                       │                      │
│  │  📧 Email Address                     │                      │
│  │  ┌─────────────────────────────────┐  │                      │
│  │  │ [_________________________] │  │                      │
│  │  └─────────────────────────────────┘  │                      │
│  │                                       │                      │
│  │  ℹ️ This must match the email your   │                      │
│  │     doctor used to invite you         │                      │
│  │                                       │                      │
│  │  ┌─ [Verify Email] ─┐                │                      │
│  │                                       │                      │
│  │  Status: ⏳ Checking invitation...    │                      │
│  └───────────────────────────────────────┘                      │
│                                                                 │
│  ┌─── Security Information ───┐                                │
│  │                             │                                │
│  │  Why we verify your email:  │                                │
│  │                             │                                │
│  │  ✓ Confirms your identity   │                                │
│  │  ✓ Matches doctor's records │                                │
│  │  ✓ Secures your account     │                                │
│  │  ✓ Enables secure login     │                                │
│  └─────────────────────────────┘                                │
│                                                                 │
│  📞 Wrong email? Contact your study coordinator: (555) 123-4567 │
└─────────────────────────────────────────────────────────────────┘
```

### Screen 4: Password Creation with Strength Indicator
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back                                      Step 2 of 4         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      Create a Strong Password                   │
│                                                                 │
│  ┌───────── Password Requirements ─────────┐                   │
│  │                                         │                   │
│  │  🔐 Create Password                     │                   │
│  │  ┌─────────────────────────────────────┐ │                   │
│  │  │ [___________________________] │ │                   │
│  │  └─────────────────────────────────────┘ │                   │
│  │                                         │                   │
│  │  🔐 Confirm Password                    │                   │
│  │  ┌─────────────────────────────────────┐ │                   │
│  │  │ [___________________________] │ │                   │
│  │  └─────────────────────────────────────┘ │                   │
│  │                                         │                   │
│  │  Password Strength: ████████░░ Strong   │                   │
│  │                                         │                   │
│  │  Requirements:                          │                   │
│  │  ✅ At least 8 characters              │                   │
│  │  ✅ One uppercase letter               │                   │
│  │  ✅ One lowercase letter               │                   │
│  │  ✅ One number                         │                   │
│  │  ⏳ One special character              │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                 │
│  ┌─── Password Tips ───┐                                       │
│  │                     │                                       │
│  │  💡 Create a strong │                                       │
│  │     password by:    │                                       │
│  │                     │                                       │
│  │  • Using a phrase   │                                       │
│  │  • Adding numbers   │                                       │
│  │  • Including !@#$   │                                       │
│  │                     │                                       │
│  │  Example:           │                                       │
│  │  MyHeart2024!       │                                       │
│  └─────────────────────┘                                       │
│                                                                 │
│             ┌─ [Create Account] ─┐                             │
│             │ (Disabled until   │                             │
│             │  requirements met) │                             │
│             └───────────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

## Flow 3: Two-Factor Authentication Setup

### Screen 5: 2FA Method Selection
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back                                      Step 3 of 4         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                Set Up Two-Factor Authentication                 │
│                                                                 │
│  🔐 Add an extra layer of security to protect your health data  │
│                                                                 │
│  ┌────────────── Choose Your Method ──────────────┐            │
│  │                                                 │            │
│  │  ┌─── Email Verification ───┐ (Recommended)     │            │
│  │  │ 📧                       │                   │            │
│  │  │ Simple and easy to use   │  ○ Select         │            │
│  │  │                          │                   │            │
│  │  │ ✓ Works on any device    │                   │            │
│  │  │ ✓ No app needed          │                   │            │
│  │  │ ✓ Get codes via email    │                   │            │
│  │  └──────────────────────────┘                   │            │
│  │                                                 │            │
│  │  ┌─── Authenticator App ───┐ (More Secure)      │            │
│  │  │ 📱                      │                    │            │
│  │  │ Higher security level   │   ○ Select         │            │
│  │  │                         │                    │            │
│  │  │ ✓ Works offline         │                    │            │
│  │  │ ✓ Very secure           │                    │            │
│  │  │ ✓ Quick code generation │                    │            │
│  │  └─────────────────────────┘                    │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                 │
│  ┌─── Need Help Choosing? ───┐                                 │
│  │                            │                                 │
│  │  New to 2FA? ➜ Email      │  ┌─ [Continue] ─┐              │
│  │  Tech savvy? ➜ App        │  │               │              │
│  │                            │  │ (Enabled     │              │
│  │  Both methods are secure   │  │  when option │              │
│  │  and HIPAA compliant       │  │  selected)   │              │
│  └────────────────────────────┘  └───────────────┘              │
│                                                                 │
│  ❓ Questions? Live chat available or call (555) 123-4567      │
└─────────────────────────────────────────────────────────────────┘
```

### Screen 6: Email 2FA Setup
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to method selection              Step 3 of 4             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                     Email Verification Setup                    │
│                                                                 │
│  ┌────────── Setup Process ──────────┐                         │
│  │                                   │                         │
│  │  📧 We'll send verification       │                         │
│  │     codes to:                     │                         │
│  │                                   │                         │
│  │     john.doe@email.com            │                         │
│  │                                   │                         │
│  │  ┌─ [Send Test Code] ─┐           │                         │
│  │                                   │                         │
│  │  Status: 📤 Code sent!            │                         │
│  │                                   │                         │
│  │  ✅ Code expires in 10 minutes    │                         │
│  │  ✅ New codes sent for each login │                         │
│  └───────────────────────────────────┘                         │
│                                                                 │
│  ┌────────── Enter Test Code ──────────┐                       │
│  │                                      │                       │
│  │  📨 Check your email and enter      │                       │
│  │     the 6-digit code:               │                       │
│  │                                      │                       │
│  │  ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐           │                       │
│  │  │ │ │ │ │ │ │ │ │ │ │ │ Code      │                       │
│  │  └─┘ └─┘ └─┘ └─┘ └─┘ └─┘           │                       │
│  │                                      │                       │
│  │  ┌─ [Verify Code] ─┐                │                       │
│  │                                      │                       │
│  │  Didn't get it? ┌─ [Resend] ─┐      │                       │
│  └──────────────────────────────────────┘                       │
│                                                                 │
│  ┌─── What happens next? ───┐                                  │
│  │                           │                                  │
│  │  🔐 Each time you log in: │                                  │
│  │                           │                                  │
│  │  1. Enter email/password  │                                  │
│  │  2. Check your email      │                                  │
│  │  3. Enter the code        │                                  │
│  │  4. Access your account   │                                  │
│  └───────────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Flow 4: Profile Setup and Completion

### Screen 7: Basic Profile Information
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back                                      Step 4 of 4         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      Complete Your Profile                      │
│                                                                 │
│  ┌────────── Basic Information (Required) ──────────┐          │
│  │                                                   │          │
│  │  👤 First Name *                                  │          │
│  │  ┌───────────────────────────────────────────────┐ │          │
│  │  │ [_________________________________] │ │          │
│  │  └───────────────────────────────────────────────┘ │          │
│  │                                                   │          │
│  │  👤 Last Name *                                   │          │
│  │  ┌───────────────────────────────────────────────┐ │          │
│  │  │ [_________________________________] │ │          │
│  │  └───────────────────────────────────────────────┘ │          │
│  │                                                   │          │
│  │  📅 Date of Birth *                               │          │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │          │
│  │  │ Month ▼  │ │ Day ▼    │ │ Year ▼   │           │          │
│  │  └──────────┘ └──────────┘ └──────────┘           │          │
│  │                                                   │          │
│  │  📱 Phone Number *                                │          │
│  │  ┌───────────────────────────────────────────────┐ │          │
│  │  │ [_________________________________] │ │          │
│  │  └───────────────────────────────────────────────┘ │          │
│  └───────────────────────────────────────────────────┘          │
│                                                                 │
│  ┌────── Optional Information (Helps with research) ──────┐     │
│  │                                                         │     │
│  │  🏠 Preferred Language                                  │     │
│  │  ┌─────────────────────┐                               │     │
│  │  │ English ▼           │                               │     │
│  │  └─────────────────────┘                               │     │
│  │                                                         │     │
│  │  ⏰ Best time to contact you                            │     │
│  │  ☐ Morning    ☐ Afternoon    ☐ Evening                │     │
│  │                                                         │     │
│  │  📞 Contact preferences                                 │     │
│  │  ☐ Email      ☐ Phone        ☐ Text message           │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                 │
│  🔒 This information is encrypted and only shared with your     │
│     medical team as needed for the research study.             │
│                                                                 │
│                    ┌─ [Complete Setup] ─┐                      │
│                    │                    │                      │
│                    │ (Large button)     │                      │
│                    └────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

### Screen 8: Welcome and Next Steps
```
┌─────────────────────────────────────────────────────────────────┐
│                          🎉 Welcome!                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              Your account has been created successfully         │
│                                                                 │
│  ┌─────────── Account Summary ───────────┐                     │
│  │                                        │                     │
│  │  ✅ Email verified                     │                     │
│  │  ✅ Secure password created            │                     │
│  │  ✅ Two-factor authentication enabled  │                     │
│  │  ✅ Profile completed                  │                     │
│  │                                        │                     │
│  │  🔐 Your account is fully secured      │                     │
│  └────────────────────────────────────────┘                     │
│                                                                 │
│  ┌─────────── What's Next? ─────────────┐                      │
│  │                                       │                      │
│  │  📋 Complete your first questionnaire │                      │
│  │     Time needed: About 5 minutes      │                      │
│  │                                       │                      │
│  │  📱 Download our mobile app (optional)│                      │
│  │     Get reminders and quick access    │                      │
│  │                                       │                      │
│  │  📞 Contact information saved         │                      │
│  │     Study coordinator: Dr. Smith      │                      │
│  │     Phone: (555) 123-4567            │                      │
│  └───────────────────────────────────────┘                      │
│                                                                 │
│  ┌─────────── Quick Tips ─────────────┐                        │
│  │                                     │                        │
│  │  💡 Bookmark this page for easy    │                        │
│  │     access to your study dashboard │                        │
│  │                                     │                        │
│  │  📧 Check your email for study     │                        │
│  │     updates and reminders          │                        │
│  │                                     │                        │
│  │  🔒 Always log out when using      │                        │
│  │     shared or public computers      │                        │
│  └─────────────────────────────────────┘                        │
│                                                                 │
│        ┌─ [Start First Questionnaire] ─┐                       │
│        │                               │                       │
│        │ (Large, prominent button)     │                       │
│        └───────────────────────────────┘                       │
│                                                                 │
│              ┌─ [Go to Dashboard] ─┐                           │
│              │                     │                           │
│              │ (Secondary option)  │                           │
│              └─────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

## Mobile Responsive Adaptations

### Mobile Screen Example (360px width)
```
┌─────────────────────────────────────┐
│ 🔒 Secure  HIPAA  Medical Grade    │
├─────────────────────────────────────┤
│                                     │
│ [🏥 Logo] Clinical Trial           │
│                                     │
│ ┌─ Welcome to Your Health Study ─┐ │
│ │                                │ │
│ │ You've been invited to         │ │
│ │ participate in medical         │ │
│ │ research by your healthcare    │ │
│ │ team.                          │ │
│ │                                │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ 👨‍⚕️ Dr. Sarah Smith        │ │ │
│ │ │    Central Medical Center   │ │ │
│ │ │                             │ │ │
│ │ │ 📋 Study: Heart Health      │ │ │
│ │ │    Protocol: ABC-2024-001   │ │ │
│ │ └─────────────────────────────┘ │ │
│ │                                │ │
│ │ 🔐 Your data is secure and     │ │
│ │    HIPAA compliant             │ │
│ │                                │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │    Continue to Registration │ │ │
│ │ │      (Full width button)    │ │ │
│ │ └─────────────────────────────┘ │ │
│ │                                │ │
│ │ 📞 Need help?                  │ │
│ │    Call (555) 123-4567         │ │
│ └────────────────────────────────┘ │
│                                     │
│ ✓ Verified  ✓ Secure  ✓ Expires    │
│   invitation  connection  Mar 15    │
└─────────────────────────────────────┘
```

## Accessibility Features Highlighted

### Screen Reader Enhancements
- **Progressive Navigation**: Clear step indicators with aria-current
- **Status Announcements**: Live regions for dynamic content updates
- **Descriptive Labels**: Comprehensive aria-labels and descriptions
- **Logical Heading Structure**: Proper h1-h6 hierarchy
- **Error Association**: aria-describedby linking errors to fields

### Keyboard Navigation
- **Tab Order**: Logical flow following visual presentation
- **Skip Links**: Quick navigation to main content
- **Focus Indicators**: Visible 2px minimum focus rings
- **Escape Functionality**: Modal dismissal and safe states

### Visual Accessibility
- **High Contrast**: All elements meet 4.5:1 minimum ratio
- **Large Touch Targets**: 44px minimum for all interactive elements
- **Dynamic Type Support**: Scalable typography system
- **Color Independence**: Icons and text accompany color coding
- **Clear Visual Hierarchy**: Consistent spacing and typography scales

### Motor Accessibility
- **Large Interactive Areas**: Generous click/touch targets
- **Adequate Spacing**: 8px minimum between interactive elements
- **Error Prevention**: Real-time validation with clear feedback
- **Multiple Input Methods**: Voice input compatible form fields

### Cognitive Accessibility
- **Progressive Disclosure**: One concept per screen
- **Clear Instructions**: Simple language with examples
- **Memory Support**: Auto-save with visible confirmation
- **Consistent Patterns**: Repeated interaction models
- **Help Integration**: Contextual assistance throughout

This comprehensive onboarding flow ensures all patients can successfully create accounts and begin participating in clinical trials, regardless of their technical abilities or accessibility needs.