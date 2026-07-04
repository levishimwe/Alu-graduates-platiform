const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      userType: user.userType,
    };

    next();
  } catch  {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Role-based access control middleware
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.userType)) {
    return res.status(403).json({ message: "Access denied: insufficient permissions" });
  }
  next();
};

module.exports = { auth, requireRole };