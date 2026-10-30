const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { Mall, Store, User } = require("../models/pg");

// In-memory OTP storage with 10-minute expiry
// Key: email (lowercase), Value: { otp, expiresAt, role, targetType, targetId }
const otpStore = new Map();

/**
 * Configure Nodemailer SMTP Transporter
 */
const getTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : "";
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim().replace(/\s+/g, "") : "";

  if (user && pass) {
    if (host.includes("gmail") || user.endsWith("@gmail.com")) {
      return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return null;
};

/**
 * Helper to send branded luxury HTML email with OTP
 */
const sendOtpEmail = async (toEmail, otpCode, recipientName, roleLabel) => {
  const transporter = getTransporter();

  const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Red Carpet Password Reset</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table width="100%" style="max-width: 520px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 36px 28px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            <tr>
              <td>
                <div style="display: inline-block; background: #111215; color: #ffffff; padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px;">
                  RED CARPET CONCIERGE
                </div>
                
                <h2 style="color: #0f172a; font-size: 24px; font-weight: 900; margin: 0 0 8px 0; letter-spacing: -0.5px;">
                  Password Reset Request
                </h2>
                
                <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
                  Hello <strong>${recipientName || "Portal User"}</strong> (${roleLabel}), we received a request to reset your Red Carpet portal password. Use the verification code below to proceed:
                </p>

                <!-- OTP Code Box -->
                <div style="background: #151618; border-radius: 18px; padding: 20px; margin-bottom: 24px; border: 2px solid #e5fc73;">
                  <span style="color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 6px;">
                    ONE-TIME VERIFICATION CODE
                  </span>
                  <span style="font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #e5fc73; display: inline-block;">
                    ${otpCode}
                  </span>
                </div>

                <p style="color: #64748b; font-size: 12px; margin: 0 0 16px 0;">
                  ⏳ This security code expires in <strong>10 minutes</strong>. If you did not request this password reset, you can safely ignore this email.
                </p>

                <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; color: #94a3b8; font-size: 11px;">
                  Red Carpet VIP Concierge • Enterprise Retail Infrastructure
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  if (transporter) {
    const fromAddress = process.env.SMTP_USER
      ? `"Red Carpet Support" <${process.env.SMTP_USER.trim()}>`
      : process.env.SMTP_FROM || "no-reply@redcarpet.com";

    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `Red Carpet Portal: ${otpCode} is your Password Reset Code`,
      html: emailHtml,
    });
    console.log(`[SMTP] Password reset email dispatched to: ${toEmail}`);
    return true;
  } else {
    // If SMTP not configured, log to server console for testing
    console.log(
      `\n=======================================================\n[SMTP DEV NOTICE] No SMTP credentials configured in .env.\nGenerated Password Reset OTP for ${toEmail}: ${otpCode}\n=======================================================\n`
    );
    return false;
  }
};

/**
 * Route 1: Send OTP to Email
 * Finds user by email in Mall, child Store (menuItems), or User collections.
 */
