const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const QrConfig = require("../models/QrConfig");
const Shop = require("../models/Shop");

// GET QR config for a specific mall / shop
router.get("/qrcode/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;
    let config = await QrConfig.findOne({ shopId });

    if (!config && mongoose.Types.ObjectId.isValid(shopId)) {
      const shop = await Shop.findById(shopId);
      if (shop && shop.qrCodeUrl) {
        config = {
          shopId,
          qrUrl: shop.qrCodeUrl,
          size: shop.qrCodeSize || 240,
        };
      }
    }

    if (!config) {
      return res.status(200).json({
        success: true,
        data: {
          shopId,
          qrUrl: "",
          size: 240,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Error fetching QR config:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching QR config",
      error: error.message,
    });
  }
});

// Save or Update QR config for a specific mall / shop
const saveQrHandler = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { qrUrl, size } = req.body;

    if (!qrUrl) {
      return res.status(400).json({
        success: false,
        message: "QR destination link is required.",
      });
    }

    const qrSize = Number(size) || 240;

    // 1. Save or update QrConfig collection
    const updatedConfig = await QrConfig.findOneAndUpdate(
      { shopId },
      {
        $set: {
          shopId,
          qrUrl,
          size: qrSize,
          updatedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    // 2. Also update Shop document if shopId is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(shopId)) {
      await Shop.findByIdAndUpdate(shopId, {
        $set: {
          qrCodeUrl: qrUrl,
          qrCodeSize: qrSize,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "QR settings saved to database successfully!",
      data: updatedConfig,
    });
  } catch (error) {
    console.error("Error saving QR config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save QR configuration",
      error: error.message,
    });
  }
};

router.post("/qrcode/:shopId", saveQrHandler);
router.put("/qrcode/:shopId", saveQrHandler);

// GET all QR configs
router.get("/qrcodes", async (req, res) => {
  try {
    const allConfigs = await QrConfig.find({});
    res.status(200).json({ success: true, data: allConfigs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
