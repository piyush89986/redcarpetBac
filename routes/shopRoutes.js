const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");

// Helper to format mall object for frontend compatibility (_id, menuItems)
const formatMall = (mall) => {
  if (!mall) return null;
  return {
    _id: mall.id,
    id: mall.id,
    title: mall.title,
    description: mall.description,
    image: mall.image,
    email: mall.email,
    role: mall.role,
    city: mall.city,
    address: mall.address,
    contactPhone: mall.contactPhone,
    subscriptionStatus: mall.subscriptionStatus,
    qrCodeUrl: mall.qrCodeUrl,
    qrCodeSize: mall.qrCodeSize,
    plan: mall.plan,
    menuItems: (mall.menuItems || []).map((store) => ({
      _id: store.id,
      id: store.id,
      name: store.name,
      category: store.category,
      image: store.image,
      description: store.description,
      link: store.link,
      email: store.email,
      role: store.role,
      conciergeFee: store.conciergeFee,
      qrCodeUrl: store.qrCodeUrl,
      qrCodeSize: store.qrCodeSize,
      subscriptionStatus: store.subscriptionStatus,
    })),
  };
};

// Fetch all shops/malls
router.get("/api/shops", async (req, res) => {
  try {
    const malls = await prisma.mall.findMany({
      include: { menuItems: true },
    });
    res.json(malls.map(formatMall));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add Menu Item / Store to a Mall
router.post("/api/shops/:id/menu", async (req, res) => {
  try {
    const { id } = req.params;
    const mall = await prisma.mall.findUnique({ where: { id } });
    if (!mall) return res.status(404).json({ message: "Mall not found" });

    const newStore = await prisma.store.create({
      data: {
        mallId: id,
        name: req.body.name || "Store",
        category: req.body.category || "Retail Store",
        image: req.body.image || "",
        description: req.body.description || "",
        link: req.body.link || "",
        email: req.body.email || null,
        password: req.body.password || null,
        role: req.body.role || "shop admin",
        shopconpassword: req.body.shopconpassword || "",
        conciergeFee: Number(req.body.conciergeFee) || 120,
        qrCodeUrl: req.body.qrCodeUrl || "",
        qrCodeSize: Number(req.body.qrCodeSize) || 240,
        subscriptionStatus: req.body.subscriptionStatus || "active",
      },
    });

    const updatedMall = await prisma.mall.findUnique({
      where: { id },
      include: { menuItems: true },
    });

    res.json({ message: "Store added successfully!", store: newStore, shop: formatMall(updatedMall) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Menu Items of a Shop
router.get("/api/shops/:id/menu", async (req, res) => {
  try {
    const { id } = req.params;
    const stores = await prisma.store.findMany({
      where: { mallId: id },
    });
    res.json(stores.map((s) => ({ _id: s.id, ...s })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Fetch a single shop or store item along with details
router.get("/api/shops/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Try finding as a Mall
    const mall = await prisma.mall.findUnique({
      where: { id },
      include: { menuItems: true },
    });

    if (mall) {
      return res.json(formatMall(mall));
    }

    // 2. Try finding as an individual Store inside a Mall
    const store = await prisma.store.findUnique({
      where: { id },
      include: { mall: true },
    });

    if (store) {
      const formattedStore = {
        _id: store.id,
        id: store.id,
        title: store.name,
        name: store.name,
        category: store.category,
        description: store.description,
        image: store.image || store.mall?.image,
        email: store.email,
        role: store.role,
        mallTitle: store.mall?.title,
        mallId: store.mallId,
        menuItems: [
          {
            _id: store.id,
            id: store.id,
            name: store.name,
            description: store.description,
            image: store.image,
            email: store.email,
            role: store.role,
          },
        ],
      };
      return res.json(formattedStore);
    }

    res.status(404).json({ message: "Shop or Store not found" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Menu Item / Store
router.put("/api/update-menu-item/:shopId/:menuItemName", async (req, res) => {
  try {
    const { shopId, menuItemName } = req.params;
    const { newName, newLink, newDescription, newEmail, newPassword, newShopConPassword, newRole } = req.body;

    const store = await prisma.store.findFirst({
      where: {
        mallId: shopId,
        name: menuItemName,
      },
    });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: {
        ...(newName && { name: newName }),
        ...(newLink && { link: newLink }),
        ...(newDescription && { description: newDescription }),
        ...(newEmail && { email: newEmail }),
        ...(newPassword && { password: newPassword }),
        ...(newShopConPassword && { shopconpassword: newShopConPassword }),
        ...(newRole && { role: newRole }),
      },
    });

    res.json({ success: true, message: "Store updated", store: updatedStore });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
