// ============================================================================
// QR CODE GENERATOR COMPONENT
// Generates QR codes for cultures, grows, locations, etc.
// Uses the qrcode library for robust support of all QR versions
// ============================================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { useNotifications } from '../../store/NotificationContext';

// ============================================================================
// TYPES
// ============================================================================

export interface QRCodeData {
  type: 'culture' | 'grow' | 'location' | 'recipe' | 'inventory';
  id: string;
  label: string;
  metadata?: Record<string, string>;
}

interface QRCodeGeneratorProps {
  data: QRCodeData;
  size?: number;
  includeLabel?: boolean;
  onDownload?: (dataUrl: string) => void;
  className?: string;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Print: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  Copy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
};

// ============================================================================
// COMPONENT
// ============================================================================

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  data,
  size = 200,
  includeLabel = true,
  onDownload,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const { toast } = useNotifications();

  // Generate QR content
  const qrContent = useCallback(() => {
    const baseUrl = window.location.origin;
    const encodedData = btoa(JSON.stringify({
      t: data.type,
      i: data.id,
      l: data.label,
      ...data.metadata,
    }));
    return `${baseUrl}/#/qr/${encodedData}`;
  }, [data]);

  // Draw QR code using qrcode library
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const generateQR = async () => {
      try {
        const content = qrContent();

        // Calculate dimensions - use full size for QR when no label
        const qrSize = includeLabel ? size - 20 : size;
        const totalHeight = includeLabel ? size + 40 : size;

        canvas.width = includeLabel ? size : qrSize;
        canvas.height = totalHeight;

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Generate QR code to a temporary canvas
        const tempCanvas = document.createElement('canvas');
        await QRCode.toCanvas(tempCanvas, content, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });

        // Draw QR code (centered when includeLabel, otherwise fill)
        if (includeLabel) {
          const xOffset = (size - qrSize) / 2;
          const yOffset = (size - qrSize) / 2;
          ctx.drawImage(tempCanvas, xOffset, yOffset);
        } else {
          ctx.drawImage(tempCanvas, 0, 0);
        }

        // Draw label
        if (includeLabel) {
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 12px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(data.label, size / 2, size + 15);

          ctx.font = '10px system-ui, sans-serif';
          ctx.fillStyle = '#666666';
          ctx.fillText(data.type.toUpperCase(), size / 2, size + 30);
        }

        setQrDataUrl(canvas.toDataURL('image/png'));
      } catch (error) {
        console.error('QR code generation failed:', error);
        toast.error('QR Generation Failed', 'Could not generate QR code');
      }
    };

    generateQR();
  }, [data, size, includeLabel, qrContent, toast]);

  const handleDownload = () => {
    if (qrDataUrl) {
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `${data.type}-${data.label.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      link.click();
      toast.success('Downloaded', 'QR code saved');
      onDownload?.(qrDataUrl);
    }
  };

  const handlePrint = () => {
    if (qrDataUrl) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print QR Code - ${data.label}</title>
              <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                img { max-width: 100%; height: auto; }
                @media print { body { margin: 20px; } }
              </style>
            </head>
            <body>
              <img src="${qrDataUrl}" alt="QR Code for ${data.label}" />
              <script>window.onload = function() { window.print(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handleCopy = async () => {
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      toast.success('Copied', 'QR code copied to clipboard');
    } catch (error) {
      // Fallback: copy the URL
      await navigator.clipboard.writeText(qrContent());
      toast.success('Copied', 'QR code URL copied to clipboard');
    }
  };

  // Calculate display dimensions
  const displayWidth = includeLabel ? size : size;
  const displayHeight = includeLabel ? size + 40 : size;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {/* QR Code Canvas */}
      <div className={includeLabel ? "bg-white p-3 rounded-lg shadow-lg" : ""}>
        <canvas
          ref={canvasRef}
          className="block"
          style={{ width: displayWidth, height: displayHeight }}
        />
      </div>

      {/* Actions - only show when standalone */}
      {includeLabel && (
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors"
            title="Download"
          >
            <Icons.Download />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors"
            title="Print"
          >
            <Icons.Print />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors"
            title="Copy"
          >
            <Icons.Copy />
            <span className="hidden sm:inline">Copy</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