router.post(["/forgot-password/send-otp", "/check-user"], async (req, res) => {
  const { email, role } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    let account = null;
    let detectedRole = role || "";
    let accountName = "";
    let targetType = "mall"; // "mall", "store", "user"

    // 1. Check in Mall (foods) collection (for Mall Managers)
    const mall = await Mall.findOne({ email: cleanEmail });
    if (mall) {
      account = mall;
      detectedRole = mall.role || "admin";
      accountName = mall.title || "Mall Manager";
      targetType = "mall";
    }

    // 2. Check inside menuItems (for Shop / Store Counter Managers)
    if (!account) {
      const parentMall = await Mall.findOne({ "menuItems.email": cleanEmail });
      if (parentMall) {
        const storeItem = parentMall.menuItems.find(
          (item) => item.email && item.email.toLowerCase() === cleanEmail
        );
        if (storeItem) {
          account = storeItem;
          detectedRole = storeItem.role || "shop admin";
          accountName = `${storeItem.name} (${parentMall.title})`;
          targetType = "store";
        }
      }
    }

    // 3. Check in Store collection
    if (!account) {
      const store = await Store.findOne({ email: cleanEmail });
      if (store) {
        account = store;
        detectedRole = store.role || "shop admin";
        accountName = store.name;
        targetType = "store";
      }
    }

    // 4. Check in User collection (SuperAdmin / Staff)
    if (!account) {
      const user = await User.findOne({ email: cleanEmail });
      if (user) {
        account = user;
        detectedRole = user.role || "superadmin";
        accountName = user.name;
        targetType = "user";
      }
    }

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "No registered account found with this email address.",
      });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store in memory
    otpStore.set(cleanEmail, {
      otp,
      expiresAt,
      role: detectedRole,
      accountName,
      targetType,
      targetId: account._id,
    });

    const roleName =
      detectedRole === "admin"
        ? "Mall Manager"
        : detectedRole === "shop admin" || detectedRole === "shop"
        ? "Store Counter Staff"
        : "SuperAdmin";

    // Dispatch SMTP Email
    let emailSent = false;
    try {
      emailSent = await sendOtpEmail(cleanEmail, otp, accountName, roleName);
    } catch (smtpErr) {
      console.error("[SMTP ERROR]:", smtpErr.message);
      // Still log to console so user can continue testing
      console.log(`[SMTP DEV FALLBACK OTP for ${cleanEmail}]: ${otp}`);
    }

    res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}. Please check your inbox.`,
      email: cleanEmail,
      role: detectedRole,
      accountName,
      // For developer convenience when SMTP is unconfigured in local test:
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Internal server error. Please try again." });
  }
});

/**
 * Route 2: Verify OTP
 */
router.post("/forgot-password/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP code are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    const record = otpStore.get(cleanEmail);

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "No verification code requested or session expired. Please request a new code.",
      });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one.",
      });
    }

    if (record.otp !== cleanOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please check and try again.",
      });
    }

    res.json({
      success: true,
      message: "Code verified successfully! You may now set your new password.",
      email: cleanEmail,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

/**
 * Route 3: Reset Password
 */
router.post(["/forgot-password/reset-password", "/reset-password"], async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  try {
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP if provided
    if (otp) {
      const record = otpStore.get(cleanEmail);
      if (!record || record.otp !== otp.toString().trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification session.",
        });
      }
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

    // 1. Update in User collection (used by auth.js)
    const userUpdate = await User.updateMany(
      { email: emailRegex },
      { $set: { password: hashedPassword } }
    );

    // 2. Update in Mall (foods) collection (for Mall Managers)
    const mallUpdate = await Mall.updateMany(
      { email: emailRegex },
      {
        $set: {
          password: hashedPassword,
          mallconpassword: newPassword,
        },
      }
    );

    // 3. Update inside menuItems (for Store Counter Managers)
    const menuUpdate = await Mall.updateMany(
      { "menuItems.email": emailRegex },
      {
        $set: {
          "menuItems.$[elem].password": hashedPassword,
          "menuItems.$[elem].shopconpassword": newPassword,
        },
      },
      { arrayFilters: [{ "elem.email": emailRegex }] }
    );

    // 4. Update in Store collection
    const storeUpdate = await Store.updateMany(
      { email: emailRegex },
      {
        $set: {
          password: hashedPassword,
          shopconpassword: newPassword,
        },
      }
    );

    const totalModified =
      (userUpdate.matchedCount || userUpdate.n || 0) +
      (mallUpdate.matchedCount || mallUpdate.n || 0) +
      (menuUpdate.matchedCount || menuUpdate.n || 0) +
      (storeUpdate.matchedCount || storeUpdate.n || 0);

    if (totalModified === 0) {
      return res.status(404).json({
        success: false,
        message: "User account could not be found to update password.",
      });
    }

    // Clean up OTP store
    otpStore.delete(cleanEmail);

    console.log(`[PASSWORD RESET] Successfully updated password for: ${cleanEmail}`);

    res.json({
      success: true,
      message: "Your password has been successfully reset. Please sign in with your new credentials.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to reset password. Please try again.",
    });
  }
});

module.exports = router;
