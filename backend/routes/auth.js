const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { auth } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();


const countries = [
  "Afghanistan", "Albania", "Algeria", "Angola", "Argentina", "Australia",
  "Austria", "Bangladesh", "Belgium", "Botswana", "Brazil", "Burkina Faso",
  "Burundi", "Cameroon", "Canada", "Chad", "China", "Congo",
  "Democratic Republic of Congo", "Egypt", "Ethiopia", "France", "Germany",
  "Ghana", "India", "Kenya", "Libya", "Madagascar", "Mali", "Morocco",
  "Mozambique", "Niger", "Nigeria", "Rwanda", "South Africa", "Tanzania",
  "Tunisia", "Uganda", "United Kingdom", "United States", "Zambia",
  "Zimbabwe", "Other",
];

const signToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), userType: user.userType },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

// Register
router.post(
  "/register",
  [
    body("firstName").trim().isLength({ min: 2, max: 50 }).withMessage("First name must be 2-50 characters"),
    body("lastName").trim().isLength({ min: 2, max: 50 }).withMessage("Last name must be 2-50 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .custom((password, { req }) => {
        if (req.body.userType === "admin") return true;
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
          throw new Error("Password must contain uppercase, lowercase, and a number");
        }
        return true;
      }),
    body("userType")
      .isIn(["graduate", "investor", "admin"])
      .withMessage("User type must be graduate, investor, or admin"),
    body("adminSecretKey").custom((value, { req }) => {
      if (req.body.userType === "admin") {
        if (value !==process.env.ADMIN_SECRET_KEY) {
          throw new Error("Invalid admin secret key");
        }
      }
      return true;
    }),
    body("country")
  .optional({ nullable: true, checkFalsy: true })
  .isIn(countries)
  .withMessage("Invalid country"),

body("city")
  .optional({ nullable: true, checkFalsy: true })
  .trim()
  .isLength({ min: 2, max: 100 })
  .withMessage("City must be 2-100 characters"),

body("graduationYear")
  .optional({ nullable: true, checkFalsy: true })
  .isInt({ min: 1950, max: new Date().getFullYear() + 10 })
  .withMessage("Invalid graduation year"),

body("companyWebsite")
  .optional({ nullable: true, checkFalsy: true })
  .isURL()
  .withMessage("Invalid company website URL"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Validation failed", details: errors.array() });
    }

    try {
      const {
        firstName, lastName, email, password, userType,
        profileImage, bio, university, graduationYear,
        degreeCertificate, companyName, companyWebsite, country, city,
      } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }

      const userData = { firstName, lastName, email, password, userType, isActive: true };

      if (userType !== "admin") {
        if (profileImage) userData.profileImage = profileImage;
        if (bio) userData.bio = bio;
        if (country) userData.country = country;
        if (city) userData.city = city;

        if (userType === "graduate") {
          if (university) userData.university = university;
          if (graduationYear) userData.graduationYear = graduationYear;
          if (degreeCertificate) userData.degreeCertificate = degreeCertificate;
        }

        if (userType === "investor") {
          if (companyName) userData.companyName = companyName;
          if (companyWebsite) userData.companyWebsite = companyWebsite;
        }
      }

      // User model pre-save hook handles password hashing
      const user = await User.create(userData);

      res.status(201).json({
        message: "User registered successfully",
        token: signToken(user),
        user,
      });
    } catch (error) {
      res.status(500).json({ error: "Registration failed", message: error.message });
    }
  }
);

// Login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Validation failed", details: errors.array() });
    }

    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: "Invalid email or password" });

      if (!user.isActive) {
        return res.status(401).json({ error: "Account deactivated. Please contact support." });
      }

      const isValid = await user.comparePassword(password);
      if (!isValid) return res.status(401).json({ error: "Invalid email or password" });

      user.lastLogin = new Date();
      await user.save();

      res.json({
        message: "Login successful",
        token: signToken(user),
        user,
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed", message: error.message });
    }
  }
);

// Get profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve profile", message: error.message });
  }
});

// Update profile
router.put("/profile", auth, async (req, res) => {
  try {
    const allowed = [
      "firstName", "lastName", "bio", "university", "graduationYear",
      "degreeCertificate", "companyName", "companyWebsite", "country", "city",
      "profileImage", "skills",
    ];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile", message: error.message });
  }
});

// Change password
router.put(
  "/change-password",
  auth,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Must contain uppercase, lowercase, and a number"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) throw new Error("Passwords do not match");
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Validation failed", details: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const isValid = await user.comparePassword(req.body.currentPassword);
      if (!isValid) return res.status(400).json({ error: "Current password is incorrect" });

      user.password = req.body.newPassword;
      await user.save();

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to change password", message: error.message });
    }
  }
);

// Verify token
router.get("/verify", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isActive) return res.status(401).json({ error: "Invalid or inactive user" });
    res.json({ message: "Token is valid", user });
  } catch (error) {
    res.status(500).json({ error: "Token verification failed", message: error.message });
  }
});

// Logout
router.post("/logout", auth, (_req, res) => {
  res.json({ message: "Logout successful" });
});

// Deactivate account
router.delete(
  "/account",
  auth,
  [body("password").notEmpty().withMessage("Password is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Validation failed", details: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const isValid = await user.comparePassword(req.body.password);
      if (!isValid) return res.status(400).json({ error: "Incorrect password" });

      user.isActive = false;
      await user.save();

      res.json({ message: "Account deactivated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to deactivate account", message: error.message });
    }
  }
);

module.exports = router;
