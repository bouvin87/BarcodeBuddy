import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Camera, X, FlashlightIcon as Flashlight, RotateCw } from "lucide-react";

interface MobileCameraScannerProps {
  onBarcodeScanned: (barcode: string) => void;
}

export default function MobileCameraScanner({ onBarcodeScanned }: MobileCameraScannerProps) {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFlashlight, setHasFlashlight] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setError(null);
    setFlashlightOn(false);
  };

  const startCamera = async () => {
    try {
      setError(null);
      setIsVideoLoading(true);
      
      // Check if camera is supported
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Kamera stöds inte i denna webbläsare. Använd Chrome, Safari eller Firefox.');
      }

      // Stop any existing stream
      stopCamera();

      console.log('Requesting camera access...');
      
      // Request camera with specific constraints for mobile
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera access granted');
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Check for flashlight capability
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities?.();
          setHasFlashlight(capabilities && 'torch' in capabilities);
        }
        
        // Force immediate display - don't wait for metadata
        setIsActive(true);
        setIsVideoLoading(false);
        
        // Try multiple approaches to get video working
        const tryPlayVideo = async () => {
          if (!videoRef.current) return;
          
          try {
            // Set all possible video attributes
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('webkit-playsinline', 'true');
            videoRef.current.setAttribute('muted', 'true');
            videoRef.current.setAttribute('autoplay', 'true');
            videoRef.current.muted = true;
            videoRef.current.autoplay = true;
            
            console.log('Attempting to play video...');
            await videoRef.current.play();
            console.log('Video play() succeeded');
            
          } catch (err) {
            console.error('Video play error:', err);
            // Try again after a short delay
            setTimeout(() => tryPlayVideo(), 100);
          }
        };
        
        // Try immediately and set up event listeners
        tryPlayVideo();
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          tryPlayVideo();
        };
        
        videoRef.current.oncanplay = () => {
          console.log('Video can play');
          tryPlayVideo();
        };

        videoRef.current.onerror = (err) => {
          console.error('Video error:', err);
          setError('Video-fel uppstod');
        };
      }
      
    } catch (err: any) {
      console.error('Camera error:', err);
      let errorMessage = 'Kunde inte starta kameran. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Tillåt kameraåtkomst i webbläsaren. Tryck på kameraikonen i adressfältet och välj "Tillåt".';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'Ingen kamera hittades på enheten.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage += 'Kamera stöds inte i denna webbläsare.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Kameran används av en annan app. Stäng andra appar som använder kameran.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Kameran stöder inte de begärda inställningarna.';
      } else {
        errorMessage += err.message || 'Okänt fel.';
      }
      
      setError(errorMessage);
      setIsVideoLoading(false);
    }
  };

  const toggleFlashlight = async () => {
    if (!streamRef.current) return;
    
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack && videoTrack.applyConstraints) {
      try {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashlightOn } as any]
        });
        setFlashlightOn(!flashlightOn);
      } catch (err) {
        console.error('Flashlight error:', err);
      }
    }
  };

  const switchCamera = () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    if (isActive) {
      stopCamera();
      // Restart with new facing mode after a short delay
      setTimeout(() => startCamera(), 100);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      
      // Create a download link for the captured image
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `barcode-${Date.now()}.jpg`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onBarcodeScanned(manualInput.trim());
      setManualInput("");
      setShowManualInput(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-1">Kameraskanning</h2>
        <p className="text-sm text-gray-600">
          {isActive ? "Rikta kameran mot streckkoden" : "Aktivera kameran för att skanna"}
        </p>
      </div>

      {!isActive ? (
        // Camera not active
        <div className="p-6 text-center space-y-4">
          <Camera className="h-16 w-16 text-gray-400 mx-auto" />
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <p className="font-medium mb-2">Kamerafel:</p>
              <p>{error}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <Button
              onClick={startCamera}
              className="w-full"
              size="lg"
            >
              <Camera className="h-5 w-5 mr-2" />
              Starta kamera
            </Button>
            
            <Button
              onClick={() => setShowManualInput(!showManualInput)}
              variant="outline"
              className="w-full"
            >
              Skriv in manuellt
            </Button>
          </div>
          
          {showManualInput && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <Input
                placeholder="Skriv streckkod här..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <Button
                onClick={handleManualSubmit}
                disabled={!manualInput.trim()}
                className="w-full"
              >
                Lägg till
              </Button>
            </div>
          )}
        </div>
      ) : (
        // Camera active
        <div className="relative">
          {/* Video feed */}
          <div className="relative bg-black aspect-video overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover bg-gray-800"
              style={{
                transform: 'scaleX(-1)', // Mirror for better UX
                minWidth: '100%',
                minHeight: '100%',
                objectFit: 'cover',
                display: 'block',
                visibility: 'visible',
                opacity: 1
              }}
              onCanPlay={() => {
                console.log('Video can play - should be visible now');
              }}
              onPlaying={() => {
                console.log('Video is playing');
                setIsActive(true);
                setIsVideoLoading(false);
              }}
              onWaiting={() => {
                console.log('Video is waiting for data');
              }}
              onLoadStart={() => {
                console.log('Video load started');
              }}
              onLoadedData={() => {
                console.log('Video data loaded');
              }}
              onError={(e) => {
                console.error('Video element error:', e);
              }}
              onSuspend={() => {
                console.log('Video suspended');
              }}
              onStalled={() => {
                console.log('Video stalled');
              }}
            />
            
            {/* Loading overlay */}
            {isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Laddar kamera...</p>
                </div>
              </div>
            )}
            
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-72 h-24 border-2 border-white rounded-lg relative bg-white/10">
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl"></div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr"></div>
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl"></div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br"></div>
                  
                  {/* Scanning line animation */}
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-green-400 animate-pulse"></div>
                </div>
                <p className="text-white text-sm mt-4 text-center bg-black/50 px-3 py-1 rounded">
                  Placera streckkoden i ramen
                </p>
              </div>
            </div>
          </div>
          
          {/* Camera controls */}
          <div className="p-4 bg-gray-900 text-white">
            <div className="flex justify-between items-center gap-2">
              <Button
                onClick={stopCamera}
                variant="destructive"
                size="sm"
              >
                <X className="h-4 w-4 mr-1" />
                Stäng
              </Button>
              
              <div className="flex gap-2">
                {hasFlashlight && (
                  <Button
                    onClick={toggleFlashlight}
                    variant={flashlightOn ? "default" : "outline"}
                    size="sm"
                  >
                    <Flashlight className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  onClick={switchCamera}
                  variant="outline"
                  size="sm"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={captureImage}
                  variant="outline"
                  size="sm"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Hidden canvas for image capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </Card>
  );
}