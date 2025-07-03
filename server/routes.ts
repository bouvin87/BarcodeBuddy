import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertScanSessionSchema,
  updateScanSessionSchema,
} from "@shared/schema";
import { z } from "zod";
import nodemailer from "nodemailer";

// SMTP configuration with timeouts and better error handling
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.office365.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // Use STARTTLS
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER || "info@europrofil.se",
    pass: process.env.SMTP_PASS || "Vinter2018!",
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 5000, // 5 seconds
  socketTimeout: 15000, // 15 seconds
};

const RECIPIENT_EMAIL =
  process.env.RECIPIENT_EMAIL || "christian.bouvin@europrofil.se";

const transporter = nodemailer.createTransport(SMTP_CONFIG);

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Update scan session (add barcodes)
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
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getScanSession(id);

      if (!session) {
        return res.status(404).json({ message: "Scan session not found" });
      }

      // Generate email content
      const emailContent = generateEmailContent(session);

      // Send email using the global transporter
      await transporter.sendMail({
        from: SMTP_CONFIG.auth.user,
        to: RECIPIENT_EMAIL,
        subject: `Leveransrapport - ${session.deliveryNoteNumber}`,
        html: emailContent,
      });

      // Update session status
      await storage.updateScanSession(id, { emailSent: "sent" });

      res.json({ message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);

      // Update session status to failed
      const id = parseInt(req.params.id);
      await storage.updateScanSession(id, { emailSent: "failed" });

      res.status(500).json({
        message: "Fel vid skickning av e-post. Kontrollera internetanslutningen och försök igen.",
      });
    }
  });

  // Test SMTP connection endpoint
  app.post("/api/test-smtp", async (req, res) => {
    try {
      console.log("Testing SMTP connection...");
      console.log(`Config: ${SMTP_CONFIG.host}:${SMTP_CONFIG.port}`);
      console.log(`User: ${SMTP_CONFIG.auth.user}`);
      
      const testTransporter = nodemailer.createTransport({
        ...SMTP_CONFIG,
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 8000
      });
      
      console.log("Attempting SMTP verify...");
      const verified = await testTransporter.verify();
      console.log("SMTP verification result:", verified);
      
      res.json({ 
        success: true, 
        message: "SMTP-anslutning lyckades",
        config: {
          host: SMTP_CONFIG.host,
          port: SMTP_CONFIG.port,
          user: SMTP_CONFIG.auth.user.substring(0, 3) + "***"
        }
      });
    } catch (error: any) {
      console.error("SMTP test failed:", error);
      res.status(500).json({ 
        success: false, 
        message: `SMTP-test misslyckades: ${error.message}`,
        code: error.code
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateEmailContent(session: any): string {
  const barcodesList = session.barcodes
    .map(
      (barcode: string, index: number) =>
        `<tr><td>${index + 1}</td><td>${barcode}</td></tr>`,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 30px -30px; }
        .header h1 { margin: 0; font-size: 24px; }
        .info-section { margin-bottom: 30px; }
        .info-section h2 { color: #1d4ed8; font-size: 18px; margin-bottom: 10px; }
        .info-item { margin-bottom: 10px; }
        .info-label { font-weight: bold; color: #374151; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #f9fafb; font-weight: bold; color: #374151; }
        .summary { background-color: #eff6ff; padding: 15px; border-radius: 6px; margin-top: 20px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Leveransrapport</h1>
        </div>
        
        <div class="info-section">
          <h2>Leveransinformation</h2>
          <div class="info-item">
            <span class="info-label">Följesedelnummer:</span> ${session.deliveryNoteNumber}
          </div>
          <div class="info-item">
            <span class="info-label">Skanningsdatum:</span> ${new Date(session.createdAt).toLocaleDateString("sv-SE")}
          </div>
          <div class="info-item">
            <span class="info-label">Skanningtid:</span> ${new Date(session.createdAt).toLocaleTimeString("sv-SE")}
          </div>
        </div>

        <div class="info-section">
          <h2>Skannade streckkoder</h2>
          <table>
            <thead>
              <tr>
                <th>Nr</th>
                <th>Streckkod</th>
              </tr>
            </thead>
            <tbody>
              ${barcodesList}
            </tbody>
          </table>
          
          <div class="summary">
            <strong>Totalt antal skannade artiklar: ${session.barcodes.length}</strong>
          </div>
        </div>

        <div class="footer">
          <p>Denna rapport genererades automatiskt av streckkodsskannersystemet.</p>
          <p>Datum: ${new Date().toLocaleDateString("sv-SE")} ${new Date().toLocaleTimeString("sv-SE")}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
