import React, { useState, useMemo, useCallback } from "react";
import { Music, Volume2, Sparkles, Check, Play, Info } from "lucide-react";
import { audioSystem } from "../utils/audioSystem";

interface InteractivePianoKeyboardProps {
  blueprint: string[];
}

interface WhiteKeyData {
  id: string;
  note: string;
  octave: number;
  freq: number;
  displayName: string;
}

interface BlackKeyData {
  id: string;
  notes: string[]; // ["F#", "Gb", "F♯", "G♭"]
  sharpName: string;
  flatName: string;
  freq: number;
  leftPercent: number; // css left percentage
  widthPercent: number; // css width percentage
}

// Circle of Fifths dictionary for fallback accidental detection
const KEY_SIGNATURE_MAP: Record<string, { accidentals: string[]; type: "sharp" | "flat" | "natural"; tonic: string; name: string }> = {
  "c major": { accidentals: [], type: "natural", tonic: "C", name: "C Major" },
  "a minor": { accidentals: [], type: "natural", tonic: "A", name: "A Minor" },
  
  // Sharps
  "g major": { accidentals: ["F#"], type: "sharp", tonic: "G", name: "G Major" },
  "e minor": { accidentals: ["F#"], type: "sharp", tonic: "E", name: "E Minor" },
  "d major": { accidentals: ["F#", "C#"], type: "sharp", tonic: "D", name: "D Major" },
  "b minor": { accidentals: ["F#", "C#"], type: "sharp", tonic: "B", name: "B Minor" },
  "a major": { accidentals: ["F#", "C#", "G#"], type: "sharp", tonic: "A", name: "A Major" },
  "f# minor": { accidentals: ["F#", "C#", "G#"], type: "sharp", tonic: "F#", name: "F♯ Minor" },
  "e major": { accidentals: ["F#", "C#", "G#", "D#"], type: "sharp", tonic: "E", name: "E Major" },
  "c# minor": { accidentals: ["F#", "C#", "G#", "D#"], type: "sharp", tonic: "C#", name: "C♯ Minor" },
  "b major": { accidentals: ["F#", "C#", "G#", "D#", "A#"], type: "sharp", tonic: "B", name: "B Major" },
  "g# minor": { accidentals: ["F#", "C#", "G#", "D#", "A#"], type: "sharp", tonic: "G#", name: "G♯ Minor" },
  "f# major": { accidentals: ["F#", "C#", "G#", "D#", "A#", "E#"], type: "sharp", tonic: "F#", name: "F♯ Major" },
  "d# minor": { accidentals: ["F#", "C#", "G#", "D#", "A#", "E#"], type: "sharp", tonic: "D#", name: "D♯ Minor" },
  "c# major": { accidentals: ["F#", "C#", "G#", "D#", "A#", "E#", "B#"], type: "sharp", tonic: "C#", name: "C♯ Major" },

  // Flats
  "f major": { accidentals: ["Bb"], type: "flat", tonic: "F", name: "F Major" },
  "d minor": { accidentals: ["Bb"], type: "flat", tonic: "D", name: "D Minor" },
  "bb major": { accidentals: ["Bb", "Eb"], type: "flat", tonic: "Bb", name: "B♭ Major" },
  "b-flat major": { accidentals: ["Bb", "Eb"], type: "flat", tonic: "Bb", name: "B♭ Major" },
  "g minor": { accidentals: ["Bb", "Eb"], type: "flat", tonic: "G", name: "G Minor" },
  "eb major": { accidentals: ["Bb", "Eb", "Ab"], type: "flat", tonic: "Eb", name: "E♭ Major" },
  "e-flat major": { accidentals: ["Bb", "Eb", "Ab"], type: "flat", tonic: "Eb", name: "E♭ Major" },
  "c minor": { accidentals: ["Bb", "Eb", "Ab"], type: "flat", tonic: "C", name: "C Minor" },
  "ab major": { accidentals: ["Bb", "Eb", "Ab", "Db"], type: "flat", tonic: "Ab", name: "A♭ Major" },
  "a-flat major": { accidentals: ["Bb", "Eb", "Ab", "Db"], type: "flat", tonic: "Ab", name: "A♭ Major" },
  "f minor": { accidentals: ["Bb", "Eb", "Ab", "Db"], type: "flat", tonic: "F", name: "F Minor" },
  "db major": { accidentals: ["Bb", "Eb", "Ab", "Db", "Gb"], type: "flat", tonic: "Db", name: "D♭ Major" },
  "d-flat major": { accidentals: ["Bb", "Eb", "Ab", "Db", "Gb"], type: "flat", tonic: "Db", name: "D♭ Major" },
  "bb minor": { accidentals: ["Bb", "Eb", "Ab", "Db", "Gb"], type: "flat", tonic: "Bb", name: "B♭ Minor" },
  "b-flat minor": { accidentals: ["Bb", "Eb", "Ab", "Db", "Gb"], type: "flat", tonic: "Bb", name: "B♭ Minor" },
  "gb major": { accidentals: ["Bb", "Eb", "Ab", "Db", "Gb", "Cb"], type: "flat", tonic: "Gb", name: "G♭ Major" },
  "g-flat major": { accidentals: ["Bb", "Eb", "Ab", "Db", "Gb", "Cb"], type: "flat", tonic: "Gb", name: "G♭ Major" },
  "eb minor": { accidentals: ["Bb", "Eb", "Ab", "Db", "Gb", "Cb"], type: "flat", tonic: "Eb", name: "E♭ Minor" },
  "cb major": { accidentals: ["Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb"], type: "flat", tonic: "Cb", name: "C♭ Major" },
};

