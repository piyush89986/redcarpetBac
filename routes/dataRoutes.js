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

// Mark token as served (Persisted in PostgreSQL database)
router.post('/mark-served', async (req, res) => {
  try {
    const { tokenId, id, shopId, shopid, token } = req.body;
    const targetId = tokenId || id;

    if (targetId) {
      const updated = await prisma.queueToken.update({
        where: { id: String(targetId) },
        data: {
          status: 'served',
          clicked: true,
          servedAt: new Date(),
        },
      });
      return res.status(200).json({ success: true, data: updated });
    }

    const sid = shopId || shopid;
    if (sid && token) {
      const updated = await prisma.queueToken.updateMany({
        where: {
          shopid: String(sid),
          token: String(token),
        },
        data: {
          status: 'served',
          clicked: true,
          servedAt: new Date(),
        },
      });
      return res.status(200).json({ success: true, count: updated.count });
    }

    return res.status(400).json({ error: 'Token ID or shopId + token is required' });
  } catch (error) {
    console.error('Error marking token as served:', error);
    res.status(500).json({ error: 'Failed to mark token as served' });
  }
});

// Mark token as served by URL param
router.put('/mark-served/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const updated = await prisma.queueToken.update({
      where: { id: String(tokenId) },
      data: {
        status: 'served',
        clicked: true,
        servedAt: new Date(),
      },
    });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error marking token as served by ID:', error);
    res.status(500).json({ error: 'Failed to mark token as served' });
  }
});

// Re-open / unmark served token (returns to waiting line)
router.post('/unmark-served', async (req, res) => {
  try {
    const { tokenId, id, shopId, shopid, token } = req.body;
    const targetId = tokenId || id;

    if (targetId) {
      const updated = await prisma.queueToken.update({
        where: { id: String(targetId) },
        data: {
          status: 'waiting',
          clicked: false,
          servedAt: null,
        },
      });
      return res.status(200).json({ success: true, data: updated });
    }

    const sid = shopId || shopid;
    if (sid && token) {
      const updated = await prisma.queueToken.updateMany({
        where: {
          shopid: String(sid),
          token: String(token),
        },
        data: {
          status: 'waiting',
          clicked: false,
          servedAt: null,
        },
      });
      return res.status(200).json({ success: true, count: updated.count });
    }

    return res.status(400).json({ error: 'Token ID or shopId + token is required' });
  } catch (error) {
    console.error('Error unmarking token:', error);
    res.status(500).json({ error: 'Failed to unmark token' });
  }
});

module.exports = router;
