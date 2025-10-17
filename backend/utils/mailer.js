import nodemailer from 'nodemailer';

let transporter;
let isStreamTransport = false;

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  if (host) {
    transporter = nodemailer.createTransport({
      host,
      port: port || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });
    isStreamTransport = false;
    return;
  }

  transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
  isStreamTransport = true;
}

export async function sendMail({ to, subject, text, html, attachments }) {
  if (!transporter) {
    buildTransport();
  }

  const mailOptions = {
    from: process.env.MAIL_FROM || 'no-reply@smartwaste.local',
    to,
    subject,
    text,
    html,
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  if (isStreamTransport) {
    // Log the rendered email so devs can inspect it without an SMTP server.
    console.log('[dev][mailer] email payload ->');
    console.log(info.message.toString());
  }
  return info;
}

