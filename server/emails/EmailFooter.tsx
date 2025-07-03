import { Section, Text } from "@react-email/components";
import * as React from "react";

const EmailFooter = () => {
  return (
    <Section
      style={{
        borderTop: "1px solid #e5e7eb",
        marginTop: "32px",
        paddingTop: "16px",
        textAlign: "center",
      }}
    >
      <Text
        style={{
          fontSize: "12px",
          color: "#9ca3af",
          lineHeight: "18px",
        }}
      >
        Det här meddelandet skickades automatiskt av{" "}
        <strong>BarcodeBuddy</strong>.
      </Text>
    </Section>
  );
};

export default EmailFooter;
