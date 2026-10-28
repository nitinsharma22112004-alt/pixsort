import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  HardDrive,
  Cloud,
  Eye,
  ShieldCheck,
  FolderHeart,
  ArrowRight,
  Zap,
  PlayCircle,
  GraduationCap,
  Layers,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onOpenPresentation: () => void;
  onExploreGuest: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onOpenPresentation,
  onExploreGuest,
}) => {
  const [demoQuery, setDemoQuery] = useState('happy dinner with friends');
  const [activeDemoResult, setActiveDemoResult] = useState({
    title: 'Family & Friends Gathering',
    description: 'A cozy evening dinner gathering around a dining table with candlelight, warm smiles, and pasta dishes.',
    tags: ['Dinner', 'Friends', 'Candlelight', 'Pasta', 'Celebration'],
    match: 94,
    driveAccount: 'omprakashverma.in@gmail.com',
    folder: 'AI Photo Search/Photos/2026/09/',
  });

  const demoQueries = [
    {
      q: 'happy dinner with friends',
      title: 'Family & Friends Gathering',
      description: 'A cozy evening dinner gathering around a dining table with candlelight, warm smiles, and pasta dishes.',
      tags: ['Dinner', 'Friends', 'Candlelight', 'Pasta', 'Celebration'],
      match: 94,
    },
    {
      q: 'college id card',
      title: 'Academic Student Credential',
      description: 'Close-up photograph of an official student identity badge showing photo, roll number, and department stamp.',
      tags: ['ID Card', 'College', 'Student', 'Document', 'CSE'],
      match: 97,
    },
    {
      q: 'sunset on the beach',
      title: 'Golden Hour Waves',
      description: 'Vibrant sunset overlooking the ocean horizon with golden reflection on ocean surf and silhouette of palms.',
      tags: ['Sunset', 'Ocean', 'Beach', 'Golden Hour', 'Waves'],
      match: 96,
    },
    {
      q: 'drinking coffee outside',
      title: 'Morning Cafe Terrace',
      description: 'A person holding a warm ceramic cappuccino mug at an outdoor European-style sidewalk cafe in morning sunlight.',
      tags: ['Coffee', 'Cafe', 'Outdoor', 'Morning', 'Relaxing'],
      match: 92,
    },
  ];

  return (
    <div className="min-h-screen bg-[#EEF2F6] text-slate-800 flex flex-col selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#EEF2F6]/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center text-blue-600 bg-white">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                <span>PixSort</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Google AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Multimodal Photo Intelligence &amp; Pooled Google Drive
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenPresentation}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 cursor-pointer bg-white transition-all shadow-xs border border-slate-200"
            >
              <PlayCircle className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Presentation Deck</span>
              <span className="sm:hidden">PPT</span>
            </button>

            <button
              onClick={() => onOpenAuth('signin')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 hover:text-blue-700 cursor-pointer bg-white transition-all shadow-xs border border-slate-200"
            >
              Sign In
            </button>

            <button
              onClick={() => onOpenAuth('signup')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-all shadow-md shadow-blue-500/25 flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 sm:px-8 pt-10 sm:pt-16 pb-12">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Institutional Project Badge */}
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase px-3 py-1.5 rounded-full neo-inset bg-white/70 border border-white text-blue-800">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>ABES Engineering College · Capstone Defense 2026</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Find any photo instantly.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600">
              Without manual folders or tags.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Search your personal photo memories by describing what you remember in natural conversational language.
            Photos stay safely inside your own <strong>Google Drive</strong> accounts with automatic capacity pooling.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={() => onOpenAuth('signup')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onExploreGuest}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-800 hover:text-blue-700 bg-white cursor-pointer transition-all shadow-xs border border-slate-200 hover:border-blue-300 flex items-center justify-center gap-2"
            >
              <span>Explore Demo as Guest</span>
            </button>
          </div>

          {/* Value Highlights */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-mono">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Zero-API Search (~3ms)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pooled Google Drive (15 GB + 15 GB)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Gemini 2.5 Flash Vision</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live AI Search Demo Showcase */}
      <section className="px-4 sm:px-8 py-8">
        <div className="max-w-4xl mx-auto rounded-3xl neo-raised-lg bg-white p-6 sm:p-8 space-y-6 border border-slate-200/80 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                Live Interactive Preview
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                See How PixSort Understands Context
              </h2>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold self-start sm:self-auto">
              Vector Search: 3ms Response
            </span>
          </div>

          {/* Interactive Search Bar */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-2xl neo-inset bg-slate-100/70 border border-slate-200">
              <Search className="w-5 h-5 text-blue-600 shrink-0" />
              <input
                type="text"
                readOnly
                value={demoQuery}
                className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
              />
              <span className="text-xs font-mono font-bold text-emerald-600 shrink-0">
                cos(θ) = {(activeDemoResult.match / 100).toFixed(2)}
              </span>
            </div>

            {/* Clickable Quick Prompts */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">Try clicking:</span>
              {demoQueries.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDemoQuery(item.q);
                    setActiveDemoResult({
                      ...item,
                      driveAccount: 'omprakashverma.in@gmail.com',
                      folder: 'AI Photo Search/Photos/2026/09/',
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                    demoQuery === item.q
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30'
                      : 'bg-white text-slate-700 border-slate-200 hover:text-blue-700 hover:border-blue-300 shadow-xs'
                  }`}
                >
                  &ldquo;{item.q}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {/* Simulated Result Card */}
          <div className="p-4 sm:p-5 rounded-2xl neo-inset bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {activeDemoResult.match}% Match
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {activeDemoResult.title}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Stored in: {activeDemoResult.driveAccount}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
              <strong>Gemini 2.5 Flash Vision Analysis:</strong> &ldquo;{activeDemoResult.description}&rdquo;
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeDemoResult.tags.map((t, i) => (
                <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                  #{t}
                </span>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200/80 text-[11px] font-mono text-blue-700 flex items-center justify-between">
              <span>Drive Path: {activeDemoResult.folder}photo_demo.jpg</span>
              <span className="text-emerald-700 font-bold">✓ 0 API calls on search</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Feature Pillars */}
      <section className="px-4 sm:px-8 py-12 max-w-6xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
            System Pillars
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Engineered for Privacy, Ownership &amp; Speed
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl neo-raised bg-white border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl neo-raised flex items-center justify-center text-blue-600 bg-blue-50">
                <HardDrive className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Pooled Google Drive
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect multiple personal Google Drive accounts (15 GB + 15 GB). Photos stay in your own Drive with automatic capacity failover.
              </p>
            </div>
            <div className="text-[11px] font-mono text-emerald-700 font-bold pt-2 border-t border-slate-100">
              ✓ User Owns Raw Files
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl neo-raised bg-white border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl neo-raised flex items-center justify-center text-purple-600 bg-purple-50">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Gemini 2.5 Flash Vision
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multimodal vision examines every uploaded image like human eyes: recognizing faces, objects, activities, and emotional lighting.
              </p>
            </div>
            <div className="text-[11px] font-mono text-purple-700 font-bold pt-2 border-t border-slate-100">
              ✓ Full Scene Intelligence
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-2xl neo-raised bg-white border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl neo-raised flex items-center justify-center text-emerald-600 bg-emerald-50">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Zero-API ~3ms Search
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                High-dimensional cosine vector search runs entirely in RAM. Every search executes in ~3 milliseconds with $0 recurring cloud cost.
              </p>
            </div>
            <div className="text-[11px] font-mono text-emerald-700 font-bold pt-2 border-t border-slate-100">
              ✓ Budget-Guard Architecture
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-2xl neo-raised bg-white border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl neo-raised flex items-center justify-center text-rose-600 bg-rose-50">
                <FolderHeart className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Virtual Smart Albums
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Group memories into Favorites, College, and Family simultaneously without duplicating raw image files on Google Drive.
              </p>
            </div>
            <div className="text-[11px] font-mono text-rose-700 font-bold pt-2 border-t border-slate-100">
              ✓ 0 Storage Duplication
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Banner */}
      <section className="px-4 sm:px-8 py-10 mt-auto">
        <div className="max-w-4xl mx-auto rounded-3xl neo-raised bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 text-white p-8 text-center space-y-5 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ready to experience next-generation photo intelligence?
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto leading-relaxed">
            Create an account in seconds, connect your Google Drive, and search through all your memories naturally.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenAuth('signup')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-blue-900 font-bold text-xs hover:bg-blue-50 cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <span>Get Started with Google Drive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onOpenAuth('signin')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-950/70 hover:bg-blue-950 text-white font-bold text-xs cursor-pointer transition-all border border-blue-400/40 shadow-sm"
            >
              Sign In to Existing Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 px-4 sm:px-8 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            PixSort · ABES Engineering College CSE Capstone Project · Session 2025–2026
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onOpenPresentation} className="hover:text-blue-700 underline cursor-pointer">
              Slide Deck
            </button>
            <button onClick={() => onOpenAuth('signin')} className="hover:text-blue-700 underline cursor-pointer">
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
