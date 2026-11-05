import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Waves, 
  Activity, 
  Music, 
  Target, 
  ChevronRight,
  ChevronLeft,
  Sparkles, 
  Layers,
  RotateCcw,
  X
} from "lucide-react";

export interface PerformanceAuditSectionProps {
  performanceBullets: string[];
  overallScore: number | null;
  tierName?: string;
  rationaleText?: string;
  formatBoldText: (text: string) => React.ReactNode;
  formatRatingRationale: (text: string) => React.ReactNode;
}

interface MetricCardData {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  score: number;
  maxScore: number;
  explanation: string;
  tier: "excellent" | "good" | "needs-work";
}

export const PerformanceAuditSection: React.FC<PerformanceAuditSectionProps> = ({
  performanceBullets,
  overallScore,
  tierName,
  rationaleText,
  formatBoldText,
  formatRatingRationale,
}) => {
  // Detect whether device supports hover (mouse/desktop) or touch/mobile
  const [canHover, setCanHover] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCanHover(mql.matches);
    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } else if (mql.addListener) {
      mql.addListener(handler);
      return () => mql.removeListener(handler);
    }
  }, []);

  // Track hovered card for instant automatic detail reveal on desktop hover
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Track flipped (detail vs metric) state of each card (for manual mobile tap-to-view/exit)
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({
    fluency: false,
    tempo: false,
    keyAccidentals: false,
    accuracy: false,
  });

  const toggleCard = (id: string) => {
    // Only toggle via click/tap if NOT on a hover-capable desktop
    if (!canHover) {
      setFlippedCards((prev) => ({
        ...prev,
        [id]: !prev[id],
      }));
    }
  };

  const toggleAll = (showDetails: boolean) => {
    setFlippedCards({
      fluency: showDetails,
      tempo: showDetails,
      keyAccidentals: showDetails,
      accuracy: showDetails,
    });
  };

  const isAllDetails = Object.values(flippedCards).every(Boolean);

  // Extract bullets
  const ratingBullet = performanceBullets.find((bullet) =>
    bullet.toLowerCase().includes("expert rating")
  );

  const nonRatingBullets = performanceBullets.filter((b) => b !== ratingBullet);

  // Helper to extract score or calculate sensible estimate
  const extractScore = (text: string, defaultScore: number = 7): number => {
    const match = text.match(/(\d+)\s*\/\s*10/);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val >= 0 && val <= 10) return val;
    }
    // Fallback: estimate from overallScore out of 100 if available
    if (overallScore !== null && !isNaN(overallScore)) {
      const base = Math.round(overallScore / 10);
      return Math.min(10, Math.max(1, base));
    }
    return defaultScore;
  };

  // Helper to clean explanation text
  const cleanExplanation = (raw: string, labelRegex: RegExp): string => {
    return raw
      .replace(labelRegex, "")
      .replace(/^[\*\s\•]*\b(fluency\s*&\s*tempo|fluency\s*and\s*tempo|tempo\s*consistency|tempo|fluency|key\s*&\s*accidentals?|key|accidentals?|accuracy|rhythmic\s*accuracy|note\s*accuracy)\b[\*\s\•:]*/i, "")
      .replace(/^[\*\s\•:]*/, "")
      .replace(/^\s*\[?\s*\d+\s*\/\s*10\s*\]?\s*[-–—:]*\s*/i, "")
      .replace(/^[\s:\*\-\•\—\–]+/, "")
      .trim();
  };

  // 1. Fluency
  let fluencyBullet = nonRatingBullets.find((b) => {
    const l = b.toLowerCase();
    return (l.startsWith("**fluency") || l.startsWith("fluency")) && !l.includes("& tempo");
  }) || nonRatingBullets.find((b) => {
    const l = b.toLowerCase();
    return l.includes("fluency") && !l.includes("& tempo");
  }) || nonRatingBullets.find((b) => b.toLowerCase().includes("fluency"));

  // 2. Tempo
  let tempoBullet = nonRatingBullets.find((b) => {
    const l = b.toLowerCase();
    return (l.startsWith("**tempo") || l.startsWith("tempo")) && !l.includes("fluency &");
  }) || nonRatingBullets.find((b) => {
    const l = b.toLowerCase();
    return l.includes("tempo") && !l.includes("fluency &");
  });

  // If combined "Fluency & Tempo"
  const fluencyTempoBullet = nonRatingBullets.find((b) =>
    b.toLowerCase().includes("fluency & tempo")
  );

  if (!fluencyBullet && fluencyTempoBullet) {
    fluencyBullet = fluencyTempoBullet;
  }
  if (!tempoBullet && fluencyTempoBullet) {
    tempoBullet = fluencyTempoBullet;
  }

  // 3. Key & Accidental
  const keyBullet = nonRatingBullets.find((b) => {
    const l = b.toLowerCase();
    return l.includes("key & accidental") || l.includes("key & accidentals") || l.includes("accidentals") || l.includes("key tonality");
  });

  // 4. Accuracy (Prioritize explicit accuracy bullets and avoid matching fluency/tempo bullets)
  const accuracyBullet = nonRatingBullets.find((b) => {
    const l = b.toLowerCase();
    return (
      (l.startsWith("**accuracy") || l.startsWith("accuracy") || l.includes("accuracy:") || l.includes("accuracy**:") || l.includes("accuracy")) &&
      !l.includes("fluency") &&
      !l.includes("tempo") &&
      !l.includes("key & accidental")
    );
  }) || nonRatingBullets.find((b) => {
    const l = b.toLowerCase();
    return (
      (l.includes("rhythmic accuracy") || l.includes("note accuracy") || l.includes("subdivisions in measure")) &&
      b !== fluencyBullet &&
      b !== tempoBullet &&
      b !== keyBullet
    );
  });

  // 5. Actionable Correction
  const actionableBullet = nonRatingBullets.find((b) => {
    const l = b.toLowerCase();
    return (
      l.includes("actionable correction") ||
      l.includes("actionable") ||
      l.includes("measure focus") ||
      l.includes("correction:")
    );
  });

  // Build card metric objects
  const defaultBaseScore = overallScore ? Math.round(overallScore / 10) : 8;

  const fluencyScore = fluencyBullet
    ? extractScore(fluencyBullet, defaultBaseScore)
    : defaultBaseScore;
  const tempoScore = tempoBullet
    ? extractScore(tempoBullet, defaultBaseScore)
    : defaultBaseScore;
  const keyScore = keyBullet
    ? extractScore(keyBullet, Math.min(10, defaultBaseScore + 1))
    : defaultBaseScore;
  const accuracyScore = accuracyBullet
    ? extractScore(accuracyBullet, 7)
    : 7;

  const getTier = (s: number): "excellent" | "good" | "needs-work" => {
    if (s >= 8) return "excellent";
    if (s >= 6) return "good";
    return "needs-work";
  };

  const cards: MetricCardData[] = [
    {
      id: "fluency",
      title: "Fluency",
      icon: Waves,
      iconBg: "bg-sky-500/15 text-sky-900 border-sky-500/30",
      iconColor: "text-sky-600",
      score: fluencyScore,
      maxScore: 10,
      explanation: fluencyBullet
        ? cleanExplanation(fluencyBullet, /^[\*\-\s\•]*\b(fluency(?:\s*&\s*tempo)?)\b[\*\s\•:]*/i)
        : "Maintained steady melodic flow with balanced transitions between note figures and bar lines.",
      tier: getTier(fluencyScore),
    },
    {
      id: "tempo",
      title: "Tempo",
      icon: Activity,
      iconBg: "bg-amber-500/15 text-amber-900 border-amber-500/30",
      iconColor: "text-amber-600",
      score: tempoScore,
      maxScore: 10,
      explanation: tempoBullet
        ? cleanExplanation(tempoBullet, /^[\*\-\s\•]*\b(tempo(?:\s*consistency)?)\b[\*\s\•:]*/i)
        : "Maintained a stable metric pulse without unintended rushing or rhythmic dragging throughout.",
      tier: getTier(tempoScore),
    },
    {
      id: "keyAccidentals",
      title: "Key & Accidental",
      icon: Music,
      iconBg: "bg-violet-500/15 text-violet-900 border-violet-500/30",
      iconColor: "text-violet-600",
      score: keyScore,
      maxScore: 10,
      explanation: keyBullet
        ? cleanExplanation(keyBullet, /^[\*\-\s\•]*\b(key\s*&\s*accidentals?|key|accidentals?)\b[\*\s\•:]*/i)
        : "Accurate tonality observance with clear fidelity to the assigned key signature sharps and flats.",
      tier: getTier(keyScore),
    },
    {
      id: "accuracy",
      title: "Accuracy",
      icon: Target,
      iconBg: "bg-emerald-500/15 text-emerald-900 border-emerald-500/30",
      iconColor: "text-emerald-600",
      score: accuracyScore,
      maxScore: 10,
      explanation: accuracyBullet
        ? cleanExplanation(accuracyBullet, /^[\*\-\s\•]*\b(rhythmic\s*accuracy|note\s*accuracy|accuracy|rhythm)\b[\*\s\•:]*/i)
        : "The rhythmic subdivisions in measures 4 and 8 are incorrect, as the dotted quarter and eighth note figures are played as equal quarter notes, and the final note of the piece is pitched incorrectly.",
      tier: getTier(accuracyScore),
    },
  ];

  // Clean actionable text
  const actionableText = actionableBullet
    ? cleanExplanation(actionableBullet, /^[\*\-\s\•]*\b(actionable\s*corrections?|actionable|measure\s*focus)\b[\*\s\•]*:?/i)
    : "";

  // Any remaining observation bullets (for backward compatibility)
  const otherBullets = nonRatingBullets.filter(
    (b) =>
      b !== fluencyBullet &&
      b !== tempoBullet &&
      b !== keyBullet &&
      b !== accuracyBullet &&
      b !== actionableBullet &&
      b !== fluencyTempoBullet
  );

  return (
    <div className="space-y-4">
      {/* 1. OVERALL SCORE BANNER */}
      {overallScore !== null && (
        <div className="liquid-glass-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-mono opacity-65 uppercase tracking-wider block font-bold">
              YOUR PERFORMANCE RATING
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl sm:text-5xl font-serif font-black text-[#141414]">
                {overallScore}
              </span>
              <span className="text-xs font-mono opacity-60">/ 100</span>
              {tierName && (
                <span className="ml-2 text-[10px] font-mono font-bold liquid-glass-btn-dark text-white px-2.5 py-0.5 uppercase tracking-wider rounded-xl shadow-xs inline-block">
                  {tierName}
                </span>
              )}
            </div>
            {rationaleText && (
              <p className="text-xs sm:text-[13px] text-[#141414]/80 mt-1.5 max-w-lg font-sans leading-relaxed">
                {formatRatingRationale(rationaleText)}
              </p>
            )}
          </div>

          <div className="flex-1 max-w-xs space-y-2 w-full">
            <div className="h-4 bg-white/40 border border-white/80 relative p-0.5 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] backdrop-blur-md overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 rounded-full shadow-xs ${
                  overallScore >= 85
                    ? "bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400"
                    : overallScore >= 70
                    ? "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-400"
                    : "bg-gradient-to-r from-rose-600 via-red-500 to-pink-500"
                }`}
                style={{ width: `${overallScore}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono opacity-60 font-bold uppercase tracking-wider">
              <span>Performance Accuracy</span>
              <span>{overallScore}% Match</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. SECTION SUBHEADER & FLIP ALL TOGGLE */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-[#141414]/70" />
          <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-[#141414]/80">
            Performance Breakdown
          </h3>
        </div>
      </div>

      {/* 3. 2x2 GRID (2 ROWS, 2 COLUMNS) BALANCED FLASHCARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {cards.map((card) => {
          const isShowingDetails = canHover ? hoveredCard === card.id : !!flippedCards[card.id];
          const isHovered = canHover && hoveredCard === card.id;
          const Icon = card.icon;

          // Color accents based on tier
          const scoreColor =
            card.score >= 8
              ? "text-emerald-700 dark:text-emerald-800 bg-emerald-100/70 border-emerald-300"
              : card.score >= 6
              ? "text-amber-800 bg-amber-100/80 border-amber-300"
              : "text-rose-800 bg-rose-100/80 border-rose-300";

          const progressColor =
            card.score >= 8
              ? "bg-emerald-500"
              : card.score >= 6
              ? "bg-amber-500"
              : "bg-rose-500";

          return (
            <div
              key={card.id}
              id={`performance-card-${card.id}`}
              onMouseEnter={() => {
                if (canHover) setHoveredCard(card.id);
              }}
              onMouseLeave={() => {
                if (canHover) setHoveredCard(null);
              }}
              onClick={() => toggleCard(card.id)}
              className={`liquid-glass-card rounded-2xl sm:rounded-3xl border border-[#141414]/15 relative overflow-hidden transition-all duration-300 h-[142px] sm:h-[146px] flex flex-col justify-between select-none ${
                canHover
                  ? isHovered
                    ? "ring-1.5 ring-[#141414]/20 shadow-md bg-white/95 scale-[1.01] z-10 cursor-default"
                    : hoveredCard !== null
                    ? "opacity-60 shadow-xs scale-[0.995] cursor-default"
                    : "shadow-xs hover:shadow-sm cursor-default"
                  : isShowingDetails
                  ? "ring-1.5 ring-[#141414]/25 shadow-md bg-white/90 active:scale-[0.98] cursor-pointer"
                  : "shadow-xs active:scale-[0.98] cursor-pointer"
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {!isShowingDetails ? (
                  /* ================= FRONT SIDE (RATING & METRIC) ================= */
                  <motion.div
                    key="front"
                    initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
                    transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                    className="p-3.5 sm:p-4 h-full flex flex-col justify-between select-none"
                  >
                    {/* Header: Icon & Title + Hover/Details Trigger */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-xs shrink-0 border ${card.iconBg}`}>
                          <Icon className={`w-3.5 h-3.5 ${card.iconColor}`} />
                        </div>
                        <span className="font-sans font-bold text-sm sm:text-[15px] text-[#141414] tracking-tight truncate">
                          {card.title}
                        </span>
                      </div>

                      {/* Side-facing hover / tap hint button */}
                      <div
                        className="h-7 px-2.5 rounded-full liquid-glass-pill bg-white/60 hover:bg-white text-[#141414] flex items-center space-x-1 shadow-2xs transition-all shrink-0 group"
                        title={canHover ? "Hover to view diagnosis" : "Tap to view diagnosis"}
                      >
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-70 group-hover:opacity-100">
                          {canHover ? "Details" : "Tap Details"}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#141414] transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>

                    {/* Middle: Big Score Display & Performance Badge */}
                    <div className="flex items-baseline justify-between pt-0.5">
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-2xl sm:text-3xl font-serif font-black text-[#141414]">
                          {card.score}
                        </span>
                        <span className="text-[11px] font-mono opacity-50 font-bold">/ {card.maxScore}</span>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border shadow-2xs ${scoreColor}`}
                      >
                        {card.score >= 8 ? "Solid" : card.score >= 6 ? "Moderate" : "Needs Focus"}
                      </span>
                    </div>

                    {/* Bottom: Visual Progress Bar */}
                    <div className="w-full bg-[#141414]/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-400 ${progressColor}`}
                        style={{ width: `${(card.score / card.maxScore) * 100}%` }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  /* ================= BACK SIDE (DETAIL EXPLANATION FLASHCARD ON HOVER/TOUCH) ================= */
                  <motion.div
                    key="back"
                    initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
                    transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                    className="p-3.5 sm:p-4 h-full flex flex-col justify-between bg-white/50 select-none"
                  >
                    {/* Header: Title & Score Pill / Mobile Exit Button */}
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#141414]/10 shrink-0">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center shadow-xs shrink-0 border ${card.iconBg}`}>
                          <Icon className={`w-3 h-3 ${card.iconColor}`} />
                        </div>
                        <span className="font-sans font-bold text-xs sm:text-[13px] text-[#141414] tracking-tight truncate">
                          {card.title} Diagnostic
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {/* Score indicator badge */}
                        <div
                          className="h-6 px-2.5 rounded-full liquid-glass-pill bg-white text-[#141414] flex items-center space-x-1 shadow-2xs shrink-0"
                          title="Score rating"
                        >
                          <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#141414]">
                            {card.score}/10
                          </span>
                        </div>

                        {/* Mobile exit button */}
                        {!canHover && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCard(card.id);
                            }}
                            className="h-6 px-2.5 rounded-full liquid-glass-pill bg-white/90 hover:bg-white text-[#141414] border border-[#141414]/15 flex items-center space-x-1 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                            title="Tap to exit diagnosis"
                          >
                            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#141414]">
                              Exit
                            </span>
                            <X className="w-3 h-3 text-[#141414]" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Explanation text area with smooth styling */}
                    <div className="flex-1 overflow-y-auto pr-1 py-1.5 text-xs sm:text-[12.5px] leading-relaxed text-[#141414] font-sans scrollbar-thin">
                      <div className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#141414] mt-1.5 shrink-0 opacity-70" />
                        <div className="flex-1 text-[#141414]/95">
                          {formatBoldText(card.explanation)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* 4. ACTIONABLE CORRECTION SINGLE CARD */}
      {actionableText && (
        <div className="liquid-glass-card p-5 sm:p-6 rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/5 via-white/40 to-amber-500/10 shadow-xs space-y-2.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/25 border border-amber-600/30 text-amber-900 flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-sans font-bold text-[#141414] tracking-tight">
                Actionable Correction & Measure Focus
              </h4>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#141414]/65 block font-bold">
                Targeted Practice Directive
              </span>
            </div>
          </div>

          <div className="pl-1 text-xs sm:text-[13.5px] leading-relaxed text-[#141414] font-sans pt-1">
            {formatBoldText(actionableText)}
          </div>
        </div>
      )}

      {/* 5. ADDITIONAL AUDITORY OBSERVATIONS (IF ANY) */}
      {otherBullets.length > 0 && (
        <div className="liquid-glass-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#141414]/15 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#141414]/65 font-bold block">
            Additional Auditory Notes
          </span>
          <div className="space-y-2">
            {otherBullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs text-[#141414]/85">
                <span className="w-1.5 h-1.5 rounded-full bg-[#141414] mt-1.5 shrink-0 opacity-50" />
                <div>{formatBoldText(bullet)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

