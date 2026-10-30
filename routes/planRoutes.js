const express = require("express");
const router = express.Router();
const prisma = require("../prisma/client");
const jwt = require("jsonwebtoken");

/**
 * Superadmin Authorization Middleware
 */
const requireSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key");

    if (decoded.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: Only SuperAdmin can manage subscription plans",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token", error: error.message });
  }
};

// 1. GET /api/plans - List all subscription plans
router.get("/", async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { price: "asc" },
      include: {
        _count: {
          select: { malls: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ success: false, message: "Error fetching plans", error: error.message });
  }
});

// 2. GET /api/plans/:id - Get a specific plan
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await prisma.plan.findFirst({
      where: {
        OR: [{ id }, { tier: id.toLowerCase() }],
      },
      include: {
        malls: {
          select: { id: true, title: true, city: true, email: true },
        },
      },
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    res.status(200).json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching plan details", error: error.message });
  }
});

// 3. POST /api/plans - Create a new plan (SuperAdmin Only)
router.post("/", requireSuperAdmin, async (req, res) => {
  try {
    const {
      name,
      tier,
      description,
      price,
      currency,
      billingCycle,
      maxStores,
      features,
      isActive,
      isCustom,
    } = req.body;

    if (!name || !tier) {
      return res.status(400).json({
        success: false,
        message: "Plan name and tier (unique identifier) are required",
      });
    }

    const cleanTier = tier.trim().toLowerCase();
    const existing = await prisma.plan.findUnique({ where: { tier: cleanTier } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Plan with tier '${cleanTier}' already exists`,
      });
    }

    const newPlan = await prisma.plan.create({
      data: {
        name,
        tier: cleanTier,
        description: description || "",
        price: Number(price) || 0,
        currency: currency || "INR",
        billingCycle: billingCycle || "monthly",
        maxStores: Number(maxStores) || 10,
        features: features || [
          "Unlimited VIP Passes",
          "Digital TV Signage",
          "Real-time Standee QR",
        ],
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        isCustom: Boolean(isCustom),
      },
    });

    res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      plan: newPlan,
    });
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({ success: false, message: "Error creating plan", error: error.message });
  }
});

// 4. PUT /api/plans/:id - Update an existing plan (SuperAdmin Only)
router.put("/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      tier,
      description,
      price,
      currency,
      billingCycle,
      maxStores,
      features,
      isActive,
      isCustom,
    } = req.body;

    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const updated = await prisma.plan.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(tier && { tier: tier.trim().toLowerCase() }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(currency && { currency }),
        ...(billingCycle && { billingCycle }),
        ...(maxStores !== undefined && { maxStores: Number(maxStores) }),
        ...(features && { features }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(isCustom !== undefined && { isCustom: Boolean(isCustom) }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      plan: updated,
    });
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ success: false, message: "Error updating plan", error: error.message });
  }
});

// 5. DELETE /api/plans/:id - Delete a plan (SuperAdmin Only)
router.delete("/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.plan.findUnique({
      where: { id },
      include: { _count: { select: { malls: true } } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    if (existing._count.malls > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan: ${existing._count.malls} active mall(s) are currently assigned to this plan. Reassign them first.`,
      });
    }

    await prisma.plan.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({ success: false, message: "Error deleting plan", error: error.message });
  }
});

// 6. POST /api/plans/assign - Assign / Upgrade a Mall to a specific plan (SuperAdmin Only)
router.post("/assign", requireSuperAdmin, async (req, res) => {
  try {
    const { mallId, planId, tier, expiresAt } = req.body;

    if (!mallId || (!planId && !tier)) {
      return res.status(400).json({
        success: false,
        message: "mallId and either planId or tier are required",
      });
    }

    const mall = await prisma.mall.findUnique({ where: { id: mallId } });
    if (!mall) {
      return res.status(404).json({ success: false, message: "Mall not found" });
    }

    const plan = await prisma.plan.findFirst({
      where: {
        OR: [{ id: planId || "" }, { tier: (tier || "").toLowerCase() }],
      },
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: "Target plan not found" });
    }

    const updatedMall = await prisma.mall.update({
      where: { id: mallId },
      data: {
        planId: plan.id,
        plan: {
          name: plan.name,
          tier: plan.tier,
          maxStores: plan.maxStores,
          price: plan.price,
          status: "active",
          expiresAt: expiresAt || null,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `Mall '${mall.title}' successfully assigned to '${plan.name}' tier`,
      mall: updatedMall,
    });
  } catch (error) {
    console.error("Error assigning plan:", error);
    res.status(500).json({ success: false, message: "Error assigning plan", error: error.message });
  }
});

module.exports = router;

