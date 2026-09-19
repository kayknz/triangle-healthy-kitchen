# Triangle Healthy Kitchen - Database Migration Setup Guide

## Overview
This guide helps you migrate your complete database to a new Supabase project called "triangle healthy kitchen".

## Prerequisites
- New Supabase project created with the name "triangle healthy kitchen"
- Supabase CLI installed (optional, for local development)
- Access to your current Supabase project for data export

## Step 1: Create New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project named "triangle healthy kitchen"
3. Choose a region close to your users
4. Wait for the project to be fully provisioned

## Step 2: Run the Migration Script
1. Open your new Supabase project dashboard
2. Navigate to **SQL Editor** (icon on left sidebar)
3. Open the file `migrate_to_triangle_healthy_kitchen.sql` 
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

**Important:** Before running, update the cron job URL at the bottom of the script:
```sql
-- Replace YOUR_NEW_PROJECT_ID with your actual project ID
url := 'https://YOUR_NEW_PROJECT_ID.supabase.co/functions/v1/send-reminders',
```

## Step 3: Configure Vault Secrets
The migration script creates helper functions that read from Supabase Vault. You need to add these secrets:

### Required Secrets
Navigate to **Project Settings → Vault** and add:

1. **BREVO_API_KEY** - Your Brevo email API key
2. **SENDER_EMAIL** - Default sender email (e.g., kevmulgeo@gmail.com)
3. **STRIPE_WEBHOOK_SECRET_VAULT** - Stripe webhook signing secret (if using Stripe)
4. **TERRA_API_KEY** - Terra health API key
5. **TERRA_DEV_ID** - Terra developer ID
6. **DIBSY_API_KEY** - Dibsy payment gateway API key
7. **DIBSY_WEBHOOK_SECRET** - Dibsy webhook secret
8. **TAP_SECRET_KEY** - Tap Payments secret key
9. **TAP_MERCHANT_ID** - Tap Payments merchant ID

### How to Add Secrets
1. Go to **Project Settings → Vault**
2. Click **Add Secret**
3. Enter the name and value
4. Repeat for each secret

## Step 4: Migrate Existing Data (Optional)
If you want to move existing data from your current project:

### Option A: Use Supabase Dashboard
1. In your **old** project, go to **Table Editor**
2. For each table, export data as CSV
3. In your **new** project, import the CSV files

### Option B: Use pg_dump (Advanced)
```bash
# Export from old project
pg_dump -h db.old-project-ref.supabase.co -U postgres -d postgres > backup.sql

# Import to new project
psql -h db.new-project-ref.supabase.co -U postgres -d postgres < backup.sql
```

## Step 5: Update Environment Variables
Update your application's environment variables with the new project credentials:

```env
VITE_SUPABASE_URL=https://your-new-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key
```

Find these in your new project's **Settings → API** section.

## Step 6: Update Edge Functions
If you have edge functions, you need to:

1. Deploy them to the new project
2. Update any hardcoded URLs or references
3. Update environment variables in the edge function settings

## Step 7: Test the Migration
1. Test user registration and login
2. Test booking creation
3. Test subscription signup
4. Test rider application and approval
5. Verify email notifications work
6. Check that scheduled reminders are running

## Database Schema Summary
The migration creates the following tables:

### Core Tables
- **bookings** - Client appointment bookings
- **subscribers** - Subscription customers
- **packages** - Meal plan packages
- **notifications** - Email notification log
- **reminders** - Reminder tracking

### Subscriber Data Tables
- **weekly_menu_selections** - Weekly meal choices
- **progress_entries** - Weight/health progress tracking
- **health_connections** - Health app connections (Terra)
- **health_data** - Cached health data

### Rider Tables
- **rider_applications** - Rider signup and approval
- **rider_deliveries** - Delivery assignments

### Helper Functions
- `is_provider()` - Check if user is a provider/owner
- `get_brevo_config()` - Fetch Brevo API credentials
- `get_stripe_webhook_secret()` - Fetch Stripe webhook secret
- `get_terra_config()` - Fetch Terra API credentials
- `get_dibsy_config()` - Fetch Dibsy API credentials
- `get_dibsy_webhook_secret()` - Fetch Dibsy webhook secret
- `get_tap_config()` - Fetch Tap Payments credentials

## Provider Email Addresses
The following emails are configured as providers (can access all data):
- kevmulgeo@gmail.com
- issashahid1@gmail.com
- georgekmuliika@gmail.com

To add more providers, update the `is_provider()` function in the migration script.

## Troubleshooting

### Cron Job Not Working
- Verify pg_cron extension is installed
- Check the URL is correct for your new project
- Ensure the edge function exists and is deployed

### Vault Secrets Not Accessible
- Verify Vault is enabled in your project
- Check secret names match exactly
- Ensure the helper functions have proper permissions

### RLS Policies Blocking Access
- Check that users are authenticated
- Verify the `is_provider()` function returns true for provider emails
- Check that subscriber records have correct `user_id` values

## Next Steps
1. Update your mobile app configuration
2. Deploy any edge functions
3. Set up monitoring and logging
4. Update any external webhook URLs
5. Test all user flows end-to-end

## Support
If you encounter issues:
- Check Supabase logs in the Dashboard
- Review the SQL Editor execution results
- Verify all secrets are properly configured
- Ensure all extensions are installed
