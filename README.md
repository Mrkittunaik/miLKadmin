# Pakka Doodhwala — Admin Panel (deploy-ready)

Static HTML/CSS/JS admin panel. No build step — deploy the folder as-is.

## Structure
```
/
├── index.html          → root entry, redirects to admin/pages/login.html
├── robots.txt           → keeps this out of search engines
└── admin/
    ├── pages/*.html      → every screen (login, dashboard, products, etc.)
    ├── css/*.css          → base styles + mobile.css (responsive layer)
    ├── js/*.js            → config.js, admin-api.js, admin-layout.js, etc.
    └── images/           → logo etc.
```

## Before you deploy: set your backend URL
Open **`admin/js/config.js`** and change:
```js
window.ADMIN_API_BASE = 'http://localhost:5000/api';
```
to your live backend, e.g.:
```js
window.ADMIN_API_BASE = 'https://api.pakkadoodhwala.com/api';
```
Every page loads this file first, so it's the only place you need to edit.

## Temporary login (remove once real auth is connected)
`admin/js/login.js` currently has a hardcoded bypass:
- Email: `admin@test.com`
- Password: `admin123`

This lets you click through the UI with no backend running. Once your
real `/admin/auth/login` endpoint is live, delete the marked block in
`login.js` (search for `TEMPORARY TEST LOGIN`) and the matching hint
box in `login.html`.

## Deploying
Any static host works — no server-side code, no build step.

**Netlify / Vercel (drag-and-drop or CLI)**
- Just deploy this whole folder. `index.html` at the root is picked up
  automatically as the entry point.

**Plain Nginx / Apache / any static file server**
- Point the web root at this folder. No special rewrite rules needed —
  every page is a real `.html` file at a real path.

**GitHub Pages**
- Push this folder to the repo (or `docs/` if using that convention),
  enable Pages, done.

## Notes
- This is a classic multi-page app (each click is a real page
  navigation), not a single-page app — that's intentional and keeps
  things simple to host.
- Cross-document View Transitions (`admin-base.css`) give it a smooth,
  app-like feel between pages on Chrome/Edge; other browsers fall back
  to an instant page change with no visual breakage.
- Mobile gets a bottom tab bar + "More" sheet automatically at
  ≤640px width (`admin/css/mobile.css` + `admin-layout.js`) — no
  separate mobile build needed.
