const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// POST /api/auth/register  (admin creates accounts in a real deployment;
// kept open here so it's easy to demo / seed users during your project review)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, studentProfile } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "A user with this email already exists." });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "student",
      studentProfile: studentProfile || undefined,
    });

    return res.status(201).json({
      user: user.toSafeObject(),
      token: generateToken(user._id),
    });
  } catch (err) {
    return res.status(500).json({ message: "Registration failed.", error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated." });
    }

    return res.json({
      user: user.toSafeObject(),
      token: generateToken(user._id),
    });
  } catch (err) {
    return res.status(500).json({ message: "Login failed.", error: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  return res.json({ user: req.user.toSafeObject ? req.user.toSafeObject() : req.user });
};
