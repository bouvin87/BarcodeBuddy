import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCw, Plus, Camera } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";

interface MobileCameraScannerProps {
  onBarcodeScanned: (barcode: string) => void;
}

export default function MobileCameraScanner({ onBarcodeScanned }: MobileCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastScanned = useRef<string | null>(null);
  const lastScannedAt = useRef<number>(0);
  const scannerControls = useRef<ReturnType<BrowserMultiFormatReader["decodeFromConstraints"]> | null>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    if (!cameraActive) return;

    const codeReader = new BrowserMultiFormatReader();

    const startScanner = async () => {
      try {
          scannerControls.current = await codeReader.decodeFromConstraints(
          {
            video: { facingMode },
          },
          videoRef.current!,
          (result, err, ctrl) => {
            if (result) {
              const code = result.getText();
              const now = Date.now();

              if (code === lastScanned.current && now - lastScannedAt.current < 3000) return;

              lastScanned.current = code;
              lastScannedAt.current = now;

              console.log("✅ Streckkod:", code);
              onBarcodeScanned(code);
            }
          }
        );

      } catch (err) {
        console.error("Kamerafel:", err);
      }
    };

    startScanner();

    return () => {
      scannerControls.current?.stop();
      scannerControls.current = null;
    };
  }, [facingMode, cameraActive, onBarcodeScanned]);

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onBarcodeScanned(manualInput.trim());
      setManualInput("");
      // setShowManualInput(""); ← OBS! Du kan ta bort denna för att behålla öppet
    }
  };
  const stopCamera = () => {
    scannerControls.current?.stop();
    scannerControls.current = null;
    setCameraActive(false);
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-1">Kameraskanning</h2>
        <p className="text-sm text-gray-600">Rikta kameran mot en streckkod</p>
      </div>

      {!cameraActive ? (
        <div className="p-4">
          <Button onClick={() => setCameraActive(true)} className="w-full">
            <Camera className="h-4 w-4 mr-2" />
            Starta kamera
          </Button>
        </div>
      ) : (
        <div className="relative bg-black aspect-video overflow-hidden min-h-[300px] w-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            preload="none"
            className="w-full h-full object-cover"
            style={{
              transform: facingMode === "user" ? "scaleX(-1)" : "none",
            }}
            onLoadStart={() => console.log("Video loading started")}
            onCanPlay={() => console.log("Video can play")}
          />

          {/* 🔲 Visuell ram */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-24 border-2 border-white bg-white/10 rounded-lg relative">
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-green-400 animate-pulse" />
            </div>
          </div>
          <div className="absolute bottom-4 left-4 z-10">
            {/* ⛔ Stäng kamera-knapp */}
            <Button onClick={stopCamera} variant="destructive" size="sm">
              Stäng kamera
            </Button>
          </div>
          {/* 🔄 Kamera-växlare */}
          <div className="absolute bottom-4 right-4 z-10">
            <Button onClick={switchCamera} variant="outline" size="sm">
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Manuell inmatning */}
      <div className="p-4 space-y-3">
        <Button
          onClick={() => setShowManualInput(prev => !prev)}
          variant="outline"
          className="w-full"
        >
          Skriv in streckkod manuellt
        </Button>

        {showManualInput && (
          <div className="bg-gray-100 rounded-lg p-4 space-y-3">
            <Input
              placeholder="Skriv streckkod här..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
            />
            <Button
              onClick={handleManualSubmit}
              disabled={!manualInput.trim()}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Lägg till
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
