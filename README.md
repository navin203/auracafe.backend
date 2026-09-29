# AuraCafe Backend API

> Production-ready Node.js & Express MVC backend connecting to **Google Maps Platform**, **Google Places API**, and **Supabase PostgreSQL**.

---

## 🚀 Features

- **Google Places API Integration**: Real-time cafe search by query or GPS coordinates, place details, opening hours, and photo proxy streaming.
- **Factual Comparison Engine**: Strict side-by-side factual insights based only on real Google Places metadata.
- **Transparent App Comparison Score**: Configurable weights for distance, rating, review volume, price level, and open status.
- **Supabase PostgreSQL Database**: Profiles, favorites, search history, and saved comparisons with Row Level Security (RLS).
- **Security & Performance**: Rate limiting (`express-rate-limit`), CORS, input validation, and centralized error handling.

---

## 🛠️ Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Google Maps / Places API
GOOGLE_MAPS_API_KEY=your_key
GOOGLE_PLACES_API_KEY=your_key

# Supabase Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

JWT_SECRET=your_jwt_secret
```

---

## 📦 Run Commands

```bash
# Install dependencies
npm install

# Start production server
npm start

# Start dev server with nodemon
npm run dev
```

---

## 🗄️ Database Setup

Run the SQL script located in `database/schema.sql` in your Supabase SQL Editor.
