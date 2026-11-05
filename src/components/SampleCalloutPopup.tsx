import React from "react";
import { motion } from "motion/react";
import { Sparkles, X } from "lucide-react";
import { audioSystem } from "../utils/audioSystem";

interface SampleCalloutPopupProps {
  onOpenSample: () => void;
  onDismiss: () => void;
  variant?: "left-space" | "inline";
  className?: string;
}

export const SampleCalloutPopup: React.FC<SampleCalloutPopupProps> = ({
  onOpenSample,
  onDismiss,
  variant = "left-space",
  className = "",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, x: variant === "left-space" ? -12 : 0, y: variant === "inline" ? -8 : 0 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      exit={{ 
        opacity: 0, 
        scale: 0.92, 
        x: variant === "left-space" ? -12 : 0,
        y: variant === "inline" ? -8 : 0, 
        transition: { duration: 0.15 } 
      }}
      transition={{ type: "spring", stiffness: 360, damping: 26 }}
      onClick={() => {
        audioSystem.playClick();
        onOpenSample();
      }}
      className={`relative z-30 w-[260px] mx-auto p-3.5 liquid-glass-callout rounded-2xl select-none transition-shadow cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${className}`}
    >
      {/* Specular gloss top rim reflection */}
      <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

      {/* Pointer arrow on the right pointing into the card & button when in left-space mode */}
      {variant === "left-space" && (
        <>
          <div 
            aria-hidden="true" 
            className="absolute -right-[7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-45 liquid-glass-pointer-right z-10" 
          />
          {/* Subtle directional beacon connecting to the button */}
          <div 
            aria-hidden="true"
            className="absolute -right-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none"
          >
            <div className="w-4 h-[1.5px] bg-gradient-to-r from-white via-blue-500/60 to-transparent" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)] animate-ping" />
          </div>
        </>
      )}

      {/* Pointer arrow on the bottom pointing down at the button when inline (mobile/tablet) */}
      {variant === "inline" && (
        <div 
          aria-hidden="true" 
          className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 liquid-glass-pointer-down" 
        />
      )}

      {/* Header bar: Title, sparkles, and dismiss button */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center space-x-1.5">
          <Sparkles className="w-4.5 h-4.5 text-amber-500 shrink-0" />
          <h4 className="font-serif font-bold text-[16px] text-[#141414] tracking-tight leading-tight">
            Try Instant Samples
          </h4>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            audioSystem.playClick();
            onDismiss();
          }}
          aria-label="Dismiss sample callout"
          className="p-1 rounded-full text-[#141414]/40 hover:text-[#141414] hover:bg-black/5 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Descriptive guidance */}
      <p className="text-[13px] text-[#141414]/75 font-sans leading-snug mt-1 pl-5">
        Don&apos;t have sheet music or an audio recording? Test with our samples.
      </p>
    </motion.div>
  );
};