const WHITE_KEYS: WhiteKeyData[] = [
  { id: "C4", note: "C", octave: 4, freq: 261.63, displayName: "C4" },
  { id: "D4", note: "D", octave: 4, freq: 293.66, displayName: "D4" },
  { id: "E4", note: "E", octave: 4, freq: 329.63, displayName: "E4" },
  { id: "F4", note: "F", octave: 4, freq: 349.23, displayName: "F4" },
  { id: "G4", note: "G", octave: 4, freq: 392.00, displayName: "G4" },
  { id: "A4", note: "A", octave: 4, freq: 440.00, displayName: "A4" },
  { id: "B4", note: "B", octave: 4, freq: 493.88, displayName: "B4" },
  { id: "C5", note: "C", octave: 5, freq: 523.25, displayName: "C5" },
];

const BLACK_KEYS: BlackKeyData[] = [
  {
    id: "C#4",
    notes: ["C#", "Db", "C♯", "D♭", "C-SHARP", "D-FLAT"],
    sharpName: "C♯4",
    flatName: "D♭4",
    freq: 277.18,
    leftPercent: 8.1,
    widthPercent: 8.0,
  },
  {
    id: "D#4",
    notes: ["D#", "Eb", "D♯", "E♭", "D-SHARP", "E-FLAT"],
    sharpName: "D♯4",
    flatName: "E♭4",
    freq: 311.13,
    leftPercent: 21.4,
    widthPercent: 8.0,
  },
  {
    id: "F#4",
    notes: ["F#", "Gb", "F♯", "G♭", "F-SHARP", "G-FLAT"],
    sharpName: "F♯4",
    flatName: "G♭4",
    freq: 369.99,
    leftPercent: 45.4,
    widthPercent: 8.0,
  },
  {
    id: "G#4",
    notes: ["G#", "Ab", "G♯", "A♭", "G-SHARP", "A-FLAT"],
    sharpName: "G♯4",
    flatName: "A♭4",
    freq: 415.30,
    leftPercent: 58.5,
    widthPercent: 8.0,
  },
  {
    id: "A#4",
    notes: ["A#", "Bb", "A♯", "B♭", "A-SHARP", "B-FLAT"],
    sharpName: "A♯4",
    flatName: "B♭4",
    freq: 466.16,
    leftPercent: 71.6,
    widthPercent: 8.0,
  },
];

