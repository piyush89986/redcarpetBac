
const express = require('express');
const router = express.Router();
const Data = require('../models/data'); // Replace with your model file path

// Route to get all data
router.get('/get-data/:id', async (req, res) => {
  try {
    const { id } = req.params; // Get ID from URL

     // Find users where 'shopId' matches the URL ID
     const data = await Data.find({ shopid: id });
  
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

module.exports = router;
