import React, { useEffect } from "react";
import { motion } from "motion/react";
import { History, X, ChevronRight, Check } from "lucide-react";
import { audioSystem } from "../utils/audioSystem";

interface SavedInMenuCalloutProps {
  onDismiss: () => void;
  onOpenMenu: () => void;
  className?: string;
}

export const SavedInMenuCallout: React.FC<SavedInMenuCalloutProps> = ({
  onDismiss,
  onOpenMenu,
  className = "",
}) => {
  // Auto-dismiss after 7.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 7500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -8, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 360, damping: 26 }}
      className={`relative z-50 w-[275px] p-3.5 liquid-glass-callout rounded-2xl select-none transition-shadow ${className}`}
    >
      {/* Specular gloss top rim reflection */}
      <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

      {/* Upward pointer arrow pointing up directly to the HISTORY button */}
      <div 
        aria-hidden="true" 
        className="absolute -top-[7px] left-5 sm:left-9 w-3.5 h-3.5 rotate-45 liquid-glass-pointer-up z-10" 
      />

      {/* Header bar: Title, badge, and dismiss button */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center space-x-1.5">
          <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
          </div>
          <h4 className="font-serif font-bold text-[16px] text-[#141414] tracking-tight leading-tight">
            Saved in Menu
          </h4>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            audioSystem.playClick();
            onDismiss();
          }}
          aria-label="Dismiss saved callout"
          className="p-1 rounded-full text-[#141414]/40 hover:text-[#141414] hover:bg-black/5 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Descriptive guidance */}
      <p className="text-[13px] text-[#141414]/75 font-sans leading-snug mt-1.5 pl-6.5">
        Your evaluation report is saved in <span className="font-semibold text-[#141414]">History</span>. You can revisit it anytime!
      </p>

      {/* Action button to open history drawer */}
      <div className="mt-2.5 pl-6.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            audioSystem.playClick();
            onOpenMenu();
          }}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 liquid-glass-btn-dark text-white rounded-xl text-[11px] font-sans font-bold tracking-wider uppercase hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
        >
          <History className="w-3 h-3 opacity-90" />
          <span>Open History Menu</span>
          <ChevronRight className="w-3 h-3 opacity-70" />
        </button>
      </div>
    </motion.div>
  );
};
