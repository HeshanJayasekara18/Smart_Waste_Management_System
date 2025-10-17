import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Configure reusable transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // app password
  },
});

/**
 * Sends an email notification
 * @param {string} to Recipient email
 * @param {string} subject Email subject
 * @param {string} html Email body (HTML)
 */
export const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"SmartWaste System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
  }
};
