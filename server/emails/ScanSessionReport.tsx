import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Row,
  Column,
  Button,
} from "@react-email/components";
import * as React from "react";
import { emailStyles as styles } from "./EmailStyles";
import EmailFooter from "./EmailFooter";
import { parseQRCode, formatWeight } from "@shared/qr-parser";

interface ScanSessionReportEmailProps {
  id?: number;
  deliveryNoteNumber: string;
  createdAt: string;
  barcodes: string[];
  totalWeight?: number;
  baseUrl?: string;
}

export const ScanSessionReportEmail = ({
  deliveryNoteNumber,
  createdAt,
  barcodes,
  totalWeight = 0,
}: ScanSessionReportEmailProps) => {
  const previewText = `Leveransrapport: ${deliveryNoteNumber}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.headerText}>BarcodeBuddy</Text>
            <Text style={styles.headerSubtext}>Leveransrapport</Text>
          </Section>

          {/* Content */}
          <Section style={styles.content}>
            <Text style={styles.h1}>Ny leveransrapport</Text>

            <Section style={styles.deviationCard}>
              <Text style={styles.deviationTitle}>
                <strong>Följesedelnummer:</strong> {deliveryNoteNumber}
              </Text>

              <Text style={styles.metaText}>
                <strong>Skanningsdatum:</strong>{" "}
                {new Date(createdAt).toLocaleDateString("sv-SE")}
              </Text>
              <Text style={styles.metaText}>
                <strong>Skanningtid:</strong>{" "}
                {new Date(createdAt).toLocaleTimeString("sv-SE")}
              </Text>

              <Hr style={{ margin: "16px 0", borderColor: "#d1d5db" }} />

              {/* Summary Section */}
              <Section style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
                <Heading
                  as="h3"
                  style={{ fontSize: 14, marginBottom: 8, color: "#111827", margin: 0 }}
                >
                  Sammanfattning
                </Heading>
                <Text style={{ fontSize: 13, color: "#374151", margin: "4px 0" }}>
                  <strong>Antal poster:</strong> {barcodes.length} st
                </Text>
                <Text style={{ fontSize: 13, color: "#374151", margin: "4px 0" }}>
                  <strong>Total vikt:</strong> {totalWeight.toFixed(1)} kg
                </Text>
              </Section>

              {/* Data Table */}
              <Heading
                as="h3"
                style={{ fontSize: 14, marginBottom: 12, color: "#111827" }}
              >
                Skannade poster ({barcodes.length})
              </Heading>
              
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
                marginBottom: "16px"
              }}>
                <thead>
                  <tr style={{ backgroundColor: "#f3f4f6" }}>
                    <th style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "left", fontWeight: "bold" }}>#</th>
                    <th style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "left", fontWeight: "bold" }}>Order</th>
                    <th style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "left", fontWeight: "bold" }}>Artikel</th>
                    <th style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "left", fontWeight: "bold" }}>Batch</th>
                    <th style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "right", fontWeight: "bold" }}>Vikt</th>
                  </tr>
                </thead>
                <tbody>
                  {barcodes.map((code, index) => {
                    const parsed = parseQRCode(code);
                    const isQRCode = parsed !== null;
                    
                    return (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                        <td style={{ border: "1px solid #d1d5db", padding: "6px", fontFamily: "monospace" }}>
                          {index + 1}
                        </td>
                        {isQRCode ? (
                          <>
                            <td style={{ border: "1px solid #d1d5db", padding: "6px", fontFamily: "monospace" }}>
                              {parsed.orderNumber}
                            </td>
                            <td style={{ border: "1px solid #d1d5db", padding: "6px", fontFamily: "monospace", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {parsed.articleNumber}
                            </td>
                            <td style={{ border: "1px solid #d1d5db", padding: "6px", fontFamily: "monospace" }}>
                              {parsed.batchNumber}
                            </td>
                            <td style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "right", fontFamily: "monospace" }}>
                              {formatWeight(parsed.weight)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ border: "1px solid #d1d5db", padding: "6px", color: "#6b7280" }}>-</td>
                            <td style={{ border: "1px solid #d1d5db", padding: "6px", fontFamily: "monospace" }}>
                              {code}
                            </td>
                            <td style={{ border: "1px solid #d1d5db", padding: "6px", color: "#6b7280" }}>Streckkod</td>
                            <td style={{ border: "1px solid #d1d5db", padding: "6px", color: "#6b7280", textAlign: "right" }}>-</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <Row>
                <Column>
                  <Text style={styles.metaText}>
                    Rapport skapad: {new Date().toLocaleString("sv-SE")}
                  </Text>
                </Column>
              </Row>
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
};

export default ScanSessionReportEmail;
