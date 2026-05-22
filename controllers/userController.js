const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Lấy thông tin User hiện tại (Loại bỏ mật khẩu khỏi JSON respones)
// @route   GET /api/user/profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi Server', error: error.message });
  }
};

// @desc    Cập nhật thông tin User
// @route   PUT /api/user/profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      
      
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email
      });
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi Server', error: error.message });
  }
};

// @desc    Đổi mật khẩu người dùng
// @route   PUT /api/user/change-password
const changeUserPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    
    // Yêu cầu đăng nhập Google sẽ bỏ qua trường mật khẩu => Cần test user.password
    if(!user.password) {
        return res.status(400).json({ message: 'Tài khoản này đang liên kết với Google. Không thể đổi mật khẩu.'});
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác' });
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();

    res.status(200).json({ message: 'Đổi mật khẩu thành công' });
    
  } catch (error) {
    res.status(500).json({ message: 'Lỗi Server', error: error.message });
  }
};

// @desc    Lấy tất cả người dùng (Admin only)
// @route   GET /api/user
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi Server', error: error.message });
  }
};

// @desc    Xóa người dùng (Admin only)
// @route   DELETE /api/user/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    if (user.role === 'admin' && user.email === 'ducthaihoang2003@gmail.com') {
      return res.status(400).json({ message: 'Không thể xóa Root Admin' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa người dùng thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi Server', error: error.message });
  }
};

// @desc    Admin đặt lại mật khẩu cho người dùng
// @route   PUT /api/user/:id/reset-password
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công!' });
    
  } catch (error) {
    res.status(500).json({ message: 'Lỗi Server', error: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  getAllUsers,
  deleteUser,
  resetUserPassword
};
