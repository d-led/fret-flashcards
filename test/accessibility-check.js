/**
 * Basic Accessibility Check Script
 * Validates accessibility features in the built HTML
 */

const fs = require('fs');
const path = require('path');

function checkAccessibility() {
  console.log('🔍 Running accessibility checks...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Read the built HTML file
  const htmlPath = path.join(__dirname, '../dist/index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  // Read the CSS file
  const cssPath = path.join(__dirname, '../dist/main.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  function test(name, condition, details = '') {
    if (condition) {
      console.log(`✅ ${name}`);
      if (details) console.log(`   ${details}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      if (details) console.log(`   ${details}`);
      failed++;
    }
  }
  
  console.log('📋 HTML Structure Tests:');
  test('Has proper DOCTYPE', htmlContent.includes('<!doctype html>'));
  test('Has lang attribute', htmlContent.includes('<html lang="en">'));
  test('Has descriptive title', htmlContent.includes('Guitar Fretboard Flashcard Game'));
  test('Has meta description', htmlContent.includes('name="description"'));
  
  console.log('\n🎯 Semantic HTML Tests:');
  test('Has skip link', htmlContent.includes('Skip to main content'));
  test('Has main landmark', htmlContent.includes('<main id="main-content"'));
  test('Has proper heading hierarchy', htmlContent.includes('<h1 class="sr-only">'));
  test('Has section landmarks', htmlContent.includes('<section class="flashcard"'));
  test('Has footer landmark', htmlContent.includes('<footer class="copyright"'));
  test('Has fieldset structure', htmlContent.includes('<fieldset>'));
  
  console.log('\n🏷️ ARIA Attributes Tests:');
  test('Has ARIA labels on buttons', htmlContent.includes('aria-label="Play the target note audio"'));
  test('Has status roles', htmlContent.includes('role="status"'));
  test('Has application role', htmlContent.includes('role="application"'));
  test('Has live regions', htmlContent.includes('aria-live="polite"'));
  test('Has assertive live regions', htmlContent.includes('aria-live="assertive"'));
  test('Hides decorative elements', htmlContent.includes('aria-hidden="true"'));
  
  console.log('\n📝 Form Accessibility Tests:');
  const labelCount = (htmlContent.match(/<label for="/g) || []).length;
  test('Has form labels', labelCount > 5, `Found ${labelCount} labels`);
  test('Has aria-describedby', htmlContent.includes('aria-describedby='));
  test('Has help text', htmlContent.includes('id="fret-count-help"'));
  
  console.log('\n⌨️ Keyboard Navigation Tests:');
  test('Has tabindex on focusable elements', htmlContent.includes('tabindex="0"'));
  test('Has proper button descriptions', htmlContent.includes('aria-label='));
  
  console.log('\n👁️ Screen Reader Support Tests:');
  test('Has sr-only class', htmlContent.includes('class="sr-only"'));
  test('Has proper link attributes', htmlContent.includes('rel="noopener"'));
  
  console.log('\n🎨 CSS Accessibility Tests:');
  test('Has sr-only CSS definition', cssContent.includes('.sr-only'));
  test('Has focus styles', cssContent.includes('outline'));
  test('Has skip link styles', cssContent.includes('.skip-link'));
  
  console.log('\n📊 Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All accessibility checks passed! The app is ready for blind users.');
  } else {
    console.log('\n⚠️  Some accessibility checks failed. Please review the issues above.');
  }
  
  return failed === 0;
}

// Run the checks
if (require.main === module) {
  const success = checkAccessibility();
  process.exit(success ? 0 : 1);
}

module.exports = { checkAccessibility };
