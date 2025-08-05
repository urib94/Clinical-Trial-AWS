# Physician Dashboard Wireframes

## Overview
The physician dashboard serves as the primary landing page for medical professionals, providing a comprehensive overview of their clinical trial activities with emphasis on visual clarity and simplicity.

## Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Clinical Trial Platform                          Dr. Smith    [Profile] [Logout] │
├─────────────────────────────────────────────────────────────────────────────────┤
│  [Dashboard] [Questionnaires] [Patients] [Data & Reports]                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─ Key Statistics ────────────────────────────────────────────────────────────┐ │
│  │                                                                             │ │
│  │  ┌─ Active Patients ──┐  ┌─ Response Rate ───┐  ┌─ Recent Activity ──────┐ │ │
│  │  │      142           │  │       87%          │  │  Last 7 Days           │ │ │
│  │  │  ○○○○○○○○○○ 95%    │  │  ████████░░░       │  │  • 23 responses        │ │ │
│  │  │  ↗ +12 this week   │  │  Target: 85%       │  │  • 8 new patients      │ │ │
│  │  └────────────────────┘  └────────────────────┘  │  • 2 questionnaires    │ │ │
│  │                                                  │    published           │ │ │
│  │  ┌─ Completion Rate ─┐  ┌─ Data Quality ─────┐  └────────────────────────┘ │ │
│  │  │      73%          │  │       Good         │                             │ │
│  │  │  ████████░░░      │  │  ⚠ 3 incomplete    │                             │ │
│  │  │  Target: 70%      │  │    responses       │                             │ │
│  │  └───────────────────┘  └────────────────────┘                             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
│  ┌─ System Notifications ──────────────────────────────────────────────────────┐ │
│  │  🔔 You have 3 new notifications                                  [View All] │ │
│  │                                                                             │ │
│  │  ⚠ HIGH PRIORITY                                                           │ │
│  │  Patient ID #4821 has not responded in 14 days - Follow up required       │ │
│  │  2 hours ago                                                               │ │
│  │                                                                             │ │
│  │  ℹ SYSTEM UPDATE                                                            │ │
│  │  New questionnaire version published successfully                          │ │
│  │  1 day ago                                                                 │ │
│  │                                                                             │ │
│  │  ✓ BACKUP COMPLETED                                                         │ │
│  │  Daily backup completed successfully - All data secured                    │ │
│  │  2 days ago                                                                │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
│  ┌─ Quick Actions ─────────────────────────────────────────────────────────────┐ │
│  │                                                                             │ │
│  │  ┌─ Create New ─────┐  ┌─ Invite Patients ─┐  ┌─ Export Data ──────────┐  │ │
│  │  │  📝 Questionnaire │  │  ✉ Send Invitations │  │  📊 Generate Report   │  │ │
│  │  │                  │  │                     │  │                       │  │ │
│  │  │  Build a new     │  │  Invite patients to │  │  Export patient data  │  │ │
│  │  │  questionnaire   │  │  participate        │  │  and responses        │  │ │
│  │  └──────────────────┘  └─────────────────────┘  └───────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
│  ┌─ Recent Patient Activity ───────────────────────────────────────────────────┐ │
│  │                                                                             │ │
│  │  Patient ID        Action              Time          Status                 │ │
│  │  ─────────────────────────────────────────────────────────────────────────  │ │
│  │  #4856            Completed Q1         2 mins ago    ✓ Complete            │ │
│  │  #4823            Started Q2           15 mins ago   ⏳ In Progress         │ │
│  │  #4791            Registered           1 hour ago    🔄 New                 │ │
│  │  #4745            Completed Q1         3 hours ago   ✓ Complete            │ │
│  │  #4712            Response updated     5 hours ago   ⚠ Needs Review        │ │
│  │                                                                             │ │
│  │                                                          [View All Patients] │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Tablet Layout (768px - 1023px)

