import nodemailer from "nodemailer";
import { env } from "../config.js";
import { mainLogger } from "../logger/winston.js";

let transporter;

export const initializeEmailTransporter = async () => {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT) || 587,
    secure: env.SMTP_SECURE === "true",
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });
};

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!transporter) await initializeEmailTransporter();
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM || '"App" <noreply@app.com>',
      to,
      subject,
      text,
      html,
    });
    return info;
  } catch (error) {
    mainLogger.error(`Error sending email: ${error.message}`);
    throw error;
  }
};

export const sendPasswordResetEmail = async (to, resetToken, name) => {
  const resetUrl = `${env.CLIENT_BASE_URL}/reset-password/${resetToken}`;
  return sendEmail({
    to,
    subject: "Password Reset Request",
    text: `Hello ${name},\n\nClick the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#4f46e5;">Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align:center;margin:30px 0;">
        <a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Reset Password</a>
      </div>
      <p style="color:#64748b;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>`,
  });
};
