const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const dataRoutes = require("./routes/dataRoutes");
const twilio = require("twilio");
const User = require("./models/data");
const ShopUser = require("./models/User");
const http = require("http");
const socketIo = require("socket.io");
const authRoutes = require("./routes/auth");
const menuRoutes = require("./routes/menuRoutes"); // ✅ Add this line
const displayRoutes = require("./routes/displayRoutes"); // ✅ Add this line
const forgotPasswordRoutes = require("./routes/forgotPasswordRoutes"); // Ensure path is correct
const utilityRoutes = require("./routes/utilityRoute"); // Ensure path is correct
const qrRoutes = require("./routes/qrRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const rateLimit = require("express-rate-limit");

const bcrypt = require("bcryptjs");

// load enviromental variables
require("dotenv").config();

// initialize express
const app = express();

// Trust reverse proxy (Render, Vercel, Nginx) for accurate client IP rate limiting
app.set("trust proxy", 1);

// Dynamic CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.REACT_APP_API_BASE_URL,
  "https://redcarpet-fr.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      origin.endsWith(".vercel.app") ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin.startsWith("http://10.") ||
      origin.startsWith("http://192.168.") ||
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV !== "production"
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Explicit header fallback to guarantee zero CORS issues
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Security Headers Middleware (OWASP standards)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // Limit each IP to 600 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.path === "/health" ||
    req.path === "/version" ||
    req.path === "/api/health" ||
    req.path === "/api/version",
  message: {
    success: false,
    error: "Too many requests from this IP. Please try again after 15 minutes.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit login / auth attempts to 30 per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many authentication attempts. Please wait 15 minutes before trying again.",
  },
});

const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 6, // Limit SMS OTP sends to 6 per 10 minutes (prevents SMS spam & saves Twilio balance)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many OTP requests from this device. Please wait 10 minutes.",
  },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 12, // Limit OTP verifications to 12 attempts per 10 min (prevents brute-force)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many verification attempts. Please wait 10 minutes before trying again.",
  },
});

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting
app.use("/api", globalLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api", menuRoutes);
app.use("/api", forgotPasswordRoutes);

// Health check utility routes (exempt from blocking)
app.use("/api", utilityRoutes);


// Database Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Error: ", err));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// Middleware
app.use(express.json({ limit: "200mb" })); // Reduced size to prevent crashes
app.use(express.urlencoded({ limit: "200mb", extended: true }));

// API route
app.use("/api", dataRoutes);
app.use("/api", displayRoutes);
app.use("/api", qrRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api", analyticsRoutes);

// // Schema and Model
// const InfoSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   mobile: { type: String, required: true },
//   email: { type: String, required: true },
//   token: { type: Number, required: true },
// });

// const Info = mongoose.model("Info", InfoSchema);

// // Schema
// const displaySchema = new mongoose.Schema({
//   backgroundImage: String,
//   phoenixText: String,
//   pText: String,
//   royalPassText: String,
//   displayid: String,
// });
// const DisplayModel = mongoose.model("Display", displaySchema);

// const ShopSchema = new mongoose.Schema({
//   title: String,
//   description: String,
//   image: String,
// });

const Shop = require("./models/Shop"); // ✅ Ensure single import
const {
  NetworkAccessProfileNetworkContextImpl,
} = require("twilio/lib/rest/supersim/v1/networkAccessProfile/networkAccessProfileNetwork");

// Twilio Credentials
const otpStore = {};
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE;
const client = twilio(accountSid, authToken);

// Routes
app.post("/api/information", async (req, res) => {
  console.log("Data received:", req.body);
  const { name, mobile, email, shopid } = req.body;
  try {
    // 12-hour refreshed token logic per shop
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const count = await User.countDocuments({
      shopid: shopid,
      createdAt: { $gte: twelveHoursAgo },
    });
    // Starts at 101, resets every 12 hours
    const assignedToken = String(100 + count + 1);

    const newInfo = new User({
      name,
      mobile,
      email,
      token: assignedToken,
      shopid,
    });
    await newInfo.save();
    console.log("Data saved successfully with 12h-refreshed token:", assignedToken);
    res.status(201).json({
      message: "Data saved successfully!",
      token: assignedToken,
      newInfo,
    });
  } catch (err) {
    console.log("Error saving data:", err);
    res.status(500).json({ message: "Error saving data", error: err });
  }
});

// Countdown Schema
const CountdownSchema = new mongoose.Schema({
  startTime: Number,
  duration: Number,
  shopId: String,
});
const Countdown = mongoose.model("Countdown", CountdownSchema);

// Start Countdown API
app.post("/api/start-countdown", async (req, res) => {
  const { duration, phoneNumber, shopId } = req.body;
  const startTime = Date.now();

  try {
    const newCountdown = new Countdown({ startTime, duration, shopId });
    await newCountdown.save();

    // Emit countdown start event
    io.emit("countdown-start", { startTime, duration, shopId });

    // Twilio SMS Notification
    const frontendUrl = (process.env.FRONTEND_URL || process.env.REACT_APP_API_BASE_URL || "https://redcarpet-fr.vercel.app").replace(/\/+$/, "");
    const countdownLink = `${frontendUrl}/countdown/${shopId || ":id"}`;
    await client.messages.create({
      body: `Countdown started! Track live here: ${countdownLink}`,
      from: process.env.TWILIO_PHONE,
      to: phoneNumber,
    });

    res.json({ message: "Countdown started", startTime, duration });
  } catch (error) {
    console.error("Error starting countdown:", error);
    res.status(500).json({ message: "Error starting countdown", error });
  }
});

// Get Current Countdown
app.get("/api/get-countdown", async (req, res) => {
  try {
    const countdown = await Countdown.findOne();
    res.json(countdown);
  } catch (error) {
    res.status(500).json({ message: "Error fetching countdown", error });
  }
});

// WebSocket Connection
io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});


















