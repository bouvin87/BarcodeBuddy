import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Camera, QrCode, Keyboard, ScanLine } from "lucide-react";

interface SimpleBarcodeInputProps {
  onBarcodeScanned: (barcode: string) => void;
}

export default function SimpleBarcodeInput({ onBarcodeScanned }: SimpleBarcodeInputProps) {
  const [manualBarcode, setManualBarcode] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      onBarcodeScanned(manualBarcode.trim());
      setManualBarcode("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSubmit();
    }
  };

  const startSimpleCamera = async () => {
    try {
      setCameraError(null);
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Kamera stöds inte i denna webbläsare');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
        
        await videoRef.current.play();
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      let errorMsg = 'Kunde inte starta kameran. ';
      
      if (error.name === 'NotAllowedError') {
        errorMsg += 'Tillåt kameraåtkomst i webbläsaren.';
      } else if (error.name === 'NotFoundError') {
        errorMsg += 'Ingen kamera hittades.';
      } else if (error.name === 'NotSupportedError') {
        errorMsg += 'Kamera stöds inte.';
      } else {
        errorMsg += 'Använd manuell inmatning istället.';
      }
      
      setCameraError(errorMsg);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setCameraError(null);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Lägg till streckkoder</h2>
        <p className="text-sm text-gray-600">Skriv in eller skanna streckkoder</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Manual Input - Primary Method */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Streckkod</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Skriv eller klistra in streckkod här..."
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 text-base"
              autoFocus
            />
            <Button
              onClick={handleManualSubmit}
              disabled={!manualBarcode.trim()}
              className="px-6"
            >
              <ScanLine className="h-4 w-4 mr-1" />
              Lägg till
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Tips: Många mobiltelefoner kan skanna streckkoder direkt i kamera-appen och kopiera texten
          </p>
        </div>

        {/* Camera Option */}
        <div className="pt-3 border-t border-gray-100">
          {!showCamera ? (
            <div className="text-center">
              <Button
                onClick={startSimpleCamera}
                variant="outline"
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Prova kameraskanning (experimentell)
              </Button>
              
              {cameraError && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
                  {cameraError}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay with scanning frame */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-64 h-20 border-2 border-white rounded-lg relative">
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-green-400"></div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-green-400"></div>
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-green-400"></div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-green-400"></div>
                    </div>
                    <p className="text-white text-sm mt-2 text-center">
                      Rikta kameran mot streckkoden
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={stopCamera} variant="outline" className="flex-1">
                  Stäng kamera
                </Button>
                <div className="text-xs text-gray-500 flex-1 flex items-center">
                  Om skanning inte fungerar, ta en bild och skriv in koden manuellt
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}