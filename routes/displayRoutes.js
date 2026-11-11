const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');

// API to insert/save TV display
router.post("/display", async (req, res) => {
  try {
    const { displayid, ...rest } = req.body;
    if (!displayid) {
      return res.status(400).json({ message: "displayid is required" });
    }

    const newData = await prisma.tvDisplay.create({
      data: {
        displayid: String(displayid),
        ...rest,
      },
    });

    res.status(201).json({ message: "Added Successfully!", newData });
  } catch (error) {
    console.error("Error adding display:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// API to get saved data where project ID matches displayid
router.get("/display/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const data = await prisma.tvDisplay.findUnique({
      where: { displayid: String(id) },
    });

    if (!data) {
      return res.status(404).json({ message: "No matching data found!" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching display:", error);
    res.status(500).json({ message: "Error fetching data", error: error.message });
  }
});

// API to upsert existing data where project ID matches displayid
router.put("/display/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { displayid, id: bodyId, ...updateFields } = req.body;

    const updatedData = await prisma.tvDisplay.upsert({
      where: { displayid: String(id) },
      update: updateFields,
      create: {
        displayid: String(id),
        ...updateFields,
      },
    });

    res.status(200).json({ message: "Data Updated or Inserted Successfully!", updatedData });
  } catch (error) {
    console.error("Error updating display:", error);
    res.status(500).json({ message: "Error updating data", error: error.message });
  }
});

module.exports = router;
