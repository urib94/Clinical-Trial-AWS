# Patient Portal Questionnaire Flow Wireframes

## Overview
These wireframes demonstrate the step-by-step questionnaire interface designed for accessibility, cognitive ease, and medical data accuracy. Each screen focuses on a single task to reduce cognitive load while maintaining progress context.

## Flow 1: Dashboard and Questionnaire Selection

### Screen 1: Patient Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│ Welcome, John    |  🔐 Secure Session  |  📱 Download App     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [🏥 Central Medical Center Logo]     My Study Dashboard        │
│                                                                 │
│  ┌─── Today's Tasks ───┐                                       │
│  │                     │                                       │
│  │  📋 Daily Check-in  │  ⏰ Due today                         │
│  │     Quick questions │                                       │
│  │     about how you   │  ┌─ [Start Now] ─┐                   │
│  │     are feeling     │  │ ~2 minutes    │                   │
│  │                     │  └───────────────┘                   │
│  └─────────────────────┘                                       │
│                                                                 │
│  ┌─── Upcoming ───┐                                            │
│  │                │                                            │
│  │  📊 Weekly     │  📅 Due March 8                           │
│  │     Assessment │                                            │
│  │     Detailed   │  ┌─ [Preview] ─┐                          │
│  │     health     │  │ ~5 minutes  │                          │
│  │     review     │  └─────────────┘                          │
│  └────────────────┘                                            │
│                                                                 │
│  ┌─── Completed ───┐                                           │
│  │                 │                                           │
│  │  ✅ Welcome     │  📅 Completed March 1                    │
│  │     Survey      │                                           │
│  │                 │  ┌─ [View Responses] ─┐                  │
│  │  ✅ Baseline    │  │                    │                  │
│  │     Assessment  │  └────────────────── ─┘                  │
│  └─────────────────┘                                           │
│                                                                 │
│  ┌─── Study Progress ───┐                                      │
│  │                       │                                      │
│  │  Week 2 of 12        │  ████████░░░░░░░░░░ 33%             │
│  │                       │                                      │
│  │  📈 Participation:    │  ████████████████░░ 89%             │
│  │      Great job!       │                                      │
│  └───────────────────────┘                                      │
│                                                                 │
│  ┌─── Need Help? ───┐     ┌─── Study Info ───┐                 │
│  │                  │     │                   │                 │
│  │  💬 Chat with    │     │  👨‍⚕️ Dr. Smith   │                 │
│  │     coordinator  │     │     (555) 123-4567│                 │
│  │                  │     │                   │                 │
│  │  📞 Call support │     │  📋 Study ABC-2024│                 │
│  │                  │     │     Heart Health  │                 │
│  └──────────────────┘     └───────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### Screen 2: Questionnaire Start Screen
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                        🔐 Auto-saving      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         Daily Health Check-in                   │
│                                                                 │
│  ┌─── About This Survey ───┐                                   │
│  │                          │                                   │
│  │  📋 8 quick questions    │                                   │
│  │  ⏱️  About 2 minutes     │                                   │
│  │  💾 Auto-saves progress  │                                   │
│  │  🔒 Secure & private     │                                   │
│  │                          │                                   │
│  │  We'll ask about:        │                                   │
│  │  • How you're feeling    │                                   │
│  │  • Sleep quality         │                                   │
│  │  • Energy levels         │                                   │
│  │  • Any symptoms          │                                   │
│  └──────────────────────────┘                                   │
│                                                                 │
│  ┌─── Important Reminders ───┐                                 │
│  │                            │                                 │
│  │  ✓ Answer honestly        │                                 │
│  │  ✓ No right or wrong      │                                 │
│  │    answers                 │                                 │
│  │  ✓ You can skip questions │                                 │
│  │  ✓ Take your time         │                                 │
│  │                            │                                 │
│  │  💡 Your responses help    │                                 │
│  │     improve treatments     │                                 │
│  │     for future patients    │                                 │
│  └────────────────────────────┘                                 │
│                                                                 │
│  ┌─── Privacy Reminder ───┐                                    │
│  │                         │                                    │
│  │  🔒 Only your medical   │                                    │
│  │     team can see your   │                                    │
│  │     individual answers  │                                    │
│  │                         │                                    │
│  │  📊 Research uses       │                                    │
│  │     combined data that  │                                    │
│  │     cannot identify you │                                    │
│  └─────────────────────────┘                                    │
│                                                                 │
│                  ┌─ [Begin Survey] ─┐                          │
│                  │                  │                          │
│                  │ (Large button)   │                          │
│                  └──────────────────┘                          │
│                                                                 │
│                    ┌─ [Save for Later] ─┐                      │
│                    │                     │                      │
│                    │ (Secondary option)  │                      │
│                    └─────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

