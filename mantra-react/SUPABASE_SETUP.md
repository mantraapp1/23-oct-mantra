# Supabase Configuration for Email OTP

To make the 6-digit OTP verification work, you must configure your Supabase project correctly.

## 1. Enable Email Provider
- Go to your Supabase Project Dashboard.
- Navigate to **Authentication** -> **Providers**.
- Enable **Email**.
- Ensure **Confirm email** is **ENABLED**.
- Ensure **Secure email change** is **ENABLED** (recommended).

## 2. Configure Email Template
This is the most critical step. The default template might send a "Magic Link" instead of a code.

- Navigate to **Authentication** -> **Email Templates**.
- Select **Confirm Email**.
- **Subject**: `Confirm your signup`
- **Body**:
  Change the body to include the `{{ .Token }}` variable. This variable contains the 6-digit code.

  ```html
  <h2>Confirm your signup</h2>

  <p>Your confirmation code is:</p>
  
  <h1>{{ .Token }}</h1>

  <p>Enter this code in the app to verify your email address.</p>
  ```

  > **Note**: Do not use `{{ .ConfirmationURL }}` if you want to force OTP entry in the app.

## 3. Verify SMTP (Optional but Recommended)
- For production, use a custom SMTP server (like AWS SES, Resend, or SendGrid) to ensure emails are delivered to the Inbox and not Spam.
- Go to **Settings** -> **SMTP Settings** to configure this.
