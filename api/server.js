// require("dotenv").config(); // Load environment variables
// const express = require("express");
// const mongoose = require("mongoose");
// const bodyParser = require("body-parser");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const cors = require("cors");
// const Razorpay = require("razorpay");
// const path = require("path");

// const app = express();

// // Enable CORS
// const corsOptions = {
//   origin: 'http://localhost:5500', // Update with your frontend URL
//   methods: ['GET', 'POST', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// };
// app.use(cors(corsOptions));


// // Middleware
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.raw({ type: "application/json" })); // Required for Razorpay Webhook

// // Connect to MongoDB Atlas
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("Connected to MongoDB Atlas"))
//   .catch((err) => console.error("Error connecting to MongoDB:", err));

// // Razorpay Configuration
// const razorpayInstance = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_SECRET,
// });

// // User Schema
// const userSchema = new mongoose.Schema({
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   name: { type: String, default: '' },
//   subscriptionStatus: { type: Boolean, default: false },
//   subscriptionPlan: {
//     type: String,
//     enum: ["Monthly Plan", "6-Month Plan", "Yearly Plan", "basicTokenBased", "standardTokenBased", "premiumTokenBased"]
//   }, 
//   subscriptionExpiry: { type: Date, default: null },
//   convertCount: { type: Number, default: 0 } // Field to track convert button clicks
// });

// const User = mongoose.model("User", userSchema);

// // Order Schema
// const orderSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   amount: { type: Number, required: true },
//   subscriptionPlan: {
//     type: String,
//     enum: ["Monthly Plan", "6-Month Plan", "Yearly Plan", "basicTokenBased", "standardTokenBased", "premiumTokenBased"],
//     required: true,
//   }, orderId: { type: String, required: true },
//   paymentStatus: { type: String, default: "pending" }, // Default to "pending"
//   createdAt: { type: Date, default: Date.now },
//   expiresAt: { type: Date, default: null }, // For token-based plans
// });

// const Order = mongoose.model("Order", orderSchema);

// // Middleware to authenticate user
// const authenticateUser = (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token) {
//     return res.status(401).json({ message: "Access denied. No token provided." });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     console.log("Authenticated User:", req.user);
//     next();
//   } catch (err) {
//     console.error("Token Verification Error:", err.message);
//     res.status(401).json({ message: "Invalid or expired token." });
//   }
// };

// // Route to Check Subscription Status
// app.get("/api/checkSubscription", authenticateUser, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     console.log("User:", user);

//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     // Check subscription status and expiry

//     console.log("SubscriptionExpiry Active:", user.subscriptionExpiry);

//      //const isActive =
//     //   user.subscriptionStatus &&
//     //   (user.subscriptionExpiry === null || user.subscriptionExpiry > new Date());

//     const isActive =
//   user.subscriptionStatus &&
//   (user.subscriptionExpiry === null || user.subscriptionExpiry > new Date()) &&
//   (
//     (user.subscriptionPlan === 'basicTokenBased' && user.convertCount <= 100) || 
//     (user.subscriptionPlan === 'standardTokenBased' && user.convertCount <= 250) || 
//     (user.subscriptionPlan === 'premiumTokenBased' && user.convertCount <= 500)
//   );

//   // user.subscriptionStatus &&
//   // (
//   //   // Token-based subscription validation
//   //   (
//   //     ["basicTokenBased", "standardTokenBased", "premiumTokenBased"].includes(user.subscriptionPlan) &&
//   //     (user.subscriptionExpiry === null) &&
//   //     (
//   //       (user.subscriptionPlan === 'basicTokenBased' && user.convertCount <= 100) || 
//   //       (user.subscriptionPlan === 'standardTokenBased' && user.convertCount <= 250) || 
//   //       (user.subscriptionPlan === 'premiumTokenBased' && user.convertCount <= 500)
//   //     )
//   //   ) ||
//   //   // Non-token-based subscription validation
//   //   (
//   //     ["Monthly Plan", "6-Month Plan", "Yearly Plan"].includes(user.subscriptionPlan) &&
//   //     (user.subscriptionExpiry > new Date())
//   //   )
//   // );

//     console.log("Subscription Active:", isActive);

//     res.status(200).json({
//       subscriptionActive: isActive,
//       subscriptionExpiry: user.subscriptionExpiry,
//       subscriptionPlan: user.subscriptionPlan,
//     });
//   } catch (error) {
//     console.error("Error checking subscription:", error.message);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });


// // Serve Product Page (HTML File)
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "membership.html"));
// });


// // Route to Create Razorpay Order
// app.post("/api/createOrder", authenticateUser, async (req, res) => {
//   try {
//     const { amount, subscriptionPlan } = req.body;

//     if (!amount || !subscriptionPlan) {
//       return res.status(400).json({ message: "Invalid request data" });
//     }

