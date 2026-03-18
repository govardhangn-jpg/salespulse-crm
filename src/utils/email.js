const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.SMTP_USER) {
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    return { mocked: true };
  }
  const info = await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'SalesPulse CRM <no-reply@salespulse.com>',
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  });
  return info;
};

module.exports = { sendEmail };
