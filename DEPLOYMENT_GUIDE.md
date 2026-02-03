# Ayphen Textile ERP - Deployment Guide

## Overview

This guide will walk you through deploying the Ayphen Textile ERP application with:
- **Backend**: Render (Free tier)
- **Frontend**: Netlify (Free tier)
- **Database**: Render PostgreSQL
- **Cache**: Render Redis (Starter tier)

---

## Prerequisites

1. **GitHub Account** - Your code repository
2. **Render Account** - Sign up at https://render.com
3. **Netlify Account** - Sign up at https://netlify.com
4. **Render Account** - Sign up at https://render.com

---

## Part 1: Backend Deployment on Render

### Step 1: Create Redis Instance

1. Log in to Render Dashboard
2. Click **"New +"** → **"Redis"**
3. Configure:
   - **Name**: `lavoro-redis`
   - **Plan**: Starter ($7/month) or Free (if available)
   - **Max Memory Policy**: `allkeys-lru`
4. Click **"Create Redis"**
5. Wait for Redis to be ready (shows "Available" status)

### Step 2: Create Web Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:

   **Basic Settings:**
   - **Name**: `ayphen-textile-backend`
   - **Region**: Choose closest to your users (e.g., Singapore for Asia)
   - **Branch**: `main`
   - **Root Directory**: Leave empty (uses repo root)
   - **Runtime**: `Node`
   - **Build Command**: 
     ```bash
     npm ci && npx prisma generate && npm run build
     ```
   - **Start Command**: 
     ```bash
     npx prisma migrate deploy && npm start
     ```

   **Advanced Settings:**
   - **Plan**: Free
   - **Health Check Path**: `/api/v1/health`
   - **Auto-Deploy**: Yes

### Step 3: Configure Environment Variables

In the Render service settings, add these environment variables:

#### Required Variables:

Render will automatically provide the `DATABASE_URL` if you link a Render PostgreSQL service to this Web Service.

### Step 4: Deploy Backend

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Generate Prisma client
   - Build TypeScript code
   - Run database migrations
   - Start the server
3. Wait for deployment to complete (5-10 minutes)
4. You'll get a URL like: `https://ayphen-textile-backend.onrender.com`

### Step 5: Verify Backend Deployment

Test the health endpoint:
```bash
curl https://ayphen-textile-backend.onrender.com/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-20T03:45:00.000Z",
  "uptime": 123.456,
  "database": "connected",
  "redis": "connected"
}
```

---

## Part 2: Frontend Deployment on Netlify

### Step 1: Prepare Frontend Environment

1. In your local project, create `frontend-new/.env.production`:

```bash
VITE_API_BASE_URL=https://ayphen-textile-backend.onrender.com/api/v1
VITE_APP_NAME=Ayphen Textile ERP
VITE_APP_VERSION=1.0.0
```

2. Commit and push to GitHub:
```bash
git add frontend-new/.env.production
git commit -m "Add production environment configuration"
git push origin main
```

### Step 2: Deploy to Netlify

#### Option A: Using Netlify UI

1. Log in to Netlify Dashboard
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"GitHub"** and authorize Netlify
4. Select your repository: `lavoro-ai-ferri`
5. Configure build settings:
   - **Base directory**: `frontend-new`
   - **Build command**: `npm ci && npm run build`
   - **Publish directory**: `frontend-new/dist`
   - **Branch**: `main`
6. Click **"Deploy site"**

#### Option B: Using Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Navigate to frontend directory
cd frontend-new

# Deploy
netlify deploy --prod
```

### Step 3: Configure Custom Domain (Optional)

1. In Netlify Dashboard, go to **"Domain settings"**
2. Click **"Add custom domain"**
3. Enter: `ayphentextile.netlify.app` (or your custom domain)
4. Follow DNS configuration instructions if using custom domain

### Step 4: Set Environment Variables in Netlify

1. Go to **"Site settings"** → **"Environment variables"**
2. Add:
   ```
   VITE_API_BASE_URL = https://ayphen-textile-backend.onrender.com/api/v1
   ```
3. Click **"Save"**
4. Trigger a new deployment

### Step 5: Verify Frontend Deployment

1. Visit your Netlify URL: `https://ayphentextile.netlify.app`
2. You should see the login page
3. Test registration and login functionality

---

## Part 3: Database Setup (Supabase)

### Your Supabase Configuration

✅ **Already configured:**
- **Database URL**: `postgresql://postgres.aqltcwzryeximjeuohpa:ayphenTextile@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`
- **Direct URL**: Same as above
- **Region**: Asia Pacific (ap-south-1)

### Verify Database Connection

1. Log in to Supabase Dashboard
2. Go to **"Database"** → **"Tables"**
3. You should see all Prisma-generated tables:
   - `users`
   - `companies`
   - `user_companies`
   - `products`
   - `orders`
   - `invoices`
   - `bills`
   - etc.

