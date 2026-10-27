const express = require("express");
const router = express.Router();
const Shop = require("../models/Shop");

// ✅ Fetch all shops
router.get("/api/shops", async (req, res) => {
  try {
    const shops = await Shop.find();
    res.json(shops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// // ✅ Add new shop item
// router.post("/shops", async (req, res) => {
//   const { title, description, image} = req.body;

//   const shop = new Shop({
//     title,
//     description,
//     image,
//     menuItems: [],
//   });

//   try {
//     const newShop = await shop.save();
//     res.status(201).json(newShop);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

// ✅ Add Menu Item to a Shop
router.post("/api/shops/:id/menu", async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    // Fix: Ensure menuItems exists
    if (!shop.menuItems) {
      shop.menuItems = [];
    }

    shop.menuItems.push(req.body);
    await shop.save();

    res.json({ message: "Menu item added successfully!", shop });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Menu Items of a Shop
router.get("/api/shops/:id/menu", async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    res.json(shop.menuItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const mongoose = require("mongoose");

// ✅ Fetch a single shop or store item along with details
router.get("/api/shops/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let shop = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      shop = await Shop.findById(id);

      // If not a top-level mall, check if it's a specific store inside a mall
      if (!shop) {
        const parentMall = await Shop.findOne({ "menuItems._id": id });
        if (parentMall) {
          const item = parentMall.menuItems.id(id);
          if (item) {
            shop = {
              _id: item._id,
              title: item.name,
              name: item.name,
              description: item.description,
              image: item.image,
              email: item.email,
              role: item.role,
              mallTitle: parentMall.title,
              mallId: parentMall._id,
              menuItems: [item],
            };
          }
        }
      }
    }

    if (!shop) return res.status(404).json({ message: "Shop not found" });

    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Update Menu Item
router.put("/api/update-menu-item/:shopId/:menuItemName", async (req, res) => {
  try {
    const { shopId, menuItemName } = req.params;
    const { newName, newLink, newDescription, newEmail, newPassword, newShopConPassword, newRole } = req.body;

    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ message: "Shop item not found" });

    // Update the menu item
    const menuItem = shop.menuItems.find((item) => item.name === menuItemName);
    if (!menuItem) return res.status(404).json({ message: "Menu item not found" });

    menuItem.name = newName;
    menuItem.link = newLink;
    menuItem.description = newDescription;
    menuItem.email = newEmail;
    menuItem.password = newPassword;
    menuItem.shopconpassword = newShopConPassword;
    menuItem.role = newRole;


    await shop.save(); // Save to MongoDB
    res.json({ success: true, message: "Menu item updated", shop });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
