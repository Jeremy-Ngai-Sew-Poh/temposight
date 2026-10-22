import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Piano, Clock, ChevronDown, X } from "lucide-react";

interface MusicalBlueprintGridProps {
  blueprint: string[];
}

interface BlueprintItem {
  type: "key" | "time" | "other";
  title: string;
  badge: string;
  subtext: string;
  difficulty: "Easy" | "Moderate" | "Tricky" | "Complex";
  difficultyColor: string;
  explanation: string;
  raw: string;
}

export const MusicalBlueprintGrid: React.FC<MusicalBlueprintGridProps> = ({ blueprint }) => {
  const [hoveredCard, setHoveredCard] = useState<"key" | "time" | null>(null);
  const [canHover, setCanHover] = useState(true);

  useEffect(() => {
    const checkHover = () => {
      setCanHover(window.matchMedia("(hover: hover)").matches);
    };
    checkHover();
    window.addEventListener("resize", checkHover);
    return () => window.removeEventListener("resize", checkHover);
  }, []);

  const parsedItems = useMemo(() => {
    let keyItem: BlueprintItem | null = null;
    let timeItem: BlueprintItem | null = null;
    const others: BlueprintItem[] = [];

    blueprint.forEach((bullet) => {
      const lower = bullet.toLowerCase();
      const hasColon = bullet.includes(":");
      const rawPrefix = hasColon ? bullet.substring(0, bullet.indexOf(":")).replace(/\*\*/g, "").trim() : "";
      const rawContent = hasColon ? bullet.substring(bullet.indexOf(":") + 1).replace(/\*\*/g, "").trim() : bullet.replace(/\*\*/g, "").trim();

      if (lower.includes("key signature") || (!keyItem && (lower.startsWith("key:") || lower.includes("key")))) {
        // Extract key name (e.g. "C Major", "C# Minor", "Eb Major", "D Major")
        const keyMatch = rawContent.match(/\b([A-G](?:[#♯b♭]|-(?:flat|sharp))?\s*(?:major|minor))\b/i);
        const keyName = keyMatch ? keyMatch[1] : (rawContent.split(".")[0] || "Identified Key");

        // Extract accidentals or signature notes concisely (avoiding swallowing long explanatory sentences)
        let accidentalsBadge = "";
        const sharpsMatch = rawContent.match(/(\d+)\s*sharps?/i);
        const flatsMatch = rawContent.match(/(\d+)\s*flats?/i);
        const naturalsMatch = rawContent.match(/(no sharps or flats|all natural|natural)/i);

        let accidentalCount = 0;
        if (sharpsMatch) {
          accidentalCount = parseInt(sharpsMatch[1], 10);
          accidentalsBadge = `${accidentalCount} ${accidentalCount === 1 ? "Sharp" : "Sharps"}`;
        } else if (flatsMatch) {
          accidentalCount = parseInt(flatsMatch[1], 10);
          accidentalsBadge = `${accidentalCount} ${accidentalCount === 1 ? "Flat" : "Flats"}`;
        } else if (naturalsMatch) {
          accidentalCount = 0;
          accidentalsBadge = "No accidentals";
        } else if (rawContent.includes("accidentals")) {
          const match = rawContent.match(/(?:accidentals?|flats?|sharps?)\s*(?::\s*[A-Ga-g#b,\s]+)?/i);
          if (match && match[0].length <= 25) {
            accidentalsBadge = match[0].trim();
          } else {
            accidentalsBadge = "Key Foundation";
          }
        } else {
          accidentalsBadge = "Key Foundation";
        }

        // Determine Key Difficulty
        let difficulty: "Easy" | "Moderate" | "Tricky" | "Complex" = "Easy";
        let difficultyColor = "bg-emerald-500/10 text-emerald-800 border-emerald-500/20";

        if (accidentalCount === 0 && (keyName.toLowerCase().includes("c major") || keyName.toLowerCase().includes("a minor") || accidentalsBadge.includes("No accidentals"))) {
          difficulty = "Easy";
          difficultyColor = "bg-emerald-500/10 text-emerald-800 border-emerald-500/20";
        } else if (accidentalCount >= 1 && accidentalCount <= 2) {
          difficulty = "Moderate";
          difficultyColor = "bg-amber-500/10 text-amber-800 border-amber-500/20";
        } else if (accidentalCount >= 3 && accidentalCount <= 4) {
          difficulty = "Tricky";
          difficultyColor = "bg-amber-600/15 text-amber-900 border-amber-600/30";
        } else if (accidentalCount >= 5) {
          difficulty = "Complex";
          difficultyColor = "bg-rose-500/10 text-rose-800 border-rose-500/20";
        } else {
          // Heuristic based on key name
          const lowerName = keyName.toLowerCase();
          if (lowerName.includes("c#") || lowerName.includes("f#") || lowerName.includes("eb") || lowerName.includes("ab")) {
            difficulty = "Tricky";
            difficultyColor = "bg-amber-600/15 text-amber-900 border-amber-600/30";
          } else if (lowerName.includes("g major") || lowerName.includes("f major") || lowerName.includes("d major") || lowerName.includes("bb major")) {
            difficulty = "Moderate";
            difficultyColor = "bg-amber-500/10 text-amber-800 border-amber-500/20";
          }
        }

        keyItem = {
          type: "key",
          title: "Key Signature",
          badge: keyName,
          subtext: accidentalsBadge || "Key Foundation",
          difficulty,
          difficultyColor,
          explanation: rawContent,
          raw: bullet,
        };
      } else if (lower.includes("time signature") || (!timeItem && (lower.startsWith("time:") || lower.includes("meter")))) {
        // Extract meter fraction (e.g. "4/4", "3/4", "2/2 (Cut Time)", "2/4", "6/8", "12/8")
        const meterMatch = rawContent.match(/\b(\d+\s*\/\s*\d+(?:\s*\([^)]+\))?|cut time|common time)\b/i);
        const meterName = meterMatch ? meterMatch[1] : (rawContent.split(".")[0] || "Meter");

        // Extract pulse summary without duplicating the meter prefix or repeating "The meter is 4/4"
        let pulseBrief = "";
        
        // Remove redundant leading meter references like "4/4 meter," or "4/4," or "The meter is 4/4," from pulse description
        const cleanedContent = rawContent
          .replace(/^(?:the\s+)?(?:key|meter|time\s+signature)\s+is\s+[^,;.:]+(?:[,:;\\-–—])?\s*/i, '')
          .replace(new RegExp(`^${meterName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*(?:meter)?(?:[,:;\\-–—])?\\s*`, 'i'), '')
          .replace(/^(?:meter|time signature)(?:[,:;\\-–—])?\s*/i, '')
          .trim();

        // Extract concise pulse division summary (e.g. "Quarter note pulse", "4 beats per measure", "Sixteenth-note patterns")
        const beatsMatch = rawContent.match(/(?:sixteenth-note\s+(?:patterns?|pulse|subdivisions?)|quarter-note\s+pulse|eighth-note\s+pulse|steady\s+quarter\s+notes?|(?:four|three|two|six|twelve|\d+)\s+beats?\s+per\s+(?:measure|bar)|compound\s+(?:quadruple|triple|duple)|simple\s+(?:quadruple|triple|duple))/i);
        if (beatsMatch) {
          pulseBrief = beatsMatch[0].trim();
        } else {
          // Take first short clause ONLY if it does not duplicate the meter
          const firstClause = cleanedContent.split(/[.,;]/)[0]?.trim();
          if (firstClause && firstClause.length <= 40 && !firstClause.toLowerCase().includes("meter") && !firstClause.toLowerCase().includes(meterName.toLowerCase())) {
            pulseBrief = firstClause;
          } else {
            // Provide clean metric pulse classification based on meter
            if (meterName.includes("4/4") || meterName.toLowerCase().includes("common")) {
              pulseBrief = "Quarter note pulse";
            } else if (meterName.includes("3/4")) {
              pulseBrief = "Triple meter pulse";
            } else if (meterName.includes("2/4") || meterName.includes("2/2") || meterName.toLowerCase().includes("cut")) {
              pulseBrief = "Duple meter pulse";
            } else if (meterName.includes("6/8") || meterName.includes("12/8")) {
              pulseBrief = "Compound meter pulse";
            } else {
              pulseBrief = "Metric Pulse";
            }
          }
        }

        // Determine Time Signature Difficulty
        let difficulty: "Easy" | "Moderate" | "Tricky" | "Complex" = "Easy";
        let difficultyColor = "bg-emerald-500/10 text-emerald-800 border-emerald-500/20";

        const lowerMeter = meterName.toLowerCase();

        if (lowerMeter.includes("4/4") || lowerMeter.includes("common time") || lowerMeter.includes("3/4")) {
          difficulty = "Easy";
          difficultyColor = "bg-emerald-500/10 text-emerald-800 border-emerald-500/20";
        } else if (lowerMeter.includes("2/4") || lowerMeter.includes("2/2") || lowerMeter.includes("cut time") || lowerMeter.includes("6/8")) {
          // 2/4 and cut-time are tricky as specifically requested by the user
          difficulty = "Tricky";
          difficultyColor = "bg-amber-600/15 text-amber-900 border-amber-600/30";
        } else if (lowerMeter.includes("5/4") || lowerMeter.includes("7/8") || lowerMeter.includes("12/8") || lowerMeter.includes("9/8")) {
          difficulty = "Complex";
          difficultyColor = "bg-rose-500/10 text-rose-800 border-rose-500/20";
        } else {
          difficulty = "Moderate";
          difficultyColor = "bg-amber-500/10 text-amber-800 border-amber-500/20";
        }

        timeItem = {
          type: "time",
          title: "Time Signature",
          badge: meterName,
          subtext: pulseBrief || "Metric Pulse",
          difficulty,
          difficultyColor,
          explanation: rawContent,
          raw: bullet,
        };
      } else {
        others.push({
          type: "other",
          title: rawPrefix || "Parameter",
          badge: rawContent.split(".")[0] || "",
          subtext: "",
          difficulty: "Moderate",
          difficultyColor: "bg-[#141414]/5 text-[#141414] border-[#141414]/10",
          explanation: rawContent,
          raw: bullet,
        });
      }
    });

    // Fallbacks if not detected
    if (!keyItem) {
      keyItem = {
        type: "key",
        title: "Key Signature",
        badge: "C Major",
        subtext: "No accidentals",
        difficulty: "Easy",
        difficultyColor: "bg-emerald-500/10 text-emerald-800 border-emerald-500/20",
        explanation: "Standard diatonic scale without sharps or flats.",
        raw: "Key Signature: C Major",
      };
    }

    if (!timeItem) {
      timeItem = {
        type: "time",
        title: "Time Signature",
        badge: "4/4 (Common Time)",
        subtext: "4 beats per bar • Quarter note pulse",
        difficulty: "Easy",
        difficultyColor: "bg-emerald-500/10 text-emerald-800 border-emerald-500/20",
        explanation: "Standard quadruple meter with a quarter note pulse division.",
        raw: "Time Signature: 4/4",
      };
    }

    return { keyItem, timeItem, others };
  }, [blueprint]);

  const toggleCard = (card: "key" | "time") => {
    setHoveredCard((prev) => (prev === card ? null : card));
  };

  const { keyItem, timeItem, others } = parsedItems;

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
      className="space-y-3.5"
    >
      {/* 2-GRID (1x2 on Desktop/Tablet, Responsive 1 Column on Mobile) */}
      <motion.div
        layout
        transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch"
      >
        {/* CARD 1: KEY SIGNATURE */}
        <motion.div
          layout
          transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
          id="blueprint-card-key"
          onMouseEnter={() => {
            if (canHover) setHoveredCard("key");
          }}
          onMouseLeave={() => {
            if (canHover) setHoveredCard(null);
          }}
          onClick={() => toggleCard("key")}
          className={`group relative liquid-glass-card rounded-3xl px-5 pt-5 pb-2 sm:px-6 sm:pt-6 sm:pb-2.5 transition-all duration-300 overflow-hidden cursor-pointer border border-[#141414]/15 flex flex-col justify-between h-full select-none ${
            hoveredCard === "key"
              ? "shadow-lg bg-white/95 ring-1.5 ring-[#141414]/20 scale-[1.01] z-10"
              : hoveredCard === "time"
              ? canHover
                ? "opacity-50 scale-[0.99] filter blur-[2px] pointer-events-none"
                : "opacity-60 scale-[0.99] active:scale-[0.98]"
              : "shadow-xs hover:shadow-md active:scale-[0.98]"
          }`}
        >
          {/* Top & Core Content Area */}
          <motion.div layout className="flex-1 flex flex-col">
            {/* Top Label & Icon Header */}
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-900 border border-amber-500/30 flex items-center justify-center shadow-xs shrink-0">
                  <Piano className="w-4 h-4 text-amber-700" />
                </div>
                <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#141414]/80 truncate">
                  {keyItem.title}
                </span>
              </div>
              
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold uppercase tracking-wider border shadow-2xs ${keyItem.difficultyColor}`}>
                  {keyItem.difficulty}
                </span>
                {!canHover && hoveredCard === "key" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCard("key");
                    }}
                    className="h-6 px-2.5 rounded-full liquid-glass-pill bg-white/90 hover:bg-white text-[#141414] border border-[#141414]/15 flex items-center space-x-1 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                    title="Tap to collapse"
                  >
                    <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#141414]">
                      Exit
                    </span>
                    <X className="w-3 h-3 text-[#141414]" />
                  </button>
                )}
              </div>
            </div>

            {/* Core concise headline (Less Wordy) */}
            <div className="space-y-0.5 my-1.5">
              <h4 className="text-xl sm:text-2xl font-serif font-bold text-[#141414] tracking-tight">
                {keyItem.badge}
              </h4>
              {keyItem.subtext && keyItem.subtext.toLowerCase() !== keyItem.badge.toLowerCase() && (
                <p className="text-xs font-mono font-semibold text-[#141414]/75 capitalize">
                  {keyItem.subtext}
                </p>
              )}
            </div>

            {/* Hover Detail Overlay with smooth fade & backdrop blur */}
            <motion.div
              layout
              transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
              className={`mt-2.5 pt-2.5 border-t border-[#141414]/10 transition-all duration-300 ${
                hoveredCard === "key"
                  ? "opacity-100 max-h-none translate-y-0"
                  : "opacity-60 max-h-12 overflow-hidden"
              }`}
            >
              <p className={`text-xs sm:text-[13px] leading-relaxed text-[#141414]/90 font-sans ${
                hoveredCard === "key" ? "line-clamp-none" : "line-clamp-2"
              }`}>
                {keyItem.explanation}
              </p>
            </motion.div>
          </motion.div>

          {/* Bottom Expand Cue Arrow (Flush to bottom) */}
          <div className="flex justify-center items-center pt-2 pb-0.5 mt-auto">
            <div className="flex items-center gap-1 text-[#141414]/50 group-hover:text-[#141414]/90 transition-colors">
              {!canHover && (
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">
                  {hoveredCard === "key" ? "Tap to close" : "Tap for details"}
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${
                  hoveredCard === "key" ? "rotate-180 text-[#141414]" : "translate-y-0 group-hover:translate-y-0.5"
                }`}
              />
            </div>
          </div>
        </motion.div>

        {/* CARD 2: TIME SIGNATURE */}
        <motion.div
          layout
          transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
          id="blueprint-card-time"
          onMouseEnter={() => {
            if (canHover) setHoveredCard("time");
          }}
          onMouseLeave={() => {
            if (canHover) setHoveredCard(null);
          }}
          onClick={() => toggleCard("time")}
          className={`group relative liquid-glass-card rounded-3xl px-5 pt-5 pb-2 sm:px-6 sm:pt-6 sm:pb-2.5 transition-all duration-300 overflow-hidden cursor-pointer border border-[#141414]/15 flex flex-col justify-between h-full select-none ${
            hoveredCard === "time"
              ? "shadow-lg bg-white/95 ring-1.5 ring-[#141414]/20 scale-[1.01] z-10"
              : hoveredCard === "key"
              ? canHover
                ? "opacity-50 scale-[0.99] filter blur-[2px] pointer-events-none"
                : "opacity-60 scale-[0.99] active:scale-[0.98]"
              : "shadow-xs hover:shadow-md active:scale-[0.98]"
          }`}
        >
          {/* Top & Core Content Area */}
          <motion.div layout className="flex-1 flex flex-col">
            {/* Top Label & Icon Header */}
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-900 border border-sky-500/30 flex items-center justify-center shadow-xs shrink-0">
                  <Clock className="w-4 h-4 text-sky-700" />
                </div>
                <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#141414]/80 truncate">
                  {timeItem.title}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold uppercase tracking-wider border shadow-2xs ${timeItem.difficultyColor}`}>
                  {timeItem.difficulty}
                </span>
                {!canHover && hoveredCard === "time" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCard("time");
                    }}
                    className="h-6 px-2.5 rounded-full liquid-glass-pill bg-white/90 hover:bg-white text-[#141414] border border-[#141414]/15 flex items-center space-x-1 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                    title="Tap to collapse"
                  >
                    <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#141414]">
                      Exit
                    </span>
                    <X className="w-3 h-3 text-[#141414]" />
                  </button>
                )}
              </div>
            </div>

            {/* Core concise headline (Less Wordy) */}
            <div className="space-y-0.5 my-1.5">
              <h4 className="text-xl sm:text-2xl font-serif font-bold text-[#141414] tracking-tight">
                {timeItem.badge}
              </h4>
              {timeItem.subtext && timeItem.subtext.toLowerCase() !== timeItem.badge.toLowerCase() && !timeItem.subtext.toLowerCase().includes("the meter is") && (
                <p className="text-xs font-mono font-semibold text-[#141414]/75 capitalize">
                  {timeItem.subtext}
                </p>
              )}
            </div>

            {/* Hover Detail Overlay with smooth fade & backdrop blur */}
            <motion.div
              layout
              transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
              className={`mt-2.5 pt-2.5 border-t border-[#141414]/10 transition-all duration-300 ${
                hoveredCard === "time"
                  ? "opacity-100 max-h-none translate-y-0"
                  : "opacity-60 max-h-12 overflow-hidden"
              }`}
            >
              <p className={`text-xs sm:text-[13px] leading-relaxed text-[#141414]/90 font-sans ${
                hoveredCard === "time" ? "line-clamp-none" : "line-clamp-2"
              }`}>
                {timeItem.explanation}
              </p>
            </motion.div>
          </motion.div>

          {/* Bottom Expand Cue Arrow (Flush to bottom) */}
          <div className="flex justify-center items-center pt-2 pb-0.5 mt-auto">
            <div className="flex items-center gap-1 text-[#141414]/50 group-hover:text-[#141414]/90 transition-colors">
              {!canHover && (
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">
                  {hoveredCard === "time" ? "Tap to close" : "Tap for details"}
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${
                  hoveredCard === "time" ? "rotate-180 text-[#141414]" : "translate-y-0 group-hover:translate-y-0.5"
                }`}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Auxiliary Blueprint Items (if any other parameters exist) */}
      {others.length > 0 && (
        <div className="liquid-glass-card p-4 rounded-2xl border border-[#141414]/10 space-y-2">
          {others.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[#141414] font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-[#141414] mt-2 shrink-0 opacity-60" />
              <div>
                <span className="font-bold text-[#141414] mr-1.5">{item.title}:</span>
                <span className="text-[#141414]/85">{item.explanation}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
