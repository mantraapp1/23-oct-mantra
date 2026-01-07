# Quick Start Guide

## Run the App in 3 Steps

### Step 1: Install Dependencies
```bash
cd mantra-mobile
npm install
```

### Step 2: Start Development Server
```bash
npm start
```

### Step 3: Open on Your Phone
- Scan the QR code with Expo Go app
- Wait for the app to load

## What You'll See

1. **Splash Screen** (3.5 seconds)
   - Mantra logo
   - Animated loading dots
   - Blurred background

2. **Login Screen**
   - Email and password fields
   - Test login: `test@example.com` / `password123`
   - Click "Login" button

3. **Main App**
   - Bottom tabs: Home, Rankings, Library, Profile
   - Currently showing placeholder screens

## Test the App

### Test Login
1. Enter email: `test@example.com`
2. Enter password: `password123`
3. Click "Login"
4. You should see a success toast and navigate to Home

### Test Invalid Login
1. Enter wrong credentials
2. Click "Login"
3. You should see an error toast

## Common Issues

**Splash screen not transitioning?**
- Check console for errors
- Try: `npx expo start --clear`

**Can't see the app?**
- Make sure phone and computer are on same WiFi
- Check firewall settings

**Module errors?**
- Run: `rm -rf node_modules && npm install`

## Need More Help?

See SETUP.md for detailed instructions.
