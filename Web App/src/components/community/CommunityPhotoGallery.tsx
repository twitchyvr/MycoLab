// ============================================================================
// COMMUNITY PHOTO GALLERY
// Display and manage community-submitted photos for entities
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { InlineVoting } from './VotingWidget';
import type { CommunityPhoto, PhotoEntityType, PhotoQuotaCheck } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface CommunityPhotoGalleryProps {
  entityType: PhotoEntityType;
  entityId: string;
  showUpload?: boolean;
  maxPhotos?: number;
  layout?: 'grid' | 'carousel' | 'masonry';
}

interface PhotoWithMeta extends CommunityPhoto {
  publicUrl?: string;
  uploaderName?: string;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Upload: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  Camera: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Close: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Flag: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  ),
  Star: () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
};

// ============================================================================
// PHOTO UPLOAD COMPONENT
// ============================================================================

interface PhotoUploadProps {
  entityType: PhotoEntityType;
  entityId: string;
  onUploadComplete: () => void;
  onCancel: () => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  entityType,
  entityId,
  onUploadComplete,
  onCancel,
}) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<PhotoQuotaCheck | null>(null);

  // Check quota on mount
  useEffect(() => {
    const checkQuota = async () => {
      if (!user || !supabase) return;
      const { data } = await supabase.rpc('can_upload_photo', {
        p_user_id: user.id,
        p_file_size: 0, // Just checking general quota
      });
      setQuotaInfo(data);
    };
    checkQuota();
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    // Limit to 5 files, 5MB each
    const validFiles = selected.filter(f => f.size <= 5 * 1024 * 1024).slice(0, 5);
    setFiles(validFiles);
    setCaptions(validFiles.map(() => ''));
  };

  const handleUpload = async () => {
    if (!user || !supabase || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check quota
        const { data: quotaCheck } = await supabase.rpc('can_upload_photo', {
          p_user_id: user.id,
          p_file_size: file.size,
        });

        if (!quotaCheck?.allowed) {
          throw new Error(`Upload limit reached: ${quotaCheck?.reason?.replace(/_/g, ' ')}`);
        }

        // Upload to storage
        const timestamp = Date.now();
        const ext = file.name.split('.').pop();
        const path = `${entityType}/${entityId}/${timestamp}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('community-photos')
          .upload(path, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        // Create photo record
        const { error: recordError } = await supabase
          .from('community_photos')
          .insert({
            entity_type: entityType,
            entity_id: entityId,
            storage_path: path,
            storage_bucket: 'community-photos',
            file_size_bytes: file.size,
            mime_type: file.type,
            caption: captions[i] || null,
            status: 'pending',
            user_id: user.id,
          });

        if (recordError) throw recordError;

        // Increment quota
        await supabase.rpc('increment_photo_quota', {
          p_user_id: user.id,
          p_file_size: file.size,
        });
      }

      onUploadComplete();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
      <h4 className="font-medium text-white mb-4">Upload Photos</h4>

      {error && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-3 mb-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {quotaInfo && (
        <div className="bg-zinc-800/50 rounded-lg p-3 mb-4 text-xs text-zinc-400">
          <div className="flex justify-between mb-1">
            <span>Today: {quotaInfo.quotas?.daily.used}/{quotaInfo.quotas?.daily.limit}</span>
            <span>Week: {quotaInfo.quotas?.weekly.used}/{quotaInfo.quotas?.weekly.limit}</span>
          </div>
          <div className="w-full bg-zinc-700 rounded-full h-1.5">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${(quotaInfo.quotas?.daily.used || 0) / (quotaInfo.quotas?.daily.limit || 1) * 100}%` }}
            />
          </div>
        </div>
      )}

      {files.length === 0 ? (
        <label className="block border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Icons.Upload />
          <p className="text-zinc-400 mt-2">Click to upload or drag and drop</p>
          <p className="text-xs text-zinc-500 mt-1">PNG, JPG up to 5MB each (max 5 photos)</p>
        </label>
      ) : (
        <div className="space-y-4">
          {files.map((file, index) => (
            <div key={index} className="flex gap-4 items-start">
              <img
                src={URL.createObjectURL(file)}
                alt={`Upload ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="text-sm text-white mb-1">{file.name}</p>
                <input
                  type="text"
                  value={captions[index]}
                  onChange={(e) => {
                    const newCaptions = [...captions];
                    newCaptions[index] = e.target.value;
                    setCaptions(newCaptions);
                  }}
                  placeholder="Add a caption (optional)"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
        >
          {isUploading ? 'Uploading...' : `Upload ${files.length} Photo${files.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// LIGHTBOX COMPONENT
// ============================================================================

interface LightboxProps {
  photo: PhotoWithMeta;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

const Lightbox: React.FC<LightboxProps> = ({
  photo,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}) => {
  const { user, isAdmin } = useAuth();
  const [showReport, setShowReport] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
    if (e.key === 'ArrowRight' && hasNext) onNext?.();
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
      >
        <Icons.Close />
      </button>

      {/* Navigation */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors"
        >
          <Icons.ChevronLeft />
        </button>
      )}
      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors"
        >
          <Icons.ChevronRight />
        </button>
      )}

      {/* Image */}
      <img
        src={photo.publicUrl}
        alt={photo.caption || 'Community photo'}
        className="max-h-[80vh] max-w-[90vw] object-contain"
      />

      {/* Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="flex items-end justify-between">
          <div>
            {photo.caption && (
              <p className="text-white mb-2">{photo.caption}</p>
            )}
            <p className="text-sm text-zinc-400">
              Uploaded by {photo.uploaderName || 'Community Member'} •{' '}
              {formatDistanceToNow(new Date(photo.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <InlineVoting
              entityType="photo"
              entityId={photo.id}
              initialScore={photo.upvotes - photo.downvotes}
            />
            {user && photo.userId !== user.id && (
              <button
                onClick={() => setShowReport(true)}
                className="text-zinc-400 hover:text-red-400 transition-colors"
                title="Report photo"
              >
                <Icons.Flag />
              </button>
            )}
            {photo.isOfficial && (
              <span className="flex items-center gap-1 text-amber-400 text-sm">
                <Icons.Star />
                Official
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN GALLERY COMPONENT
// ============================================================================

export const CommunityPhotoGallery: React.FC<CommunityPhotoGalleryProps> = ({
  entityType,
  entityId,
  showUpload = true,
  maxPhotos = 20,
  layout = 'grid',
}) => {
  const { user, isAuthenticated } = useAuth();
  const [photos, setPhotos] = useState<PhotoWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Fetch photos
  const fetchPhotos = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('community_photos')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('status', 'approved')
        .order('is_official', { ascending: false })
        .order('upvotes', { ascending: false })
        .limit(maxPhotos);

      if (error) throw error;

      // Get public URLs
      const photosWithUrls: PhotoWithMeta[] = (data || []).map(photo => {
        const { data: urlData } = supabase!.storage
          .from(photo.storage_bucket)
          .getPublicUrl(photo.storage_path);

        return {
          id: photo.id,
          entityType: photo.entity_type,
          entityId: photo.entity_id,
          storagePath: photo.storage_path,
          storageBucket: photo.storage_bucket,
          thumbnailPath: photo.thumbnail_path,
          fileSizeBytes: photo.file_size_bytes,
          mimeType: photo.mime_type,
          width: photo.width,
          height: photo.height,
          caption: photo.caption,
          altText: photo.alt_text,
          tags: photo.tags,
          status: photo.status,
          moderatedBy: photo.moderated_by,
          moderatedAt: photo.moderated_at ? new Date(photo.moderated_at) : undefined,
          moderationNotes: photo.moderation_notes,
          upvotes: photo.upvotes || 0,
          downvotes: photo.downvotes || 0,
          viewCount: photo.view_count || 0,
          isFeatured: photo.is_featured || false,
          isOfficial: photo.is_official || false,
          userId: photo.user_id,
          createdAt: new Date(photo.created_at),
          updatedAt: new Date(photo.updated_at),
          publicUrl: urlData?.publicUrl,
        };
      });

      setPhotos(photosWithUrls);
    } catch (err) {
      console.error('Failed to fetch photos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, maxPhotos]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-white flex items-center gap-2">
          <Icons.Camera />
          Community Photos
          <span className="text-sm text-zinc-500">({photos.length})</span>
        </h4>
        {showUpload && isAuthenticated && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:text-white transition-colors"
          >
            <Icons.Upload />
            Add Photo
          </button>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg">
            <PhotoUpload
              entityType={entityType}
              entityId={entityId}
              onUploadComplete={() => {
                setShowUploadModal(false);
                fetchPhotos();
              }}
              onCancel={() => setShowUploadModal(false)}
            />
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
          <Icons.Camera />
          <p className="mt-2 text-sm">No photos yet</p>
          {isAuthenticated && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-2 text-emerald-400 hover:text-emerald-300 text-sm"
            >
              Be the first to add one!
            </button>
          )}
        </div>
      ) : (
        <div className={`
          ${layout === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3' : ''}
          ${layout === 'masonry' ? 'columns-2 sm:columns-3 md:columns-4 gap-3' : ''}
        `}>
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => setSelectedIndex(index)}
              className={`
                relative group cursor-pointer overflow-hidden rounded-lg
                ${layout === 'masonry' ? 'mb-3 break-inside-avoid' : 'aspect-square'}
              `}
            >
              <img
                src={photo.publicUrl}
                alt={photo.caption || 'Community photo'}
                className={`
                  w-full object-cover transition-transform duration-300 group-hover:scale-105
                  ${layout === 'grid' ? 'h-full' : ''}
                `}
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                  <InlineVoting
                    entityType="photo"
                    entityId={photo.id}
                    initialScore={photo.upvotes - photo.downvotes}
                  />
                  {photo.isOfficial && (
                    <span className="text-amber-400">
                      <Icons.Star />
                    </span>
                  )}
                </div>
              </div>
              {/* Official Badge */}
              {photo.isOfficial && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500/90 text-white text-xs font-medium rounded">
                  Official
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedIndex !== null && photos[selectedIndex] && (
        <Lightbox
          photo={photos[selectedIndex]}
          onClose={() => setSelectedIndex(null)}
          onPrev={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
          onNext={() => setSelectedIndex(Math.min(photos.length - 1, selectedIndex + 1))}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < photos.length - 1}
        />
      )}
    </div>
  );
};

export default CommunityPhotoGallery;
