import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, "../templates/emails");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const LOGO_URL = process.env.FRONTEND_URL
  ? `${process.env.FRONTEND_URL}/logo/furrcircle_light_logo.png`
  : "https://furrcircle.com/logo/furrcircle_light_logo.png";

function renderTemplate(templateName: string, vars: Record<string, string>): string {
  const filePath = path.join(TEMPLATES_DIR, `${templateName}.html`);
  let html = fs.readFileSync(filePath, "utf-8");
  const allVars = { ...vars, LOGO_URL };
  for (const [key, value] of Object.entries(allVars)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }
  return html;
}

export async function sendEmail(to: string, subject: string, templateName: string, vars: Record<string, string>): Promise<void> {
  try {
    const html = renderTemplate(templateName, vars);
    await transporter.sendMail({
      from: `"FurrCircle" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    // Log but never throw — email failure should not break the main request
    console.error(`[EMAIL] Failed to send "${templateName}" to ${to}:`, err);
  }
}
