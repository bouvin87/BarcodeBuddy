import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, QrCode, Keyboard, ScanLine, Package, Plus } from "lucide-react";

interface SimpleBarcodeInputProps {
  onBarcodeScanned: (barcode: string) => void;
}

export default function SimpleBarcodeInput({ onBarcodeScanned }: SimpleBarcodeInputProps) {
  const [manualBarcode, setManualBarcode] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Structured data input
  const [orderNumber, setOrderNumber] = useState("");
  const [articleNumber, setArticleNumber] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [weight, setWeight] = useState("");

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      onBarcodeScanned(manualBarcode.trim());
      setManualBarcode("");
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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Lägg till data</h2>
        <p className="text-sm text-gray-600">Skanna, skriv in eller registrera strukturerad data</p>
      </div>

      <div className="p-4">
        <Tabs defaultValue="simple" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple" className="text-sm">
              <Keyboard className="h-4 w-4 mr-1" />
              Enkel kod
            </TabsTrigger>
            <TabsTrigger value="structured" className="text-sm">
              <Package className="h-4 w-4 mr-1" />
              Strukturerad
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="simple" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="manual-barcode">Streckkod eller QR-kod</Label>
              <div className="flex gap-2">
                <Input
                  id="manual-barcode"
                  type="text"
                  placeholder="Skriv eller klistra in kod här..."
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
                  <Plus className="h-4 w-4 mr-1" />
                  Lägg till
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="structured" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="order-number">Ordernummer *</Label>
                <Input
                  id="order-number"
                  type="text"
                  placeholder="t.ex. 75555"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-number">Batchnummer *</Label>
                <Input
                  id="batch-number"
                  type="text"
                  placeholder="t.ex. G-2558-1"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="text-base"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="article-number">Artikelnummer *</Label>
              <Input
                id="article-number"
                type="text"
                placeholder="t.ex. 1,0x100 S350 Z275 EVO"
                value={articleNumber}
                onChange={(e) => setArticleNumber(e.target.value)}
                className="text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weight">Vikt (kg)</Label>
              <Input
                id="weight"
                type="text"
                placeholder="t.ex. 1500"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="text-base"
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
        </Tabs>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Tips: Använd kamerascannern ovan eller kopiera koder från mobilkameran
          </p>
        </div>
      </div>
    </Card>
  );
}