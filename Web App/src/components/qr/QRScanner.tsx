// ============================================================================
// QR SCANNER COMPONENT
// Scans QR codes using device camera and navigates to records
// ============================================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode';
import { useData } from '../../store';
import { useNotifications } from '../../store/NotificationContext';
import type { QRCodeData } from './QRCodeGenerator';

// ============================================================================
// TYPES
// ============================================================================

interface QRScannerProps {
  onScanSuccess?: (data: QRCodeData) => void;
  onNavigate?: (page: string, entityId?: string) => void;
  className?: string;
}

interface ScannedRecord {
  data: QRCodeData;
  timestamp: Date;
  rawUrl: string;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Camera: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Stop: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="6" y="6" width="12" height="12" rx="2"/>
    </svg>
  ),
  QRCode: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
      <rect x="14" y="14" width="3" height="3"/>
      <rect x="18" y="14" width="3" height="3"/>
      <rect x="14" y="18" width="3" height="3"/>
      <rect x="18" y="18" width="3" height="3"/>
    </svg>
  ),
  ExternalLink: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  History: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  SwitchCamera: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M16 3h5v5"/>
      <path d="M8 21H3v-5"/>
      <path d="M21 3l-7 7"/>
      <path d="M3 21l7-7"/>
    </svg>
  ),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse QR code URL and extract data
 */
