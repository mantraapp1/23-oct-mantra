/**
 * Language Dropdown Implementation Verification Script
 * 
 * This script verifies that the language dropdown implementation
 * matches the design specifications and requirements.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, checks) {
  log(`\n📄 Checking: ${filePath}`, 'cyan');
  
  if (!fs.existsSync(filePath)) {
    log(`  ❌ File not found!`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  let allPassed = true;
  
  checks.forEach(check => {
    const found = check.pattern.test(content);
    if (found) {
      log(`  ✓ ${check.description}`, 'green');
    } else {
      log(`  ✗ ${check.description}`, 'red');
      allPassed = false;
    }
  });
  
  return allPassed;
}

// Define verification checks
const createNovelChecks = [
  {
    description: 'LANGUAGES constant defined',
    pattern: /const LANGUAGES = \[.*'English'.*'Spanish'.*'French'/s
  },
  {
    description: 'Language state initialized to English',
    pattern: /const \[language, setLanguage\] = useState\('English'\)/
  },
  {
    description: 'showLanguageDropdown state exists',
    pattern: /const \[showLanguageDropdown, setShowLanguageDropdown\] = useState\(false\)/
  },
  {
    description: 'customLanguage state exists',
    pattern: /const \[customLanguage, setCustomLanguage\] = useState\(''\)/
  },
  {
    description: 'Language section has zIndex: 80',
    pattern: /style=\{.*zIndex:\s*80.*\}/s
  },
  {
    description: 'Language dropdown toggle logic',
    pattern: /onPress=\{.*setShowLanguageDropdown\(!showLanguageDropdown\)/s
  },
  {
    description: 'Language validation in validateForm',
    pattern: /if \(!language\).*newErrors\.language/s
  },
  {
    description: 'Custom language validation for "Other"',
    pattern: /if \(language === 'Other' && !customLanguage\.trim\(\)\)/
  },
  {
    description: 'Language saved to database on create',
    pattern: /language:\s*(finalLanguage|language)/
  },
  {
    description: 'Dropdown closes on scroll',
    pattern: /onScroll=\{.*showLanguageDropdown.*setShowLanguageDropdown\(false\)/s
  },
  {
    description: 'Status modal closes language dropdown',
    pattern: /setShowLanguageDropdown\(false\).*setShowStatusModal\(true\)/s
  },
  {
    description: 'Language dropdown has proper styles',
    pattern: /languageDropdown:.*position:\s*'absolute'.*zIndex:\s*1000/s
  },
  {
    description: 'Checkmark icon for selected language',
    pattern: /<Feather name="check".*color=\{colors\.sky500\}/s
  },
  {
    description: 'Custom language input appears for "Other"',
    pattern: /\{language === 'Other' &&/
  },
  {
    description: 'finalLanguage logic for "Other" option',
    pattern: /const finalLanguage = language === 'Other' \? customLanguage\.trim\(\) : language/
  }
];

const editNovelChecks = [
  {
    description: 'LANGUAGES constant defined',
    pattern: /const LANGUAGES = \[.*'English'.*'Spanish'.*'French'/s
  },
  {
    description: 'Language state initialized',
    pattern: /const \[language, setLanguage\] = useState\('English'\)/
  },
  {
    description: 'showLanguageDropdown state exists',
    pattern: /const \[showLanguageDropdown, setShowLanguageDropdown\] = useState\(false\)/
  },
  {
    description: 'customLanguage state exists',
    pattern: /const \[customLanguage, setCustomLanguage\] = useState\(''\)/
  },
  {
    description: 'Language section has zIndex: 80',
    pattern: /style=\{.*zIndex:\s*80.*\}/s
  },
  {
    description: 'Language validation in validateForm',
    pattern: /if \(!language\).*newErrors\.language/s
  },
  {
    description: 'Custom language validation for "Other"',
    pattern: /if \(language === 'Other' && !customLanguage\.trim\(\)\)/
  },
  {
    description: 'Language saved on update',
    pattern: /language:\s*(finalLanguage|language)/
  },
  {
    description: 'Dropdown closes on scroll',
    pattern: /onScroll=\{.*showLanguageDropdown.*setShowLanguageDropdown\(false\)/s
  },
  {
    description: 'Language dropdown has proper styles',
    pattern: /languageDropdown:.*position:\s*'absolute'.*zIndex:\s*1000/s
  },
  {
    description: 'Checkmark icon for selected language',
    pattern: /<Feather name="check".*color=\{colors\.sky500\}/s
  },
  {
    description: 'Custom language input appears for "Other"',
    pattern: /\{language === 'Other' &&/
  },
  {
    description: 'finalLanguage logic for "Other" option',
    pattern: /const finalLanguage = language === 'Other' \? customLanguage\.trim\(\) : language/
  }
];

// Run verification
log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
log('║  Language Dropdown Implementation Verification             ║', 'blue');
log('╚════════════════════════════════════════════════════════════╝', 'blue');

const createNovelPath = path.join(__dirname, 'components', 'screens', 'author', 'CreateNovelScreen.tsx');
const editNovelPath = path.join(__dirname, 'components', 'screens', 'author', 'EditNovelScreen.tsx');

const createNovelPassed = checkFile(createNovelPath, createNovelChecks);
const editNovelPassed = checkFile(editNovelPath, editNovelChecks);

// Summary
log('\n' + '═'.repeat(60), 'blue');
log('VERIFICATION SUMMARY', 'blue');
log('═'.repeat(60), 'blue');

if (createNovelPassed && editNovelPassed) {
  log('\n✅ All checks passed! Implementation is complete.', 'green');
  log('\nNext steps:', 'cyan');
  log('  1. Run the app and perform manual testing', 'cyan');
  log('  2. Follow the LANGUAGE_DROPDOWN_TEST_GUIDE.md', 'cyan');
  log('  3. Verify database integration in Supabase', 'cyan');
  process.exit(0);
} else {
  log('\n⚠️  Some checks failed. Please review the implementation.', 'yellow');
  
  if (!createNovelPassed) {
    log('\n  Issues found in CreateNovelScreen.tsx', 'red');
  }
  if (!editNovelPassed) {
    log('\n  Issues found in EditNovelScreen.tsx', 'red');
  }
  
  log('\nRefer to the design document for implementation details.', 'cyan');
  process.exit(1);
}
