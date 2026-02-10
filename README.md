# Subscription Auditor

A privacy-first web app that shows users the **true cost** of their subscriptions — including lost investment opportunity over 10-30 years.

Built with React + Vite. No backend. Free to host.

---

## Quick Start (Local Dev)

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Free Hosting (Pick One)

### Option A: Vercel (Recommended)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
3. Click **"Add New Project"** → Import your repo
4. It auto-detects Vite — just click **Deploy**
5. Done! You get a free `.vercel.app` domain

### Option B: Netlify

1. Push to GitHub
2. Go to [netlify.com](https://netlify.com) → Sign in with GitHub
3. Click **"Add new site" → "Import an existing project"**
4. Select your repo → Deploy
5. Free `.netlify.app` domain

### Option C: Cloudflare Pages

1. Push to GitHub
2. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
3. Create project → Connect GitHub repo
4. Build command: `npm run build` | Output: `dist`
5. Deploy — free `.pages.dev` domain

### Option D: GitHub Pages (Totally Free)

1. In `vite.config.js`, add: `base: '/your-repo-name/'`
2. Run `npm run build`
3. Push `dist/` folder to a `gh-pages` branch
4. Enable Pages in GitHub Settings

---

## Google AdSense Setup

### Step 1: Get Approved

1. Go to [adsense.google.com](https://adsense.google.com)
2. Sign up with your Google account
3. Add your site URL (your Vercel/Netlify domain)
4. Google will review (takes 1-14 days)
5. Once approved, you'll get your **Publisher ID** (e.g., `ca-pub-1234567890123456`)

### Step 2: Add Your IDs

Replace placeholder values in **2 files**:

**File 1: `index.html`** — Line ~30
```html
<!-- Replace YOUR_ADSENSE_PUB_ID -->
src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ACTUAL_ID"
```

**File 2: `src/AdUnit.jsx`** — Line ~32
```jsx
data-ad-client="ca-pub-YOUR_ACTUAL_ID"
```

### Step 3: Create Ad Slots

1. In AdSense dashboard → **Ads → By ad unit → Display ads**
2. Create these ad units and copy their **slot IDs**:
   - `SLOT_LEADERBOARD_TOP` — Top banner (728×90 responsive)
   - `SLOT_MID_CONTENT` — Dashboard mid-page
   - `SLOT_MID_MANAGE` — Manage tab mid-page
   - `SLOT_PROJECTION_MID` — Projection tab
   - `SLOT_REMINDERS` — Reminders tab
   - `SLOT_FOOTER` — Bottom banner

3. Replace each `slot="SLOT_..."` in `src/App.jsx` with your actual slot IDs

### Ad Placement Strategy

Ads are placed at **natural content breaks** — not interrupting the user flow:
- **Top banner**: Below header, before content (high viewability)
- **Mid-content**: Between chart sections (user is engaged, scrolling)
- **Tab-specific**: One per tab so each page view generates an impression
- **Footer**: Catch-all for scroll-through users

---

## Google Analytics 4 (GA4) Setup

### Step 1: Create Property

1. Go to [analytics.google.com](https://analytics.google.com)
2. Click **Admin → Create Property**
3. Enter your site name and URL
4. Choose **Web** as the platform
5. Copy your **Measurement ID** (e.g., `G-ABC123XYZ`)

### Step 2: Add Your ID

Replace `G-XXXXXXXXXX` in **2 files**:

**File 1: `index.html`** — Lines ~38 and ~43
```html
src="https://www.googletagmanager.com/gtag/js?id=G-YOUR_ACTUAL_ID"
gtag('config', 'G-YOUR_ACTUAL_ID');
```

**File 2: `src/analytics.js`** — Line ~49
```js
send_to: 'G-YOUR_ACTUAL_ID',
```

### What Gets Tracked

| Event | When | Why |
|---|---|---|
| `add_subscription` | User adds a preset or custom sub | See which subs are most common |
| `remove_subscription` | User removes a sub | See which they consider cutting |
| `page_view_internal` | Tab switch | See which features are used |
| `projection_change` | User changes projection years | See engagement depth |
| `set_cancel_reminder` | User sets a reminder | **Your conversion event** |
| `audit_summary` | Dashboard loads with subs | See average monthly totals |

### Setting Up Conversion Tracking

1. In GA4 → **Admin → Events**
2. Find `set_cancel_reminder` → Toggle **"Mark as conversion"**
3. Now you can see conversion rates in your reports

### Viewing Your Data

- **Realtime**: GA4 → Reports → Realtime (see live visitors)
- **Page views**: Reports → Engagement → Pages and screens
- **Events**: Reports → Engagement → Events
- **User flow**: Reports → Engagement → User journey

---

## Project Structure

```
subscription-auditor/
├── index.html          # Entry — AdSense + GA4 scripts
├── package.json
├── vite.config.js
├── vercel.json         # Vercel deployment config
├── netlify.toml        # Netlify deployment config
├── public/
│   ├── favicon.svg
│   ├── og-image.svg    # Social sharing image
│   └── robots.txt      # Search engine crawling rules
└── src/
    ├── main.jsx        # React entry
    ├── index.css       # Global styles + animations
    ├── App.jsx         # Main app with ad placements
    ├── AdUnit.jsx      # Reusable AdSense component
    └── analytics.js    # GA4 custom event helpers
```

---

## Custom Domain (Optional)

All three platforms support free custom domains:

1. Buy a domain (~$10/yr from Namecheap, Cloudflare, or Google Domains)
2. In your host's dashboard → **Settings → Domains → Add custom domain**
3. Update DNS records as instructed
4. Free SSL is automatic

---

## Tips for Revenue

- **High-CPC niche**: Finance/fintech tools attract $2-8 CPC ads
- **SEO**: Add a blog page with "How much do subscriptions really cost" content
- **Social sharing**: Add a "Share my audit" feature for virality
- **Email capture**: The reminder feature doubles as a lead magnet
