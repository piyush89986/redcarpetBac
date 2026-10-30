const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma/client");

const router = express.Router();

// **Signup Route**
router.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name: name || "User",
        email: cleanEmail,
        password: hashedPassword,
        role: role || "admin",
      },
    });

    res.json({ message: "User registered successfully", user: { id: newUser.id, email: newUser.email } });
  } catch (error) {
    console.error("Signup error:", error);
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

    // Look up across User, Mall, or Store
    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    let mall = await prisma.mall.findUnique({ where: { email: cleanEmail } });
    let storeItem = await prisma.store.findFirst({ where: { email: cleanEmail } });

    if (!user && !mall && !storeItem) {
      return res.status(400).json({ error: "User not found" });
    }

    // Verify password across records
    let isMatch = false;
    let effectiveHashedPassword = null;

    if (user && user.password) {
      isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) effectiveHashedPassword = user.password;
    }

    if (!isMatch && mall && mall.password) {
      isMatch = await bcrypt.compare(password, mall.password);
      if (isMatch) effectiveHashedPassword = mall.password;
    }

    if (!isMatch && storeItem && storeItem.password) {
      isMatch = await bcrypt.compare(password, storeItem.password);
      if (isMatch) effectiveHashedPassword = storeItem.password;
    }

    // Legacy plain-text fallback
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

    // Auto-sync User record in PostgreSQL
    if (effectiveHashedPassword) {
      if (user) {
        if (user.password !== effectiveHashedPassword) {
          await prisma.user.update({
            where: { id: user.id },
            data: { password: effectiveHashedPassword },
          });
        }
      } else {
        user = await prisma.user.create({
          data: {
            name: mall?.title || storeItem?.name || "User",
            email: cleanEmail,
            password: effectiveHashedPassword,
            role: mall ? "admin" : storeItem ? "shop admin" : "admin",
            shopId: storeItem ? storeItem.id : mall ? mall.id : null,
            mallId: storeItem ? storeItem.mallId : mall ? mall.id : null,
          },
        });
      }
    }

    const token = jwt.sign(
      {
        userId: user ? user.id : mall ? mall.id : storeItem.id,
        email: cleanEmail,
        role: user?.role || (mall ? "admin" : "shop admin"),
      },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: "7d" }
    );

    let returnRole = "admin";
    let returnShopId = null;
    let returnMallId = null;

    if (mall) {
      returnRole = "admin";
      returnShopId = mall.id;
      returnMallId = mall.id;
    } else if (storeItem) {
      returnRole = "shop admin";
      returnShopId = storeItem.id;
      returnMallId = storeItem.mallId;
    } else if (user) {
      returnRole = user.role || "admin";
      returnShopId = user.shopId || null;
      returnMallId = user.mallId || null;
    }

    res.status(200).json({
      message: "Login successful",
      token,
      role: returnRole,
      shopId: returnShopId,
      mallId: returnMallId,
      user: {
        id: user ? user.id : mall ? mall.id : storeItem.id,
        email: cleanEmail,
        role: returnRole,
        name: user?.name || mall?.title || storeItem?.name || "User",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

module.exports = router;
