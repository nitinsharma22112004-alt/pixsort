import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Play,
  Pause,
  Home,
  LayoutGrid,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Slide0Team,
  Slide1Synopsis,
  Slide2Pipeline,
  Slide3Problem,
  Slide4Objectives,
  Slide5Methodology,
  Slide6TechStack,
  Slide7Architecture,
  Slide8Features,
  Slide9Outcome,
  Slide10Conclusion,
} from './PresentationSlides.js';
import { SlideThemeContext, SlideTheme } from './PresentationThemeContext.js';

interface PresentationDeckProps {
  onExit: () => void;
}

const TOTAL_SLIDES = 11;

const SLIDE_TITLES = [
  'Team & Institutional Credentials',
  'Project Synopsis & Paradigm',
  'Processing Pipeline Flow',
  'Problem Statement & Gap Analysis',
  'Engineering Objectives & Scope',
  'Mathematical Model & Vector Space',
  'Technology Stack & Layers',
  'System Topology & DFD Level 1',
  'Core Modules & Cloud Principles',
  'Performance Evaluation & Live Lab',
  'Conclusion & Future Roadmap',
];

export const PresentationDeck: React.FC<PresentationDeckProps> = ({ onExit }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [theme, setTheme] = useState<SlideTheme>('light');

  const isDark = theme === 'dark';

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => (prev < TOTAL_SLIDES - 1 ? prev + 1 : prev));
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentSlide(TOTAL_SLIDES - 1);
      } else if (e.key === 'Escape') {
        if (showThumbnails) {
          setShowThumbnails(false);
        } else {
          onExit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onExit, showThumbnails]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlay) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev < TOTAL_SLIDES - 1 ? prev + 1 : 0));
    }, 12000);
    return () => clearInterval(timer);
  }, [isAutoPlay]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const renderCurrentSlide = () => {
    switch (currentSlide) {
      case 0:
        return <Slide0Team />;
      case 1:
        return <Slide1Synopsis />;
      case 2:
        return <Slide2Pipeline />;
      case 3:
        return <Slide3Problem />;
      case 4:
        return <Slide4Objectives />;
      case 5:
        return <Slide5Methodology />;
      case 6:
        return <Slide6TechStack />;
      case 7:
        return <Slide7Architecture />;
      case 8:
        return <Slide8Features />;
      case 9:
        return <Slide9Outcome />;
      case 10:
        return <Slide10Conclusion />;
      default:
        return <Slide0Team />;
    }
  };

  return (
    <SlideThemeContext.Provider value={{ theme, isDark, setTheme }}>
      <div
        className={`fixed inset-0 z-50 flex flex-col justify-between overflow-hidden select-none font-sans transition-colors duration-200 ${
          isDark
            ? 'bg-[#070B14] text-slate-100'
            : 'bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-900'
        }`}
      >
        {/* Top Slide Progress Bar */}
        <div className={`w-full h-1 shrink-0 relative overflow-hidden ${
          isDark ? 'bg-slate-900' : 'bg-slate-200'
        }`}>
          <motion.div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500"
            initial={false}
            animate={{ width: `${((currentSlide + 1) / TOTAL_SLIDES) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Top Header Controls Bar */}
        <header
          className={`px-4 sm:px-8 py-3 flex items-center justify-between border-b backdrop-blur-md shrink-0 z-20 transition-colors ${
            isDark
              ? 'bg-slate-950/80 border-slate-900 text-slate-100'
              : 'bg-white/95 border-slate-200 text-slate-800 shadow-xs'
          }`}
        >
          {/* Left: Project Brand & Current Slide Title */}
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border ${
                isDark
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  : 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-black tracking-wide uppercase font-sans ${
                    isDark ? 'text-white' : 'text-slate-950'
                  }`}
                >
                  PixSort
                </span>
                <span
                  className={`text-[10px] font-mono ${
                    isDark ? 'text-slate-400' : 'text-slate-500 font-medium'
                  }`}
                >
                  · Image Upload & Auto-Processing
                </span>
              </div>
              <div
                className={`text-[11px] font-mono ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Slide {String(currentSlide + 1).padStart(2, '0')}&thinsp;/&thinsp;{TOTAL_SLIDES}:{' '}
                <span
                  className={`font-sans font-bold ${
                    isDark ? 'text-slate-200' : 'text-slate-900'
                  }`}
                >
                  {SLIDE_TITLES[currentSlide]}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Presentation Tools */}
          <div className="flex items-center gap-2">
            {/* Color Theme Switcher Button */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-800 hover:border-amber-400/40'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200 shadow-2xs'
              }`}
              title={isDark ? 'Switch to Keynote Light theme' : 'Switch to Midnight Dark theme'}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline font-mono text-[11px]">Theme: Dark</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-700" />
                  <span className="hidden sm:inline font-mono text-[11px]">Theme: Light</span>
                </>
              )}
            </button>

            {/* Overview Grid Toggle */}
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                showThumbnails
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title="Overview of all slides"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Slides</span>
            </button>

            {/* Autoplay Toggle */}
            <button
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                isAutoPlay
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title={isAutoPlay ? 'Pause auto-advance' : 'Auto-advance slides'}
            >
              {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden sm:inline">{isAutoPlay ? 'Playing' : 'Autoplay'}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-xl transition-colors border ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Exit to Main App Button */}
            <button
              onClick={onExit}
              className={`p-2 rounded-xl transition-colors border ${
                isDark
                  ? 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border-rose-900/50'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 shadow-2xs'
              }`}
              title="Close Presentation (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Presentation Stage */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-4 flex flex-col justify-center overflow-hidden relative">
          <div
            className={`w-full h-full p-4 sm:p-6 md:p-7 flex flex-col justify-between overflow-y-auto relative transition-colors duration-200 ${
              isDark
                ? 'bg-slate-950/90 border border-slate-800 shadow-2xl shadow-black/80 rounded-2xl'
                : 'bg-white border border-slate-200/90 shadow-2xl shadow-slate-300/40 rounded-2xl'
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 8, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.995 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="h-full flex flex-col justify-between"
              >
                {renderCurrentSlide()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Slide Overview Thumbnail Drawer / Overlay */}
          {showThumbnails && (
            <div
              className={`absolute inset-0 backdrop-blur-md z-30 p-6 overflow-y-auto animate-in fade-in duration-150 ${
                isDark
                  ? 'bg-[#070B14]/95 text-slate-100'
                  : 'bg-white/95 text-slate-900'
              }`}
            >
              <div
                className={`flex items-center justify-between pb-4 border-b mb-6 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <div>
                  <h3 className="text-lg font-black font-sans">Slide Index</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Click any slide to jump directly
                  </p>
                </div>
                <button
                  onClick={() => setShowThumbnails(false)}
                  className={`p-2 rounded-xl transition-colors ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {SLIDE_TITLES.map((title, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentSlide(idx);
                      setShowThumbnails(false);
                    }}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      currentSlide === idx
                        ? isDark
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/50'
                          : 'bg-blue-50 border-blue-600 text-blue-900 shadow-md ring-2 ring-blue-500/40'
                        : isDark
                          ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-white shadow-2xs'
                    }`}
                  >
                    <div
                      className={`text-[11px] font-mono font-bold mb-1 ${
                        currentSlide === idx
                          ? isDark ? 'text-blue-400' : 'text-blue-700'
                          : isDark ? 'text-blue-400' : 'text-slate-500'
                      }`}
                    >
                      Slide {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div
                      className={`text-xs font-bold truncate ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {title}
                    </div>
                    <div
                      className={`text-[10px] mt-2 font-mono ${
                        isDark ? 'text-slate-400' : 'text-blue-600 font-semibold'
                      }`}
                    >
                      Jump ➔
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Bottom Floating Navigation Bar */}
        <footer
          className={`px-4 sm:px-8 py-3 border-t backdrop-blur-md shrink-0 flex items-center justify-between z-20 transition-colors ${
            isDark
              ? 'bg-slate-950/80 border-slate-900 text-slate-100'
              : 'bg-white/95 border-slate-200 text-slate-800 shadow-xs'
          }`}
        >
          {/* Left: Quick Jump / First Slide */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSlide(0)}
              disabled={currentSlide === 0}
              className={`p-2 rounded-xl disabled:opacity-40 text-xs flex items-center gap-1.5 transition-colors border ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 disabled:hover:bg-slate-900 text-slate-300 border-slate-800'
                  : 'bg-slate-100 hover:bg-slate-200 disabled:hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title="First slide (Home)"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">First</span>
            </button>
          </div>

          {/* Center: Slide Numbers & Direct Jump Dots */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className={`p-2 rounded-xl disabled:opacity-40 transition-colors border ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 disabled:hover:bg-slate-900 text-white border-slate-800'
                  : 'bg-slate-100 hover:bg-slate-200 disabled:hover:bg-slate-100 text-slate-800 border-slate-200 shadow-2xs'
              }`}
              title="Previous slide (Left Arrow)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Slide Dots / Pill */}
            <div
              className={`flex items-center gap-1 px-3 py-1.5 rounded-2xl border ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-slate-100 border-slate-200 shadow-2xs'
              }`}
            >
              {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`transition-all ${
                    currentSlide === idx
                      ? 'w-6 h-2 rounded-full bg-blue-600'
                      : isDark
                        ? 'w-2 h-2 rounded-full bg-slate-700 hover:bg-slate-500'
                        : 'w-2 h-2 rounded-full bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={`Jump to slide ${idx + 1}`}
                />
              ))}
              <span
                className={`text-xs font-mono ml-2 pl-2 border-l ${
                  isDark
                    ? 'border-slate-800 text-slate-400'
                    : 'border-slate-300 text-slate-600 font-semibold'
                }`}
              >
                {String(currentSlide + 1).padStart(2, '0')}&thinsp;/&thinsp;{String(TOTAL_SLIDES).padStart(2, '0')}
              </span>
            </div>

            <button
              onClick={handleNext}
              disabled={currentSlide === TOTAL_SLIDES - 1}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-colors shadow-xs"
              title="Next slide (Right Arrow / Space)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Right: Keyboard Shortcuts Hint */}
          <div
            className={`text-[11px] font-mono hidden md:flex items-center gap-3 ${
              isDark ? 'text-slate-500' : 'text-slate-500'
            }`}
          >
            <span>
              Navigate:{' '}
              <kbd
                className={`px-1.5 py-0.5 rounded ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800 font-semibold'
                }`}
              >
                ←
              </kbd>{' '}
              <kbd
                className={`px-1.5 py-0.5 rounded ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800 font-semibold'
                }`}
              >
                →
              </kbd>{' '}
              /{' '}
              <kbd
                className={`px-1.5 py-0.5 rounded ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800 font-semibold'
                }`}
              >
                Space
              </kbd>
            </span>
            <span>
              Exit:{' '}
              <kbd
                className={`px-1.5 py-0.5 rounded ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800 font-semibold'
                }`}
              >
                Esc
              </kbd>
            </span>
          </div>
        </footer>
      </div>
    </SlideThemeContext.Provider>
  );
};
