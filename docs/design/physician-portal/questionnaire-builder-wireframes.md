# Questionnaire Builder Wireframes

## Overview
The questionnaire builder provides an intuitive, drag-and-drop/visual interface for non-technical medical professionals to create, edit, and manage clinical trial questionnaires with conditional logic support.

## Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Clinical Trial Platform                          Dr. Smith    [Profile] [Logout] │
├─────────────────────────────────────────────────────────────────────────────────┤
│  [Dashboard] [Questionnaires] [Patients] [Data & Reports]                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─ Questionnaire: "Patient Health Assessment v2.1" ─────────────────────────────┐ │
│  │  📝 Draft | Created: Feb 15, 2025 | Last Modified: Today                      │ │
│  │  [👁 Preview] [💾 Save] [📋 Duplicate] [🚀 Publish] [⚙ Settings]              │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
│  ┌─ Question Types ─────┐ ┌─ Builder Canvas ─────────────────────────────────────┐ │
│  │                     │ │                                                       │ │
│  │  📝 Text Input      │ │  Question 1                                  [📝] [🗑] │ │
│  │  ├─ Short Answer    │ │  What is your age?            *Required               │ │
│  │  └─ Long Answer     │ │  ┌─────────────────────────────────────────────────┐  │ │
│  │                     │ │  │ Number input (18-120)                           │  │ │
│  │  ☑️ Multiple Choice  │ │  │ Validation: Must be between 18-120             │  │ │
│  │  ├─ Single Select   │ │  └─────────────────────────────────────────────────┘  │ │
│  │  └─ Multi Select    │ │                                                       │ │
│  │                     │ │  ┌─ Conditional Logic ──────────────────────────────┐  │ │
│  │  🔢 Number          │ │  │ IF age >= 65 THEN show Question 2                │  │ │
│  │  ├─ Integer         │ │  │ [⚙ Edit Logic]                                   │  │ │
│  │  ├─ Decimal         │ │  └───────────────────────────────────────────────────┘  │ │
│  │  └─ Range           │ │                                                       │ │
│  │                     │ │  ─────────────────────────────────────────────────── │ │
│  │  📅 Date & Time     │ │                                                       │ │
│  │  ├─ Date Only       │ │  Question 2                                  [📝] [🗑] │ │
│  │  ├─ Time Only       │ │  Do you have any chronic conditions?  *Required       │ │
│  │  └─ Date & Time     │ │  ┌─────────────────────────────────────────────────┐  │ │
│  │                     │ │  │ ☑️ Multiple Choice (Multi-select)               │  │ │
│  │  📸 Media           │ │  │ □ Diabetes                                       │  │ │
│  │  ├─ Image Upload    │ │  │ □ Heart Disease                                  │  │ │
│  │  ├─ Document        │ │  │ □ Hypertension                                   │  │ │
│  │  └─ Video/Audio     │ │  │ □ None of the above                              │  │ │
│  │                     │ │  │ [+ Add Option]                                   │  │ │
│  │  📊 Rating Scale    │ │  └─────────────────────────────────────────────────┘  │ │
│  │  ├─ Star Rating     │ │                                                       │ │
│  │  ├─ Numeric Scale   │ │  ┌─ Conditional Logic ──────────────────────────────┐  │ │
│  │  └─ Slider          │ │  │ IF "Diabetes" selected THEN show Question 3      │  │ │
│  │  ─────────────────── │ │  │ [⚙ Edit Logic]                                   │  │ │
│  │                     │ │  └───────────────────────────────────────────────────┘  │ │
│  │  📋 Common          │ │                                                       │ │
│  │  Templates:         │ │  ─────────────────────────────────────────────────── │ │
│  │                     │ │                                                       │ │
│  │  • Demographics     │ │  Question 3 (Hidden until condition met)     [📝] [🗑] │ │
│  │  • Medical History  │ │  How long have you had diabetes?                       │ │
│  │  • Symptoms         │ │  ┌─────────────────────────────────────────────────┐  │ │
│  │  • Pain Scale       │ │  │ ☑️ Single Choice                                 │  │ │
│  │  • Quality of Life  │ │  │ ○ Less than 1 year                               │  │ │
│  │  • Side Effects     │ │  │ ○ 1-5 years                                      │  │ │
│  │  ─────────────────── │ │  │ ○ 5-10 years                                     │  │ │
│  │                     │ │  │ ○ More than 10 years                             │  │ │
│  │  [+ Add Question]   │ │  └─────────────────────────────────────────────────┘  │ │
│  │                     │ │                                                       │ │
│  │  [📤 Import]        │ │  ─────────────────────────────────────────────────── │ │
│  │  [💾 Save Template] │ │                                                       │ │
│  │                     │ │                      [+ Add Question]                │ │
│  └─────────────────────┘ └───────────────────────────────────────────────────────┘ │
│                                                                                   │
│  ┌─ Preview Panel ──────────────────────────────────────────────────────────────┐ │
│  │  📱 Preview Mode: [Desktop] [Tablet] [Mobile]                                │ │
│  │                                                                             │ │
│  │  ┌─ Patient View ────────────────────────────────────────────────────────┐  │ │
│  │  │                                                                       │  │ │
│  │  │  Patient Health Assessment                                            │  │ │
│  │  │  ────────────────────────────                                         │  │ │
│  │  │                                                                       │  │ │
│  │  │  1. What is your age? *                                               │  │ │
│  │  │     [____] years                                                      │  │ │
│  │  │                                                                       │  │ │
│  │  │  2. Do you have any chronic conditions? *                            │  │ │
│  │  │     □ Diabetes                                                        │  │ │
│  │  │     □ Heart Disease                                                   │  │ │
│  │  │     □ Hypertension                                                    │  │ │
│  │  │     □ None of the above                                               │  │ │
│  │  │                                                                       │  │ │
│  │  │                                              [Previous] [Next]       │  │ │
│  │  └───────────────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Tablet Layout (768px - 1023px)

