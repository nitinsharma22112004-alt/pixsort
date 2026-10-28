import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Calendar, Filter, Sparkles, ArrowUpDown, Heart, MapPin, SearchX, Keyboard } from 'lucide-react';
import { Photo, SearchInterpretedFilter } from '../types.js';
import { PhotoCard } from './PhotoCard.js';

interface PhotoGridProps {
  photos: Photo[];
  isSearchResult: boolean;
  searchQuery?: string;
  interpretedFilter?: SearchInterpretedFilter;
  executionTimeMs?: number;
  onSelectPhoto: (photo: Photo) => void;
  onToggleFavorite: (photo: Photo, e: React.MouseEvent) => void;
  onFindSimilar: (photo: Photo, e: React.MouseEvent) => void;
  onClearSearch?: () => void;
  title?: string;
}

type SortOption = 'relevance' | 'date-desc' | 'date-asc';

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  isSearchResult,
  searchQuery,
  interpretedFilter,
  executionTimeMs,
  onSelectPhoto,
  onToggleFavorite,
  onFindSimilar,
  onClearSearch,
  title,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Extract unique locations
  const availableLocations = useMemo(() => {
    const locs = new Set<string>();
    photos.forEach((p) => {
      if (p.location) locs.add(p.location);
    });
    return Array.from(locs);
  }, [photos]);

  // Apply in-view sorting & filtering
  const processedPhotos = useMemo(() => {
    let list = [...photos];

    if (filterFavoritesOnly) {
      list = list.filter((p) => p.isFavorite);
    }

    if (selectedLocation !== 'all') {
      list = list.filter((p) => p.location.toLowerCase().includes(selectedLocation.toLowerCase()));
    }

    if (sortBy === 'relevance' && isSearchResult) {
      list.sort((a, b) => (b.similarityScore ?? 0) - (a.similarityScore ?? 0));
    } else if (sortBy === 'date-desc') {
      list.sort((a, b) => new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime());
    } else if (sortBy === 'date-asc') {
      list.sort((a, b) => new Date(a.dateTaken).getTime() - new Date(b.dateTaken).getTime());
    }

    return list;
  }, [photos, sortBy, filterFavoritesOnly, selectedLocation, isSearchResult]);

  // Fast mapping of photo ID to global index in processedPhotos
  const idToIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    processedPhotos.forEach((p, idx) => {
      map.set(p.id, idx);
    });
    return map;
  }, [processedPhotos]);

  // Helper to calculate responsive grid column count for vertical arrow navigation
  const getGridColumnCount = useCallback((): number => {
    if (typeof window === 'undefined') return 4;
    const width = window.innerWidth;
    if (width < 640) return 1;
    if (width < 768) return 2;
    if (width < 1024) return 3;
    return 4;
  }, []);

  // Clamp focusedIndex if list shrinks
  useEffect(() => {
    if (focusedIndex !== null && focusedIndex >= processedPhotos.length) {
      setFocusedIndex(processedPhotos.length > 0 ? processedPhotos.length - 1 : null);
    }
  }, [processedPhotos.length, focusedIndex]);

  // Arrow key navigation listener across grid
  const handleGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (processedPhotos.length === 0) return;

    // Ignore if typing inside an input/select
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
      return;
    }

    const currentIdx = focusedIndex ?? -1;
    const cols = getGridColumnCount();
    let nextIdx = currentIdx;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        nextIdx = currentIdx < 0 ? 0 : Math.min(processedPhotos.length - 1, currentIdx + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        nextIdx = currentIdx < 0 ? 0 : Math.max(0, currentIdx - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        nextIdx = currentIdx < 0 ? 0 : Math.min(processedPhotos.length - 1, currentIdx + cols);
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIdx = currentIdx < 0 ? 0 : Math.max(0, currentIdx - cols);
        break;
      case 'Home':
        e.preventDefault();
        nextIdx = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIdx = processedPhotos.length - 1;
        break;
      case 'Enter':
      case ' ':
        if (currentIdx >= 0 && currentIdx < processedPhotos.length) {
          e.preventDefault();
          onSelectPhoto(processedPhotos[currentIdx]);
        }
        return;
      default:
        return;
    }

    setFocusedIndex(nextIdx);
  };

  // Group by date when NOT a search result (as requested in Section 10)
  const groupedByDate = useMemo(() => {
    if (isSearchResult) return null;

    const groups: { [date: string]: Photo[] } = {};
    for (const photo of processedPhotos) {
      const date = photo.dateTaken;
      if (!groups[date]) groups[date] = [];
      groups[date].push(photo);
    }

    // Format readable date headers
    return Object.entries(groups).map(([dateStr, items]) => {
      const dateObj = new Date(dateStr);
      const formatted = isNaN(dateObj.getTime())
        ? dateStr
        : dateObj.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
      return {
        dateStr,
        formatted,
        items,
      };
    });
  }, [processedPhotos, isSearchResult]);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl neo-raised flex items-center justify-center text-slate-400 mb-4">
          <SearchX className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-base font-bold text-slate-700 mb-1">No matching photos found</h3>
        <p className="text-xs text-slate-500 max-w-sm mb-5">
          {isSearchResult
            ? `Vertex AI Vector Search did not find photos with sufficient semantic match for "${searchQuery}". Try broader natural language words.`
            : 'No photos in this section yet. Click Upload to add your first photo.'}
        </p>
        {isSearchResult && onClearSearch && (
          <button
            onClick={onClearSearch}
            className="px-4 py-2 rounded-2xl neo-btn text-xs font-semibold text-blue-700"
          >
            Clear Search & View All Photos
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Photo Gallery Grid"
      tabIndex={0}
      onKeyDown={handleGridKeyDown}
      className="space-y-6 outline-none focus:ring-1 focus:ring-blue-300 rounded-3xl"
    >
      {/* Search Result Header / Filter Bar */}
      {isSearchResult && (
        <div className="p-4 rounded-2xl neo-raised border border-white/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                  Search results for &ldquo;{searchQuery}&rdquo;
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {processedPhotos.length} {processedPhotos.length === 1 ? 'photo' : 'photos'}
                </span>
                {executionTimeMs !== undefined && (
                  <span className="text-[11px] text-slate-400">({executionTimeMs} ms)</span>
                )}
              </div>
              {interpretedFilter && (
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Semantic:
                  </span>
                  <span className="bg-slate-200/80 px-2 py-0.5 rounded-lg text-slate-800 font-mono text-[11px]">
                    &ldquo;{interpretedFilter.semanticQuery}&rdquo;
                  </span>
                  {interpretedFilter.dateFilter && (
                    <span className="bg-blue-100/70 text-blue-800 px-2 py-0.5 rounded-lg text-[11px] font-medium">
                      Date filter: {interpretedFilter.dateFilter}
                    </span>
                  )}
                  {interpretedFilter.locationFilter && (
                    <span className="bg-emerald-100/70 text-emerald-800 px-2 py-0.5 rounded-lg text-[11px] font-medium">
                      Location filter: {interpretedFilter.locationFilter}
                    </span>
                  )}
                  {interpretedFilter.favoriteOnly && (
                    <span className="bg-rose-100/70 text-rose-800 px-2 py-0.5 rounded-lg text-[11px] font-medium">
                      Favorites only
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* In-view Sort & Filter Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-slate-500 bg-[#EEF2F6] px-2.5 py-1.5 rounded-xl neo-inset-sm">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                </select>
              </div>

              {availableLocations.length > 1 && (
                <div className="flex items-center gap-1 text-xs text-slate-500 bg-[#EEF2F6] px-2.5 py-1.5 rounded-xl neo-inset-sm">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Locations</option>
                    {availableLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  filterFavoritesOnly
                    ? 'neo-inset text-rose-600 font-bold'
                    : 'neo-btn text-slate-600 hover:text-slate-900'
                }`}
                title="Filter favorites"
              >
                <Heart className={`w-3.5 h-3.5 ${filterFavoritesOnly ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">Favorites</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcut Guidance Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl neo-inset-sm text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-1.5">
          <Keyboard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-semibold text-slate-700">Arrow Key Navigation:</span>
          <span>Use</span>
          <div className="inline-flex gap-0.5">
            <kbd className="px-1 py-0.5 rounded bg-white text-slate-700 font-bold border border-slate-300 shadow-2xs text-[10px]">↑</kbd>
            <kbd className="px-1 py-0.5 rounded bg-white text-slate-700 font-bold border border-slate-300 shadow-2xs text-[10px]">↓</kbd>
            <kbd className="px-1 py-0.5 rounded bg-white text-slate-700 font-bold border border-slate-300 shadow-2xs text-[10px]">←</kbd>
            <kbd className="px-1 py-0.5 rounded bg-white text-slate-700 font-bold border border-slate-300 shadow-2xs text-[10px]">→</kbd>
          </div>
          <span className="hidden sm:inline">to navigate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white text-slate-700 font-bold border border-slate-300 shadow-2xs text-[10px]">Enter</kbd>
          <span>or Space to view</span>
        </div>
      </div>

      {/* Main Grid: Date Grouped Layout (when not search) */}
      {!isSearchResult && groupedByDate ? (
        <div className="space-y-8">
          {title && (
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
          )}
          {groupedByDate.map((group) => (
            <section key={group.dateStr} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-700 tracking-tight">
                  {group.formatted}
                </h3>
                <span className="text-[11px] text-slate-400">
                  ({group.items.length} {group.items.length === 1 ? 'photo' : 'photos'})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.items.map((photo) => {
                  const globalIdx = idToIndexMap.get(photo.id);
                  return (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      onSelect={onSelectPhoto}
                      onToggleFavorite={onToggleFavorite}
                      onFindSimilar={onFindSimilar}
                      isFocused={focusedIndex !== null && focusedIndex === globalIdx}
                      onCardFocus={() => setFocusedIndex(globalIdx ?? null)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* Flat Grid for Search Results */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {processedPhotos.map((photo, idx) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onSelect={onSelectPhoto}
              onToggleFavorite={onToggleFavorite}
              onFindSimilar={onFindSimilar}
              isFocused={focusedIndex !== null && focusedIndex === idx}
              onCardFocus={() => setFocusedIndex(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
