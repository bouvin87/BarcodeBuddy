// QR code parsing utilities for order data
export interface ParsedQRData {
  orderNumber: string;
  articleNumber: string;
  batchNumber: string;
  weight: number; // in kg
  rawData: string;
}

export function parseQRCode(qrCode: string): ParsedQRData | null {
  try {
    const parts = qrCode.split(';');
    if (parts.length !== 4) {
      // Not a structured QR code, treat as simple barcode
      return null;
    }

    const [orderNumber, articleNumber, batchNumber, weightStr] = parts;
    const weight = parseFloat(weightStr.replace(',', '.')) || 0;

    return {
      orderNumber: orderNumber.trim(),
      articleNumber: articleNumber.trim(),
      batchNumber: batchNumber.trim(),
      weight,
      rawData: qrCode
    };
  } catch (error) {
    return null;
  }
}

export function calculateTotalWeight(qrCodes: string[]): number {
  return qrCodes.reduce((total, qrCode) => {
    const parsed = parseQRCode(qrCode);
    return total + (parsed?.weight || 0);
  }, 0);
}

export function groupByOrder(qrCodes: string[]): Map<string, ParsedQRData[]> {
  const groups = new Map<string, ParsedQRData[]>();
  
  qrCodes.forEach(qrCode => {
    const parsed = parseQRCode(qrCode);
    if (parsed) {
      if (!groups.has(parsed.orderNumber)) {
        groups.set(parsed.orderNumber, []);
      }
      groups.get(parsed.orderNumber)!.push(parsed);
    }
  });
  
  return groups;
}

export function formatWeight(weight: number): string {
  return `${weight.toFixed(1)} kg`;
}