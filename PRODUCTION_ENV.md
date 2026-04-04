# PRODUCTION ENVIRONMENT VARIABLES

Copy these to your hosting provider (Render, Railway, etc.) and fill in your actual values.

## Required Variables

```
PORT=4000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/powermonitoring
JWT_SECRET=your-long-random-secret-string
FRONTEND_ORIGIN=https://your-frontend-domain.vercel.app
```

## Google OAuth
```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Email Service (Gmail)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

> **Note:** Never commit real credentials to version control.
> Add `.env` to `.gitignore` and set real values only in your hosting provider's environment settings.
