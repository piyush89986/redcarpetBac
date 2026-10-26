
const express = require('express');
const router = express.Router();
const Data = require('../models/data');

// Route to get active live queue data (refreshed for last 12 hours per shop)
router.get('/get-data/:id', async (req, res) => {
  try {
    const { id } = req.params; // Get shop or mall ID from URL
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    // Find users where 'shopid' matches the ID and created within the last 12 hours
    const data = await Data.find({
      shopid: id,
      createdAt: { $gte: twelveHoursAgo },
    }).sort({ createdAt: 1 });

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching live queue data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

module.exports = router;
