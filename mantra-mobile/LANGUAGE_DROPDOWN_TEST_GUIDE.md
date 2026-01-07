# Language Dropdown Testing Guide

This guide provides comprehensive manual testing instructions for the language dropdown feature in CreateNovelScreen and EditNovelScreen.

## Test Coverage

This testing guide covers all requirements:
- **Requirements 1.1-1.5**: CreateNovelScreen language selection and database save
- **Requirements 2.1-2.4**: EditNovelScreen language loading and update
- **Requirements 3.1-3.5**: UI consistency with EditProfileScreen
- **Requirements 4.1-4.4**: Database integration

---

## Prerequisites

1. Ensure the app is running: `npm start`
2. Have a test user account logged in
3. Have access to Supabase dashboard to verify database changes

---

## Test Suite 1: CreateNovelScreen Language Selection

### Test 1.1: Language Dropdown Displays with Default English
**Requirement**: 1.1, 1.5

**Steps**:
1. Navigate to Author Dashboard
2. Tap "Create Novel" button
3. Scroll to the Language section

**Expected Result**:
- ✓ Language dropdown displays "English" as default value
- ✓ Language field is marked with asterisk (*) indicating required field

**Status**: [ ] Pass [ ] Fail

---

### Test 1.2: Language Dropdown Opens and Displays All Languages
**Requirement**: 1.2, 3.3

**Steps**:
1. On Create Novel screen, tap the Language dropdown
2. Observe the dropdown list

**Expected Result**:
- ✓ Dropdown opens with smooth animation
- ✓ All languages are visible: English, Spanish, French, German, Chinese, Japanese, Korean, Portuguese, Russian, Arabic, Hindi, Tamil, Sanskrit, Other
- ✓ Dropdown is scrollable if needed
- ✓ Dropdown has proper shadow/elevation
- ✓ Dropdown appears above other UI elements (z-index: 1000)

**Status**: [ ] Pass [ ] Fail

---

### Test 1.3: Language Selection Updates Display
**Requirement**: 1.3, 3.2

**Steps**:
1. Open Language dropdown
2. Select "Spanish" from the list
3. Observe the changes

**Expected Result**:
- ✓ Checkmark (✓) appears next to "Spanish"
- ✓ Dropdown closes automatically
- ✓ Language field now displays "Spanish"
- ✓ No error message appears

**Status**: [ ] Pass [ ] Fail

---

### Test 1.4: Novel Creation Saves Selected Language
**Requirement**: 1.4, 4.1

**Steps**:
1. Fill in all required fields (cover image, title, description, genres)
2. Select "French" as the language
3. Tap "Create" button
4. Wait for success message
5. Check Supabase dashboard: `novels` table, find the created novel

**Expected Result**:
- ✓ Novel creates successfully
- ✓ Success toast appears: "✓ Novel created successfully!"
- ✓ In Supabase, the `language` column shows "French"
- ✓ Navigation goes to Novel Manage screen

**Status**: [ ] Pass [ ] Fail

---

### Test 1.5: Custom Language with "Other" Option
**Requirement**: 1.4, 3.1

**Steps**:
1. On Create Novel screen, select "Other" from language dropdown
2. Observe the UI changes
3. Enter "Swahili" in the custom language input field
4. Complete the form and create the novel
5. Check database

**Expected Result**:
- ✓ Custom language input field appears below dropdown
- ✓ Input field has placeholder "Enter language name"
- ✓ Novel saves with language value "Swahili" (not "Other")
- ✓ Database shows "Swahili" in language column

**Status**: [ ] Pass [ ] Fail

---

## Test Suite 2: EditNovelScreen Language Loading and Update

### Test 2.1: Existing Language Loads Correctly
**Requirement**: 2.1, 4.2

**Steps**:
1. Create a novel with language set to "German"
2. Navigate to Novel Manage screen
3. Tap "Edit Novel Info"
4. Scroll to Language section

**Expected Result**:
- ✓ Language dropdown displays "German"
- ✓ No loading errors
- ✓ Language field is populated correctly

**Status**: [ ] Pass [ ] Fail

---

### Test 2.2: Language Dropdown Shows Current Selection
**Requirement**: 2.2, 3.2

**Steps**:
1. On Edit Novel screen with language "German"
2. Tap the Language dropdown
3. Observe the list

