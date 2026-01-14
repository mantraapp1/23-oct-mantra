# Mantra Vercel Backend

Serverless backend for automated Stellar crypto payments, ad revenue distribution, and scheduled tasks.

## 🚀 Fully Automatic Operation

This backend runs **entirely on autopilot**:

| Task | When | What Happens |
|------|------|--------------|
| **Distribute Earnings** | Every 6 hours | Checks unpaid ad views → calculates author shares → credits wallets → sends notifications |
| **Process Withdrawals** | Every 6 hours | Finds approved withdrawals → sends Stellar payments → notifies users |
| **Expire Unlocks** | Every 6 hours | Marks expired chapter unlocks as inactive |
| **Process Timers** | Every 6 hours | Unlocks chapters for completed timers |

## 📁 Structure

```
vercel-backend/
├── api/
│   ├── cron/daily-tasks.ts   # Automatic cron job
│   └── health.ts             # Health check endpoint
├── lib/
│   ├── stellar.ts            # Stellar SDK (testnet/mainnet)
│   ├── supabase.ts           # Database operations
│   ├── notifications.ts      # User notifications
│   ├── auth.ts               # API authentication
│   └── types.ts              # TypeScript types
└── vercel.json               # Cron configuration
```

## ⚙️ Setup

### 1. Install Dependencies

```bash
cd vercel-backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Switch network: 'testnet' or 'mainnet'
STELLAR_NETWORK=testnet

# Admin Stellar wallet (get from Stellar Laboratory)
ADMIN_WALLET_PUBLIC_KEY=GABC...
ADMIN_WALLET_SECRET_KEY=SABC...

# Supabase service role (Settings > API > service_role key)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Random secret for API auth
API_SECRET_KEY=<generate-random-string>

# Earnings per ad view
XLM_PER_AD_VIEW=0.001
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

### 4. Set Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → Settings → Environment Variables
3. Add all variables from your `.env` file
4. Redeploy for changes to take effect

## 🔄 How It Works

### Distribution Flow (Automatic)

1. Users watch ads → `ads_view_records` table gets entries with `payment_status='pending'`
2. Admin deposits XLM to the admin wallet
3. Cron runs → checks admin wallet balance
4. Calculates each author's share based on their ad views
5. Credits author `wallets.balance`
6. Creates `transactions` records
7. Sends "Earnings Deposited" notifications
8. Marks ad views as `paid`

### Withdrawal Flow (Automatic)

1. Author requests withdrawal in app → `withdrawal_requests` created with `status='pending'`
2. Admin approves in Supabase dashboard → changes status to `'approved'`
3. Cron runs → finds approved withdrawals
4. Sends XLM via Stellar network
5. Updates status to `'completed'`
6. Sends "Withdrawal Complete" notification

## 🔧 Testnet Setup

1. Go to [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
2. Generate a new keypair
3. Click "Fund Account on Testnet" to get test XLM
4. Use these keys in your environment variables
5. Set `STELLAR_NETWORK=testnet`

## 🚨 Going to Mainnet

> **CAUTION**: Only switch to mainnet after thorough testing!

1. Create a funded mainnet Stellar account
2. Update environment variables with mainnet keys
3. Change `STELLAR_NETWORK=mainnet`
4. Redeploy

## 📊 Monitoring

### Health Check

```bash
curl https://your-app.vercel.app/api/health
```

Returns:
- Stellar network connection status
- Admin wallet balance
- Supabase connection status

### Logs

View cron job logs in Vercel Dashboard → Logs

## 💡 Tips

- **Free Tier**: Runs fine on Vercel Hobby (free) plan
- **Cron Frequency**: Set to every 6 hours (Vercel free allows daily minimum)
- **Balance Check**: System only distributes if admin wallet has funds
- **Notifications**: Authors get notified automatically about earnings and withdrawals
