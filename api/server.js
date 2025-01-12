// FOR VERCEL 

require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const Razorpay = require("razorpay");

// Initialize Express App
const app = express();

// Enable CORS
// const corsOptions = {
//   origin: ['https://swarparivrittidemo.vercel.app'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true, // Include credentials if needed
// };
// app.use(cors(corsOptions));

// Handle preflight requests explicitly
// app.options("*", cors(corsOptions)); // Allow OPTIONS for all routes

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.raw({ type: "application/json" })); // Required for Razorpay Webhook

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Razorpay Configuration
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: '' },
  subscriptionStatus: { type: Boolean, default: false },
  subscriptionPlan: {
    type: String,
    enum: ["Monthly Plan", "6-Month Plan", "Yearly Plan", "basicTokenBased", "standardTokenBased", "premiumTokenBased"]
  },
  subscriptionExpiry: { type: Date, default: null },
  convertCount: { type: Number, default: 0 } // Field to track convert button clicks
});

const User = mongoose.model("User", userSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  subscriptionPlan: {
    type: String,
    enum: ["Monthly Plan", "6-Month Plan", "Yearly Plan", "basicTokenBased", "standardTokenBased", "premiumTokenBased"],
    required: true,
  },
  orderId: { type: String, required: true },
  paymentStatus: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
});

const Order = mongoose.model("Order", orderSchema);

// Middleware to authenticate user
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

app.get("/health", (req, res) => {
  res.status(200).json({
    version: "v1.0"
  });
});

// Define Routes
app.get("/api/checkSubscription", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isActive =
      user.subscriptionStatus &&
      (user.subscriptionExpiry === null || user.subscriptionExpiry > new Date()) &&
      (
        (user.subscriptionPlan === 'basicTokenBased' && user.convertCount <= 100) ||
        (user.subscriptionPlan === 'standardTokenBased' && user.convertCount <= 250) ||
        (user.subscriptionPlan === 'premiumTokenBased' && user.convertCount <= 500)
      );

    res.status(200).json({
      subscriptionActive: isActive,
      subscriptionExpiry: user.subscriptionExpiry,
      subscriptionPlan: user.subscriptionPlan,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/createOrder", authenticateUser, async (req, res) => {
  try {
    const { amount, subscriptionPlan } = req.body;

    if (!amount || !subscriptionPlan) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let expiresAt = null; // Default to null for token-based plans
    if (subscriptionPlan === "Monthly Plan") {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (subscriptionPlan === "6-Month Plan") {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 6);
    } else if (subscriptionPlan === "Yearly Plan") {
      expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    const order = await razorpayInstance.orders.create({
      amount: amount * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    });

    const newOrder = new Order({
      userId: req.user.id,
      amount,
      subscriptionPlan,
      orderId: order.id,
      expiresAt,
    });

    await newOrder.save();
    res.status(201).json({
      message: "Order created successfully",
      order: newOrder,
      key_id: process.env.RAZORPAY_KEY_ID,
      amount: amount * 100,
      order_id: order.id,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error registering user." });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ message: "Login successful!", token, userEmail: user.email });
  } catch (err) {
    res.status(500).json({ message: "Error logging in." });
  }
});

app.post('/api/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {

  console.log(`Server running on http://localhost:${PORT}`);
});

// Export Express App as Serverless Function
module.exports = app;