//     const user = await User.findById(req.user.id);
//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     // Determine expiration time
//     let expiresAt = null; // Default to null for token-based plans
//     if (subscriptionPlan === "Monthly Plan") {
//       expiresAt = new Date();
//       expiresAt.setMonth(expiresAt.getMonth() + 1);
//     } else if (subscriptionPlan === "6-Month Plan") {
//       expiresAt = new Date();
//       expiresAt.setMonth(expiresAt.getMonth() + 6);
//     } else if (subscriptionPlan === "Yearly Plan") {
//       expiresAt = new Date();
//       expiresAt.setFullYear(expiresAt.getFullYear() + 1);
//     }

//     // Create a new order
//     const order = await razorpayInstance.orders.create({
//       amount: amount * 100, // Amount in paise
//       currency: "INR",
//       receipt: `receipt_order_${Date.now()}`,
//     });

//     // Save the order in the database
//     const newOrder = new Order({
//       userId: req.user.id,
//       amount,
//       subscriptionPlan,
//       orderId: order.id,
//       expiresAt, // Explicitly set calculated or null value
//     });

//     await newOrder.save();
//     res.status(201).json({ 
//       message: "Order created successfully", 
//       order: newOrder,
//       key_id: process.env.RAZORPAY_KEY_ID, // Add this line
//       amount: amount * 100,
//       order_id: order.id
//     });  } catch (error) {
//     console.error("Error creating order:", error.message);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// // Route to Simulate Payment Success (Test Mode)
// app.post("/api/simulatePaymentSuccess", authenticateUser, async (req, res) => {
//   try {
//     const { orderId } = req.body;

//     if (!orderId) {
//       return res.status(400).json({ message: "Order ID is required." });
//     }

//     const order = await Order.findOne({
//       orderId,
//       userId: req.user.id,
//     });

//     if (!order) {
//       return res.status(404).json({ message: "Order not found." });
//     }

//     order.paymentStatus = "completed";
//     await order.save();

//     const updatedUser = await User.findByIdAndUpdate(
//       req.user.id,
//       {
//         subscriptionStatus: true,
//         subscriptionPlan: order.subscriptionPlan,
//         subscriptionExpiry: order.expiresAt ?? null, // Explicitly set null if undefined
//       },
//       { new: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Payment success simulated. Subscription is now active.",
//     });
//   } catch (error) {
//     console.error("Error simulating payment success:", error.message);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// // User Registration Route
// app.post("/api/register", async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     return res.status(400).json({ message: "Email and password are required." });
//   }

//   try {
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = new User({ email, password: hashedPassword });
//     await newUser.save();
//     res.status(201).json({ message: "User registered successfully!" });
//   } catch (err) {
//     console.error("Error registering user:", err.message);
//     res.status(500).json({ message: "Error registering user." });
//   }
// });

// // User Login Route
// app.post("/api/login", async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     return res.status(400).json({ message: "Email and password are required." });
//   }

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid credentials." });
//     }

//     const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
//     console.log("Log in Token", token);
//     res.status(200).json({ message: "Login successful!", token, userEmail: user.email });

//   } catch (err) {
//     console.error("Error during login:", err.message);
//     res.status(500).json({ message: "Error logging in." });
//   }
// });

// app.post('/api/logout', (req, res) => {
//   res.json({ message: 'Logout successful' });
// }
// );

// app.post('/api/increment-convert', async (req, res) => {
//   const { email } = req.body; // Identify user by email (simplest way)

//   try {
//     // Find user by email and increment convertCount by 1
//     const user = await User.findOneAndUpdate(
//       { email }, // Filter by email
//       { $inc: { convertCount: 1 } }, // Increment convertCount
//       { new: true } // Return updated document
//     );

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     console.log('Convert count updated:', user.convertCount);
//     res.json({ message: 'Convert count updated', convertCount: user.convertCount });
//   } catch (err) {
//     res.status(500).json({ message: 'Error updating count', error: err.message });
//   }
// });

// // // Route to fetch user profile
// // app.get("/profile", authenticateUser, async (req, res) => {
// //   try {
// //     const user = await User.findById(req.user.id);
// //     if (!user) {
// //       return res.status(404).json({ message: "User not found." });
// //     }

// //     const subscriptionRemainingDays = user.subscriptionStatus
// //       ? Math.ceil((user.subscriptionExpiry - new Date()) / (1000 * 3600 * 24)) // calculate remaining days
// //       : null;

// //     res.status(200).json({
// //       name: user.name,
// //       email: user.email,
// //       subscriptionStatus: user.subscriptionStatus,
// //       subscriptionRemainingDays,
// //     });
// //   } catch (error) {
// //     console.error("Error fetching profile:", error.message);
// //     res.status(500).json({ message: "Internal server error" });
// //   }
// // });


// // Start the Server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });





// FOR VERCEL 

require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const Razorpay = require("razorpay");

// Initialize Express App
const app = express();

// Enable CORS
const corsOptions = {
  origin: 'http://localhost:5500', // Update with your frontend URL
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

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

// Export Express App as Serverless Function
module.exports = app;
