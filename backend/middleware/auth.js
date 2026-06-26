const jwt = require('jsonwebtoken');

const useMongo = !!process.env.MONGO_URI;
let SqlUser = null;
let MongoUser = null;

if (useMongo) {
  MongoUser = require('../mongoModels/User');
} else {
  const { User } = require('../models');
  SqlUser = User;
}

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('Decoded token:', decoded);

    // Use userId from token (since that's what your JWT contains)
    const userId = decoded.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token - no userId found' });
    }

    const user = useMongo
      ? await MongoUser.findById(userId)
      : await SqlUser.findByPk(userId);
    
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(401).json({ message: 'User not found' });
    }

    // ✅ FIX: Add userId field for compatibility with projects route
    req.user = useMongo
      ? {
          id: user._id.toString(),
          userId: user._id.toString(),
          email: user.email,
          userType: user.userType
        }
      : {
          id: user.id,
          userId: user.id,
          email: user.email,
          userType: user.userType
        };

    console.log('Auth middleware - user set:', req.user);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;