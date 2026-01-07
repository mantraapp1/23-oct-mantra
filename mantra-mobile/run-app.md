# Run Mantra Mobile App

## First Time Setup

```bash
# Navigate to the project
cd mantra-mobile

# Install all dependencies
npm install

# Start the app
npm start
```

## Daily Development

```bash
# Just start the app
npm start
```

## Clear Cache (if issues occur)

```bash
# Clear cache and restart
npx expo start --clear
```

## What Happens When You Run

1. **Terminal shows:**
   - QR code
   - Development server URL
   - Options to open on iOS/Android

2. **On your phone:**
   - Open Expo Go app
   - Scan QR code
   - App loads and shows splash screen
   - After 3.5 seconds → Login screen
   - Login with test credentials → Main app

## Test Credentials

- Email: `test@example.com`
- Password: `password123`

OR

- Email: `user@mantra.com`
- Password: `demo1234`

## Current App Structure

```
Splash (3.5s)
    ↓
Login Screen
    ↓
Main App (Bottom Tabs)
    ├── Home (placeholder)
    ├── Rankings (placeholder)
    ├── Library (placeholder)
    └── Profile (placeholder)
```

## Troubleshooting

### Splash screen stuck?
The splash screen should automatically transition after 3.5 seconds. If it doesn't:
1. Check terminal for errors
2. Try: `npx expo start --clear`
3. Reload app on phone (shake device → Reload)

### Login not working?
1. Make sure you're using correct test credentials
2. Check if toast notifications appear
3. Look for errors in terminal

### Can't connect?
1. Ensure phone and computer on same WiFi
2. Check firewall isn't blocking port 8081
3. Try tunnel mode: `npx expo start --tunnel`

## Next Steps

Once the app is running, you can:
1. Test the login flow
2. Navigate between tabs
3. See toast notifications
4. Continue building remaining screens

Happy coding! 🚀
