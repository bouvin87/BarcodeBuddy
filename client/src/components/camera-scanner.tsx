import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Camera, QrCode, Keyboard } from "lucide-react";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";

interface CameraScannerProps {
  onBarcodeScanned: (barcode: string) => void;
}

export default function CameraScanner({ onBarcodeScanned }: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
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
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Kamera stöds inte i denna webbläsare. Prova Chrome, Safari eller Firefox.');
        return;
      }

      // Check if running on HTTPS (required for camera access)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        alert('Kameraåtkomst kräver HTTPS. Kontakta din IT-avdelning för att aktivera säker anslutning.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        console.log('Setting video stream...');
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = async () => {
          console.log('Video metadata loaded');
          if (videoRef.current) {
            console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
            
            // Play the video
            try {
              await videoRef.current.play();
              console.log('Video playing successfully');
              setIsCameraActive(true);
              
              // Initialize scanner after video starts playing
              setTimeout(() => {
                initializeScanner(videoRef.current!, canvasRef.current!);
              }, 500);
            } catch (playError) {
              console.error('Error playing video:', playError);
            }
          }
        };
        
        videoRef.current.onerror = (error) => {
          console.error('Video error:', error);
        };
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'Fel vid åtkomst till kamera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Kamerabehörighet nekades. Klicka på kameraikonen i adressfältet och tillåt kameraåtkomst.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'Ingen kamera hittades. Kontrollera att enheten har en kamera.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Kamera stöds inte i denna webbläsare.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Kameran används av en annan app. Stäng andra appar som använder kameran.';
      } else {
        errorMessage += 'Okänt fel. Försök uppdatera sidan eller kontakta support.';
      }
      
      alert(errorMessage);
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
              className="w-full h-full object-cover bg-black"
              style={{ 
                transform: 'scaleX(-1)', // Mirror the video for better UX
                minHeight: '300px'
              }}
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

      {/* Action buttons */}
      <div className="p-4 space-y-3">
        <Button
          onClick={handleQuickScan}
          disabled={isScanning}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <QrCode className="h-4 w-4 mr-2" />
          {!isCameraActive ? 'Starta snabbskanning' : isScanning ? 'Skannar...' : 'Skanna nu'}
        </Button>

        {/* Manual input toggle */}
        {!showManualInput ? (
          <Button
            onClick={() => setShowManualInput(true)}
            variant="outline"
            className="w-full"
          >
            <Keyboard className="h-4 w-4 mr-2" />
            Ange streckkod manuellt
          </Button>
        ) : (
          <div className="space-y-2">
            <Input
              placeholder="Ange streckkod (t.ex. 1234567890)"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyPress={handleManualKeyPress}
              autoFocus
            />
            <div className="flex space-x-2">
              <Button
                onClick={handleManualSubmit}
                disabled={!manualBarcode.trim()}
                className="flex-1"
              >
                Lägg till
              </Button>
              <Button
                onClick={() => {
                  setShowManualInput(false);
                  setManualBarcode("");
                }}
                variant="outline"
                className="flex-1"
              >
                Avbryt
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
