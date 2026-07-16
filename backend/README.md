# BAUST Alumni Management Backend

This backend is a Node.js Express API for the BAUST Alumni Management system using MongoDB Atlas.

## Setup

1. Copy `.env.example` to `.env`.
2. Update `MONGODB_URI` with your MongoDB Atlas connection string.
3. If you do not yet have Atlas credentials, the backend can start with a temporary in-memory database for local development.
4. Run:

```bash
cd backend
npm install
npm run dev
```

## API Endpoints

- `GET /api/alumni` - List alumni
- `POST /api/alumni` - Create alumni
- `GET /api/alumni/:id` - Get alumni by ID
- `PUT /api/alumni/:id` - Update alumni
- `DELETE /api/alumni/:id` - Delete alumni
