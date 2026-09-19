# Quick Start: Execute Migration on Triangle Healthy Kitchen

## Project Details
- **Project Name**: Triangle Healthy Kitchen
- **Project ID**: teguqlkfmchxucedxvpu
- **Region**: ap-south-1
- **Status**: ACTIVE_HEALTHY
- **Database URL**: https://teguqlkfmchxucedxvpu.supabase.co

## Execute Migration (Recommended Method)

### Option 1: Using Supabase Dashboard (Easiest)

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select "Triangle Healthy Kitchen" project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire content from `migrate_to_triangle_healthy_kitchen.sql`
6. Paste it into the SQL Editor
7. Click **Run** to execute the migration

### Option 2: Using psql (Command Line)

If you have psql installed:

```bash
psql -h db.teguqlkfmchxucedxvpu.supabase.co -U postgres -d postgres
```

Then paste the SQL content and execute.

## After Migration

### Configure Vault Secrets

After the migration completes, add these secrets in **Project Settings → Vault**:

1. **BREVO_API_KEY** - Your Brevo email API key
2. **SENDER_EMAIL** - Default sender email (e.g., kevmulgeo@gmail.com)
3. **STRIPE_WEBHOOK_SECRET_VAULT** - Stripe webhook signing secret
4. **TERRA_API_KEY** - Terra health API key
5. **TERRA_DEV_ID** - Terra developer ID
6. **DIBSY_API_KEY** - Dibsy payment gateway API key
7. **DIBSY_WEBHOOK_SECRET** - Dibsy webhook secret
8. **TAP_SECRET_KEY** - Tap Payments secret key
9. **TAP_MERCHANT_ID** - Tap Payments merchant ID

### Update Your App Configuration

Update your environment variables:

```env
VITE_SUPABASE_URL=https://teguqlkfmchxucedxvpu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZ3VxbGtmbWNoeHVjZWR4dnB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDUzMDYsImV4cCI6MjEwMjgyMTMwNn0.A5lIMp4K698blgpJIPWWkRThLuhYzsBJlnsq-SIoDWI
```

## Verification

After migration, verify these tables exist:
- bookings
- subscribers
- packages
- notifications
- reminders
- weekly_menu_selections
- progress_entries
- health_connections
- health_data
- rider_applications
- rider_deliveries

## Support

If you encounter any issues during migration:
1. Check the SQL Editor output for errors
2. Verify all extensions are installed (pg_cron, pg_net)
3. Ensure you have the necessary permissions
