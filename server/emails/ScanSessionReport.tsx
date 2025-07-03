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

interface ScanSessionReportEmailProps {
  id: number;
  deliveryNoteNumber: string;
  createdAt: string;
  barcodes: string[];
  baseUrl?: string;
}

export const ScanSessionReportEmail = ({
  deliveryNoteNumber,
  createdAt,
  barcodes,
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

              <Heading
                as="h3"
                style={{ fontSize: 14, marginBottom: 8, color: "#111827" }}
              >
                Streckkoder ({barcodes.length})
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
