const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  getUserProfile,
  updateUserProfile,
  changeUserPassword
} = require('../controllers/userController');

// Define API routes, protected by verifyToken middleware
router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);
router.put('/change-password', verifyToken, changeUserPassword);

module.exports = router;
