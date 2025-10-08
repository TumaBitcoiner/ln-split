import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Heart, Loader2 } from 'lucide-react';

interface DonationBoxProps {
  donationAddress: string;
}

export function DonationBox({ donationAddress }: DonationBoxProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [invoice, setInvoice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (donationAddress) {
      generateDonationInvoice();
    }
  }, [donationAddress]);

  const generateDonationInvoice = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const [username, domain] = donationAddress.split('@');
      
      if (!username || !domain) {
        throw new Error('Invalid Lightning Address format');
      }
      
      const wellKnownUrl = `https://${domain}/.well-known/lnurlp/${username}`;
      
      // Fetch LNURL metadata
      const metadataResponse = await fetch(wellKnownUrl);
      
      if (!metadataResponse.ok) {
        throw new Error('Failed to fetch Lightning Address metadata');
      }
      
      const lnurlData = await metadataResponse.json();
      
      if (lnurlData.tag !== 'payRequest') {
        throw new Error('Invalid Lightning Address');
      }
      
      // Generate invoice for 10 sats (10000 millisats)
      const payLink = `${lnurlData.callback}?amount=100000`;
      const invoiceResponse = await fetch(payLink);
      
      if (!invoiceResponse.ok) {
        throw new Error('Failed to generate invoice');
      }
      
      const invoiceData = await invoiceResponse.json();
      
      if (!invoiceData.pr) {
        throw new Error('No invoice returned from server');
      }
      
      const invoiceString = invoiceData.pr;
      setInvoice(invoiceString);
      
      // Wait a tick to ensure canvas ref is available
      setTimeout(() => {
        if (canvasRef.current) {
          QRCode.toCanvas(
            canvasRef.current, 
            invoiceString.toUpperCase(), 
            {
              width: 200,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#ffffff',
              },
              errorCorrectionLevel: 'M'
            },
            (error) => {
              if (error) {
                console.error('QR Code generation error:', error);
                setError('Failed to generate QR code');
              }
            }
          );
        }
      }, 100);
      
      setIsLoading(false);
      
    } catch (err: any) {
      console.error('Donation invoice error:', err);
      setError(err.message || 'Failed to generate donation invoice');
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invoice);
    alert('Donation invoice copied to clipboard!');
  };

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 border border-orange-100">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Heart className="w-6 h-6 text-red-500 fill-red-500" />
        <h2 className="text-2xl font-bold text-gray-800">Support LN Split</h2>
      </div>
      
      <p className="text-center text-gray-600 mb-6">
        Enjoying LN Split? Support development with a 100 sat donation! ⚡
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-center">
          <p className="text-sm">{error}</p>
          <button
            onClick={generateDonationInvoice}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-4 inline-block">
            <canvas 
              ref={canvasRef} 
              style={{ display: 'block' }}
            />
          </div>

          <div className="w-full max-w-md bg-gray-50 p-3 rounded-lg mb-4 break-all text-xs font-mono text-gray-600 max-h-24 overflow-y-auto">
            {invoice}
          </div>

          <button
            onClick={copyToClipboard}
            className="bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white py-2 px-6 rounded-lg transition-all text-sm font-medium shadow-md hover:shadow-lg"
          >
            Copy Donation Invoice
          </button>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Scan with your Lightning wallet or copy the invoice
          </p>
        </div>
      )}
    </div>
  );
}