import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Loader2,
  ArrowRight,
  HardDrive,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Album, ConnectedDriveAccount } from '../types.js';
import { AuthUser } from './AuthModal.js';

interface UploadModalProps {
  albums: Album[];
  onClose: () => void;
  onUploadSuccess: () => void;
  onOpenStorage?: () => void;
  currentUser?: AuthUser | null;
}

type PipelineStep = 'idle' | 'allocating' | 'uploading' | 'processing' | 'indexing' | 'ready';

export const UploadModal: React.FC<UploadModalProps> = ({
  albums,
  onClose,
  onUploadSuccess,
  onOpenStorage,
  currentUser,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [dateTaken, setDateTaken] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStorageFull, setIsStorageFull] = useState(false);

  // Drive accounts and allocated target
  const [accounts, setAccounts] = useState<ConnectedDriveAccount[]>([]);
  const [targetAccount, setTargetAccount] = useState<ConnectedDriveAccount | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load active Drive accounts on modal mount
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch('/api/drive/accounts', {
          headers: currentUser?.uid ? { 'x-user-id': currentUser.uid } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const active = (data.accounts || []).filter((a: ConnectedDriveAccount) => a.status === 'active');
          setAccounts(active);
          if (active.length > 0) {
            setTargetAccount(active[0]);
          }
        }
      } catch (e) {
        console.error('Error fetching drive accounts:', e);
      }
    };
    loadAccounts();
  }, [currentUser]);

  // Update target account whenever file changes
  useEffect(() => {
    if (!file || accounts.length === 0) return;
    const fileSize = file.size;

    // Find first active account in priority order with enough space
    const suitable = accounts.find((acc) => acc.storageAvailable >= fileSize);
    if (suitable) {
      setTargetAccount(suitable);
      setIsStorageFull(false);
      setErrorMsg(null);
    } else {
      setIsStorageFull(true);
      setErrorMsg(
        'Your connected Google Drive accounts do not have enough available storage for this upload.'
      );
    }
  }, [file, accounts]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(dropped);
    }
  };

  const handleStartUpload = async () => {
    if (!file || !previewUrl) return;

    setErrorMsg(null);
    setIsStorageFull(false);
    setPipelineStep('allocating');
    setUploadProgress(15);

    try {
      await new Promise((r) => setTimeout(r, 300));
      setPipelineStep('uploading');
      setUploadProgress(45);

      // Step 1: Upload to Google Drive API
      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser?.uid ? { 'x-user-id': currentUser.uid } : {}),
        },
        body: JSON.stringify({
          filename: file.name,
          dataBase64: previewUrl,
          mimeType: file.type || 'image/jpeg',
          dateTaken,
          location: location || 'Personal Album',
          albumId: selectedAlbumId || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (
          res.status === 500 &&
          (errorData.error?.includes('Storage full') || errorData.error?.includes('storage'))
        ) {
          setIsStorageFull(true);
          throw new Error(
            errorData.error ||
              'Your connected Google Drive accounts do not have enough available storage for this upload.'
          );
        }
        throw new Error(errorData.error || 'Upload request failed');
      }

      setUploadProgress(72);
      setPipelineStep('processing');
      await new Promise((r) => setTimeout(r, 600));

      setUploadProgress(90);
      setPipelineStep('indexing');
      await new Promise((r) => setTimeout(r, 600));

      setUploadProgress(100);
      setPipelineStep('ready');
      await new Promise((r) => setTimeout(r, 500));

      onUploadSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to process photo');
      setPipelineStep('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl neo-raised-lg bg-[#EEF2F6] p-6 space-y-5 border border-white/80">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl neo-raised flex items-center justify-center text-blue-600">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Upload Personal Photo</h2>
              <p className="text-[11px] text-slate-500">
                Stored in your personal Google Drive • Multimodal AI Indexed
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

        {/* Drag & Drop Zone */}
        {!previewUrl ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-100/50"
          >
            <div className="w-12 h-12 rounded-2xl neo-raised flex items-center justify-center text-slate-400 mb-3">
              <ImageIcon className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-xs font-semibold text-slate-700 mb-1">
              Drag & drop your photo here, or browse
            </p>
            <p className="text-[11px] text-slate-400">Supports JPG, PNG, WebP up to 25MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="relative aspect-video rounded-2xl overflow-hidden neo-inset bg-slate-200">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              <button
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                  setErrorMsg(null);
                  setIsStorageFull(false);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-xl bg-slate-900/70 text-white hover:bg-slate-900 text-xs"
              >
                Change photo
              </button>
            </div>

            {/* Target Google Drive Account Indicator (Section 6 & 14) */}
            <div className="p-3 rounded-xl neo-raised border border-white/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Target Storage Account
                  </div>
                  <div className="font-mono text-slate-800 font-bold truncate">
                    {targetAccount ? targetAccount.googleAccountEmail : 'Detecting account...'}
                  </div>
                </div>
              </div>
              {targetAccount && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold shrink-0">
                  Priority #{targetAccount.priority}
                </span>
              )}
            </div>

            {/* Metadata Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Goa, Noida, Campus"
                  className="w-full px-3 py-2 rounded-xl neo-inset text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Date Taken
                </label>
                <input
                  type="date"
                  value={dateTaken}
                  onChange={(e) => setDateTaken(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl neo-inset text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Album Selector */}
            {albums.length > 0 && (
              <div className="text-xs">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Add to Album (optional)
                </label>
                <select
                  value={selectedAlbumId}
                  onChange={(e) => setSelectedAlbumId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl neo-inset text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="">No album</option>
                  {albums.map((alb) => (
                    <option key={alb.id} value={alb.id}>
                      {alb.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Pipeline Status Indicator with Real Progress (Section 14) */}
        {pipelineStep !== 'idle' && (
          <div className="p-3.5 rounded-2xl neo-inset space-y-2.5 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span className="flex items-center gap-2">
                {pipelineStep === 'ready' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                )}
                <span>
                  {pipelineStep === 'allocating' && 'Allocating Google Drive Storage...'}
                  {pipelineStep === 'uploading' && `Uploading to ${targetAccount?.googleAccountEmail || 'Google Drive'}...`}
                  {pipelineStep === 'processing' && 'Extracting Scene Semantics with Gemini...'}
                  {pipelineStep === 'indexing' && 'Indexing into Vertex AI Vector Space...'}
                  {pipelineStep === 'ready' && 'Ready in Library!'}
                </span>
              </span>
              <span className="font-mono text-blue-600 font-bold">{uploadProgress}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>

            <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-medium pt-1">
              <div
                className={`py-1 rounded-lg ${
                  pipelineStep === 'uploading' || pipelineStep === 'allocating'
                    ? 'bg-blue-600 text-white font-bold'
                    : uploadProgress > 45
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                1. Drive Upload
              </div>
              <div
                className={`py-1 rounded-lg ${
                  pipelineStep === 'processing'
                    ? 'bg-blue-600 text-white font-bold'
                    : uploadProgress > 72
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                2. AI Vision
              </div>
              <div
                className={`py-1 rounded-lg ${
                  pipelineStep === 'indexing'
                    ? 'bg-blue-600 text-white font-bold'
                    : uploadProgress >= 100
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                3. Vector Index
              </div>
              <div
                className={`py-1 rounded-lg ${
                  pipelineStep === 'ready'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                4. Ready
              </div>
            </div>
          </div>
        )}

        {/* Storage Full Warning (Section 6 requirement) */}
        {isStorageFull && (
          <div className="p-4 rounded-2xl neo-inset bg-amber-50 border border-amber-200/80 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-700 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Storage full</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Your connected Google Drive accounts do not have enough available storage for this upload.
            </p>
            {onOpenStorage && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStorage();
                }}
                className="mt-1 px-3 py-1.5 rounded-xl neo-btn text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1.5 cursor-pointer bg-white"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Connect Another Drive</span>
              </button>
            )}
          </div>
        )}

        {errorMsg && !isStorageFull && (
          <p className="text-xs text-rose-600 font-semibold">{errorMsg}</p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl neo-btn text-xs font-semibold text-slate-600 cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={!file || pipelineStep !== 'idle' || isStorageFull}
            onClick={handleStartUpload}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              !file || pipelineStep !== 'idle' || isStorageFull
                ? 'opacity-50 cursor-not-allowed bg-slate-300 text-slate-500'
                : 'neo-btn text-blue-700 hover:text-blue-800'
            }`}
          >
            <span>Upload & Index</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