## Flow 2: Individual Question Screens

### Screen 3: Single Question - Scale Rating
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Previous Question                    Question 1 of 8          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ●○○○○○○○                                          ⏱️ ~2 min left │
│  Progress: 1 of 8 questions                                     │
│                                                                 │
│                 How is your energy level today?                 │
│                                                                 │
│  ┌─── Choose the option that best describes you ───┐           │
│  │                                                 │           │
│  │   😴                                            │           │
│  │   ┌─ Very Low ─┐                                │           │
│  │   │ Extremely  │  ○ Select this option         │           │
│  │   │ tired, hard│                                │           │
│  │   │ to get     │                                │           │
│  │   │ started    │                                │           │
│  │   └────────────┘                                │           │
│  │                                                 │           │
│  │   😔                                            │           │
│  │   ┌─ Low ─┐                                     │           │
│  │   │ Tired, │       ○ Select this option        │           │
│  │   │ but can│                                    │           │
│  │   │ do basic                                    │           │
│  │   │ activities                                  │           │
│  │   └────────┘                                    │           │
│  │                                                 │           │
│  │   😊                                            │           │
│  │   ┌─ Normal ─┐                                  │           │
│  │   │ Usual    │     ● Selected                  │           │
│  │   │ energy   │                                 │           │
│  │   │ for      │                                 │           │
│  │   │ morning  │                                 │           │
│  │   └──────────┘                                 │           │
│  │                                                │           │
│  │   😊                                           │           │
│  │   ┌─ Good ─┐                                   │           │
│  │   │ More   │      ○ Select this option        │           │
│  │   │ energy │                                   │           │
│  │   │ than   │                                   │           │
│  │   │ usual  │                                   │           │
│  │   └────────┘                                   │           │
│  │                                                │           │
│  │   😁                                           │           │
│  │   ┌─ Very Good ─┐                              │           │
│  │   │ Full of    │   ○ Select this option       │           │
│  │   │ energy,    │                               │           │
│  │   │ feel great │                               │           │
│  │   └────────────┘                               │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  ❓ Need help with this question?  ┌─ [Show Help] ─┐           │
│                                    │               │           │
│                                    └───────────────┘           │
│                                                                 │
│  💾 Your answer is automatically saved                         │
│                                                                 │
│             ┌─ [Next Question] ─┐                              │
│             │                  │                              │
│             │ (Large button)   │                              │
│             └──────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### Screen 4: Question with Help Panel Expanded
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Previous Question                    Question 2 of 8          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ●●○○○○○○                                        ⏱️ ~1.5 min left │
│  Progress: 2 of 8 questions                                     │
│                                                                 │
│           Rate your pain level right now (0-10)                │
│                                                                 │
│  ┌─── Use the slider to select your pain level ───┐            │
│  │                                                 │            │
│  │   No pain                            Worst pain │            │
│  │      0 ━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━ 10        │            │
│  │                   5                             │            │
│  │                                                 │            │
│  │   Current level: 5 (Moderate pain)             │            │
│  │                                                 │            │
│  │   ┌─ [Set to 5] ─┐                              │            │
│  │   │              │                              │            │
│  │   │ (Confirms    │                              │            │
│  │   │  selection)  │                              │            │
│  │   └──────────────┘                              │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                 │
│  ┌─── Help: Understanding Pain Levels ───┐                     │
│  │                                         │                     │
│  │  How to rate your pain:                │                     │
│  │                                         │                     │
│  │  0-2:  Mild pain, doesn't interfere    │                     │
│  │        with daily activities           │                     │
│  │                                         │                     │
│  │  3-5:  Moderate pain, some difficulty  │                     │
│  │        with normal activities          │                     │
│  │                                         │                     │
│  │  6-8:  Severe pain, interferes with    │                     │
│  │        most activities                 │                     │
│  │                                         │                     │
│  │  9-10: Extreme pain, unable to do      │                     │
│  │        normal activities               │                     │
│  │                                         │                     │
│  │  💡 Think about right now, not         │                     │
│  │     your worst or best moments         │                     │
│  │                                         │                     │
│  │  ┌─ [Hide Help] ─┐                      │                     │
│  │  │              │                       │                     │
│  │  └──────────────┘                       │                     │
│  └─────────────────────────────────────────┘                     │
│                                                                 │
│  💾 Pain level 5 saved automatically                           │
│                                                                 │
│             ┌─ [Next Question] ─┐                              │
│             │                  │                              │
│             │ (Enabled when    │                              │
│             │  selection made) │                              │
│             └──────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### Screen 5: Yes/No Question with Follow-up
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Previous Question                    Question 3 of 8          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ●●●○○○○○                                      ⏱️ ~1 min left   │
│  Progress: 3 of 8 questions                                     │
│                                                                 │
│              Did you take your medication today?                │
│                                                                 │
│  ┌─── Choose one ───┐                                          │
│  │                  │                                          │
│  │  ✅              │                                          │
│  │  ┌─ Yes ─┐       │  ● Selected                             │
│  │  │ I took │      │                                          │
│  │  │ my     │      │                                          │
│  │  │ medication    │                                          │
│  │  │ as     │      │                                          │
│  │  │ prescribed    │                                          │
│  │  └────────┘      │                                          │
│  │                  │                                          │
│  │  ❌              │                                          │
│  │  ┌─ No ─┐        │  ○ Select this option                   │
│  │  │ I did │       │                                          │
│  │  │ not   │       │                                          │
│  │  │ take my       │                                          │
│  │  │ medication    │                                          │
│  │  │ today │       │                                          │
│  │  └───────┘       │                                          │
│  │                  │                                          │
│  │  ❓              │                                          │
│  │  ┌─ Not Sure ─┐  │  ○ Select this option                   │
│  │  │ I can't   │  │                                          │
│  │  │ remember  │  │                                          │
│  │  │ if I took │  │                                          │
│  │  │ it today  │  │                                          │
│  │  └───────────┘  │                                          │
│  └──────────────────┘                                          │
│                                                                 │
│  ✅ Since you selected "Yes", this question is complete         │
│                                                                 │
│  ┌─── About Your Medication ───┐                               │
│  │                              │                               │
│  │  💊 Prescribed medication:   │                               │
│  │     Lisinopril 10mg          │                               │
│  │     Once daily in morning    │                               │
│  │                              │                               │
│  │  📅 Next refill due:         │                               │
│  │     March 15, 2024           │                               │
│  │                              │                               │
│  │  ❗ Questions about your     │                               │
│  │     medication? Contact      │                               │
│  │     Dr. Smith: (555) 123-4567│                               │
│  └──────────────────────────────┘                               │
│                                                                 │
│  💾 Response saved: "Yes, took medication"                     │
│                                                                 │
│             ┌─ [Next Question] ─┐                              │
│             │                  │                              │
│             │ (Large button)   │                              │
│             └──────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### Screen 6: Text Input Question
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Previous Question                    Question 4 of 8          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ●●●●○○○○                                      ⏱️ ~45 sec left  │
│  Progress: 4 of 8 questions                                     │
│                                                                 │
│        Tell us about any symptoms you're experiencing           │
│                                                                 │
│  ┌─── Describe your symptoms (optional) ───┐                   │
│  │                                          │                   │
│  │  📝 In your own words, describe any     │                   │
│  │     symptoms or changes you've noticed  │                   │
│  │                                          │                   │
│  │  ┌────────────────────────────────────┐  │                   │
│  │  │ I've been feeling a bit dizzy     │  │                   │
│  │  │ when I stand up, especially in    │  │                   │
│  │  │ the morning. It lasts for about   │  │                   │
│  │  │ 10 seconds then goes away.        │  │                   │
│  │  │                                   │  │                   │
│  │  │                                   │  │                   │
│  │  │                                   │  │                   │
│  │  │                                   │  │                   │
│  │  └────────────────────────────────────┘  │                   │
│  │                                          │                   │
│  │  💡 Helpful details to include:          │                   │
│  │  • When symptoms occur                   │                   │
│  │  • How long they last                    │                   │
│  │  • What makes them better/worse          │                   │
│  │  • How severe they are                   │                   │
│  │                                          │                   │
│  │  🎤 You can use voice input to speak    │                   │
│  │     your response instead of typing     │                   │
│  └──────────────────────────────────────────┘                   │
│                                                                 │
│  ┌─── Privacy Note ───┐                                        │
│  │                     │                                        │
│  │  🔒 Your symptoms   │                                        │
│  │     description     │                                        │
│  │     is encrypted    │                                        │
│  │     and only        │                                        │
│  │     visible to      │                                        │
│  │     your medical    │                                        │
│  │     team           │                                        │
│  └─────────────────────┘                                        │
│                                                                 │
│  💾 Auto-saved as you type                                     │
│                                                                 │
│  ┌─ [Skip This Question] ─┐        ┌─ [Next Question] ─┐       │
│  │                        │        │                  │       │
│  │ (Secondary option)     │        │ (Primary action) │       │
│  └────────────────────────┘        └──────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## Flow 3: Media Upload and Complex Questions

