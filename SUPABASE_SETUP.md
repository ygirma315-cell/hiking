# Ereft Hiking Supabase Setup

1. Create a Supabase project.
2. Open Supabase SQL Editor and run `supabase-schema.sql`. If you ran it before, run it again so profiles, Hike IDs, booking/payment fields, and dashboard functions are added.
3. In Supabase Auth, create an admin user with email and password.
4. Open `supabase-make-admin.sql`, replace `admin@example.com` with that exact email, and run it in SQL Editor.
5. Run `supabase-storage-setup.sql` in SQL Editor so admin uploads can save compressed images to Supabase Storage.
6. Run `supabase-admin-invite-setup.sql` in SQL Editor so existing admins can add/invite other admins from Settings.
7. Copy your Project URL and anon public key into both files:
   - `js/supabase-config.js`
   - `admin/js/supabase-config.js`
8. Open `admin/index.html`, sign in with the Supabase admin email/password, then save any trip/package/website content once. That seeds `site_content`.
9. Run `supabase-defaults-setup.sql` after your current `site_content` looks correct. This stores the database-backed defaults used by Reset buttons.
10. If you need to repair the Afar Doho image path, run `supabase-fix-afar-doho-image.sql`.
11. In Supabase Auth settings, keep email/password enabled. For the public website username/password flow, turn off email confirmation unless you want to build email verification later.
12. Open `index.html`. Public users can browse without login. They sign up/sign in only to book trips and view their Dashboard.

Notes:
- Public users enter a username, but Supabase Auth stores the password securely. The website converts usernames into internal auth emails like `username@ereft.local`.
- Users only see their own bookings through Row Level Security.
- Admins see all bookings only if their auth user exists in `admin_users`.
- Booking prices are read from the saved package data in `site_content`; the browser display price is only a fallback.
- Users must write their exact Hike ID in the payment note/reference. Admin should match Hike ID + transaction/reference + sender account/phone + amount before accepting.

Keep the service role key private. Do not put it in browser JavaScript.
