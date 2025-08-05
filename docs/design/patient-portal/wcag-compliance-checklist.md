# WCAG 2.1 AA Compliance Checklist - Patient Portal

## Testing Overview
This checklist ensures the patient portal meets WCAG 2.1 Level AA compliance requirements. Each item must be tested and verified before deployment.

## Principle 1: Perceivable

### 1.1 Text Alternatives
- [ ] **1.1.1 Non-text Content (A)**: All images have appropriate alt text
  - [ ] Informative images describe their content and function
  - [ ] Decorative images use empty alt="" or role="presentation"
  - [ ] Complex images have detailed descriptions via longdesc or adjacent text
  - [ ] Form images (buttons) describe their function
  - [ ] Progress indicators have descriptive alt text

**Test Method**: Review all `<img>`, `<svg>`, and `<canvas>` elements
**Example**: `<img src="progress.svg" alt="3 of 20 questions completed, 15% progress">`

### 1.2 Time-based Media
- [ ] **1.2.1 Audio-only and Video-only (A)**: Not applicable (no media content)
- [ ] **1.2.2 Captions (A)**: Not applicable (no video content)  
- [ ] **1.2.3 Audio Description or Media Alternative (A)**: Not applicable
- [ ] **1.2.4 Captions (Live) (AA)**: Not applicable
- [ ] **1.2.5 Audio Description (AA)**: Not applicable

### 1.3 Adaptable
- [ ] **1.3.1 Info and Relationships (A)**: Information structure is programmatically determinable
  - [ ] Heading hierarchy is logical (h1 → h2 → h3)
  - [ ] Form labels are properly associated with inputs
  - [ ] Lists use proper markup (`<ul>`, `<ol>`, `<li>`)
  - [ ] Tables use proper headers and structure
  - [ ] Related form fields are grouped with `<fieldset>` and `<legend>`

**Test Method**: Use browser developer tools to inspect HTML structure
**Example**: 
```html
<fieldset>
  <legend>Pain Assessment</legend>
  <label for="pain-level">Rate your pain (0-10)</label>
  <input type="range" id="pain-level" name="painLevel">
</fieldset>
```

- [ ] **1.3.2 Meaningful Sequence (A)**: Content order makes sense when stylesheets are disabled
  - [ ] Tab order follows visual flow
  - [ ] Reading order is logical without CSS
  - [ ] DOM order matches visual presentation

**Test Method**: Disable CSS and verify content flow makes sense

- [ ] **1.3.3 Sensory Characteristics (A)**: Instructions don't rely solely on sensory characteristics
  - [ ] Don't use only "click the green button" (include text label)
  - [ ] Don't use only "fields on the right" (include programmatic structure)
  - [ ] Don't rely solely on sound, shape, or position

**Test Method**: Review all instruction text for sensory-only references

- [ ] **1.3.4 Orientation (AA)**: Content works in both portrait and landscape
  - [ ] No fixed orientation restrictions
  - [ ] Mobile layouts adapt to device rotation
  - [ ] All functionality available in both orientations

**Test Method**: Test on mobile devices in both orientations

- [ ] **1.3.5 Identify Input Purpose (AA)**: Input purposes are programmatically determinable
  - [ ] Autocomplete attributes on relevant fields
  - [ ] Common input types use appropriate HTML input types

**Test Method**: Verify autocomplete attributes on personal information fields
**Example**: `<input type="email" name="email" autocomplete="email">`

### 1.4 Distinguishable
- [ ] **1.4.1 Use of Color (A)**: Color is not the only means of conveying information
  - [ ] Error states use icons and text, not just red color
  - [ ] Required fields marked with asterisk and "required" attribute
  - [ ] Status indicators use multiple visual cues

**Test Method**: Use color blindness simulator tools
**Example**: Error states use ❌ icon + red border + "Error:" text prefix

- [ ] **1.4.2 Audio Control (A)**: Not applicable (no auto-playing audio)

- [ ] **1.4.3 Contrast (Minimum) (AA)**: Color contrast ratios meet minimum requirements
  - [ ] Normal text: 4.5:1 contrast ratio minimum
  - [ ] Large text (18pt+ or 14pt+ bold): 3:1 contrast ratio minimum
  - [ ] Non-text elements: 3:1 contrast ratio minimum

