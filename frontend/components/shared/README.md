# Shared Component Library - Clinical Trial Platform

## Overview

This shared component library provides reusable, accessible, and performant React components for both the physician admin portal and patient portal of the Clinical Trial platform. All components follow WCAG 2.1 AA accessibility standards and support Dynamic Type scaling.

## Design Principles

### 1. Accessibility First
- **WCAG 2.1 AA Compliance**: All components meet accessibility standards
- **Screen Reader Support**: Comprehensive ARIA labels and roles
- **Keyboard Navigation**: Full keyboard accessibility
- **Dynamic Type**: Large font size support (16px - 32px)
- **High Contrast**: Support for high contrast modes

### 2. Responsive Design
- **Mobile-First**: Designed for ≥360px viewport
- **Touch-Friendly**: Minimum 44px touch targets
- **Progressive Enhancement**: Works without JavaScript
- **Breakpoint System**: Consistent responsive behavior

### 3. Performance Optimization
- **Bundle Size**: Tree-shakeable components
- **Lazy Loading**: Heavy components load on demand
- **Memoization**: Prevent unnecessary re-renders
- **Progressive Enhancement**: Core functionality without JavaScript

### 4. Consistent Design System
- **Design Tokens**: Consistent colors, spacing, typography
- **Component Variants**: Systematic variation patterns
- **Theme Support**: Light/dark mode compatibility
- **Brand Consistency**: Healthcare-appropriate styling

## Component Categories

### Forms (`/forms/`)
Form components with built-in validation, accessibility, and error handling.

- **FormField**: Compound component for form fields with labels, inputs, and error messages
- **FormInput**: Text inputs with validation states and accessibility features
- **FormSelect**: Dropdown selections with search and accessibility
- **FormTextarea**: Multi-line text inputs with character counting
- **FormCheckbox**: Checkboxes with indeterminate states
- **FormRadioGroup**: Radio button groups with proper grouping
- **FormFileUpload**: File upload with drag-and-drop and progress tracking
- **FormValidation**: Client-side validation with real-time feedback

### UI Components (`/ui/`)
Core user interface components for consistent interactions.

- **Button**: Primary, secondary, danger, and ghost button variants
- **Modal**: Accessible dialogs with focus management
- **Alert**: Status messages with appropriate ARIA roles
- **Toast**: Non-blocking notifications with auto-dismiss
- **Loading**: Loading states with accessible announcements
- **ProgressBar**: Progress indicators with percentage and labels
- **Card**: Content containers with consistent spacing
- **Badge**: Status indicators and labels
- **Tooltip**: Contextual help with keyboard navigation

### Layout Components (`/layout/`)
Structural components for consistent page layouts.

- **Header**: Site header with navigation and user controls
- **Navigation**: Main navigation with breadcrumbs and active states
- **Sidebar**: Collapsible sidebar navigation
- **Footer**: Site footer with links and information
- **Container**: Content containers with responsive max-widths
- **Grid**: Flexible grid system for responsive layouts

### Accessibility Helpers (`/accessibility/`)
Components specifically designed to enhance accessibility.

- **SkipLink**: Skip navigation links for keyboard users
- **ScreenReaderOnly**: Visually hidden content for screen readers
- **FocusTrap**: Trap focus within modals and overlays
- **AnnounceLive**: Live region announcements for dynamic content

### Providers (`/providers/`)
Context providers for global application state.

- **AuthProvider**: Authentication state and actions
- **ThemeProvider**: Theme switching and accessibility preferences
- **NotificationProvider**: Toast notifications and alerts
- **OfflineProvider**: PWA offline state management

## Component API Patterns

### Compound Components
Components that work together to provide complex functionality.

```typescript
// Example: FormField compound component
<FormField>
  <FormField.Label>Email Address</FormField.Label>
  <FormField.Input 
    type="email" 
    name="email" 
    required 
    placeholder="Enter your email"
  />
  <FormField.Error />
  <FormField.Help>We'll never share your email with anyone</FormField.Help>
</FormField>
```

### Render Props
Components that provide flexible rendering patterns.

```typescript
// Example: Loading component with render prop
<Loading loading={isLoading}>
  {({ loading, error }) => (
    <div>
      {loading ? <Spinner /> : <QuestionnaireContent />}
      {error && <ErrorMessage error={error} />}
    </div>
  )}
</Loading>
```

### Polymorphic Components
Components that can render as different HTML elements.

