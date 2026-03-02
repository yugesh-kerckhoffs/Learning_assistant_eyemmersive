# Migration Guide: Eyemmersive® Binah

Complete guide to migrate this project from Lovable to **your own Supabase + Vercel + GitHub** setup.

---

## 1. Prerequisites

- Node.js 18+ installed
- A GitHub account
- A Vercel account (free tier works)
- A Supabase account (free tier works)
- Git installed locally
- Supabase CLI installed (`npm install -g supabase`)

---

## 2. Push Code to GitHub

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## 3. Set Up Your Supabase Project

### 3.1 Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note these values from **Settings → API**:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)
   - **Service Role Key** (starts with `eyJ...` — keep this SECRET)
   - **Project Ref** (the `abcdefgh` part of the URL)

### 3.2 Run Database Schema

1. Open the **SQL Editor** in your Supabase dashboard.
2. Copy the contents of `DB_STRUCTURE.txt` and run it in the SQL Editor.
3. This creates all tables, RLS policies, indexes, triggers, and sample data.

### 3.3 Configure Authentication

1. Go to **Authentication → URL Configuration** in Supabase.
2. Set the **Site URL** to your Vercel deployment URL (e.g., `https://your-app.vercel.app`).
3. Add redirect URLs:
   - `https://YOUR_DOMAIN.com/reset-password`
   - `http://localhost:5173/reset-password` (for local dev)

---

## 4. Update Code for Your Supabase Project

### 4.1 Update `src/lib/externalSupabase.ts`

Replace the URL and key with your Supabase project credentials:

```typescript
const EXTERNAL_SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

### 4.2 Create `.env` File (for local development)

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_REF
```

> **Note:** The frontend calls edge functions using `VITE_SUPABASE_URL`. Make sure this points to YOUR Supabase project.

---

## 5. Deploy Edge Functions to Your Supabase

### 5.1 Link Your Supabase Project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 5.2 Set Edge Function Secrets

These secrets are used by your edge functions. Set them via the Supabase CLI:

```bash
# Required for AI chat (Google Gemini API)
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here

# Required for admin login verification
supabase secrets set ADMIN_SECRET_KEY=your_admin_secret_key_here

# Required for contact form emails (Resend)
supabase secrets set RESEND_API_KEY=your_resend_api_key_here

# Required for forgot password email-exists check
# Use your Supabase project's own URL and service role key
supabase secrets set EXTERNAL_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
supabase secrets set EXTERNAL_SUPABASE_ANON_KEY=YOUR_ANON_KEY
supabase secrets set EXTERNAL_SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

**Where to get these keys:**

| Secret | Where to get it |
|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) — Create an API key |
| `ADMIN_SECRET_KEY` | Choose any strong password/key for admin access |
| `RESEND_API_KEY` | [Resend.com](https://resend.com) — Create an API key |
| `EXTERNAL_SUPABASE_URL` | Your Supabase Dashboard → Settings → API → Project URL |
| `EXTERNAL_SUPABASE_ANON_KEY` | Your Supabase Dashboard → Settings → API → `anon` `public` key |
| `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Dashboard → Settings → API → `service_role` key (⚠️ NEVER expose this in frontend code!) |

### 5.3 Deploy All Edge Functions

```bash
supabase functions deploy chat --no-verify-jwt
supabase functions deploy verify-admin --no-verify-jwt
supabase functions deploy verify-session --no-verify-jwt
supabase functions deploy contact --no-verify-jwt
supabase functions deploy check-email-exists --no-verify-jwt
```

Or deploy all at once:

```bash
supabase functions deploy --no-verify-jwt
```

### 5.4 Verify Edge Functions Are Working

Test the chat function:
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"message":"Hello!","conversationHistory":[],"role":"user","sessionToken":null,"userId":null,"userEmail":null,"socialStoriesMode":false}'
```

---

## 6. Deploy Frontend to Vercel

### 6.1 Import from GitHub

1. Go to [vercel.com](https://vercel.com) and click **"New Project"**.
2. Import your GitHub repository.
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`

### 6.2 Set Environment Variables in Vercel