**Test Method**: Use WebAIM Contrast Checker or browser dev tools
**Color Standards**:
- Primary text (#000000) on white (#ffffff): 21:1 ✅
- Secondary text (#666666) on white (#ffffff): 5.74:1 ✅
- Primary button (#0066cc) on white (#ffffff): 4.5:1 ✅

- [ ] **1.4.4 Resize Text (AA)**: Text can be resized up to 200% without horizontal scroll
  - [ ] Test at 125%, 150%, 175%, 200% browser zoom
  - [ ] No horizontal scrolling required
  - [ ] All content and functionality remains available

**Test Method**: Test in Chrome, Firefox, Safari at various zoom levels

- [ ] **1.4.5 Images of Text (AA)**: No images of text used (except logos)
  - [ ] All text content uses actual text, not images
  - [ ] Buttons use CSS styling, not text images

**Test Method**: Review all images for embedded text

- [ ] **1.4.10 Reflow (AA)**: Content reflows without horizontal scrolling at 320px width
  - [ ] Mobile viewport at 320px wide shows all content
  - [ ] No horizontal scrolling required
  - [ ] Two-dimensional scrolling only for large data tables/images

**Test Method**: Resize browser to 320px width and verify layout

- [ ] **1.4.11 Non-text Contrast (AA)**: UI components and graphics have 3:1 contrast
  - [ ] Form field borders meet contrast requirements
  - [ ] Button borders and backgrounds meet contrast requirements
  - [ ] Focus indicators meet contrast requirements
  - [ ] Icons and graphics meet contrast requirements

**Test Method**: Test with contrast measurement tools

- [ ] **1.4.12 Text Spacing (AA)**: No loss of functionality when text spacing is adjusted
  - [ ] Line height: 1.5x font size minimum
  - [ ] Paragraph spacing: 2x font size minimum
  - [ ] Letter spacing: 0.12x font size minimum
  - [ ] Word spacing: 0.16x font size minimum

**Test Method**: Apply text spacing CSS and verify no content is cut off

- [ ] **1.4.13 Content on Hover or Focus (AA)**: Additional content appears/disappears predictably
  - [ ] Tooltip content can be dismissed without moving pointer
  - [ ] Hover content remains visible when pointer moves over it
  - [ ] Content remains until hover/focus is removed or user dismisses

**Test Method**: Test all hover states and tooltips

## Principle 2: Operable

### 2.1 Keyboard Accessible
- [ ] **2.1.1 Keyboard (A)**: All functionality available via keyboard
  - [ ] All interactive elements are focusable
  - [ ] All actions can be triggered with keyboard
  - [ ] Custom controls have keyboard support
  - [ ] No keyboard traps (except intended focus traps in modals)

**Test Method**: Navigate entire application using only Tab, Shift+Tab, Enter, Space, Arrow keys

- [ ] **2.1.2 No Keyboard Trap (A)**: Focus is not trapped in components
  - [ ] Users can navigate away from all components
  - [ ] Modal dialogs have proper focus management
  - [ ] Escape key closes modals and returns focus

**Test Method**: Use keyboard to navigate and verify escape routes

- [ ] **2.1.4 Character Key Shortcuts (A)**: Single character shortcuts don't conflict
  - [ ] No single-key shortcuts implemented (or they can be turned off)
  - [ ] Shortcuts only active when relevant component has focus

### 2.2 Enough Time
- [ ] **2.2.1 Timing Adjustable (A)**: Users can extend or disable time limits
  - [ ] Session timeouts provide 20-second warning minimum
  - [ ] Users can extend session before expiration
  - [ ] Auto-save functionality prevents data loss

**Test Method**: Wait for session timeout and verify warning appears

- [ ] **2.2.2 Pause, Stop, Hide (A)**: Moving content can be controlled
  - [ ] Loading spinners can be paused (if longer than 5 seconds)
  - [ ] Auto-updating content can be paused
  - [ ] Animations respect prefers-reduced-motion

**Test Method**: Test with prefers-reduced-motion CSS media query

### 2.3 Seizures and Physical Reactions
- [ ] **2.3.1 Three Flashes or Below Threshold (A)**: No content flashes more than 3 times per second
  - [ ] Loading animations flash ≤ 3 times per second
  - [ ] No rapid color changes or patterns

**Test Method**: Review all animations and transitions

### 2.4 Navigable
- [ ] **2.4.1 Bypass Blocks (A)**: Skip links provided for navigation
  - [ ] "Skip to main content" link at top of page
  - [ ] Skip links for repetitive navigation elements

**Test Method**: Tab to first element and verify skip link appears

- [ ] **2.4.2 Page Titled (A)**: Pages have descriptive titles
  - [ ] Each page has unique, descriptive title
  - [ ] Title describes page purpose and context
  - [ ] Title format: "Specific Page - Patient Portal"

**Test Method**: Review all page titles in browser tabs

- [ ] **2.4.3 Focus Order (A)**: Focus order is logical and intuitive
  - [ ] Tab order follows visual flow
  - [ ] Focus moves through related content groups
  - [ ] Focus returns to logical position after modal closure

**Test Method**: Navigate with Tab key and verify focus flow

- [ ] **2.4.4 Link Purpose (In Context) (A)**: Link purpose is clear from link text or context
  - [ ] No "click here" or "read more" links without context
  - [ ] Link text describes destination or function
  - [ ] Links to external sites identified

**Test Method**: Review all link text for clarity

- [ ] **2.4.5 Multiple Ways (AA)**: Multiple ways to locate pages
  - [ ] Navigation menu provides access to all pages
  - [ ] Breadcrumb navigation shows current location
  - [ ] Search functionality (if applicable)

**Test Method**: Verify multiple navigation paths exist

- [ ] **2.4.6 Headings and Labels (AA)**: Headings and labels are descriptive
  - [ ] Headings describe topic or purpose
  - [ ] Form labels clearly identify required input
  - [ ] Button labels describe action

**Test Method**: Review all headings and labels for clarity

- [ ] **2.4.7 Focus Visible (AA)**: Focus indicators are visible
  - [ ] All focusable elements have visible focus indicators
  - [ ] Focus indicators have 2px minimum thickness
  - [ ] Focus indicators meet color contrast requirements

**Test Method**: Navigate with keyboard and verify focus visibility

## Principle 3: Understandable

### 3.1 Readable
- [ ] **3.1.1 Language of Page (A)**: Page language is programmatically determinable
  - [ ] HTML lang attribute set on `<html>` element
  - [ ] Language changes marked with lang attribute

**Test Method**: Verify `<html lang="en">` in page source

- [ ] **3.1.2 Language of Parts (AA)**: Language changes within content are marked
  - [ ] Foreign phrases marked with appropriate lang attribute
  - [ ] Multi-language content properly identified

**Test Method**: Review content for language changes

### 3.2 Predictable
- [ ] **3.2.1 On Focus (A)**: Components don't change context when receiving focus
  - [ ] Focus doesn't trigger unexpected navigation
  - [ ] Focus doesn't open pop-ups automatically
  - [ ] Focus doesn't submit forms automatically

**Test Method**: Tab through interface and verify no unexpected changes

- [ ] **3.2.2 On Input (A)**: Components don't change context when receiving input
  - [ ] Form fields don't submit automatically
  - [ ] Selection doesn't navigate automatically
  - [ ] Input doesn't open unexpected pop-ups

**Test Method**: Interact with all form controls and verify predictable behavior

- [ ] **3.2.3 Consistent Navigation (AA)**: Navigation is consistent across pages
  - [ ] Navigation menus appear in same location
  - [ ] Navigation items appear in same order
  - [ ] Breadcrumbs follow same pattern

**Test Method**: Compare navigation across different pages

- [ ] **3.2.4 Consistent Identification (AA)**: Components with same functionality are identified consistently
  - [ ] Submit buttons use consistent text and styling
  - [ ] Required field indicators are consistent
  - [ ] Error messages use consistent format

**Test Method**: Review component usage across pages

### 3.3 Input Assistance
- [ ] **3.3.1 Error Identification (A)**: Errors are clearly identified
  - [ ] Form validation errors are clearly marked
  - [ ] Error messages describe the problem
  - [ ] Errors are announced to screen readers

**Test Method**: Submit forms with invalid data and verify error handling

- [ ] **3.3.2 Labels or Instructions (A)**: Labels and instructions are provided
  - [ ] All form fields have labels
  - [ ] Required fields are clearly marked
  - [ ] Input format instructions provided where needed
  - [ ] Help text available for complex fields

**Test Method**: Review all forms for proper labeling

- [ ] **3.3.3 Error Suggestion (AA)**: Error messages suggest corrections
  - [ ] Invalid email format suggests correct format
  - [ ] Password errors explain requirements
  - [ ] Date errors suggest correct format

**Test Method**: Test various error conditions and verify helpful messages

- [ ] **3.3.4 Error Prevention (Legal, Financial, Data) (AA)**: Important data changes are confirmable
  - [ ] Form submission has review screen
  - [ ] Critical actions require confirmation
  - [ ] Users can modify data before final submission

**Test Method**: Complete questionnaire and verify review process

## Principle 4: Robust

### 4.1 Compatible
- [ ] **4.1.1 Parsing (A)**: HTML is valid and well-formed
  - [ ] No duplicate IDs on page
  - [ ] Proper opening and closing tags
  - [ ] HTML validates against W3C standards
  - [ ] Attributes are properly quoted

**Test Method**: Validate HTML using W3C Markup Validator

- [ ] **4.1.2 Name, Role, Value (A)**: UI components are properly exposed to assistive technologies
  - [ ] Custom components have appropriate ARIA roles
  - [ ] Form controls have accessible names
  - [ ] Component states are programmatically determinable
  - [ ] Changes to components are announced

**Test Method**: Test with screen reader and accessibility inspector

- [ ] **4.1.3 Status Messages (AA)**: Status changes are announced to assistive technologies
  - [ ] Form save confirmations are announced
  - [ ] Error messages use aria-live regions
  - [ ] Progress updates are announced
  - [ ] Loading states are communicated

**Test Method**: Test with screen reader for status announcements

## Device and Browser Compatibility Testing

### Screen Readers
- [ ] **NVDA (Windows)**: Full questionnaire completion
- [ ] **JAWS (Windows)**: Navigation and form interaction
- [ ] **VoiceOver (macOS)**: Desktop browser testing
- [ ] **VoiceOver (iOS)**: Mobile Safari testing
- [ ] **TalkBack (Android)**: Mobile Chrome testing

### Browsers
- [ ] **Chrome**: Latest version, Windows/Mac/Mobile
- [ ] **Firefox**: Latest version, Windows/Mac
- [ ] **Safari**: Latest version, Mac/iOS
- [ ] **Edge**: Latest version, Windows
- [ ] **Samsung Internet**: Android testing

### Devices
- [ ] **Desktop**: 1920x1080, 1366x768 resolutions
- [ ] **Tablet**: iPad, Android tablets in both orientations
- [ ] **Mobile**: iPhone SE (375px), Android phones (360px)

## Automated Testing Tools

### Required Tools
- [ ] **axe-core**: Automated accessibility scanning
- [ ] **Lighthouse**: Accessibility audit scoring
- [ ] **WAVE**: Web accessibility evaluation
- [ ] **Colour Contrast Analyser**: Manual contrast checking

### Integration Testing
```javascript
// Example automated test
describe('Accessibility Compliance', () => {
  test('should have no axe violations', async () => {
    const results = await axe.run();
    expect(results.violations).toHaveLength(0);
  });
  
  test('should support keyboard navigation', async () => {
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement.tagName);
    expect(focusedElement).toBe('BUTTON');
  });
});
```

## Documentation Requirements
- [ ] **Accessibility Statement**: Published and accessible
- [ ] **User Guide**: Available in multiple formats
- [ ] **Keyboard Shortcuts**: Documented and accessible
- [ ] **Contact Information**: For accessibility feedback

## Success Criteria
- [ ] **Zero critical WCAG violations** detected by automated tools
- [ ] **Successful task completion** by users with disabilities
- [ ] **Positive accessibility feedback** from user testing
- [ ] **Cross-platform compatibility** verified across devices and browsers

## Remediation Process
1. **Identify Issue**: Document WCAG violation and impact
2. **Prioritize**: Critical (blocks access) > Major (impairs access) > Minor (inconvenience)
3. **Fix**: Implement solution following WCAG guidelines
4. **Test**: Verify fix with automated tools and manual testing
5. **Document**: Update this checklist and accessibility statement

## Review Schedule
- [ ] **Pre-deployment**: Complete checklist review
- [ ] **Monthly**: Spot check critical paths
- [ ] **Quarterly**: Full accessibility audit
- [ ] **After updates**: Regression testing for accessibility

This checklist ensures comprehensive WCAG 2.1 AA compliance for the patient portal, providing an accessible experience for all users including those with disabilities.