**Expected Result**:
- ✓ Dropdown opens
- ✓ Checkmark (✓) appears next to "German"
- ✓ All other languages are visible without checkmarks

**Status**: [ ] Pass [ ] Fail

---

### Test 2.3: Language Update Saves to Database
**Requirement**: 2.3, 4.3

**Steps**:
1. On Edit Novel screen, open Language dropdown
2. Select "Japanese"
3. Tap "Save Changes" button
4. Wait for success message
5. Check Supabase dashboard

**Expected Result**:
- ✓ Success toast appears: "✓ Saved successfully!"
- ✓ Screen navigates back
- ✓ In Supabase, the `language` column is updated to "Japanese"

**Status**: [ ] Pass [ ] Fail

---

### Test 2.4: Language Persists After Multiple Updates
**Requirement**: 2.4, 4.4

**Steps**:
1. Edit a novel and change language to "Korean"
2. Save changes
3. Go back and edit the same novel again
4. Verify language shows "Korean"
5. Change to "Portuguese"
6. Save and verify again

**Expected Result**:
- ✓ Language shows "Korean" on second edit
- ✓ Language updates to "Portuguese" successfully
- ✓ Each change persists in database
- ✓ No data loss between edits

**Status**: [ ] Pass [ ] Fail

---

## Test Suite 3: UI Consistency with EditProfileScreen

### Test 3.1: Visual Styling Matches
**Requirement**: 3.1

**Steps**:
1. Navigate to Profile > Edit Profile
2. Observe the Language dropdown styling
3. Navigate to Create Novel screen
4. Compare Language dropdown styling
5. Navigate to Edit Novel screen
6. Compare Language dropdown styling

**Expected Result**:
- ✓ All three dropdowns have identical visual appearance
- ✓ Same border radius (8px)
- ✓ Same padding (12px horizontal, 10px vertical)
- ✓ Same font size (14px)
- ✓ Same colors (slate200 border, white background)
- ✓ Same chevron-down icon

**Status**: [ ] Pass [ ] Fail

---

### Test 3.2: Checkmark Icon Consistency
**Requirement**: 3.2

**Steps**:
1. Open language dropdown in EditProfileScreen
2. Note the checkmark appearance
3. Open language dropdown in CreateNovelScreen
4. Compare checkmark appearance
5. Open language dropdown in EditNovelScreen
6. Compare checkmark appearance