```typescript
// Example: Button that can render as different elements
<Button as="a" href="/admin/questionnaires">
  View Questionnaires
</Button>

<Button as="button" type="submit" disabled={isSubmitting}>
  Submit Response
</Button>
```

## Accessibility Features

### ARIA Implementation
All components include comprehensive ARIA attributes:

```typescript
// Example: Modal with full ARIA support
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Patient Invitation"
  description="Send invitation to new patient"
  initialFocus="email-input"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <ModalContent />
</Modal>
```

### Keyboard Navigation
All interactive components support keyboard navigation:

- **Tab Navigation**: Logical tab order
- **Arrow Keys**: List and grid navigation
- **Space/Enter**: Activation
- **Escape**: Close modals and dropdowns
- **Home/End**: Navigate to start/end

### Screen Reader Support
Components provide rich information to screen readers:

```typescript
// Example: Progress bar with screen reader support
<ProgressBar
  value={75}
  max={100}
  label="Questionnaire Progress"
  description="3 of 4 sections completed"
  aria-live="polite"
/>
```

## Responsive Design System

### Breakpoint System
```typescript
// lib/constants/breakpoints.ts
export const breakpoints = {
  xs: '0px',      // Mobile phones (≥360px)
  sm: '640px',    // Large phones
  md: '768px',    // Tablets
  lg: '1024px',   // Small laptops
  xl: '1280px',   // Large laptops
  '2xl': '1536px' // Desktops
} as const;
```

### Responsive Component Props
Components accept responsive prop values:

```typescript
// Example: Responsive spacing and sizing
<Container 
  padding={{ xs: 4, md: 6, lg: 8 }}
  maxWidth={{ xs: 'full', lg: '4xl' }}
>
  <Grid 
    cols={{ xs: 1, md: 2, lg: 3 }}
    gap={{ xs: 4, md: 6 }}
  >
    {items.map(item => <Card key={item.id} {...item} />)}
  </Grid>
</Container>
```

## Theme System

### Design Tokens
```typescript
// lib/theme/tokens.ts
export const tokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      900: '#1e3a8a',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      500: '#6b7280',
      900: '#111827',
    },
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
    },
  },
  spacing: {
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
  },
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    full: '9999px',
  },
} as const;
```

### Dynamic Type Support
Components automatically scale with user font size preferences:

```typescript
// Example: Component with Dynamic Type support
const Button = styled.button<ButtonProps>`
  /* Base font size scales with user preference */
  font-size: 1rem; /* Will scale from 16px to 32px */
  
  /* Padding scales proportionally */
  padding: 0.75em 1.5em;
  
  /* Minimum touch target maintained */
  min-height: 44px;
  min-width: 44px;
`;
```

## Component Performance

### Memoization Strategy
Components use React.memo for performance optimization:

```typescript
// Example: Memoized component with custom comparison
export const QuestionCard = React.memo<QuestionCardProps>(
  ({ question, onUpdate, isActive }) => {
    // Component implementation
  },
  (prevProps, nextProps) => {
    // Custom comparison for complex props
    return (
      prevProps.question.id === nextProps.question.id &&
      prevProps.question.updatedAt === nextProps.question.updatedAt &&
      prevProps.isActive === nextProps.isActive
    );
  }
);
```

### Bundle Optimization
Components are designed for tree-shaking:

```typescript
// Individual component exports for tree-shaking
export { Button } from './ui/Button';
export { Modal } from './ui/Modal';
export { FormField } from './forms/FormField';

// Named exports prevent default export bundle bloat
export const ComponentLibrary = {
  Button,
  Modal,
  FormField,
} as const;
```

## Testing Strategy

### Component Testing
Every component includes comprehensive tests:

```typescript
// Example: Button component test
describe('Button', () => {
  it('should render with correct accessibility attributes', () => {
    render(
      <Button variant="primary" disabled>
        Submit
      </Button>
    );
    
    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveClass('btn-primary');
  });
  
  it('should handle keyboard navigation', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    
    // Test space key activation
    fireEvent.keyDown(button, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Test enter key activation
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
  
  it('should support dynamic type scaling', () => {
    render(<Button>Scalable Button</Button>);
    
    const button = screen.getByRole('button');
    const styles = getComputedStyle(button);
    
    // Font size should use relative units
    expect(styles.fontSize).toContain('rem');
  });
});
```

### Accessibility Testing
All components are tested with jest-axe:

