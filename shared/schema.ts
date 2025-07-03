import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const scanSessions = pgTable("scan_sessions", {
  id: serial("id").primaryKey(),
  deliveryNoteNumber: text("delivery_note_number").notNull(),
  barcodes: text("barcodes").array().notNull().default([]),
  emailSent: text("email_sent").default("pending"), // pending, sent, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScanSessionSchema = createInsertSchema(scanSessions).pick({
  deliveryNoteNumber: true,
  barcodes: true,
});

export const updateScanSessionSchema = createInsertSchema(scanSessions).pick({
  barcodes: true,
  emailSent: true,
}).partial();

export type InsertScanSession = z.infer<typeof insertScanSessionSchema>;
export type UpdateScanSession = z.infer<typeof updateScanSessionSchema>;
export type ScanSession = typeof scanSessions.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
