const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');

// Route to get active live queue data (refreshed for last 12 hours per shop)
router.get('/get-data/:id', async (req, res) => {
  try {
    const { id } = req.params; // Get shop or mall ID from URL
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    // Find tokens where shopid matches and created within last 12 hours
    const data = await prisma.queueToken.findMany({
      where: {
        shopid: id,
        createdAt: {
          gte: twelveHoursAgo,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching live queue data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

module.exports = router;
