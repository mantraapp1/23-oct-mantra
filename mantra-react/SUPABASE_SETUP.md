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

## 3. FIXING 500 ERROR: ENABLE CUSTOM SMTP (RESEND)
If you see a **500 Error** or "Error sending confirmation email", it means you have hit Supabase's built-in email rate limit (3 emails per hour). You **MUST** set up a custom SMTP provider like **Resend** (it's free and takes 5 mins).

### Step-by-Step with [Resend.com](https://resend.com):
1.  **Create account**: Go to [resend.com](https://resend.com) and sign up.
2.  **Get API Key**: Go to **API Keys** in Resend and create one.
3.  **Supabase Settings**:
    *   Go to **Project Settings** -> **Authentication**.
    *   Scroll down to **SMTP Settings**.
    *   **Enable SMTP**: Toggle this ON.
    *   **Sender Email**: Use the email you verified in Resend (or `onboarding@resend.dev` for testing).
    *   **Sender Name**: `Mantra App`
    *   **SMTP Host**: `smtp.resend.com`
    *   **SMTP Port**: `587`
    *   **SMTP User**: `resend`
    *   **SMTP Password**: Paste your **Resend API Key** here.
4.  **Save** and try signing up again.

### 3.1 Domain Authentication DNS Records (Crucial for Yahoo & Gmail)
Yahoo and Gmail have strict authentication policies. If you send email from your custom domain (`@mantranovels.com`) via Resend without verifying the domain via DNS records, Yahoo/Gmail will reject the emails.

To fix this, log into your DNS Manager (Cloudflare, GoDaddy, Namecheap, etc.) and add the following records:

1. **DKIM Records (CNAME):** Resend will provide 3 CNAME records. Add them to your DNS manager. E.g.:
   - **Type:** `CNAME` | **Name:** `resend._domainkey` | **Target:** `feedback-dkim.resend.com`
   - **Type:** `CNAME` | **Name:** `resend2._domainkey` | **Target:** `feedback-dkim.resend.com`
   - **Type:** `CNAME` | **Name:** `resend3._domainkey` | **Target:** `feedback-dkim.resend.com`
   
   *(Note: If using Cloudflare, make sure Proxy status is set to **DNS Only** / Gray Cloud, not Proxied).*

2. **SPF Record (TXT):**
   - **Type:** `TXT` | **Name:** `@` | **Value:** `v=spf1 include:amazonses.com ~all`
   - *Note:* If you already have an SPF record, do **not** create a second one. Instead, merge them (e.g. `v=spf1 include:_spf.google.com include:amazonses.com ~all`).

3. **DMARC Record (TXT - MANDATORY for Yahoo/Gmail):**
   - **Type:** `TXT` | **Name:** `_dmarc` | **Value:** `v=DMARC1; p=none;`

Verify the domain inside the Resend dashboard under **Domains** after adding these records.

---

## 4. Final Verification
1.  **Onboarding Loop Fixed**: I fixed a bug in `AppLayout.tsx` that was skipping the OTP page.
2.  **Profile Creation**: I added a Database Trigger (`ADD_AUTH_TRIGGER.sql`) so your profile is created even if verification is pending.
