import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCw, Plus, Camera, Package, Keyboard } from "lucide-react";
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
  
  // Structured data input
  const [orderNumber, setOrderNumber] = useState("");
  const [articleNumber, setArticleNumber] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [weight, setWeight] = useState("");

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
    }
  };

  const handleStructuredSubmit = () => {
    if (orderNumber.trim() && articleNumber.trim() && batchNumber.trim()) {
      // Create QR code format: ordernummer;artikelnummer;batchnummer;vikt
      const weightValue = weight.trim() || "0";
      const qrCode = `${orderNumber.trim()};${articleNumber.trim()};${batchNumber.trim()};${weightValue}`;
      onBarcodeScanned(qrCode);
      
      // Clear form
      setOrderNumber("");
      setArticleNumber("");
      setBatchNumber("");
      setWeight("");
    }
  };

  const isStructuredFormValid = orderNumber.trim() && articleNumber.trim() && batchNumber.trim();
  const stopCamera = () => {
    scannerControls.current?.stop();
    scannerControls.current = null;
    setCameraActive(false);
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-1">Kameraskanning</h2>
        <p className="text-sm text-gray-600">Rikta kameran mot en qr-kod</p>
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
            <div className="w-48 h-48 relative">
              {/* Hörn */}
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white rounded-br-sm" />

              {/* Linje som är bredare än ramen */}
              <div className="absolute left-1/2 top-1/2 w-64 h-0.5 bg-green-400 -translate-x-1/2 -translate-y-1/2" />
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
          Manuell inmatning
        </Button>

        {showManualInput && (
          <div className="bg-gray-50 rounded-lg p-4">
            <Tabs defaultValue="structured" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="structured" className="text-sm">
                  <Keyboard className="h-4 w-4 mr-1" />
                  Strukturerad
                </TabsTrigger>
                <TabsTrigger value="simple" className="text-sm">
                  <Package className="h-4 w-4 mr-1" />
                  Enkel kod
                </TabsTrigger>
              </TabsList>
              

              
              <TabsContent value="structured" className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="order-num" className="text-xs">Ordernummer *</Label>
                    <Input
                      id="order-num"
                      placeholder="75555"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="batch-num" className="text-xs">Batch *</Label>
                    <Input
                      id="batch-num"
                      placeholder="G-2558-1"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="article-num" className="text-xs">Artikelnummer *</Label>
                  <Input
                    id="article-num"
                    placeholder="S-3374-046-1565"
                    value={articleNumber}
                    onChange={(e) => setArticleNumber(e.target.value)}
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="weight-input" className="text-xs">Vikt (kg)</Label>
                  <Input
                    id="weight-input"
                    placeholder="1500"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="text-sm"
                  />
                </div>
                
                <Button
                  onClick={handleStructuredSubmit}
                  disabled={!isStructuredFormValid}
                  className="w-full"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Registrera QR-post
                </Button>
              </TabsContent>
              
              <TabsContent value="simple" className="space-y-3 mt-3">
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
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </Card>
  );
}
