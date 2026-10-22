import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  Activity,
} from "lucide-react";

interface PracticeStrategyLayeredProps {
  strategy: string[];
}

interface ParsedStrategyPhase {
  id: number;
  phaseNumber: string;
  phaseName: string;
  phaseType: "rhythm" | "hands" | "tone" | "tempo" | "general";
  title: string;
  badge: string;
  actionTip: string;
  fullText: string;
  raw: string;
}

export const PracticeStrategyLayered: React.FC<PracticeStrategyLayeredProps> = ({ strategy }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Parse raw strategy bullet strings into concise, structured, intuitive cards
  const parsedItems: ParsedStrategyPhase[] = useMemo(() => {
    if (!strategy || strategy.length === 0) {
      return [
        {
          id: 0,
          phaseNumber: "PHASE 1",
          phaseName: "Rhythm Isolation",
          phaseType: "rhythm",
          title: "Count Subdivisions Aloud",
          badge: "Rhythm & Pulse",
          actionTip: "Clap the pulse and count subdivisions before playing notes.",
          fullText: "Isolate metric patterns and count each beat steadily to lock in subdivision consistency.",
          raw: "Phase 1: Rhythm Isolation",
        },
        {
          id: 1,
          phaseNumber: "PHASE 2",
          phaseName: "Hand Separation",
          phaseType: "hands",
          title: "Anchor Left Hand Harmonies",
          badge: "Hand Balance",
          actionTip: "Play LH broken chords until fluent before bringing in RH melody.",
          fullText: "Practice hands separately to build independent kinesthetic comfort before hands-together integration.",
          raw: "Phase 2: Hand Separation",
        },
        {
          id: 2,
          phaseNumber: "PHASE 3",
          phaseName: "Tonal Delivery",
          phaseType: "tone",
          title: "Shape Melodic Phrasing",
          badge: "Tone & Voicing",
          actionTip: "Bring out upper voice melody while keeping inner accompaniment soft.",
          fullText: "Deliver clean dynamics and legato phrasing across melodic arcs.",
          raw: "Phase 3: Tonal Delivery",
        },
      ];
    }

    // Deduplicate incoming bullets
    const uniqueBullets: string[] = [];
    const seen = new Set<string>();

    for (const raw of strategy) {
      const normalized = raw
        .toLowerCase()
        .replace(/[*_#`]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const key = normalized.slice(0, 40);
      if (!seen.has(key) && key.length > 4) {
        seen.add(key);
        uniqueBullets.push(raw);
      }
    }

    const bulletsToUse = uniqueBullets.length > 0 ? uniqueBullets : strategy;

    return bulletsToUse.map((rawItem, idx) => {
      const lower = rawItem.toLowerCase();
      
      // Determine Phase Number
      let phaseNumber = `PHASE ${idx + 1}`;
      const phaseMatch = rawItem.match(/Phase\s*(\d+)/i);
      if (phaseMatch) {
        phaseNumber = `PHASE ${phaseMatch[1]}`;
      }

      // Determine Phase Type & Focus
      let phaseType: "rhythm" | "hands" | "tone" | "tempo" | "general" = "general";
      let phaseName = "Strategic Drill";
      let badge = "Practice Focus";

      if (
        lower.includes("rhythm") ||
        lower.includes("meter") ||
        lower.includes("pulse") ||
        lower.includes("subdivision") ||
        lower.includes("count") ||
        lower.includes("isolation") ||
        phaseNumber === "PHASE 1"
      ) {
        phaseType = "rhythm";
        phaseName = "Rhythm Isolation";
        badge = "Rhythm & Pulse";
      } else if (
        lower.includes("hand") ||
        lower.includes("separation") ||
        lower.includes("hands separate") ||
        lower.includes("lh") ||
        lower.includes("rh") ||
        lower.includes("coordination") ||
        phaseNumber === "PHASE 2"
      ) {
        phaseType = "hands";
        phaseName = "Hand Separation";
        badge = "Hand Independence";
      } else if (
        lower.includes("tone") ||
        lower.includes("tonal") ||
        lower.includes("dynamic") ||
        lower.includes("phrasing") ||
        lower.includes("voicing") ||
        lower.includes("expression") ||
        lower.includes("articulation") ||
        phaseNumber === "PHASE 3"
      ) {
        phaseType = "tone";
        phaseName = "Tonal & Dynamic Delivery";
        badge = "Voicing & Tone";
      } else if (
        lower.includes("tempo") ||
        lower.includes("speed") ||
        lower.includes("integration") ||
        phaseNumber === "PHASE 4"
      ) {
        phaseType = "tempo";
        phaseName = "Tempo Integration";
        badge = "Tempo Control";
      }

      // Extract Clean Body Text
      let cleanText = rawItem;
      // Strip common prefixes like "Phase 1 (Rhythm Isolation)**:", "**Phase 1**:", "Phase 1:", etc.
      const prefixesToRemove = [
        /^\*+\s*/,
        /^(?:\*\*)?Phase\s*\d+[^*:]*(?:\*\*)?[:\-–—.]\s*/i,
        /^(?:\*\*)?Phase\s*\d+\s*(?:\([^)]*\))?(?:\*\*)?[:\-–—.]?\s*/i,
        /^(?:\*\*)?Step\s*\d+\s*(?:\([^)]*\))?(?:\*\*)?[:\-–—.]?\s*/i,
        /^\*\*[^*]+\*\*[:\-–—.]?\s*/,
        /^(?:Phase|Step)\s*\d+[^:–—\n]*[:\-–—.]\s*/i,
      ];
      for (const rx of prefixesToRemove) {
        cleanText = cleanText.replace(rx, "").trim();
      }
      // Remove any leftover leading punctuation or markdown asterisks
      cleanText = cleanText.replace(/^[:\-–—*.\s]+/, "").trim();
      if (cleanText.length > 0) {
        cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
      }

      // 3. Craft Punchy, Less-Wordy Title
      let title = "";
      if (phaseType === "rhythm") {
        if (cleanText.toLowerCase().includes("subdivid")) {
          title = "Count Steady Subdivisions";
        } else if (cleanText.toLowerCase().includes("metronome")) {
          title = "Calibrate Pulse with Metronome";
        } else {
          title = "Isolate Metric Subdivisions";
        }
      } else if (phaseType === "hands") {
        if (cleanText.toLowerCase().includes("left hand") || cleanText.toLowerCase().includes("lh")) {
          title = "Secure Left Hand Foundation";
        } else if (cleanText.toLowerCase().includes("balance")) {
          title = "Balance Hand Independence";
        } else {
          title = "Separate Hands & Simplify";
        }
      } else if (phaseType === "tone") {
        if (cleanText.toLowerCase().includes("voic")) {
          title = "Prioritize Melodic Voicing";
        } else if (cleanText.toLowerCase().includes("legato")) {
          title = "Shape Legato & Dynamic Arcs";
        } else {
          title = "Deliver Phrasing & Dynamic Contrast";
        }
      } else if (phaseType === "tempo") {
        title = "Gradual Tempo Acceleration";
      } else {
        const firstWords = cleanText.split(/[.:,;]/)[0]?.trim();
        title = firstWords && firstWords.length <= 40 ? firstWords : "Targeted Practice Drill";
      }

      // 4. Craft Action Tip (Intuitive Direct Takeaway)
      let actionTip = "";
      if (phaseType === "rhythm") {
        actionTip = "Tap or count subdivisions aloud before playing at tempo.";
      } else if (phaseType === "hands") {
        actionTip = "Drill LH accompaniment independently until kinesthetically secure.";
      } else if (phaseType === "tone") {
        actionTip = "Sing melody line mentally and keep accompaniment light.";
      } else {
        actionTip = "Focus on relaxed posture and accurate finger placement.";
      }

      // Check if raw text provides a more specific direct instruction
      const imperativeMatch = cleanText.match(/(?:practice|count|play|isolate|begin|slow|keep|use|ensure|drop|maintain)[^.!?]*/i);
      if (imperativeMatch && imperativeMatch[0].length >= 15 && imperativeMatch[0].length <= 80) {
        actionTip = imperativeMatch[0].trim().replace(/\.$/, "") + ".";
      }

      return {
        id: idx,
        phaseNumber,
        phaseName,
        phaseType,
        title,
        badge,
        actionTip,
        fullText: cleanText,
        raw: rawItem,
      };
    });
  }, [strategy]);

  const totalItems = parsedItems.length;

  const hasTriggeredInitialScrollSwitch = useRef(false);

  // IntersectionObserver: automatically trigger a switch when user scrolls to this section
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (!hasTriggeredInitialScrollSwitch.current && totalItems > 1) {
              hasTriggeredInitialScrollSwitch.current = true;
              setTimeout(() => {
                setDirection(1);
                setCurrentIndex((prev) => (prev + 1) % totalItems);
              }, 750);
            }
          } else {
            setIsInView(false);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [totalItems]);

  // Handlers for switching
  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  // Autoplay cycle
  useEffect(() => {
    if (totalItems <= 1 || isHovered || !isInView) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalItems, isHovered, isInView, handleNext]);

  const currentItem = parsedItems[currentIndex] || parsedItems[0];

  // Helper for category styling
  const getPhaseConfig = (type: ParsedStrategyPhase["phaseType"]) => {
    switch (type) {
      case "rhythm":
        return {
          icon: Clock,
          iconBg: "bg-emerald-500/15 text-emerald-900 border-emerald-500/30",
          tagBg: "bg-emerald-500/10 text-emerald-900 border-emerald-500/25",
        };
      case "hands":
        return {
          icon: Layers,
          iconBg: "bg-amber-500/15 text-amber-900 border-amber-500/30",
          tagBg: "bg-amber-500/10 text-amber-900 border-amber-500/25",
        };
      case "tone":
        return {
          icon: Sparkles,
          iconBg: "bg-violet-500/15 text-violet-900 border-violet-500/30",
          tagBg: "bg-violet-500/10 text-violet-900 border-violet-500/25",
        };
      case "tempo":
        return {
          icon: Zap,
          iconBg: "bg-sky-500/15 text-sky-900 border-sky-500/30",
          tagBg: "bg-sky-500/10 text-sky-900 border-sky-500/25",
        };
      default:
        return {
          icon: Activity,
          iconBg: "bg-[#141414]/10 text-[#141414] border-[#141414]/20",
          tagBg: "bg-[#141414]/5 text-[#141414] border-[#141414]/15",
        };
    }
  };

  const currentConfig = getPhaseConfig(currentItem.phaseType);
  const PhaseIcon = currentConfig.icon;

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
      ref={containerRef}
      id="practice-strategy-section"
      className="relative space-y-4 pt-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D PERSPECTIVE LAYERED CARD CONTAINER */}
      <motion.div
        layout
        transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
        className="relative min-h-[240px] sm:min-h-[220px] flex items-center justify-center"
      >
        {/* Layer 3: Deepest stacked card layer */}
        {totalItems > 2 && (
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-3xl bg-[#DCDAD6] border border-[#141414]/10 shadow-sm pointer-events-none transition-all duration-500 ease-out transform translate-x-3 translate-y-3.5 scale-[0.99] z-0"
          />
        )}

        {/* Layer 2: Mid stacked card layer */}
        {totalItems > 1 && (
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-3xl bg-[#E5E4E1] border border-[#141414]/12 shadow-md pointer-events-none transition-all duration-500 ease-out transform translate-x-1.5 translate-y-1.5 scale-[0.995] z-1"
          />
        )}

        {/* Layer 1: ACTIVE FOCAL CARD (#EDECEA crisp background) */}
        <motion.div
          layout
          transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
          className="w-full relative z-10"
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentItem.id}
              layout
              custom={direction}
              initial={{
                opacity: 0,
                x: direction > 0 ? 32 : -32,
                y: direction > 0 ? 6 : -6,
                scale: 0.96,
                filter: "blur(8px)",
              }}
              animate={{
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                x: direction > 0 ? -32 : 32,
                y: direction > 0 ? -6 : 6,
                scale: 0.96,
                filter: "blur(8px)",
              }}
              transition={{
                duration: 0.38,
                ease: [0.25, 1, 0.5, 1],
                layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
              }}
              className="rounded-3xl p-5 sm:p-6 border border-[#141414]/15 shadow-xl bg-[#EDECEA] relative overflow-hidden"
              style={{
                boxShadow: "0 18px 38px -12px rgba(20,20,20,0.12), 0 2px 8px 0 rgba(20,20,20,0.04), inset 0 1px 0 rgba(255,255,255,1)",
              }}
            >
              {/* Subtle top inner light highlight */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

              {/* TOP ROW: ICON + CATEGORY & BADGE */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs shrink-0 border ${currentConfig.iconBg}`}>
                    <PhaseIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#141414]/80 block truncate">
                      {currentItem.phaseName}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center space-x-2 shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold uppercase tracking-wider border shadow-2xs ${currentConfig.tagBg}`}>
                    {currentItem.badge}
                  </span>
                </div>
              </div>

              {/* CORE HEADLINE (Less Wordy, Bold & Direct) */}
              <div className="space-y-1 my-2">
                <h3 className="text-lg sm:text-xl font-serif font-bold text-[#141414] tracking-tight">
                  {currentItem.title}
                </h3>
              </div>

              {/* ACTION TIP CALLOUT (Direct Takeaway) */}
              <div className="mt-2.5 mb-3 p-3 rounded-2xl bg-[#141414]/[0.035] border border-[#141414]/10 flex items-start gap-2.5 shadow-2xs">
                <div className="w-5 h-5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <ArrowRight className="w-3 h-3 text-emerald-700" />
                </div>
                <div className="text-xs sm:text-[13px] font-sans text-[#141414] leading-relaxed">
                  <span className="font-bold text-[#141414] mr-1">Action Drill:</span>
                  <span className="text-[#141414]/90 font-medium">{currentItem.actionTip}</span>
                </div>
              </div>

              {/* EXPANDED CONTEXT */}
              <motion.div layout transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }} className="pt-2 border-t border-[#141414]/10">
                <p
                  className={`text-xs sm:text-[12.5px] leading-relaxed text-[#141414]/80 font-sans transition-all duration-200 ${
                    isHovered ? "line-clamp-none" : "line-clamp-3"
                  }`}
                >
                  {currentItem.fullText}
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* CENTERED PROPORTIONAL PAGINATION ISLAND WITH CLEAN ARROWS */}
      {totalItems > 1 && (
        <motion.div
          layout
          transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
          className="flex items-center justify-center pt-2"
        >
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#EDECEA] border border-[#141414]/15 shadow-xs select-none">
            {/* Left Chevron Button */}
            <button
              type="button"
              id="practice-prev-button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full text-[#141414]/65 hover:text-[#141414] hover:bg-[#141414]/[0.07] active:bg-[#141414]/12 flex items-center justify-center transition-all active:scale-90 cursor-pointer group"
              title="Previous phase"
              aria-label="Previous practice phase"
            >
              <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            </button>

            {/* Center Page Dots */}
            <div className="flex items-center gap-1.5 px-1.5">
              {parsedItems.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setDirection(idx > currentIndex ? 1 : -1);
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentIndex === idx
                      ? "w-5 bg-[#141414]"
                      : "w-1.5 bg-[#141414]/20 hover:bg-[#141414]/45"
                  }`}
                  title={`${item.phaseNumber}: ${item.title}`}
                  aria-label={`Jump to ${item.phaseNumber}`}
                />
              ))}
            </div>

            {/* Right Chevron Button */}
            <button
              type="button"
              id="practice-next-button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full text-[#141414]/65 hover:text-[#141414] hover:bg-[#141414]/[0.07] active:bg-[#141414]/12 flex items-center justify-center transition-all active:scale-90 cursor-pointer group"
              title="Next phase"
              aria-label="Next practice phase"
            >
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
