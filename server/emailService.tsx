import React from "react";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { ScanSessionReportEmail } from "./emails/ScanSessionReport";
import fs from "fs";
import path from "path";

export const emailService = {
  async sendScanSessionReport(session: {
    deliveryNoteNumber: string;
    createdAt: string;
    barcodes: string[];
  }) {
    const html = await render(
      <ScanSessionReportEmail
        deliveryNoteNumber={session.deliveryNoteNumber}
        createdAt={session.createdAt}
        barcodes={session.barcodes}
      />,
      { pretty: true },
    );
    // 2. Skapa CSV-innehåll
    const csvLines = ["Index;Streckkod"];
    session.barcodes.forEach((barcode, index) => {
      csvLines.push(`${index + 1};${barcode}`);
    });
    const csvContent = csvLines.join("\n");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    return await transporter.sendMail({
      from: {
        name: "BarcodeBuddy",
        address: process.env.FROM_EMAIL || process.env.SMTP_USER!,
      },
      to: process.env.RECIPIENT_EMAIL!,
      subject: `Leveransrapport - ${session.deliveryNoteNumber}`,
      html,
      text: html.replace(/<[^>]*>/g, ""), // fallback-text
      attachments: [
        {
          filename: `streckkoder-${session.deliveryNoteNumber}.csv`,
          content: csvContent,
          contentType: "text/csv",
        },
      ],
    });
  },
};
