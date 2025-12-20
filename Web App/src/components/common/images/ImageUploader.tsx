// ============================================================================
// IMAGE UPLOADER COMPONENT
// Reusable component for uploading images to Supabase Storage
// ============================================================================

import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface ImageUploaderProps {
  /** Array of existing image URLs */
  images?: string[];
  /** Single primary image URL */
  primaryImage?: string;
  /** Called when images array changes */
  onImagesChange?: (images: string[]) => void;
  /** Called when primary image changes */
  onPrimaryImageChange?: (url: string | undefined) => void;
  /** Storage bucket name */
  bucket?: string;
  /** Folder path within the bucket */
  folder?: string;
  /** Maximum number of images allowed */
  maxImages?: number;
  /** Maximum file size in MB */
  maxSizeMb?: number;
  /** Accepted file types */
  acceptedTypes?: string[];
  /** Label for the upload button */
  label?: string;
  /** Whether to show the primary image selector */
  showPrimarySelector?: boolean;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Compress and resize image if it exceeds max dimensions
 */
async function compressImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a unique filename for the upload
 */
function generateFilename(originalName: string, folder: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${folder}/${timestamp}-${random}.${ext}`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images = [],
  primaryImage,
  onImagesChange,
  onPrimaryImageChange,
  bucket = 'mycolab-images',
  folder = 'uploads',
  maxImages = 10,
  maxSizeMb = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  label = 'Add Photos',
  showPrimarySelector = true,
  disabled = false,
  className = '',
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload a single file
  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    if (!supabase) {
      setUploadState(prev => ({ ...prev, error: 'Not connected to database' }));
      return null;
    }

    try {
      // Validate file type
      if (!acceptedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} not supported`);
      }

      // Validate file size
      if (file.size > maxSizeMb * 1024 * 1024) {
        throw new Error(`File size exceeds ${maxSizeMb}MB limit`);
      }

      // Compress image if needed
      const compressedBlob = await compressImage(file);
      const filename = generateFilename(file.name, folder);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filename, compressedBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      setUploadState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Upload failed',
      }));
      return null;
    }
  }, [bucket, folder, maxSizeMb, acceptedTypes]);

  // Handle file selection
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check max images limit
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      setUploadState(prev => ({
        ...prev,
        error: `Maximum ${maxImages} images allowed`,
      }));
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    setUploadState({ isUploading: true, progress: 0, error: null });

    const uploadedUrls: string[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const url = await uploadFile(filesToUpload[i]);
      if (url) {
        uploadedUrls.push(url);
      }
      setUploadState(prev => ({
        ...prev,
        progress: ((i + 1) / filesToUpload.length) * 100,
      }));
    }

    setUploadState({ isUploading: false, progress: 100, error: null });

    if (uploadedUrls.length > 0) {
      const newImages = [...images, ...uploadedUrls];
      onImagesChange?.(newImages);

      // Set first uploaded image as primary if none exists
      if (!primaryImage && uploadedUrls.length > 0) {
        onPrimaryImageChange?.(uploadedUrls[0]);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [images, maxImages, uploadFile, onImagesChange, primaryImage, onPrimaryImageChange]);

  // Handle removing an image
  const handleRemoveImage = useCallback((urlToRemove: string) => {
    const newImages = images.filter(url => url !== urlToRemove);
    onImagesChange?.(newImages);

    // Update primary image if it was removed
    if (primaryImage === urlToRemove) {
      onPrimaryImageChange?.(newImages.length > 0 ? newImages[0] : undefined);
    }
  }, [images, primaryImage, onImagesChange, onPrimaryImageChange]);

  // Handle setting primary image
  const handleSetPrimary = useCallback((url: string) => {
    onPrimaryImageChange?.(url);
  }, [onPrimaryImageChange]);

  // Trigger file input click
  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled || uploadState.isUploading || images.length >= maxImages}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700
                     disabled:bg-zinc-900 disabled:text-zinc-600 disabled:cursor-not-allowed
                     text-zinc-200 rounded-lg transition-colors border border-zinc-700"
        >
          {uploadState.isUploading ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Uploading {Math.round(uploadState.progress)}%</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>{label}</span>
            </>
          )}
        </button>
        <span className="text-sm text-zinc-500">
          {images.length}/{maxImages} photos
        </span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message */}
      {uploadState.error && (
        <div className="text-sm text-red-400 bg-red-950/50 px-3 py-2 rounded-lg">
          {uploadState.error}
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {images.map((url, index) => (
            <div
              key={url}
              className={`relative group aspect-square rounded-lg overflow-hidden border-2
                         ${primaryImage === url ? 'border-emerald-500' : 'border-zinc-700'}`}
            >
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100
                            transition-opacity flex items-center justify-center gap-2">
                {/* Set as primary button */}
                {showPrimarySelector && primaryImage !== url && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(url)}
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-full text-white"
                    title="Set as primary"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(url)}
                  className="p-1.5 bg-red-600 hover:bg-red-500 rounded-full text-white"
                  title="Remove"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>

              {/* Primary badge */}
              {primaryImage === url && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-600 rounded text-xs text-white font-medium">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !uploadState.isUploading && (
        <div
          onClick={handleButtonClick}
          className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center
                     cursor-pointer hover:border-zinc-600 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               className="w-10 h-10 mx-auto mb-2 text-zinc-500">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-zinc-400 text-sm">Click or drag to upload photos</p>
          <p className="text-zinc-500 text-xs mt-1">
            Max {maxSizeMb}MB per file, {acceptedTypes.map(t => t.split('/')[1]).join(', ')} formats
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
