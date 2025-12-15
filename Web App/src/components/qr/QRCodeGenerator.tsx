// ============================================================================
// QR CODE GENERATOR COMPONENT
// Generates QR codes for cultures, grows, locations, etc.
// Uses a lightweight QR code implementation
// ============================================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNotifications } from '../../store/NotificationContext';

// ============================================================================
// QR CODE MATRIX GENERATION
// Simple QR code generator for version 1-4 (data capacity varies by size)
// Based on ISO/IEC 18004:2015 specification
// ============================================================================

// GF(2^8) for Reed-Solomon
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

// Initialize Galois Field tables
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x >= 256) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function gfPolyMul(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return result;
}

function rsGeneratorPoly(nsym: number): number[] {
  let g = [1];
  for (let i = 0; i < nsym; i++) {
    g = gfPolyMul(g, [1, GF_EXP[i]]);
  }
  return g;
}

function rsEncode(data: number[], nsym: number): number[] {
  const gen = rsGeneratorPoly(nsym);
  const result = [...data, ...new Array(nsym).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const coef = result[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        result[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return result.slice(data.length);
}

// QR Code parameters by version
const QR_PARAMS: Record<number, { size: number; dataBytes: number; ecBytes: number; alignmentPattern?: number[] }> = {
  1: { size: 21, dataBytes: 19, ecBytes: 7 },
  2: { size: 25, dataBytes: 34, ecBytes: 10, alignmentPattern: [6, 18] },
  3: { size: 29, dataBytes: 55, ecBytes: 15, alignmentPattern: [6, 22] },
  4: { size: 33, dataBytes: 80, ecBytes: 20, alignmentPattern: [6, 26] },
};

function getMinVersion(dataLength: number): number {
  for (let v = 1; v <= 4; v++) {
    // Account for mode indicator (4 bits) and character count indicator (8 bits for byte mode)
    const capacity = QR_PARAMS[v].dataBytes - 2;
    if (dataLength <= capacity) return v;
  }
  throw new Error('Data too long for QR code');
}

function createQRMatrix(data: string): boolean[][] {
  const version = getMinVersion(data.length);
  const params = QR_PARAMS[version];
  const size = params.size;

  // Initialize matrix
  const matrix: (boolean | null)[][] = Array(size).fill(null).map(() => Array(size).fill(null));
  const reserved: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));

  // Add finder patterns
  const addFinderPattern = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (r === -1 || r === 7 || c === -1 || c === 7) {
            matrix[nr][nc] = false;
          } else if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[nr][nc] = true;
          } else {
            matrix[nr][nc] = false;
          }
          reserved[nr][nc] = true;
        }
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(0, size - 7);
  addFinderPattern(size - 7, 0);

  // Add timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
    reserved[6][i] = true;
    reserved[i][6] = true;
  }

  // Add alignment pattern (version 2+)
  if (params.alignmentPattern) {
    const centers = params.alignmentPattern;
    for (const row of centers) {
      for (const col of centers) {
        // Skip if overlapping with finder pattern
        if (reserved[row][col]) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const nr = row + r;
            const nc = col + c;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              matrix[nr][nc] = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
              reserved[nr][nc] = true;
            }
          }
        }
      }
    }
  }

  // Reserve format info areas
  for (let i = 0; i < 9; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
    if (i < 8) {
      reserved[8][size - 1 - i] = true;
      reserved[size - 1 - i][8] = true;
    }
  }
  matrix[size - 8][8] = true; // Dark module
  reserved[size - 8][8] = true;

  // Encode data in byte mode
  const dataCodewords: number[] = [];
  const modeIndicator = 0b0100; // Byte mode
  const charCount = data.length;

  // Add mode + count + data
  let bits = '';
  bits += modeIndicator.toString(2).padStart(4, '0');
  bits += charCount.toString(2).padStart(8, '0');
  for (let i = 0; i < data.length; i++) {
    bits += data.charCodeAt(i).toString(2).padStart(8, '0');
  }
  // Add terminator
  const totalBits = params.dataBytes * 8;
  bits += '0000';
  while (bits.length < totalBits) {
    bits += '11101100';
    if (bits.length < totalBits) bits += '00010001';
  }
  bits = bits.slice(0, totalBits);

  // Convert to bytes
  for (let i = 0; i < bits.length; i += 8) {
    dataCodewords.push(parseInt(bits.slice(i, i + 8), 2));
  }

  // Add error correction
  const ecCodewords = rsEncode(dataCodewords, params.ecBytes);
  const allCodewords = [...dataCodewords, ...ecCodewords];

  // Place data in matrix
  let bitIndex = 0;
  let direction = -1;
  let col = size - 1;

  while (col > 0) {
    if (col === 6) col--;
    for (let row = direction === -1 ? size - 1 : 0; direction === -1 ? row >= 0 : row < size; row += direction) {
      for (let c = col; c > col - 2; c--) {
        if (!reserved[row][c]) {
          if (bitIndex < allCodewords.length * 8) {
            const byteIndex = Math.floor(bitIndex / 8);
            const bitPos = 7 - (bitIndex % 8);
            matrix[row][c] = ((allCodewords[byteIndex] >> bitPos) & 1) === 1;
          }
          bitIndex++;
        }
      }
    }
    col -= 2;
    direction = -direction;
  }

  // Apply mask pattern 0 (checkerboard)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c]) {
        if ((r + c) % 2 === 0) {
          matrix[r][c] = !matrix[r][c];
        }
      }
    }
  }

  // Add format info (hardcoded for L error correction, mask 0)
  const formatBits = 0b111011111000100;
  const formatPositions = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >> (14 - i)) & 1) === 1;
    const [r, c] = formatPositions[i];
    matrix[r][c] = bit;
    if (i < 8) {
      matrix[size - 1 - i][8] = bit;
    } else {
      matrix[8][size - 15 + i] = bit;
    }
  }

  return matrix.map(row => row.map(cell => cell === true));
}

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

  // Draw QR code
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const content = qrContent();
      const matrix = createQRMatrix(content);
      const moduleCount = matrix.length;
      const moduleSize = Math.floor((size - 20) / moduleCount);
      const padding = Math.floor((size - moduleSize * moduleCount) / 2);

      canvas.width = size;
      canvas.height = includeLabel ? size + 40 : size;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR modules
      ctx.fillStyle = '#000000';
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (matrix[row][col]) {
            ctx.fillRect(
              padding + col * moduleSize,
              padding + row * moduleSize,
              moduleSize,
              moduleSize
            );
          }
        }
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

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {/* QR Code Canvas */}
      <div className="bg-white p-3 rounded-lg shadow-lg">
        <canvas
          ref={canvasRef}
          className="block"
          style={{ width: size, height: includeLabel ? size + 40 : size }}
        />
      </div>

      {/* Actions */}
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
    </div>
  );
};

export default QRCodeGenerator;
