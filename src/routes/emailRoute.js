const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');

// ── Use built-in modules only — no multer needed ──
// Files are sent as base64 in JSON body from the frontend

function makeTransporter() {
  // Lazy-require nodemailer only when needed
  const nodemailer = require('nodemailer');
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
    },
  });
}

// POST /api/email/send
// Body: { to, cc, from, subject, body, attachments: [{name, type, data(base64)}] }
router.post('/send', protect, express.json({ limit: '25mb' }), async (req, res) => {
  try {
    const { to, cc, subject, body, attachments = [] } = req.body;

    if (!to || !subject)
      return res.status(400).json({ status: 'fail', message: 'To and Subject are required.' });

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS)
      return res.status(503).json({
        status: 'fail',
        message: 'Email not configured. Please set SMTP_USER and SMTP_PASS in environment variables.',
      });

    const fromAddr = process.env.SMTP_FROM
      || `${req.user.name} <${process.env.SMTP_USER}>`;

    const transporter = makeTransporter();

    const mailOptions = {
      from:    fromAddr,
      to,
      subject,
      text:    body,
      html:    body.replace(/\n/g, '<br>'),
      replyTo: req.user.email,
    };
    if (cc) mailOptions.cc = cc;

    // Attachments sent as base64 from frontend
    if (attachments.length > 0) {
      mailOptions.attachments = attachments.map(a => ({
        filename:    a.name,
        content:     Buffer.from(a.data, 'base64'),
        contentType: a.type || 'application/octet-stream',
      }));
    }

    await transporter.sendMail(mailOptions);

    res.json({
      status:  'success',
      message: `Email sent to ${to}${attachments.length ? ` with ${attachments.length} attachment(s)` : ''}`,
    });
  } catch (err) {
    console.error('[Email] Send error:', err.message);
    res.status(500).json({
      status:  'error',
      message: err.message || 'Failed to send email. Check SMTP settings on Render.',
    });
  }
});

module.exports = router;
