import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertScanSessionSchema,
  updateScanSessionSchema,
} from "@shared/schema";
import { emailService } from "./emailService";
import crypto from "crypto";

// Auth middleware
async function requireAuth(req: Request, res: Response, next: Function) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId) {
    return res.status(401).json({ message: "Ingen session-token" });
  }
  
  const session = await storage.getAuthSession(sessionId);
  if (!session) {
    return res.status(401).json({ message: "Ogiltig eller utgången session" });
  }
  
  // Add user info to request
  (req as any).userId = session.userId;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Login route
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Check credentials against environment variables
      const validUsername = process.env.LOGIN_USERNAME;
      const validPassword = process.env.LOGIN_PASSWORD;
      
      if (!validUsername || !validPassword) {
        return res.status(500).json({ message: "Serverfel: Inloggningsuppgifter saknas" });
      }
      
      if (username.toLowerCase() !== validUsername.toLowerCase() || password !== validPassword) {
        return res.status(401).json({ message: "Felaktigt användarnamn eller lösenord" });
      }
      
      // Create session
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      await storage.createAuthSession(sessionId, username, expiresAt);
      
      res.json({ 
        sessionId, 
        expiresAt,
        message: "Inloggning lyckades" 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Serverfel vid inloggning" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", async (req, res) => {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      if (sessionId) {
        await storage.deleteAuthSession(sessionId);
      }
      res.json({ message: "Utloggning lyckades" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Serverfel vid utloggning" });
    }
  });

  // Check auth status
  app.get("/api/auth/status", async (req, res) => {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      
      if (!sessionId) {
        return res.json({ authenticated: false });
      }
      
      const session = await storage.getAuthSession(sessionId);
      res.json({ 
        authenticated: !!session,
        userId: session?.userId 
      });
    } catch (error) {
      console.error("Auth status error:", error);
      res.json({ authenticated: false });
    }
  });

  // Skapa scan session (protected)
  app.post("/api/scan-sessions", requireAuth, async (req, res) => {
    try {
      const sessionData = insertScanSessionSchema.parse(req.body);
      const session = await storage.createScanSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating scan session:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Hämta scan session (protected)
  app.get("/api/scan-sessions/:id", requireAuth, async (req, res) => {
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

  // Uppdatera scan session (protected)
  app.patch("/api/scan-sessions/:id", requireAuth, async (req, res) => {
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

  // Skicka e-post (protected)
  app.post("/api/scan-sessions/:id/send-email", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const session = await storage.getScanSession(id);
      if (!session) {
        return res.status(404).json({ message: "Scan session not found" });
      }

      await emailService.sendScanSessionReport({
        deliveryNoteNumber: session.deliveryNoteNumber,
        createdAt: session.createdAt.toISOString(),
        barcodes: session.barcodes
      });
      await storage.updateScanSession(id, { emailSent: "sent" });

      res.json({ message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      await storage.updateScanSession(id, { emailSent: "failed" });
      res.status(500).json({ message: "Fel vid skickning av e-post" });
    }
  });

  return createServer(app);
}
