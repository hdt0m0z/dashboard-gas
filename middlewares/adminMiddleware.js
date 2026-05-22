const User = require('../models/User');

const verifyAdmin = async (req, res, next) => {
  try {
    // req.user is set by verifyToken middleware (has id)
    const user = await User.findById(req.user.id);
    if (user && user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ message: 'Truy cập bị từ chối: Yêu cầu quyền Quản trị viên (Admin)' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi xác thực quyền Admin', error: error.message });
  }
};

module.exports = { verifyAdmin };
