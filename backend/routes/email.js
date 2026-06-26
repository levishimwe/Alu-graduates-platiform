const express = require('express');
const auth = require('../middleware/auth');
const { User, EmailMessage } = require('../models');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/auth/google/callback'
);

router.get('/auth/gmail', auth, (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/userinfo.email'],
      prompt: 'consent',
      state: req.user.userId
    });

    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate auth URL', message: error.message });
  }
});

router.post('/auth/gmail/callback', auth, async (req, res) => {
  try {
    const { code, error, error_description } = req.body;

    if (error) {
      return res.status(error === 'access_denied' ? 403 : 400).json({
        error: error === 'access_denied' ? 'access_denied' : 'oauth_error',
        message: error_description || 'OAuth authentication failed',
        userMessage: error === 'access_denied'
          ? 'Gmail access is currently restricted. Please contact the administrator to be added as a test user.'
          : 'Failed to connect to Gmail. Please try again.'
      });
    }

    if (!code) {
      return res.status(400).json({ error: 'missing_code', message: 'Authorization code is required', userMessage: 'Invalid authentication response. Please try again.' });
    }

    const { tokens } = await oauth2Client.getToken(code);
    await User.updateOne(
      { _id: req.user.userId },
      { $set: { gmailAccessToken: tokens.access_token, gmailRefreshToken: tokens.refresh_token } }
    );

    res.json({ message: 'Gmail authentication successful', success: true });
  } catch (error) {
    if (error.message.includes('invalid_grant')) {
      return res.status(400).json({ error: 'invalid_grant', message: 'Authorization code has expired or is invalid', userMessage: 'Authentication expired. Please try connecting Gmail again.' });
    }
    if (error.message.includes('access_denied')) {
      return res.status(403).json({ error: 'access_denied', message: 'Access denied by Google OAuth', userMessage: 'Gmail access is currently restricted. Please contact the administrator.' });
    }
    res.status(500).json({ error: 'authentication_failed', message: error.message, userMessage: 'Failed to connect Gmail. Please try again later.' });
  }
});

router.post('/send', auth, async (req, res) => {
  try {
    const { to, subject, message, recipientName } = req.body;
    if (!to || !subject || !message) {
      return res.status(400).json({ error: 'missing_fields', message: 'Recipient, subject, and message are required', userMessage: 'Please fill in all required fields.' });
    }

    const user = await User.findById(req.user.userId).lean();
    if (!user || !user.gmailAccessToken) {
      return res.status(400).json({ error: 'gmail_not_connected', message: 'Gmail not connected', userMessage: 'Please connect your Gmail account first' });
    }

    oauth2Client.setCredentials({ access_token: user.gmailAccessToken, refresh_token: user.gmailRefreshToken });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: user.email,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: user.gmailRefreshToken,
        accessToken: user.gmailAccessToken
      }
    });

    await transporter.verify();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">ALU Platform</h1>
          <p style="color: white; margin: 5px 0;">Message from ${user.email}</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">Hello ${recipientName || 'there'},</p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">${message.replace(/\n/g, '<br>')}</div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This message was sent through the ALU Platform messaging system.</p>
        </div>
      </div>
    `;

    const result = await transporter.sendMail({ from: user.email, to, subject, html: emailHtml, text: `Hello ${recipientName || 'there'},\n\n${message}\n\nSent via ALU Platform from ${user.email}` });

    await EmailMessage.create({ senderId: req.user.userId, recipientEmail: to, subject, content: message, status: 'sent', sentAt: new Date() });

    res.json({ message: 'Email sent successfully', messageId: result.messageId, success: true });
  } catch (error) {
    if (error.message.includes('Invalid login')) {
      return res.status(401).json({ error: 'invalid_credentials', message: 'Gmail authentication expired', userMessage: 'Your Gmail connection has expired. Please reconnect your Gmail account.' });
    }
    if (error.message.includes('Daily sending quota exceeded')) {
      return res.status(429).json({ error: 'quota_exceeded', message: 'Daily email sending limit reached', userMessage: 'You have reached your daily email sending limit. Please try again tomorrow.' });
    }
    res.status(500).json({ error: 'send_failed', message: error.message, userMessage: 'Failed to send email. Please try again.' });
  }
});

router.post('/send-simple', auth, async (req, res) => {
  try {
    const { recipientEmail, subject, content } = req.body;
    if (!recipientEmail || !subject || !content) {
      return res.status(400).json({ error: 'missing_fields', message: 'Recipient email, subject, and content are required', userMessage: 'Please fill in all required fields.' });
    }

    const sender = await User.findById(req.user.userId).lean();
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ error: 'email_not_configured', message: 'Email service is not configured on the server', userMessage: 'Email service is currently unavailable. Please try again later.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
    });

    await transporter.verify();

    const mailOptions = {
      from: `"${sender.firstName} ${sender.lastName} via ALU Platform" <${process.env.GMAIL_USER}>`,
      to: recipientEmail,
      subject,
      replyTo: sender.email,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">ALU Platform</h1>
            <p style="color: white; margin: 5px 0;">Message via ALU Platform</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>From:</strong> ${sender.firstName} ${sender.lastName} (${sender.email})</p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>Subject:</strong> ${subject}</p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">${content.replace(/\n/g, '<br>')}</div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px;">This message was sent via ALU Platform. <a href="mailto:${sender.email}" style="color: #667eea;">Reply directly to ${sender.firstName}</a></p>
          </div>
        </div>
      `,
      text: `From: ${sender.firstName} ${sender.lastName} (${sender.email})\nSubject: ${subject}\n\n${content}\n\n---\nThis message was sent via ALU Platform.\nReply directly to: ${sender.email}`
    };

    const result = await transporter.sendMail(mailOptions);

    await EmailMessage.create({ senderId: req.user.userId, recipientEmail, subject, content, status: 'sent', sentAt: new Date() });

    res.json({ message: 'Email sent successfully', method: 'app_password', messageId: result.messageId, success: true });
  } catch (error) {
    if (error.message.includes('Invalid login')) {
      return res.status(401).json({ error: 'invalid_credentials', message: 'Gmail app password is invalid', userMessage: 'Email service authentication failed. Please contact the administrator.' });
    }
    res.status(500).json({ error: 'Failed to send email', message: error.message, userMessage: 'Failed to send email. Please try again later.' });
  }
});

router.get('/sent', auth, async (req, res) => {
  try {
    const sentEmails = await EmailMessage.find({ senderId: req.user.userId }).sort({ sentAt: -1 }).limit(50).lean();
    res.json({ emails: sentEmails, total: sentEmails.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sent emails', message: error.message });
  }
});

router.get('/gmail/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).lean();
    res.json({ isConnected: !!user?.gmailAccessToken });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check Gmail status', message: error.message });
  }
});

router.post('/gmail/disconnect', auth, async (req, res) => {
  try {
    await User.updateOne({ _id: req.user.userId }, { $unset: { gmailAccessToken: '', gmailRefreshToken: '' } });
    res.json({ message: 'Gmail disconnected successfully', success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect Gmail', message: error.message });
  }
});

module.exports = router;