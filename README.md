# Backend Quick Start

## Prerequisites
- Node.js installed
- MongoDB running (local or Atlas)

## Start Backend Server

```bash
cd backend
npm run server
```

## Start Frontend

```bash
cd frontend
npm run dev
```

## Environment Variables

Update `backend/.env` if needed:
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: Change in production
- `PORT`: Backend port (default: 5000)

## Test the Application

1. Go to http://localhost:3000/register
2. Create an account
3. Login at http://localhost:3000/login
4. Check MongoDB to verify user creation

## Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check MONGO_URI in .env

**Port Already in Use:**
- Change PORT in backend/.env
- Update proxy in frontend/vite.config.js

**CORS Issues:**
- Verify proxy is configured in vite.config.js
- Ensure backend has cors middleware
