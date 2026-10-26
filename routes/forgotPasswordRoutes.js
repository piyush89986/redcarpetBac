const express = require("express");
const router = express.Router();
const Food = require("../models/Shop"); // Aapka schema
const bcrypt = require("bcryptjs");


// Step 1: Email aur role input lo




// ish me sare role ka password reset kar sakte hai
// router.post("/check-user", async (req, res) => {
//   const { email, role } = req.body;

//   try {
//     // Database me email aur role match karo
//     let user = await Food.findOne({ email, role });

//     if (!user) {
//       user = await Food.findOne({ "menuItems.email": email, "menuItems.role": role });
//     }

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json({ message: "User found, proceed to reset password" });
//   } catch (error) {
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });



// ish me sirf superadmin role ka passwoed set kar sakte hai
router.post("/check-user", async (req, res) => {
  const { email, role } = req.body;

  try {
    // Sirf "superadmin" role allow karo
    if (role !== "superadmin") {
      return res.status(403).json({ message: "Role can't exist" });
    }

    // Database me email aur role match karo
    let user = await Food.findOne({ email, role });

    if (!user) {
      user = await Food.findOne({ "menuItems.email": email, "menuItems.role": role });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User found, proceed to reset password" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});








// Step 2: Password reset karo
router.post("/reset-password", async (req, res) => {
  const { email, role, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    // Password hashing
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    let userUpdated = false;

    // 🔍 Step 1: Directly update in the `Food` schema
    let user = await Food.findOneAndUpdate(
      { email, role },
      { $set: { password: hashedPassword } },
      { new: true }
    );

    if (user) userUpdated = true;

    // 🔍 Step 2: Update inside `menuItems`
    if (!userUpdated) {
      user = await Food.findOneAndUpdate(
        { "menuItems.email": email, "menuItems.role": role },
        { $set: { "menuItems.$.password": hashedPassword } },
        { new: true }
      );
      if (user) userUpdated = true;
    }

    // ✅ If updated successfully
    if (userUpdated) {
      return res.json({ message: "Password updated successfully" });
      
    }

    // ❌ If no user found
    return res.status(404).json({ message: "User not found" });

  } catch (error) {
    console.error("Error in reset-password:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

module.exports = router;
