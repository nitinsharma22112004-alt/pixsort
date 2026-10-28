import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header.js';
import { Sidebar, ActiveTab } from './components/Sidebar.js';
import { PhotoGrid } from './components/PhotoGrid.js';
import { PhotoViewerModal } from './components/PhotoViewerModal.js';
import { UploadModal } from './components/UploadModal.js';
import { AlbumsView } from './components/AlbumsView.js';
import { ArchitectureInspectorModal } from './components/ArchitectureInspectorModal.js';
import { SimilarPhotosModal } from './components/SimilarPhotosModal.js';
import { StorageSettingsView } from './components/StorageSettingsView.js';
import { PresentationDeck } from './components/presentation/PresentationDeck.js';
import { AuthModal, AuthUser } from './components/AuthModal.js';
import { LandingPage } from './components/LandingPage.js';
import { Photo, Album, SearchResponse, SystemStatus } from './types.js';
import { ArrowLeft, RefreshCw, Trash2, RotateCcw, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('photos');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('pixsort_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  // Presentation Deck Mode state
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(() => {
    return (
      typeof window !== 'undefined' &&
      (window.location.pathname === '/presentation' || window.location.hash === '#/presentation')
    );
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchCacheRef = useRef<Map<string, SearchResponse>>(new Map());

  // Modals & view states
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [similarModal, setSimilarModal] = useState<{
    source: Photo | null;
    results: Photo[];
    loading: boolean;
  }>({
    source: null,
    results: [],
    loading: false,
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Listen for Firebase Auth state changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    (async () => {
      try {
        const configRes = await fetch('/api/drive/config');
        if (configRes.ok) {
          const config = await configRes.json();
          const { initializeApp, getApps } = await import('firebase/app');
          const { getAuth, onAuthStateChanged } = await import('firebase/auth');
          const apps = getApps();
          const app = apps.length > 0 ? apps[0] : initializeApp(config);
          const auth = getAuth(app);
          unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              const u: AuthUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                photoURL: user.photoURL,
              };
              setCurrentUser(u);
              try {
                localStorage.setItem('pixsort_user', JSON.stringify(u));
              } catch {
                // ignore
              }
            }
          });
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('pixsort_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    showToast(`Welcome, ${user.displayName || user.email}!`);
  };

  const handleLogout = async () => {
    try {
      const configRes = await fetch('/api/drive/config');
      if (configRes.ok) {
        const config = await configRes.json();
        const { initializeApp, getApps } = await import('firebase/app');
        const { getAuth, signOut } = await import('firebase/auth');
        const apps = getApps();
        const app = apps.length > 0 ? apps[0] : initializeApp(config);
        const auth = getAuth(app);
        await signOut(auth);
      }
    } catch {
      // ignore
    }
    setCurrentUser(null);
    try {
      localStorage.removeItem('pixsort_user');
    } catch {
      // ignore
    }
    showToast('Logged out successfully');
  };

  // Load photos based on current context and user
  const loadPhotos = useCallback(async () => {
    if (!currentUser && !isPresentationMode) return;
    try {
      let url = '/api/photos';
      const params = new URLSearchParams();

      if (activeTab === 'favorites') {
        params.append('favorite', 'true');
      } else if (activeTab === 'trash') {
        params.append('trash', 'true');
      } else if (selectedAlbum) {
        params.append('albumId', selectedAlbum.id);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url, {
        headers: currentUser?.uid ? { 'x-user-id': currentUser.uid } : {},
      });
      if (res.ok) {
        const data: Photo[] = await res.json();
        if (activeTab === 'recent') {
          // Sort by creation time
          data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        setPhotos(data);
      }
    } catch (err) {
      console.error('Failed to load photos:', err);
    }
  }, [activeTab, selectedAlbum, currentUser, isPresentationMode]);

  // Load albums
  const loadAlbums = useCallback(async () => {
    if (!currentUser && !isPresentationMode) return;
    try {
      const res = await fetch('/api/albums', {
        headers: currentUser?.uid ? { 'x-user-id': currentUser.uid } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAlbums(data);
      }
    } catch (err) {
      console.error('Failed to load albums:', err);
    }
  }, [currentUser, isPresentationMode]);

  // Load system status
  const loadSystemStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/status', {
        headers: currentUser?.uid ? { 'x-user-id': currentUser.uid } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  }, [currentUser]);

  // Initial fetch
  useEffect(() => {
    if (currentUser) {
      loadPhotos();
      loadAlbums();
      loadSystemStatus();
    }
  }, [currentUser, loadPhotos, loadAlbums, loadSystemStatus]);

  // Sync presentation mode with browser URL and history
  useEffect(() => {
    const handlePopState = () => {
      const isPres =
        window.location.pathname === '/presentation' || window.location.hash === '#/presentation';
      setIsPresentationMode(isPres);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenPresentation = () => {
    window.history.pushState(null, '', '/presentation');
    setIsPresentationMode(true);
  };

  const handleExitPresentation = () => {
    window.history.pushState(null, '', '/');
    setIsPresentationMode(false);
  };

  // Execute Natural Language Search (Zero-API with instant client-side cache)
  const handleExecuteSearch = async (query: string) => {
    const q = query.trim();
    if (!q) {
      setSearchResponse(null);
      return;
    }

    const cacheKey = q.toLowerCase();

    // 1. Instant cache lookup: If query was executed previously, return immediately with 0 network calls
    if (searchCacheRef.current.has(cacheKey)) {
      const cached = searchCacheRef.current.get(cacheKey)!;
      setSearchResponse({
        ...cached,
        executionTimeMs: 0, // 0ms instantaneous cache hit
      });
      showToast(`Instant retrieval from local cache (0 API calls)`);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser?.uid ? { 'x-user-id': currentUser.uid } : {}),
        },
        body: JSON.stringify({ query: q }),
      });

      if (res.ok) {
        const data: SearchResponse = await res.json();
        // Save to client-side cache for instant re-runs
        searchCacheRef.current.set(cacheKey, data);
        setSearchResponse(data);
      } else {
        const err = await res.json();
        showToast(err.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      showToast('Search request failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResponse(null);
  };

  // Global keyboard shortcuts (Esc to close modals / clear search, '/' to focus search bar)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable);

      // 1. "/" shortcut: Focus search bar when not typing in an input
      if (e.key === '/' && !isInputFocused && !isPresentationMode) {
        e.preventDefault();
        const searchInput = document.getElementById('main-photo-search-input') as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // 2. "Escape" shortcut: Close open modals, or exit presentation, or clear/blur search
      if (e.key === 'Escape') {
        // If presentation mode is active, exit presentation mode
        if (isPresentationMode) {
          handleExitPresentation();
          return;
        }

        // If similar photos modal is open, close it
        if (similarModal.source) {
          setSimilarModal({ source: null, results: [], loading: false });
          return;
        }

        // If photo viewer modal is open, close it
        if (selectedPhoto) {
          setSelectedPhoto(null);
          return;
        }

        // If upload modal is open, close it
        if (showUploadModal) {
          setShowUploadModal(false);
          return;
        }

        // If architecture inspector modal is open, close it
        if (showInspectorModal) {
          setShowInspectorModal(false);
          return;
        }

        // If search input or any other input is focused, blur it
        if (isInputFocused && activeElement) {
          activeElement.blur();
          return;
        }

        // If search results are shown or search query is active, clear search
        if (searchResponse || searchQuery) {
          handleClearSearch();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    isPresentationMode,
    similarModal.source,
    selectedPhoto,
    showUploadModal,
    showInspectorModal,
    searchResponse,
    searchQuery,
  ]);

  // Toggle favorite
  const handleToggleFavorite = async (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/photos/${photo.id}/favorite`, {
        method: 'PATCH',
        headers: currentUser?.uid ? { 'x-user-id': currentUser.uid } : {},
      });
      if (res.ok) {
        const updated = await res.json();
        // Update local state
        setPhotos((prev) => prev.map((p) => (p.id === photo.id ? updated : p)));
        if (selectedPhoto && selectedPhoto.id === photo.id) {
          setSelectedPhoto(updated);
        }
        if (searchResponse) {
          setSearchResponse({
            ...searchResponse,
            results: searchResponse.results.map((p) => (p.id === photo.id ? updated : p)),
          });
        }
        showToast(updated.isFavorite ? 'Added to favorites' : 'Removed from favorites');
        loadSystemStatus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle album association
  const handleToggleAlbum = async (photo: Photo, albumId: string) => {
    try {
      const res = await fetch(`/api/photos/${photo.id}/album`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser?.uid ? { 'x-user-id': currentUser.uid } : {}),
        },
        body: JSON.stringify({ albumId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPhotos((prev) => prev.map((p) => (p.id === photo.id ? updated : p)));
        if (selectedPhoto && selectedPhoto.id === photo.id) {
          setSelectedPhoto(updated);
        }
        loadAlbums();
        showToast('Album association updated');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete photo (soft trash or permanent)
  const handleDeletePhoto = async (photo: Photo) => {
    const isTrashTab = activeTab === 'trash';
    try {
      const res = await fetch(`/api/photos/${photo.id}?permanent=${isTrashTab}`, {
        method: 'DELETE',
        headers: currentUser?.uid ? { 'x-user-id': currentUser.uid } : {},
      });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
        if (selectedPhoto && selectedPhoto.id === photo.id) {
          setSelectedPhoto(null);
        }
        loadAlbums();
        loadSystemStatus();
        showToast(isTrashTab ? 'Photo deleted permanently' : 'Photo moved to Trash');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Restore photo from trash
  const handleRestorePhoto = async (photo: Photo) => {
    try {
      const res = await fetch(`/api/photos/${photo.id}/restore`, {
        method: 'PATCH',
        headers: currentUser?.uid ? { 'x-user-id': currentUser.uid } : {},
      });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
        showToast('Photo restored to library');
        loadSystemStatus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Find Similar Photos via Vertex AI Vector Search
  const handleFindSimilar = async (photo: Photo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSimilarModal({ source: photo, results: [], loading: true });

    try {
      const res = await fetch(`/api/photos/${photo.id}/similar`, {
        method: 'POST',
        headers: currentUser?.uid ? { 'x-user-id': currentUser.uid } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setSimilarModal({
          source: photo,
          results: data.similarPhotos,
          loading: false,
        });
      } else {
        setSimilarModal((prev) => ({ ...prev, loading: false }));
        showToast('Could not find similar photos');
      }
    } catch (err) {
      console.error(err);
      setSimilarModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Create new album
  const handleCreateAlbum = async (name: string) => {
    const res = await fetch('/api/albums', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(currentUser?.uid ? { 'x-user-id': currentUser.uid } : {}),
      },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      loadAlbums();
      showToast(`Album "${name}" created`);
    }
  };

  // Delete album
  const handleDeleteAlbum = async (albumId: string) => {
    const res = await fetch(`/api/albums/${albumId}`, {
      method: 'DELETE',
      headers: currentUser?.uid ? { 'x-user-id': currentUser.uid } : {},
    });
    if (res.ok) {
      if (selectedAlbum?.id === albumId) setSelectedAlbum(null);
      loadAlbums();
      showToast('Album deleted');
    }
  };

  // Counts for sidebar badges
  const favoritesCount = photos.filter((p) => p.isFavorite && !p.isTrash).length;

  if (isPresentationMode) {
    return <PresentationDeck onExit={handleExitPresentation} />;
  }

  // If not logged in, display the Landing Homepage with interactive demo and AuthModal
  if (!currentUser) {
    return (
      <div className="min-h-screen w-full overflow-y-auto bg-[#EEF2F6] text-slate-800 font-sans">
        {/* Toast Notification */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl neo-raised-lg bg-slate-900 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <span>{notification}</span>
          </div>
        )}

        <LandingPage
          onOpenAuth={(mode) => {
            setAuthModalMode(mode);
            setShowAuthModal(true);
          }}
          onOpenPresentation={handleOpenPresentation}
          onExploreGuest={() => {
            const guestUser: AuthUser = {
              uid: 'guest_' + Date.now(),
              email: 'guest@pixsort.local',
              displayName: 'Guest Explorer',
              photoURL: null,
              isGuest: true,
            };
            handleAuthSuccess(guestUser);
          }}
        />

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(u) => {
            setShowAuthModal(false);
            handleAuthSuccess(u);
          }}
          initialMode={authModalMode}
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#EEF2F6] text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl neo-raised-lg bg-slate-900 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <AlertCircle className="w-4 h-4 text-blue-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header with Search Bar and Actions */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExecuteSearch={handleExecuteSearch}
        onClearSearch={handleClearSearch}
        onOpenUpload={() => setShowUploadModal(true)}
        onOpenInspector={() => setShowInspectorModal(true)}
        onOpenPresentation={handleOpenPresentation}
        systemStatus={systemStatus}
        isSearching={isSearching}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Layout Area */}
      <div className="flex flex-grow overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedAlbum(null);
            handleClearSearch();
          }}
          favoritesCount={favoritesCount}
          trashCount={0}
          albumsCount={albums.length}
          systemStatus={systemStatus}
          onOpenPresentation={handleOpenPresentation}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Center Gallery & Content */}
        <main className="flex-1 flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Breadcrumb if inside an album */}
          {selectedAlbum && !searchResponse && (
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={() => setSelectedAlbum(null)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl neo-btn text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Albums</span>
              </button>
              <h2 className="text-base font-bold text-slate-800">
                Album: {selectedAlbum.name} ({photos.length} photos)
              </h2>
            </div>
          )}

          {/* Active Search Results or Library View */}
          {searchResponse ? (
            <PhotoGrid
              photos={searchResponse.results}
              isSearchResult={true}
              searchQuery={searchResponse.query}
              interpretedFilter={searchResponse.interpretedFilter}
              executionTimeMs={searchResponse.executionTimeMs}
              onSelectPhoto={setSelectedPhoto}
              onToggleFavorite={handleToggleFavorite}
              onFindSimilar={handleFindSimilar}
              onClearSearch={handleClearSearch}
            />
          ) : activeTab === 'storage' ? (
            <StorageSettingsView
              onNotify={showToast}
              onAccountsUpdated={() => {
                loadSystemStatus();
                loadPhotos();
              }}
              currentUser={currentUser}
            />
          ) : activeTab === 'albums' && !selectedAlbum ? (
            <AlbumsView
              albums={albums}
              onSelectAlbum={(alb) => setSelectedAlbum(alb)}
              onCreateAlbum={handleCreateAlbum}
              onDeleteAlbum={handleDeleteAlbum}
            />
          ) : activeTab === 'trash' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h1 className="text-xl font-bold text-slate-800">Trash</h1>
                  <p className="text-xs text-slate-500">
                    Deleted photos are stored here before permanent removal
                  </p>
                </div>
              </div>

              {photos.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">Trash is empty</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="p-2 rounded-2xl neo-raised space-y-2">
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-200">
                        <img
                          src={photo.thumbnailUrl || photo.url}
                          alt={photo.filename}
                          className="w-full h-full object-cover opacity-75"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-mono text-slate-600 truncate">
                          {photo.filename}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRestorePhoto(photo)}
                            className="p-1.5 rounded-lg neo-btn text-blue-600 hover:text-blue-800"
                            title="Restore"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePhoto(photo)}
                            className="p-1.5 rounded-lg neo-btn text-rose-600 hover:text-rose-800"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <PhotoGrid
              photos={photos}
              isSearchResult={false}
              title={
                activeTab === 'favorites'
                  ? 'Favorite Memories'
                  : activeTab === 'recent'
                  ? 'Recently Added'
                  : undefined
              }
              onSelectPhoto={setSelectedPhoto}
              onToggleFavorite={handleToggleFavorite}
              onFindSimilar={handleFindSimilar}
            />
          )}
        </main>
      </div>

      {/* Fullscreen Photo Viewer Modal */}
      <PhotoViewerModal
        photo={selectedPhoto}
        allPhotos={searchResponse ? searchResponse.results : photos}
        albums={albums}
        onClose={() => setSelectedPhoto(null)}
        onSelectPhoto={setSelectedPhoto}
        onToggleFavorite={handleToggleFavorite}
        onDeletePhoto={handleDeletePhoto}
        onToggleAlbum={handleToggleAlbum}
        onFindSimilar={(p) => handleFindSimilar(p)}
      />

      {/* Similar Photos Modal (Vertex AI Vector Search direct result) */}
      <SimilarPhotosModal
        sourcePhoto={similarModal.source}
        similarPhotos={similarModal.results}
        isLoading={similarModal.loading}
        onClose={() => setSimilarModal({ source: null, results: [], loading: false })}
        onSelectPhoto={(p) => {
          setSimilarModal({ source: null, results: [], loading: false });
          setSelectedPhoto(p);
        }}
        onToggleFavorite={handleToggleFavorite}
        onFindSimilar={(p) => handleFindSimilar(p)}
      />

      {/* Upload Photo Modal */}
      {showUploadModal && (
        <UploadModal
          albums={albums}
          onClose={() => setShowUploadModal(false)}
          onOpenStorage={() => {
            setActiveTab('storage');
            handleClearSearch();
          }}
          onUploadSuccess={() => {
            loadPhotos();
            loadSystemStatus();
            showToast('Photo uploaded and indexed into Vertex AI Vector Search');
          }}
          currentUser={currentUser}
        />
      )}

      {/* Architecture Inspector Modal */}
      {showInspectorModal && (
        <ArchitectureInspectorModal
          systemStatus={systemStatus}
          onClose={() => setShowInspectorModal(false)}
          onRunTestQuery={(q) => {
            setSearchQuery(q);
            handleExecuteSearch(q);
          }}
        />
      )}
    </div>
  );
}
