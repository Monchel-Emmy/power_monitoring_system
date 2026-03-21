require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      // Existing user - update Google info
      user.googleId = profile.id;
      user.email = profile.emails[0].value;
      user.avatar = profile.photos[0].value;
      await user.save();
      return done(null, user);
    } else {
      // Check if user exists by email (for linking accounts)
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // Link Google to existing account
        user.googleId = profile.id;
        user.avatar = profile.photos[0].value;
        await user.save();
        return done(null, user);
      } else {
        // Create new user from Google
        const newUser = new User({
          username: profile.displayName.replace(/\s+/g, '.').toLowerCase(),
          email: profile.emails[0].value,
          googleId: profile.id,
          avatar: profile.photos[0].value,
          role: 'user', // Default role, can be upgraded later
          status: 'Active',
          isEmailVerified: true, // Google emails are pre-verified
          buildings: [],
        });
        await newUser.save();
        return done(null, newUser);
      }
    }
  } catch (error) {
    return done(error, null);
  }
}));

// Configure passport serialization
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