### Screen 7: Photo Upload Question
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Previous Question                    Question 5 of 8          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ●●●●●○○○                                     ⏱️ ~30 sec left   │
│  Progress: 5 of 8 questions                                     │
│                                                                 │
│              Upload a photo of your daily medication            │
│                                                                 │
│  ┌─── Photo Upload ───┐                                        │
│  │                    │                                        │
│  │    📸              │                                        │
│  │  ┌─────────────┐   │                                        │
│  │  │             │   │  📱 Take Photo                         │
│  │  │   Tap here  │   │  📁 Choose from Photos                 │
│  │  │   to add    │   │                                        │
│  │  │   photo     │   │  or drag and drop                      │
│  │  │             │   │                                        │
│  │  └─────────────┘   │                                        │
│  │                    │                                        │
│  │  ✅ Accepted:      │                                        │
│  │     JPG, PNG, HEIC │                                        │
│  │  ✅ Max size: 10MB │                                        │
│  │  ✅ Auto virus     │                                        │
│  │     scan           │                                        │
│  └────────────────────┘                                        │
│                                                                 │
│  ┌─── Photo Guidelines ───┐                                    │
│  │                         │                                    │
│  │  📸 Good photo tips:    │                                    │
│  │                         │                                    │
│  │  ✓ Clear lighting      │                                    │
│  │  ✓ All pills visible   │                                    │
│  │  ✓ Labels readable     │                                    │
│  │  ✓ Steady, focused     │                                    │
│  │                         │                                    │
│  │  💡 This helps your    │                                    │
│  │     doctor verify      │                                    │
│  │     you're taking      │                                    │
│  │     the right          │                                    │
│  │     medication         │                                    │
│  └─────────────────────────┘                                    │
│                                                                 │
│  ┌─── Privacy & Security ───┐                                  │
│  │                           │                                  │
│  │  🔒 Photo is encrypted    │                                  │
│  │     during upload         │                                  │
│  │  🏥 Only medical team     │                                  │
│  │     can access            │                                  │
│  │  🗑️  Auto-deleted after  │                                  │
│  │     study completion      │                                  │
│  └───────────────────────────┘                                  │
│                                                                 │
│  ┌─ [Skip This Question] ─┐        ┌─ [Next Question] ─┐       │
│  │                        │        │                  │       │
│  │ (Secondary option)     │        │ (Disabled until  │       │
│  │                        │        │  photo uploaded) │       │
│  └────────────────────────┘        └──────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Screen 8: Photo Upload - Success State
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Previous Question                    Question 5 of 8          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ●●●●●○○○                                     ⏱️ ~15 sec left   │
│  Progress: 5 of 8 questions                                     │
│                                                                 │
│              Upload a photo of your daily medication            │
│                                                                 │
│  ┌─── Photo Uploaded Successfully ───┐                         │
│  │                                    │                         │
│  │    ✅ Upload Complete              │                         │
│  │  ┌─────────────────────────────┐   │                         │
│  │  │ [📸 Thumbnail of uploaded  │   │                         │
│  │  │      medication photo]     │   │                         │
│  │  │                            │   │                         │
│  │  │  medication_photo.jpg      │   │                         │
│  │  │  2.3 MB • Uploaded 3:42 PM │   │                         │
│  │  └─────────────────────────────┘   │                         │
│  │                                    │                         │
│  │  ✅ Virus scan: Clean             │                         │
│  │  ✅ Quality check: Good           │                         │
│  │  ✅ Encrypted and secure          │                         │
│  │                                    │                         │
│  │  ┌─ [Replace Photo] ─┐             │                         │
│  │  │                   │             │                         │
│  │  └───────────────────┘             │                         │
│  └────────────────────────────────────┘                         │
│                                                                 │
│  ┌─── Upload Details ───┐                                      │
│  │                       │                                      │
│  │  📊 File processed:   │                                      │
│  │     ████████████ 100% │                                      │
│  │                       │                                      │
│  │  🔍 Analysis:         │                                      │
│  │     • Labels detected │                                      │
│  │     • Pills counted   │                                      │
│  │     • Quality good    │                                      │
│  │                       │                                      │
│  │  💾 Backup created    │                                      │
│  │     in secure storage │                                      │
│  └───────────────────────┘                                      │
│                                                                 │
│  ┌─── Thank You ───┐                                           │
│  │                  │                                           │
│  │  🎉 Great job!   │                                           │
│  │     Your photo   │                                           │
│  │     will help    │                                           │
│  │     your doctor  │                                           │
│  │     track your   │                                           │
│  │     medication   │                                           │
│  │     adherence    │                                           │
│  └──────────────────┘                                           │
│                                                                 │
│  💾 Photo and response saved securely                          │
│                                                                 │
│             ┌─ [Next Question] ─┐                              │
│             │                  │                              │
│             │ (Large button,   │                              │
│             │  now enabled)    │                              │
│             └──────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

