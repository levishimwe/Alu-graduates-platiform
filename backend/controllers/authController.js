const bcrypt = require('bcryptjs');
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

const signToken = (user) => jwt.sign(
  { id: useMongo ? user._id.toString() : user.id, userType: user.userType },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);

exports.register = async (req, res) => {
  const { email, password, userType, firstName, lastName, country, city } = req.body;

  try {
    const existingUser = useMongo
      ? await MongoUser.findOne({ email })
      : await SqlUser.findOne({ where: { email, userType } });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const userData = { email, password, userType, firstName, lastName, country, city, isVerified: false };
    const user = useMongo ? await MongoUser.create(userData) : await SqlUser.create({ ...userData, password: await bcrypt.hash(password, 10) });

    return res.status(201).json({
      message: 'Registered successfully, verify email.',
      token: signToken(user)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password, userType } = req.body;
  try {
    const user = useMongo
      ? await MongoUser.findOne({ email, userType })
      : await SqlUser.findOne({ where: { email, userType } });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = useMongo ? await user.comparePassword(password) : await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid password' });

    res.json({ token: signToken(user), user });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error });
  }
};

exports.googleOAuth = (req, res) => res.send('Google OAuth not implemented yet.');
exports.linkedinOAuth = (req, res) => res.send('LinkedIn OAuth not implemented yet.');
exports.logout = (req, res) => res.send('Logout not implemented yet.');
exports.forgotPassword = (req, res) => res.send('Forgot password not implemented yet.');
exports.resetPassword = (req, res) => res.send('Reset password not implemented yet.');
exports.verifyEmail = (req, res) => res.send(`Verifying email with token: ${req.params.token}`);