// Send OTP (Protected by otpSendLimiter)
app.post("/api/send-otp", otpSendLimiter, async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ success: false, error: "Mobile number is required" });
  }

  const cleanMobile = String(mobile).replace(/\D/g, "");
  const otp = Math.floor(1000 + Math.random() * 9000);
  let finalOtp = otp;
  let smsSent = false;

  try {
    if (process.env.IS_OTP_SERVICE_AVAILABLE === "true" && client) {
      const formattedTo = String(mobile).startsWith("+") ? mobile : `+91${cleanMobile}`;
      console.log(`Sending Twilio SMS from ${process.env.TWILIO_PHONE} to ${formattedTo}...`);

      try {
        await client.messages.create({
          body: `Your Red Carpet VIP Pass OTP is ${otp}. Do not share this with anyone.`,
          from: process.env.TWILIO_PHONE,
          to: formattedTo,
        });
        smsSent = true;
        console.log(`Twilio custom SMS successfully sent to ${formattedTo}`);
      } catch (smsErr) {
        if (smsErr.message && smsErr.message.includes("predefined SMS templates")) {
          console.log("Trial account detected. Sending approved sms_2fa template...");
          const trialMsg = await client.messages.create({
            body: "sms_2fa",
            from: process.env.TWILIO_PHONE,
            to: formattedTo,
          });
          smsSent = true;
          console.log(`Twilio 2FA template SMS sent to ${formattedTo}. SID: ${trialMsg.sid}`);
          const match = trialMsg.body.match(/code is (\d+)/i);
          if (match) {
            finalOtp = match[1];
            console.log(`Extracted Twilio 2FA OTP: ${finalOtp}`);
          }
        } else {
          throw smsErr;
        }
      }
    } else {
      console.log(`[DEV MODE] OTP for ${mobile} is ${otp}`);
    }

    otpStore[cleanMobile] = String(finalOtp);
    otpStore[mobile] = String(finalOtp);

    res.json({
      message: "Verification code sent to your phone via SMS",
      phone: mobile,
      success: true,
      smsSent: true,
    });
  } catch (error) {
    console.error("Twilio send error:", error.message);
    res.status(500).json({
      success: false,
      error: `SMS delivery failed: ${error.message}`,
    });
  }
});

// Verify OTP (Protected by otpVerifyLimiter)
app.post("/api/verify-otp", otpVerifyLimiter, async (req, res) => {
  const { mobile, otp } = req.body;
  const cleanMobile = String(mobile || "").replace(/\D/g, "");
  const storedOtp = otpStore[cleanMobile] || otpStore[mobile];

  if (!storedOtp) {
    return res.status(400).json({ error: "No OTP found for this mobile number. Please request a new OTP." });
  }

  if (parseInt(otp) === parseInt(storedOtp)) {
    try {
      const user = await User.findOne({ mobile });
      delete otpStore[cleanMobile];
      delete otpStore[mobile];
      return res.json({ success: true, message: "OTP verified successfully" });
    } catch (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Server error" });
    }
  } else {
    return res.status(400).json({ error: "Invalid OTP. Please check the code and try again." });
  }
});























