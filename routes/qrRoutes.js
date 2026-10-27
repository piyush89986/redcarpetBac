const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const QrConfig = require("../models/QrConfig");
const Shop = require("../models/Shop");

const FRONTEND_BASE_URL =
  process.env.FRONTEND_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "https://redcarpet-fr.vercel.app";

const sanitizeQrUrl = (url, shopId) => {
  const base = FRONTEND_BASE_URL.replace(/\/+$/, "");
  if (!url || typeof url !== "string") {
    return `${base}/${shopId}`;
  }
  if (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("git-main-piyush-singh-tanwar-s-projects")
  ) {
    return url.replace(/^https?:\/\/[^/]+/, base);
  }
  return url;
};

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
      } else {
        const parentMall = await Shop.findOne({ "menuItems._id": shopId });
        if (parentMall) {
          const item = parentMall.menuItems.id(shopId);
          if (item && item.qrCodeUrl) {
            config = {
              shopId,
              qrUrl: item.qrCodeUrl,
              size: item.qrCodeSize || 240,
            };
          }
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

    // 2. Also update Shop or menuItem document if shopId is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(shopId)) {
      const topShop = await Shop.findById(shopId);
      if (topShop) {
        await Shop.findByIdAndUpdate(shopId, {
          $set: {
            qrCodeUrl: qrUrl,
            qrCodeSize: qrSize,
          },
        });
      } else {
        await Shop.updateOne(
          { "menuItems._id": shopId },
          {
            $set: {
              "menuItems.$.qrCodeUrl": qrUrl,
              "menuItems.$.qrCodeSize": qrSize,
            },
          }
        );
      }
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

// Toggle / Update Mall & Store Subscription Status
const handleSubscriptionToggle = async (req, res) => {
  const { id } = req.params;
  const { subscriptionStatus } = req.body;

  if (!subscriptionStatus || !["active", "inactive"].includes(subscriptionStatus)) {
    return res.status(400).json({
      success: false,
      message: "Valid subscriptionStatus ('active' or 'inactive') is required.",
    });
  }

  try {
    // 1. Try finding and updating top-level Mall / Shop
    if (mongoose.Types.ObjectId.isValid(id)) {
      let shop = await Shop.findById(id);
      if (shop) {
        shop.subscriptionStatus = subscriptionStatus;
        await shop.save();
        return res.status(200).json({
          success: true,
          message: `Subscription successfully updated to ${subscriptionStatus}`,
          subscriptionStatus,
          shop,
        });
      }
    }

    // 2. Try finding as a child store inside menuItems
    const parentMall = await Shop.findOne({ "menuItems._id": id });
    if (parentMall) {
      const item = parentMall.menuItems.id(id);
      if (item) {
        item.subscriptionStatus = subscriptionStatus;
        await parentMall.save();
        return res.status(200).json({
          success: true,
          message: `Store subscription successfully updated to ${subscriptionStatus}`,
          subscriptionStatus,
          shop: item,
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: "Shop / Mall not found with ID " + id,
    });
  } catch (error) {
    console.error("Subscription update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update subscription status",
      error: error.message,
    });
  }
};

router.patch("/shops/:id/subscription", handleSubscriptionToggle);
router.put("/shops/:id/subscription", handleSubscriptionToggle);
router.post("/shops/:id/subscription", handleSubscriptionToggle);

module.exports = router;
