# Accessibility Testing

This document describes the accessibility testing setup for the Guitar Fretboard Flashcard Game.

## Overview

The application has been designed with accessibility in mind to ensure it can be used by blind and visually impaired users. We have implemented comprehensive accessibility features and automated testing to verify these features work correctly.

## Accessibility Features

### 1. Screen Reader Support

- **Semantic HTML**: Proper heading hierarchy (h1, h2, h3)
- **ARIA Labels**: All interactive elements have descriptive labels
- **Live Regions**: Dynamic content changes are announced to screen readers
- **Screen Reader Only Content**: Hidden content for screen readers only

### 2. Keyboard Navigation

- **Skip Links**: Quick navigation to main content
- **Tab Order**: Logical tab sequence through all interactive elements
- **Focus Management**: Clear focus indicators and proper focus handling
- **Keyboard Shortcuts**: Full functionality available via keyboard

### 3. Form Accessibility

- **Proper Labels**: All form controls have associated labels
- **Fieldsets**: Related form controls are grouped with legends
- **Help Text**: Complex controls have descriptive help text
- **Error Handling**: Clear error messages and validation

### 4. Visual Accessibility

- **High Contrast**: Good color contrast ratios
- **Focus Indicators**: Clear visual focus indicators
- **Responsive Design**: Works on various screen sizes
- **Scalable Text**: Text scales with browser zoom

## Testing Tools

### 1. Automated Accessibility Check

We have a custom Node.js script that validates accessibility features:

```bash
npm run test:accessibility
```

This script checks:

- HTML structure and semantics
- ARIA attributes and roles
- Form accessibility
- Keyboard navigation support
- Screen reader compatibility
- CSS accessibility features

### 2. Cypress E2E Tests

Comprehensive end-to-end accessibility tests using Cypress:

```bash
npm run test:e2e
```

The accessibility tests cover:

- Semantic HTML structure validation
- ARIA labels and descriptions
- Keyboard navigation testing
- Form control accessibility
- Screen reader support verification
- Focus management testing

### 3. Manual Testing

For complete accessibility validation, manual testing is recommended:

1. **Screen Reader Testing**:
   - Test with NVDA (Windows)
   - Test with JAWS (Windows)
   - Test with VoiceOver (macOS)
   - Test with Orca (Linux)

2. **Keyboard-Only Testing**:
   - Navigate through the entire app using only the keyboard
   - Verify all functionality is accessible
   - Check tab order is logical

3. **Visual Testing**:
   - Test with high contrast mode
   - Test with browser zoom (up to 200%)
   - Test on different screen sizes

## Test Files

- `test/accessibility-check.js` - Automated accessibility validation
- `cypress/e2e/accessibility.cy.js` - Cypress accessibility tests
- `cypress/support/commands.js` - Custom accessibility testing commands

## Running Tests

### Quick Accessibility Check

```bash
npm run test:accessibility
```

### Full E2E Tests (including accessibility)

```bash
npm run test:e2e
```

### Development with Accessibility Testing

```bash
npm run watch  # Start development server
# In another terminal:
npm run test:accessibility  # Run accessibility checks
```

## Accessibility Standards

The application follows these accessibility standards:

- **WCAG 2.1 AA**: Web Content Accessibility Guidelines Level AA
- **Section 508**: US federal accessibility requirements
- **ARIA 1.1**: Accessible Rich Internet Applications

## Key Accessibility Features Implemented

1. **Skip Navigation**: `Skip to main content` link
2. **Semantic Landmarks**: `main`, `section`, `footer`, `banner`
3. **ARIA Live Regions**: For dynamic content announcements
4. **Form Labels**: All form controls properly labeled
5. **Focus Management**: Clear focus indicators and logical tab order
6. **Screen Reader Support**: Hidden content and proper ARIA attributes
7. **Keyboard Navigation**: Full keyboard accessibility
8. **Error Handling**: Accessible error messages and alerts

## Continuous Integration

Accessibility tests are integrated into the build process:

- Every build runs accessibility checks
- Failed accessibility tests prevent deployment
- Regular accessibility audits are performed

## Contributing

When adding new features:

1. Ensure they are keyboard accessible
2. Add proper ARIA labels and descriptions
3. Test with screen readers
4. Update accessibility tests
5. Verify focus management works correctly

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/TR/wai-aria-practices-1.1/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Keyboard Navigation Testing](https://webaim.org/techniques/keyboard/)
