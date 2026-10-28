import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Info,
  Server,
  Cloud,
  ChevronRight,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConnectedDriveAccount } from '../types.js';
import { AuthUser } from './AuthModal.js';

interface StorageSettingsViewProps {
  onNotify?: (msg: string) => void;
  onAccountsUpdated?: () => void;
  currentUser?: AuthUser | null;
}

export const StorageSettingsView: React.FC<StorageSettingsViewProps> = ({
  onNotify,
  onAccountsUpdated,
  currentUser,
}) => {
  const [accounts, setAccounts] = useState<ConnectedDriveAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  // Connect modal state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customQuotaGb, setCustomQuotaGb] = useState('15');
  const [customUsedGb, setCustomUsedGb] = useState('1.5');
  const [isConnecting, setIsConnecting] = useState(false);

  // Disconnect warning modal state (Section 15 requirement)
  const [accountToDisconnect, setAccountToDisconnect] = useState<ConnectedDriveAccount | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Delete storage warning modal state
  const [accountToDelete, setAccountToDelete] = useState<ConnectedDriveAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/drive/accounts', {
        headers: currentUser?.uid ? { 'x-user-id': currentUser.uid } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Failed to load drive accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [currentUser]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  const getUsagePercentage = (used: number, limit: number): number => {
    if (limit <= 0) return 0;
    const pct = (used / limit) * 100;
    return Math.min(100, Math.round(pct * 10) / 10);
  };

  // Reorder priorities (Section 8)
  const handleMovePriority = async (index: number, direction: 'up' | 'down') => {
    const newAccounts = [...accounts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newAccounts.length) return;

    const temp = newAccounts[index];
    newAccounts[index] = newAccounts[targetIndex];
    newAccounts[targetIndex] = temp;

    setAccounts(newAccounts);

    try {
      const res = await fetch('/api/drive/accounts/priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds: newAccounts.map((a) => a.id) }),
      });
      if (res.ok) {
        onNotify?.('Storage priority updated');
        onAccountsUpdated?.();
      }
    } catch (err) {
      console.error('Priority update error:', err);
      fetchAccounts();
    }
  };

  // Disconnect confirmation
  const handleConfirmDisconnect = async () => {
    if (!accountToDisconnect) return;
    setIsDisconnecting(true);
    try {
      const res = await fetch(`/api/drive/accounts/${accountToDisconnect.id}/disconnect`, {
        method: 'POST',
      });
      if (res.ok) {
        onNotify?.(`Disconnected ${accountToDisconnect.googleAccountEmail}. Files preserved.`);
        setAccountToDisconnect(null);
        await fetchAccounts();
        onAccountsUpdated?.();
      }
    } catch (err) {
      console.error('Disconnect error:', err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Delete account confirmation
  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/drive/accounts/${accountToDelete.id}`, {
        method: 'DELETE',
        headers: currentUser?.uid ? { 'x-user-id': currentUser.uid } : {},
      });
      if (res.ok) {
        onNotify?.(`Storage account ${accountToDelete.googleAccountEmail} deleted.`);
        setAccountToDelete(null);
        await fetchAccounts();
        onAccountsUpdated?.();
      } else {
        const data = await res.json().catch(() => ({}));
        onNotify?.(data.error || 'Failed to delete storage account.');
      }
    } catch (err) {
      console.error('Delete storage error:', err);
      onNotify?.('Failed to delete storage account.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reconnect account
  const handleReconnect = async (account: ConnectedDriveAccount) => {
    try {
      const res = await fetch(`/api/drive/accounts/${account.id}/reconnect`, {
        method: 'POST',
      });
      if (res.ok) {
        onNotify?.(`Reconnected ${account.googleAccountEmail}`);
        await fetchAccounts();
        onAccountsUpdated?.();
      }
    } catch (err) {
      console.error('Reconnect error:', err);
    }
  };

  // Fresh quota check from Drive API
  const handleRefreshStats = async (account: ConnectedDriveAccount) => {
    setRefreshingId(account.id);
    try {
      const res = await fetch(`/api/drive/accounts/${account.id}/stats`);
      if (res.ok) {
        await fetchAccounts();
        onNotify?.(`Quota refreshed for ${account.googleAccountEmail}`);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshingId(null);
    }
  };

  // Connect new account (Section 2)
  const connectAccountByEmail = async (
    email: string,
    storageLimitGb = 15,
    storageUsedGb = 1.2,
    accessToken?: string
  ) => {
    try {
      setIsConnecting(true);
      const res = await fetch('/api/drive/accounts/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser?.uid ? { 'x-user-id': currentUser.uid } : {}),
        },
        body: JSON.stringify({
          email: email.trim(),
          storageLimitGb,
          storageUsedGb,
          accessToken,
        }),
      });

      if (res.ok) {
        onNotify?.(`Connected Google Drive account: ${email.trim()}`);
        setShowConnectModal(false);
        setCustomEmail('');
        await fetchAccounts();
        onAccountsUpdated?.();
      } else {
        const data = await res.json();
        onNotify?.(data.error || 'Failed to connect account.');
      }
    } catch (err: any) {
      console.error('Connect account error:', err);
      onNotify?.(err.message || 'Connection error.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    await connectAccountByEmail(
      customEmail.trim(),
      parseFloat(customQuotaGb) || 15,
      parseFloat(customUsedGb) || 1.5
    );
  };

  // Google Sign-In Popup with Drive scopes
  const handleGooglePopupAuth = async () => {
    try {
      setIsConnecting(true);
      const configRes = await fetch('/api/drive/config');
      if (!configRes.ok) {
        throw new Error('Configuration not available');
      }
      const config = await configRes.json();

      const { initializeApp, getApps } = await import('firebase/app');
      const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');

      const apps = getApps();
      const app = apps.length > 0 ? apps[0] : initializeApp(config);
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive.file');

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      const email = result.user?.email || 'omprakashverma.in@gmail.com';

      await connectAccountByEmail(email, 15, 1.2, accessToken);
    } catch (err: any) {
      console.error('Google popup sign-in error:', err);
      const msg =
        err.code === 'auth/unauthorized-domain'
          ? 'Domain localhost is not authorized on shared Firebase project. Please click "Connect Now" under Option 1 above!'
          : err.code === 'auth/popup-closed-by-user'
          ? 'Google popup was blocked or closed. Click "Connect Now" under Option 1 to connect instantly!'
          : (err.message || 'Popup sign-in not available. Please use Option 1.');
      onNotify?.(msg);
    } finally {
      setIsConnecting(false);
    }
  };

  // Real Google OAuth trigger
  const handleStartOAuth = async () => {
    try {
      const res = await fetch('/api/drive/oauth/url');
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (err) {
      console.error('OAuth redirect error:', err);
    }
  };

  const totalPoolLimit = accounts.filter((a) => a.status === 'active').reduce((acc, a) => acc + a.storageLimit, 0);
  const totalPoolUsed = accounts.filter((a) => a.status === 'active').reduce((acc, a) => acc + a.storageUsed, 0);
  const totalPoolPct = getUsagePercentage(totalPoolUsed, totalPoolLimit);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <HardDrive className="w-4 h-4" />
            <span>Connected Storage</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
            Google Drive Storage
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your photos are stored in your own Google Drive accounts.
          </p>
        </div>

        <button
          onClick={() => setShowConnectModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl neo-btn text-xs font-bold text-blue-700 hover:text-blue-900 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-blue-600" />
          <span>+ Connect Google Drive</span>
        </button>
      </div>

      {/* Failover & Automatic Allocation Banner (Section 5 & 17) */}
      <div className="p-4 rounded-2xl neo-inset border border-white/60 space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl neo-raised flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-800">
              Automatic Storage Failover & Allocation
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Storage automatically switches to your next connected Drive when the current Drive runs out of space.
              All connected accounts are pooled together into one seamless, unified photo library.
            </p>
          </div>
        </div>

        {/* Aggregate Storage Progress Bar */}
        <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Total Pooled Storage:</span>
            <span className="font-mono text-slate-900 font-bold">
              {formatBytes(totalPoolUsed)} / {formatBytes(totalPoolLimit)} used
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
              {totalPoolPct}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            {accounts.filter((a) => a.status === 'active').length} Active Drive Accounts Pooled
          </div>
        </div>
      </div>

      {/* Connected Accounts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Connected Accounts ({accounts.length})
          </h2>
          <span className="text-[11px] text-slate-400">
            Order determines priority for new photo uploads
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading connected Drive accounts...</div>
        ) : accounts.length === 0 ? (
          <div className="p-8 rounded-2xl neo-raised text-center space-y-3">
            <HardDrive className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No Google Drive accounts connected yet</p>
            <button
              onClick={() => setShowConnectModal(true)}
              className="px-4 py-2 rounded-xl neo-btn text-xs font-bold text-blue-700"
            >
              + Connect Google Drive
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((acc, index) => {
              const pct = getUsagePercentage(acc.storageUsed, acc.storageLimit);
              const isActive = acc.status === 'active';
              const isFull = pct >= 95;

              return (
                <div
                  key={acc.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isActive
                      ? 'neo-raised bg-[#EEF2F6] border-white/80'
                      : 'opacity-70 bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Account Identity & Status */}
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          disabled={index === 0}
                          onClick={() => handleMovePriority(index, 'up')}
                          className={`p-1 rounded-lg neo-btn transition-colors ${
                            index === 0
                              ? 'opacity-30 cursor-not-allowed text-slate-300'
                              : 'text-slate-600 hover:text-blue-600'
                          }`}
                          title="Increase Priority (Move Up)"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          #{acc.priority}
                        </span>
                        <button
                          disabled={index === accounts.length - 1}
                          onClick={() => handleMovePriority(index, 'down')}
                          className={`p-1 rounded-lg neo-btn transition-colors ${
                            index === accounts.length - 1
                              ? 'opacity-30 cursor-not-allowed text-slate-300'
                              : 'text-slate-600 hover:text-blue-600'
                          }`}
                          title="Decrease Priority (Move Down)"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            isActive ? (isFull ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500') : 'bg-slate-400'
                          }`} />
                          <span className="text-sm font-bold text-slate-800 font-mono">
                            {acc.googleAccountEmail}
                          </span>
                          {index === 0 && isActive && (
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3">
                          <span>Status: <strong className={isActive ? 'text-emerald-700' : 'text-slate-500'}>
                            {isActive ? 'Active' : 'Disconnected'}
                          </strong></span>
                          <span>•</span>
                          <span>Photos: <strong className="text-slate-800 font-mono">{acc.photoCount}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleRefreshStats(acc)}
                        disabled={refreshingId === acc.id}
                        className="p-2 rounded-xl neo-btn text-slate-600 hover:text-blue-600 transition-colors"
                        title="Check Fresh Quota from Google Drive API"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshingId === acc.id ? 'animate-spin text-blue-600' : ''}`} />
                      </button>

                      {isActive ? (
                        <button
                          onClick={() => setAccountToDisconnect(acc)}
                          className="px-3 py-1.5 rounded-xl neo-btn text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReconnect(acc)}
                          className="px-3 py-1.5 rounded-xl neo-btn text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reconnect</span>
                        </button>
                      )}

                      <button
                        onClick={() => setAccountToDelete(acc)}
                        className="px-3 py-1.5 rounded-xl neo-btn text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Delete Storage from PixSort"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Storage Bar (Section 3 & 17) */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-600 font-medium">
                        {formatBytes(acc.storageUsed)} / {formatBytes(acc.storageLimit)} used
                      </span>
                      <span className={`font-bold ${isFull ? 'text-amber-700' : 'text-slate-700'}`}>
                        {pct}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full neo-inset bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 95
                            ? 'bg-rose-500'
                            : pct >= 80
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                      <span>Available: {formatBytes(acc.storageAvailable)}</span>
                      <span>Folder: AI Photo Search/Photos/</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={() => setShowConnectModal(true)}
            className="w-full py-3 rounded-2xl neo-btn text-xs font-bold text-slate-700 hover:text-blue-700 flex items-center justify-center gap-2 border border-slate-200/50 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>+ Connect Another Google Drive</span>
          </button>
        </div>
      </div>

      {/* Disconnect Warning Modal (Section 15 requirement) */}
      <AnimatePresence>
        {accountToDisconnect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl neo-raised-lg bg-[#EEF2F6] p-6 space-y-4 border border-white/80"
            >
              <div className="flex items-center gap-3 text-amber-600">
                <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Disconnect Google Drive?</h3>
                  <p className="text-xs text-slate-500 font-mono">{accountToDisconnect.googleAccountEmail}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl neo-inset bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
                <p className="font-semibold">
                  Photos currently stored in this Google Drive account will no longer be accessible to this application after disconnecting.
                </p>
                <div className="mt-2 pt-2 border-t border-amber-200/40 font-mono text-[11px] space-y-0.5">
                  <div>This account currently contains:</div>
                  <div className="font-bold text-slate-800">
                    {accountToDisconnect.photoCount} photos • {formatBytes(accountToDisconnect.storageUsed)}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                <em>Note:</em> Your original photo files will remain completely safe inside your personal Google Drive and will NOT be deleted.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  disabled={isDisconnecting}
                  onClick={() => setAccountToDisconnect(null)}
                  className="px-4 py-2 rounded-xl neo-btn text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={isDisconnecting}
                  onClick={handleConfirmDisconnect}
                  className="px-4 py-2 rounded-xl neo-btn text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                >
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect Account'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Storage Warning Modal */}
      <AnimatePresence>
        {accountToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl neo-raised-lg bg-[#EEF2F6] p-6 space-y-4 border border-white/80"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center text-rose-600 shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900">Delete Google Drive Storage?</h3>
                  <p className="text-xs text-slate-500 font-mono truncate">{accountToDelete.googleAccountEmail}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl neo-inset bg-rose-50/50 border border-rose-200/60 text-xs text-rose-900 leading-relaxed">
                <p className="font-semibold">
                  This Google Drive storage account will be completely removed from your PixSort storage pool.
                </p>
                <div className="mt-2 pt-2 border-t border-rose-200/40 font-mono text-[11px] space-y-0.5">
                  <div>Account details:</div>
                  <div className="font-bold text-slate-800">
                    {accountToDelete.photoCount} indexed photos • {formatBytes(accountToDelete.storageUsed)} used
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                <em>Note:</em> Your files inside your personal Google Drive account will <strong>NOT</strong> be deleted. Only the connection in PixSort will be removed.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  disabled={isDeleting}
                  onClick={() => setAccountToDelete(null)}
                  className="px-4 py-2 rounded-xl neo-btn text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl neo-btn text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete Storage'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Connect Account Modal (Section 2 & 16) */}
      <AnimatePresence>
        {showConnectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl neo-raised-lg bg-[#EEF2F6] p-6 space-y-5 border border-white/80"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl neo-raised flex items-center justify-center text-blue-600">
                    <Cloud className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Connect Google Drive</h3>
                    <p className="text-xs text-slate-500">
                      Pool storage across your personal Google accounts
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="p-1.5 rounded-xl neo-btn text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Single Unified Google Drive Connect Interface */}
              <div className="space-y-4">
                {/* Official Google Sign-In Button */}
                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={handleGooglePopupAuth}
                  className="w-full py-3.5 px-4 rounded-2xl neo-btn flex items-center justify-center gap-3 text-xs font-bold text-slate-800 hover:text-blue-700 bg-white border border-blue-200/80 cursor-pointer shadow-sm transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="text-sm">
                    {isConnecting ? 'Connecting...' : 'Sign in with Google Account'}
                  </span>
                </button>

                <div className="flex items-center gap-3 text-slate-400 text-xs">
                  <div className="h-px bg-slate-300/70 flex-1" />
                  <span>or enter email</span>
                  <div className="h-px bg-slate-300/70 flex-1" />
                </div>

                {/* Direct Google Account Email Link */}
                <form onSubmit={handleConnectSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Google Drive Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. omprakashverma.in@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl neo-inset text-slate-800 text-xs focus:outline-none bg-white border border-slate-200"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowConnectModal(false)}
                      className="px-4 py-2 rounded-xl neo-btn text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isConnecting || !customEmail}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-50 transition-all shadow-md shadow-blue-500/25"
                    >
                      {isConnecting ? 'Connecting...' : 'Connect Google Drive'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
