// ============================================================================
// LABEL DESIGNER COMPONENT
// Design and print custom labels with QR codes
// ============================================================================

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useData } from '../../store';
import { useNotifications } from '../../store/NotificationContext';
import { QRCodeGenerator } from '../qr/QRCodeGenerator';
import type { Culture, Grow, Location } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

type LabelSize = 'small' | 'medium' | 'large' | 'custom';
type LabelType = 'culture' | 'grow' | 'location' | 'generic';
type PrinterType = 'standard' | 'thermal_2x1' | 'thermal_3x2' | 'thermal_4x6';

interface LabelTemplate {
  id: string;
  name: string;
  type: LabelType;
  size: LabelSize;
  width: number;  // mm
  height: number; // mm
  showQR: boolean;
  qrSize: number; // mm
  qrPosition: 'left' | 'right' | 'top' | 'bottom';
  fields: LabelField[];
  backgroundColor: string;
  borderColor: string;
  fontFamily: string;
}

interface LabelField {
  id: string;
  name: string;
  dataKey: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  position: { x: number; y: number }; // percentage
  maxWidth?: number;
  prefix?: string;
  suffix?: string;
}

interface LabelData {
  id: string;
  type: LabelType;
  name: string;
  fields: Record<string, string>;
}

interface LabelDesignerProps {
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LABEL_PRESETS: Record<PrinterType, { width: number; height: number; name: string }> = {
  standard: { width: 76.2, height: 50.8, name: 'Standard (3" x 2")' },
  thermal_2x1: { width: 50.8, height: 25.4, name: 'Thermal 2" x 1"' },
  thermal_3x2: { width: 76.2, height: 50.8, name: 'Thermal 3" x 2"' },
  thermal_4x6: { width: 152.4, height: 101.6, name: 'Thermal 4" x 6"' },
};

const DEFAULT_TEMPLATE: LabelTemplate = {
  id: 'default',
  name: 'Standard Label',
  type: 'culture',
  size: 'medium',
  width: 76.2,
  height: 50.8,
  showQR: true,
  qrSize: 25,
  qrPosition: 'left',
  fields: [
    { id: 'f1', name: 'Label', dataKey: 'label', fontSize: 14, fontWeight: 'bold', color: '#000', position: { x: 45, y: 15 } },
    { id: 'f2', name: 'Strain', dataKey: 'strain', fontSize: 11, fontWeight: 'normal', color: '#333', position: { x: 45, y: 35 } },
    { id: 'f3', name: 'Date', dataKey: 'date', fontSize: 10, fontWeight: 'normal', color: '#666', position: { x: 45, y: 55 }, prefix: 'Created: ' },
    { id: 'f4', name: 'Type', dataKey: 'type', fontSize: 9, fontWeight: 'normal', color: '#666', position: { x: 45, y: 75 } },
  ],
  backgroundColor: '#ffffff',
  borderColor: '#e5e5e5',
  fontFamily: 'system-ui, sans-serif',
};

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Printer: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  QrCode: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="4" height="4"/>
      <line x1="21" y1="14" x2="21" y2="14.01"/><line x1="14" y1="21" x2="14" y2="21.01"/>
      <line x1="21" y1="21" x2="21" y2="21.01"/>
    </svg>
  ),
  Tag: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  Layers: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function generateLabelData(
  item: Culture | Grow | Location,
  type: LabelType,
  strains: { id: string; name: string }[],
  species: { id: string; name: string }[]
): LabelData {
  if (type === 'culture') {
    const culture = item as Culture;
    const strain = strains.find(s => s.id === culture.strainId);
    return {
      id: culture.id,
      type: 'culture',
      name: culture.label,
      fields: {
        label: culture.label,
        strain: strain?.name || 'Unknown',
        date: formatDate(culture.createdAt),
        type: culture.type.replace('_', ' ').toUpperCase(),
        status: culture.status,
        generation: `Gen ${culture.generation}`,
      },
    };
  }

  if (type === 'grow') {
    const grow = item as Grow;
    const strain = strains.find(s => s.id === grow.strainId);
    return {
      id: grow.id,
      type: 'grow',
      name: grow.name,
      fields: {
        label: grow.name,
        strain: strain?.name || 'Unknown',
        date: formatDate(grow.spawnedAt),
        stage: grow.currentStage.toUpperCase(),
        status: grow.status,
      },
    };
  }

  if (type === 'location') {
    const location = item as Location;
    return {
      id: location.id,
      type: 'location',
      name: location.name,
      fields: {
        label: location.name,
        code: location.code || '',
        type: location.level?.toUpperCase() || 'LOCATION',
        purpose: location.roomPurpose?.toUpperCase() || '',
      },
    };
  }

  return {
    id: 'generic',
    type: 'generic',
    name: 'Label',
    fields: { label: 'Label', date: formatDate(new Date()) },
  };
}

