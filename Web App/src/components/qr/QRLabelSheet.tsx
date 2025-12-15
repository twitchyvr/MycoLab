// ============================================================================
// QR LABEL SHEET COMPONENT
// Generates printable sheets of QR code labels
// ============================================================================

import React, { useState, useRef, useMemo } from 'react';
import { QRCodeGenerator, type QRCodeData } from './QRCodeGenerator';
import { useNotifications } from '../../store/NotificationContext';

// ============================================================================
// TYPES
// ============================================================================

interface QRLabelSheetProps {
  items: QRCodeData[];
  labelsPerRow?: number;
  labelSize?: number;
  showLabels?: boolean;
  className?: string;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Print: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  Grid: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

// ============================================================================
// COMPONENT
// ============================================================================

export const QRLabelSheet: React.FC<QRLabelSheetProps> = ({
  items,
  labelsPerRow = 3,
  labelSize = 150,
  showLabels = true,
  className = '',
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(items.map(i => i.id)));
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useNotifications();

  const selectedItemsList = useMemo(() => {
    return items.filter(item => selectedItems.has(item.id));
  }, [items, selectedItems]);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(items.map(i => i.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const handlePrint = () => {
    if (selectedItemsList.length === 0) {
      toast.warning('No items selected', 'Please select at least one item to print');
      return;
    }

    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Labels</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: system-ui, -apple-system, sans-serif;
                padding: 10mm;
              }
              .grid {
                display: grid;
                grid-template-columns: repeat(${labelsPerRow}, 1fr);
                gap: 5mm;
              }
              .label {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 3mm;
                border: 1px dashed #ccc;
                border-radius: 2mm;
                page-break-inside: avoid;
              }
              .label img {
                width: ${labelSize}px;
                height: auto;
              }
              .label-text {
                margin-top: 2mm;
                font-size: 10pt;
                font-weight: 600;
                text-align: center;
              }
              .label-type {
                font-size: 8pt;
                color: #666;
                text-transform: uppercase;
              }
              @media print {
                body { padding: 5mm; }
                .label { border-color: transparent; }
              }
            </style>
          </head>
          <body>
            <div class="grid">
              ${selectedItemsList.map(item => `
                <div class="label">
                  <div id="qr-${item.id}"></div>
                  ${showLabels ? `
                    <div class="label-text">${item.label}</div>
                    <div class="label-type">${item.type}</div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
            <script>
              // Generate QR codes
              window.onload = function() {
                setTimeout(function() { window.print(); }, 500);
              };
            </script>
          </body>
        </html>
      `);

      // Inject the actual QR code images
      selectedItemsList.forEach(item => {
        const qrElement = printContent.querySelector(`[data-item-id="${item.id}"] canvas`);
        if (qrElement) {
          const canvas = qrElement as HTMLCanvasElement;
          const img = printWindow.document.createElement('img');
          img.src = canvas.toDataURL('image/png');
          const target = printWindow.document.getElementById(`qr-${item.id}`);
          if (target) {
            target.appendChild(img);
          }
        }
      });

      printWindow.document.close();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-2">
          <Icons.Grid />
          <span className="text-white font-medium">
            {selectedItems.size} of {items.length} selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Deselect All
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
            disabled={selectedItems.size === 0}
          >
            <Icons.Print />
            <span>Print Labels</span>
          </button>
        </div>
      </div>

      {/* Item Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`
              relative p-3 rounded-lg border transition-all text-left
              ${selectedItems.has(item.id)
                ? 'bg-emerald-950/30 border-emerald-700 ring-1 ring-emerald-500/30'
                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
              }
            `}
          >
            {/* Selection indicator */}
            <div className={`
              absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center
              ${selectedItems.has(item.id)
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-700 text-zinc-500'
              }
            `}>
              {selectedItems.has(item.id) && <Icons.Check />}
            </div>

            <div className="text-sm font-medium text-white truncate pr-6">
              {item.label}
            </div>
            <div className="text-xs text-zinc-500 uppercase mt-0.5">
              {item.type}
            </div>
          </button>
        ))}
      </div>

      {/* Preview Grid (hidden, used for print) */}
      <div ref={printRef} className="hidden">
        {selectedItemsList.map(item => (
          <div key={item.id} data-item-id={item.id}>
            <QRCodeGenerator
              data={item}
              size={labelSize}
              includeLabel={showLabels}
            />
          </div>
        ))}
      </div>

      {/* Visual Preview */}
      {selectedItemsList.length > 0 && (
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <h4 className="text-sm font-medium text-zinc-400 mb-4">Preview</h4>
          <div
            className="grid gap-4 bg-white p-4 rounded-lg"
            style={{ gridTemplateColumns: `repeat(${Math.min(labelsPerRow, selectedItemsList.length)}, 1fr)` }}
          >
            {selectedItemsList.slice(0, 6).map(item => (
              <div key={item.id} className="flex flex-col items-center">
                <QRCodeGenerator
                  data={item}
                  size={Math.min(labelSize, 120)}
                  includeLabel={showLabels}
                />
              </div>
            ))}
            {selectedItemsList.length > 6 && (
              <div className="flex items-center justify-center text-zinc-500 text-sm">
                +{selectedItemsList.length - 6} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QRLabelSheet;
