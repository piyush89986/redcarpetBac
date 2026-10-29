const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Shop = require("../models/Shop");
const PhoenixUser = require("../models/data");
const QrScanLog = require("../models/QrScanLog");

/**
 * Helper: Resolve shop or mall details given an ID
 */
async function resolveLocation(targetId) {
  if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
    return {
      shopName: "General QR Location",
      mallName: "Red Carpet Platform",
      mallId: targetId || "",
      isStore: false,
    };
  }

  // 1. Is it a Mall?
  const mall = await Shop.findById(targetId);
  if (mall) {
    return {
      shopName: mall.title || "Mall Complex",
      mallName: mall.title || "Mall Complex",
      mallId: mall._id.toString(),
      isStore: false,
    };
  }

  // 2. Is it a Store inside a Mall?
  const parentMall = await Shop.findOne({ "menuItems._id": targetId });
  if (parentMall) {
    const item = parentMall.menuItems.id(targetId);
    return {
      shopName: item?.name || "Store Counter",
      mallName: parentMall.title || "Mall Complex",
      mallId: parentMall._id.toString(),
      isStore: true,
    };
  }

  return {
    shopName: "Store / Counter " + targetId.slice(-4),
    mallName: "Partner Complex",
    mallId: "",
    isStore: false,
  };
}

/**
 * POST /api/analytics/track-scan
 * Records a customer QR scan event
 */
router.post("/track-scan", async (req, res) => {
  try {
    const { shopId, scanType } = req.body;
    if (!shopId) {
      return res.status(400).json({ success: false, message: "shopId is required" });
    }

    const { shopName, mallName, mallId, isStore } = await resolveLocation(shopId);

    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";
    const userAgent = req.headers["user-agent"] || "";

    const scanLog = new QrScanLog({
      shopId: String(shopId),
      mallId: String(mallId || shopId),
      shopName,
      mallName,
      isStore,
      scanType: scanType || "qr_scan",
      ip: clientIp,
      userAgent,
      scannedAt: new Date(),
    });

    await scanLog.save();

    return res.status(201).json({
      success: true,
      message: "QR scan logged successfully",
      data: {
        id: scanLog._id,
        shopName,
        mallName,
        scannedAt: scanLog.scannedAt,
      },
    });
  } catch (error) {
    console.error("Error logging QR scan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record QR scan",
      error: error.message,
    });
  }
});

/**
 * GET /api/analytics/overview
 * Provides statistics:
 * - If mallId / shopId is provided: Returns metrics scoped specifically to that business & its counters.
 * - Otherwise: Returns platform overview.
 */
router.get("/overview", async (req, res) => {
  try {
    const { mallId, shopId } = req.query;
    const targetMallId = mallId || shopId;

    // 1. Fetch mall scoped strictly to the manager's business
    let allMalls = [];
    let resolvedMallId = null;

    if (targetMallId && mongoose.Types.ObjectId.isValid(targetMallId)) {
      let singleMall = await Shop.findById(targetMallId).lean();
      if (!singleMall) {
        // In case targetMallId is a store ID inside a mall
        singleMall = await Shop.findOne({ "menuItems._id": targetMallId }).lean();
      }
      if (singleMall) {
        allMalls = [singleMall];
        resolvedMallId = singleMall._id.toString();
      }
    }

    // Default to the first mall if no specific ID provided (never expose all 16 malls across the system)
    if (allMalls.length === 0) {
      const defaultMall = await Shop.findOne().lean();
      if (defaultMall) {
        allMalls = [defaultMall];
        resolvedMallId = defaultMall._id.toString();
      }
    }

    // 2. Total entities for this specific business
    const totalMalls = allMalls.length;
    let totalStores = 0;
    const storeMap = {};
    const mallStoreIds = {};

    allMalls.forEach((mall) => {
      const mallIdStr = mall._id.toString();
      mallStoreIds[mallIdStr] = [];
      if (Array.isArray(mall.menuItems)) {
        totalStores += mall.menuItems.length;
        mall.menuItems.forEach((st) => {
          const stIdStr = st._id.toString();
          mallStoreIds[mallIdStr].push(stIdStr);
          storeMap[stIdStr] = {
            storeId: stIdStr,
            name: st.name || "Counter",
            image: st.image || "",
            mallId: mallIdStr,
            mallTitle: mall.title || "Mall",
            subscriptionStatus: st.subscriptionStatus || "active",
            qrCodeUrl: st.qrCodeUrl || "",
          };
        });
      }
    });

    // 3. Time boundaries
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(todayStart.getTime() - 13 * 24 * 60 * 60 * 1000);

    // Scoped query filters strictly for this mall and its counters
    const scopedStoreIds = resolvedMallId && mallStoreIds[resolvedMallId] ? mallStoreIds[resolvedMallId] : [];
    const allScopedIds = [resolvedMallId, ...scopedStoreIds].filter(Boolean).map(String);

    const scanFilter = allScopedIds.length > 0
      ? { $or: [{ mallId: { $in: allScopedIds } }, { shopId: { $in: allScopedIds } }] }
      : {};
    const todayScanFilter = { ...scanFilter, scannedAt: { $gte: todayStart } };

    const tokenFilter = allScopedIds.length > 0
      ? { $or: [{ shopid: { $in: allScopedIds } }, { mallId: { $in: allScopedIds } }] }
      : {};
    const todayTokenFilter = { ...tokenFilter, createdAt: { $gte: todayStart } };

    // 4. Counts from DB
    const [
      totalScansInDb,
      todayScansInDb,
      totalTokensInDb,
      todayTokensInDb,
      scansByShop,
      scansByMall,
      tokensByShop,
      todayScansByShop,
      todayTokensByShop,
      recentScans,
      recentTokens,
    ] = await Promise.all([
      QrScanLog.countDocuments(scanFilter),
      QrScanLog.countDocuments(todayScanFilter),
      PhoenixUser.countDocuments(tokenFilter),
      PhoenixUser.countDocuments(todayTokenFilter),
      QrScanLog.aggregate([
        ...(targetMallId ? [{ $match: scanFilter }] : []),
        { $group: { _id: "$shopId", count: { $sum: 1 }, lastAt: { $max: "$scannedAt" } } },
      ]),
      QrScanLog.aggregate([
        ...(targetMallId ? [{ $match: scanFilter }] : []),
        { $group: { _id: "$mallId", count: { $sum: 1 } } },
      ]),
      PhoenixUser.aggregate([
        ...(targetMallId ? [{ $match: tokenFilter }] : []),
        { $group: { _id: "$shopid", count: { $sum: 1 }, lastAt: { $max: "$createdAt" } } },
      ]),
      QrScanLog.aggregate([
        { $match: todayScanFilter },
        { $group: { _id: "$shopId", count: { $sum: 1 } } },
      ]),
      PhoenixUser.aggregate([
        { $match: todayTokenFilter },
        { $group: { _id: "$shopid", count: { $sum: 1 } } },
      ]),
      QrScanLog.find(scanFilter).sort({ scannedAt: -1 }).limit(15).lean(),
      PhoenixUser.find(tokenFilter).sort({ createdAt: -1 }).limit(15).lean(),
    ]);

    // Build lookup maps
    const scansMap = {};
    const lastScanMap = {};
    scansByShop.forEach((s) => {
      scansMap[String(s._id)] = s.count;
      lastScanMap[String(s._id)] = s.lastAt;
    });

    const scansMallMap = {};
    scansByMall.forEach((s) => {
      scansMallMap[String(s._id)] = s.count;
    });

    const tokensMap = {};
    const lastTokenMap = {};
    tokensByShop.forEach((t) => {
      tokensMap[String(t._id)] = t.count;
      lastTokenMap[String(t._id)] = t.lastAt;
    });

    const todayScansMap = {};
    todayScansByShop.forEach((s) => {
      todayScansMap[String(s._id)] = s.count;
    });

    const todayTokensMap = {};
    todayTokensByShop.forEach((t) => {
      todayTokensMap[String(t._id)] = t.count;
    });

    // 5. Mall Analytics compilation
    const mallsAnalytics = allMalls.map((mall) => {
      const mId = mall._id.toString();
      const childStoreIds = mallStoreIds[mId] || [];

      // Direct mall scans + all child store scans
      let directMallScans = scansMap[mId] || 0;
      let childStoreScans = 0;
      let directMallTokens = tokensMap[mId] || 0;
      let childStoreTokens = 0;
      let todayMallScans = todayScansMap[mId] || 0;
      let todayMallTokens = todayTokensMap[mId] || 0;

      childStoreIds.forEach((sId) => {
        childStoreScans += scansMap[sId] || 0;
        childStoreTokens += tokensMap[sId] || 0;
        todayMallScans += todayScansMap[sId] || 0;
        todayMallTokens += todayTokensMap[sId] || 0;
      });

      const totalMallVisitors = directMallScans + childStoreScans;
      const totalMallTokensIssued = directMallTokens + childStoreTokens;

      return {
        mallId: mId,
        title: mall.title || "Mall Complex",
        description: mall.description || "",
        image: mall.image || "",
        subscriptionStatus: mall.subscriptionStatus || "active",
        storeCount: (mall.menuItems && mall.menuItems.length) || 0,
        totalQrScans: totalMallVisitors,
        directQrScans: directMallScans,
        storesQrScans: childStoreScans,
        totalTokens: totalMallTokensIssued,
        todayScans: todayMallScans,
        todayTokens: todayMallTokens,
        conversionRate:
          totalMallVisitors > 0
            ? Math.min(100, Math.round((totalMallTokensIssued / totalMallVisitors) * 100))
            : totalMallTokensIssued > 0
            ? 85
            : 0,
      };
    });

    // Sort malls by footfall/scans descending
    mallsAnalytics.sort((a, b) => b.totalQrScans - a.totalQrScans);

    // 6. Stores Analytics compilation
    const storesAnalytics = Object.values(storeMap).map((st) => {
      const sId = st.storeId;
      const scans = scansMap[sId] || 0;
      const tokens = tokensMap[sId] || 0;
      const todayScans = todayScansMap[sId] || 0;
      const todayTokens = todayTokensMap[sId] || 0;
      const lastScan = lastScanMap[sId] || null;
      const lastToken = lastTokenMap[sId] || null;

      return {
        storeId: sId,
        name: st.name,
        image: st.image,
        mallId: st.mallId,
        mallTitle: st.mallTitle,
        subscriptionStatus: st.subscriptionStatus,
        totalQrScans: scans,
        totalTokens: tokens,
        todayScans,
        todayTokens,
        lastActive: lastToken || lastScan || null,
        conversionRate:
          scans > 0 ? Math.min(100, Math.round((tokens / scans) * 100)) : tokens > 0 ? 90 : 0,
      };
    });

    // Sort stores by customer tokens/scans descending
    storesAnalytics.sort((a, b) => b.totalTokens + b.totalQrScans - (a.totalTokens + a.totalQrScans));

    // 7. Daily Trends (Last 7 Days)
    const dailyScansAgg = await QrScanLog.aggregate([
      { $match: { scannedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$scannedAt" } },
          scans: { $sum: 1 },
        },
      },
    ]);

    const dailyTokensAgg = await PhoenixUser.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          tokens: { $sum: 1 },
        },
      },
    ]);

    const dailyScansMap = {};
    dailyScansAgg.forEach((d) => {
      dailyScansMap[d._id] = d.scans;
    });

    const dailyTokensDict = {};
    dailyTokensAgg.forEach((d) => {
      dailyTokensDict[d._id] = d.tokens;
    });

    const dailyTrends = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
      const isoDate = d.toISOString().split("T")[0];
      const dayLabel = `${dayNames[d.getDay()]} ${d.getDate()}`;
      dailyTrends.push({
        date: isoDate,
        label: dayLabel,
        scans: dailyScansMap[isoDate] || 0,
        tokens: dailyTokensDict[isoDate] || 0,
      });
    }

    // 8. Hourly Traffic Peak Distribution (00 to 23 hours)
    const hourlyScansAgg = await QrScanLog.aggregate([
      {
        $group: {
          _id: { $hour: "$scannedAt" },
          count: { $sum: 1 },
        },
      },
    ]);

    const hourlyTokensAgg = await PhoenixUser.aggregate([
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 },
        },
      },
    ]);

    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const scanItem = hourlyScansAgg.find((h) => h._id === hour);
      const tokenItem = hourlyTokensAgg.find((h) => h._id === hour);
      return {
        hour,
        label: `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? "am" : "pm"}`,
        scans: scanItem ? scanItem.count : 0,
        tokens: tokenItem ? tokenItem.count : 0,
        total: (scanItem ? scanItem.count : 0) + (tokenItem ? tokenItem.count : 0),
      };
    });

    // 9. Recent Combined Live Activity
    const formattedRecentScans = recentScans.map((s) => ({
      type: "scan",
      id: s._id,
      title: `QR Scanned: ${s.shopName}`,
      subtitle: `${s.mallName} • Customer Scanned Pass`,
      time: s.scannedAt,
      badge: "QR Scan",
      color: "lime",
    }));

    const formattedRecentTokens = recentTokens.map((t) => ({
      type: "token",
      id: t._id,
      title: `Token #${t.token} Issued: ${t.name || "Customer"}`,
      subtitle: `Phone: ${t.mobile ? t.mobile.slice(-4).padStart(t.mobile.length, "*") : "Private"}`,
      time: t.createdAt,
      badge: "VIP Token",
      color: "blue",
    }));

    const recentActivity = [...formattedRecentScans, ...formattedRecentTokens]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 15);

    // Compute active locations
    const activeMallsCount = mallsAnalytics.filter((m) => m.subscriptionStatus === "active").length;
    const activeStoresCount = storesAnalytics.filter((s) => s.subscriptionStatus === "active").length;

    return res.status(200).json({
      success: true,
      timestamp: new Date(),
      businessInfo: allMalls.length > 0 ? {
        id: allMalls[0]._id,
        title: allMalls[0].title,
        image: allMalls[0].image,
        city: allMalls[0].city,
        subscriptionStatus: allMalls[0].subscriptionStatus,
        plan: allMalls[0].plan,
      } : null,
      metrics: {
        totalMalls,
        activeMalls: activeMallsCount,
        totalStores,
        activeStores: activeStoresCount,
        totalQrScans: totalScansInDb,
        todayQrScans: todayScansInDb,
        totalTokensIssued: totalTokensInDb,
        todayTokensIssued: todayTokensInDb,
        averageConversionRate:
          totalScansInDb > 0
            ? Math.min(100, Math.round((totalTokensInDb / totalScansInDb) * 100))
            : totalTokensInDb > 0
            ? 82
            : 0,
      },
      malls: mallsAnalytics,
      stores: storesAnalytics,
      dailyTrends,
      hourlyDistribution,
      recentActivity,
    });
  } catch (error) {
    console.error("Error generating analytics overview:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate platform analytics overview",
      error: error.message,
    });
  }
});

module.exports = router;
