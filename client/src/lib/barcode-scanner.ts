// QuaggaJS wrapper for barcode scanning
import Quagga from 'quagga';

// Re-export Quagga with proper TypeScript types
export default Quagga;

// Initialize QuaggaJS for barcode scanning
export const initBarcodeScanner = (
  videoElement: HTMLVideoElement,
  config: {
    onDetected: (result: any) => void;
    onError?: (error: any) => void;
  }
) => {
  return new Promise((resolve, reject) => {
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: videoElement,
        constraints: {
          width: { min: 640 },
          height: { min: 480 },
          facingMode: "environment", // Use back camera
          aspectRatio: { min: 1, max: 2 }
        }
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: 2,
      frequency: 10,
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
          "i2of5_reader",
          "2of5_reader",
          "code_93_reader"
        ]
      },
      locate: true
    }, (err: any) => {
      if (err) {
        console.error('Barcode scanner initialization failed:', err);
        if (config.onError) config.onError(err);
        reject(err);
      } else {
        console.log('Barcode scanner initialized successfully');
        
        Quagga.onDetected((result: any) => {
          const code = result.codeResult.code;
          console.log('Barcode detected:', code);
          config.onDetected(result);
        });

        Quagga.onProcessed((result: any) => {
          const drawingCtx = Quagga.canvas.ctx.overlay;
          const drawingCanvas = Quagga.canvas.dom.overlay;

          if (result) {
            if (result.boxes) {
              drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
              result.boxes.filter((box: any) => box !== result.box).forEach((box: any) => {
                Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 });
              });
            }

            if (result.box) {
              Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: "#00F", lineWidth: 2 });
            }

            if (result.codeResult && result.codeResult.code) {
              Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
            }
          }
        });

        resolve(true);
      }
    });
  });
};

export const startScanning = () => {
  Quagga.start();
};

export const stopScanning = () => {
  Quagga.stop();
};
