import { scanSessions, type ScanSession, type InsertScanSession, type UpdateScanSession } from "@shared/schema";

export interface IStorage {
  // Scan session methods
  createScanSession(session: InsertScanSession): Promise<ScanSession>;
  getScanSession(id: number): Promise<ScanSession | undefined>;
  updateScanSession(id: number, updates: UpdateScanSession): Promise<ScanSession | undefined>;
  deleteScanSession(id: number): Promise<boolean>;
  
  // Auth session methods
  createAuthSession(sessionId: string, userId: string, expiresAt: Date): Promise<void>;
  getAuthSession(sessionId: string): Promise<{ userId: string; expiresAt: Date } | undefined>;
  deleteAuthSession(sessionId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private scanSessions: Map<number, ScanSession>;
  private currentScanSessionId: number;
  private authSessions: Map<string, { userId: string; expiresAt: Date }>;

  constructor() {
    this.scanSessions = new Map();
    this.currentScanSessionId = 1;
    this.authSessions = new Map();
  }

  async createScanSession(insertSession: InsertScanSession): Promise<ScanSession> {
    const id = this.currentScanSessionId++;
    const session: ScanSession = {
      id,
      deliveryNoteNumber: insertSession.deliveryNoteNumber,
      barcodes: Array.isArray(insertSession.barcodes) ? insertSession.barcodes : [],
      emailSent: "pending",
      createdAt: new Date(),
    };
    this.scanSessions.set(id, session);
    return session;
  }

  async getScanSession(id: number): Promise<ScanSession | undefined> {
    return this.scanSessions.get(id);
  }

  async updateScanSession(id: number, updates: UpdateScanSession): Promise<ScanSession | undefined> {
    const existing = this.scanSessions.get(id);
    if (!existing) return undefined;

    const updated: ScanSession = {
      ...existing,
      ...updates,
    };
    this.scanSessions.set(id, updated);
    return updated;
  }

  async deleteScanSession(id: number): Promise<boolean> {
    return this.scanSessions.delete(id);
  }

  // Auth session methods
  async createAuthSession(sessionId: string, userId: string, expiresAt: Date): Promise<void> {
    this.authSessions.set(sessionId, { userId, expiresAt });
  }

  async getAuthSession(sessionId: string): Promise<{ userId: string; expiresAt: Date } | undefined> {
    const session = this.authSessions.get(sessionId);
    if (!session) return undefined;
    
    // Check if session has expired
    if (session.expiresAt < new Date()) {
      this.authSessions.delete(sessionId);
      return undefined;
    }
    
    return session;
  }

  async deleteAuthSession(sessionId: string): Promise<void> {
    this.authSessions.delete(sessionId);
  }
}

export const storage = new MemStorage();
