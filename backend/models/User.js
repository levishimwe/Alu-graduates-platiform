const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    userType: { type: String, enum: ["graduate", "investor", "admin"], default: "graduate" },
    profileImage: { type: String, default: null },
    bio: { type: String, default: "" },
    skills: { type: [String], default: [] },
    university: { type: String, default: "" },
    graduationYear: { type: Number },
    degreeCertificate: { type: String, default: null },
    companyName: { type: String, default: "" },
    companyWebsite: { type: String, default: "" },
    country: { type: String, default: "" },
    city: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Only hash password if it hasn't been hashed already
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never return password in JSON responses
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);