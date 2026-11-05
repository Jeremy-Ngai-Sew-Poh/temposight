import React, { useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, X, ArrowDown } from "lucide-react";
import { audioSystem } from "../utils/audioSystem";

interface AnalyseFirstCalloutProps {
  onDismiss: () => void;
  onGoToAnalyse?: () => void;
  className?: string;
}

export const AnalyseFirstCallout: React.FC<AnalyseFirstCalloutProps> = ({
  onDismiss,
  onGoToAnalyse,
  className = "",
}) => {
  // Auto-dismiss after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -8, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 360, damping: 26 }}
      className={`relative z-50 w-[270px] p-3.5 liquid-glass-callout rounded-2xl select-none transition-shadow ${className}`}
    >
      {/* Specular gloss top rim reflection */}
      <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

      {/* Upward pointer arrow pointing up to the Performance Evaluation button */}
      <div 
        aria-hidden="true" 
        className="absolute -top-[7px] right-14 sm:right-20 w-3.5 h-3.5 rotate-45 liquid-glass-pointer-up z-10" 
      />

      {/* Header bar: Title, sparkles, and dismiss button */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center space-x-1.5">
          <Sparkles className="w-4.5 h-4.5 text-amber-500 shrink-0" />
          <h4 className="font-serif font-bold text-[16px] text-[#141414] tracking-tight leading-tight">
            Analyse First
          </h4>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            audioSystem.playClick();
            onDismiss();
          }}
          aria-label="Dismiss analyse first callout"
          className="p-1 rounded-full text-[#141414]/40 hover:text-[#141414] hover:bg-black/5 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Descriptive guidance */}
      <p className="text-[13px] text-[#141414]/75 font-sans leading-snug mt-1 pl-6">
        Please press <span className="font-semibold text-[#141414]">&ldquo;Analyse Performance&rdquo;</span> below first to generate your report.
      </p>

      {/* Quick Action button to scroll directly to the Analyse button */}
      {onGoToAnalyse && (
        <div className="mt-2.5 pl-6">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              audioSystem.playClick();
              onGoToAnalyse();
            }}
            className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 liquid-glass-btn-dark text-white rounded-xl text-[11px] font-sans font-bold tracking-wider uppercase hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
          >
            <span>Go to Analyse</span>
            <ArrowDown className="w-3 h-3 opacity-90" />
          </button>
        </div>
      )}
    </motion.div>
  );
};