// Retrieve Latest Token (within 12-hour window)
app.get("/api/get-token", async (req, res) => {
  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const latestUser = await User.findOne({
      mobile: req.query.phone,
      createdAt: { $gte: twelveHoursAgo },
    }).sort({ createdAt: -1 });

    if (!latestUser) {
      return res.status(404).json({ message: "No active token found in last 12 hours" });
    }
    res.json({ token: latestUser.token });
  } catch (error) {
    console.error("Error fetching token:", error);
    res.status(500).json({ message: "Error fetching token", error });
  }
});

// Send Message
app.post("/api/send-message", async (req, res) => {
  const { number } = req.body;

  if (!number) {
    return res.status(400).json({ error: "Number is required!" });
  }

  try {
    const message = await client.messages.create({
      body: `🎉 Congratulations! your token number should be selected, now you can visit your counter,
       visit your countdown undertime  ${process.env.REACT_APP_API_BASE_URL}/countdown`,
      from: twilioPhone,
      to: `+91${number}`,
    });

    res.json({
      success: true,
      message: "Message sent successfully!",
      sid: message.sid,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, error: "Failed to send message." });
  }
});

// // ✅ API to insert
// app.post("/api/display", async (req, res) => {
//   try {
//     const newData = new DisplayModel(req.body);
//     await newData.save();
//     res.status(201).json({ message: "Added Successfully!", newData });
//   } catch (error) {
//     console.error("Error adding:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// });

// // ✅ API to get saved data where project ID matches displayid
// app.get("/api/display/:id", async (req, res) => {
//   try {
//     const { id } = req.params; // 🔹 Get ID from URL

//     const data = await DisplayModel.findOne({ displayid: id });

//     if (!data) {
//       return res.status(404).json({ message: "No matching data found!" });
//     }

//     res.status(200).json(data);
//   } catch (error) {
//     console.error("Error fetching:", error);
//     res.status(500).json({ message: "Error fetching data", error: error.message });
//   }
// });
// // ✅ API to update existing data where project ID matches displayid
// app.put("/api/display/:id", async (req, res) => {
//   try {
//     const { id } = req.params; // Get ID from URL

//     const updatedData = await DisplayModel.findOneAndUpdate(
//       { displayid: id }, // Find by displayid
//       { $set: req.body }, // Update with new data
//       { new: true } // Return updated document
//     );

//     if (!updatedData) {
//       return res.status(404).json({ message: "No matching data found to update!" });
//     }

//     res.status(200).json({ message: "Updated Successfully!", updatedData });
//   } catch (error) {
//     console.error("Error updating:", error);
//     res.status(500).json({ message: "Error updating data", error: error.message });
//   }
// });

// GET API
app.get("/api/shops", async (req, res) => {
  try {
    const shops = await Shop.find({ title: { $exists: true, $ne: "" } });
    res.json(shops);
  } catch (err) {
    res.status(500).json({ message: "Error fetching shops", error: err.message });
  }
});

app.get("/api/menus/:id", async (req, res) => {
  try {
    const menuItems = await Menu.find({ shopId: req.params.id });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: "Error fetching menu" });
  }
});

app.put("/api/shops/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const hassPas = await bcrypt.hash(req.body.password, 10);
  try {
    const updatedShop = await Shop.findByIdAndUpdate(
      id,
      { ...updatedData, password: hassPas },
      {
        new: true,
      }
    );
    if (!updatedShop) {
      return res.status(404).json({ message: "Shop not found" });
    }
    res.json(updatedShop);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.get("/api/shops/:id", async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: "Shop not found" });
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: "Error fetching shop", error });
  }
});

