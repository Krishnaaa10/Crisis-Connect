# Quick Deployment Reference

## Render Deployment - Quick Steps

### 1. Backend Deployment
- **Type**: Web Service
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Environment Variables**:
  - `NODE_ENV=production`
  - `PORT=10000`
  - `MONGODB_URI=<your-mongodb-atlas-uri>`
  - `JWT_SECRET=<random-secret-string>`
  - `CLIENT_URL=<frontend-url>` (update after frontend deployment)

### 2. Frontend Deployment
- **Type**: Static Site
- **Build Command**: `cd frontend && npm install && npm run build`
- **Publish Directory**: `frontend/build`
- **Environment Variables**:
  - `REACT_APP_API_URL=<backend-url>`

### 3. After Deployment
- Update backend `CLIENT_URL` with frontend URL
- Test: Visit `/health` endpoint on backend
- Test: Visit frontend URL and verify API connection

## MongoDB Atlas Setup
1. Create cluster (free tier)
2. Create database user
3. Whitelist IPs (or allow all for development)
4. Get connection string
5. Replace `<password>` and `<dbname>` in connection string

## Important Notes
- Free tier services sleep after 15 min inactivity
- First request after sleep may take 30-60 seconds
- Keep environment variables secure (don't commit to git)
- Use strong JWT_SECRET in production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.