```
┌─────────────────────────────────────────────────────────────┐
│  Clinical Trial Platform              Dr. Smith [≡] [Profile] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Patient Health Assessment v2.1 ─────────────────────────┐ │
│  │  📝 Draft | Modified: Today                             │ │
│  │  [👁] [💾] [📋] [🚀] [⚙]                                │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Question Types ──────────────────────────────────────────┐ │
│  │  📝 Text  ☑️ Choice  🔢 Number  📅 Date  📸 Media        │ │
│  │  [+ Templates]                             [+ Question]  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Builder Canvas ──────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  Question 1                               [📝] [🗑]     │ │
│  │  What is your age?                        *Required     │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │ Number input (18-120)                               │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                         │ │
│  │  ┌─ Logic: IF age >= 65 THEN show Q2 ───────── [⚙ Edit]│ │
│  │                                                         │ │
│  │  ───────────────────────────────────────────────────── │ │
│  │                                                         │ │
│  │  Question 2                               [📝] [🗑]     │ │
│  │  Do you have chronic conditions?          *Required     │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │ □ Diabetes  □ Heart Disease  □ Hypertension         │ │ │
│  │  │ □ None of the above          [+ Add Option]         │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                         │ │
│  │                                        [+ Add Question] │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Preview ────────────────────────────────────────────────┐ │
│  │  [Desktop] [Tablet] [Mobile]                            │ │
│  │                                                         │ │
│  │  Patient Health Assessment                              │ │
│  │  ─────────────────────────                              │ │
│  │  1. What is your age? *                                 │ │
│  │     [____] years                                        │ │
│  │                                                         │ │
│  │  2. Chronic conditions? *                               │ │
│  │     □ Diabetes □ Heart Disease                          │ │
│  │                                                         │ │
│  │                                   [Previous] [Next]    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Mobile Layout (360px - 767px)

```
┌─────────────────────────────────────┐
│ Clinical Trial      [≡] [Profile]   │
├─────────────────────────────────────┤
│                                     │
│ ┌─ Health Assessment v2.1 ─────────┐ │
│ │ 📝 Draft | Today                 │ │
│ │ [👁] [💾] [🚀] [⚙]               │ │
│ └───────────────────────────────────┘ │
│                                     │
│ ┌─ Add Questions ─────────────────────┐ │
│ │ [📝 Text] [☑️ Choice] [🔢 Number]  │ │
│ │ [📅 Date] [📸 Media] [+ More]      │ │
│ └───────────────────────────────────┘ │
│                                     │
│ ┌─ Question 1 ───────────────────────┐ │
│ │                          [⋮] [🗑] │ │
│ │ What is your age? *Required        │ │
│ │                                   │ │
│ │ Type: Number (18-120)             │ │
│ │                                   │ │
│ │ Logic: IF age >= 65 THEN show Q2  │ │
│ │ [⚙ Edit Logic]                     │ │
│ └───────────────────────────────────┘ │
│                                     │
│ ┌─ Question 2 ───────────────────────┐ │
│ │                          [⋮] [🗑] │ │
│ │ Chronic conditions? *Required      │ │
│ │                                   │ │
│ │ Type: Multiple Choice              │ │
│ │ □ Diabetes                        │ │
│ │ □ Heart Disease                   │ │
│ │ □ Hypertension                    │ │
│ │ □ None                            │ │
│ │ [+ Add Option]                    │ │
│ │                                   │ │
│ │ Logic: IF Diabetes THEN show Q3   │ │
│ │ [⚙ Edit Logic]                     │ │
│ └───────────────────────────────────┘ │
│                                     │
│ ┌─ Add Question ─────────────────────┐ │
│ │              [+]                  │ │
│ └───────────────────────────────────┘ │
│                                     │
│ ┌─ Preview ─────────────────────────┐ │
│ │ [Desktop] [Mobile]                │ │
│ │                                   │ │
│ │ Patient Health Assessment         │ │
│ │ ────────────────────              │ │
│ │                                   │ │
│ │ 1. What is your age? *            │ │
│ │    [____] years                   │ │
│ │                                   │ │
│ │ 2. Chronic conditions? *          │ │
│ │    □ Diabetes                     │ │
│ │    □ Heart Disease                │ │
│ │                                   │ │
│ │                    [Previous] [Next]│ │
│ └───────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Visual Components

