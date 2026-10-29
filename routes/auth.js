const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Shop = require("../models/Shop"); //......................................................

const router = express.Router();


router.post("/signup", async (req, res) => {
  const { name, email, password,role } = req.body;
  console.log(req.body);
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const newUser = new User({ name, email, password: hashedPassword,role });
    await newUser.save();
    res.json({ message: "User registered successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
});

// **Login Route**
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

    // Look up across User, Mall, or Store menuItems
    let user = await User.findOne({ email: emailRegex });
    let mall = await Shop.findOne({ email: emailRegex });
    let storeItem = null;
    let parentMall = null;

    if (!mall) {
      parentMall = await Shop.findOne({ "menuItems.email": emailRegex });
      if (parentMall) {
        storeItem = parentMall.menuItems.find(
          (item) => item.email && item.email.toLowerCase() === cleanEmail
        );
      }
    }

    if (!user && !mall && !storeItem) {
      return res.status(400).json({ error: "User not found" });
    }

    // Verify password across records
    let isMatch = false;
    let effectiveHashedPassword = null;

    // 1. Check in User collection
    if (user && user.password) {
      isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) effectiveHashedPassword = user.password;
    }

    // 2. If no match yet, check in Mall collection
    if (!isMatch && mall && mall.password) {
      isMatch = await bcrypt.compare(password, mall.password);
      if (isMatch) effectiveHashedPassword = mall.password;
    }

    // 3. If no match yet, check in Store / menuItems
    if (!isMatch && storeItem && storeItem.password) {
      isMatch = await bcrypt.compare(password, storeItem.password);
      if (isMatch) effectiveHashedPassword = storeItem.password;
    }

    // 4. Legacy plain-text fallback (in case plain-text was stored)
    if (!isMatch) {
      if (mall && mall.mallconpassword === password) {
        isMatch = true;
        effectiveHashedPassword = await bcrypt.hash(password, 10);
      } else if (storeItem && storeItem.shopconpassword === password) {
        isMatch = true;
        effectiveHashedPassword = await bcrypt.hash(password, 10);
      }
    }

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Auto-sync User document so both collections remain completely in sync
    if (effectiveHashedPassword) {
      if (user) {
        if (user.password !== effectiveHashedPassword) {
          user.password = effectiveHashedPassword;
          await user.save();
        }
      } else {
        user = new User({
          name: mall ? mall.title : (storeItem ? storeItem.name : "Portal User"),
          email: cleanEmail,
          password: effectiveHashedPassword,
          role: mall ? mall.role : (storeItem ? storeItem.role : "admin"),
          shopId: mall ? String(mall._id) : (storeItem ? String(storeItem._id) : null),
        });
        await user.save();
      }
    }

    // Resolve shopId
    let resolvedShopId = null;
    if (mall) {
      resolvedShopId = mall._id;
    } else if (storeItem) {
      resolvedShopId = storeItem._id || (parentMall ? parentMall._id : null);
    } else if (user && user.shopId) {
      resolvedShopId = user.shopId;
    }

    const effectiveRole = user?.role || mall?.role || storeItem?.role || "admin";
    const effectiveName = user?.name || mall?.title || storeItem?.name || "";

    // SuperAdmin role is permanently deprecated. Only Business Managers and Store Counters are permitted.
    if (
      effectiveRole === "superadmin" ||
      user?.role === "superadmin" ||
      cleanEmail.includes("superadmin")
    ) {
      return res.status(403).json({
        error:
          "SuperAdmin access has been permanently removed. Only Business Managers and Store Counters can access the system.",
      });
    }

    // Generate JWT Token
    const jwtSecret =
      process.env.JWT_SECRET || "kjsdrjhjrsdbuydtkjmgujt_redcarpet_default_secret";

    const token = jwt.sign(
      { userId: (user ? user._id : (mall ? mall._id : "")) || "", role: effectiveRole },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        name: effectiveName,
        email: cleanEmail,
        role: effectiveRole,
      },
      shopId: resolvedShopId,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});


module.exports = router;
