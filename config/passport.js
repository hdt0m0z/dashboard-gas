const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'MOCK_ID',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'MOCK_SECRET',
      callbackURL: '/api/auth/google/callback',
      passReqToCallback: true
    },
    async (request, accessToken, refreshToken, profile, done) => {
      try {
        // Kiểm tra xem user có tồn tại chưa
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, user);
        }

        // Nếu user đã có bằng email (đăng ký tay)
        if(profile.emails && profile.emails.length > 0) {
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
              user.googleId = profile.id; // Link tài khoản
              await user.save();
              return done(null, user);
            }
        }

        // Nếu mới hoàn toàn
        const newUser = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails ? profile.emails[0].value : `google_${profile.id}@gmail.com`,
        });
        
        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// Do web sử dụng JWT Stateless API nên không cần Serialize Session.
module.exports = passport;