Go to **Settings → Environment Variables** and add:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | `YOUR_PROJECT_REF` |

### 6.3 Deploy

Click **Deploy**. Vercel will build and deploy your app.

---

## 7. Post-Deployment Checklist

### 7.1 Update Supabase Auth Settings

After deployment, go to your Supabase Dashboard:

1. **Authentication → URL Configuration**
2. Set **Site URL** to: `https://your-app.vercel.app` (or your custom domain)
3. Add **Redirect URLs**:
   - `https://your-app.vercel.app/reset-password`

### 7.2 Verify Everything Works

- [ ] Visit your deployed URL
- [ ] Test sign up / sign in flow
- [ ] Test terms acceptance
- [ ] Test chat functionality (text + image generation)
- [ ] Test forgot password flow
- [ ] Test admin login (using your `ADMIN_SECRET_KEY`)
- [ ] Test social stories mode
- [ ] Test contact form
- [ ] Verify all learning activities work

---

## 8. Custom Domain (Optional)

1. In Vercel: **Settings → Domains → Add your domain**
2. Update DNS records as instructed by Vercel
3. Update Supabase **Site URL** to match your custom domain
4. Update Supabase **Redirect URLs** to match your custom domain
5. Update `public/sitemap.xml` with your domain

---

## 9. Architecture Overview

```
┌──────────────────────────────────────────────────┐
│                  YOUR SETUP                       │
├──────────────────────────────────────────────────┤
│                                                   │
│  GitHub ──► Vercel (Frontend)                    │
│              │                                    │
│              ├── React + Vite + Tailwind          │
│              ├── Calls edge functions via          │
│              │   VITE_SUPABASE_URL                │
│              │                                    │
│  Supabase (Backend)                              │
│              ├── Authentication (email/password)  │
│              ├── Database (PostgreSQL)            │
│              ├── Edge Functions:                  │
│              │   ├── chat (Gemini API)            │
│              │   ├── verify-admin                 │
│              │   ├── verify-session               │
│              │   ├── contact                      │
│              │   └── check-email-exists           │
│              └── Secrets (API keys)               │
│                                                   │
│  External APIs:                                   │
│              ├── Google Gemini (AI chat + images) │
│              └── Resend (emails)                  │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## 10. Files Modified for Self-Hosting

| File | What Changed |
|---|---|
| `supabase/functions/chat/index.ts` | Uses `GEMINI_API_KEY` directly with Google Gemini API instead of Lovable AI Gateway |
| `src/lib/api.ts` | Uses `VITE_SUPABASE_URL` env var to construct edge function URLs |
| `src/lib/externalSupabase.ts` | **YOU MUST UPDATE** with your Supabase project URL and anon key |
| `.env` | **YOU MUST CREATE** with your Supabase credentials |

---

## 11. Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

For edge functions local testing:

```bash
# Start Supabase locally (optional)
supabase start

# Or just deploy to your remote project and test against it
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| **Blank page after deploy** | Check `vercel.json` rewrites are configured correctly |
| **Auth not working** | Verify Supabase URL and anon key in `.env` and `externalSupabase.ts` |
| **Database errors** | Ensure all SQL from `DB_STRUCTURE.txt` was executed successfully |
| **Chat not working** | Check `GEMINI_API_KEY` is set: `supabase secrets list` |
| **Edge functions 500 error** | Check function logs: `supabase functions logs chat` |
| **"Email not registered" for valid emails** | Verify `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` is set correctly |
| **CORS errors** | Ensure edge functions have proper CORS headers (already configured) |
| **Admin login fails** | Check `ADMIN_SECRET_KEY` is set: `supabase secrets set ADMIN_SECRET_KEY=your_key` |

---

## Security Notes

- **NEVER** expose `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` in frontend code
- **NEVER** commit `.env` to GitHub (it's already in `.gitignore`)
- All secrets are stored server-side in Supabase Edge Function environment
- The `externalSupabase.ts` file only contains the **anon/public** key (safe to commit)
- Edge functions use `--no-verify-jwt` — they validate auth internally where needed
