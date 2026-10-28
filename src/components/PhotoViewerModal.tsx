import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  ZoomIn,
  ZoomOut,
  Download,
  Trash2,
  FolderPlus,
  Sparkles,
  Info,
  MapPin,
  Calendar,
  Layers,
  Clock,
  Compass,
  Tag,
  Activity,
  Cpu,
  Image as ImageIcon,
} from 'lucide-react';
import { Photo, Album } from '../types.js';

interface PhotoViewerModalProps {
  photo: Photo | null;
  allPhotos: Photo[];
  albums: Album[];
  onClose: () => void;
  onSelectPhoto: (photo: Photo) => void;
  onToggleFavorite: (photo: Photo, e: React.MouseEvent) => void;
  onDeletePhoto: (photo: Photo) => void;
  onToggleAlbum: (photo: Photo, albumId: string) => void;
  onFindSimilar: (photo: Photo) => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  photo,
  allPhotos,
  albums,
  onClose,
  onSelectPhoto,
  onToggleFavorite,
  onDeletePhoto,
  onToggleAlbum,
  onFindSimilar,
}) => {
  const [showInfo, setShowInfo] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showAlbumMenu, setShowAlbumMenu] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [photo?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!photo) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'i' || e.key === 'I') setShowInfo((prev) => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photo, allPhotos]);

  if (!photo) return null;

  const currentIndex = allPhotos.findIndex((p) => p.id === photo.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allPhotos.length - 1;

  const handlePrev = () => {
    if (hasPrev) onSelectPhoto(allPhotos[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onSelectPhoto(allPhotos[currentIndex + 1]);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = photo.filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-slate-950/92 backdrop-blur-md overflow-hidden select-none animate-in fade-in duration-200">
      {/* 1. Main Photo Viewer Area (Left / Center Pane) */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden transition-all duration-300">
        {/* Top Header Bar */}
        <div className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 z-20 bg-slate-950/70 border-b border-slate-800/60 backdrop-blur-md">
          {/* Left: Close & File Info */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white transition-colors shrink-0"
              title="Close viewer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white tracking-tight truncate max-w-[180px] sm:max-w-md">
                {photo.filename}
              </div>
              <div className="text-[11px] text-slate-400">
                {currentIndex + 1} of {allPhotos.length}
              </div>
            </div>
          </div>

          {/* Right: Quick Tools & Info Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Toggle */}
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white transition-colors"
              title={isZoomed ? 'Zoom out' : 'Zoom in'}
            >
              {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>

            {/* Info Panel Toggle */}
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`px-3 py-2 rounded-2xl flex items-center gap-1.5 text-xs font-semibold transition-all ${
                showInfo
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200'
              }`}
              title="Toggle Photo Details & AI Metadata (I)"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">{showInfo ? 'Hide Details' : 'Details & AI'}</span>
            </button>
          </div>
        </div>

        {/* Center Photo Viewport */}
        <div className="flex-1 relative flex items-center justify-center p-3 sm:p-6 min-h-0 overflow-hidden">
          {/* Previous Button */}
          {hasPrev && (
            <button
              onClick={handlePrev}
              className="absolute left-4 sm:left-6 z-20 p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md border border-slate-700/60 shadow-xl transition-transform hover:scale-105 active:scale-95"
              title="Previous (Left arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next Button */}
          {hasNext && (
            <button
              onClick={handleNext}
              className="absolute right-4 sm:right-6 z-20 p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md border border-slate-700/60 shadow-xl transition-transform hover:scale-105 active:scale-95"
              title="Next (Right arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Actual Image or Fallback */}
          <div
            className={`transition-all duration-300 flex items-center justify-center max-h-full max-w-full ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={() => !imageError && setIsZoomed(!isZoomed)}
          >
            {imageError ? (
              <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-slate-700/60 text-slate-300 max-w-md text-center shadow-2xl">
                <div className="p-4 rounded-2xl bg-slate-800 text-slate-400 mb-4 shadow-inner">
                  <ImageIcon className="w-10 h-10" />
                </div>
                <h4 className="text-base font-semibold text-white mb-1">{photo.filename}</h4>
                <p className="text-xs text-slate-400 mb-4 max-w-xs">
                  Photo metadata & vector embeddings are indexed and searchable.
                </p>
                <div className="px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-[11px] text-blue-300 font-medium">
                  Indexed in Vertex AI Vector Search
                </div>
              </div>
            ) : (
              <img
                src={photo.url}
                alt={photo.aiDescription}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="max-h-[calc(100vh-170px)] max-w-full object-contain rounded-2xl shadow-2xl transition-transform duration-200"
              />
            )}
          </div>
        </div>

        {/* Bottom Action Dock Bar (All Action Buttons Cleanly Coexist) */}
        <div className="w-full px-4 sm:px-6 py-3 shrink-0 z-20 bg-slate-950/80 border-t border-slate-800/60 backdrop-blur-md flex items-center justify-between gap-2 overflow-x-auto">
          {/* Action Buttons Left Group */}
          <div className="flex items-center gap-2">
            {/* Find Similar Button */}
            <button
              onClick={() => onFindSimilar(photo)}
              className="px-3 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shrink-0"
              title="Find Similar Photos via Vertex AI Vector Search"
            >
              <Layers className="w-4 h-4" />
              <span>Find Similar</span>
            </button>

            {/* Favorite Toggle */}
            <button
              onClick={(e) => onToggleFavorite(photo, e)}
              className={`px-3 py-2 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                photo.isFavorite
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200'
              }`}
              title={photo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${photo.isFavorite ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{photo.isFavorite ? 'Favorited' : 'Favorite'}</span>
            </button>

            {/* Add to Album Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowAlbumMenu(!showAlbumMenu)}
                className="px-3 py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Add to Album"
              >
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Album</span>
              </button>
              {showAlbumMenu && (
                <div className="absolute left-0 bottom-full mb-2 w-52 p-2 rounded-2xl neo-raised-lg bg-[#EEF2F6] text-slate-800 z-30 shadow-2xl border border-white/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Assign Albums
                  </div>
                  {albums.length === 0 ? (
                    <p className="text-xs text-slate-500 p-2">No albums yet</p>
                  ) : (
                    albums.map((alb) => {
                      const isAssigned = photo.albumIds.includes(alb.id);
                      return (
                        <button
                          key={alb.id}
                          onClick={() => onToggleAlbum(photo, alb.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                            isAssigned ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="truncate">{alb.name}</span>
                          {isAssigned && <span className="text-[10px] font-bold">✓</span>}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="px-3 py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              title="Download original"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Download</span>
            </button>
          </div>

          {/* Action Buttons Right Group */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Delete / Trash */}
            <button
              onClick={() => onDeletePhoto(photo)}
              className="px-3 py-2 rounded-2xl bg-slate-800/80 hover:bg-rose-950/80 hover:text-rose-300 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              title="Move to Trash"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Photo Info & AI Metadata Panel (Coexists cleanly alongside viewer on desktop, bottom sheet on mobile) */}
      {showInfo && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setShowInfo(false)}
          />

          <aside className="w-full md:w-88 lg:w-96 shrink-0 h-[75vh] md:h-full bg-[#EEF2F6] border-t md:border-t-0 md:border-l border-slate-200/90 p-5 overflow-y-auto space-y-4 fixed md:relative bottom-0 inset-x-0 md:bottom-auto md:inset-x-auto z-40 rounded-t-3xl md:rounded-none shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-right duration-200">
            {/* Mobile handle indicator */}
            <div className="md:hidden w-12 h-1.5 rounded-full bg-slate-300 mx-auto mb-2" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Photo Details & AI Metadata
              </h3>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-600 transition-colors"
                title="Close Info Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI Semantic Description (Generated by Gemini) */}
            <div className="p-4 rounded-2xl neo-inset space-y-2">
              <div className="text-[11px] font-bold text-blue-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Gemini Vision Summary
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                &ldquo;{photo.aiDescription}&rdquo;
              </p>
            </div>

            {/* Standard Metadata */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Date & Location
              </div>

              <div className="p-3.5 rounded-2xl neo-raised space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Date Taken
                  </span>
                  <span className="font-semibold text-slate-800">{photo.dateTaken}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Location
                  </span>
                  <span className="font-semibold text-slate-800">{photo.location}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Time of Day
                  </span>
                  <span className="font-semibold text-slate-800">{photo.time}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-slate-400" />
                    Environment
                  </span>
                  <span className="font-semibold text-slate-800">{photo.environment}</span>
                </div>
              </div>
            </div>

            {/* Detected Objects */}
            {photo.objects && photo.objects.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Detected Objects
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {photo.objects.map((obj, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-slate-700 neo-btn"
                    >
                      {obj}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Detected Activities */}
            {photo.activities && photo.activities.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Detected Activities
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {photo.activities.map((act, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-blue-700 bg-blue-50/80 border border-blue-200/50"
                    >
                      {act}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Vector Search Stats */}
            <div className="p-3.5 rounded-2xl neo-raised border border-white/60 space-y-2">
              <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                Vertex AI Vector Search Index
              </div>
              <div className="text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Embedding Model:</span>
                  <span className="font-mono text-slate-800">Gemini Embedding 2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vector Dimension:</span>
                  <span className="font-mono text-slate-800">
                    {photo.embeddingDimension || 3072}-D Dense
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Storage Layer:</span>
                  <span className="font-semibold text-blue-700">Google Drive API</span>
                </div>
                {photo.driveAccountEmail && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Drive Account:</span>
                    <span className="font-mono text-slate-800 text-[10px] truncate max-w-[160px]" title={photo.driveAccountEmail}>
                      {photo.driveAccountEmail}
                    </span>
                  </div>
                )}
                {photo.driveFileId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Drive File ID:</span>
                    <span className="font-mono text-[10px] text-slate-600 truncate max-w-[160px]" title={photo.driveFileId}>
                      {photo.driveFileId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Folder Path:</span>
                  <span className="font-mono text-[10px] text-slate-600 truncate max-w-[170px]" title={photo.storagePath}>
                    {photo.storagePath}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};