// ============================================================================
// LABEL PREVIEW COMPONENT
// ============================================================================

interface LabelPreviewProps {
  template: LabelTemplate;
  data: LabelData;
  scale?: number;
  showGrid?: boolean;
}

const LabelPreview: React.FC<LabelPreviewProps> = ({
  template,
  data,
  scale = 3,
  showGrid = false,
}) => {
  const containerStyle: React.CSSProperties = {
    width: `${template.width * scale}px`,
    height: `${template.height * scale}px`,
    backgroundColor: template.backgroundColor,
    border: `1px solid ${template.borderColor}`,
    fontFamily: template.fontFamily,
    position: 'relative',
    overflow: 'hidden',
  };

  const qrSizePx = template.qrSize * scale;
  const padding = 2 * scale;

  const getQRPosition = (): React.CSSProperties => {
    switch (template.qrPosition) {
      case 'left':
        return { left: padding, top: '50%', transform: 'translateY(-50%)' };
      case 'right':
        return { right: padding, top: '50%', transform: 'translateY(-50%)' };
      case 'top':
        return { left: '50%', top: padding, transform: 'translateX(-50%)' };
      case 'bottom':
        return { left: '50%', bottom: padding, transform: 'translateX(-50%)' };
      default:
        return { left: padding, top: '50%', transform: 'translateY(-50%)' };
    }
  };

  return (
    <div style={containerStyle} className="rounded shadow-sm">
      {/* Grid overlay */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'linear-gradient(#0001 1px, transparent 1px), linear-gradient(90deg, #0001 1px, transparent 1px)',
            backgroundSize: `${10 * scale}px ${10 * scale}px`,
          }}
        />
      )}

      {/* QR Code */}
      {template.showQR && (
        <div
          className="absolute"
          style={{
            ...getQRPosition(),
            width: qrSizePx,
            height: qrSizePx,
          }}
        >
          <QRCodeGenerator
            data={{
              type: data.type as 'culture' | 'grow' | 'location' | 'recipe' | 'inventory',
              id: data.id,
              label: data.name,
            }}
            size={qrSizePx}
            includeLabel={false}
          />
        </div>
      )}

      {/* Text fields */}
      {template.fields.map(field => {
        const value = data.fields[field.dataKey] || '';
        const displayValue = `${field.prefix || ''}${value}${field.suffix || ''}`;

        return (
          <div
            key={field.id}
            className="absolute truncate"
            style={{
              left: `${field.position.x}%`,
              top: `${field.position.y}%`,
              transform: 'translateY(-50%)',
              fontSize: `${field.fontSize * (scale / 3)}px`,
              fontWeight: field.fontWeight,
              color: field.color,
              maxWidth: field.maxWidth ? `${field.maxWidth * scale}px` : '50%',
            }}
          >
            {displayValue}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// PRINT PREVIEW COMPONENT
// ============================================================================

interface PrintPreviewProps {
  labels: { template: LabelTemplate; data: LabelData }[];
  columns?: number;
  onClose: () => void;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({
  labels,
  columns = 2,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Labels</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, sans-serif; }
            .label-grid {
              display: grid;
              grid-template-columns: repeat(${columns}, 1fr);
              gap: 5mm;
              padding: 10mm;
            }
            .label {
              border: 1px solid #ddd;
              border-radius: 2mm;
              position: relative;
              overflow: hidden;
              page-break-inside: avoid;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .label-grid { padding: 5mm; gap: 3mm; }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icons.Printer />
            <h3 className="text-lg font-semibold text-white">Print Preview</h3>
            <span className="text-sm text-zinc-500">({labels.length} labels)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
            >
              <Icons.Printer />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Icons.X />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto p-4 bg-zinc-950">
          <div
            ref={printRef}
            className="bg-white rounded-lg p-4 mx-auto"
            style={{ maxWidth: '210mm' }}
          >
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {labels.map((item, idx) => (
                <LabelPreview
                  key={idx}
                  template={item.template}
                  data={item.data}
                  scale={2.5}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ITEM SELECTOR
// ============================================================================

interface ItemSelectorProps {
  type: LabelType;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const ItemSelector: React.FC<ItemSelectorProps> = ({
  type,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}) => {
  const { state, activeStrains } = useData();

  const items = useMemo(() => {
    if (type === 'culture') {
      return state.cultures
        .filter(c => c.status === 'active' || c.status === 'ready')
        .map(c => {
          const strain = activeStrains.find(s => s.id === c.strainId);
          return {
            id: c.id,
            name: c.label,
            subtitle: strain?.name || 'Unknown strain',
            type: c.type,
          };
        });
    }
    if (type === 'grow') {
      return state.grows
        .filter(g => g.status === 'active')
        .map(g => {
          const strain = activeStrains.find(s => s.id === g.strainId);
          return {
            id: g.id,
            name: g.name,
            subtitle: strain?.name || 'Unknown strain',
            type: g.currentStage,
          };
        });
    }
    if (type === 'location') {
      return state.locations
        .filter(l => l.isActive)
        .map(l => ({
          id: l.id,
          name: l.name,
          subtitle: l.code || l.level || '',
          type: l.roomPurpose || 'location',
        }));
    }
    return [];
  }, [type, state, activeStrains]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {selectedIds.size} of {items.length} selected
        </p>
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="text-xs text-emerald-400 hover:text-emerald-300"
          >
            Select All
          </button>
          <span className="text-zinc-600">|</span>
          <button
            onClick={onDeselectAll}
            className="text-xs text-zinc-400 hover:text-zinc-300"
          >
            Deselect All
          </button>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1">
        {items.map(item => (
          <label
            key={item.id}
            className={`
              flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors
              ${selectedIds.has(item.id)
                ? 'bg-emerald-950/30 border border-emerald-800'
                : 'bg-zinc-800/30 border border-transparent hover:bg-zinc-800/50'
              }
            `}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(item.id)}
              onChange={() => onToggle(item.id)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border flex items-center justify-center ${
              selectedIds.has(item.id)
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-zinc-600'
            }`}>
              {selectedIds.has(item.id) && <Icons.Check />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{item.name}</p>
              <p className="text-xs text-zinc-500 truncate">{item.subtitle}</p>
            </div>
            <span className="text-xs text-zinc-600 capitalize">{item.type}</span>
          </label>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-sm">
            No {type}s available
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// TEMPLATE EDITOR
// ============================================================================

interface TemplateEditorProps {
  template: LabelTemplate;
  onChange: (template: LabelTemplate) => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onChange }) => {
  return (
    <div className="space-y-4">
      {/* Size presets */}
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-2">Label Size</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(LABEL_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => onChange({ ...template, width: preset.width, height: preset.height })}
              className={`
                px-3 py-2 rounded-lg text-xs text-left transition-colors
                ${template.width === preset.width && template.height === preset.height
                  ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-400'
                  : 'bg-zinc-800/50 border border-zinc-700 text-zinc-400 hover:border-zinc-600'
                }
              `}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* QR Settings */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-2">
          <input
            type="checkbox"
            checked={template.showQR}
            onChange={(e) => onChange({ ...template, showQR: e.target.checked })}
            className="rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
          />
          Show QR Code
        </label>

        {template.showQR && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Size (mm)</label>
              <input
                type="number"
                value={template.qrSize}
                onChange={(e) => onChange({ ...template, qrSize: parseInt(e.target.value) || 20 })}
                className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                min={10}
                max={50}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Position</label>
              <select
                value={template.qrPosition}
                onChange={(e) => onChange({ ...template, qrPosition: e.target.value as 'left' | 'right' | 'top' | 'bottom' })}
                className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Background</label>
          <input
            type="color"
            value={template.backgroundColor}
            onChange={(e) => onChange({ ...template, backgroundColor: e.target.value })}
            className="w-full h-8 rounded border border-zinc-700 cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Border</label>
          <input
            type="color"
            value={template.borderColor}
            onChange={(e) => onChange({ ...template, borderColor: e.target.value })}
            className="w-full h-8 rounded border border-zinc-700 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LabelDesigner: React.FC<LabelDesignerProps> = ({ className = '' }) => {
  const { state, activeStrains } = useData();
  const { toast } = useNotifications();

  const [labelType, setLabelType] = useState<LabelType>('culture');
  const [template, setTemplate] = useState<LabelTemplate>(DEFAULT_TEMPLATE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [printColumns, setPrintColumns] = useState(2);

  // Get selected items as label data
  const selectedLabels = useMemo(() => {
    const items: { template: LabelTemplate; data: LabelData }[] = [];

    selectedIds.forEach(id => {
      let item: Culture | Grow | Location | undefined;

      if (labelType === 'culture') {
        item = state.cultures.find(c => c.id === id);
      } else if (labelType === 'grow') {
        item = state.grows.find(g => g.id === id);
      } else if (labelType === 'location') {
        item = state.locations.find(l => l.id === id);
      }

      if (item) {
        const data = generateLabelData(
          item,
          labelType,
          activeStrains,
          state.species
        );
        items.push({ template, data });
      }
    });

    return items;
  }, [selectedIds, labelType, state, activeStrains, template]);

  // Preview data
  const previewData = useMemo(() => {
    if (selectedLabels.length > 0) {
      return selectedLabels[0].data;
    }
    // Default preview
    return {
      id: 'preview',
      type: labelType,
      name: 'Sample Label',
      fields: {
        label: 'LC-241215-001',
        strain: 'Blue Oyster',
        date: formatDate(new Date()),
        type: 'LIQUID CULTURE',
        status: 'active',
        generation: 'Gen 1',
        code: 'GR-1',
        stage: 'FRUITING',
        purpose: 'GROW ROOM',
      },
    };
  }, [selectedLabels, labelType]);

  const handleToggleId = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (labelType === 'culture') {
      setSelectedIds(new Set(state.cultures.filter(c => c.status === 'active' || c.status === 'ready').map(c => c.id)));
    } else if (labelType === 'grow') {
      setSelectedIds(new Set(state.grows.filter(g => g.status === 'active').map(g => g.id)));
    } else if (labelType === 'location') {
      setSelectedIds(new Set(state.locations.filter(l => l.isActive).map(l => l.id)));
    }
  }, [labelType, state]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleTypeChange = useCallback((type: LabelType) => {
    setLabelType(type);
    setSelectedIds(new Set());
    // Update template for type
    const typeFields: Record<LabelType, LabelField[]> = {
      culture: [
        { id: 'f1', name: 'Label', dataKey: 'label', fontSize: 14, fontWeight: 'bold', color: '#000', position: { x: 45, y: 15 } },
        { id: 'f2', name: 'Strain', dataKey: 'strain', fontSize: 11, fontWeight: 'normal', color: '#333', position: { x: 45, y: 35 } },
        { id: 'f3', name: 'Date', dataKey: 'date', fontSize: 10, fontWeight: 'normal', color: '#666', position: { x: 45, y: 55 }, prefix: 'Created: ' },
        { id: 'f4', name: 'Type', dataKey: 'type', fontSize: 9, fontWeight: 'normal', color: '#666', position: { x: 45, y: 75 } },
      ],
      grow: [
        { id: 'f1', name: 'Name', dataKey: 'label', fontSize: 14, fontWeight: 'bold', color: '#000', position: { x: 45, y: 15 } },
        { id: 'f2', name: 'Strain', dataKey: 'strain', fontSize: 11, fontWeight: 'normal', color: '#333', position: { x: 45, y: 35 } },
        { id: 'f3', name: 'Date', dataKey: 'date', fontSize: 10, fontWeight: 'normal', color: '#666', position: { x: 45, y: 55 }, prefix: 'Spawned: ' },
        { id: 'f4', name: 'Stage', dataKey: 'stage', fontSize: 9, fontWeight: 'normal', color: '#059669', position: { x: 45, y: 75 } },
      ],
      location: [
        { id: 'f1', name: 'Name', dataKey: 'label', fontSize: 14, fontWeight: 'bold', color: '#000', position: { x: 45, y: 20 } },
        { id: 'f2', name: 'Code', dataKey: 'code', fontSize: 16, fontWeight: 'bold', color: '#333', position: { x: 45, y: 50 } },
        { id: 'f3', name: 'Type', dataKey: 'type', fontSize: 10, fontWeight: 'normal', color: '#666', position: { x: 45, y: 75 } },
      ],
      generic: [
        { id: 'f1', name: 'Label', dataKey: 'label', fontSize: 14, fontWeight: 'bold', color: '#000', position: { x: 50, y: 50 } },
      ],
    };
    setTemplate(t => ({ ...t, type, fields: typeFields[type] }));
  }, []);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Left Panel - Label Type & Items */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-950/50 border border-pink-800 flex items-center justify-center text-pink-400">
                <Icons.Tag />
              </div>
              <div>
                <h3 className="font-semibold text-white">Label Designer</h3>
                <p className="text-xs text-zinc-500">Create and print labels with QR codes</p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Icons.Settings />
            </button>
          </div>

          {/* Label Type Tabs */}
          <div className="flex gap-2">
            {(['culture', 'grow', 'location'] as const).map(type => (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize
                  ${labelType === type
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }
                `}
              >
                {type}s
              </button>
            ))}
          </div>
        </div>

        {/* Template Settings (collapsible) */}
        {showSettings && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <h4 className="font-medium text-white mb-4">Template Settings</h4>
            <TemplateEditor template={template} onChange={setTemplate} />
          </div>
        )}

        {/* Item Selection */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h4 className="font-medium text-white mb-4">Select Items to Label</h4>
          <ItemSelector
            type={labelType}
            selectedIds={selectedIds}
            onToggle={handleToggleId}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
          />
        </div>
      </div>

      {/* Right Panel - Preview & Actions */}
      <div className="space-y-4">
        {/* Preview */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h4 className="font-medium text-white mb-4 flex items-center gap-2">
            <Icons.Tag />
            Preview
          </h4>
          <div className="flex justify-center p-4 bg-zinc-950 rounded-lg">
            <LabelPreview template={template} data={previewData} scale={3} />
          </div>
        </div>

        {/* Print Options */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h4 className="font-medium text-white mb-4">Print Options</h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Labels per row</label>
              <select
                value={printColumns}
                onChange={(e) => setPrintColumns(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
              >
                <option value={1}>1 column</option>
                <option value={2}>2 columns</option>
                <option value={3}>3 columns</option>
                <option value={4}>4 columns</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  if (selectedIds.size === 0) {
                    toast.warning('Select at least one item to print');
                    return;
                  }
                  setShowPrintPreview(true);
                }}
                disabled={selectedIds.size === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
              >
                <Icons.Printer />
                Print {selectedIds.size > 0 ? `${selectedIds.size} Labels` : 'Labels'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{selectedIds.size}</p>
              <p className="text-xs text-zinc-500">Selected</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">
                {Math.ceil(selectedIds.size / printColumns)}
              </p>
              <p className="text-xs text-zinc-500">Sheets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <PrintPreview
          labels={selectedLabels}
          columns={printColumns}
          onClose={() => setShowPrintPreview(false)}
        />
      )}
    </div>
  );
};

export default LabelDesigner;
