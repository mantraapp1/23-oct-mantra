# Home Screen Header Implementation

## Overview
The HomeScreen header has been updated to match the design from `mantra/home screen header.html` exactly.

## What Was Implemented

### New Component: `AppHeader`
Location: `mantra-mobile/components/common/AppHeader.tsx`

**Features:**
- ✅ Glassy translucent background with border
- ✅ Mantra logo and brand name
- ✅ Search button (navigates to RecentSearch screen)
- ✅ Notification bell with unread indicator dot (navigates to Notification screen)
- ✅ Language selector dropdown (EN, HI, ES)
- ✅ iOS safe area and notch support
- ✅ Persistent language preference using AsyncStorage
- ✅ Persistent notification status
- ✅ Full navigation integration

### Design Details

**Header Structure:**
1. **Brand Section** - Logo + "Mantra" text
2. **Action Buttons:**
   - Search icon (navigates to RecentSearch screen)
   - Notification bell (navigates to Notification screen, with red dot indicator)
   - Language selector (globe icon + language code + dropdown)

**Language Dropdown:**
- Full-screen modal overlay with semi-transparent background
- Centered modal with scrollable language list
- 12 languages supported:
  - English (EN)
  - हिन्दी / Hindi (HI)
  - Español / Spanish (ES)
  - Français / French (FR)
  - Deutsch / German (DE)
  - Português / Portuguese (PT)
  - Русский / Russian (RU)
  - 日本語 / Japanese (JA)
  - 한국어 / Korean (KO)
  - 中文 / Chinese (ZH)
  - العربية / Arabic (AR)
  - Italiano / Italian (IT)
- Saves preference to AsyncStorage
- Shows checkmark for selected language
- Consistent with app's modal design pattern

**Styling:**
- Background: `rgba(255, 255, 255, 0.85)` with backdrop blur effect
- Border: 1px solid slate-200
- Subtle shadow on iOS/elevation on Android
- All buttons have hover/active states
- Rounded corners matching design system

## Integration

The `AppHeader` component is now integrated into `HomeScreen.tsx`:

```tsx
<View style={styles.container}>
  <AppHeader
    onSearchPress={handleSearchFocus}
    onNotificationPress={() => navigation.navigate('Notification')}
  />
  
  <ScrollView contentContainerStyle={styles.contentContainer}>
    {/* Rest of home screen content */}
  </ScrollView>
</View>
```

## Navigation

The header handles navigation to:
- `RecentSearch` - When search icon is pressed
- `Notification` - When notification bell is pressed
- `Main` - When logo/brand is pressed

## Storage Keys

- `mantra_lang` - Stores selected language code
- `mantra_notif_seen` - Tracks if notifications have been viewed

## Usage in Other Screens

The `AppHeader` component can be reused in other screens:

```tsx
import { AppHeader } from './common';

<AppHeader 
  onSearchPress={() => {/* custom handler */}}
  onNotificationPress={() => {/* custom handler */}}
/>
```

Both props are optional and have default behaviors.
