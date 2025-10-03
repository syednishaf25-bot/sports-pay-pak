# Admin Setup Instructions - AUTOMATIC

## ✅ Automatic One-Click Setup

The admin account is now set up automatically! Just follow these simple steps:

### Quick Setup (1 step):

1. **Go to** `/admin/setup`
2. **Click** "Create Admin Account" button
3. **Done!** You'll be redirected to login

### Admin Credentials:
- **Email**: tahir@gmail.com
- **Password**: tahir

### Login:
- Go to `/admin/login`
- Enter the credentials above
- Access the admin panel at `/admin`

## How It Works

The system automatically:
- Creates the admin user account
- Sets up the profile
- Assigns admin role
- Removes any customer role
- Confirms the email (no verification needed)

## Routes

- `/admin/setup` - One-click admin account creation
- `/admin/login` - Secure admin login
- `/admin` - Protected admin panel (requires admin role)

## Security Features

- ✅ Protected routes with role-based access control
- ✅ Row-Level Security (RLS) policies on all tables
- ✅ Server-side role verification
- ✅ Automatic redirect for unauthorized access
- ✅ Secure password hashing by Supabase Auth

## Troubleshooting

If the setup doesn't work:
1. Check that the edge function `seed-admin` is deployed
2. Verify Supabase credentials are configured correctly
3. Check browser console for any errors

## Production Note

For production:
- Change the password after first login
- Enable password strength requirements in Supabase Auth
- Consider enabling 2FA for admin accounts
