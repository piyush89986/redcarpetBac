
const express = require('express');
const router = express.Router();
const DisplayModel = require("../models/DisplayModel");


// ✅ API to insert 
router.post("/display", async (req, res) => {
    try {
      const newData = new DisplayModel(req.body);
      await newData.save();
      res.status(201).json({ message: "Added Successfully!", newData });
    } catch (error) {
      console.error("Error adding:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });
  
  // ✅ API to get saved data where project ID matches displayid
  router.get("/display/:id", async (req, res) => {
    try {
      const { id } = req.params; // 🔹 Get ID from URL
  
      const data = await DisplayModel.findOne({ displayid: id });
  
      if (!data) {
        return res.status(404).json({ message: "No matching data found!" });
      }
  
      res.status(200).json(data);
    } catch (error) {
      console.error("Error fetching:", error);
      res.status(500).json({ message: "Error fetching data", error: error.message });
    }
  });
  
  // ✅ API to update existing data where project ID matches displayid
  router.put("/display/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Received ID:", id);

        const updatedData = await DisplayModel.findOneAndUpdate(
            { displayid: id },  // ID check karega
            { $set: req.body, displayid: id }, // Agar update ho raha hai to data change karega
            { new: true, upsert: true } // ⚡ `upsert: true` => Agar nahi mila to insert karega
        );

        console.log("Updated or Inserted Data:", updatedData);
        res.status(200).json({ message: "Data Updated or Inserted Successfully!", updatedData });

    } catch (error) {
        console.error("Error updating:", error);
        res.status(500).json({ message: "Error updating data", error: error.message });
    }
});

  
  
  module.exports = router;
