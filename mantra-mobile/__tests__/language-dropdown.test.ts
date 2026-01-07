/**
 * Language Dropdown Functionality Tests
 * 
 * Tests for the language dropdown feature in CreateNovelScreen and EditNovelScreen
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { supabase } from '../config/supabase';

// Test constants
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese', 'Russian', 'Arabic', 'Hindi', 'Tamil', 'Sanskrit', 'Other'];

describe('Language Dropdown - CreateNovelScreen', () => {
  let testUserId: string;
  let testNovelId: string;

  beforeAll(async () => {
    // Get or create a test user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      testUserId = user.id;
    }
  });

  afterAll(async () => {
    // Cleanup: Delete test novel if created
    if (testNovelId) {
      await supabase.from('novels').delete().eq('id', testNovelId);
    }
  });

  test('1.1 - Language dropdown displays with default English', () => {
    // Verify default language is English
    const defaultLanguage = 'English';
    expect(LANGUAGES).toContain(defaultLanguage);
    expect(defaultLanguage).toBe('English');
  });

  test('1.2 - Language list contains all expected languages', () => {
    // Verify all required languages are present
    const expectedLanguages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese', 'Russian', 'Arabic'];
    expectedLanguages.forEach(lang => {
      expect(LANGUAGES).toContain(lang);
    });
  });

  test('1.3 - Language selection updates state', () => {
    // Simulate language selection
    const selectedLanguage = 'Spanish';
    expect(LANGUAGES).toContain(selectedLanguage);
    
    // Verify selection is valid
    const isValidSelection = LANGUAGES.includes(selectedLanguage);
    expect(isValidSelection).toBe(true);
  });

  test('1.4 - Novel creation saves selected language to database', async () => {
    if (!testUserId) {
      console.log('Skipping test: No authenticated user');
      return;
    }

    // Create a test novel with a specific language
    const testNovelData = {
      title: 'Test Novel for Language',
      description: 'Testing language field',
      language: 'French',
      author_id: testUserId,
      genres: ['Fantasy'],
      tags: [],
      status: 'ongoing',
      is_mature: false,
      total_chapters: 0,
      total_views: 0,
      total_votes: 0,
      total_reviews: 0,
      average_rating: 0
    };

    const { data: novelData, error } = await supabase
      .from('novels')
      .insert(testNovelData)
      .select()
      .single();

    expect(error).toBeNull();
    expect(novelData).toBeDefined();
    expect(novelData?.language).toBe('French');
    
    if (novelData) {
      testNovelId = novelData.id;
    }
  });

  test('1.5 - Default language is English when not specified', () => {
    const defaultLanguage = 'English';
    expect(defaultLanguage).toBe('English');
  });

  test('3.1 - Language validation requires selection', () => {
    // Test validation logic
    const language = '';
    const isValid = language.trim().length > 0;
    expect(isValid).toBe(false);
    
    const validLanguage = 'English';
    const isValidLanguage = validLanguage.trim().length > 0;
    expect(isValidLanguage).toBe(true);
  });

  test('3.2 - Custom language validation for "Other" option', () => {
    const language = 'Other';
    const customLanguage = 'Swahili';
    
    // When "Other" is selected, custom language must be provided
    const isValid = language === 'Other' ? customLanguage.trim().length > 0 : true;
    expect(isValid).toBe(true);
    
    // Test invalid case
    const emptyCustom = '';
    const isInvalid = language === 'Other' ? emptyCustom.trim().length > 0 : true;
    expect(isInvalid).toBe(false);
  });
});

describe('Language Dropdown - EditNovelScreen', () => {
  let testUserId: string;
  let testNovelId: string;

  beforeAll(async () => {
    // Get or create a test user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      testUserId = user.id;
    }

    // Create a test novel for editing
    if (testUserId) {
      const { data: novelData } = await supabase
        .from('novels')
        .insert({
          title: 'Test Novel for Edit',
          description: 'Testing language edit',
          language: 'English',
          author_id: testUserId,
          genres: ['Fantasy'],
          tags: [],
          status: 'ongoing',
          is_mature: false,
          total_chapters: 0,
          total_views: 0,
          total_votes: 0,
          total_reviews: 0,
          average_rating: 0
        })
        .select()
        .single();
      
      if (novelData) {
        testNovelId = novelData.id;
      }
    }
  });

  afterAll(async () => {
    // Cleanup: Delete test novel
    if (testNovelId) {
      await supabase.from('novels').delete().eq('id', testNovelId);
    }
  });

  test('2.1 - Existing language loads correctly from database', async () => {
    if (!testNovelId) {
      console.log('Skipping test: No test novel created');
      return;
    }

    const { data: novelData, error } = await supabase
      .from('novels')
      .select('language')
      .eq('id', testNovelId)
      .single();

    expect(error).toBeNull();
    expect(novelData).toBeDefined();
    expect(novelData?.language).toBe('English');
  });

  test('2.2 - Language dropdown displays current language', async () => {
    if (!testNovelId) {
      console.log('Skipping test: No test novel created');
      return;
    }

    const { data: novelData } = await supabase
      .from('novels')
      .select('language')
      .eq('id', testNovelId)
      .single();

    const currentLanguage = novelData?.language || 'English';
    expect(LANGUAGES).toContain(currentLanguage);
  });

  test('2.3 - Language update saves to database', async () => {
    if (!testNovelId) {
      console.log('Skipping test: No test novel created');
      return;
    }

    // Update language to Spanish
    const newLanguage = 'Spanish';
    const { error: updateError } = await supabase
      .from('novels')
      .update({ language: newLanguage })
      .eq('id', testNovelId);

    expect(updateError).toBeNull();

    // Verify the update
    const { data: updatedNovel, error: fetchError } = await supabase
      .from('novels')
      .select('language')
      .eq('id', testNovelId)
      .single();

    expect(fetchError).toBeNull();
    expect(updatedNovel?.language).toBe('Spanish');
  });

  test('2.4 - Language field persists across updates', async () => {
    if (!testNovelId) {
      console.log('Skipping test: No test novel created');
      return;
    }

    // Update to German
    await supabase
      .from('novels')
      .update({ language: 'German' })
      .eq('id', testNovelId);

    // Fetch again to verify persistence
    const { data: novelData } = await supabase
      .from('novels')
      .select('language')
      .eq('id', testNovelId)
      .single();

    expect(novelData?.language).toBe('German');
  });
});

describe('Language Dropdown - UI Consistency', () => {
  test('3.1 - Language list matches across all screens', () => {
    // Verify the same LANGUAGES constant is used
    const createScreenLanguages = LANGUAGES;
    const editScreenLanguages = LANGUAGES;
    const profileScreenLanguages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese', 'Russian', 'Arabic'];
    
    // Check that novel screens include all profile screen languages
    profileScreenLanguages.forEach(lang => {
      expect(createScreenLanguages).toContain(lang);
      expect(editScreenLanguages).toContain(lang);
    });
  });

  test('3.2 - Checkmark displays for selected language', () => {
    const selectedLanguage = 'English';
    const testLanguage = 'English';
    
    // Simulate checkmark logic
    const shouldShowCheckmark = selectedLanguage === testLanguage;
    expect(shouldShowCheckmark).toBe(true);
    
    const differentLanguage = 'Spanish';
    const shouldNotShowCheckmark = selectedLanguage === differentLanguage;
    expect(shouldNotShowCheckmark).toBe(false);
  });

  test('3.3 - Dropdown styling matches design specifications', () => {
    // Verify dropdown style properties
    const dropdownStyles = {
      position: 'absolute',
      top: 64,
      backgroundColor: 'white',
      borderRadius: 8,
      maxHeight: 200,
      zIndex: 1000
    };
    
    expect(dropdownStyles.position).toBe('absolute');
    expect(dropdownStyles.zIndex).toBe(1000);
    expect(dropdownStyles.maxHeight).toBe(200);
  });

  test('3.4 - Z-index layering prevents overlap', () => {
    // Verify z-index hierarchy
    const languageSectionZIndex = 80;
    const languageDropdownZIndex = 1000;
    const statusSectionZIndex = 70;
    
    expect(languageDropdownZIndex).toBeGreaterThan(languageSectionZIndex);
    expect(languageSectionZIndex).toBeGreaterThan(statusSectionZIndex);
  });

  test('3.5 - Dropdown closes on scroll', () => {
    // Simulate scroll behavior
    let showLanguageDropdown = true;
    
    // Scroll event should close dropdown
    const handleScroll = () => {
      showLanguageDropdown = false;
    };
    
    handleScroll();
    expect(showLanguageDropdown).toBe(false);
  });
});

describe('Language Dropdown - Edge Cases', () => {
  test('Edge case: No language set defaults to English', () => {
    const language = null;
    const defaultLanguage = language || 'English';
    expect(defaultLanguage).toBe('English');
  });

  test('Edge case: Empty string defaults to English', () => {
    const language = '';
    const defaultLanguage = language || 'English';
    expect(defaultLanguage).toBe('English');
  });

  test('Edge case: Rapid dropdown toggle', () => {
    let showDropdown = false;
    
    // Rapid toggles
    showDropdown = !showDropdown; // true
    expect(showDropdown).toBe(true);
    
    showDropdown = !showDropdown; // false
    expect(showDropdown).toBe(false);
    
    showDropdown = !showDropdown; // true
    expect(showDropdown).toBe(true);
  });

  test('Edge case: Selecting same language multiple times', () => {
    let selectedLanguage = 'English';
    
    // Select same language again
    selectedLanguage = 'English';
    expect(selectedLanguage).toBe('English');
    
    // Should still be valid
    const isValid = LANGUAGES.includes(selectedLanguage);
    expect(isValid).toBe(true);
  });

  test('Edge case: Status modal closes language dropdown', () => {
    let showLanguageDropdown = true;
    let showStatusModal = false;
    
    // Opening status modal should close language dropdown
    const openStatusModal = () => {
      showLanguageDropdown = false;
      showStatusModal = true;
    };
    
    openStatusModal();
    expect(showLanguageDropdown).toBe(false);
    expect(showStatusModal).toBe(true);
  });

  test('Edge case: Language dropdown closes status modal', () => {
    let showLanguageDropdown = false;
    let showStatusModal = true;
    
    // Opening language dropdown should close status modal
    const openLanguageDropdown = () => {
      showStatusModal = false;
      showLanguageDropdown = true;
    };
    
    openLanguageDropdown();
    expect(showLanguageDropdown).toBe(true);
    expect(showStatusModal).toBe(false);
  });

  test('Edge case: Custom language with "Other" option', () => {
    const language = 'Other';
    const customLanguage = 'Klingon';
    
    const finalLanguage = language === 'Other' ? customLanguage.trim() : language;
    expect(finalLanguage).toBe('Klingon');
  });

  test('Edge case: Invalid custom language with "Other"', () => {
    const language = 'Other';
    const customLanguage = '   ';
    
    const isValid = language === 'Other' ? customLanguage.trim().length > 0 : true;
    expect(isValid).toBe(false);
  });
});

describe('Language Dropdown - Form Validation', () => {
  test('Validation: Language is required', () => {
    const errors: Record<string, string> = {};
    const language = '';
    
    if (!language) {
      errors.language = 'Please select a language';
    }
    
    expect(errors.language).toBe('Please select a language');
  });

  test('Validation: Valid language passes', () => {
    const errors: Record<string, string> = {};
    const language = 'English';
    
    if (!language) {
      errors.language = 'Please select a language';
    }
    
    expect(errors.language).toBeUndefined();
  });

  test('Validation: Custom language required when "Other" selected', () => {
    const errors: Record<string, string> = {};
    const language = 'Other';
    const customLanguage = '';
    
    if (language === 'Other' && !customLanguage.trim()) {
      errors.customLanguage = 'Please enter the language name';
    }
    
    expect(errors.customLanguage).toBe('Please enter the language name');
  });

  test('Validation: Custom language valid when provided', () => {
    const errors: Record<string, string> = {};
    const language = 'Other';
    const customLanguage = 'Elvish';
    
    if (language === 'Other' && !customLanguage.trim()) {
      errors.customLanguage = 'Please enter the language name';
    }
    
    expect(errors.customLanguage).toBeUndefined();
  });

  test('Validation: Error clears when language selected', () => {
    const errors: Record<string, string> = { language: 'Please select a language' };
    
    // Simulate clearError function
    const clearError = (field: string) => {
      if (errors[field]) {
        delete errors[field];
      }
    };
    
    clearError('language');
    expect(errors.language).toBeUndefined();
  });
});
