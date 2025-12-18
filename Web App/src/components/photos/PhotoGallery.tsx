// ============================================================================
// PHOTO GALLERY COMPONENT
// Displays photos in a grid/timeline with lightbox view
// ============================================================================

import React, { useState, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import type { PhotoData } from './PhotoUpload';

// ============================================================================
// TYPES
// ============================================================================

interface PhotoGalleryProps {
  photos: PhotoData[];
  onDelete?: (photoId: string) => void;
  showDates?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
  emptyMessage?: string;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Image: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-12 h-12">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
};

// ============================================================================
// LIGHTBOX COMPONENT
// ============================================================================

interface LightboxProps {
  photos: PhotoData[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDelete?: (photoId: string) => void;
}

const Lightbox: React.FC<LightboxProps> = ({
  photos,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  onDelete,
}) => {
  const photo = photos[currentIndex];
  if (!photo) return null;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onPrev, onNext]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = photo.filename || `photo-${format(photo.capturedAt, 'yyyy-MM-dd-HHmmss')}.jpg`;
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors z-10"
        aria-label="Close"
      >
        <Icons.X />
      </button>

      {/* Navigation arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors z-10"
            aria-label="Previous"
          >
            <Icons.ChevronLeft />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors z-10"
            aria-label="Next"
          >
            <Icons.ChevronRight />
          </button>
        </>
      )}

      {/* Image */}
      <div
        className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.dataUrl}
          alt={photo.filename}
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
      </div>

      {/* Bottom toolbar */}
      <div
        className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="text-white/80 text-sm">
            <p className="flex items-center gap-2">
              <Icons.Calendar />
              {format(new Date(photo.capturedAt), 'MMM d, yyyy h:mm a')}
            </p>
            {photos.length > 1 && (
              <p className="text-white/50 mt-1">
                {currentIndex + 1} of {photos.length}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Download"
            >
              <Icons.Download />
            </button>
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm('Delete this photo?')) {
                    onDelete(photo.id);
                    if (photos.length === 1) {
                      onClose();
                    }
                  }
                }}
                className="p-2 text-red-400 hover:text-red-300 bg-white/10 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Delete"
              >
                <Icons.Trash />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onDelete,
  showDates = true,
  columns = 3,
  className = '',
  emptyMessage = 'No photos yet',
}) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Sort photos by date (newest first)
  const sortedPhotos = [...photos].sort(
    (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
  );

  // Group photos by date for timeline view
  const groupedPhotos = sortedPhotos.reduce((groups, photo) => {
    const date = format(new Date(photo.capturedAt), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(photo);
    return groups;
  }, {} as Record<string, PhotoData[]>);

  const handlePrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : sortedPhotos.length - 1);
    }
  };

  const handleNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex < sortedPhotos.length - 1 ? lightboxIndex + 1 : 0);
    }
  };

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  if (sortedPhotos.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-600">
          <Icons.Image />
        </div>
        <p className="text-zinc-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {showDates ? (
        // Timeline view with date headers
        <div className="space-y-6">
          {Object.entries(groupedPhotos).map(([date, datePhotos]) => (
            <div key={date}>
              <h4 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <Icons.Calendar />
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                <span className="text-zinc-600">({datePhotos.length})</span>
              </h4>
              <div className={`grid ${gridCols[columns]} gap-2 sm:gap-3`}>
                {datePhotos.map((photo) => {
                  const photoIndex = sortedPhotos.findIndex(p => p.id === photo.id);
                  return (
                    <PhotoThumbnail
                      key={photo.id}
                      photo={photo}
                      onClick={() => setLightboxIndex(photoIndex)}
                      onDelete={onDelete}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Simple grid view
        <div className={`grid ${gridCols[columns]} gap-2 sm:gap-3`}>
          {sortedPhotos.map((photo, index) => (
            <PhotoThumbnail
              key={photo.id}
              photo={photo}
              onClick={() => setLightboxIndex(index)}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={sortedPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={handlePrev}
          onNext={handleNext}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};

// ============================================================================
// THUMBNAIL COMPONENT
// ============================================================================

interface PhotoThumbnailProps {
  photo: PhotoData;
  onClick: () => void;
  onDelete?: (photoId: string) => void;
}

const PhotoThumbnail: React.FC<PhotoThumbnailProps> = ({ photo, onClick, onDelete }) => {
  return (
    <div className="relative group aspect-square">
      <button
        onClick={onClick}
        className="w-full h-full rounded-lg overflow-hidden bg-zinc-800 hover:ring-2 hover:ring-emerald-500/50 transition-all"
      >
        <img
          src={photo.thumbnail || photo.dataUrl}
          alt={photo.filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </button>

      {/* Delete button overlay */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Delete this photo?')) {
              onDelete(photo.id);
            }
          }}
          className="absolute top-1 right-1 p-1.5 bg-black/60 hover:bg-red-500/80 text-white/80 hover:text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete"
        >
          <Icons.Trash />
        </button>
      )}

      {/* Time badge */}
      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] text-white/80 bg-black/60 rounded">
        {formatDistanceToNow(new Date(photo.capturedAt), { addSuffix: true })}
      </div>
    </div>
  );
};

export default PhotoGallery;
