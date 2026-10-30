const express = require("express");
const router = express.Router();
const { QrConfig, Mall, Store } = require("../models/pg");

const FRONTEND_BASE_URL =
  process.env.FRONTEND_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "https://redcarpet-fr.vercel.app";

const sanitizeQrUrl = (url, shopId) => {
  const base = FRONTEND_BASE_URL.replace(/\/+$/, "");
  if (!url || typeof url !== "string") {
    return `${base}/${shopId}`;
  }
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    return url.replace(/^https?:\/\/[^/]+/, base);
  }
  return url;
};

// GET QR config for a specific mall / shop
router.get("/qrcode/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;
    let config = await QrConfig.findOne({ where: { shopId } });

    if (!config && shopId) {
      const mall = await Mall.findByPk(shopId);
      if (mall && mall.qrCodeUrl) {
        config = {
          shopId,
          qrUrl: mall.qrCodeUrl,
          size: mall.qrCodeSize || 240,
        };
      } else {
        const store = await Store.findByPk(shopId);
        if (store && store.qrCodeUrl) {
          config = {
            shopId,
            qrUrl: store.qrCodeUrl,
            size: store.qrCodeSize || 240,
          };
        }
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

    // 1. Save or update in QrConfig
    let existingConfig = await QrConfig.findOne({ where: { shopId } });
    let updatedConfig;
    if (existingConfig) {
      existingConfig.qrUrl = qrUrl.trim();
      existingConfig.size = qrSize;
      await existingConfig.save();
      updatedConfig = existingConfig;
    } else {
      updatedConfig = await QrConfig.create({
        shopId,
        qrUrl: qrUrl.trim(),
        size: qrSize,
      });
    }

    // 2. Sync to Mall or Store table
    if (shopId) {
      const mall = await Mall.findByPk(shopId);
      if (mall) {
        mall.qrCodeUrl = qrUrl.trim();
        mall.qrCodeSize = qrSize;
        await mall.save();
      } else {
        const store = await Store.findByPk(shopId);
        if (store) {
          store.qrCodeUrl = qrUrl.trim();
          store.qrCodeSize = qrSize;
          await store.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "QR configuration saved successfully.",
      data: updatedConfig,
    });
  } catch (error) {
    console.error("Error saving QR config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save QR configuration.",
      error: error.message,
    });
  }
};

router.post("/qrcode/:shopId", saveQrHandler);
router.put("/qrcode/:shopId", saveQrHandler);

module.exports = router;
