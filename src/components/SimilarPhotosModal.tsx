import React from 'react';
import { X, Layers, Sparkles } from 'lucide-react';
import { Photo } from '../types.js';
import { PhotoCard } from './PhotoCard.js';

interface SimilarPhotosModalProps {
  sourcePhoto: Photo | null;
  similarPhotos: Photo[];
  isLoading: boolean;
  onClose: () => void;
  onSelectPhoto: (photo: Photo) => void;
  onToggleFavorite: (photo: Photo, e: React.MouseEvent) => void;
  onFindSimilar: (photo: Photo, e: React.MouseEvent) => void;
}

export const SimilarPhotosModal: React.FC<SimilarPhotosModalProps> = ({
  sourcePhoto,
  similarPhotos,
  isLoading,
  onClose,
  onSelectPhoto,
  onToggleFavorite,
  onFindSimilar,
}) => {
  if (!sourcePhoto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl neo-raised-lg bg-[#EEF2F6] p-6 space-y-5 border border-white/80">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl neo-raised flex items-center justify-center text-blue-600">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">
                  Photos Semantically Similar to {sourcePhoto.filename}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Vertex AI Vector Search
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Matched via existing 768-D image embedding — no re-embedding required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl neo-btn text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Photo Banner */}
        <div className="p-3 rounded-2xl neo-inset flex items-center gap-4">
          <img
            src={sourcePhoto.thumbnailUrl || sourcePhoto.url}
            alt={sourcePhoto.aiDescription}
            className="w-16 h-16 rounded-xl object-cover neo-raised-sm"
          />
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-slate-800">{sourcePhoto.filename}</div>
            <div className="text-slate-500">{sourcePhoto.location} · {sourcePhoto.dateTaken}</div>
            <div className="text-[11px] text-slate-600 italic line-clamp-1">
              &ldquo;{sourcePhoto.aiDescription}&rdquo;
            </div>
          </div>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Querying Vertex AI Vector Search index...
          </div>
        ) : similarPhotos.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No other semantically similar photos found above the threshold.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {similarPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onSelect={onSelectPhoto}
                onToggleFavorite={onToggleFavorite}
                onFindSimilar={onFindSimilar}
              />
            ))}
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl neo-btn text-xs font-semibold text-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
