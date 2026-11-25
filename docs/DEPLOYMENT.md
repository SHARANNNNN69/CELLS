# CELLS — Deployment & Hosting Guide

## 1. System Architecture for Deployment

- **Frontend:** Single Page Application (React + Vite), deployable to Vercel, Netlify, or AWS S3 + CloudFront.
- **Backend:** Node.js + Express REST API, deployable to Render, Railway, AWS EC2, or DigitalOcean Droplet.
- **Database:** Managed MySQL (AWS RDS, PlanetScale, Railway MySQL, or Aiven).

---

## 2. Environment Variables Specification

### Backend `.env`
```env
PORT=5000
DB_HOST=your-mysql-host.example.com
DB_USER=cells_db_user
DB_PASSWORD=your_secure_db_password
DB_NAME=cells_db
DB_PORT=3306
JWT_SECRET=super_secret_jwt_random_key_64_chars
NODE_ENV=production
```

### Frontend `.env`
```env
VITE_API_URL=https://api.cells-emergency.org
```

---

## 3. Step-by-Step Production Setup

1. **Provision MySQL Database:**
   - Run `backend/database/schema.sql` on the MySQL instance.
   - Run `node backend/database/seed.js` if initializing with baseline sample structures.

2. **Backend Deployment (e.g. Render / Railway):**
   - Root directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Configure Environment Variables in the hosting dashboard.

3. **Frontend Deployment (e.g. Vercel):**
   - Root directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Configure Single Page Application rewrite rules (`/*` to `/index.html`).
