import React from "react";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { ScanSessionReportEmail } from "./emails/ScanSessionReport";
import { parseQRCode, calculateTotalWeight, groupByOrder } from "@shared/qr-parser";
import fs from "fs";
import path from "path";

export const emailService = {
  async sendScanSessionReport(session: {
    deliveryNoteNumber: string;
    createdAt: string;
    barcodes: string[];
  }) {
    // Process QR codes to extract structured data
    const totalWeight = calculateTotalWeight(session.barcodes);
    const orderGroups = groupByOrder(session.barcodes);
    
    const html = await render(
      <ScanSessionReportEmail
        deliveryNoteNumber={session.deliveryNoteNumber}
        createdAt={session.createdAt}
        barcodes={session.barcodes}
        totalWeight={totalWeight}
        orderGroups={orderGroups}
      />,
      { pretty: true },
    );
    
    // 2. Skapa förbättrad CSV-innehåll med rubriker
    const csvLines = ["Index;Ordernummer;Artikelnummer;Batchnummer;Vikt (kg);Rådata"];
    session.barcodes.forEach((barcode, index) => {
      const parsed = parseQRCode(barcode);
      if (parsed) {
        csvLines.push(`${index + 1};${parsed.orderNumber};${parsed.articleNumber};${parsed.batchNumber};${parsed.weight};${parsed.rawData}`);
      } else {
        // Fallback för vanliga streckkoder
        csvLines.push(`${index + 1};;;0;${barcode}`);
      }
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