```
┌─────────────────────────────────────────────────────────────┐
│  Clinical Trial Platform              Dr. Smith [≡] [Profile] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Statistics Grid ────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  ┌─ Active ──┐  ┌─ Response ┐  ┌─ Activity ────────────┐ │ │
│  │  │   142     │  │    87%    │  │  • 23 responses       │ │ │
│  │  │ Patients  │  │   Rate    │  │  • 8 new patients     │ │ │
│  │  └───────────┘  └───────────┘  │  • 2 questionnaires   │ │ │
│  │                               └─────────────────────────┘ │ │
│  │  ┌─ Complete ─┐  ┌─ Quality ─┐                            │ │
│  │  │    73%     │  │   Good    │                            │ │ │
│  │  │    Rate    │  │  ⚠ 3 inc. │                            │ │ │
│  │  └────────────┘  └───────────┘                            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Notifications ──────────────────────────────────────────┐ │
│  │  🔔 3 new notifications                      [View All] │ │
│  │                                                         │ │
│  │  ⚠ Patient #4821 - Follow up required                  │ │
│  │  ℹ New questionnaire published                          │ │
│  │  ✓ Daily backup completed                               │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Quick Actions ──────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  ┌─ Create ─────┐  ┌─ Invite ─────┐  ┌─ Export ─────┐  │ │
│  │  │ 📝 New       │  │ ✉ Patients   │  │ 📊 Data      │  │ │
│  │  │ Questionnaire│  │              │  │              │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Recent Activity ────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  #4856  Completed Q1      ✓ Complete                   │ │
│  │  #4823  Started Q2        ⏳ In Progress                │ │
│  │  #4791  Registered        🔄 New                        │ │
│  │                                        [View All]      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Mobile Layout (360px - 767px)

```
┌─────────────────────────────────────┐
│ Clinical Trial      [≡] [Profile]   │
├─────────────────────────────────────┤
│                                     │
│ ┌─ Statistics ─────────────────────┐ │
│ │                                 │ │
│ │ ┌─ Active Patients ─────────────┐ │ │
│ │ │       142                     │ │ │
│ │ │   ○○○○○○○○○○ 95%             │ │ │
│ │ │   ↗ +12 this week             │ │ │
│ │ └───────────────────────────────┘ │ │
│ │                                 │ │
│ │ ┌─ Response Rate ───────────────┐ │ │
│ │ │       87%                     │ │ │
│ │ │   ████████░░░                 │ │ │
│ │ │   Target: 85%                 │ │ │
│ │ └───────────────────────────────┘ │ │
│ │                                 │ │
│ │ ┌─ Recent Activity ─────────────┐ │ │
│ │ │ • 23 responses                │ │ │
│ │ │ • 8 new patients              │ │ │
│ │ │ • 2 questionnaires            │ │ │
│ │ └───────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ Notifications ─────────────────┐ │
│ │ 🔔 3 new                        │ │
│ │                                 │ │
│ │ ⚠ Patient #4821                 │ │
│ │   Follow up required            │ │
│ │                                 │ │
│ │ ℹ New questionnaire             │ │
│ │   published                     │ │
│ │                       [View All]│ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ Quick Actions ─────────────────┐ │
│ │                                 │ │
│ │ ┌─ Create ──────────────────────┐ │ │
│ │ │ 📝 New Questionnaire          │ │ │
│ │ └───────────────────────────────┘ │ │
│ │                                 │ │
│ │ ┌─ Invite ──────────────────────┐ │ │
│ │ │ ✉ Invite Patients             │ │ │
│ │ └───────────────────────────────┘ │ │
│ │                                 │ │
│ │ ┌─ Export ──────────────────────┐ │ │
│ │ │ 📊 Export Data                │ │ │
│ │ └───────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ Recent Activity ───────────────┐ │
│ │                                 │ │
│ │ #4856 Completed Q1              │ │
│ │ ✓ Complete                      │ │
│ │                                 │ │
│ │ #4823 Started Q2                │ │
│ │ ⏳ In Progress                   │ │
│ │                                 │ │
│ │ #4791 Registered                │ │
│ │ 🔄 New                          │ │
│ │                                 │ │
│ │                     [View All]  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Design Principles

### Visual Hierarchy
1. **Primary Information**: Key statistics prominently displayed with large, readable numbers
2. **Secondary Information**: Contextual details and trends shown with appropriate visual weight
3. **Tertiary Information**: Supporting details and timestamps with lighter visual treatment

### Color Coding System
- **Green (Success)**: Completed actions, positive metrics above target
- **Blue (Primary)**: Neutral information, standard actions
- **Amber (Caution)**: Metrics approaching thresholds, requires attention
- **Red (Alert)**: Critical issues requiring immediate attention

### Accessibility Features
- **High Contrast**: All text meets WCAG 2.1 AA contrast ratios (4.5:1 minimum)
- **Large Touch Targets**: Minimum 44x44px touch targets for mobile interactions
- **Dynamic Type Support**: Text scales appropriately with system font size settings
- **Screen Reader Support**: Semantic HTML structure with appropriate ARIA labels

### Interactive Elements
- **Loading States**: Skeleton screens for all dynamic content
- **Error States**: Clear, actionable error messages with recovery options
- **Empty States**: Helpful guidance when no data is available
- **Confirmation Dialogs**: Required for all destructive actions

## Key Features

### Dashboard Widgets
1. **Active Patients Counter**: Real-time count with trend indicators
2. **Response Rate Gauge**: Visual progress indicator with target comparison
3. **Completion Rate Tracker**: Patient completion percentage with benchmarks
4. **Data Quality Indicator**: Overall data health with specific issue callouts

### Notification System
- **Priority Levels**: High, Medium, Low with appropriate visual treatment
- **Action Items**: Direct links to resolve issues
- **Dismissal Options**: Mark as read or snooze capabilities
- **Audit Trail**: Complete history of all notifications

### Quick Actions
- **Primary Actions**: Most common tasks prominently featured
- **Context Sensitive**: Actions adapt based on current state
- **Progress Indicators**: Show completion status for multi-step processes
- **Keyboard Shortcuts**: Support for power users

### Recent Activity Feed
- **Real-time Updates**: Live feed of patient interactions
- **Filterable Views**: Show specific types of activity
- **Action Links**: Direct navigation to related sections
- **Batch Operations**: Select multiple items for bulk actions