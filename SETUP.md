# Scalable Summit CRM — Setup Guide
## Stack: Next.js + Supabase + Vercel (all free)

---

## STEP 1 — Set up Supabase (10 minutes)

1. Go to **https://supabase.com** → click "Start your project" → sign up free
2. Click **"New project"**
   - Name: `scalable-summit-crm`
   - Set a database password (save it!)
   - Region: US East or West
3. Wait ~2 minutes for it to spin up
4. In the left sidebar → **SQL Editor** → click **"New query"**
5. Open the file `supabase/schema.sql` from this folder
6. **IMPORTANT:** Replace `YOUR_ADMIN_EMAIL@EMAIL.COM` with your actual email (line 20)
7. Paste the entire SQL into the editor → click **"Run"**
8. You should see "Success" — this creates the table, security rules, and loads all 56 posts

### Get your API keys:
- Left sidebar → **Settings** → **API**
- Copy **Project URL** (looks like: `https://abcdefgh.supabase.co`)
- Copy **anon public** key (long string starting with `eyJ...`)

---

## STEP 2 — Deploy to Vercel (5 minutes)

### Option A — GitHub (recommended)
1. Go to **https://github.com** → create a new repository called `scalable-summit-crm`
2. Upload all files from this folder to that repo
3. Go to **https://vercel.com** → sign up free with GitHub
4. Click **"Add New Project"** → import your GitHub repo
5. Before clicking Deploy, click **"Environment Variables"** and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL     = https://YOUR_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...your anon key...
   NEXT_PUBLIC_ADMIN_EMAIL      = your-email@yourdomain.com
   ```
6. Click **Deploy** — Vercel will build and give you a live URL like:
   `https://scalable-summit-crm.vercel.app`

### Option B — Vercel CLI
```bash
npm i -g vercel
cd scalable-summit-crm
cp .env.example .env.local
# Fill in .env.local with your Supabase values
vercel
# Follow the prompts, add env vars when asked
```

---

## STEP 3 — Configure Supabase Auth (3 minutes)

1. In Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL: `https://your-app.vercel.app`
3. Add to **Redirect URLs**: `https://your-app.vercel.app/**`
4. Click Save

---

## STEP 4 — Give users access (ongoing)

When someone wants access to their row:

1. Tell them to go to your app URL and click **"Sign up"**
2. They create an account with their email and a password
3. They'll see a "not linked yet" message after signing up
4. You (admin) go to Supabase → **Table Editor** → **posts**
5. Find their row → click the `user_email` field → type their email → save
6. Next time they log in, they'll see their post and can edit everything

**Or** — you can pre-fill emails in bulk via SQL:
```sql
-- Example: link James Creech's email
UPDATE posts SET user_email = 'james@email.com' WHERE first_name = 'James' AND last_name = 'Creech';
```

---

## HOW IT WORKS

### As Admin (your email):
- See all 56 posts in a sortable, searchable table
- Inline-edit any row: name, company, title, summary, tagged, engagement, user email
- Top 5 leaderboard updates live
- All changes go directly to the database

### As a User (e.g. James Creech):
- Logs in with email + password
- Sees ONLY their own post(s)
- Can edit: first name, last name, title, company, post link, summary, tagged people, reactions, comments, reposts
- Changes save instantly to the database
- Gets a clean "your post" card view (not the full table)

### Security:
- Row-level security ensures users can ONLY read and write their own row
- Admin email has full access to everything
- Passwords are hashed by Supabase — you never see them

---

## ADDING YOUR CUSTOM DOMAIN (optional)

1. In Vercel → your project → **Settings** → **Domains**
2. Add your domain (e.g. `tracker.fruitful.events`)
3. Follow the DNS instructions
4. Update Supabase Auth URLs to match your new domain

---

## QUESTIONS?

The app is fully built — you just need to:
1. ✅ Create Supabase project + run schema.sql
2. ✅ Deploy to Vercel with env vars
3. ✅ Update Supabase auth URLs
4. ✅ Start linking user emails to rows
