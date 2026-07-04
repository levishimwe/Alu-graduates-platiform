const express = require("express");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const { auth } = require("../middleware/auth");
const User = require("../models/User");
const EmailMessage = require("../models/EmailMessage");

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Get Gmail OAuth URL
router.get("/auth/gmail", auth, (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      prompt: "consent",
      state: req.user.id,
    });
    
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate auth URL", message: error.message });
  }
});

// Gmail OAuth callback
router.post("/auth/gmail/callback", auth, async (req, res) => {
  try {
    const { code, error, error_description } = req.body;

    if (error) {
      return res.status(error === "access_denied" ? 403 : 400).json({
        error,
        message: error_description || "OAuth authentication failed",
        userMessage:
          error === "access_denied"
            ? "Gmail access is restricted. Please contact the administrator."
            : "Failed to connect Gmail. Please try again.",
      });
    }

    if (!code) {
      return res.status(400).json({ error: "missing_code", message: "Authorization code is required" });
    }

    const { tokens } = await oauth2Client.getToken(code);
    await User.findByIdAndUpdate(req.user.id, {
      gmailAccessToken: tokens.access_token,
      gmailRefreshToken: tokens.refresh_token,
    });

    res.json({ message: "Gmail connected successfully", success: true });
  } catch (error) {
    if (error.message.includes("invalid_grant")) {
      return res.status(400).json({ error: "invalid_grant", userMessage: "Authentication expired. Please try again." });
    }
    res.status(500).json({ error: "authentication_failed", message: error.message });
  }
});

// Send email via OAuth Gmail
router.post("/send", auth, async (req, res) => {
  try {
    const { to, subject, message, recipientName } = req.body;
    if (!to || !subject || !message) {
      return res.status(400).json({ error: "missing_fields", message: "Recipient, subject, and message are required" });
    }

    const user = await User.findById(req.user.id).lean();
    if (!user?.gmailAccessToken) {
      return res.status(400).json({ error: "gmail_not_connected", userMessage: "Please connect your Gmail account first." });
    }

    oauth2Client.setCredentials({
      access_token: user.gmailAccessToken,
      refresh_token: user.gmailRefreshToken,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: user.email,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: user.gmailRefreshToken,
        accessToken: user.gmailAccessToken,
      },
    });


    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">ALU Platform</h1>
          <p style="color: white; margin: 5px 0;">Message from ${user.email}</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Hello ${recipientName || "there"},</p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
            ${message.replace(/\n/g, "<br>")}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">Sent via ALU Platform.</p>
        </div>
      </div>
    `;

    const result = await transporter.sendMail({
      from: user.email,
      to,
      subject,
      html: emailHtml,
      text: `Hello ${recipientName || "there"},\n\n${message}\n\nSent via ALU Platform.`,
    });

    await EmailMessage.create({
      senderId: req.user.id,
      recipientEmail: to,
      subject,
      content: message,
      status: "sent",
      sentAt: new Date(),
    });

    res.json({ message: "Email sent successfully", messageId: result.messageId, success: true });
  } catch (error) {
    if (error.message.includes("Invalid login")) {
      return res.status(401).json({ error: "invalid_credentials", userMessage: "Gmail connection expired. Please reconnect." });
    }
    res.status(500).json({ error: "send_failed", message: error.message });
  }
});

// Send email via App Password (simpler method)
router.post("/send-simple", auth, async (req, res) => {
  try {
    const { recipientEmail, subject, content } = req.body;
    if (!recipientEmail || !subject || !content) {
      return res.status(400).json({ error: "missing_fields", message: "Recipient, subject, and content are required" });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ error: "email_not_configured", userMessage: "Email service is currently unavailable." });
    }

    const sender = await User.findById(req.user.id).lean();
    if (!sender) return res.status(404).json({ error: "Sender not found" });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });

    const result = await transporter.sendMail({
      from: `"${sender.firstName} ${sender.lastName} via ALU Platform" <${process.env.GMAIL_USER}>`,
      to: recipientEmail,
      subject,
      replyTo: sender.email,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">ALU Platform</h1>

          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p><strong>From:</strong> ${sender.firstName} ${sender.lastName} (${sender.email})</p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
              ${content.replace(/\n/g, "<br>")}
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
              Sent via ALU Platform. <a href="mailto:${sender.email}">Reply to ${sender.firstName}</a>
            </p>
          </div>
        </div>
      `,
      text: `From: ${sender.firstName} ${sender.lastName} (${sender.email})\n\n${content}\n\nSent via ALU Platform.`,
    });

    await EmailMessage.create({
      senderId: req.user.id,
      recipientEmail,
      subject,
      content,
      status: "sent",
      sentAt: new Date(),
    });

    res.json({ message: "Email sent successfully", messageId: result.messageId, success: true });
  } catch (error) {
    res.status(500).json({ error: "send_failed", message: error.message });
  }
});

// Get sent emails
router.get("/sent", auth, async (req, res) => {
  try {
    const emails = await EmailMessage.find({ senderId: req.user.id })
      .sort({ sentAt: -1 })
      .limit(50);
    res.json({ emails, total: emails.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sent emails", message: error.message });
  }
});

// Check Gmail connection status
router.get("/gmail/status", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    res.json({ isConnected: !!user?.gmailAccessToken });
  } catch (error) {
    res.status(500).json({ error: "Failed to check Gmail status", message: error.message });
  }
});

// Disconnect Gmail
router.post("/gmail/disconnect", auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $unset: { gmailAccessToken: "", gmailRefreshToken: "" },
    });
    res.json({ message: "Gmail disconnected successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to disconnect Gmail", message: error.message });
  }
});

module.exports = router;