const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), userType: user.userType },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

// Register
exports.register = async (req, res) => {
  const { email, password, userType, firstName, lastName, country, city } = req.body;

  try {
    const existingUser = await User.findOne({ email, userType });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      userType,
      firstName,
      lastName,
      country,
      city,
      isVerified: false,
    });

    return res.status(201).json({
      message: "Registered successfully. Please verify your email.",
      token: signToken(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password, userType } = req.body;

  try {
    const user = await User.findOne({ email, userType });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Invalid password" });

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ token: signToken(user), user: userObj });
  } catch (error) {
    res.status(500).json({ message: "Login error", error: error.message });
  }
};

// Google OAuth callback
exports.googleOAuth = (req, res) => {
  res.status(501).json({ message: "Google OAuth not implemented yet." });
};

// Logout (JWT is stateless — client just deletes the token)
exports.logout = (req, res) => {
  res.json({ message: "Logged out successfully." });
};

// Forgot password
exports.forgotPassword = (req, res) => {
  res.status(501).json({ message: "Forgot password not implemented yet." });
};

// Reset password
exports.resetPassword = (req, res) => {
  res.status(501).json({ message: "Reset password not implemented yet." });
};

// Verify email
exports.verifyEmail = (req, res) => {
  res.status(501).json({ message: `Email verification not implemented yet. Token: ${req.params.token}` });
};