const { body, validationResult } = require("express-validator");

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Validation failed", details: errors.array() });
  }
  next();
};

exports.registerValidator = [
  body("firstName").trim().isLength({ min: 2, max: 50 }).withMessage("First name must be 2-50 characters"),
  body("lastName").trim().isLength({ min: 2, max: 50 }).withMessage("Last name must be 2-50 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("userType").isIn(["graduate", "investor", "admin"]).withMessage("Invalid user type"),
  handleValidation,
];

exports.projectValidator = [
  body("title").trim().isLength({ min: 3, max: 255 }).withMessage("Title must be 3-255 characters"),
  body("description").trim().isLength({ min: 10 }).withMessage("Description must be at least 10 characters"),
  body("category").notEmpty().withMessage("Category is required"),
  handleValidation,
];

exports.messageValidator = [
  body("content").notEmpty().withMessage("Message content is required"),
  body("receiverId").notEmpty().withMessage("Receiver ID is required"),
  handleValidation,
];