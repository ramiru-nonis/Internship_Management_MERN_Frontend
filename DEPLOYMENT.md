# Deployment Guide - Frontend (Vercel)
## Prerequisites
- GitHub repository: https://github.com/ramiru-nonis/Internship_Management_MERN_Frontend
- Vercel account (sign up at https://vercel.com)
- Backend deployed on Railway

## Deployment Steps

### 1. Connect to Vercel
1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New Project"
3. Import `Internship_Management_MERN_Frontend` repository

### 2. Configure Environment Variables
In Vercel project settings, add the following environment variable:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | Your Railway backend URL | Backend API endpoint (e.g., `https://your-app.railway.app`) |

### 3. Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

## Post-Deployment

### Update Backend CORS
After deployment, update your Railway backend's `FRONTEND_URL` environment variable to match your Vercel URL:
```
FRONTEND_URL=https://your-project.vercel.app
```

### Custom Domain (Optional)
1. Go to Project Settings → Domains in Vercel
2. Add your custom domain
3. Follow DNS configuration instructions

## Troubleshooting

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility (>= 18.0.0)

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend CORS configuration
- Ensure backend is running on Railway

## Local Development
```bash
# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Update NEXT_PUBLIC_API_URL in .env.local
# For local backend: http://localhost:5001

# Run development server
npm run dev
```

## Redeployment
Vercel automatically redeploys when you push to the main branch. For manual deployment:
1. Go to Vercel dashboard
2. Select your project
3. Click "Redeploy" on the latest deployment
