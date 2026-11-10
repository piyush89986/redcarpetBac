const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const bcrypt = require("bcryptjs");

// Add Store/Menu Item to a Mall (Enforcing Unique Email)
router.post("/shops/:id/menu", async (req, res) => {
  try {
    const { id } = req.params;
    const mall = await prisma.mall.findUnique({ where: { id } });
    if (!mall) return res.status(404).json({ success: false, message: "Mall not found" });

    const storeEmail = req.body.email ? req.body.email.trim().toLowerCase() : null;
    if (!storeEmail) {
      return res.status(400).json({ success: false, message: "Counter staff email address is required." });
    }

    // 1. Enforce Unique Email across all stores
    const existingStore = await prisma.store.findFirst({
      where: { email: { equals: storeEmail, mode: "insensitive" } },
    });
    if (existingStore) {
      return res.status(400).json({
        success: false,
        message: `The email "${storeEmail}" is already registered to store "${existingStore.name}". Each store must have a unique staff email address.`,
      });
    }

    // 2. Check if email is already in use by a shopping complex account
    const existingMall = await prisma.mall.findFirst({
      where: { email: { equals: storeEmail, mode: "insensitive" } },
    });
    if (existingMall) {
      return res.status(400).json({
        success: false,
        message: `The email "${storeEmail}" is already in use by a shopping complex administrator account.`,
      });
    }

    const hashedPassword = req.body.password ? await bcrypt.hash(req.body.password, 10) : null;
    const storeName = req.body.name || req.body.title || "Store";

    // Create the Store in PostgreSQL
    const newStore = await prisma.store.create({
      data: {
        mallId: id,
        name: storeName,
        category: req.body.category || "Retail Store",
        image: req.body.image || "",
        description: req.body.description || "",
        link: req.body.link || "",
        email: storeEmail,
        password: hashedPassword,
        role: req.body.role || "shop admin",
        shopconpassword: req.body.shopconpassword || "",
        conciergeFee: Number(req.body.conciergeFee) || 120,
        qrCodeUrl: req.body.qrCodeUrl || "",
        qrCodeSize: Number(req.body.qrCodeSize) || 240,
        subscriptionStatus: req.body.subscriptionStatus || "active",
      },
    });

    // Create or update corresponding User account for the store
    if (storeEmail && hashedPassword) {
      await prisma.user.upsert({
        where: { email: storeEmail },
        update: {
          name: storeName,
          password: hashedPassword,
          role: req.body.role || "shop admin",
          shopId: newStore.id,
          mallId: id,
        },
        create: {
          name: storeName,
          email: storeEmail,
          password: hashedPassword,
          role: req.body.role || "shop admin",
          shopId: newStore.id,
          mallId: id,
        },
      });
    }

    const updatedMall = await prisma.mall.findUnique({
      where: { id },
      include: { menuItems: { orderBy: { createdAt: "asc" } } },
    });

    const visibleItems = updatedMall.menuItems.filter(
      (m) => m.subscriptionStatus !== "deleted"
    );

    res.json({
      _id: updatedMall.id,
      ...updatedMall,
      store: newStore,
      menuItems: visibleItems.map((m) => ({ _id: m.id, ...m })),
    });
  } catch (err) {
    console.error("Error adding menu item:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get Stores / Menu Items of a Mall (excluding deleted stores)
router.get("/shops/:id/menu", async (req, res) => {
  try {
    const { id } = req.params;
    const stores = await prisma.store.findMany({
      where: {
        mallId: id,
        subscriptionStatus: { not: "deleted" },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(stores.map((s) => ({ _id: s.id, ...s })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
