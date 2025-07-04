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
import type { ParsedQRData } from "@shared/qr-parser";

interface ScanSessionReportEmailProps {
  id?: number;
  deliveryNoteNumber: string;
  createdAt: string;
  barcodes: string[];
  totalWeight?: number;
  orderGroups?: Map<string, ParsedQRData[]>;
  baseUrl?: string;
}

export const ScanSessionReportEmail = ({
  deliveryNoteNumber,
  createdAt,
  barcodes,
  totalWeight = 0,
  orderGroups,
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
                {orderGroups && orderGroups.size > 0 && (
                  <Text style={{ fontSize: 13, color: "#374151", margin: "4px 0" }}>
                    <strong>Antal ordrar:</strong> {orderGroups.size} st
                  </Text>
                )}
              </Section>

              {/* Detailed listing by order */}
              {orderGroups && orderGroups.size > 0 ? (
                <>
                  <Heading
                    as="h3"
                    style={{ fontSize: 14, marginBottom: 12, color: "#111827" }}
                  >
                    Detaljer per order
                  </Heading>
                  {Array.from(orderGroups.entries()).map(([orderNumber, items]) => {
                    const orderWeight = items.reduce((sum, item) => sum + item.weight, 0);
                    return (
                      <Section key={orderNumber} style={{ marginBottom: "16px", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                        <Text style={{ fontSize: 13, fontWeight: "bold", color: "#111827", margin: "0 0 8px 0" }}>
                          Order: {orderNumber} ({orderWeight.toFixed(1)} kg)
                        </Text>
                        {items.map((item, index) => (
                          <Text key={index} style={{ fontSize: 12, color: "#6b7280", margin: "2px 0", fontFamily: "monospace" }}>
                            • {item.articleNumber} | Batch: {item.batchNumber} | {item.weight} kg
                          </Text>
                        ))}
                      </Section>
                    );
                  })}
                </>
              ) : (
                <>
                  <Heading
                    as="h3"
                    style={{ fontSize: 14, marginBottom: 8, color: "#111827" }}
                  >
                    Skannadata ({barcodes.length})
                  </Heading>
                  <ul
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      paddingLeft: 16,
                      marginBottom: 12,
                    }}
                  >
                    {barcodes.map((code, index) => (
                      <li
                        key={index}
                        style={{ fontFamily: "monospace", color: "#374151" }}
                      >
                        {code}
                      </li>
                    ))}
                  </ul>
                </>
              )}

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
