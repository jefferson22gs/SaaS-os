import React, { useEffect, useRef } from 'react';

declare const ZXing: any;

interface BarcodeScannerProps {
  onScan: (result: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<any>(null);

  useEffect(() => {
    if (typeof ZXing === 'undefined') {
        console.error("ZXing library not loaded.");
        return;
    }

    codeReaderRef.current = new ZXing.BrowserMultiFormatReader();
    const codeReader = codeReaderRef.current;

    if (videoRef.current) {
      codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result: any, err: any) => {
        if (result) {
          onScan(result.getText());
        }
        if (err && !(err instanceof ZXing.NotFoundException)) {
          console.error(err);
        }
      });
    }

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, [onScan]);

  return (
    <div>
        <video ref={videoRef} className="w-full rounded-lg bg-gray-900" />
    </div>
  );
};

export default BarcodeScanner;