### Question Type Palette
```
┌─ Text Input ────────────────────────┐
│ 📝 Short Answer                     │
│    Single line text input           │
│                                     │
│ 📝 Long Answer                      │
│    Multi-line text area             │
└─────────────────────────────────────┘

┌─ Multiple Choice ───────────────────┐
│ ☑️ Single Select                    │
│    Radio buttons (one choice)       │
│                                     │
│ ☑️ Multi Select                     │
│    Checkboxes (multiple choices)    │
└─────────────────────────────────────┘

┌─ Number Input ──────────────────────┐
│ 🔢 Integer                          │
│    Whole numbers only               │
│                                     │
│ 🔢 Decimal                          │
│    Numbers with decimals            │
│                                     │
│ 🔢 Range                            │
│    Min/max validation               │
└─────────────────────────────────────┘

┌─ Date & Time ───────────────────────┐
│ 📅 Date Only                        │
│    Calendar picker                  │
│                                     │
│ 🕐 Time Only                        │
│    Time picker                      │
│                                     │
│ 📅 Date & Time                      │
│    Combined picker                  │
└─────────────────────────────────────┘

┌─ Media Upload ──────────────────────┐
│ 📸 Image Upload                     │
│    Photos/screenshots               │
│                                     │
│ 📄 Document Upload                  │
│    PDF/DOC files                    │
│                                     │
│ 🎥 Video/Audio                      │
│    Media recordings                 │
└─────────────────────────────────────┘

┌─ Rating & Scale ────────────────────┐
│ ⭐ Star Rating                      │
│    1-5 or 1-10 stars                │
│                                     │
│ 📊 Numeric Scale                    │
│    1-10 numeric rating              │
│                                     │
│ 🎚️ Slider                           │
│    Visual slider control            │
└─────────────────────────────────────┘
```

### Conditional Logic Builder
```
┌─ Conditional Logic Editor ──────────────────────────────────┐
│                                                             │
│  IF  [Question 1: Age        ▼] [>=] [65          ]         │
│                                                             │
│  THEN  ○ Show Question      [Question 2 ▼]                 │
│        ● Hide Question      [Question 3 ▼]                 │
│        ○ Skip to Question   [Question 5 ▼]                 │
│                                                             │
│  ┌─ Add Another Condition ──────────────────────────────┐   │
│  │  AND  [Question 2: Conditions ▼] [contains] [Diabetes]│   │
│  │                                                      │   │
│  │  THEN  ● Show Question  [Question 4 ▼]              │   │
│  │        ○ Hide Question  [Question 6 ▼]              │   │
│  │                                            [Remove] │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  [+ Add Condition]                                          │
│                                                             │
│  ┌─ Preview Logic Flow ───────────────────────────────────┐ │
│  │  Q1 (Age) → IF ≥65 → Show Q2                          │ │
│  │           ↓                                            │ │
│  │  Q2 (Conditions) → IF Diabetes → Show Q4              │ │
│  │                  → ELSE → Skip to Q5                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  [Save Logic] [Cancel] [Test Flow]                          │
└─────────────────────────────────────────────────────────────┘
```

