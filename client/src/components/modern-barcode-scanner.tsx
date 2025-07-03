import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Camera, QrCode, Keyboard, X } from "lucide-react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";

interface ModernBarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void;
}

export default function ModernBarcodeScanner({ onBarcodeScanned }: ModernBarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const elementId = "barcode-scanner-container";

  const startScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }

    try {
      setScannerError(null);
      setIsScanning(true);

      const scanner = new Html5QrcodeScanner(
        elementId,
        {
          fps: 10, // Frames per second for scanning
          qrbox: { width: 300, height: 150 }, // Scanning box size
          aspectRatio: 2.0, // Wider for barcodes
          supportedScanTypes: [
            Html5QrcodeScanType.SCAN_TYPE_CAMERA
          ],
          showTorchButtonIfSupported: true, // Show flashlight if available
          showZoomSliderIfSupported: true, // Show zoom if available
          defaultZoomValueIfSupported: 1.5, // Default zoom level
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // Use native barcode detection if available
          }
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText, decodedResult) => {
          console.log('Barcode scanned:', decodedText);
          onBarcodeScanned(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Ignore frequent scanning errors - they're normal
          if (!errorMessage.includes('No QR code found')) {
            console.log('Scanner error:', errorMessage);
          }
        }
      );

      scannerRef.current = scanner;
    } catch (error: any) {
      console.error('Error starting scanner:', error);
      setScannerError('Kunde inte starta skannern. Kontrollera kamerabehörigheter.');
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().then(() => {
        setIsScanning(false);
        scannerRef.current = null;
      }).catch((error) => {
        console.error('Error stopping scanner:', error);
        setIsScanning(false);
        scannerRef.current = null;
      });
    } else {
      setIsScanning(false);
    }
  };

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      onBarcodeScanned(manualBarcode.trim());
      setManualBarcode("");
      setShowManualInput(false);
    }
  };

  const handleManualKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSubmit();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Skanna streckkoder</h2>
        <p className="text-sm text-gray-600">
          {isScanning ? "Rikta kameran mot streckkoden" : "Klicka för att börja skanna"}
        </p>
      </div>

      {/* Scanner Container */}
      <div className="relative">
        {!isScanning ? (
          // Not scanning - show start button
          <div className="p-8 text-center bg-gray-50">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-6">Aktivera kamera för att skanna streckkoder</p>
            
            <div className="space-y-3">
              <Button
                onClick={startScanner}
                className="w-full"
                size="lg"
              >
                <Camera className="h-5 w-5 mr-2" />
                Starta skanner
              </Button>
              
              <Button
                onClick={() => setShowManualInput(true)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Keyboard className="h-5 w-5 mr-2" />
                Skriv in manuellt
              </Button>
            </div>

            {scannerError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{scannerError}</p>
              </div>
            )}
          </div>
        ) : (
          // Scanning active
          <div className="relative">
            {/* Scanner element */}
            <div id={elementId} className="w-full"></div>
            
            {/* Stop button overlay */}
            <div className="absolute top-4 right-4 z-10">
              <Button
                onClick={stopScanner}
                variant="destructive"
                size="sm"
              >
                <X className="h-4 w-4 mr-1" />
                Stoppa
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input Modal */}
      {showManualInput && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Skriv in streckkod manuellt</h3>
              <Button
                onClick={() => setShowManualInput(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Skriv eller klistra in streckkod..."
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyPress={handleManualKeyPress}
                className="flex-1"
                autoFocus
              />
              <Button
                onClick={handleManualSubmit}
                disabled={!manualBarcode.trim()}
              >
                Lägg till
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}