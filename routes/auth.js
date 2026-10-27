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

    let user = await User.findOne({ email });

    // Step 1: Directly check in User collection
    if (user) {
      if (!user.password) {
        return res.status(400).json({ error: "No password set for this account" });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: "Invalid password" });
    } 
    // Step 2: Check in Food/Shop collection if not found in User
    else {
      user = await Shop.findOne({ email });

      if (!user) {
        // Step 3: Check inside menuItems
        user = await Shop.findOne({ "menuItems.email": email });

        if (user) {
          user = user.menuItems.find((item) => item.email === email);
        }
      }

      // Agar ab bhi user na mile, return error
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      // MenuItems ya Shop schema se password match karna
      if (!user.password) {
        return res.status(400).json({ error: "No password set for this account" });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: "Invalid password" });
    }

    // Step 4: Find linked Shop
    let shop = await Shop.findOne({ email });
    if (!shop) {
      shop = await Shop.findOne({ "menuItems.email": email });
    }

    if (shop) {
      console.log("User logged in. Shop ID:", shop._id);
    } else {
      console.log("No shop found for this user.");
    }

    // Step 5: Generate JWT Token with fallback secret
    const jwtSecret =
      process.env.JWT_SECRET || "kjsdrjhjrsdbuydtkjmgujt_redcarpet_default_secret";

    const token = jwt.sign(
      { userId: user._id || "", role: user.role || "admin" },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        name: user.name || user.title || "",
        email: user.email,
        role: user.role || "admin",
      },
      shopId: shop ? shop._id : null,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});


module.exports = router;