function parseQRUrl(url: string): QRCodeData | null {
  try {
    // Handle both full URLs and just the encoded data
    let encodedData = url;

    // Check if it's a full URL with our format
    if (url.includes('/#/qr/')) {
      const match = url.match(/#\/qr\/(.+)$/);
      if (match) {
        encodedData = match[1];
      }
    } else if (url.startsWith('http')) {
      // Not our QR format
      return null;
    }

    // Decode base64
    const jsonStr = atob(encodedData);
    const data = JSON.parse(jsonStr);

    // Validate required fields
    if (!data.t || !data.i || !data.l) {
      return null;
    }

    // Map abbreviated keys to full names
    const result: QRCodeData = {
      type: data.t as QRCodeData['type'],
      id: data.i,
      label: data.l,
    };

    // Add any extra metadata
    const { t, i, l, ...metadata } = data;
    if (Object.keys(metadata).length > 0) {
      result.metadata = metadata;
    }

    return result;
  } catch (error) {
    console.error('Failed to parse QR data:', error);
    return null;
  }
}

/**
 * Get display name for record type
 */
function getTypeDisplayName(type: QRCodeData['type']): string {
  const names: Record<QRCodeData['type'], string> = {
    culture: 'Culture',
    grow: 'Grow',
    location: 'Location',
    recipe: 'Recipe',
    inventory: 'Inventory Item',
  };
  return names[type] || type;
}

/**
 * Get page name for navigation
 */
function getPageForType(type: QRCodeData['type']): string {
  const pages: Record<QRCodeData['type'], string> = {
    culture: 'cultures',
    grow: 'grows',
    location: 'labmapping',
    recipe: 'recipes',
    inventory: 'inventory',
  };
  return pages[type] || 'dashboard';
}

/**
 * Get icon color for record type
 */
function getTypeColor(type: QRCodeData['type']): string {
  const colors: Record<QRCodeData['type'], string> = {
    culture: 'text-purple-400',
    grow: 'text-emerald-400',
    location: 'text-blue-400',
    recipe: 'text-amber-400',
    inventory: 'text-cyan-400',
  };
  return colors[type] || 'text-zinc-400';
}

// ============================================================================
// COMPONENT
// ============================================================================

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onNavigate,
  className = '',
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedRecord, setScannedRecord] = useState<ScannedRecord | null>(null);
  const [scanHistory, setScanHistory] = useState<ScannedRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  const { state } = useData();
  const { toast } = useNotifications();

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Get available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setAvailableCameras(devices.map(d => ({ id: d.id, label: d.label || `Camera ${d.id.slice(0, 8)}` })));
          // Prefer back camera on mobile
          const backCamera = devices.find(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCamera?.id || devices[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to get cameras:', err);
        setError('Unable to access camera. Please check permissions.');
      });
  }, []);

  // Validate scanned record against database
  const validateRecord = useCallback((data: QRCodeData): { found: boolean; name?: string } => {
    switch (data.type) {
      case 'culture': {
        const culture = state.cultures.find(c => c.id === data.id);
        return { found: !!culture, name: culture?.label };
      }
      case 'grow': {
        const grow = state.grows.find(g => g.id === data.id);
        return { found: !!grow, name: grow?.name };
      }
      case 'location': {
        const location = state.locations.find(l => l.id === data.id);
        return { found: !!location, name: location?.name };
      }
      case 'recipe': {
        const recipe = state.recipes.find(r => r.id === data.id);
        return { found: !!recipe, name: recipe?.name };
      }
      case 'inventory': {
        const item = state.inventoryItems.find((i: { id: string; name: string }) => i.id === data.id);
        return { found: !!item, name: item?.name };
      }
      default:
        return { found: false };
    }
  }, [state]);

  // Handle successful scan
  const handleScanSuccess = useCallback((decodedText: string) => {
    const data = parseQRUrl(decodedText);

    if (!data) {
      toast.warning('Invalid QR Code', 'This QR code is not recognized as a Sporely label.');
      return;
    }

    const record: ScannedRecord = {
      data,
      timestamp: new Date(),
      rawUrl: decodedText,
    };

    setScannedRecord(record);
    setScanHistory(prev => [record, ...prev.slice(0, 9)]); // Keep last 10 scans

    // Pause scanning after successful scan
    setIsPaused(true);

    // Notify callback
    onScanSuccess?.(data);

    // Show success toast
    const validation = validateRecord(data);
    if (validation.found) {
      toast.success('QR Code Scanned', `Found: ${validation.name || data.label}`);
    } else {
      toast.info('QR Code Scanned', `${getTypeDisplayName(data.type)}: ${data.label}`);
    }
  }, [onScanSuccess, toast, validateRecord]);

  // Start scanning
  const startScanning = useCallback(async () => {
    if (!selectedCameraId) {
      setError('No camera available');
      return;
    }

    setError(null);
    setScannedRecord(null);
    setIsPaused(false);
    setIsStarting(true);

    // Set scanning true FIRST so the container div is visible
    setIsScanning(true);

    // Wait for next render cycle so the div is visible
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        selectedCameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        handleScanSuccess,
        () => {} // Ignore scan failures (normal during scanning)
      );

      setIsStarting(false);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Failed to start camera. Please check permissions and try again.');
      setIsScanning(false);
      setIsStarting(false);
    }
  }, [selectedCameraId, handleScanSuccess]);

  // Stop scanning
  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
    setIsScanning(false);
    setIsStarting(false);
    setIsPaused(false);
  }, []);

  // Resume scanning after viewing result
  const resumeScanning = useCallback(async () => {
    setScannedRecord(null);
    setIsPaused(false);
  }, []);

  // Navigate to record
  const navigateToRecord = useCallback((record: ScannedRecord) => {
    const page = getPageForType(record.data.type);

    // Stop scanning before navigating
    stopScanning();

    // Call navigation callback first to change page
    onNavigate?.(page, record.data.id);

    // Dispatch select-item event after a short delay to allow page to load
    // This uses the existing event format that CultureManagement/GrowManagement already listens for
    setTimeout(() => {
      const selectEvent = new CustomEvent('sporely:select-item', {
        detail: {
          type: record.data.type,
          id: record.data.id,
        },
      });
      window.dispatchEvent(selectEvent);
    }, 150);
  }, [onNavigate, stopScanning]);

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (availableCameras.length < 2) return;

    const currentIndex = availableCameras.findIndex(c => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];

    // Stop current scanner
    if (isScanning) {
      await stopScanning();
    }

    setSelectedCameraId(nextCamera.id);

    // Restart with new camera
    setTimeout(() => {
      startScanning();
    }, 100);
  }, [availableCameras, selectedCameraId, isScanning, stopScanning, startScanning]);

  // Clear history
  const clearHistory = useCallback(() => {
    setScanHistory([]);
  }, []);

  return (
    <div className={`bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.QRCode />
          <h2 className="font-semibold">QR Scanner</h2>
        </div>
        <div className="flex items-center gap-2">
          {scanHistory.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition-colors ${
                showHistory
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'hover:bg-zinc-800 text-zinc-400'
              }`}
              title="Scan History"
            >
              <Icons.History />
            </button>
          )}
          {availableCameras.length > 1 && isScanning && (
            <button
              onClick={switchCamera}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors"
              title="Switch Camera"
            >
              <Icons.SwitchCamera />
            </button>
          )}
        </div>
      </div>

      {/* Scanner View */}
      {!showHistory && (
        <div className="relative">
          {/* Camera preview container - always rendered but visibility controlled */}
          <div
            id="qr-reader"
            className="w-full aspect-square bg-zinc-950"
            style={{ display: isScanning ? 'block' : 'none' }}
          />

          {/* Loading overlay while camera is starting */}
          {isStarting && (
            <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-zinc-400 text-sm">Starting camera...</p>
            </div>
          )}

          {/* Placeholder when not scanning */}
          {!isScanning && (
            <div className="w-full aspect-square bg-zinc-950 flex flex-col items-center justify-center gap-4 p-6">
              {error ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Icons.AlertCircle />
                  </div>
                  <p className="text-red-400 text-center text-sm">{error}</p>
                  <button
                    onClick={startScanning}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center">
                    <Icons.QRCode />
                  </div>
                  <p className="text-zinc-500 text-center text-sm">
                    Point your camera at a QR code to scan
                  </p>
                  {availableCameras.length > 0 && (
                    <button
                      onClick={startScanning}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Icons.Camera />
                      Start Scanning
                    </button>
                  )}
                  {availableCameras.length === 0 && (
                    <p className="text-amber-400 text-sm">
                      Waiting for camera access...
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Scanning overlay with result */}
          {scannedRecord && isPaused && (
            <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-6">
              <div className="w-full max-w-sm space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Icons.Check />
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-zinc-400 text-sm">Scanned</p>
                  <p className={`text-lg font-semibold ${getTypeColor(scannedRecord.data.type)}`}>
                    {getTypeDisplayName(scannedRecord.data.type)}
                  </p>
                  <p className="text-white font-mono mt-1">{scannedRecord.data.label}</p>
                </div>

                {/* Validation status */}
                {(() => {
                  const validation = validateRecord(scannedRecord.data);
                  return (
                    <div className={`text-center text-sm ${validation.found ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {validation.found
                        ? `Found in database: ${validation.name || scannedRecord.data.label}`
                        : 'Record not found in current database'
                      }
                    </div>
                  );
                })()}

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => navigateToRecord(scannedRecord)}
                    className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Icons.ExternalLink />
                    View Record
                  </button>
                  <button
                    onClick={resumeScanning}
                    className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Scan Another
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scan History */}
      {showHistory && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-zinc-400">Recent Scans</p>
            {scanHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Icons.Trash />
                Clear
              </button>
            )}
          </div>

          {scanHistory.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">No recent scans</p>
          ) : (
            <div className="space-y-2">
              {scanHistory.map((record, index) => {
                const validation = validateRecord(record.data);
                return (
                  <button
                    key={`${record.data.id}-${index}`}
                    onClick={() => navigateToRecord(record)}
                    className="w-full p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg text-left transition-colors flex items-center gap-3"
                  >
                    <div className={`w-2 h-2 rounded-full ${validation.found ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${getTypeColor(record.data.type)}`}>
                        {getTypeDisplayName(record.data.type)}
                      </p>
                      <p className="text-xs text-zinc-400 truncate font-mono">{record.data.label}</p>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <Icons.ExternalLink />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Footer Controls */}
      {!showHistory && isScanning && !isPaused && (
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={stopScanning}
            className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Icons.Stop />
            Stop Scanning
          </button>
        </div>
      )}

      {/* Camera selector (for debugging/advanced use) */}
      {availableCameras.length > 1 && !isScanning && (
        <div className="p-4 border-t border-zinc-800">
          <label className="text-xs text-zinc-500 block mb-2">Select Camera</label>
          <select
            value={selectedCameraId || ''}
            onChange={(e) => setSelectedCameraId(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {availableCameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
