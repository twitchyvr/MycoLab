// ============================================================================
// PHOTO UPLOAD COMPONENT
// Handles image upload with mobile-friendly camera support
// ============================================================================

import React, { useRef, useState, useCallback } from 'react';
import { useNotifications } from '../../store/NotificationContext';

// ============================================================================
// TYPES
// ============================================================================

export interface PhotoData {
  id: string;
  dataUrl: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  capturedAt: Date;
  thumbnail?: string;
}

interface PhotoUploadProps {
  onPhotoCapture: (photo: PhotoData) => void;
  onPhotosCapture?: (photos: PhotoData[]) => void;
  multiple?: boolean;
  maxSizeKB?: number;
  maxWidth?: number;
  className?: string;
  buttonLabel?: string;
  disabled?: boolean;
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
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  Image: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
};

// ============================================================================
// UTILITIES
// ============================================================================

const generateId = () => `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const compressImage = async (
  file: File,
  maxWidth: number,
  maxSizeKB: number,
  quality = 0.8
): Promise<{ dataUrl: string; width: number; height: number; thumbnail: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to target size
        let currentQuality = quality;
        let dataUrl = canvas.toDataURL('image/jpeg', currentQuality);

        // Reduce quality until under size limit
        while (dataUrl.length > maxSizeKB * 1024 * 1.37 && currentQuality > 0.1) {
          currentQuality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        }

        // Generate thumbnail (200px max)
        const thumbCanvas = document.createElement('canvas');
        const thumbCtx = thumbCanvas.getContext('2d');
        if (thumbCtx) {
          const thumbSize = 200;
          let thumbWidth = width;
          let thumbHeight = height;
          if (width > thumbSize || height > thumbSize) {
            if (width > height) {
              thumbHeight = (height * thumbSize) / width;
              thumbWidth = thumbSize;
            } else {
              thumbWidth = (width * thumbSize) / height;
              thumbHeight = thumbSize;
            }
          }
          thumbCanvas.width = thumbWidth;
          thumbCanvas.height = thumbHeight;
          thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
        }
        const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.6);

        resolve({ dataUrl, width, height, thumbnail });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// ============================================================================
// COMPONENT
// ============================================================================

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onPhotoCapture,
  onPhotosCapture,
  multiple = false,
  maxSizeKB = 500, // Default 500KB per image
  maxWidth = 1200, // Default max width 1200px
  className = '',
  buttonLabel = 'Add Photo',
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useNotifications();

  const processFiles = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const photos: PhotoData[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.warning('Invalid file', `${file.name} is not an image`);
          continue;
        }

        try {
          const { dataUrl, width, height, thumbnail } = await compressImage(
            file,
            maxWidth,
            maxSizeKB
          );

          const photo: PhotoData = {
            id: generateId(),
            dataUrl,
            filename: file.name,
            mimeType: 'image/jpeg',
            size: Math.round(dataUrl.length * 0.73), // Approximate decoded size
            width,
            height,
            capturedAt: new Date(),
            thumbnail,
          };

          photos.push(photo);
        } catch (err) {
          toast.error('Upload failed', `Could not process ${file.name}`);
        }
      }

      if (photos.length > 0) {
        if (multiple && onPhotosCapture) {
          onPhotosCapture(photos);
        } else if (photos[0]) {
          onPhotoCapture(photos[0]);
        }
        toast.success('Photo added', `${photos.length} photo${photos.length > 1 ? 's' : ''} uploaded`);
      }
    } finally {
      setIsProcessing(false);
      // Reset file inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  }, [maxSizeKB, maxWidth, multiple, onPhotoCapture, onPhotosCapture, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className={`${className}`}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isProcessing}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isProcessing}
      />

      {/* Upload buttons */}
      <div
        className="flex flex-col sm:flex-row gap-2"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Camera button (mobile-friendly) */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled || isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors sm:hidden"
        >
          <Icons.Camera />
          <span>Take Photo</span>
        </button>

        {/* File upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Icons.Image />
              <span>{buttonLabel}</span>
            </>
          )}
        </button>
      </div>

      {/* Drop zone hint (desktop) */}
      <p className="hidden sm:block text-xs text-zinc-500 mt-2 text-center">
        or drag and drop images here
      </p>
    </div>
  );
};

export default PhotoUpload;
