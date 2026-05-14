const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT Helper
const generateToken = (userId) => {
  // Token expires in 30 days
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { email, password, name, phone, department } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phone: phone || "",
      department: department || ""
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    // Check user and verify password 
    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Google OAuth Callback
// @route   GET /api/auth/google/callback
const googleAuthCallback = (req, res) => {
  // Upon successful authentication, Passport attaches user to req
  const token = generateToken(req.user._id);
  
  // Chuyển hướng người dùng về trang giao diện (SPA Frontend) kèm token
  // Frontend sẽ tự đọc URL, lưu token vào trình duyệt và chuyển thẳng vào Dashboard.
  res.redirect('/?token=' + token);
};

module.exports = {
  registerUser,
  loginUser,
  googleAuthCallback,
};
