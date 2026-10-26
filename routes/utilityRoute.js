const express = require("express");
const router = express.Router();

// Do not change this, is it used for deployment health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "API is running",
    timestamp: new Date().toISOString(),
    uptime: process?.uptime(),
  });
});

router.get("/version", (req, res) => {
  res.json({
    version: process.env.router_VERSION || "Unknown",
  });
});

module.exports = router;
