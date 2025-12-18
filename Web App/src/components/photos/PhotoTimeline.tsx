// ============================================================================
// PHOTO TIMELINE COMPONENT
// Shows photo progression for a culture or grow over time
// ============================================================================

import React, { useState, useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import { PhotoUpload, type PhotoData } from './PhotoUpload';
import { PhotoGallery } from './PhotoGallery';
import { useNotifications } from '../../store/NotificationContext';

// ============================================================================
// TYPES
// ============================================================================

interface PhotoTimelineProps {
  entityType: 'culture' | 'grow';
  entityId: string;
  entityName: string;
  startDate: Date;
  photos: PhotoData[];
  onAddPhoto: (photo: PhotoData) => void;
  onDeletePhoto?: (photoId: string) => void;
  className?: string;
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
  Timeline: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="12" y1="20" x2="12" y2="10"/>
      <line x1="18" y1="20" x2="18" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="16"/>
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
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  ChevronUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
};

// ============================================================================
// COMPONENT
// ============================================================================

export const PhotoTimeline: React.FC<PhotoTimelineProps> = ({
  entityType,
  entityId,
  entityName,
  startDate,
  photos,
  onAddPhoto,
  onDeletePhoto,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [isExpanded, setIsExpanded] = useState(true);
  const { toast } = useNotifications();

  // Calculate day number for each photo
  const photosWithDays = useMemo(() => {
    return photos.map(photo => ({
      ...photo,
      dayNumber: differenceInDays(new Date(photo.capturedAt), new Date(startDate)) + 1,
    }));
  }, [photos, startDate]);

  // Group by day number for timeline view
  const groupedByDay = useMemo(() => {
    const groups: Record<number, (PhotoData & { dayNumber: number })[]> = {};
    photosWithDays.forEach(photo => {
      if (!groups[photo.dayNumber]) {
        groups[photo.dayNumber] = [];
      }
      groups[photo.dayNumber].push(photo);
    });
    // Sort groups by day number descending (most recent first)
    return Object.entries(groups)
      .map(([day, dayPhotos]) => ({ day: parseInt(day), photos: dayPhotos }))
      .sort((a, b) => b.day - a.day);
  }, [photosWithDays]);

  const handleAddPhoto = (photo: PhotoData) => {
    onAddPhoto(photo);
  };

  const totalPhotos = photos.length;
  const daysWithPhotos = new Set(photosWithDays.map(p => p.dayNumber)).size;

  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-950/50 border border-blue-800 flex items-center justify-center text-blue-400">
              <Icons.Camera />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-white">Photo Timeline</h3>
              <p className="text-xs text-zinc-500">
                {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''} across {daysWithPhotos} day{daysWithPhotos !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded && (
              <div className="flex bg-zinc-800 rounded-lg p-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); setViewMode('timeline'); }}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'timeline'
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Timeline view"
                >
                  <Icons.Timeline />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setViewMode('grid'); }}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Grid view"
                >
                  <Icons.Grid />
                </button>
              </div>
            )}
            <span className="text-zinc-400">
              {isExpanded ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
            </span>
          </div>
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Upload section */}
          <PhotoUpload
            onPhotoCapture={handleAddPhoto}
            buttonLabel="Add Photo"
          />

          {/* Photos display */}
          {photos.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-zinc-500 text-sm">
                No photos yet. Start documenting your {entityType}'s progress!
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <PhotoGallery
              photos={photos}
              onDelete={onDeletePhoto}
              showDates
              columns={3}
            />
          ) : (
            // Timeline view
            <div className="space-y-4">
              {groupedByDay.map(({ day, photos: dayPhotos }) => (
                <div key={day} className="relative">
                  {/* Day marker */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-950/50 border border-emerald-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-400 font-bold text-sm">
                        D{day}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Day {day}</p>
                      <p className="text-xs text-zinc-500">
                        {format(new Date(dayPhotos[0].capturedAt), 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-xs text-zinc-600 ml-auto">
                      {dayPhotos.length} photo{dayPhotos.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Photos for this day */}
                  <div className="ml-6 pl-6 border-l border-zinc-800">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {dayPhotos.map((photo) => (
                        <PhotoThumbnailWithTime
                          key={photo.id}
                          photo={photo}
                          onDelete={onDeletePhoto}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// THUMBNAIL WITH TIME
// ============================================================================

interface PhotoThumbnailWithTimeProps {
  photo: PhotoData;
  onDelete?: (photoId: string) => void;
}

const PhotoThumbnailWithTime: React.FC<PhotoThumbnailWithTimeProps> = ({ photo, onDelete }) => {
  const [showLightbox, setShowLightbox] = useState(false);

  return (
    <>
      <div className="relative group aspect-square">
        <button
          onClick={() => setShowLightbox(true)}
          className="w-full h-full rounded-lg overflow-hidden bg-zinc-800 hover:ring-2 hover:ring-emerald-500/50 transition-all"
        >
          <img
            src={photo.thumbnail || photo.dataUrl}
            alt={photo.filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </button>

        {/* Delete button */}
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        )}

        {/* Time badge */}
        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] text-white/80 bg-black/60 rounded">
          {format(new Date(photo.capturedAt), 'h:mm a')}
        </div>
      </div>

      {/* Simple lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <img
            src={photo.dataUrl}
            alt={photo.filename}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-sm">
            {format(new Date(photo.capturedAt), 'EEEE, MMMM d, yyyy h:mm a')}
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoTimeline;
