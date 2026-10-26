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
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   const user = await User.findOne({ email });

//   if (!user) return res.status(400).json({ error: "User not found" });

//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) return res.status(400).json({ error: "Invalid password" });

//   const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
//     expiresIn: "1h",
//   });
//   res.json({ token, user: { name: user.name, email: user.email } });
// });

// module.exports = router;




// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   const user = await User.findOne({ email });

//   if (!user) return res.status(400).json({ error: "User not found" });

//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) return res.status(400).json({ error: "Invalid password" });

//   // User se linked shop ka data dhoondo (agar shops collection me store hai)
//   const shop = await Shop.findOne({ email });

//   if (shop) {
//     console.log("User logged in. Shop ID:", Shop._id); // Shop ki ID console me print hogi
//   } else {
//     console.log("No shop found for this user.");
//   }

//   const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
//     expiresIn: "1h",
//   });

//   res.json({
//     token,
//     user: { name: user.name, email: user.email },
//     shopId: shop ? shop._id : null, // Frontend ko bhi shop ki ID bhejna
//   });
// });

// module.exports = router;







// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;

//   const user = await User.findOne({ email });

//   if (!user) return res.status(400).json({ error: "User not found" });

//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) return res.status(400).json({ error: "Invalid password" });

//   // User se linked shop ka data dhoondo (agar shops collection me store hai)
//   const shop = await Shop.findOne({ email });

//   if (shop) {
//     console.log("User logged in. Shop ID:", Shop._id); // Shop ki ID console me print hogi
//   } else {
//     console.log("No shop found for this user.");
//   }

//   const token = jwt.sign(
//     { userId: user._id, role: user.role }, // JWT me role add kiya
//     process.env.JWT_SECRET,
//     { expiresIn: "1h" }
//   );
//  res.json({
//     token,
//     user: { name: user.name, email: user.email, role: user.role }, // Role frontend ko bhej raha hai
//     shopId: shop ? shop._id : null, // Shop ID bhi bhej raha hai
//   });
// });





router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    // Step 1: Directly check in User collection
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: "Invalid password" });
    } 
    // Step 2: Check in Food collection if not found in User
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

    // Step 5: Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: { name: user.name || "", email: user.email, role: user.role }, // Handle name missing case
      shopId: shop ? shop._id : null,
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