// Toggle / Update Mall & Store Subscription Status
const handleSubscriptionToggle = async (req, res) => {
  const { id } = req.params;
  const { subscriptionStatus } = req.body;

  if (!subscriptionStatus || !["active", "inactive"].includes(subscriptionStatus)) {
    return res.status(400).json({
      success: false,
      message: "Valid subscriptionStatus ('active' or 'inactive') is required.",
    });
  }

  try {
    // 1. Try finding and updating top-level Mall / Shop
    if (mongoose.Types.ObjectId.isValid(id)) {
      let shop = await Shop.findById(id);
      if (shop) {
        shop.subscriptionStatus = subscriptionStatus;
        await shop.save();
        return res.status(200).json({
          success: true,
          message: `Subscription successfully updated to ${subscriptionStatus}`,
          subscriptionStatus,
          shop,
        });
      }
    }

    // 2. Try finding as a child store inside menuItems
    const parentMall = await Shop.findOne({ "menuItems._id": id });
    if (parentMall) {
      const item = parentMall.menuItems.id(id);
      if (item) {
        item.subscriptionStatus = subscriptionStatus;
        await parentMall.save();
        return res.status(200).json({
          success: true,
          message: `Store subscription successfully updated to ${subscriptionStatus}`,
          subscriptionStatus,
          shop: item,
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: "Shop / Mall not found with ID " + id,
    });
  } catch (error) {
    console.error("Subscription update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update subscription status",
      error: error.message,
    });
  }
};

app.patch("/api/shops/:id/subscription", handleSubscriptionToggle);
app.put("/api/shops/:id/subscription", handleSubscriptionToggle);
app.post("/api/shops/:id/subscription", handleSubscriptionToggle);

// ye hai edit or save karne ke liye(fruits names, example)
app.put("/api/shops/update-menu-item/:id/:name", async (req, res) => {
  const { id, name } = req.params;
  const {
    newName,
    newDescription,
    newLink,
    newImage,
    newEmail,
    newPassword,
    newShopConPassword,
    newRole,
  } = req.body;
  try {
    const shop = await Shop.findById(id);
    if (!shop) {
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });
    }

    const itemIndex = shop.menuItems.findIndex((item) => item.name === name);
    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });
    }
    // Update the item
    shop.menuItems[itemIndex].name = newName;
    shop.menuItems[itemIndex].image = newImage;
    shop.menuItems[itemIndex].link = newLink;
    shop.menuItems[itemIndex].description = newDescription;
    shop.menuItems[itemIndex].email = newEmail;
    shop.menuItems[itemIndex].shopconpassword = newShopConPassword;
    shop.menuItems[itemIndex].role = newRole;

    // ✅ Hash the new password only if provided
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      shop.menuItems[itemIndex].password = hashedPassword;
    }

    // Save to database
    await shop.save();

    res.json({ success: true, message: "Item updated successfully" });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ye hai menu ke jo items he vo delete karne ke liye(fruits names example)
app.delete("/api/shops/delete-menu-item/:id/:name", async (req, res) => {
  const { id, name } = req.params;

  try {
    const shop = await Shop.findById(id);
    if (!shop) {
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });
    }

    // Filter out the menu item to be deleted
    const updatedMenuItems = shop.menuItems.filter(
      (item) => item.name !== name
    );

    // If no changes were made, return an error
    if (updatedMenuItems.length === shop.menuItems.length) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });
    }

    // Update the menuItems array
    shop.menuItems = updatedMenuItems;

    // Save the updated document
    await shop.save();

    res.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST API
// app.post("/shops", async (req, res) => {
//   const shop = new Shop(req.body);
//   console.log(req.body,shop);
//   await shop.save();
//     const hashedPassword = await bcrypt.hash(shop.password, 10);

//   const user = new ShopUser({
//     email: shop.email,
//     password: hashedPassword,
//     role: shop.role,
//   });

//   await user.save();
//   res.json(shop);
// });

// hashed password hai ish mai
app.post("/api/shops", async (req, res) => {
  try {
    // Pehle password hash karo
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Ab hashed password ko shop object me save karo
    const shop = new Shop({
      ...req.body,
      password: hashedPassword, // Hashed password assign kiya
    });

    await shop.save();

    let user = await ShopUser.findOne({ email: shop.email });
    if (user) {
      user.name = shop.title || shop.name || user.name || "Mall Administrator";
      user.password = hashedPassword;
      user.role = shop.role || user.role || "admin";
      user.shopId = String(shop._id);
      await user.save();
    } else {
      user = new ShopUser({
        name: shop.title || shop.name || "Mall Administrator",
        email: shop.email,
        password: hashedPassword,
        role: shop.role || "admin",
        shopId: String(shop._id),
      });
      await user.save();
    }

    res.json(shop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/api/shops/:id", async (req, res) => {
  try {
    const shopId = req.params.id;
    const deletedShop = await Shop.findByIdAndDelete(shopId);

    if (!deletedShop) {
      return res.status(404).json({ message: "Shop item not found" });
    }

    res.json({ message: "Shop item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting shop item", error });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
