// notifications/EmailNotification.js
import nodemailer from "nodemailer";
import BaseNotification from "./BaseNotification.js";
import dotenv from "dotenv";

dotenv.config();

export default class EmailNotification extends BaseNotification {
  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    this.from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  }

  async sendNotification({ title, message, recipient, meta = {} }) {
    if (!recipient) {
      console.warn("EmailNotification: no recipient specified");
      return;
    }

    const mailOptions = {
      from: this.from,
      to: recipient,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif">
          <h3>${title}</h3>
          <p>${message}</p>
          <small style="color:#777">${meta.footer || ""}</small>
        </div>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.info(`📧 Email sent to ${recipient}`);
    } catch (err) {
      console.error("❌ EmailNotification error:", err.message);
    }
  }
}
