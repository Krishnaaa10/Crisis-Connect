# Deployment Guide for Render

This guide will walk you through deploying your Disaster Management System to Render.

## Prerequisites

1. **GitHub Repository**: Your code should be pushed to GitHub (already done ✓)
2. **MongoDB Atlas Account**: You'll need a MongoDB database (free tier available)
3. **Render Account**: Sign up at [render.com](https://render.com) (free tier available)

## Deployment Steps

### Step 1: Set Up MongoDB Atlas (if not already done)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or sign in
3. Create a new cluster (choose the free tier)
4. Create a database user:
   - Go to **Database Access** → **Add New Database User**
   - Create a username and password (save these!)
   - Set privileges to **Read and write to any database**
5. Whitelist IP addresses:
   - Go to **Network Access** → **Add IP Address**
   - Click **Allow Access from Anywhere** (for production) or add Render's IPs
6. Get your connection string:
   - Go to **Database** → **Connect** → **Connect your application**
   - Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`)
   - Replace `<password>` with your actual password
   - Replace `<dbname>` with `disaster-management` or your preferred database name

### Step 2: Deploy Backend to Render

1. **Login to Render Dashboard**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Sign up/Login with your GitHub account

2. **Create New Web Service**
   - Click **New +** → **Web Service**
   - Connect your GitHub repository: `Krishnaaa10/Crisis-Connect`
   - Or use the repository URL: `https://github.com/Krishnaaa10/Crisis-Connect.git`

3. **Configure Backend Service**
   - **Name**: `disaster-management-api` (or any name you prefer)
   - **Region**: Choose closest to you (e.g., `Oregon`)
   - **Branch**: `main`
   - **Root Directory**: Leave empty (or set to `backend` if deploying from root)
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: `Free` (or upgrade if needed)

4. **Set Environment Variables**
   Click **Advanced** → **Add Environment Variable** and add:
   
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_atlas_connection_string_here
   JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
   CLIENT_URL=https://your-frontend-url.onrender.com
   ```
   
   **Important Notes:**
   - `PORT` should be `10000` (Render automatically assigns port via `PORT` env var)
   - `JWT_SECRET`: Generate a strong random string (you can use: `openssl rand -base64 32` or an online generator)
   - `CLIENT_URL`: You'll update this after deploying the frontend
   - `MONGODB_URI`: Your MongoDB Atlas connection string from Step 1

5. **Deploy**
   - Click **Create Web Service**
   - Render will start building and deploying your backend
   - Wait for deployment to complete (usually 2-5 minutes)
   - Copy your backend URL (e.g., `https://disaster-management-api.onrender.com`)

### Step 3: Deploy Frontend to Render

1. **Create New Static Site**
   - In Render Dashboard, click **New +** → **Static Site**
   - Connect your GitHub repository: `Krishnaaa10/Crisis-Connect`

2. **Configure Frontend Service**
   - **Name**: `disaster-management-frontend` (or any name you prefer)
   - **Branch**: `main`
   - **Root Directory**: Leave empty (or set to `frontend` if deploying from root)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
   - **Plan**: `Free`

3. **Set Environment Variables**
   Click **Add Environment Variable** and add:
   
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   ```
   
   Replace `your-backend-url.onrender.com` with your actual backend URL from Step 2.

4. **Deploy**
   - Click **Create Static Site**
   - Render will start building and deploying your frontend
   - Wait for deployment to complete (usually 3-6 minutes)
   - Copy your frontend URL (e.g., `https://disaster-management-frontend.onrender.com`)

### Step 4: Update Backend Environment Variable

1. Go back to your **Backend Service** in Render Dashboard
2. Click **Environment** tab
3. Update `CLIENT_URL` to your frontend URL:
   ```
   CLIENT_URL=https://your-frontend-url.onrender.com
   ```
4. Click **Save Changes** - Render will automatically redeploy

### Step 5: Verify Deployment

1. **Test Backend**: Visit `https://your-backend-url.onrender.com/health`
   - Should return: `{"status":"OK","timestamp":"...","environment":"production"}`

2. **Test Frontend**: Visit your frontend URL
   - Should load your React application
   - Try logging in/registering to test API connection

## Troubleshooting

### Backend Issues

**Build Fails:**
- Check build logs in Render dashboard
- Ensure `package.json` has correct scripts
- Verify Node.js version compatibility

**Database Connection Errors:**
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist includes Render's IPs (or `0.0.0.0/0`)
- Ensure database user has correct permissions

**Port Errors:**
- Ensure `PORT` environment variable is set to `10000` or let Render auto-assign
- Backend should use `process.env.PORT` (already configured ✓)

**CORS Errors:**
- Verify `CLIENT_URL` matches your frontend URL exactly
- Check backend logs for CORS configuration

### Frontend Issues

**Build Fails:**
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Check for TypeScript/ESLint errors

**API Connection Errors:**
- Verify `REACT_APP_API_URL` is set correctly
- Check browser console for CORS errors
- Ensure backend is running and accessible

**404 Errors on Routes:**
- React Router needs special configuration for static hosting
- See "Additional Configuration" below

### Free Tier Limitations

- **Sleep Mode**: Free tier services sleep after 15 minutes of inactivity
  - First request after sleep may take 30-60 seconds
  - Consider upgrading to keep services always running
- **Build Time**: Free tier has 750 build minutes/month
- **Bandwidth**: Limited bandwidth on free tier

## Additional Configuration

### React Router Configuration

If you're using React Router and getting 404s on direct routes, you need to configure redirects:

1. Create `frontend/public/_redirects` file:
   ```
   /*    /index.html   200
   ```

2. Or create `frontend/public/nginx.conf` if using custom server:
   ```nginx
   location / {
     try_files $uri $uri/ /index.html;
   }
   ```

### Custom Domain (Optional)

1. Go to your service in Render Dashboard
2. Click **Settings** → **Custom Domains**
3. Add your domain and follow DNS configuration instructions

### Email Configuration (Optional)

If you want email notifications to work, add these environment variables to your backend:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**Note**: For Gmail, you'll need to generate an "App Password" (not your regular password).

## Environment Variables Summary

### Backend Environment Variables:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-random-secret-key-here
CLIENT_URL=https://your-frontend-url.onrender.com
```

### Frontend Environment Variables:
```
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

## Security Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use MongoDB Atlas with strong database password
- [ ] Whitelist only necessary IPs in MongoDB Atlas
- [ ] Enable HTTPS (automatic on Render)
- [ ] Review and update CORS settings
- [ ] Set up proper environment variables (don't commit secrets)

## Monitoring

- **Logs**: View logs in Render Dashboard → Your Service → Logs
- **Metrics**: Check service metrics in Dashboard
- **Health Checks**: Backend has `/health` endpoint for monitoring

## Need Help?

- Render Documentation: https://render.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Check your service logs in Render Dashboard for detailed error messages


