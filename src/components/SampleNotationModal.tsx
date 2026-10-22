import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Sparkles, 
  Play, 
  Pause, 
  FileText, 
  Mic, 
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Heart,
  Music,
  Music2,
  Music4,
  Clock
} from "lucide-react";
import { SAMPLE_PIECES, SamplePiece } from "../samples";
import { audioSystem } from "../utils/audioSystem";

interface SampleNotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SamplePiece) => void;
  isLoading?: boolean;
}

export function SampleNotationModal({
  isOpen,
  onClose,
  onSelectSample,
  isLoading = false,
}: SampleNotationModalProps) {
  const [selectedSample, setSelectedSample] = useState<SamplePiece | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Stop audio and reset selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      setIsPlayingAudio(false);
      setSelectedSample(null);
    }
  }, [isOpen]);

  const togglePreviewAudio = (e: React.MouseEvent, sample: SamplePiece) => {
    e.stopPropagation();
    audioSystem.playClick();

    if (isPlayingAudio) {
      audioPlayerRef.current?.pause();
      setIsPlayingAudio(false);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(sample.audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audioPlayerRef.current = audio;
      audio.play().catch((err) => {
        console.warn("Audio preview playback error:", err);
        setIsPlayingAudio(false);
      });
      setIsPlayingAudio(true);
    }
  };

  const handleSelect = (sample: SamplePiece) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setIsPlayingAudio(false);
    onSelectSample(sample);
  };

  const handleBackToList = () => {
    audioSystem.playClick();
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setIsPlayingAudio(false);
    setSelectedSample(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Frosted Glass Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/35 backdrop-blur-md cursor-pointer"
          />

          {/* Centered Liquid Glass Modal Dialog */}
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 25,
              mass: 0.75,
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white/45 sm:bg-white/55 backdrop-blur-3xl border border-white/80 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.9)] overflow-hidden z-10 my-auto flex flex-col h-[600px] max-h-[90vh]"
          >
            {/* Ambient Pastel Refraction Glows */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-100/35 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

            {/* Top Liquid Specular Light Line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

            {/* Modal Header - Seamless color matching rest of menu */}
            <div className="p-4 sm:p-5 border-b border-[#141414]/10 bg-transparent flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-start space-x-3">
                {selectedSample ? (
                  <button
                    onClick={handleBackToList}
                    className="w-8 h-8 rounded-2xl bg-white/70 hover:bg-white/95 text-[#141414] border border-white/90 shadow-2xs transition-all cursor-pointer flex items-center justify-center active:scale-95 mt-0.5 shrink-0"
                    title="Back to samples"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-8 h-8 rounded-2xl bg-amber-50/90 border border-amber-200/80 shadow-2xs text-amber-800 flex items-center justify-center mt-0.5 shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                  </div>
                )}

                <div className="space-y-0.5">
                  <h2 className="font-serif font-bold text-lg sm:text-xl tracking-tight text-[#141414]">
                    Sample Notation &amp; Audio
                  </h2>
                  <p className="text-xs text-[#141414]/75 font-sans leading-tight">
                    Select a pre-loaded piece to test optical notation recognition and audio evaluation instantly.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  audioSystem.playClick();
                  onClose();
                }}
                className="p-2 rounded-xl hover:bg-[#141414]/10 text-[#141414]/70 hover:text-[#141414] transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with Animated Page Swipe Transition */}
            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                {!selectedSample ? (
                  /* PAGE 1: Samples List (Master View) */
                  <motion.div
                    key="sample-list"
                    initial={false}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="absolute inset-0 p-5 sm:p-6 overflow-y-auto space-y-3.5"
                  >
                    {SAMPLE_PIECES.map((sample) => (
                      <div
                        key={sample.id}
                        onClick={() => {
                          audioSystem.playClick();
                          setSelectedSample(sample);
                        }}
                        className="liquid-glass-card p-4 sm:p-5 rounded-2xl border border-white/90 shadow-sm hover:shadow-md hover:border-white transition-[background-color,border-color,box-shadow,transform] duration-150 cursor-pointer flex items-center justify-between gap-4 group active:scale-[0.99] bg-white/45 hover:bg-white/65"
                      >
                        <div className="flex items-start space-x-3.5">
                          {/* Themed Music Icon Container */}
                          <div className={`w-11 h-11 rounded-2xl ${sample.theme?.iconBg || "bg-emerald-50/80"} border ${sample.theme?.iconBorder || "border-emerald-200/70"} flex items-center justify-center ${sample.theme?.iconText || "text-emerald-800"} shadow-2xs shrink-0 group-hover:scale-105 transition-transform`}>
                            {sample.theme?.iconType === "heart" ? (
                              <Heart className="w-5 h-5 fill-current/20" />
                            ) : sample.theme?.iconType === "double-note" ? (
                              <Music className="w-5 h-5" />
                            ) : sample.theme?.iconType === "music4" ? (
                              <Music4 className="w-5 h-5" />
                            ) : (
                              <Music2 className="w-5 h-5" />
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-base sm:text-lg text-[#141414] tracking-tight">
                                {sample.title}
                              </h3>
                              {/* Themed Difficulty Badge */}
                              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${sample.theme?.badgeBg || "bg-emerald-100/70"} ${sample.theme?.badgeText || "text-emerald-900"} border ${sample.theme?.badgeBorder || "border-emerald-300/60"} px-2.5 py-0.5 rounded-full shadow-2xs`}>
                                {sample.difficulty}
                              </span>
                            </div>

                            <p className="text-xs italic text-[#141414]/75">
                              {sample.composer} — {sample.subtitle}
                            </p>

                            {/* Pastel Tag Indicators */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              {/* Pastel Sky Key Badge */}
                              <span className="text-[10px] font-mono font-semibold bg-sky-50/80 text-sky-900 border border-sky-200/70 px-2 py-0.5 rounded-md">
                                Key: {sample.key}
                              </span>
                              {/* Pastel Lavender Meter Badge */}
                              <span className="text-[10px] font-mono font-semibold bg-indigo-50/80 text-indigo-900 border border-indigo-200/70 px-2 py-0.5 rounded-md">
                                Meter: {sample.meter}
                              </span>
                              {/* Pastel Peach Duration Badge */}
                              {sample.duration && (
                                <span className="text-[10px] font-mono font-semibold bg-amber-50/80 text-amber-900 border border-amber-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 opacity-70" />
                                  {sample.duration}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 text-[#141414]/60 group-hover:text-[#141414] shrink-0">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">
                            View Details
                          </span>
                          <div className="w-8 h-8 rounded-xl bg-white/70 group-hover:bg-white border border-white/90 flex items-center justify-center shadow-2xs group-hover:translate-x-0.5 transition-all">
                            <ChevronRight className="w-4 h-4 text-[#141414]" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  /* PAGE 2: Sample Detail View (Swipe Left View) */
                  <motion.div
                    key="sample-detail"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="absolute inset-0 p-5 sm:p-6 overflow-y-auto space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Top Info Header with Pastel Metadata Badges */}
                      <div className="liquid-glass-card p-4 sm:p-5 rounded-2xl border border-white/90 space-y-2 bg-white/45">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Themed Difficulty Badge */}
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${selectedSample.theme?.badgeBg || "bg-emerald-100/70"} ${selectedSample.theme?.badgeText || "text-emerald-900"} border ${selectedSample.theme?.badgeBorder || "border-emerald-300/60"} px-2.5 py-0.5 rounded-full shadow-2xs`}>
                            {selectedSample.difficulty}
                          </span>
                          {/* Pastel Sky Key Badge */}
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-50/80 text-sky-900 border border-sky-200/70 px-2.5 py-0.5 rounded-full shadow-2xs">
                            Key: {selectedSample.key}
                          </span>
                          {/* Pastel Lavender Meter Badge */}
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-50/80 text-indigo-900 border border-indigo-200/70 px-2.5 py-0.5 rounded-full shadow-2xs">
                            Meter: {selectedSample.meter}
                          </span>
                          {/* Pastel Peach Duration Badge */}
                          {selectedSample.duration && (
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50/80 text-amber-900 border border-amber-200/70 px-2.5 py-0.5 rounded-full shadow-2xs">
                              {selectedSample.duration}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="font-bold text-xl sm:text-2xl text-[#141414] tracking-tight">
                            {selectedSample.title}
                          </h3>
                          <p className="text-xs sm:text-[13.5px] italic text-[#141414]/75 mt-0.5">
                            {selectedSample.composer} — {selectedSample.subtitle}
                          </p>
                        </div>

                        <p className="text-xs sm:text-[13px] text-[#141414]/80 leading-relaxed pt-1">
                          {selectedSample.description}
                        </p>
                      </div>

                      {/* Score Preview & Audio Player Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                        
                        {/* Notation Score Preview Thumbnail */}
                        <div className="md:col-span-7 bg-white/75 border border-white/90 rounded-2xl p-3 shadow-inner flex flex-col justify-between overflow-hidden">
                          <div className="flex items-center justify-between mb-1.5 px-1">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#141414]/75 flex items-center gap-1.5">
                              <span className="p-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                                <FileText className="w-3 h-3" />
                              </span>
                              Sheet Music Notation
                            </span>
                          </div>
                          <div className="relative rounded-xl overflow-hidden bg-white border border-[#141414]/10 shadow-xs flex items-center justify-center min-h-[110px] h-32 p-2">
                            <img
                              src={selectedSample.imageUrl}
                              alt={selectedSample.title}
                              referrerPolicy="no-referrer"
                              className="max-w-full max-h-full w-auto h-auto object-contain filter contrast-125 select-none"
                            />
                          </div>
                        </div>

                        {/* Performance Audio Preview Box */}
                        <div className="md:col-span-5 bg-white/75 border border-white/90 rounded-2xl p-3 shadow-inner flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#141414]/75 flex items-center gap-1.5">
                                <span className="p-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200/60">
                                  <Mic className="w-3 h-3" />
                                </span>
                                Practice Audio
                              </span>
                              <span className="text-[10px] font-mono text-[#141414]/60 font-bold">
                                {selectedSample.duration || "0:15"}
                              </span>
                            </div>

                            <p className="text-[11px] text-[#141414]/75 leading-tight font-sans">
                              Acoustic piano practice recording aligned directly with this score segment.
                            </p>
                          </div>

                          {/* Pre-listen audio toggle */}
                          <div className="pt-2">
                            <button
                              onClick={(e) => togglePreviewAudio(e, selectedSample)}
                              className={`w-full py-2 px-3 rounded-xl flex items-center justify-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
                                isPlayingAudio
                                  ? "bg-[#141414] text-white hover:bg-[#141414]/90"
                                  : "liquid-glass-btn-dark text-white hover:scale-[1.02] active:scale-[0.98]"
                              }`}
                            >
                              {isPlayingAudio ? (
                                <>
                                  <Pause className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
                                  <span>Play</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Primary Load Action Button */}
                    <div className="pt-3 border-t border-[#141414]/10 shrink-0">
                      <button
                        onClick={() => handleSelect(selectedSample)}
                        disabled={isLoading}
                        className="w-full py-3.5 px-5 liquid-glass-btn-dark text-white font-serif font-bold uppercase tracking-wider text-xs sm:text-sm rounded-2xl shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4 text-amber-200" />
                        <span>Use This Sample (Notation &amp; Audio)</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
