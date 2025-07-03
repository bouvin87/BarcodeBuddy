import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, QrCode } from "lucide-react";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";

interface CameraScannerProps {
  onBarcodeScanned: (barcode: string) => void;
}

export default function CameraScanner({ onBarcodeScanned }: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { initializeScanner, startScanning, stopScanning, isInitialized } = useBarcodeScanner({
    onDetected: (result) => {
      onBarcodeScanned(result.codeResult.code);
      setIsScanning(false);
    },
  });

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        
        // Initialize scanner when video is ready
        videoRef.current.onloadedmetadata = () => {
          initializeScanner(videoRef.current!, canvasRef.current!);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Fel vid åtkomst till kamera. Kontrollera att kamerabehörigheter är aktiverade.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsScanning(false);
    stopScanning();
  };

  const handleQuickScan = async () => {
    if (!isCameraActive) {
      await startCamera();
    }
    
    if (isInitialized) {
      setIsScanning(true);
      startScanning();
    }
  };

  const handleCapture = () => {
    if (isInitialized && !isScanning) {
      setIsScanning(true);
      startScanning();
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Skanna streckkoder</h2>
        <p className="text-sm text-gray-600">Rikta kameran mot streckkoden för att skanna</p>
      </div>

      {/* Camera View */}
      <div className="relative bg-gray-900 aspect-square">
        {!isCameraActive ? (
          // Camera not active - show placeholder
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-white text-sm mb-4">Aktivera kamera för att börja skanna</p>
              <Button
                onClick={startCamera}
                variant="secondary"
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                <Camera className="h-4 w-4 mr-2" />
                Aktivera kamera
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Video element for camera feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Canvas for QuaggaJS */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ display: 'none' }}
            />

            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Scanning frame */}
                <div className="w-64 h-16 border-2 border-white rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary"></div>
                  
                  {/* Scanning line animation */}
                  {isScanning && (
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary opacity-80 animate-pulse"></div>
                  )}
                </div>
                
                {/* Instruction text */}
                <p className="text-white text-sm text-center mt-3 bg-black bg-opacity-50 px-3 py-1 rounded-full">
                  {isScanning ? 'Skannar...' : 'Centrera streckkoden i ramen'}
                </p>
              </div>
            </div>

            {/* Camera controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
              <button
                onClick={handleCapture}
                disabled={isScanning || !isInitialized}
                className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Camera className="text-gray-700 text-xl" />
              </button>
              
              <button
                onClick={stopCamera}
                className="w-12 h-12 bg-red-600 rounded-full shadow-lg flex items-center justify-center hover:bg-red-700 transition-colors"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>

            {/* Loading state overlay */}
            {isScanning && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2"></div>
                  <p className="text-white text-sm">Behandlar streckkod...</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick scan button */}
      <div className="p-4">
        <Button
          onClick={handleQuickScan}
          disabled={isScanning}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <QrCode className="h-4 w-4 mr-2" />
          {!isCameraActive ? 'Starta snabbskanning' : isScanning ? 'Skannar...' : 'Skanna nu'}
        </Button>
      </div>
    </Card>
  );
}
