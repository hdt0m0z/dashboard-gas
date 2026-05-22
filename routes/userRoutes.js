const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  getUserProfile,
  updateUserProfile,
  changeUserPassword
} = require('../controllers/userController');

const { verifyAdmin } = require('../middlewares/adminMiddleware');

// Define API routes, protected by verifyToken middleware
router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);
router.put('/change-password', verifyToken, changeUserPassword);

// Admin only routes
router.get('/', verifyToken, verifyAdmin, require('../controllers/userController').getAllUsers);
router.delete('/:id', verifyToken, verifyAdmin, require('../controllers/userController').deleteUser);
router.put('/:id/reset-password', verifyToken, verifyAdmin, require('../controllers/userController').resetUserPassword);

module.exports = router;
