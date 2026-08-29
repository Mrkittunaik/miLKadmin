/* ============================================================
   CONFIG — single place to point the admin panel at your API.
   Must load BEFORE admin-api.js on every page.

   Right now this points at localhost for local development
   (matches the current no-backend/temp-login setup).

   WHEN YOUR BACKEND IS READY TO DEPLOY:
   replace the line below with your live API URL, e.g.
   window.ADMIN_API_BASE = 'https://api.pakkadoodhwala.com/api';
============================================================ */
window.ADMIN_API_BASE = 'http://localhost:5000/api';
