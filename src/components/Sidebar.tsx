import React from 'react';
import {
  Image,
  Heart,
  FolderHeart,
  Clock,
  Trash2,
  Cpu,
  CheckCircle2,
  HardDrive,
  Database,
  Presentation,
  LogOut,
  User,
} from 'lucide-react';
import { SystemStatus } from '../types.js';
import { AuthUser } from './AuthModal.js';

export type ActiveTab = 'photos' | 'favorites' | 'albums' | 'recent' | 'trash' | 'storage';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  favoritesCount: number;
  trashCount: number;
  albumsCount: number;
  systemStatus: SystemStatus | null;
  onOpenPresentation?: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  favoritesCount,
  trashCount,
  albumsCount,
  systemStatus,
  onOpenPresentation,
  currentUser,
  onLogout,
}) => {
  const navItems = [
    { id: 'photos' as ActiveTab, label: 'Photos', icon: Image },
    { id: 'favorites' as ActiveTab, label: 'Favorites', icon: Heart, count: favoritesCount },
    { id: 'albums' as ActiveTab, label: 'Albums', icon: FolderHeart, count: albumsCount },
    { id: 'recent' as ActiveTab, label: 'Recently Added', icon: Clock },
    {
      id: 'storage' as ActiveTab,
      label: 'Connected Storage',
      icon: HardDrive,
      count: systemStatus?.googleDriveActiveCount,
    },
    { id: 'trash' as ActiveTab, label: 'Trash', icon: Trash2, count: trashCount },
  ];

  return (
    <aside className="sidebar w-64 shrink-0 bg-[#EEF2F6] neo-raised rounded-3xl border border-white/70 p-4 my-4 ml-4 mb-4 flex flex-col justify-between hidden md:flex sticky top-4 self-start max-h-[calc(100vh-5.5rem)] overflow-y-auto z-20 shadow-sm transition-all duration-200">
      {/* Navigation Links */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
          Library & Storage
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'neo-inset text-blue-700 font-bold'
                  : 'neo-btn text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
        {/* Project Presentation Deck Shortcut */}
        {onOpenPresentation && (
          <div className="pt-2">
            <button
              onClick={onOpenPresentation}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold neo-btn text-purple-700 hover:text-purple-900 transition-all border border-purple-200/50 cursor-pointer"
              title="Open Project Presentation Deck (/presentation)"
            >
              <div className="flex items-center gap-2.5">
                <Presentation className="w-4 h-4 text-purple-600" />
                <span>Project Deck</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">
                PPT
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Google Cloud Services & Search Architecture Status Card */}
      <div className="mt-8 p-3.5 rounded-2xl neo-raised border border-white/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            AI & Storage Pool
          </span>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Active
          </span>
        </div>

        <div className="space-y-1.5 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Search Engine</span>
            <span className="font-semibold text-emerald-700 flex items-center gap-1">
              Local Semantic
              <span className="text-[9px] font-mono bg-emerald-100 text-emerald-700 px-1 py-0.2 rounded font-bold">
                0 API
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Ingestion Vision</span>
            <span className="font-medium text-slate-700">Gemini 2.5 Flash</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Vector Index</span>
            <span className="font-medium text-slate-700">
              Vertex AI ({systemStatus?.indexedVectorsCount ?? 0})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Metadata DB</span>
            <span className="font-medium text-slate-700 flex items-center gap-1">
              Firestore
              {systemStatus?.firestoreConnected && (
                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-100 px-1.5 py-0.5 rounded-full">
                  Live
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Photo Store</span>
            <span className="font-medium text-blue-700 flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-blue-600" />
              Drive API ({systemStatus?.googleDriveActiveCount ?? 1} Pooled)
            </span>
          </div>
        </div>
      </div>

      {/* User Account Session Card */}
      {currentUser && (
        <div className="p-3 rounded-2xl neo-inset bg-white/60 border border-white/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                className="w-7 h-7 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">
                {currentUser.displayName || 'User'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                {currentUser.email}
              </div>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-xl neo-btn text-slate-400 hover:text-rose-600 cursor-pointer shrink-0 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
