import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertScanSessionSchema,
  updateScanSessionSchema,
} from "@shared/schema";
import nodemailer from "nodemailer";

// SMTP configuration (fully env-based)
const SMTP_CONFIG = {
  host: "smtp.office365.com",
  port: "587",
  secure: false,
  auth: {
    user: "info@europrofil.se",
    pass: "Vinter2018!",
  },
  headers: {
    "X-Mailer": "System by Selection API",
  },
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 15000,
};

const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SMTP_USER;

const transporter = nodemailer.createTransport(SMTP_CONFIG);

export async function registerRoutes(app: Express): Promise<Server> {
  // Verifiera SMTP vid start
  transporter.verify().then(() => {
    console.log("✅ SMTP-anslutning OK");
  }).catch((err) => {
    console.error("❌ SMTP-anslutning misslyckades:", err);
  });

  // Create scan session
  app.post("/api/scan-sessions", async (req, res) => {
    try {
      const sessionData = insertScanSessionSchema.parse(req.body);
      const session = await storage.createScanSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating scan session:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Get scan session
  app.get("/api/scan-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getScanSession(id);
      if (!session) {
        return res.status(404).json({ message: "Scan session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error getting scan session:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update scan session
  app.patch("/api/scan-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = updateScanSessionSchema.parse(req.body);
      const session = await storage.updateScanSession(id, updates);
      if (!session) {
        return res.status(404).json({ message: "Scan session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error updating scan session:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Send email with scan report
  app.post("/api/scan-sessions/:id/send-email", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const session = await storage.getScanSession(id);
      if (!session) {
        return res.status(404).json({ message: "Scan session not found" });
      }

      const emailContent = generateEmailContent(session);

      const result = await transporter.sendMail({
        from: {
          name: "System by Selections",
          address: FROM_EMAIL,
        },
        to: RECIPIENT_EMAIL,
        subject: `Leveransrapport - ${session.deliveryNoteNumber}`,
        html: emailContent,
        text: emailContent.replace(/<[^>]*>/g, ""), // fallback-textversion
      });

      console.log("✉️  E-post skickad:", result.messageId);

      await storage.updateScanSession(id, { emailSent: "sent" });
      res.json({ message: "Email sent successfully" });

    } catch (error) {
      console.error("Error sending email:", error);
      await storage.updateScanSession(id, { emailSent: "failed" });
      res.status(500).json({
        message: "Fel vid skickning av e-post. Kontrollera konfiguration och anslutning.",
      });
    }
  });

  // Test SMTP connection
  app.post("/api/test-smtp", async (req, res) => {
    try {
      await transporter.verify();
      res.json({
        success: true,
        message: "SMTP-anslutning lyckades",
        config: {
          host: SMTP_CONFIG.host,
          port: SMTP_CONFIG.port,
          user: SMTP_CONFIG.auth.user?.replace(/(.{3}).+(@.+)/, "$1***$2"),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: `SMTP-test misslyckades: ${error.message}`,
        code: error.code,
      });
    }
  });

  return createServer(app);
}

// Generate HTML for scan session email
function generateEmailContent(session: any): string {
  const barcodesList = session.barcodes.map(
    (barcode: string, index: number) =>
      `<tr><td>${index + 1}</td><td>${barcode}</td></tr>`
  ).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><style>
      body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
      .container { background: white; max-width: 600px; margin: auto; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 30px -30px; }
      .header h1 { margin: 0; font-size: 24px; }
      .info-section h2 { color: #1d4ed8; font-size: 18px; margin-bottom: 10px; }
      .info-item { margin-bottom: 10px; }
      .info-label { font-weight: bold; color: #374151; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
      th { background-color: #f9fafb; color: #374151; }
      .summary { background: #eff6ff; padding: 15px; border-radius: 6px; margin-top: 20px; font-weight: bold; }
      .footer { margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #6b7280; }
    </style></head>
    <body><div class="container">
      <div class="header"><h1>📦 Leveransrapport</h1></div>
      <div class="info-section">
        <h2>Leveransinformation</h2>
        <div class="info-item"><span class="info-label">Följesedelnummer:</span> ${session.deliveryNoteNumber}</div>
        <div class="info-item"><span class="info-label">Skanningsdatum:</span> ${new Date(session.createdAt).toLocaleDateString("sv-SE")}</div>
        <div class="info-item"><span class="info-label">Skanningtid:</span> ${new Date(session.createdAt).toLocaleTimeString("sv-SE")}</div>
      </div>
      <div class="info-section">
        <h2>Skannade streckkoder</h2>
        <table>
          <thead><tr><th>Nr</th><th>Streckkod</th></tr></thead>
          <tbody>${barcodesList}</tbody>
        </table>
        <div class="summary">Totalt antal skannade artiklar: ${session.barcodes.length}</div>
      </div>
      <div class="footer">
        <p>Denna rapport genererades automatiskt av streckkodsskannersystemet.</p>
        <p>${new Date().toLocaleDateString("sv-SE")} ${new Date().toLocaleTimeString("sv-SE")}</p>
      </div>
    </div></body>
    </html>
  `;
}
