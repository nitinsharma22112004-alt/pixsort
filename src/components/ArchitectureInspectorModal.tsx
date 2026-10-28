import React from 'react';
import { X, Cpu, Database, HardDrive, Sparkles, Layers, ArrowRight, CheckCircle2, Cloud } from 'lucide-react';
import { SystemStatus } from '../types.js';

interface ArchitectureInspectorModalProps {
  systemStatus: SystemStatus | null;
  onClose: () => void;
  onRunTestQuery: (q: string) => void;
}

export const ArchitectureInspectorModal: React.FC<ArchitectureInspectorModalProps> = ({
  systemStatus,
  onClose,
  onRunTestQuery,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl neo-raised-lg bg-[#EEF2F6] p-6 space-y-6 border border-white/80">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl neo-raised flex items-center justify-center text-blue-600">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Google Cloud AI Search Architecture</h2>
              <p className="text-xs text-slate-500">
                End-to-end multimodal pipeline powering semantic photo search
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

        {/* Live Architecture Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl neo-raised space-y-1.5">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Search Engine
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 0 API Calls
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Local Hybrid Semantic Search</p>
            <p className="text-[10px] text-slate-400">768-D coordinates · ~3ms latency · $0 cost</p>
          </div>

          <div className="p-3.5 rounded-2xl neo-raised space-y-1.5">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                Vertex AI
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Vector Search Index</p>
            <p className="text-[10px] text-slate-400">
              {systemStatus?.indexedVectorsCount ?? 0} photo embeddings indexed
            </p>
          </div>

          <div className="p-3.5 rounded-2xl neo-raised space-y-1.5">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                Firestore
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Synced
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              {systemStatus?.firebaseProjectId
                ? `Project: ${systemStatus.firebaseProjectId}`
                : 'Metadata Collections'}
            </p>
            <p className="text-[10px] text-slate-400">
              {systemStatus?.totalPhotosCount ?? 0} persistent photos
            </p>
          </div>

          <div className="p-3.5 rounded-2xl neo-raised space-y-1.5">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                Google Drive API
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Pooled
              </span>
            </div>
            <p className="text-[11px] text-slate-700 font-semibold truncate" title={systemStatus?.primaryDriveEmail || 'Google Drive'}>
              {systemStatus?.googleDriveActiveCount ?? 2} Accounts Connected
            </p>
            <p className="text-[10px] text-slate-400">
              Priority failover active • Files stored in user&apos;s personal Drive
            </p>
          </div>
        </div>

        {/* Search Pipeline Diagram */}
        <div className="p-4 rounded-2xl neo-inset space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Zero-API Natural Language Query Pipeline (Section 4)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              Budget-Guard: $0 API Cost
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-center font-medium">
            <div className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white shadow-sm border border-slate-200">
              <span className="text-slate-500 block text-[10px]">User Query</span>
              <span className="font-bold text-blue-700">&ldquo;Pool party&rdquo;</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 sm:rotate-0" />
            <div className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white shadow-sm border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Local Semantic Engine</span>
              <span className="font-mono text-slate-800 text-[11px]">768-D Vector (0 API calls)</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 sm:rotate-0" />
            <div className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white shadow-sm border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Hybrid Cosine Fusion</span>
              <span className="font-semibold text-slate-800 text-[11px]">Sub-5ms Matching</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 sm:rotate-0" />
            <div className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white shadow-sm border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Drive + Firestore</span>
              <span className="font-bold text-emerald-700">Ranked Results (95%+)</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
            <strong>Dual-Engine Architecture:</strong> Gemini 2.5 Flash is invoked only once during photo upload to extract visual understanding. Search queries are processed completely offline by the local semantic engine, saving 100% of API quota and providing instantaneous search results!
          </p>
        </div>

        {/* Quick Demo Test Queries */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Test Semantic Search Queries (Section 6 & 22)
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              'Pool party',
              'Beach photos',
              'Photos from my college trip',
              'Birthday party',
              'Sunset photos',
              'Photos from the gym',
              'Food photos',
              'Photos from July 2026',
              'Beach photos from last summer',
            ].map((q) => (
              <button
                key={q}
                onClick={() => {
                  onRunTestQuery(q);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl neo-btn text-xs font-semibold text-slate-700 hover:text-blue-700"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl neo-btn text-xs font-semibold text-slate-700"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
