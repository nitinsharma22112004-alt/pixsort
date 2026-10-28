import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Sparkles, Upload, SlidersHorizontal, Info, Layers, Presentation, History, Trash2, ArrowUpRight, LogOut, User } from 'lucide-react';
import { SystemStatus } from '../types.js';
import { AuthUser } from './AuthModal.js';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExecuteSearch: (q: string) => void;
  onClearSearch: () => void;
  onOpenUpload: () => void;
  onOpenInspector: () => void;
  onOpenPresentation: () => void;
  systemStatus: SystemStatus | null;
  isSearching: boolean;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

const RECENT_SEARCHES_STORAGE_KEY = 'pixsort_recent_searches_v1';

const SEARCH_SUGGESTIONS = [
  'Pool party',
  'Beach photos',
  'Photos from my college trip',
  'Birthday party',
  'Sunset photos',
  'Photos from the gym',
  'Food photos',
  'Outdoor party',
  'Photos from July 2026',
  'Beach photos from last summer',
];

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onExecuteSearch,
  onClearSearch,
  onOpenUpload,
  onOpenInspector,
  onOpenPresentation,
  systemStatus,
  isSearching,
  currentUser,
  onLogout,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return ['college id card', 'Pool party', 'Beach photos'];
  });

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveRecentSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const removeRecentSearch = (itemToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== itemToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const clearAllRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = searchQuery.trim();
      if (q) {
        saveRecentSearch(q);
      }
      setShowSuggestions(false);
      onExecuteSearch(searchQuery);
    }
  };

  const handleSelectQuery = (query: string) => {
    saveRecentSearch(query);
    onSearchChange(query);
    setShowSuggestions(false);
    onExecuteSearch(query);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#EEF2F6] border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center text-blue-600">
          <Sparkles className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg text-slate-800 tracking-tight font-sans">PixSort</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono">
              Auto-Processing
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">Image Upload & Auto-Processing • Gemini AI</p>
        </div>
      </div>

      {/* Large Neomorphic Search Bar */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-2xl mx-auto">
        <div className="relative flex items-center w-full">
          <div className="absolute left-4 pointer-events-none text-slate-400 flex items-center">
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <input
            id="main-photo-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder='Search memories... try "Pool party", "Beach in July", "College trip"'
            className="w-full pl-11 pr-10 py-2.5 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 neo-inset focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all"
          />
          {searchQuery ? (
            <button
              onClick={onClearSearch}
              className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              title="Clear search (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="absolute right-3.5 hidden sm:flex items-center pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[11px] font-mono font-medium text-slate-400 bg-slate-200/80 rounded-md border border-slate-300/80 shadow-2xs">
                /
              </kbd>
            </div>
          )}
        </div>

        {/* Search Dropdown: Recent Searches & Suggestions */}
        {showSuggestions && (
          <div className="absolute left-0 right-0 mt-2 p-3.5 rounded-2xl neo-raised-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150 border border-white/60 space-y-3.5 shadow-xl bg-[#EEF2F6]">
            {/* Recent Searches Section */}
            {recentSearches.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-blue-700 font-bold">
                    <History className="w-3.5 h-3.5 text-blue-600" />
                    Recent Searches
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                      Cached / Instant
                    </span>
                  </span>
                  <button
                    onClick={clearAllRecentSearches}
                    className="text-[10px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear history
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((item) => (
                    <div
                      key={item}
                      onClick={() => handleSelectQuery(item)}
                      className="group px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 neo-btn hover:text-blue-700 flex items-center gap-2 cursor-pointer transition-all border border-slate-200/50"
                    >
                      <History className="w-3 h-3 text-blue-500 shrink-0" />
                      <span>{item}</span>
                      <button
                        onClick={(e) => removeRecentSearch(item, e)}
                        className="opacity-40 group-hover:opacity-100 p-0.5 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-all text-slate-400"
                        title={`Remove "${item}"`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Natural Language Queries Section */}
            <div className="space-y-2 pt-2 border-t border-slate-200/60">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
                <span>Suggested Natural Language Queries</span>
                <span className="text-[10px] text-slate-400">0 API Calls</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SEARCH_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSelectQuery(suggestion)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 neo-btn hover:text-blue-600 flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <Search className="w-3 h-3 text-slate-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenPresentation}
          className="p-2.5 rounded-2xl neo-btn text-purple-700 hover:text-purple-900 transition-colors flex items-center gap-2 text-xs font-semibold"
          title="Open Project Presentation Deck (/presentation)"
        >
          <Presentation className="w-4 h-4 text-purple-600" />
          <span className="hidden lg:inline">Deck / PPT</span>
        </button>

        <button
          onClick={onOpenInspector}
          className="p-2.5 rounded-2xl neo-btn text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2 text-xs font-semibold"
          title="Google Cloud Architecture Inspector"
        >
          <Layers className="w-4 h-4 text-blue-600" />
          <span className="hidden xl:inline">AI Pipeline</span>
        </button>

        <button
          onClick={onOpenUpload}
          className="px-4 py-2.5 rounded-2xl neo-btn text-blue-700 hover:text-blue-800 flex items-center gap-2 text-xs font-bold"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {currentUser && (
          <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl neo-inset bg-white/70"
              title={`Logged in as ${currentUser.email || currentUser.displayName}`}
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate hidden md:inline">
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl neo-btn text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