**Expected Result**:
- ✓ Checkmark icon is identical across all screens
- ✓ Uses Feather "check" icon
- ✓ Size is 20px (EditProfile: 16px, Novel screens: 20px - acceptable variation)
- ✓ Color is sky500 (#0ea5e9)
- ✓ Positioned on the right side

**Status**: [ ] Pass [ ] Fail

---

### Test 3.3: Language List Consistency
**Requirement**: 3.3

**Steps**:
1. Compare language lists across all three screens
2. Verify order and content

**Expected Result**:
- ✓ EditProfileScreen has: English, Spanish, French, German, Chinese, Japanese, Korean, Portuguese, Russian, Arabic
- ✓ CreateNovelScreen has all EditProfile languages PLUS: Hindi, Tamil, Sanskrit, Other
- ✓ EditNovelScreen has same list as CreateNovelScreen
- ✓ Order is consistent

**Status**: [ ] Pass [ ] Fail

---

### Test 3.4: Z-Index Layering
**Requirement**: 3.4

**Steps**:
1. On Create Novel screen, scroll to Status and Language sections
2. Open Status modal
3. Observe layering
4. Close Status modal
5. Open Language dropdown
6. Observe layering

**Expected Result**:
- ✓ Language section has zIndex: 80
- ✓ Status section has zIndex: 70
- ✓ Language dropdown has zIndex: 1000
- ✓ Language dropdown appears above Status section
- ✓ No visual overlap or clipping issues

**Status**: [ ] Pass [ ] Fail

---

### Test 3.5: Dropdown Closes on Scroll
**Requirement**: 3.5

**Steps**:
1. On Create Novel screen, open Language dropdown
2. Scroll the main content up or down
3. Observe dropdown behavior

**Expected Result**:
- ✓ Dropdown closes immediately when scrolling starts
- ✓ No visual glitches
- ✓ Dropdown can be reopened after scrolling

**Status**: [ ] Pass [ ] Fail

---

## Test Suite 4: Dropdown Interactions

### Test 4.1: Status Modal Closes Language Dropdown
**Requirement**: 3.5

**Steps**:
1. Open Language dropdown
2. Tap Status dropdown (without closing language first)
3. Observe behavior

**Expected Result**:
- ✓ Language dropdown closes automatically
- ✓ Status modal opens
- ✓ No overlap between the two

**Status**: [ ] Pass [ ] Fail

---

### Test 4.2: Language Dropdown Closes Status Modal
**Requirement**: 3.5

**Steps**:
1. Open Status modal
2. Tap Language dropdown (without closing status first)
3. Observe behavior

**Expected Result**:
- ✓ Status modal closes automatically
- ✓ Language dropdown opens
- ✓ No overlap between the two

**Status**: [ ] Pass [ ] Fail

---

## Test Suite 5: Form Validation

### Test 5.1: Language Required Validation
**Requirement**: 1.4, 3.1

**Steps**:
1. On Create Novel screen, fill all fields EXCEPT language
2. Manually clear the language field (if possible via state manipulation)
3. Tap "Create" button

**Expected Result**:
- ✓ Error toast appears: "Please select a language"
- ✓ Red border appears around language dropdown
- ✓ Error text appears below dropdown
- ✓ Novel is not created

**Status**: [ ] Pass [ ] Fail

---

### Test 5.2: Custom Language Validation
**Requirement**: 1.4

**Steps**:
1. Select "Other" from language dropdown
2. Leave custom language input empty
3. Try to create novel

**Expected Result**:
- ✓ Error appears: "Please enter the language name"
- ✓ Red border on custom language input
- ✓ Novel is not created

**Status**: [ ] Pass [ ] Fail

---

### Test 5.3: Error Clears on Valid Selection
**Requirement**: 3.1

**Steps**:
1. Trigger language validation error
2. Select a valid language from dropdown
3. Observe error state

**Expected Result**:
- ✓ Error message disappears
- ✓ Red border is removed
- ✓ Field returns to normal state

**Status**: [ ] Pass [ ] Fail

---

## Test Suite 6: Edge Cases

### Test 6.1: No Language Set (Null/Undefined)
**Requirement**: 1.5

**Steps**:
1. Create a novel via direct database insert with `language: null`
2. Open Edit Novel screen for that novel
3. Observe language field

**Expected Result**:
- ✓ Language field displays "English" (fallback)
- ✓ No errors or crashes
- ✓ Can select and save a different language

**Status**: [ ] Pass [ ] Fail

---

### Test 6.2: Rapid Dropdown Toggle
**Requirement**: 3.5

**Steps**:
1. Rapidly tap Language dropdown 5-10 times in quick succession
2. Observe behavior

**Expected Result**:
- ✓ Dropdown opens and closes smoothly
- ✓ No visual glitches
- ✓ No crashes or freezes
- ✓ Final state is consistent (either open or closed)

**Status**: [ ] Pass [ ] Fail

---

### Test 6.3: Selecting Same Language Multiple Times
**Requirement**: 1.3

**Steps**:
1. Select "English" from dropdown
2. Open dropdown again
3. Select "English" again
4. Repeat 2-3 times

**Expected Result**:
- ✓ No errors occur
- ✓ Dropdown closes each time
- ✓ Language remains "English"
- ✓ Checkmark always appears next to English

**Status**: [ ] Pass [ ] Fail

---

### Test 6.4: Long Custom Language Name
**Requirement**: 1.4

**Steps**:
1. Select "Other" from dropdown
2. Enter a very long language name (50+ characters)
3. Create/save novel

**Expected Result**:
- ✓ Long name is accepted
- ✓ Text doesn't overflow UI
- ✓ Saves successfully to database
- ✓ Displays correctly when loaded

**Status**: [ ] Pass [ ] Fail

---

### Test 6.5: Special Characters in Custom Language
**Requirement**: 1.4

**Steps**:
1. Select "Other" from dropdown
2. Enter language with special characters: "中文 (Chinese)"
3. Create/save novel

**Expected Result**:
- ✓ Special characters are accepted
- ✓ Saves correctly to database
- ✓ Displays correctly when loaded
- ✓ No encoding issues

**Status**: [ ] Pass [ ] Fail

---

### Test 6.6: Switching from "Other" to Standard Language
**Requirement**: 1.3

**Steps**:
1. Select "Other" from dropdown
2. Enter "Klingon" in custom field
3. Open dropdown again and select "English"
4. Observe custom field

**Expected Result**:
- ✓ Custom language input field disappears
- ✓ Custom language value is cleared
- ✓ "English" is selected
- ✓ No validation errors

**Status**: [ ] Pass [ ] Fail

---

## Test Suite 7: Database Integration

### Test 7.1: Language Column Exists
**Requirement**: 4.1

**Steps**:
1. Open Supabase dashboard
2. Navigate to Table Editor > novels table
3. Check columns

**Expected Result**:
- ✓ `language` column exists
- ✓ Column type is `text` or `varchar`
- ✓ Column accepts string values

**Status**: [ ] Pass [ ] Fail

---

### Test 7.2: Language Saves on Create
**Requirement**: 4.1

**Steps**:
1. Create a novel with language "Arabic"
2. Check Supabase dashboard immediately after creation

**Expected Result**:
- ✓ New row appears in novels table
- ✓ `language` column shows "Arabic"
- ✓ Value is not null or empty

**Status**: [ ] Pass [ ] Fail

---

### Test 7.3: Language Updates on Edit
**Requirement**: 4.3

**Steps**:
1. Edit an existing novel
2. Change language from "English" to "Hindi"
3. Save changes
4. Check Supabase dashboard

**Expected Result**:
- ✓ Row is updated (not duplicated)
- ✓ `language` column shows "Hindi"
- ✓ `updated_at` timestamp is updated (if column exists)

**Status**: [ ] Pass [ ] Fail

---

### Test 7.4: Language Persists Across App Restarts
**Requirement**: 4.4

**Steps**:
1. Create a novel with language "Tamil"
2. Close the app completely
3. Reopen the app
4. Navigate to Edit Novel screen for that novel

**Expected Result**:
- ✓ Language still shows "Tamil"
- ✓ No data loss
- ✓ Can still update language

**Status**: [ ] Pass [ ] Fail

---

## Test Suite 8: Accessibility and UX

### Test 8.1: Touch Target Size
**Steps**:
1. Measure the tappable area of language dropdown
2. Measure the tappable area of dropdown options

**Expected Result**:
- ✓ Dropdown button is at least 44x44 points (iOS guideline)
- ✓ Each dropdown option is at least 44 points tall
- ✓ Easy to tap without mistakes

**Status**: [ ] Pass [ ] Fail

---

### Test 8.2: Keyboard Dismissal
**Steps**:
1. Focus on Title or Description field (keyboard open)
2. Tap Language dropdown

**Expected Result**:
- ✓ Keyboard dismisses
- ✓ Dropdown opens
- ✓ No overlap between keyboard and dropdown

**Status**: [ ] Pass [ ] Fail

---

### Test 8.3: Dropdown Scrollability
**Steps**:
1. Open Language dropdown
2. Try to scroll through all languages

**Expected Result**:
- ✓ Dropdown scrolls smoothly
- ✓ All 14 languages are accessible
- ✓ Scroll indicator appears (if needed)
- ✓ maxHeight: 200 is respected

**Status**: [ ] Pass [ ] Fail

---

## Summary

### Test Results Overview

| Test Suite | Total Tests | Passed | Failed |
|------------|-------------|--------|--------|
| 1. CreateNovelScreen | 5 | | |
| 2. EditNovelScreen | 4 | | |
| 3. UI Consistency | 5 | | |
| 4. Dropdown Interactions | 2 | | |
| 5. Form Validation | 3 | | |
| 6. Edge Cases | 6 | | |
| 7. Database Integration | 4 | | |
| 8. Accessibility | 3 | | |
| **TOTAL** | **32** | | |

### Critical Issues Found
(List any critical issues discovered during testing)

1. 
2. 
3. 

### Minor Issues Found
(List any minor issues discovered during testing)

1. 
2. 
3. 

### Recommendations
(List any recommendations for improvements)

1. 
2. 
3. 

---

## Testing Checklist

- [ ] All 32 tests completed
- [ ] Database verified for all create/update operations
- [ ] UI consistency verified across all three screens
- [ ] Edge cases tested thoroughly
- [ ] No crashes or errors encountered
- [ ] Performance is acceptable (no lag when opening dropdown)
- [ ] Ready for production deployment

---

## Notes

**Tester Name**: _______________
**Date**: _______________
**App Version**: _______________
**Device/Emulator**: _______________
**OS Version**: _______________

**Additional Comments**:
