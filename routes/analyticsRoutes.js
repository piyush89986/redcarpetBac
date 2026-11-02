const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");

/**
 * Helper: Resolve shop or mall details given an ID
 */
async function resolveLocation(targetId) {
  if (!targetId) {
    return {
      shopName: "General QR Location",
      mallName: "Red Carpet Platform",
      mallId: targetId || "",
      isStore: false,
    };
  }

  // 1. Is it a Mall?
  const mall = await prisma.mall.findUnique({ where: { id: String(targetId) } });
  if (mall) {
    return {
      shopName: mall.title || "Mall Complex",
      mallName: mall.title || "Mall Complex",
      mallId: mall.id,
      isStore: false,
    };
  }

  // 2. Is it a Store inside a Mall?
  const store = await prisma.store.findUnique({
    where: { id: String(targetId) },
    include: { mall: true },
  });

  if (store) {
    return {
      shopName: store.name || "Store Counter",
      mallName: store.mall?.title || "Mall Complex",
      mallId: store.mallId,
      isStore: true,
    };
  }

  return {
    shopName: "Store / Counter " + String(targetId).slice(-4),
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

    const scanLog = await prisma.qrScanLog.create({
      data: {
        shopId: String(shopId),
        mallId: String(mallId || shopId),
        shopName,
        mallName,
        isStore,
        scanType: scanType || "qr_scan",
        ip: clientIp,
        userAgent,
        scannedAt: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "QR scan logged successfully",
      data: {
        id: scanLog.id,
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
 * Provides platform and complex analytics
 */
router.get("/overview", async (req, res) => {
  try {
    const { mallId, shopId } = req.query;
    const targetMallId = mallId || shopId;

    let targetMall = null;
    if (targetMallId) {
      targetMall = await prisma.mall.findUnique({
        where: { id: String(targetMallId) },
        include: { menuItems: true },
      });

      if (!targetMall) {
        const store = await prisma.store.findUnique({
          where: { id: String(targetMallId) },
          include: { mall: { include: { menuItems: true } } },
        });
        if (store?.mall) targetMall = store.mall;
      }
    }

    if (!targetMall) {
      targetMall = await prisma.mall.findFirst({
        include: { menuItems: true },
      });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const scanWhere = targetMall ? { mallId: targetMall.id } : {};
    const tokenWhere = targetMall
      ? {
          shopid: {
            in: [targetMall.id, ...targetMall.menuItems.map((m) => m.id)],
          },
        }
      : {};

    const [
      totalScans,
      todayScans,
      totalTokens,
      todayTokens,
      recentScans,
      recentTokens,
    ] = await Promise.all([
      prisma.qrScanLog.count({ where: scanWhere }),
      prisma.qrScanLog.count({ where: { ...scanWhere, scannedAt: { gte: startOfToday } } }),
      prisma.queueToken.count({ where: tokenWhere }),
      prisma.queueToken.count({ where: { ...tokenWhere, createdAt: { gte: startOfToday } } }),
      prisma.qrScanLog.findMany({
        where: scanWhere,
        orderBy: { scannedAt: "desc" },
        take: 15,
      }),
      prisma.queueToken.findMany({
        where: tokenWhere,
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

    const formattedRecentScans = recentScans.map((s) => ({
      type: "scan",
      id: s.id,
      title: `QR Scanned: ${s.shopName}`,
      subtitle: `${s.mallName} • Customer Scanned Pass`,
      time: s.scannedAt,
      badge: "QR Scan",
      color: "lime",
    }));

    const formattedRecentTokens = recentTokens.map((t) => ({
      type: "token",
      id: t.id,
      title: `Token #${t.token} Issued: ${t.name || "Customer"}`,
      subtitle: `Phone: ${t.mobile ? t.mobile.slice(-4).padStart(t.mobile.length, "*") : "Private"}`,
      time: t.createdAt,
      badge: "VIP Token",
      color: "blue",
    }));

    const recentActivity = [...formattedRecentScans, ...formattedRecentTokens]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 15);

    const storesAnalytics = targetMall
      ? targetMall.menuItems.map((s) => ({
          id: s.id,
          _id: s.id,
          name: s.name,
          category: s.category,
          mallTitle: targetMall.title,
          subscriptionStatus: s.subscriptionStatus,
          totalScans: 0,
          todayScans: 0,
          totalTokens: 0,
          todayTokens: 0,
          conversionRate: "0.0",
        }))
      : [];

    return res.status(200).json({
      success: true,
      timestamp: new Date(),
      businessInfo: targetMall
        ? {
            id: targetMall.id,
            title: targetMall.title,
            image: targetMall.image,
            city: targetMall.city,
            totalStores: targetMall.menuItems?.length || 0,
          }
        : null,
      summary: {
        totalMalls: targetMall ? 1 : 0,
        activeMalls: targetMall?.subscriptionStatus === "active" ? 1 : 0,
        totalStores: storesAnalytics.length,
        activeStores: storesAnalytics.filter((s) => s.subscriptionStatus === "active").length,
        totalScans,
        todayScans,
        totalTokens,
        todayTokens,
        overallConversionRate: totalScans > 0 ? ((totalTokens / totalScans) * 100).toFixed(1) : "0.0",
        todayConversionRate: todayScans > 0 ? ((todayTokens / todayScans) * 100).toFixed(1) : "0.0",
      },
      mallsAnalytics: targetMall
        ? [
            {
              id: targetMall.id,
              _id: targetMall.id,
              title: targetMall.title,
              city: targetMall.city,
              subscriptionStatus: targetMall.subscriptionStatus,
              totalStores: storesAnalytics.length,
              totalScans,
              todayScans,
              totalTokens,
              todayTokens,
              conversionRate: totalScans > 0 ? ((totalTokens / totalScans) * 100).toFixed(1) : "0.0",
            },
          ]
        : [],
      storesAnalytics,
      hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        label: `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? "am" : "pm"}`,
        scans: 0,
        tokens: 0,
        total: 0,
      })),
      recentActivity,
    });
  } catch (error) {
    console.error("Error generating analytics:", error);
    res.status(500).json({ success: false, message: "Error generating analytics overview", error: error.message });
  }
});

module.exports = router;
