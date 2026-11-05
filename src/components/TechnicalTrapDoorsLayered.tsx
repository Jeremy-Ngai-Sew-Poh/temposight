import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Hand,
  Sparkles,
  Clock,
  ShieldAlert,
  ArrowRight,
  Compass,
} from "lucide-react";

interface TechnicalTrapDoorsLayeredProps {
  trapDoors: string[];
}

interface ParsedTrapDoor {
  id: number;
  category: string;
  categoryType: "hand" | "accidental" | "rhythm" | "pedal" | "general";
  title: string;
  scope: string;
  actionTip: string;
  fullText: string;
  raw: string;
}

export const TechnicalTrapDoorsLayered: React.FC<TechnicalTrapDoorsLayeredProps> = ({ trapDoors }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Parse raw trap door bullet strings into clean, intuitive, structured cards with deduplication
  const parsedItems: ParsedTrapDoor[] = useMemo(() => {
    if (!trapDoors || trapDoors.length === 0) {
      return [
        {
          id: 0,
          category: "General Precision",
          categoryType: "general",
          title: "Even Finger Weight & Posture",
          scope: "Core Technique",
          actionTip: "Maintain relaxed wrists and drop weight into fingertips evenly.",
          fullText: "No severe technical traps detected in this score segment. Focus on consistent subdivision and relaxed hand posture.",
          raw: "Maintain relaxed wrists and even finger weight.",
        },
      ];
    }

    // Step 1: Remove exact or near duplicates from raw bullets
    const uniqueRawBullets: string[] = [];
    const seenTexts = new Set<string>();

    for (const raw of trapDoors) {
      const normalized = raw
        .toLowerCase()
        .replace(/[*_#`]/g, "")
        .replace(/^(?:technical trap doors?|trap doors?|hazard|point \d+):?\s*/i, "")
        .replace(/\s+/g, " ")
        .trim();

      // Check if we already have something very similar (first 30 chars or exact normalized)
      const textKey = normalized.slice(0, 45);
      if (!seenTexts.has(textKey) && textKey.length > 5) {
        seenTexts.add(textKey);
        uniqueRawBullets.push(raw);
      }
    }

    const bulletsToProcess = uniqueRawBullets.length > 0 ? uniqueRawBullets : trapDoors;

    return bulletsToProcess.map((rawItem, idx) => {
      const lower = rawItem.toLowerCase();
      const hasColon = rawItem.includes(":");
      const rawPrefix = hasColon ? rawItem.substring(0, rawItem.indexOf(":")).replace(/\*\*/g, "").trim() : "";
      const rawContent = hasColon ? rawItem.substring(rawItem.indexOf(":") + 1).replace(/\*\*/g, "").trim() : rawItem.replace(/\*\*/g, "").trim();

      // 1. Determine Category
      let category = "Technical Hazard";
      let categoryType: "hand" | "accidental" | "rhythm" | "pedal" | "general" = "general";

      if (
        lower.includes("hand") ||
        lower.includes("finger") ||
        lower.includes("thumb") ||
        lower.includes("leap") ||
        lower.includes("stretch") ||
        lower.includes("crossing") ||
        lower.includes("geography") ||
        lower.includes("pivot")
      ) {
        category = "Hand Geography & Fingering";
        categoryType = "hand";
      } else if (
        lower.includes("accidental") ||
        lower.includes("sharp") ||
        lower.includes("flat") ||
        lower.includes("natural") ||
        lower.includes("chromatic") ||
        lower.includes("key change") ||
        lower.includes("modulation")
      ) {
        category = "Accidental & Tonality Shift";
        categoryType = "accidental";
      } else if (
        lower.includes("rhythm") ||
        lower.includes("syncop") ||
        lower.includes("triplet") ||
        lower.includes("subdivision") ||
        lower.includes("rest") ||
        lower.includes("tie") ||
        lower.includes("dotted") ||
        lower.includes("meter") ||
        lower.includes("tempo")
      ) {
        category = "Rhythmic Subdivisions & Ties";
        categoryType = "rhythm";
      } else if (lower.includes("pedal") || lower.includes("legato") || lower.includes("staccato") || lower.includes("articulation")) {
        category = "Articulation & Pedaling";
        categoryType = "pedal";
      }

      // 2. Extract Scope / Location Badge (Avoid generic "Point 1", replace with contextual tags)
      let scope = "";
      const measureMatch = rawItem.match(/(?:mm?\.\s*\d+(?:[–\-]\d+)?|measures?\s*\d+(?:[–\-]\d+)?|bars?\s*\d+(?:[–\-]\d+)?)/i);
      const handMatch = rawItem.match(/(?:left hand|right hand|LH|RH|both hands)/i);

      if (measureMatch && handMatch) {
        scope = `${measureMatch[0].trim()} • ${handMatch[0].trim().toUpperCase()}`;
      } else if (measureMatch) {
        scope = `${measureMatch[0].trim()} Alert`;
      } else if (handMatch) {
        scope = `${handMatch[0].trim()} Priority`;
      } else {
        // Descriptive contextual tags based on category type
        if (categoryType === "hand") scope = "Fingering Focus";
        else if (categoryType === "accidental") scope = "Accidental Alert";
        else if (categoryType === "rhythm") scope = "Rhythm Hazard";
        else if (categoryType === "pedal") scope = "Touch & Pedal";
        else scope = "Key Priority";
      }

      // 3. Extract or craft a concise headline title (Less Wordy)
      let title = "";
      if (rawPrefix && rawPrefix.length < 35 && !rawPrefix.toLowerCase().includes("trap") && !rawPrefix.toLowerCase().includes("point")) {
        title = rawPrefix;
      } else {
        if (categoryType === "hand") {
          if (lower.includes("leap") || lower.includes("jump")) title = "Large Hand Expansion / Leap";
          else if (lower.includes("thumb") || lower.includes("cross")) title = "Thumb Under Pivot & Crossing";
          else if (lower.includes("stretch")) title = "Wide Interval Stretch";
          else title = "Awkward Hand Geography";
        } else if (categoryType === "accidental") {
          const accMatch = rawContent.match(/([A-G](?:[#♯b♭]|-(?:flat|sharp|natural))?)/gi);
          if (accMatch && accMatch.length >= 1) {
            title = `Unexpected Accidental (${accMatch[0]})`;
          } else {
            title = "Chromatic Accidental Shift";
          }
        } else if (categoryType === "rhythm") {
          if (lower.includes("syncop")) title = "Syncopated Off-Beat Accent";
          else if (lower.includes("triplet")) title = "2-against-3 / Triplet Control";
          else if (lower.includes("rest") || lower.includes("tie")) title = "Sustained Rest & Note Tie";
          else title = "Irregular Subdivisions";
        } else {
          title = rawContent.split(/[.;]/)[0] || "Critical Technical Focus";
          if (title.length > 38) title = title.slice(0, 35) + "…";
        }
      }

      // 4. Extract or synthesize a direct actionable tip
      let actionTip = "";
      const sentences = rawContent.split(/(?<=[.?!])\s+/);
      const tipCandidate = sentences.find((s) =>
        /(?:practice|isolate|slow|count|anchor|prepare|listen|keep|relax|ensure|watch|hold)/i.test(s)
      );

      if (tipCandidate && tipCandidate.length < 110) {
        actionTip = tipCandidate.trim();
      } else if (categoryType === "hand") {
        actionTip = "Anchor pivoting fingers early and shift elbow weight before striking.";
      } else if (categoryType === "accidental") {
        actionTip = "Mark the accidental in your visual field and check keyboard topography.";
      } else if (categoryType === "rhythm") {
        actionTip = "Subdivide out loud at 50% tempo until pulse becomes second nature.";
      } else {
        actionTip = "Isolate hands separately for 3 clean repetitions before joining.";
      }

      return {
        id: idx,
        category,
        categoryType,
        title,
        scope,
        actionTip,
        fullText: rawContent,
        raw: rawItem,
      };
    });
  }, [trapDoors]);

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
            // Prompt user visual cue on initial scroll-in by switching card after a brief delay
            if (!hasTriggeredInitialScrollSwitch.current && totalItems > 1) {
              hasTriggeredInitialScrollSwitch.current = true;
              setTimeout(() => {
                setDirection(1);
                setCurrentIndex((prev) => (prev + 1) % totalItems);
              }, 700);
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

  // Auto-switch timer: runs smoothly when in view, not hovered, and more than 1 item
  useEffect(() => {
    if (!isInView || isHovered || totalItems <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, 4800);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isInView, isHovered, totalItems, handleNext]);

  const currentItem = parsedItems[currentIndex] || parsedItems[0];

  // Helper for category styling
  const getCategoryConfig = (type: ParsedTrapDoor["categoryType"]) => {
    switch (type) {
      case "hand":
        return {
          icon: Hand,
          iconBg: "bg-amber-500/15 text-amber-900 border-amber-500/30",
          tagBg: "bg-amber-500/10 text-amber-900 border-amber-500/25",
          accentColor: "text-amber-800",
        };
      case "accidental":
        return {
          icon: Sparkles,
          iconBg: "bg-violet-500/15 text-violet-900 border-violet-500/30",
          tagBg: "bg-violet-500/10 text-violet-900 border-violet-500/25",
          accentColor: "text-violet-800",
        };
      case "rhythm":
        return {
          icon: Clock,
          iconBg: "bg-emerald-500/15 text-emerald-900 border-emerald-500/30",
          tagBg: "bg-emerald-500/10 text-emerald-900 border-emerald-500/25",
          accentColor: "text-emerald-800",
        };
      case "pedal":
        return {
          icon: Compass,
          iconBg: "bg-sky-500/15 text-sky-900 border-sky-500/30",
          tagBg: "bg-sky-500/10 text-sky-900 border-sky-500/25",
          accentColor: "text-sky-800",
        };
      default:
        return {
          icon: ShieldAlert,
          iconBg: "bg-[#141414]/10 text-[#141414] border-[#141414]/20",
          tagBg: "bg-[#141414]/5 text-[#141414] border-[#141414]/15",
          accentColor: "text-[#141414]",
        };
    }
  };

  const currentConfig = getCategoryConfig(currentItem.categoryType);
  const CategoryIcon = currentConfig.icon;

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
      ref={containerRef}
      id="technical-trap-doors-section"
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
        {/* Layer 3: Deepest stacked card layer (Offset to bottom-right) */}
        {totalItems > 2 && (
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-3xl bg-[#DCDAD6] border border-[#141414]/10 shadow-sm pointer-events-none transition-all duration-500 ease-out transform translate-x-3 translate-y-3.5 scale-[0.99] z-0"
          />
        )}

        {/* Layer 2: Mid stacked card layer (Offset to bottom-right) */}
        {totalItems > 1 && (
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-3xl bg-[#E5E4E1] border border-[#141414]/12 shadow-md pointer-events-none transition-all duration-500 ease-out transform translate-x-1.5 translate-y-1.5 scale-[0.995] z-1"
          />
        )}

        {/* Layer 1: ACTIVE FOCAL CARD (#EDECEA crisp opaque background with fluid slide, depth & blur transitions) */}
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
                ease: [0.25, 1, 0.5, 1], // Smooth fluid ease-out
                layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
              }}
              className="rounded-3xl p-5 sm:p-6 border border-[#141414]/15 shadow-xl bg-[#EDECEA] relative overflow-hidden"
              style={{
                boxShadow: "0 18px 38px -12px rgba(20,20,20,0.12), 0 2px 8px 0 rgba(20,20,20,0.04), inset 0 1px 0 rgba(255,255,255,1)",
              }}
            >
              {/* Subtle top inner light highlight */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

              {/* TOP ROW: ICON + CATEGORY & SCOPE BADGES */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs shrink-0 border ${currentConfig.iconBg}`}>
                    <CategoryIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#141414]/80 block truncate">
                      {currentItem.category}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center space-x-2 shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold uppercase tracking-wider border shadow-2xs ${currentConfig.tagBg}`}>
                    {currentItem.scope}
                  </span>
                </div>
              </div>

              {/* CORE HEADLINE TITLE (Less Wordy, Bold, Intuitive) */}
              <div className="space-y-1 my-2">
                <h3 className="text-lg sm:text-xl font-serif font-bold text-[#141414] tracking-tight">
                  {currentItem.title}
                </h3>
              </div>

              {/* ACTION TIP CALLOUT (Intuitive & Direct Takeaway) */}
              <div className="mt-2.5 mb-3 p-3 rounded-2xl bg-[#141414]/[0.035] border border-[#141414]/10 flex items-start gap-2.5 shadow-2xs">
                <div className="w-5 h-5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-900 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <ArrowRight className="w-3 h-3 text-amber-700" />
                </div>
                <div className="text-xs sm:text-[13px] font-sans text-[#141414] leading-relaxed">
                  <span className="font-bold text-[#141414] mr-1">Tactile Cue:</span>
                  <span className="text-[#141414]/90 font-medium">{currentItem.actionTip}</span>
                </div>
              </div>

              {/* EXPANDED MUSICAL CONTEXT */}
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
              id="trapdoor-prev-button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full text-[#141414]/65 hover:text-[#141414] hover:bg-[#141414]/[0.07] active:bg-[#141414]/12 flex items-center justify-center transition-all active:scale-90 cursor-pointer group"
              title="Previous point"
              aria-label="Previous technical trap door"
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
                  title={`${item.title} (${item.scope})`}
                  aria-label={`Jump to ${item.title}`}
                />
              ))}
            </div>

            {/* Right Chevron Button */}
            <button
              type="button"
              id="trapdoor-next-button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full text-[#141414]/65 hover:text-[#141414] hover:bg-[#141414]/[0.07] active:bg-[#141414]/12 flex items-center justify-center transition-all active:scale-90 cursor-pointer group"
              title="Next point"
              aria-label="Next technical trap door"
            >
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
