# Power Monitoring System Setup Guide

This guide helps you set up the Power Monitoring System after cloning from GitHub.

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone https://github.com/Monchel-Emmy/power_monitoring_system.git
cd power_monitoring_system
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Setup

#### Backend Environment
Copy `backend/.env.example` to `backend/.env` and configure:

```bash
# Required for Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Required for email functionality
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password

# Required for authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Required for database
MONGODB_URI=mongodb://localhost:27017/powermonitoring
```

#### Frontend Environment
Copy `frontend/.env.example` to `frontend/.env`:
```bash
REACT_APP_API_BASE=http://localhost:4000
```

### 3. Google OAuth Setup (Required for Google Login)

1. **Go to**: https://console.cloud.google.com/
2. **Create project** or select existing
3. **Enable APIs**: Google+ API, Gmail API
4. **Create Credentials**:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Select "Web Application"
   - Add authorized redirect URIs:
     - Development: `http://localhost:4000/api/auth/google/callback`
     - Production: `https://yourdomain.com/api/auth/google/callback`
5. **Copy Client ID and Secret** to your `.env`

### 4. Gmail Setup (Required for Email Features)

1. **Enable 2-Step Verification** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account → Security → App Passwords
   - Create new app password
   - Use this password in `EMAIL_PASS`
3. **Configure Gmail settings** in your `.env`

### 5. Database Setup

#### Option A: Local MongoDB (Recommended for development)
```bash
# Install and start MongoDB
# Windows: Use MongoDB Compass or install MongoDB service
# Mac: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Your .env should have:
MONGODB_URI=mongodb://localhost:27017/powermonitoring
```

#### Option B: MongoDB Atlas (Recommended for production)
1. **Go to**: https://cloud.mongodb.com/
2. **Create cluster**
3. **Get connection string**
4. **Add to .env**:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/powermonitoring
```

### 6. Start Development Servers

```bash
# Terminal 1: Start Backend
cd backend
npm start

# Terminal 2: Start Frontend  
cd frontend
npm start
```

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Login Pages**: 
  - Login: http://localhost:3000/login
  - Signup: http://localhost:3000/signup
  - Forgot Password: http://localhost:3000/forgot-password

## 🎯 Features Available

### Authentication
- ✅ Email/Password Login & Signup
- ✅ Google OAuth 2.0 Login & Signup  
- ✅ Email Verification (Real Gmail delivery)
- ✅ Password Reset (15-minute secure tokens)
- ✅ Role-based Access Control (Admin/Manager/User)

### Security Features
- 🔐 JWT Authentication
- 📧 Real Email Service (Gmail SMTP)
- 🛡️ Email Enumeration Protection
- 📊 Audit Logging
- 🔒 Secure Token Generation

## 🚨 Troubleshooting

### Google OAuth Issues
- **Redirect URI Mismatch**: Check Google Console redirect URIs
- **Client ID Invalid**: Verify GOOGLE_CLIENT_ID in .env
- **Access Blocked**: Enable Google+ API in console

### Email Issues  
- **Email Not Sending**: Check Gmail app password
- **SMTP Error**: Verify EMAIL_HOST and EMAIL_PORT
- **Spam Folder**: Check Gmail spam/promotions

### Database Issues
- **Connection Failed**: Check MongoDB is running
- **Auth Failed**: Verify MONGODB_URI is correct
- **Seed Data**: Run `npm run seed` in backend

### Port Issues
- **Port 4000 in use**: Change PORT in .env
- **Port 3000 in use**: Frontend will auto-detect new port

## 🌍 Deployment

### Environment Variables for Production
```bash
# Google OAuth (Production)
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret

# Email Service (Production)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_production_email@gmail.com
EMAIL_PASS=your_production_app_password

# Database (Production)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/powermonitoring

# Security (Production)
JWT_SECRET=your_super_secure_production_secret
FRONTEND_ORIGIN=https://yourdomain.com
```

### Deployment Platforms
- **Vercel**: Recommended for frontend
- **Heroku/Render**: Good for backend
- **MongoDB Atlas**: Recommended for database

## 📞 Support

If you encounter issues:
1. Check this setup guide
2. Verify all environment variables
3. Ensure all services are running
4. Check browser console for errors

**Happy Coding! 🚀**
