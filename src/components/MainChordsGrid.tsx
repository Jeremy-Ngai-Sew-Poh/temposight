import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Layers, Sparkles, ChevronDown, X } from "lucide-react";

interface MainChordsGridProps {
  chords: string[];
}

interface ChordItem {
  type: "sequence" | "cadence" | "other";
  title: string;
  badge: string;
  subtext: string;
  difficulty: "Easy" | "Moderate" | "Tricky" | "Complex";
  difficultyColor: string;
  explanation: string;
  raw: string;
}

export const MainChordsGrid: React.FC<MainChordsGridProps> = ({ chords }) => {
  const [hoveredCard, setHoveredCard] = useState<"sequence" | "cadence" | null>(null);
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
    let sequenceItem: ChordItem | null = null;
    let cadenceItem: ChordItem | null = null;
    const others: ChordItem[] = [];

    chords.forEach((bullet) => {
      const lower = bullet.toLowerCase();
      const hasColon = bullet.includes(":");
      const rawPrefix = hasColon ? bullet.substring(0, bullet.indexOf(":")).replace(/\*\*/g, "").trim() : "";
      const rawContent = hasColon ? bullet.substring(bullet.indexOf(":") + 1).replace(/\*\*/g, "").trim() : bullet.replace(/\*\*/g, "").trim();

      if (
        lower.includes("primary chord") ||
        lower.includes("chord sequence") ||
        lower.includes("harmonic progression") ||
        (!sequenceItem && (lower.startsWith("progression") || lower.includes("chords:")))
      ) {
        // Extract concise sequence badge (e.g. "I – IV – V – I" or "D Major → A Major → D Major")
        let conciseBadge = "";
        
        // Check for roman numeral patterns like "I - IV - V" or "i - iv - V7"
        const romanMatch = rawContent.match(/\b((?:I|II|III|IV|V|VI|VII|i|ii|iii|iv|v|vi|vii)[^.,;()\n]*(?:[–\-→]\s*(?:I|II|III|IV|V|VI|VII|i|ii|iii|iv|v|vi|vii)[^.,;()\n]*)+)\b/i);
        
        // Check for chord names like "C Major -> G Major" or "D (I) -> A (V)"
        const chordMatch = rawContent.match(/([A-G](?:[#♯b♭]|-(?:flat|sharp))?(?:\s*(?:maj|min|major|minor|7|dom7))?\s*(?:\([^)]+\))?(?:\s*(?:[–\-→]|to)\s*[A-G](?:[#♯b♭]|-(?:flat|sharp))?(?:\s*(?:maj|min|major|minor|7|dom7))?\s*(?:\([^)]+\))?)+)/i);

        if (romanMatch) {
          conciseBadge = romanMatch[1].replace(/–|-/g, " → ").trim();
        } else if (chordMatch) {
          conciseBadge = chordMatch[1].replace(/\bto\b/gi, "→").replace(/–|-/g, "→").replace(/\s*→\s*/g, " → ").trim();
          // Keep it reasonably compact for badge view
          if (conciseBadge.length > 38) {
            const parts = conciseBadge.split("→");
            if (parts.length > 3) {
              conciseBadge = `${parts[0].trim()} → ${parts[1].trim()} … → ${parts[parts.length - 1].trim()}`;
            }
          }
        } else {
          // Extract first meaningful harmonic phrase
          const firstSentence = rawContent.split(/[.;]/)[0] || "";
          conciseBadge = firstSentence.length > 35 ? firstSentence.slice(0, 35) + "…" : firstSentence || "Tonal Progression";
        }

        // Measure overview subtext
        let measureSubtext = "Tonal Harmony";
        const measureMatch = rawContent.match(/(?:mm?\.\s*\d+(?:[–\-]\d+)?|measures?\s*\d+(?:[–\-]\d+)?|bars?\s*\d+(?:[–\-]\d+)?)/i);
        if (measureMatch) {
          measureSubtext = `${measureMatch[0].trim()} • Harmonic Path`;
        } else if (rawContent.includes("harmonic")) {
          measureSubtext = "Harmonic Framework";
        }

        // Determine Sequence Difficulty
        let difficulty: "Easy" | "Moderate" | "Tricky" | "Complex" = "Easy";
        let difficultyColor = "bg-emerald-500/10 text-emerald-800 border-emerald-500/20";

        const lowerSeq = rawContent.toLowerCase();
        if (
          lowerSeq.includes("secondary dominant") ||
          lowerSeq.includes("chromatic") ||
          lowerSeq.includes("diminished") ||
          lowerSeq.includes("augmented") ||
          lowerSeq.includes("neapolitan") ||
          lowerSeq.includes("v7/v") ||
          lowerSeq.includes("modulation") ||
          lowerSeq.includes("borrowed")
        ) {
          difficulty = "Tricky";
          difficultyColor = "bg-amber-600/15 text-amber-900 border-amber-600/30";
        } else if (lowerSeq.includes("polytonal") || lowerSeq.includes("atonal") || lowerSeq.includes("13") || lowerSeq.includes("altered")) {
          difficulty = "Complex";
          difficultyColor = "bg-rose-500/10 text-rose-800 border-rose-500/20";
        } else if (
          conciseBadge.includes("→") &&
          (conciseBadge.split("→").length > 3 || lowerSeq.includes("ii - v") || lowerSeq.includes("vi - ii"))
        ) {
          difficulty = "Moderate";
          difficultyColor = "bg-amber-500/10 text-amber-800 border-amber-500/20";
        } else {
          // Standard diatonic I-V-I or simple 2-3 chords
          difficulty = "Easy";
          difficultyColor = "bg-emerald-500/10 text-emerald-800 border-emerald-500/20";
        }

        sequenceItem = {
          type: "sequence",
          title: "Primary Chord Sequence",
          badge: conciseBadge,
          subtext: measureSubtext,
          difficulty,
          difficultyColor,
          explanation: rawContent,
          raw: bullet,
        };
      } else if (
        lower.includes("harmonic function") ||
        lower.includes("cadence") ||
        lower.includes("cadences") ||
        (!cadenceItem && (lower.startsWith("function") || lower.includes("resolution")))
      ) {
        // Extract clean, professional cadence badge
        let cadenceBadge = "Authentic Cadence (V–I)";
        const hasHalf = /half\s+cadence|imperfect\s+cadence/i.test(rawContent);
        const hasPAC = /perfect\s+authentic\s+cadence|PAC/i.test(rawContent);
        const hasIAC = /imperfect\s+authentic\s+cadence|IAC/i.test(rawContent);
        const hasAuthentic = /authentic\s+cadence/i.test(rawContent);
        const hasPlagal = /plagal\s+cadence/i.test(rawContent);
        const hasDeceptive = /deceptive\s+cadence/i.test(rawContent);

        if (hasHalf && (hasPAC || hasAuthentic)) {
          cadenceBadge = "Half Cadence → Authentic (V–I)";
        } else if (hasPAC) {
          cadenceBadge = "Perfect Authentic Cadence (V–I)";
        } else if (hasIAC) {
          cadenceBadge = "Imperfect Authentic Cadence (V–I)";
        } else if (hasAuthentic) {
          cadenceBadge = "Authentic Cadence (V–I)";
        } else if (hasHalf) {
          cadenceBadge = "Half Cadence (V Resolution)";
        } else if (hasPlagal) {
          cadenceBadge = "Plagal Cadence (IV–I)";
        } else if (hasDeceptive) {
          cadenceBadge = "Deceptive Cadence (V–vi)";
        } else if (lower.includes("dominant") && lower.includes("tonic")) {
          cadenceBadge = "Dominant → Tonic (V–I)";
        } else if (lower.includes("resolution")) {
          cadenceBadge = "Harmonic Phrase Resolution";
        } else {
          cadenceBadge = "Authentic Cadence (V–I)";
        }

        // Extract clear, meaningful phrasing subtext without awkward truncation
        let functionSubtext = "Phrase Architecture";
        const hasAntecedent = /antecedent/i.test(rawContent);
        const hasConsequent = /consequent/i.test(rawContent);
        const measureMatches = rawContent.match(/\bm\.\s*(\d+)/gi);

        if (hasAntecedent && hasConsequent) {
          functionSubtext = "Antecedent / Consequent Phrasing";
        } else if (hasHalf && hasAuthentic && measureMatches && measureMatches.length >= 2) {
          functionSubtext = `${measureMatches[0]} Half • ${measureMatches[1]} Authentic`;
        } else if (lower.includes("dominant") && lower.includes("tonic")) {
          functionSubtext = "Dominant Tension → Tonic Release";
        } else if (lower.includes("phrase structure") || lower.includes("period")) {
          functionSubtext = "Periodic Phrase Form";
        } else if (measureMatches && measureMatches.length > 0) {
          functionSubtext = `${measureMatches.join(", ")} Resolution Points`;
        } else {
          functionSubtext = "Harmonic Closure & Release";
        }

        // Determine Cadence / Phrasing Difficulty
        let difficulty: "Easy" | "Moderate" | "Tricky" | "Complex" = "Easy";
        let difficultyColor = "bg-emerald-500/10 text-emerald-800 border-emerald-500/20";

        if (hasDeceptive || /interrupted|evaded|elided/i.test(rawContent)) {
          difficulty = "Tricky";
          difficultyColor = "bg-amber-600/15 text-amber-900 border-amber-600/30";
        } else if ((hasHalf && hasAuthentic) || (hasAntecedent && hasConsequent)) {
          // Multi-cadence periodic phrasing requires handling intermediate tension
          difficulty = "Tricky";
          difficultyColor = "bg-amber-600/15 text-amber-900 border-amber-600/30";
        } else if (hasHalf || hasIAC || hasPlagal) {
          difficulty = "Moderate";
          difficultyColor = "bg-amber-500/10 text-amber-800 border-amber-500/20";
        } else if (hasPAC || hasAuthentic) {
          difficulty = "Easy";
          difficultyColor = "bg-emerald-500/10 text-emerald-800 border-emerald-500/20";
        } else {
          difficulty = "Moderate";
          difficultyColor = "bg-amber-500/10 text-amber-800 border-amber-500/20";
        }

        cadenceItem = {
          type: "cadence",
          title: "Cadential Resolution",
          badge: cadenceBadge,
          subtext: functionSubtext,
          difficulty,
          difficultyColor,
          explanation: rawContent,
          raw: bullet,
        };
      } else {
        others.push({
          type: "other",
          title: rawPrefix || "Progression",
          badge: rawContent.split(".")[0] || "",
          subtext: "",
          difficulty: "Moderate",
          difficultyColor: "bg-[#141414]/5 text-[#141414] border-[#141414]/10",
          explanation: rawContent,
          raw: bullet,
        });
      }
    });

    // Fallbacks if not present
    if (!sequenceItem) {
      sequenceItem = {
        type: "sequence",
        title: "Primary Chord Sequence",
        badge: "Tonal Harmonic Path",
        subtext: "Diatonic Progression",
        difficulty: "Easy",
        difficultyColor: "bg-emerald-500/10 text-emerald-800 border-emerald-500/20",
        explanation: "Diatonic chord progression anchoring the tonal center and voice leading across the score segment.",
        raw: "Primary Chord Sequence: Diatonic progression",
      };
    }

    if (!cadenceItem) {
      cadenceItem = {
        type: "cadence",
        title: "Cadential Resolution",
        badge: "Authentic Cadence (V–I)",
        subtext: "Harmonic Closure & Release",
        difficulty: "Easy",
        difficultyColor: "bg-emerald-500/10 text-emerald-800 border-emerald-500/20",
        explanation: "Dominant to tonic authentic cadential resolution bringing structural stability to the phrase.",
        raw: "Harmonic Function: Authentic Cadence (V-I)",
      };
    }

    return { sequenceItem, cadenceItem, others };
  }, [chords]);

  const toggleCard = (card: "sequence" | "cadence") => {
    setHoveredCard((prev) => (prev === card ? null : card));
  };

  const { sequenceItem, cadenceItem, others } = parsedItems;

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
        {/* CARD 1: PRIMARY CHORD SEQUENCE */}
        <motion.div
          layout
          transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
          id="chord-card-sequence"
          onMouseEnter={() => {
            if (canHover) setHoveredCard("sequence");
          }}
          onMouseLeave={() => {
            if (canHover) setHoveredCard(null);
          }}
          onClick={() => toggleCard("sequence")}
          className={`group relative liquid-glass-card rounded-3xl px-5 pt-5 pb-2 sm:px-6 sm:pt-6 sm:pb-2.5 transition-all duration-300 overflow-hidden cursor-pointer border border-[#141414]/15 flex flex-col justify-between h-full select-none ${
            hoveredCard === "sequence"
              ? "shadow-lg bg-white/95 ring-1.5 ring-[#141414]/20 scale-[1.01] z-10"
              : hoveredCard === "cadence"
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
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-900 border border-emerald-500/30 flex items-center justify-center shadow-xs shrink-0">
                  <Layers className="w-4 h-4 text-emerald-700" />
                </div>
                <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#141414]/80 truncate">
                  {sequenceItem.title}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold uppercase tracking-wider border shadow-2xs ${sequenceItem.difficultyColor}`}>
                  {sequenceItem.difficulty}
                </span>
                {!canHover && hoveredCard === "sequence" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCard("sequence");
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
              <h4 className="text-xl sm:text-2xl font-serif font-bold text-[#141414] tracking-tight line-clamp-1">
                {sequenceItem.badge}
              </h4>
              <p className="text-xs font-mono font-semibold text-[#141414]/75 capitalize">
                {sequenceItem.subtext}
              </p>
            </div>

            {/* Hover Detail Overlay with smooth fade & backdrop blur */}
            <motion.div
              layout
              transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
              className={`mt-2.5 pt-2.5 border-t border-[#141414]/10 transition-all duration-300 ${
                hoveredCard === "sequence"
                  ? "opacity-100 max-h-none translate-y-0"
                  : "opacity-60 max-h-12 overflow-hidden"
              }`}
            >
              <p className={`text-xs sm:text-[13px] leading-relaxed text-[#141414]/90 font-sans ${
                hoveredCard === "sequence" ? "line-clamp-none" : "line-clamp-2"
              }`}>
                {sequenceItem.explanation}
              </p>
            </motion.div>
          </motion.div>

          {/* Bottom Expand Cue Arrow (Flush to bottom) */}
          <div className="flex justify-center items-center pt-2 pb-0.5 mt-auto">
            <div className="flex items-center gap-1 text-[#141414]/50 group-hover:text-[#141414]/90 transition-colors">
              {!canHover && (
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">
                  {hoveredCard === "sequence" ? "Tap to close" : "Tap for details"}
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${
                  hoveredCard === "sequence" ? "rotate-180 text-[#141414]" : "translate-y-0 group-hover:translate-y-0.5"
                }`}
              />
            </div>
          </div>
        </motion.div>

        {/* CARD 2: HARMONIC FUNCTION & CADENCES */}
        <motion.div
          layout
          transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
          id="chord-card-cadence"
          onMouseEnter={() => {
            if (canHover) setHoveredCard("cadence");
          }}
          onMouseLeave={() => {
            if (canHover) setHoveredCard(null);
          }}
          onClick={() => toggleCard("cadence")}
          className={`group relative liquid-glass-card rounded-3xl px-5 pt-5 pb-2 sm:px-6 sm:pt-6 sm:pb-2.5 transition-all duration-300 overflow-hidden cursor-pointer border border-[#141414]/15 flex flex-col justify-between h-full select-none ${
            hoveredCard === "cadence"
              ? "shadow-lg bg-white/95 ring-1.5 ring-[#141414]/20 scale-[1.01] z-10"
              : hoveredCard === "sequence"
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
                  <Sparkles className="w-4 h-4 text-amber-700" />
                </div>
                <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#141414]/80 truncate">
                  {cadenceItem.title}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold uppercase tracking-wider border shadow-2xs ${cadenceItem.difficultyColor}`}>
                  {cadenceItem.difficulty}
                </span>
                {!canHover && hoveredCard === "cadence" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCard("cadence");
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
              <h4 className="text-xl sm:text-2xl font-serif font-bold text-[#141414] tracking-tight line-clamp-1">
                {cadenceItem.badge}
              </h4>
              <p className="text-xs font-mono font-semibold text-[#141414]/75 capitalize">
                {cadenceItem.subtext}
              </p>
            </div>

            {/* Hover Detail Overlay with smooth fade & backdrop blur */}
            <motion.div
              layout
              transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
              className={`mt-2.5 pt-2.5 border-t border-[#141414]/10 transition-all duration-300 ${
                hoveredCard === "cadence"
                  ? "opacity-100 max-h-none translate-y-0"
                  : "opacity-60 max-h-12 overflow-hidden"
              }`}
            >
              <p className={`text-xs sm:text-[13px] leading-relaxed text-[#141414]/90 font-sans ${
                hoveredCard === "cadence" ? "line-clamp-none" : "line-clamp-2"
              }`}>
                {cadenceItem.explanation}
              </p>
            </motion.div>
          </motion.div>

          {/* Bottom Expand Cue Arrow (Flush to bottom) */}
          <div className="flex justify-center items-center pt-2 pb-0.5 mt-auto">
            <div className="flex items-center gap-1 text-[#141414]/50 group-hover:text-[#141414]/90 transition-colors">
              {!canHover && (
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">
                  {hoveredCard === "cadence" ? "Tap to close" : "Tap for details"}
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${
                  hoveredCard === "cadence" ? "rotate-180 text-[#141414]" : "translate-y-0 group-hover:translate-y-0.5"
                }`}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Auxiliary Chords (if any extra bullets exist) */}
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
