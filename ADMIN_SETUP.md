# Admin Setup Instructions

## Initial Admin Account Setup

To set up the admin account with credentials:
- **Email**: tahir@gmail.com
- **Password**: tahir

### Steps:

1. **Sign up the admin user** (one-time setup):
   - Go to `/auth` and sign up with email `tahir@gmail.com` and password `tahir`
   - Check your email for confirmation (or disable email confirmation in Supabase Auth settings for faster testing)

2. **Promote the user to admin**:
   - Open Supabase SQL Editor: https://supabase.com/dashboard/project/mbwpyfclwkfdtnpdpayf/sql/new
   - Run this command:
   ```sql
   SELECT promote_user_to_admin('tahir@gmail.com');
   ```

3. **Access the admin panel**:
   - Go to `/admin/login`
   - Sign in with the credentials above
   - You'll be redirected to `/admin` dashboard

## Admin Login Page

- **URL**: `/admin/login`
- Protected route that checks for admin role
- Redirects non-admin users away from admin panel

## Security Notes

- Admin routes are protected by Row-Level Security (RLS) policies
- Role checks happen on both client and server side
- The password 'tahir' is for development only - change it in production
- Consider enabling password strength requirements in Supabase Auth settings

## Troubleshooting

If you get authentication errors:
1. Make sure Site URL and Redirect URLs are configured in Supabase:
   - Go to: Authentication > URL Configuration
   - Set Site URL to your app URL
   - Add redirect URLs for all environments (preview, production)

2. If "Access denied" appears after login:
   - Verify the user was promoted to admin using the SQL command above
   - Check the `user_roles` table to confirm admin role is assigned
