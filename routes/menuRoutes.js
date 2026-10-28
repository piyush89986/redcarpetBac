const express = require("express");
const router = express.Router();
const Shop = require("../models/Shop");
const ShopUser = require("../models/User");
const bcrypt = require("bcryptjs");



// ✅ Add Menu Item
// router.post("/shops/:id/menu", async (req, res) => {
//   try {
//     console.log(req.body)
//     const shop = await Shop.findById(req.params.id);
//     if (!shop) return res.status(404).json({ message: "Shop not found" });

//     shop.menuItems.push(req.body);
//     await shop.save();

//     const hashedPassword = await bcrypt.hash(shop.password, 10);

//     const userr = new ShopUser({
//         email: req.body.email,
//         password: hashedPassword,
//         role: req.body.role,
//       });
//       await userr.save();
//     res.json(shop);
//   } catch (err) {
//     console.log(err)
//     res.status(500).json({ message: err.message });
//   }
// });




router.post("/shops/:id/menu", async (req, res) => {
  try {
    console.log(req.body);
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    const hashPass =  await bcrypt.hash(req.body.password, 10);
    shop.menuItems.push({...req.body,password:hashPass});
    await shop.save();

    // ✅ Hash the password from req.body, not shop.password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    let userr = await ShopUser.findOne({ email: req.body.email });
    if (userr) {
      userr.name = req.body.name || req.body.title || userr.name || "Store Staff";
      userr.password = hashedPassword;
      userr.role = req.body.role || userr.role || "shop";
      userr.shopId = String(shop._id);
      await userr.save();
    } else {
      userr = new ShopUser({
        name: req.body.name || req.body.title || "Store Staff",
        email: req.body.email,
        password: hashedPassword,
        role: req.body.role || "shop",
        shopId: String(shop._id),
      });
      await userr.save();
    }
    res.json(shop);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get Menu Items
router.get("/shops/:id/menu", async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    res.json(shop.menuItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