### Question Templates Library
```
┌─ Template Library ──────────────────┐
│                                     │
│ ┌─ Demographics ─────────────────────┐ │
│ │ • Age                             │ │
│ │ • Gender                          │ │
│ │ • Race/Ethnicity                  │ │
│ │ • Education Level                 │ │
│ │ • Employment Status               │ │
│ │                      [Use Template]│ │
│ └───────────────────────────────────┘ │
│                                     │
│ ┌─ Medical History ──────────────────┐ │
│ │ • Current Medications             │ │
│ │ • Allergies                       │ │
│ │ • Previous Surgeries              │ │
│ │ • Family History                  │ │
│ │ • Chronic Conditions              │ │
│ │                      [Use Template]│ │
│ └───────────────────────────────────┘ │
│                                     │
│ ┌─ Symptoms Assessment ──────────────┐ │
│ │ • Pain Scale (1-10)               │ │
│ │ • Symptom Frequency               │ │
│ │ • Symptom Duration                │ │
│ │ • Symptom Severity                │ │
│ │ • Impact on Daily Life            │ │
│ │                      [Use Template]│ │
│ └───────────────────────────────────┘ │
│                                     │
│ ┌─ Quality of Life ──────────────────┐ │
│ │ • Physical Function               │ │
│ │ • Emotional Wellbeing             │ │
│ │ • Social Activities               │ │
│ │ • Sleep Quality                   │ │
│ │ • Energy Levels                   │ │
│ │                      [Use Template]│ │
│ └───────────────────────────────────┘ │
│                                     │
│ [Create Custom Template]             │ │
└─────────────────────────────────────┘
```

## Key Features

### Drag-and-Drop Interface
- **Visual Question Types**: Icon-based palette with clear labels
- **Drag Indicators**: Visual feedback during drag operations
- **Drop Zones**: Clear areas where questions can be placed
- **Snap to Grid**: Automatic alignment and spacing
- **Undo/Redo**: Full action history with keyboard shortcuts

### Conditional Logic
- **Visual Flow Builder**: Graphical representation of logic chains
- **Natural Language**: "IF...THEN" statements in plain English
- **Validation**: Real-time checking for logical inconsistencies
- **Preview Mode**: Test logic flow before publishing
- **Complex Conditions**: Support for AND/OR operations

### Real-time Preview
- **Multi-device Preview**: Desktop, tablet, and mobile views
- **Interactive Testing**: Fill out forms as patients would
- **Logic Testing**: Verify conditional logic works correctly
- **Accessibility Preview**: Screen reader and keyboard navigation testing
- **Performance Indicators**: Load times and response metrics

### Version Control
- **Auto-save**: Continuous saving with conflict resolution
- **Version History**: Complete audit trail of changes
- **Branching**: Create variations without affecting live versions
- **Rollback**: Revert to previous versions safely
- **Impact Analysis**: See which patients would be affected by changes

### Template System
- **Pre-built Templates**: Common clinical assessment patterns
- **Custom Templates**: Save frequently used question sets
- **Template Library**: Shared templates across organization
- **Import/Export**: Share templates between questionnaires
- **Template Versioning**: Track changes to reusable components

## Accessibility Features

### Keyboard Navigation
- **Tab Order**: Logical navigation through all interface elements
- **Shortcuts**: Quick access to common actions (Ctrl+S for save)
- **Focus Indicators**: Clear visual focus states
- **Skip Links**: Jump to main content areas
- **Arrow Key Navigation**: Navigate through question lists

### Screen Reader Support
- **Semantic HTML**: Proper heading structure and landmarks
- **ARIA Labels**: Descriptive labels for complex interactions
- **Live Regions**: Announce dynamic content changes
- **Form Labels**: Clear associations between labels and inputs
- **Error Announcements**: Immediate feedback on validation issues

### Visual Accessibility
- **High Contrast Mode**: Alternative color scheme for visibility
- **Dynamic Type**: Support for system font size preferences
- **Color Independence**: Information not conveyed by color alone
- **Icon Labels**: Text alternatives for all icons
- **Focus Management**: Proper focus handling for modals and overlays

## Error Handling

### Validation
- **Real-time Validation**: Immediate feedback as users type
- **Clear Error Messages**: Specific, actionable error descriptions
- **Field-level Errors**: Highlight specific problematic fields
- **Form-level Warnings**: Overall form status and issues
- **Recovery Suggestions**: How to fix common problems

### Auto-save & Recovery
- **Continuous Auto-save**: Save work every 30 seconds
- **Conflict Resolution**: Handle multiple editors gracefully
- **Recovery Mode**: Restore work after connection issues
- **Version Conflicts**: Clear options when versions diverge
- **Data Loss Prevention**: Warn before leaving unsaved work