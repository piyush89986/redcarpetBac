const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const prisma = require("./prisma/client");
const dataRoutes = require("./routes/dataRoutes");
const twilio = require("twilio");
const http = require("http");
const socketIo = require("socket.io");
const authRoutes = require("./routes/auth");
const menuRoutes = require("./routes/menuRoutes"); // ✅ Add this line
const displayRoutes = require("./routes/displayRoutes"); // ✅ Add this line
const forgotPasswordRoutes = require("./routes/forgotPasswordRoutes"); // Ensure path is correct
const utilityRoutes = require("./routes/utilityRoute"); // Ensure path is correct
const qrRoutes = require("./routes/qrRoutes");
const shopRoutes = require("./routes/shopRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const planRoutes = require("./routes/planRoutes");
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
const isLoopbackOrLocalIp = (ip, hostname) => {
  if (hostname === "localhost") return true;
  if (!ip) return false;
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.")
  );
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Generous 10,000 requests per 15 minutes for real-time queue dashboards
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Never throttle local development, internal IPs, health endpoints, or authentication
    if (isLoopbackOrLocalIp(req.ip, req.hostname)) return true;
    if (
      req.path.startsWith("/auth") ||
      req.path.startsWith("/api/auth") ||
      req.path === "/health" ||
      req.path === "/version" ||
      req.path === "/api/health" ||
      req.path === "/api/version"
    ) {
      return true;
    }
    return false;
  },
  message: {
    success: false,
    error: "Too many requests from this IP. Please try again after 15 minutes.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Generous limit for login / auth attempts so testing and active operations never get locked out
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isLoopbackOrLocalIp(req.ip, req.hostname),
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
app.use("/api/plans", planRoutes);
app.use("/api", menuRoutes);
app.use("/api", forgotPasswordRoutes);

// Health check utility routes (exempt from blocking)
app.use("/api", utilityRoutes);


// Database Connection (PostgreSQL with Prisma & Sequelize)
prisma
  .$connect()
  .then(() => console.log("PostgreSQL Connected Successfully via Prisma ORM"))
  .catch((err) => console.error("Prisma Connection Warning:", err.message));

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
app.use("/", shopRoutes);
app.use("/api", dataRoutes);
app.use("/api", displayRoutes);
app.use("/api", qrRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api", analyticsRoutes);

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
// Save Customer Queue Information / Register Walk-in Customer (Manual & QR Scan)
app.post("/api/information", async (req, res) => {
  const { name, mobile, email, shopid } = req.body;
  if (!shopid) {
    return res.status(400).json({ success: false, message: "Shop ID is required" });
  }

  try {
    // 12-hour refreshed token logic per shop
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const count = await prisma.queueToken.count({
      where: {
        shopid: String(shopid),
        createdAt: { gte: twelveHoursAgo },
      },
    });
    // Starts at 101, resets every 12 hours
    const assignedToken = String(100 + count + 1);

    // Look up associated mallId for store
    const store = await prisma.store.findUnique({
      where: { id: String(shopid) },
      select: { mallId: true, name: true },
    }).catch(() => null);

    const newInfo = await prisma.queueToken.create({
      data: {
        name: String(name || "Walk-in Guest").trim(),
        mobile: String(mobile || "").trim(),
        email: String(email || "").trim().toLowerCase(),
        token: assignedToken,
        shopid: String(shopid),
        mallId: store?.mallId || "",
        status: "waiting",
      },
    });

    console.log(`[Queue] Token #${assignedToken} issued to "${newInfo.name}" for shop ${shopid}`);

    // Broadcast new token to all connected counter dashboards and TV screens
    if (io) {
      io.emit("new-queue-token", {
        shopId: String(shopid),
        token: assignedToken,
        name: newInfo.name,
        mobile: newInfo.mobile,
        createdAt: newInfo.createdAt,
      });
    }

    res.status(201).json({
      success: true,
      message: `Token #${assignedToken} issued successfully!`,
      token: assignedToken,
      newInfo,
    });
  } catch (err) {
    console.error("Error saving queue token:", err);
    res.status(500).json({ success: false, message: "Error saving customer data", error: err.message });
  }
});

// Start Countdown & Broadcast Token Call to Live TV Screens
app.post("/api/start-countdown", async (req, res) => {
  const { duration, phoneNumber, shopId, token, name, storeName, mallTitle } = req.body;
  const startTime = BigInt(Date.now());
  const safeDuration = Number(duration) || 180;

  try {
    const newCountdown = await prisma.countdown.create({
      data: {
        startTime,
        duration: safeDuration,
        shopId: String(shopId || ""),
        token: String(token || ""),
        name: name || "Valued Guest",
        storeName: storeName || "",
        mallTitle: mallTitle || "",
      },
    });

    // Broadcast real-time event to all connected TV screens and customer web pages
    io.emit("countdown-start", {
      startTime: Number(startTime),
      duration: safeDuration,
      shopId: String(shopId || ""),
      token: String(token || ""),
      name: name || "Valued Guest",
      storeName: storeName || "",
      mallTitle: mallTitle || "",
    });

    // Optional Twilio SMS Notification
    if (phoneNumber && process.env.IS_OTP_SERVICE_AVAILABLE === "true" && client) {
      try {
        const frontendUrl = (
          process.env.FRONTEND_URL ||
          process.env.REACT_APP_API_BASE_URL ||
          "https://redcarpet-fr.vercel.app"
        ).replace(/\/+$/, "");
        const countdownLink = `${frontendUrl}/${shopId || ":id"}/countdown`;
        const formattedTo = String(phoneNumber).startsWith("+")
          ? phoneNumber
          : `+91${String(phoneNumber).replace(/\D/g, "")}`;

        await client.messages.create({
          body: `Token #${token} is now called! Track live on TV here: ${countdownLink}`,
          from: process.env.TWILIO_PHONE,
          to: formattedTo,
        });
      } catch (smsErr) {
        console.warn("SMS dispatch notice skipped/failed:", smsErr.message);
      }
    }

    res.json({
      success: true,
      message: "Countdown started and broadcasted to TV",
      startTime: Number(startTime),
      duration: safeDuration,
      token,
      name,
      shopId,
    });
  } catch (error) {
    console.error("Error starting countdown:", error);
    res.status(500).json({ message: "Error starting countdown", error: error.message });
  }
});

// Get Current Countdown (filtered by shopId if provided via query or URL param)
app.get(["/api/get-countdown", "/api/get-countdown/:id"], async (req, res) => {
  try {
    const targetShopId = req.params.id || req.query.shopId;
    const where = targetShopId ? { shopId: String(targetShopId) } : {};
    const countdown = await prisma.countdown.findFirst({
      where,
      orderBy: { startTime: "desc" },
    });

    if (!countdown) {
      return res.json({ active: false });
    }

    const startTimeNum = Number(countdown.startTime);
    const elapsed = Math.floor((Date.now() - startTimeNum) / 1000);
    const duration = countdown.duration || 180;
    const active = elapsed < duration;

    res.json({
      ...countdown,
      startTime: startTimeNum,
      active,
      remaining: Math.max(0, duration - elapsed),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching countdown", error: error.message });
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
      const user = await prisma.queueToken.findFirst({ where: { mobile: String(mobile) } });
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
    const latestUser = await prisma.queueToken.findFirst({
      where: {
        mobile: String(req.query.phone || ""),
        createdAt: { gte: twelveHoursAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestUser) {
      return res.status(404).json({ message: "No active token found in last 12 hours" });
    }
    res.json({ token: latestUser.token });
  } catch (error) {
    console.error("Error fetching token:", error);
    res.status(500).json({ message: "Error fetching token", error: error.message });
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

// (Shop endpoints handled by shopRoutes)

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
    // 1. Try finding and updating Mall
    const mall = await prisma.mall.findUnique({ where: { id } });
    if (mall) {
      const updatedMall = await prisma.mall.update({
        where: { id },
        data: { subscriptionStatus },
      });
      return res.status(200).json({
        success: true,
        message: `Subscription successfully updated to ${subscriptionStatus}`,
        subscriptionStatus,
        shop: updatedMall,
      });
    }

    // 2. Try finding and updating Store
    const store = await prisma.store.findUnique({ where: { id } });
    if (store) {
      const updatedStore = await prisma.store.update({
        where: { id },
        data: { subscriptionStatus },
      });
      return res.status(200).json({
        success: true,
        message: `Store subscription successfully updated to ${subscriptionStatus}`,
        subscriptionStatus,
        shop: updatedStore,
      });
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

// Update Store / Counter inside a Mall
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
    const store = await prisma.store.findFirst({
      where: {
        mallId: id,
        name,
      },
    });

    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    let hashedPassword = store.password;
    if (newPassword) {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    await prisma.store.update({
      where: { id: store.id },
      data: {
        ...(newName && { name: newName }),
        ...(newDescription !== undefined && { description: newDescription }),
        ...(newLink !== undefined && { link: newLink }),
        ...(newImage !== undefined && { image: newImage }),
        ...(newEmail !== undefined && { email: newEmail }),
        ...(newShopConPassword !== undefined && { shopconpassword: newShopConPassword }),
        ...(newRole && { role: newRole }),
        ...(newPassword && { password: hashedPassword }),
      },
    });

    res.json({ success: true, message: "Item updated successfully" });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// Soft-Delete Store / Counter inside a Mall (Marks as deleted, retains record in DB)
app.delete("/api/shops/delete-menu-item/:id/:name", async (req, res) => {
  const { id, name } = req.params;

  try {
    const store = await prisma.store.findFirst({
      where: {
        mallId: id,
        OR: [{ id: name }, { name: name }],
      },
    });

    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    // 1. Mark store as deleted in DB
    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: { subscriptionStatus: "deleted" },
    });

    // 2. Mark user accounts as inactive
    await prisma.user.updateMany({
      where: {
        OR: [
          { shopId: store.id },
          ...(store.email ? [{ email: { equals: store.email, mode: "insensitive" } }] : []),
        ],
      },
      data: { isActive: false },
    });

    res.json({ success: true, message: "Store disabled and removed from mall directory", store: updatedStore });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
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

/**
 * Business / Mall Onboarding API Endpoint
 * Called by external onboarding / CRM / billing systems to onboard a new business.
 * Supports plan-based system metadata.
 */
const handleBusinessOnboard = async (req, res) => {
  try {
    const {
      title,
      businessName,
      name,
      email,
      password,
      city,
      address,
      contactPhone,
      image,
      description,
      plan,
      subscriptionStatus,
    } = req.body;

    const resolvedTitle = (title || businessName || name || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!resolvedTitle) {
      return res.status(400).json({
        success: false,
        error: "Business title / name is required.",
      });
    }

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        error: "Business email is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password is required for business administrator login.",
      });
    }

    // Check if business with this email already exists
    const existingMall = await prisma.mall.findUnique({ where: { email: cleanEmail } });
    if (existingMall) {
      return res.status(409).json({
        success: false,
        error: `A business with email '${cleanEmail}' is already registered.`,
      });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Build structured plan object if provided
    const resolvedPlan = {
      name: plan?.name || "Standard Plan",
      tier: plan?.tier || "starter",
      maxStores: plan?.maxStores || 25,
      status: plan?.status || "active",
      expiresAt: plan?.expiresAt ? new Date(plan.expiresAt) : null,
    };

    const newShop = await prisma.mall.create({
      data: {
        title: resolvedTitle,
        email: cleanEmail,
        password: hashedPassword,
        role: "admin",
        mallconpassword: password,
        city: city || "",
        address: address || "",
        contactPhone: contactPhone || "",
        image:
          image ||
          "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=1200&q=80",
        description:
          description || "Shopping complex & retail entertainment center",
        subscriptionStatus: subscriptionStatus || "active",
        plan: resolvedPlan,
      },
    });

    // Upsert User login credentials
    const user = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: {
        name: resolvedTitle,
        password: hashedPassword,
        role: "admin",
        shopId: newShop.id,
        mallId: newShop.id,
      },
      create: {
        name: resolvedTitle,
        email: cleanEmail,
        password: hashedPassword,
        role: "admin",
        shopId: newShop.id,
        mallId: newShop.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Business successfully onboarded!",
      business: {
        id: newShop.id,
        title: newShop.title,
        email: newShop.email,
        role: "admin",
        subscriptionStatus: newShop.subscriptionStatus,
        plan: newShop.plan,
        dashboardUrl: `/branddashboard2/${newShop.id}`,
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Business onboarding error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error during business onboarding",
      details: error.message,
    });
  }
};

app.post("/api/business/onboard", handleBusinessOnboard);
app.post("/api/shops", handleBusinessOnboard);

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
