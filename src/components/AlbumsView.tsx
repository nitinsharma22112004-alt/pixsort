import React, { useState } from 'react';
import { FolderPlus, Folder, Trash2, Image as ImageIcon } from 'lucide-react';
import { Album } from '../types.js';

interface AlbumsViewProps {
  albums: Album[];
  onSelectAlbum: (album: Album) => void;
  onCreateAlbum: (name: string) => Promise<void>;
  onDeleteAlbum: (albumId: string) => Promise<void>;
}

export const AlbumsView: React.FC<AlbumsViewProps> = ({
  albums,
  onSelectAlbum,
  onCreateAlbum,
  onDeleteAlbum,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateAlbum(newAlbumName.trim());
      setNewAlbumName('');
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Albums</h1>
          <p className="text-xs text-slate-500">Organize your memories into custom collections</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-2xl neo-btn text-xs font-bold text-blue-700 flex items-center gap-2"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Album</span>
        </button>
      </div>

      {albums.length === 0 ? (
        <div className="text-center py-16">
          <Folder className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No albums created yet</p>
          <p className="text-xs text-slate-500 mt-1">Create an album to organize your photos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {albums.map((album) => (
            <div
              key={album.id}
              className="group relative rounded-2xl neo-photo-card p-2 flex flex-col justify-between cursor-pointer"
              onClick={() => onSelectAlbum(album)}
            >
              {/* Cover Photo */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-200">
                {album.coverPhotoUrl ? (
                  <img
                    src={album.coverPhotoUrl}
                    alt={album.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-[10px]">Empty Album</span>
                  </div>
                )}

                {/* Delete Album Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete album "${album.name}"?`)) {
                      onDeleteAlbum(album.id);
                    }
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-xl bg-slate-900/60 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete album"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Album Info */}
              <div className="pt-2.5 px-1.5">
                <h3 className="text-xs font-bold text-slate-800 truncate">{album.name}</h3>
                <p className="text-[11px] text-slate-500">
                  {album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Album Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl neo-raised-lg bg-[#EEF2F6] p-6 space-y-4 border border-white/80">
            <h3 className="text-sm font-bold text-slate-800">Create New Album</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="text"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                placeholder="e.g. College Trip, Goa, Birthdays"
                autoFocus
                className="w-full px-3 py-2 rounded-xl neo-inset text-xs text-slate-800 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl neo-btn text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newAlbumName.trim()}
                  className="px-4 py-2 rounded-xl neo-btn text-xs font-bold text-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