### Run Migrations (if needed)

If tables are missing, run migrations from your local machine:

```bash
# Set environment variables
export DATABASE_URL="postgresql://postgres.aqltcwzryeximjeuohpa:ayphenTextile@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Run migrations
npx prisma migrate deploy

# Verify
npx prisma studio
```

---

## Part 4: Post-Deployment Configuration

### Update CORS in Backend

Ensure your backend allows requests from Netlify:

1. In Render Dashboard, verify `CORS_ORIGIN` environment variable:
   ```
   CORS_ORIGIN=https://ayphentextile.netlify.app
   ```

2. If you have multiple domains, use comma-separated values:
   ```
   CORS_ORIGIN=https://ayphentextile.netlify.app,https://www.ayphentextile.com
   ```

### Update Frontend API URL

1. In Netlify Dashboard → **"Environment variables"**
2. Verify:
   ```
   VITE_API_BASE_URL=https://ayphen-textile-backend.onrender.com/api/v1
   ```

### Test Complete Flow

1. **Registration**:
   - Go to `https://ayphentextile.netlify.app/register`
   - Create a new account
   - Verify email/phone validation works

2. **Login**:
   - Login with created credentials
   - Check JWT token is stored in localStorage

3. **Company Creation**:
   - Create a new company
   - Verify company data is saved to Supabase

4. **Dashboard Access**:
   - Access dashboard
   - Verify data loads from backend

---

## Part 5: Monitoring & Troubleshooting

### Backend Monitoring (Render)

1. **Logs**: Render Dashboard → Your Service → **"Logs"**
2. **Metrics**: View CPU, Memory, Request count
3. **Health Checks**: Automatic health checks every 30 seconds

### Frontend Monitoring (Netlify)

1. **Deploy Logs**: Netlify Dashboard → **"Deploys"** → Click on deploy
2. **Function Logs**: If using Netlify Functions
3. **Analytics**: Netlify Analytics (paid feature)

### Common Issues & Solutions

#### Issue 1: Backend Not Starting

**Symptoms**: Render shows "Deploy failed" or service keeps restarting

**Solutions**:
1. Check Render logs for errors
2. Verify all environment variables are set correctly
3. Ensure DATABASE_URL is correct
4. Check Prisma migrations ran successfully

```bash
# In Render logs, look for:
✓ Prisma migrations completed
✓ Server started on port 10000
```

#### Issue 2: CORS Errors

**Symptoms**: Frontend shows "CORS policy" errors in browser console

**Solutions**:
1. Verify `CORS_ORIGIN` in Render matches your Netlify URL exactly
2. Include protocol (`https://`) in CORS_ORIGIN
3. Restart Render service after changing CORS_ORIGIN

#### Issue 3: Database Connection Timeout

**Symptoms**: "Connection timeout" errors in backend logs

**Solutions**:
1. Verify Supabase database is running
2. Check connection pool settings:
   ```
   DB_MAX_CONNECTIONS=10
   DB_CONNECTION_TIMEOUT=10000
   ```
3. Use Supabase pooler URL (port 5432) for better connection management

#### Issue 4: JWT Token Errors

**Symptoms**: "Invalid token" or "Token expired" errors

**Solutions**:
1. Verify JWT secrets are set in Render
2. Check token expiration times:
   ```
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   ```
3. Clear browser localStorage and login again

#### Issue 5: Frontend Build Fails

**Symptoms**: Netlify deploy fails during build

**Solutions**:
1. Check Netlify build logs
2. Verify `package.json` scripts are correct
3. Ensure all dependencies are in `package.json` (not just `devDependencies`)
4. Check Node version compatibility:
   ```toml
   [build.environment]
   NODE_VERSION = "18"
   ```

---

## Part 6: Security Best Practices

### Environment Variables

✅ **Never commit these to Git:**
- JWT secrets
- Database passwords
- API keys
- Session secrets

✅ **Use Render/Netlify environment variables** for all secrets

### Database Security

1. **Supabase**:
   - Enable Row Level Security (RLS) if needed
   - Use connection pooling
   - Regular backups (Supabase auto-backup)

2. **Connection Limits**:
   ```
   DB_MAX_CONNECTIONS=10  # Free tier limit
   ```

### API Security

1. **Rate Limiting**: Already configured
   ```
   RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
   RATE_LIMIT_MAX_REQUESTS=100  # 100 requests per window
   ```

2. **CORS**: Restrict to your domain only
   ```
   CORS_ORIGIN=https://ayphentextile.netlify.app
   ```

3. **HTTPS**: Both Render and Netlify provide free SSL

---

## Part 7: Scaling & Performance

### Free Tier Limitations

**Render Free Tier:**
- ⚠️ Service spins down after 15 minutes of inactivity
- ⚠️ Cold start takes 30-60 seconds
- ✅ 750 hours/month free
- ✅ Automatic HTTPS

