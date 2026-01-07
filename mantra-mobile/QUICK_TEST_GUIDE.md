# Quick Test Guide - Signup Flow

## 🚀 Quick Start (No Email Setup Required)

### Step 1: Disable Email Verification in Supabase

1. Go to: https://supabase.com/dashboard/project/hiposzbsobvhkgylmeyy/auth/providers
2. Click **Authentication** → **Settings** → **Email Auth**
3. Turn **OFF** "Enable email confirmations"
4. Click **Save**

### Step 2: Update Database

Run this in Supabase SQL Editor:
```sql
UPDATE admin_config 
SET config_value = 'false'
WHERE config_key = 'require_email_verification';
```

### Step 3: Test the App

1. Start your app:
   ```bash
   cd mantra-mobile
   npm start
   ```

2. Open the app on your device/emulator

3. Go to Sign Up screen

4. Fill in:
   - Username: `testuser123`
   - Email: `test@example.com`
   - Password: `password123`

5. Click **Sign Up**

6. **Expected Result:** 
   - ✅ Account created
   - ✅ Goes directly to Onboarding screen
   - ✅ No email verification needed

## 📧 Test with Email Verification (Later)

### Step 1: Configure SMTP

Follow the guide in: `supabase-backend/email-templates-resend.md`

### Step 2: Enable Email Verification

1. Go to Supabase Dashboard
2. Turn **ON** "Enable email confirmations"
3. Update database:
   ```sql
   UPDATE admin_config 
   SET config_value = 'true'
   WHERE config_key = 'require_email_verification';
   ```

### Step 3: Test

1. Sign up with a real email
2. **Expected:** Goes to Email Verification screen
3. Check your email for 6-digit code
4. Enter code
5. **Expected:** Goes to Onboarding screen

## ✅ What to Check

### Signup Screen:
- [ ] Username availability check works
- [ ] Email validation works
- [ ] Password validation works
- [ ] Loading spinner shows during signup
- [ ] Success toast appears
- [ ] Navigates to correct screen

### Email Verification Screen (if enabled):
- [ ] Shows correct email address
- [ ] OTP input works
- [ ] Auto-focus next input
- [ ] Resend button works
- [ ] Verification succeeds
- [ ] Navigates to Onboarding

### Onboarding Screen:
- [ ] Loads after signup/verification
- [ ] Can complete onboarding
- [ ] Navigates to Home

## 🐛 Common Issues

### "Email confirmations are required"
- **Fix:** Disable email confirmations in Supabase Dashboard

### "Username already taken"
- **Fix:** Use a different username

### "Invalid email format"
- **Fix:** Use a valid email format (test@example.com)

### "Password must contain both letters and numbers"
- **Fix:** Use a password like `password123`

### App crashes on signup
- **Fix:** Check console logs, ensure Supabase is configured correctly

## 📱 Test Accounts

You can use these for testing:

```
Username: testuser1
Email: test1@example.com
Password: test123

Username: testuser2
Email: test2@example.com
Password: test123

Username: testuser3
Email: test3@example.com
Password: test123
```

## 🔍 Debugging

### Check Logs:
```bash
# In terminal where you ran npm start
# Look for console.log messages from SignUpScreen
```

### Check Supabase:
1. Go to: https://supabase.com/dashboard/project/hiposzbsobvhkgylmeyy/auth/users
2. See if user was created
3. Check if email_confirmed_at is set

### Check Database:
```sql
-- Check if profile was created
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;

-- Check if wallet was created
SELECT * FROM wallets ORDER BY created_at DESC LIMIT 5;

-- Check admin config
SELECT * FROM admin_config WHERE config_key = 'require_email_verification';
```

## ✨ Success Criteria

Your signup flow is working correctly if:

1. ✅ User can signup with valid credentials
2. ✅ Profile is created in database
3. ✅ Wallet is created for user
4. ✅ Navigates to Onboarding (email verification disabled)
5. ✅ OR navigates to Email Verification (email verification enabled)
6. ✅ After verification, goes to Onboarding
7. ✅ No crashes or errors

---

**Ready to test!** 🎉

Start with email verification disabled for quick testing, then enable it later for production.