## Flow 4: Review and Submission

### Screen 9: Final Review Screen
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Edit Responses                          Final Review          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ●●●●●●●●                                                      │
│  All questions completed! Please review your responses         │
│                                                                 │
│  ┌─── Your Responses ───┐                                      │
│  │                       │                                      │
│  │  1. Energy level      │  😊 Normal                ┌─[Edit]─┐│
│  │                       │     Usual energy for      │        ││
│  │                       │     morning time          └────────┘│
│  │                       │                                      │
│  │  2. Pain level        │  5/10 (Moderate pain)    ┌─[Edit]─┐│
│  │                       │                           │        ││
│  │                       │                           └────────┘│
│  │                       │                                      │
│  │  3. Medication        │  ✅ Yes, took medication ┌─[Edit]─┐│
│  │                       │     as prescribed         │        ││
│  │                       │                           └────────┘│
│  │                       │                                      │
│  │  4. Symptoms          │  "I've been feeling a    ┌─[Edit]─┐│
│  │                       │   bit dizzy when I       │        ││
│  │                       │   stand up..."           └────────┘│
│  │                       │                                      │
│  │  5. Medication photo  │  📸 Photo uploaded       ┌─[Edit]─┐│
│  │                       │     (medication_photo.jpg)│        ││
│  │                       │                           └────────┘│
│  │                       │                                      │
│  │  6. Sleep quality     │  😴 Poor (3/10)          ┌─[Edit]─┐│
│  │                       │     Woke up several      │        ││
│  │                       │     times                └────────┘│
│  │                       │                                      │
│  │  7. Mood              │  😐 Neutral              ┌─[Edit]─┐│
│  │                       │     Neither good nor bad │        ││
│  │                       │                           └────────┘│
│  │                       │                                      │
│  │  8. Additional notes  │  No additional comments  ┌─[Edit]─┐│
│  │                       │  (Optional - skipped)    │        ││
│  │                       │                           └────────┘│
│  └───────────────────────┘                                      │
│                                                                 │
│  ✅ All required questions answered                             │
│  📝 7 of 8 questions completed (1 optional skipped)            │
│                                                                 │
│  ┌─── Before You Submit ───┐                                   │
│  │                          │                                   │
│  │  • Responses will be     │                                   │
│  │    sent to your medical  │                                   │
│  │    team                  │                                   │
│  │                          │                                   │
│  │  • You can change        │                                   │
│  │    answers by clicking   │                                   │
│  │    Edit buttons above    │                                   │
│  │                          │                                   │
│  │  • After submitting,     │                                   │
│  │    you'll receive a      │                                   │
│  │    confirmation          │                                   │
│  └──────────────────────────┘                                   │
│                                                                 │
│  ┌─ [Save as Draft] ─┐              ┌─ [Submit Responses] ─┐   │
│  │                   │              │                      │   │
│  │ (Continue later)  │              │ (Large, primary)     │   │
│  └───────────────────┘              └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Screen 10: Submission Confirmation
```
┌─────────────────────────────────────────────────────────────────┐
│                         🎉 Thank You!                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              Your responses have been submitted successfully     │
│                                                                 │
│  ┌─── Submission Details ───┐                                  │
│  │                           │                                  │
│  │  ✅ Submitted: March 5    │                                  │
│  │     at 3:45 PM           │                                  │
│  │                           │                                  │
│  │  ✅ Responses: 7 of 8     │                                  │
│  │     questions answered    │                                  │
│  │                           │                                  │
│  │  ✅ Data encrypted and    │                                  │
│  │     sent securely         │                                  │
│  │                           │                                  │
│  │  📧 Confirmation sent     │                                  │
│  │     to your email         │                                  │
│  │                           │                                  │
│  │  🔒 Reference ID:         │                                  │
│  │     DH-2024-0305-001      │                                  │
│  └───────────────────────────┘                                  │
│                                                                 │
│  ┌─── What Happens Next ───┐                                   │
│  │                          │                                   │
│  │  👨‍⚕️ Dr. Smith will       │                                   │
│  │     review your          │                                   │
│  │     responses            │                                   │
│  │                          │                                   │
│  │  📊 Your data helps      │                                   │
│  │     improve treatments   │                                   │
│  │     for future patients  │                                   │
│  │                          │                                   │
│  │  📅 Next check-in:       │                                   │
│  │     Tomorrow at 8:00 AM  │                                   │
│  │     (2-minute survey)    │                                   │
│  │                          │                                   │
│  │  📧 Reminder email will  │                                   │
│  │     be sent tomorrow     │                                   │
│  │     morning              │                                   │
│  └──────────────────────────┘                                   │
│                                                                 │
│  ┌─── Study Progress ───┐                                      │
│  │                       │                                      │
│  │  📈 Completion rate:  │                                      │
│  │     ████████████░░░░░░ 67% (Day 8 of 12)                   │
│  │                       │                                      │
│  │  🏆 Consistency:      │                                      │
│  │     ████████████████░░ 89% (Excellent!)                    │
│  │                       │                                      │
│  │  💡 You're doing      │                                      │
│  │     great! Keep it up │                                      │
│  └───────────────────────┘                                      │
│                                                                 │
│  ┌─ [Return to Dashboard] ─┐        ┌─ [Download Summary] ─┐   │
│  │                         │        │                      │   │
│  │ (Primary action)        │        │ (Secondary option)   │   │
│  └─────────────────────────┘        └──────────────────────┘   │
│                                                                 │
│  💬 Questions? Contact study coordinator: (555) 123-4567       │
└─────────────────────────────────────────────────────────────────┘
```

