import React, { useEffect } from "react";
import { motion } from "motion/react";
import { Bot, X, ChevronRight } from "lucide-react";
import { audioSystem } from "../utils/audioSystem";

interface StuckHelpCalloutProps {
  onOpenChat: () => void;
  onDismiss: () => void;
  className?: string;
}

export const StuckHelpCallout: React.FC<StuckHelpCalloutProps> = ({
  onOpenChat,
  onDismiss,
  className = "",
}) => {
  // Auto-dismiss after 8.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 8500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 12, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 360, damping: 26 }}
      className={`relative z-40 w-[275px] max-w-[calc(100vw-2rem)] p-3.5 liquid-glass-callout rounded-2xl select-none transition-shadow ${className}`}
    >
      {/* Specular gloss top rim reflection */}
      <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

      {/* Pointer arrow on the bottom pointing down at the "Stuck? Ask AI" button */}
      <div 
        aria-hidden="true" 
        className="absolute -bottom-[7px] right-6 sm:right-12 w-3.5 h-3.5 rotate-45 liquid-glass-pointer-down z-10" 
      />

      {/* Header bar: Title, bot badge, and dismiss button */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center space-x-1.5">
          <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <h4 className="font-serif font-bold text-[16px] text-[#141414] tracking-tight leading-tight">
            Stuck? Ask Maestro AI
          </h4>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            audioSystem.playClick();
            onDismiss();
          }}
          aria-label="Dismiss help callout"
          className="p-1 rounded-full text-[#141414]/40 hover:text-[#141414] hover:bg-black/5 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Descriptive guidance */}
      <p className="text-[13px] text-[#141414]/75 font-sans leading-snug mt-1.5 pl-6.5">
        Need advice on tricky measures, chord transitions, or rhythm? Get instant guidance from our AI mentor right here!
      </p>

      {/* Action button */}
      <div className="mt-2.5 pl-6.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            audioSystem.playClick();
            onOpenChat();
          }}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 liquid-glass-btn-dark text-white rounded-xl text-[11px] font-sans font-bold tracking-wider uppercase hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
        >
          <Bot className="w-3.5 h-3.5 opacity-90" />
          <span>Ask Maestro AI</span>
          <ChevronRight className="w-3 h-3 opacity-70" />
        </button>
      </div>
    </motion.div>
  );
};
