import React, { useState, useEffect, useRef } from 'react';
import { Heart, Sparkles, MapPin, Calendar, Clock, Layers, Loader2, Image as ImageIcon } from 'lucide-react';
import { Photo } from '../types.js';

interface PhotoCardProps {
  photo: Photo;
  onSelect: (photo: Photo) => void;
  onToggleFavorite: (photo: Photo, e: React.MouseEvent) => void;
  onFindSimilar: (photo: Photo, e: React.MouseEvent) => void;
  isFocused?: boolean;
  onCardFocus?: () => void;
  tabIndex?: number;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onSelect,
  onToggleFavorite,
  onFindSimilar,
  isFocused = false,
  onCardFocus,
  tabIndex = 0,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isReady = photo.processingStatus === 'READY';
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-scroll into view when focused via keyboard navigation
  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.focus();
      cardRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isFocused]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(photo);
    }
  };

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={tabIndex}
      aria-label={`Photo: ${photo.filename}. ${photo.aiDescription || ''}`}
      aria-selected={isFocused}
      onClick={() => onSelect(photo)}
      onFocus={onCardFocus}
      onKeyDown={handleKeyDown}
      className={`group relative cursor-pointer rounded-2xl neo-photo-card p-2 flex flex-col justify-between transition-all select-none outline-none ${
        isFocused
          ? 'ring-2 ring-blue-600 ring-offset-2 ring-offset-[#EEF2F6] scale-[1.02] shadow-md neo-inset'
          : 'focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#EEF2F6]'
      }`}
    >
      {/* Photo Frame Container */}
      <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-200">
        {!imageLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-200 animate-pulse">
            <span className="text-xs text-slate-400">Loading photo...</span>
          </div>
        )}

        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 p-4 text-center">
            <div className="p-3 rounded-full bg-white/70 shadow-sm mb-2 text-slate-500">
              <ImageIcon className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-slate-600 truncate max-w-[90%]">
              {photo.filename}
            </span>
            <span className="text-[10px] text-slate-400 mt-1">
              {photo.aiDescription ? photo.aiDescription.slice(0, 45) + '...' : 'Uploaded to Cloud'}
            </span>
          </div>
        ) : (
          <img
            src={photo.thumbnailUrl || photo.url}
            alt={photo.aiDescription}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setHasError(true);
              setImageLoaded(true);
            }}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Top Badges Overlay */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          {/* Filename Tag (Proves camera file name has no keywords) */}
          <span className="px-2 py-0.5 rounded-lg bg-slate-900/60 backdrop-blur-md text-[10px] font-mono text-white/90 tracking-tight">
            {photo.filename}
          </span>

          {/* Similarity score badge if present */}
          {photo.similarityScore !== undefined && (
            <span className="px-2 py-0.5 rounded-lg bg-blue-600/90 backdrop-blur-md text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {Math.round(photo.similarityScore * 100)}% match
            </span>
          )}

          {/* Processing badge */}
          {!isReady && (
            <span className="px-2 py-0.5 rounded-lg bg-amber-500/90 backdrop-blur-md text-[10px] font-semibold text-white flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              {photo.processingStatus}
            </span>
          )}
        </div>

        {/* Hover Action Buttons */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => onFindSimilar(photo, e)}
            className="p-1.5 rounded-xl bg-slate-900/70 hover:bg-slate-900 backdrop-blur-md text-white/90 hover:text-white transition-colors"
            title="Find Similar Photos via Vertex AI Vector Search"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => onToggleFavorite(photo, e)}
            className={`p-1.5 rounded-xl backdrop-blur-md transition-colors ${
              photo.isFavorite
                ? 'bg-rose-500 text-white'
                : 'bg-slate-900/70 hover:bg-slate-900 text-white/90 hover:text-white'
            }`}
            title={photo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-3.5 h-3.5 ${photo.isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Card Metadata Footer */}
      <div className="pt-2 px-1 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1 truncate max-w-[65%]">
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">{photo.location}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 shrink-0">
          <Calendar className="w-3 h-3" />
          <span>{photo.dateTaken}</span>
        </div>
      </div>
    </div>
  );
};