## Mobile Responsive Adaptations

### Mobile Question Screen (360px width)
```
┌─────────────────────────────────────┐
│ ← Back            Question 1 of 8   │
├─────────────────────────────────────┤
│                                     │
│ ●○○○○○○○             ⏱️ ~2 min      │
│                                     │
│ How is your energy level today?     │
│                                     │
│ ┌─ Choose the best option ─┐        │
│ │                          │        │
│ │ 😴 Very Low              │        │
│ │ ┌──────────────────────┐ │        │
│ │ │ Extremely tired,     │ │        │
│ │ │ hard to get started  │ │        │
│ │ │                      │ │        │
│ │ │     ○ Select         │ │        │
│ │ └──────────────────────┘ │        │
│ │                          │        │
│ │ 😔 Low                   │        │
│ │ ┌──────────────────────┐ │        │
│ │ │ Tired, but can do    │ │        │
│ │ │ basic activities     │ │        │
│ │ │                      │ │        │
│ │ │     ○ Select         │ │        │
│ │ └──────────────────────┘ │        │
│ │                          │        │
│ │ 😊 Normal                │        │
│ │ ┌──────────────────────┐ │        │
│ │ │ Usual energy for     │ │        │
│ │ │ morning time         │ │        │
│ │ │                      │ │        │
│ │ │     ● Selected       │ │        │
│ │ └──────────────────────┘ │        │
│ └──────────────────────────┘        │
│                                     │
│ ❓ ┌─ [Show Help] ─┐                │
│    │              │                │
│    └──────────────┘                │
│                                     │
│ 💾 Automatically saved              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │        Next Question           │ │
│ │       (Full width)             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Accessibility Features Summary

### Screen Reader Support
- **Progressive disclosure**: One question at a time with clear context
- **Status announcements**: Live regions for auto-save confirmations
- **Comprehensive labeling**: All form elements properly associated
- **Error association**: Clear connection between errors and inputs
- **Navigation landmarks**: Proper heading structure and regions

### Keyboard Navigation
- **Logical tab order**: Follows visual flow through options
- **Arrow key support**: Navigate option groups with arrow keys
- **Enter/Space activation**: Standard form control activation
- **Escape functionality**: Cancel operations, return to safe states

### Visual Accessibility
- **High contrast compliance**: All elements meet 4.5:1 minimum ratio
- **Large touch targets**: 48px minimum for mobile interactions
- **Clear visual hierarchy**: Consistent typography and spacing
- **Color independence**: Icons and text support color coding
- **Progress indicators**: Visual and programmatic progress tracking

### Cognitive Accessibility
- **Single task focus**: One question per screen reduces cognitive load
- **Clear instructions**: Simple language with helpful examples
- **Progress context**: Always know where you are in the process
- **Auto-save confirmation**: Reduces anxiety about data loss
- **Help integration**: Contextual assistance when needed

### Motor Accessibility
- **Large interactive areas**: Generous click/touch targets
- **Adequate spacing**: Prevents accidental activation
- **Voice input support**: Compatible with speech recognition
- **Flexible interaction**: Multiple ways to select options
- **Error prevention**: Real-time validation prevents mistakes

This comprehensive questionnaire flow ensures all patients can successfully complete health assessments regardless of their technical abilities, health conditions, or accessibility needs.