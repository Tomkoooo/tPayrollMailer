import nodemailer from "nodemailer";
import { sendEmailViaGraph } from "./graph";

export type EmailProvider = "smtp" | "graph";

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  attachmentName: string;
  attachmentContent: Buffer;
}

/**
 * Unified email sending interface supporting both SMTP and Microsoft Graph
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const provider =
    (process.env.EMAIL_PROVIDER as EmailProvider) || "smtp";
  const fromEmail = process.env.FINANCE_EMAIL || "penzugy@company.hu";

  if (provider === "graph") {
    try {
      await sendEmailViaGraph({
        ...options,
        fromEmail,
      });
      return;
    } catch (error) {
      console.error("Graph email failed, falling back to SMTP:", error);
      // Fall through to SMTP
    }
  }

  // SMTP implementation
  await sendEmailViaSMTP({ ...options, fromEmail });
}

async function sendEmailViaSMTP(
  options: EmailOptions & { fromEmail: string }
): Promise<void> {
  const { to, subject, body, attachmentName, attachmentContent, fromEmail } =
    options;

  const smtpHost = process.env.SMTP_HOST || "localhost";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  
  // Port 465 usually implies implicit SSL/TLS
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: smtpUser && smtpPass
      ? {
          user: smtpUser,
          pass: smtpPass,
        }
      : undefined,
  });

  try {
    await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html: body,
      attachments: [
        {
          filename: attachmentName,
          content: attachmentContent,
          contentType: "application/pdf",
        },
      ],
    });
  } catch (error) {
    console.error("Error sending email via SMTP:", error);
    throw new Error("Failed to send email via SMTP");
  }
}
