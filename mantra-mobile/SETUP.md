# Mantra Mobile - Setup Instructions

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Expo Go app on your mobile device (iOS or Android)

## Installation Steps

### 1. Install Dependencies

```bash
cd mantra-mobile
npm install
```

This will install all required packages including:
- React Navigation
- Expo Vector Icons
- React Native Safe Area Context
- React Native Gesture Handler
- And more...

### 2. Start the Development Server

```bash
npm start
```

Or use:
```bash
npx expo start
```

### 3. Run on Your Device

Once the development server starts, you'll see a QR code in your terminal.

**On iOS:**
- Open the Camera app
- Scan the QR code
- Tap the notification to open in Expo Go

**On Android:**
- Open the Expo Go app
- Tap "Scan QR Code"
- Scan the QR code from your terminal

### 4. Alternative: Run on Emulator/Simulator

**iOS Simulator (Mac only):**
```bash
npm run ios
```

**Android Emulator:**
```bash
npm run android
```

## App Flow

1. **Splash Screen** (3.5 seconds) - Shows Mantra logo with animated loading dots
2. **Login Screen** - Enter credentials to login
   - Test credentials: `test@example.com` / `password123`
   - Or: `user@mantra.com` / `demo1234`
3. **Main App** - Bottom tab navigation with Home, Rankings, Library, Profile

## Troubleshooting

### Issue: Splash screen stuck

**Solution:** Clear the cache and restart:
```bash
npx expo start --clear
```

### Issue: Module not found errors

**Solution:** Reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

### Issue: Can't connect to development server

**Solution:** Make sure your phone and computer are on the same WiFi network.

### Issue: Assets not loading

**Solution:** Make sure the `assets` folder exists with:
- `Mantra logo.jpeg`
- `Splash background.jpg`

## Current Features

✅ Splash screen with animations
✅ Login screen with validation
✅ Toast notifications
✅ Bottom tab navigation
✅ Reusable components (NovelCard, FormInput, etc.)
✅ Type-safe navigation
✅ Constants for consistent styling

## Next Steps

Continue implementing remaining screens:
- Sign Up
- Password Reset
- Home Screen (with novel listings)
- Novel Detail
- Chapter Reading
- And 35+ more screens...

## Need Help?

Check the main README.md for more details about the project structure and architecture.
