const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  registerUser,
  loginUser,
  googleAuthCallback,
} = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyAdmin } = require('../middlewares/adminMiddleware');

// Local Auth Routes
router.post('/register', verifyToken, verifyAdmin, registerUser);
router.post('/login', loginUser);

// Google OAuth Initiation
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth Callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/login' }),
  googleAuthCallback
);

// Testing the verifyToken middleware
router.get('/me', verifyToken, (req, res) => {
  res.status(200).json({ 
    message: 'Protected route data', 
    user_id: req.user.id 
  });
});

module.exports = router;