```typescript
// Example: Accessibility test
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('FormField Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <FormField>
        <FormField.Label>Email</FormField.Label>
        <FormField.Input type="email" required />
        <FormField.Error>Invalid email format</FormField.Error>
      </FormField>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Documentation

### Component Documentation
Each component includes comprehensive documentation:

```typescript
/**
 * Button Component
 * 
 * A versatile button component that supports multiple variants, sizes, and states.
 * Fully accessible with keyboard navigation and screen reader support.
 * 
 * @example
 * // Primary button
 * <Button variant="primary" onClick={handleSubmit}>
 *   Save Changes
 * </Button>
 * 
 * @example
 * // Button as link
 * <Button as="a" href="/dashboard" variant="secondary">
 *   Go to Dashboard
 * </Button>
 */
export interface ButtonProps {
  /** Button content */
  children: React.ReactNode;
  
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Loading state with spinner */
  loading?: boolean;
  
  /** Full width button */
  fullWidth?: boolean;
  
  /** Element to render as */
  as?: 'button' | 'a';
  
  /** Click handler */
  onClick?: (event: React.MouseEvent) => void;
  
  /** Additional CSS classes */
  className?: string;
  
  /** ARIA label for accessibility */
  'aria-label'?: string;
}
```

### Storybook Integration
Components are documented in Storybook with all variants:

```typescript
// Button.stories.tsx
export default {
  title: 'Shared/UI/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'Versatile button component with full accessibility support',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'danger', 'ghost'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
  },
} as ComponentMeta<typeof Button>;

export const Primary: ComponentStory<typeof Button> = (args) => (
  <Button {...args}>Primary Button</Button>
);

export const AllVariants: ComponentStory<typeof Button> = () => (
  <div className="space-y-4">
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="danger">Danger</Button>
    <Button variant="ghost">Ghost</Button>
  </div>
);

export const Accessibility: ComponentStory<typeof Button> = () => (
  <div className="space-y-4">
    <Button aria-label="Save document">Save</Button>
    <Button disabled>Disabled Button</Button>
    <Button loading>Loading Button</Button>
  </div>
);
```

## Migration Guide

### From Legacy Components
Guidelines for migrating from older component implementations:

1. **Import Changes**: Update import paths to use new shared library
2. **Prop Mapping**: Some props have been renamed for consistency
3. **Accessibility**: New components include built-in accessibility features
4. **Styling**: Components use new design token system

### Breaking Changes
- `Button.size` now uses 'sm' | 'md' | 'lg' instead of 'small' | 'medium' | 'large'
- `Modal.onClose` is now required for proper accessibility
- `FormInput.validation` has been replaced with built-in validation

## Usage Examples

### Basic Form Example
```typescript
function PatientRegistrationForm() {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  
  return (
    <form onSubmit={handleSubmit}>
      <FormField>
        <FormField.Label>First Name</FormField.Label>
        <FormField.Input
          name="firstName"
          required
          value={formData.firstName}
          onChange={handleInputChange}
        />
        <FormField.Error>{errors.firstName}</FormField.Error>
      </FormField>
      
      <FormField>
        <FormField.Label>Email Address</FormField.Label>
        <FormField.Input
          type="email"
          name="email"
          required
          value={formData.email}
          onChange={handleInputChange}
        />
        <FormField.Help>
          We'll use this email to send you questionnaire invitations
        </FormField.Help>
        <FormField.Error>{errors.email}</FormField.Error>
      </FormField>
      
      <Button type="submit" variant="primary" fullWidth>
        Register
      </Button>
    </form>
  );
}
```

### Complex Modal Example
```typescript
function QuestionnaireSettingsModal({ isOpen, onClose, questionnaire }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Questionnaire Settings"
      description="Configure questionnaire distribution and notification settings"
      size="lg"
    >
      <Modal.Header>
        <h2 id="modal-title">Questionnaire Settings</h2>
        <p id="modal-description">
          Configure how this questionnaire is distributed to patients
        </p>
      </Modal.Header>
      
      <Modal.Body>
        <FormField>
          <FormField.Label>Distribution Method</FormField.Label>
          <FormField.Select
            name="distributionMethod"
            options={distributionOptions}
          />
        </FormField>
        
        <FormField>
          <FormField.Label>Send Reminders</FormField.Label>
          <FormField.Checkbox
            name="sendReminders"
            label="Send email reminders to patients"
          />
        </FormField>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Settings
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
```

This shared component library provides a solid foundation for building consistent, accessible, and performant user interfaces across both portals of the Clinical Trial platform.