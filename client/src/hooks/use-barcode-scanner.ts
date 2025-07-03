import { useRef, useCallback, useState } from 'react';
import Quagga from '@/lib/barcode-scanner';

interface ScannerConfig {
  onDetected: (result: any) => void;
}

export function useBarcodeScanner({ onDetected }: ScannerConfig) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const initializeScanner = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    videoRef.current = video;
    canvasRef.current = canvas;

    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: video,
        constraints: {
          width: 640,
          height: 480,
          facingMode: "environment"
        }
      },
      decoder: {
        readers: [
          "code_128_reader",
          "ean_reader",
          "ean_8_reader",
          "code_39_reader",
          "code_39_vin_reader",
          "codabar_reader",
          "upc_reader",
          "upc_e_reader",
          "i2of5_reader"
        ]
      },
      locate: true,
      frequency: 10,
      debug: false
    }, (err: any) => {
      if (err) {
        console.error('QuaggaJS initialization error:', err);
        return;
      }
      
      setIsInitialized(true);
      
      Quagga.onDetected((result: any) => {
        if (isScanning) {
          onDetected(result);
          setIsScanning(false);
        }
      });
    });
  }, [onDetected, isScanning]);

  const startScanning = useCallback(() => {
    if (isInitialized) {
      setIsScanning(true);
      Quagga.start();
    }
  }, [isInitialized]);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    if (isInitialized) {
      Quagga.stop();
    }
  }, [isInitialized]);

  return {
    initializeScanner,
    startScanning,
    stopScanning,
    isInitialized,
    isScanning
  };
}
