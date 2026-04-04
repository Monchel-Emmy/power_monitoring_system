# Troubleshooting Guide

## 🚨 Common Network Errors & Solutions

### Error: "Network Error" or "Failed to fetch"

#### **Problem:** Frontend can't connect to backend

**Solutions:**

1. **Check Backend Status:**
   ```bash
   # Test if backend is running
   curl http://localhost:4000
   # Should return: {"message":"Power Monitoring API"}
   ```

2. **Verify Frontend API URL:**
   ```bash
   # Check frontend/.env
   REACT_APP_API_BASE=http://localhost:4000
   ```

3. **Check CORS Configuration:**
   ```bash
   # Check backend/.env
   FRONTEND_ORIGIN=http://localhost:3000
   ```

4. **Restart Services:**
   ```bash
   # Kill all node processes
   taskkill /F /IM node.exe  # Windows
   # Restart both services
   npm run dev
   ```

### Error: "Email service unavailable"

#### **Problem:** Gmail SMTP blocked

**Solutions:**

1. **Use SendGrid (Recommended):**
   ```bash
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASS=your_sendgrid_api_key
   ```

2. **Use Email Fallback:**
   - System will show verification code in yellow box
   - No email required for testing

3. **Check Gmail App Password:**
   - Enable 2-step verification
   - Generate new app password
   - Update EMAIL_PASS

### Error: "MongoDB connection failed"

#### **Problem:** Database access blocked

**Solutions:**

1. **Use Local MongoDB (Easiest):**
   ```bash
   MONGODB_URI=mongodb://localhost:27017/powermonitoring
   ```

2. **MongoDB Atlas IP Whitelist:**
   - Go to MongoDB Atlas → Network Access
   - Add IP: `0.0.0.0/0` (allows all IPs)

3. **Check Atlas Credentials:**
   - Verify username/password
   - Check cluster name
   - Test connection string

### Error: "Google OAuth redirect mismatch"

#### **Problem:** OAuth configuration incorrect

**Solutions:**

1. **Update Google Console:**
   - Go to: https://console.cloud.google.com/
   - Add redirect URI: `http://localhost:4000/api/auth/google/callback`
   - Add JavaScript origin: `http://localhost:3000`

2. **Check Environment Variables:**
   ```bash
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

## 🔧 Quick Setup Commands

### **Fresh Setup:**
```bash
git clone https://github.com/Monchel-Emmy/power_monitoring_system.git
cd power_monitoring_system
npm run setup:env
npm run install:all
```

### **Environment Setup:**
```bash
# Backend (.env)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_secret_key
MONGODB_URI=mongodb://localhost:27017/powermonitoring
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
FRONTEND_ORIGIN=http://localhost:3000

# Frontend (.env)
REACT_APP_API_BASE=http://localhost:4000
```

### **Start Services:**
```bash
npm run dev
```

## 🎯 Debug Checklist

### **Before Starting:**
- [ ] Node.js installed
- [ ] MongoDB running (or Atlas configured)
- [ ] Environment files created
- [ ] Google OAuth configured (if using)

### **Backend Health Check:**
- [ ] Backend starts without errors
- [ ] `http://localhost:4000` responds
- [ ] MongoDB connects successfully
- [ ] Email service configured

### **Frontend Health Check:**
- [ ] Frontend starts without errors
- [ ] `http://localhost:3000` loads
- [ ] API calls to backend work
- [ ] No CORS errors in console

### **Authentication Flow:**
- [ ] Signup works
- [ ] Email verification works (or shows code)
- [ ] Login works
- [ ] Google OAuth works (if configured)

## 🚨 Emergency Fixes

### **If Nothing Works:**
1. **Use Local MongoDB:**
   ```bash
   MONGODB_URI=mongodb://localhost:27017/powermonitoring
   ```

2. **Disable Email:**
   ```bash
   # Comment out email variables
   # EMAIL_HOST=smtp.gmail.com
   ```

3. **Use Email Fallback:**
   - System will show verification codes
   - No email required

4. **Reset Everything:**
   ```bash
   # Clean start
   taskkill /F /IM node.exe
   npm run install:all
   npm run dev
   ```

## 📞 Get Help

If issues persist:
1. Check this guide first
2. Verify all environment variables
3. Check browser console for errors
4. Check backend logs for detailed errors

**Happy debugging! 🚀**
