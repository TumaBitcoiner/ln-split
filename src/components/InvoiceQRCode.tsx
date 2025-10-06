import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface InvoiceQRCodeProps {
  invoice: string;
  index: number;
}

export function InvoiceQRCode({ invoice, index }: InvoiceQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, invoice, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    }
  }, [invoice]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invoice);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-medium text-gray-700">Person {index + 1}</p>
        <canvas ref={canvasRef} className="rounded-lg" />
        <button
          onClick={copyToClipboard}
          className="w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded transition-colors"
        >
          Copy Invoice
        </button>
      </div>
    </div>
  );
}
