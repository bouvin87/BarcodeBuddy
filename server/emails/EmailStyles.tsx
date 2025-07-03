// emailStyles.tsx

export const emailStyles = {
  main: {
    backgroundColor: "#f3f4f6",
    padding: "40px 0",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: "#111827",
  },
  container: {
    backgroundColor: "#ffffff",
    maxWidth: "600px",
    margin: "0 auto",
    padding: "32px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
  header: {
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "16px",
    marginBottom: "24px",
  },
  headerText: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#2563eb",
    marginBottom: "4px",
  },
  headerSubtext: {
    fontSize: "14px",
    color: "#6b7280",
  },
  content: {
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#374151",
  },
  h1: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "16px",
  },
  deviationCard: {
    backgroundColor: "#f9fafb",
    padding: "20px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    marginBottom: "24px",
  },
  deviationTitle: {
    fontSize: "16px",
    fontWeight: "500",
    marginBottom: "12px",
    color: "#111827",
  },
  metaText: {
    fontSize: "13px",
    color: "#4b5563",
    marginBottom: "6px",
  },
  badge: (color: string) => ({
    display: "inline-block",
    padding: "2px 8px",
    fontSize: "12px",
    fontWeight: 600,
    borderRadius: "4px",
    border: `1px solid ${color}`,
    color,
    backgroundColor: "transparent",
    marginRight: "1em",
  }),
  buttonContainer: {
    textAlign: "center" as const,
    marginTop: "24px",
  },
  button: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    padding: "12px 24px",
    borderRadius: "6px",
    textDecoration: "none",
    display: "inline-block",
  },
};