**Netlify Free Tier:**
- ✅ 100 GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Unlimited sites
- ✅ Automatic HTTPS

**Supabase Free Tier:**
- ✅ 500 MB database
- ✅ 1 GB file storage
- ✅ 2 GB bandwidth
- ⚠️ Database pauses after 7 days of inactivity

### Optimization Tips

1. **Reduce Cold Starts**:
   - Use a cron job to ping your backend every 10 minutes
   - Example: Use cron-job.org to hit `/api/v1/health`

2. **Database Connection Pooling**:
   - Already configured with Supabase pooler
   - Adjust `DB_MAX_CONNECTIONS` based on usage

3. **Frontend Performance**:
   - Code splitting already configured in Vite
   - Static assets cached for 1 year
   - Gzip compression enabled

---

## Part 8: Backup & Recovery

### Database Backups (Supabase)

1. **Automatic Backups**:
   - Supabase automatically backs up daily
   - Retention: 7 days on free tier

2. **Manual Backup**:
   ```bash
   # Export database
   pg_dump "postgresql://postgres.aqltcwzryeximjeuohpa:ayphenTextile@aws-1-ap-south-1.pooler.supabase.com:5432/postgres" > backup.sql
   
   # Restore database
   psql "postgresql://postgres.aqltcwzryeximjeuohpa:ayphenTextile@aws-1-ap-south-1.pooler.supabase.com:5432/postgres" < backup.sql
   ```

### Code Backups

- ✅ GitHub repository (already set up)
- ✅ Render auto-deploys from GitHub
- ✅ Netlify auto-deploys from GitHub

---

## Part 9: Deployment Checklist

### Pre-Deployment

- [x] Remove unused backend services
- [x] Update environment variables
- [x] Test locally with production environment
- [x] Run database migrations
- [x] Update CORS configuration

### Backend Deployment

- [ ] Create Render account
- [ ] Create Redis instance
- [ ] Create web service
- [ ] Configure environment variables
- [ ] Set DATABASE_URL and DIRECT_URL
- [ ] Set JWT secrets
- [ ] Set CORS_ORIGIN
- [ ] Deploy and verify

### Frontend Deployment

- [ ] Create Netlify account
- [ ] Connect GitHub repository
- [ ] Configure build settings
- [ ] Set VITE_API_BASE_URL
- [ ] Deploy and verify
- [ ] Test complete user flow

### Post-Deployment

- [ ] Test registration
- [ ] Test login
- [ ] Test company creation
- [ ] Test all major features
- [ ] Monitor logs for errors
- [ ] Set up health check monitoring
- [ ] Configure custom domain (optional)

---

## Part 10: Support & Resources

### Documentation

- **Render**: https://render.com/docs
- **Netlify**: https://docs.netlify.com
- **Supabase**: https://supabase.com/docs
- **Prisma**: https://www.prisma.io/docs

### Monitoring Tools

- **Render Dashboard**: Real-time logs and metrics
- **Netlify Dashboard**: Deploy logs and analytics
- **Supabase Dashboard**: Database metrics and logs

### Getting Help

1. **Check Logs First**:
   - Render: Service → Logs
   - Netlify: Deploys → Deploy log
   - Supabase: Database → Logs

2. **Common Error Messages**:
   - "ECONNREFUSED": Database connection issue
   - "CORS error": CORS_ORIGIN mismatch
   - "Invalid token": JWT secret mismatch
   - "Migration failed": Database schema issue

---

## Deployment Complete! 🎉

Your Ayphen Textile ERP is now live:

- **Frontend**: https://ayphentextile.netlify.app
- **Backend**: https://ayphen-textile-backend.onrender.com
- **Database**: Supabase (Asia Pacific)

### Next Steps

1. Create your first admin account
2. Set up your company profile
3. Configure locations and products
4. Invite team members
5. Start managing your textile operations!

---

## Quick Reference

### Environment Variables Summary

**Render (Backend):**
```bash
DATABASE_URL=postgresql://postgres.aqltcwzryeximjeuohpa:ayphenTextile@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.aqltcwzryeximjeuohpa:ayphenTextile@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
CORS_ORIGIN=https://ayphentextile.netlify.app
NODE_ENV=production
JWT_SECRET=<GENERATE_32_CHAR_SECRET>
JWT_REFRESH_SECRET=<GENERATE_32_CHAR_SECRET>
SESSION_SECRET=<GENERATE_32_CHAR_SECRET>
```

**Netlify (Frontend):**
```bash
VITE_API_BASE_URL=https://ayphen-textile-backend.onrender.com/api/v1
```

### Useful Commands

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test backend health
curl https://ayphen-textile-backend.onrender.com/api/v1/health

# Run migrations locally
npx prisma migrate deploy

# View database
npx prisma studio
```

---

**Last Updated**: January 20, 2026  
**Version**: 1.0.0