export const InteractivePianoKeyboard: React.FC<InteractivePianoKeyboardProps> = ({ blueprint }) => {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [lastPlayedNote, setLastPlayedNote] = useState<string | null>(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);

  // Parse Key Signature info from the Blueprint bullets
  const keyInfo = useMemo(() => {
    const keyBullet = blueprint.find(b => {
      const lower = b.toLowerCase();
      return lower.includes("key signature") || lower.includes("tonality") || lower.includes("key:");
    }) || "";

    const rawText = keyBullet.replace(/\*\*/g, "").trim();
    let detectedKeyName = "C Major";
    let detectedAccidentals: string[] = [];
    let detectedTonic = "C";
    let isFlatKey = false;

    // Direct match against known keys
    const lowerRaw = rawText.toLowerCase();
    for (const [keyPattern, data] of Object.entries(KEY_SIGNATURE_MAP)) {
      if (lowerRaw.includes(keyPattern)) {
        detectedKeyName = data.name;
        detectedAccidentals = [...data.accidentals];
        detectedTonic = data.tonic;
        isFlatKey = data.type === "flat";
        break;
      }
    }

    // Explicit regex extraction for listed accidentals (e.g. "2 sharps: F#, C#" or "5 flats: Bb, Eb, Ab, Db, Gb")
    const sharpsMatch = rawText.match(/(?:sharps?|#):\s*([A-Ga-g#\s,–-]+)/i);
    if (sharpsMatch) {
      const extractedSharps = sharpsMatch[1]
        .split(/[,–\s]+/)
        .map(s => s.trim().toUpperCase())
        .filter(s => /^[A-G]#?$/i.test(s))
        .map(s => s.endsWith("#") ? s : `${s}#`);
      if (extractedSharps.length > 0) {
        detectedAccidentals = extractedSharps;
        isFlatKey = false;
      }
    }

    const flatsMatch = rawText.match(/(?:flats?|b):\s*([A-Ga-gb\s,–-]+)/i);
    if (flatsMatch) {
      const extractedFlats = flatsMatch[1]
        .split(/[,–\s]+/)
        .map(s => s.trim())
        .filter(s => /^[A-G]b?$/i.test(s))
        .map(s => s.endsWith("b") || s.endsWith("B") ? `${s[0].toUpperCase()}b` : `${s[0].toUpperCase()}b`);
      if (extractedFlats.length > 0) {
        detectedAccidentals = extractedFlats;
        isFlatKey = true;
      }
    }

    // Deduplicate and normalize accidentals (e.g. "F#" or "Bb")
    const normalizedAccidentals = Array.from(new Set(detectedAccidentals.map(acc => {
      const clean = acc.replace(/♯/g, "#").replace(/♭/g, "b").trim();
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    })));

    return {
      rawText: rawText || "C Major (No accidentals)",
      keyName: detectedKeyName,
      tonic: detectedTonic,
      accidentals: normalizedAccidentals,
      isFlatKey,
      hasAccidentals: normalizedAccidentals.length > 0,
    };
  }, [blueprint]);

  // Check if a black key matches the detected key signature accidentals
  const isBlackKeyAccidental = useCallback((key: BlackKeyData) => {
    return keyInfo.accidentals.some(acc => {
      const normAcc = acc.toUpperCase();
      return key.notes.some(n => n.toUpperCase() === normAcc);
    });
  }, [keyInfo.accidentals]);

  // Format label to display for accidental badge on black keys
  const getAccidentalBadgeText = useCallback((key: BlackKeyData) => {
    // If it's a flat key or specifically requested flat accidental
    if (keyInfo.isFlatKey) {
      const match = keyInfo.accidentals.find(acc => acc.toLowerCase().startsWith(key.flatName.charAt(0).toLowerCase()));
      if (match) {
        return match.replace(/b/i, "♭");
      }
      return key.flatName.replace("4", "");
    }
    // Otherwise sharp
    const match = keyInfo.accidentals.find(acc => acc.toLowerCase().startsWith(key.sharpName.charAt(0).toLowerCase()));
    if (match) {
      return match.replace(/#/g, "♯");
    }
    return key.sharpName.replace("4", "");
  }, [keyInfo]);

  // Play an individual note
  const handlePlayKey = useCallback((freq: number, displayName: string, keyId: string) => {
    audioSystem.playPianoKey(freq, 0.85);
    setActiveKey(keyId);
    setLastPlayedNote(displayName);

    setTimeout(() => {
      setActiveKey(current => (current === keyId ? null : current));
    }, 350);
  }, []);

  // Play Scale / Chord sequence preview
  const handlePlayTonicScale = useCallback(() => {
    if (isPlayingSequence) return;
    setIsPlayingSequence(true);

    // Build the scale frequencies
    const notesToPlay: { freq: number; name: string; keyId: string }[] = [];

    // Combine white and black keys in order
    const allKeysSorted = [
      { id: "C4", name: "C4", freq: 261.63, note: "C" },
      { id: "C#4", name: keyInfo.isFlatKey ? "D♭4" : "C♯4", freq: 277.18, note: keyInfo.isFlatKey ? "Db" : "C#" },
      { id: "D4", name: "D4", freq: 293.66, note: "D" },
      { id: "D#4", name: keyInfo.isFlatKey ? "E♭4" : "D♯4", freq: 311.13, note: keyInfo.isFlatKey ? "Eb" : "D#" },
      { id: "E4", name: "E4", freq: 329.63, note: "E" },
      { id: "F4", name: "F4", freq: 349.23, note: "F" },
      { id: "F#4", name: keyInfo.isFlatKey ? "G♭4" : "F♯4", freq: 369.99, note: keyInfo.isFlatKey ? "Gb" : "F#" },
      { id: "G4", name: "G4", freq: 392.00, note: "G" },
      { id: "G#4", name: keyInfo.isFlatKey ? "A♭4" : "G♯4", freq: 415.30, note: keyInfo.isFlatKey ? "Ab" : "G#" },
      { id: "A4", name: "A4", freq: 440.00, note: "A" },
      { id: "A#4", name: keyInfo.isFlatKey ? "B♭4" : "A♯4", freq: 466.16, note: keyInfo.isFlatKey ? "Bb" : "A#" },
      { id: "B4", name: "B4", freq: 493.88, note: "B" },
      { id: "C5", name: "C5", freq: 523.25, note: "C" },
    ];

    // Filter notes that fit the active key signature (natural notes whose accidental counterpart is not active)
    const scaleNotes = allKeysSorted.filter(k => {
      // If it's a black key, include only if it's in key signature
      if (k.id.includes("#")) {
        const isAccidental = keyInfo.accidentals.some(acc => acc.toUpperCase() === k.note.toUpperCase() || (acc.toUpperCase() === "BB" && k.note === "Bb") || (acc.toUpperCase() === "EB" && k.note === "Eb"));
        return isAccidental;
      } else {
        // If it's a white key, check if it was sharped or flatted out
        const hasSharpCounterpart = keyInfo.accidentals.some(acc => acc.toUpperCase() === `${k.note}#`);
        const hasFlatCounterpart = keyInfo.accidentals.some(acc => acc.toUpperCase() === `${k.note}B`);
        return !hasSharpCounterpart && !hasFlatCounterpart;
      }
    });

    const sequence = scaleNotes.length >= 4 ? scaleNotes : allKeysSorted.filter(k => !k.id.includes("#"));

    sequence.forEach((note, idx) => {
      setTimeout(() => {
        audioSystem.playPianoKey(note.freq, 0.8);
        setActiveKey(note.id);
        setLastPlayedNote(note.name);

        setTimeout(() => {
          setActiveKey(curr => curr === note.id ? null : curr);
        }, 220);

        if (idx === sequence.length - 1) {
          setTimeout(() => {
            setIsPlayingSequence(false);
          }, 300);
        }
      }, idx * 260);
    });
  }, [isPlayingSequence, keyInfo]);

  return (
    <div className="liquid-glass-card p-4 sm:p-6 rounded-3xl shadow-sm space-y-4 select-none">
      {/* HEADER: Title & Key Signature Highlights */}
      <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-[#141414]/15">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 text-amber-900 border border-amber-500/30 flex items-center justify-center shadow-xs shrink-0">
            <Music className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-sans font-bold text-[#141414] tracking-tight">
              Interactive Piano Keyboard
            </h3>
            <p className="text-xs sm:text-sm text-[#141414]/75 font-sans mt-0.5">
              {keyInfo.hasAccidentals ? (
                <span className="font-bold text-[#141414] bg-amber-200/60 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-md text-[11px] sm:text-xs inline-block">
                  {keyInfo.accidentals.map(a => a.replace(/#/g, "♯").replace(/b/g, "♭")).join(", ")}
                  {" "}({keyInfo.accidentals.length} {keyInfo.isFlatKey ? (keyInfo.accidentals.length === 1 ? "flat" : "flats") : (keyInfo.accidentals.length === 1 ? "sharp" : "sharps")})
                </span>
              ) : (
                <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded-md text-[11px] sm:text-xs inline-block">
                  All Natural (No sharps or flats)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action button & readout */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePlayTonicScale}
            disabled={isPlayingSequence}
            className="w-9 h-9 sm:w-auto sm:px-3 sm:py-1.5 liquid-glass-pill hover:bg-white/80 text-[#141414] rounded-full text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center sm:space-x-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.95] transition-all shadow-xs shrink-0"
            title={isPlayingSequence ? "Playing scale..." : "Hear Scale (audition key signature)"}
            aria-label="Hear Scale"
          >
            <Play className={`w-3.5 h-3.5 ${isPlayingSequence ? "text-amber-500 animate-spin" : "text-[#141414]"}`} />
            <span className="hidden sm:inline">{isPlayingSequence ? "Playing..." : "Hear Scale"}</span>
          </button>
        </div>
      </div>

      {/* PIANO KEYBOARD HOUSING */}
      <div className="relative w-full max-w-[460px] sm:max-w-[500px] mx-auto pt-1 pb-1">
        {/* KEYS STAGE */}
        <div className="relative w-full h-52 sm:h-60 bg-[#0F0E0C] p-1.5 rounded-2xl shadow-[0_14px_28px_rgba(0,0,0,0.22)] flex overflow-hidden border border-[#141414]/25">
          {/* WHITE KEYS LAYER */}
          <div className="flex w-full h-full touch-manipulation">
            {WHITE_KEYS.map((key) => {
              const isActive = activeKey === key.id;
              const isTonic = keyInfo.tonic.toUpperCase() === key.note.toUpperCase();

              return (
                <button
                  key={key.id}
                  type="button"
                  onClick={() => handlePlayKey(key.freq, key.displayName, key.id)}
                  className={`relative flex-1 h-full rounded-b-md first:rounded-l-xl last:rounded-r-xl flex flex-col justify-end items-center pb-3 sm:pb-3.5 transition-all duration-75 cursor-pointer select-none border-r border-l border-[#141414]/15 first:border-l-0 last:border-r-0 touch-manipulation transform-gpu ${
                    isActive
                      ? "bg-gradient-to-b from-[#E6E1D8] to-[#D5CEC2] shadow-[inset_0_4px_8px_rgba(0,0,0,0.25)] translate-y-[3px]"
                      : "bg-gradient-to-b from-[#FFFEFA] via-[#F8F6F0] to-[#ECE8DF] shadow-[0_5px_7px_rgba(0,0,0,0.18),inset_0_-5px_0_rgba(0,0,0,0.08),inset_0_2px_1px_rgba(255,255,255,0.9)] hover:brightness-98"
                  }`}
                  aria-label={`Piano key ${key.displayName}`}
                >
                  {/* Subtle Tonic Marker */}
                  {isTonic && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mb-1.5 shadow-xs" title="Tonic / Root Note" />
                  )}

                  {/* Note Label */}
                  <span className={`text-[11px] sm:text-xs font-sans font-bold tracking-tight ${isActive ? "text-[#141414]" : "text-[#141414]/80"}`}>
                    {key.displayName}
                  </span>
                </button>
              );
            })}
          </div>

          {/* BLACK KEYS LAYER (Positioned Absolutely) */}
          <div className="absolute inset-x-1.5 top-1.5 h-[63%] pointer-events-none touch-manipulation">
            {BLACK_KEYS.map((bKey) => {
              const isAccidental = isBlackKeyAccidental(bKey);
              const isActive = activeKey === bKey.id;
              const badgeText = getAccidentalBadgeText(bKey);

              return (
                <div
                  key={bKey.id}
                  style={{
                    left: `${bKey.leftPercent}%`,
                    width: `${bKey.widthPercent}%`,
                  }}
                  className="absolute top-0 h-full pointer-events-auto z-20 touch-manipulation"
                >
                  <button
                    type="button"
                    onClick={() => handlePlayKey(bKey.freq, keyInfo.isFlatKey ? bKey.flatName : bKey.sharpName, bKey.id)}
                    className={`w-full h-full rounded-b-md flex flex-col justify-end items-center pb-2.5 transition-all duration-75 cursor-pointer select-none border border-black/40 touch-manipulation transform-gpu ${
                      isActive
                        ? "bg-gradient-to-b from-[#1C1C1C] to-[#0A0A0A] shadow-[inset_0_3px_6px_rgba(0,0,0,0.7)] translate-y-[2px]"
                        : isAccidental
                          ? "bg-gradient-to-b from-[#2C2822] via-[#1F1C18] to-[#12100E] shadow-[0_6px_12px_rgba(0,0,0,0.55),inset_0_-3px_0_rgba(245,158,11,0.4),inset_0_1px_1px_rgba(255,255,255,0.25)] ring-1.5 ring-amber-400/80"
                          : "bg-gradient-to-b from-[#2E2E2E] via-[#1C1C1C] to-[#0D0D0D] shadow-[0_6px_10px_rgba(0,0,0,0.5),inset_0_-3px_0_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:brightness-110"
                    }`}
                    aria-label={`Piano key ${bKey.sharpName} / ${bKey.flatName}`}
                  >
                    {/* Accidental Highlight Badge */}
                    {isAccidental ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-sm" />
                        <span className="px-1 py-0.5 rounded text-[9.5px] font-sans font-extrabold text-amber-300 bg-black/60 tracking-tight leading-none">
                          {badgeText}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-sans text-white/40 font-medium tracking-tight leading-none">
                        {keyInfo.isFlatKey ? bKey.flatName.replace("4", "") : bKey.sharpName.replace("4", "")}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FOOTER LEGEND */}
      <div className="flex items-center justify-center gap-5 pt-1 text-[11px] font-sans text-[#141414]/80">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/40 inline-block" />
          <span className="font-medium text-[#141414]/80">Key Signature Accidental</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
          <span className="font-medium text-[#141414]/80">Tonic Root</span>
        </div>
      </div>
    </div>
  );
};
