const express = require('express');
const router  = express.Router();
const nodemailer = require('nodemailer');
const multer  = require('multer');
const { protect } = require('../middleware/auth');

// ── In-memory storage for attachments (no disk needed) ──
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }, // 10MB per file, 5 files max
});

// ── Create transporter from env vars ──────────────────
function makeTransporter(fromEmail) {
  // Use SMTP env vars; falls back to Gmail OAuth2 if set
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || fromEmail,
      pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
    },
  });
}

// POST /api/email/send
router.post('/send', protect, upload.array('attachments', 5), async (req, res) => {
  try {
    const { to, cc, from, subject, body, quotationRef } = req.body;

    if (!to || !subject)
      return res.status(400).json({ status:'fail', message:'To and Subject are required.' });

    // Use logged-in user email as sender, or env default
    const fromAddr = process.env.SMTP_FROM
      || `${req.user.name} <${process.env.SMTP_USER || 'bopanna@magmaticndt.com'}>`;

    const transporter = makeTransporter(req.user.email);

    // Build mail options
    const mailOptions = {
      from:    fromAddr,
      to,
      subject,
      text:    body,
      html:    body.replace(/\n/g, '<br>'),
      replyTo: req.user.email, // reply goes to the logged-in user
    };
    if (cc) mailOptions.cc = cc;

    // Add attachments from multipart upload
    if (req.files && req.files.length > 0) {
      mailOptions.attachments = req.files.map(f => ({
        filename:    f.originalname,
        content:     f.buffer,
        contentType: f.mimetype,
      }));
    }

    await transporter.sendMail(mailOptions);

    res.json({
      status:  'success',
      message: `Email sent to ${to}${req.files?.length ? ` with ${req.files.length} attachment(s)` : ''}`,
    });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({
      status:  'error',
      message: err.message || 'Failed to send email. Check SMTP settings.',
    });
  }
});

module.exports = router;
