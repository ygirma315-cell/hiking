# Ereft Hiking Supabase Setup

This is the clean login setup.

Supabase Authentication is not used for this version. You do not need to create admin users inside Supabase Auth.

## What This Creates

- `admins`: admin dashboard login accounts only.
- `site_users`: public website signup/login accounts only.
- `registrations`: trip bookings made by logged-in public users.
- `admin_sessions` and `site_user_sessions`: login sessions.
- `site_content`: trips, packages, gallery, and website content edited from admin.

The admin login and public website login are separate. The default admin account does not become a public website user.

## Important Reset Warning

`supabase-schema.sql` drops and recreates the login/booking tables so you can start clean.

Run it now while you are resetting the project. Do not rerun it later after real users/customers start booking unless you intentionally want to erase public users and registrations.

## Exact Beginner Steps

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Open the file `supabase-schema.sql` from this project.
4. Copy the whole file.
5. Paste it into Supabase SQL Editor.
6. Click **Run**.
7. You should see success, maybe with "no rows returned". That is okay.
8. Open `admin/index.html`.
9. Login with:
   - Username: `admin`
   - Password: `admin123`
10. Go to admin **Settings** and change the admin password before real launch.
11. Open the public `index.html`.
12. Click **Sign Up / Login**.
13. Create a public user account with username/password.
14. Go back to admin **Users** and click refresh. The public user should appear there.

## What To Ignore In Supabase Auth

You can leave Supabase **Authentication > Users** empty for this setup.

Do not create admin login users there. The admin login comes from the `admins` table created by `supabase-schema.sql`.

## Keys

The browser needs only the Supabase project URL and public publishable/anon key in:

- `js/supabase-config.js`
- `admin/js/supabase-config.js`

Never put the service role key in browser JavaScript.

## First Test Checklist

1. Admin login works with `admin / admin123`.
2. Public signup creates a new website user.
3. Admin **Users** shows that new website user.
4. Public user can choose a package and create a booking.
5. Booking success shows a Hike ID and copy button.
6. Admin **Registrations** shows the booking.
7. Admin accepts/rejects/marks review.
8. Public dashboard refresh shows the new booking status.

## Image Upload Note

This reset focuses on login, users, bookings, and admin approval.

Supabase Storage direct uploads cannot securely read this custom admin session token. Do not open anonymous upload access for production. For now, use existing image paths/URLs. A secure image upload step should be added next with a protected server/edge function or a separate Supabase Auth-only admin storage flow.
