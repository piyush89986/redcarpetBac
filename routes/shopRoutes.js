const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const bcrypt = require("bcryptjs");

// Helper to format mall object for frontend compatibility (_id, menuItems)
const formatMall = (mall) => {
  if (!mall) return null;
  const visibleItems = (mall.menuItems || []).filter(
    (s) => s.subscriptionStatus !== "deleted"
  );
  const sortedItems = visibleItems.sort(
    (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
  );

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
    menuItems: sortedItems.map((store) => ({
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
      createdAt: store.createdAt,
    })),
  };
};

// Fetch all shops/malls
router.get("/api/shops", async (req, res) => {
  try {
    const malls = await prisma.mall.findMany({
      include: { menuItems: { orderBy: { createdAt: "asc" } } },
    });
    res.json(malls.map(formatMall));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add Menu Item / Store to a Mall (Enforcing Unique Email)
router.post("/api/shops/:id/menu", async (req, res) => {
  try {
    const { id } = req.params;
    const mall = await prisma.mall.findUnique({ where: { id } });
    if (!mall) return res.status(404).json({ success: false, message: "Mall not found" });

    const cleanEmail = (req.body.email || "").trim().toLowerCase();
    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: "Counter staff email address is required." });
    }

    // Enforce Unique Email across stores
    const existingStore = await prisma.store.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
    });
    if (existingStore) {
      return res.status(400).json({
        success: false,
        message: `The email "${cleanEmail}" is already registered to store "${existingStore.name}". Each store must have a unique staff email address.`,
      });
    }

    // Check if email already used by a mall
    const existingMall = await prisma.mall.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
    });
    if (existingMall) {
      return res.status(400).json({
        success: false,
        message: `The email "${cleanEmail}" is already in use by a shopping complex administrator account.`,
      });
    }

    const newStore = await prisma.store.create({
      data: {
        mallId: id,
        name: req.body.name || "Store",
        category: req.body.category || "Retail Store",
        image: req.body.image || "",
        description: req.body.description || "",
        link: req.body.link || "",
        email: cleanEmail,
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
      include: { menuItems: { orderBy: { createdAt: "asc" } } },
    });

    res.json({ message: "Store added successfully!", store: newStore, shop: formatMall(updatedMall) });
  } catch (err) {
    console.error("Error creating store:", err);
    res.status(500).json({ success: false, message: err.message });
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
        subscriptionStatus: store.subscriptionStatus,
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

// Update Menu Item / Store Handler
const handleUpdateStore = async (req, res) => {
  try {
    const { shopId, menuItemName } = req.params;
    const {
      newName,
      newLink,
      newDescription,
      newImage,
      newEmail,
      newPassword,
      newShopConPassword,
      newRole,
      subscriptionStatus,
      status,
    } = req.body;

    const effectiveStatus = subscriptionStatus || status;

    // Look up by ID or by name within the mall
    let store = await prisma.store.findFirst({
      where: {
        OR: [
          { id: menuItemName, mallId: shopId },
          { name: menuItemName, mallId: shopId },
          { id: menuItemName },
        ],
      },
    });

    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    // If email is changing, ensure it remains globally unique
    if (newEmail) {
      const cleanEmail = newEmail.trim().toLowerCase();
      const duplicateStore = await prisma.store.findFirst({
        where: {
          email: { equals: cleanEmail, mode: "insensitive" },
          id: { not: store.id },
        },
      });
      if (duplicateStore) {
        return res.status(400).json({
          success: false,
          message: `The email "${cleanEmail}" is already registered to store "${duplicateStore.name}". Each store must have a unique staff email address.`,
        });
      }
    }

    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: {
        ...(newName && { name: newName }),
        ...(newLink !== undefined && { link: newLink }),
        ...(newDescription !== undefined && { description: newDescription }),
        ...(newImage !== undefined && { image: newImage }),
        ...(newEmail && { email: newEmail.trim().toLowerCase() }),
        ...(newPassword && { password: newPassword }),
        ...(newShopConPassword !== undefined && { shopconpassword: newShopConPassword }),
        ...(newRole && { role: newRole }),
        ...(effectiveStatus && { subscriptionStatus: effectiveStatus }),
      },
    });

    res.json({ success: true, message: "Store updated", store: updatedStore });
  } catch (err) {
    console.error("Error updating store:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Soft Store Deletion Handler (Keeps store in DB, marks as deleted, disables owner login to disabled page)
const handleDeleteStore = async (req, res) => {
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

    // 1. Mark store as deleted (soft delete in DB)
    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: { subscriptionStatus: "deleted" },
    });

    // 2. Mark user account as inactive
    await prisma.user.updateMany({
      where: {
        OR: [
          { shopId: store.id },
          ...(store.email ? [{ email: { equals: store.email, mode: "insensitive" } }] : []),
        ],
      },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: `Store "${store.name}" disabled and removed from mall directory.`,
      store: updatedStore,
    });
  } catch (error) {
    console.error("Error deleting store:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Support all legacy and current route paths for updating a store / menu item
router.put("/api/update-menu-item/:shopId/:menuItemName", handleUpdateStore);
router.put("/api/shops/update-menu-item/:shopId/:menuItemName", handleUpdateStore);
router.put("/api/shops/:shopId/stores/:menuItemName", handleUpdateStore);
router.put("/api/shops/:shopId/stores/:menuItemName/status", handleUpdateStore);

// Support all route paths for permanently deleting a store
router.delete("/api/shops/delete-menu-item/:id/:name", handleDeleteStore);
router.delete("/api/shops/:id/menu/:name", handleDeleteStore);
router.delete("/api/shops/:id/stores/:name", handleDeleteStore);

// Store Owner Profile & Password Settings Update Handler
const handleUpdateStoreSettings = async (req, res) => {
  const { id } = req.params;
  const { name, email, description, currentPassword, newPassword } = req.body;

  try {
    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    let hashedPassword = null;
    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 4 characters long.",
        });
      }

      if (currentPassword && currentPassword.trim()) {
        const isMatch =
          store.shopconpassword === currentPassword.trim() ||
          (store.password && (await bcrypt.compare(currentPassword.trim(), store.password)));
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            message: "Current password is incorrect.",
          });
        }
      }

      hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    }

    const cleanEmail = email ? email.trim().toLowerCase() : null;
    if (cleanEmail && cleanEmail !== (store.email || "").toLowerCase()) {
      const duplicateStore = await prisma.store.findFirst({
        where: {
          email: { equals: cleanEmail, mode: "insensitive" },
          id: { not: store.id },
        },
      });
      if (duplicateStore) {
        return res.status(400).json({
          success: false,
          message: `The email "${cleanEmail}" is already registered to another store.`,
        });
      }
    }

    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(cleanEmail && { email: cleanEmail }),
        ...(description !== undefined && { description: description.trim() }),
        ...(hashedPassword && {
          password: hashedPassword,
          shopconpassword: newPassword.trim(),
        }),
      },
    });

    // Sync corresponding user record
    await prisma.user.updateMany({
      where: {
        OR: [
          { shopId: store.id },
          ...(store.email ? [{ email: { equals: store.email, mode: "insensitive" } }] : []),
        ],
      },
      data: {
        ...(name && { name: name.trim() }),
        ...(cleanEmail && { email: cleanEmail }),
        ...(hashedPassword && { password: hashedPassword }),
      },
    });

    res.json({
      success: true,
      message: "Profile settings updated successfully!",
      store: updatedStore,
    });
  } catch (err) {
    console.error("Error updating store settings:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

router.put("/api/shops/:id/settings", handleUpdateStoreSettings);
router.put("/api/stores/:id/profile", handleUpdateStoreSettings);

module.exports = router;
