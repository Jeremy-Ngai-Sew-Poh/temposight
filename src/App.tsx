import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Music, 
  UploadCloud, 
  RefreshCw, 
  AlertTriangle, 
  BookOpen, 
  Layers, 
  Activity, 
  Copy, 
  Check, 
  FileText,
  FileDown,
  ChevronRight,
  Info,
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Volume2,
  VolumeX,
  X,
  History,
  Calendar,
  Bot,
  Sparkles,
  MessageSquare,
  Send,
  Loader2,
  User
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { jsPDF } from "jspdf";
import { PRESETS, ScorePreset } from "./presets";
import { SAMPLE_PIECES, SamplePiece, preloadSampleAssets } from "./samples";
import { audioSystem } from "./utils/audioSystem";
import { ConfettiCanvas } from "./components/Confetti";
import { DotPatternBackground } from "./components/DotPatternBackground";
import { SheetMusicZoomViewer } from "./components/SheetMusicZoomViewer";
import { PerformanceTrendChart } from "./components/PerformanceTrendChart";
import { SampleNotationModal } from "./components/SampleNotationModal";
import { InteractivePianoKeyboard } from "./components/InteractivePianoKeyboard";
import { MusicalBlueprintGrid } from "./components/MusicalBlueprintGrid";
import { MainChordsGrid } from "./components/MainChordsGrid";
import { TechnicalTrapDoorsLayered } from "./components/TechnicalTrapDoorsLayered";
import { PracticeStrategyLayered } from "./components/PracticeStrategyLayered";
import { PerformanceAuditSection } from "./components/PerformanceAuditSection";
import { LiveWaveformVisualizer } from "./components/LiveWaveformVisualizer";

export interface PracticeSession {
  id: string;
  timestamp: string;
  sheetName: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  score: number;
  rawResult: string;
  presetId?: string;
  customImageUri?: string | null;
  customImageMime?: string | null;
  modelUsed?: string;
  fallbackUsed?: boolean;
}

const AnalyzingLoadingState: React.FC<{ hasAudio: boolean }> = ({ hasAudio }) => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = hasAudio
    ? [
        "Reading Your Music Sheet...",
        "Listening To Your Performance...",
        "Analyzing Your Tempo...",
        "Checking Your Accuracy...",
        "Almost There!"
      ]
    : [
        "Reading Your Music Sheet...",
        "Processing Sheet Notation...",
        "Analyzing Your Tempo...",
        "Checking Your Accuracy...",
        "Almost There!"
      ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 5000);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="w-full liquid-glass-card p-8 sm:p-14 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden my-6 min-h-[360px]">
      {/* Ambient Google brand glow spots */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#4285F4]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#34A853]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Centered Google Material Spinner */}
      <div className="relative flex items-center justify-center my-2">
        <svg
          className="w-16 h-16 sm:w-20 sm:h-20 animate-spin"
          viewBox="0 0 50 50"
          xmlns="http://www.w3.org/2000/svg"
          style={{ animationDuration: "1.4s" }}
        >
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="4.5"
            className="animate-google-spinner"
          />
        </svg>
      </div>

      {/* Dynamic Progress Text below loading wheel */}
      <div className="space-y-3 min-h-[70px] flex flex-col items-center justify-center max-w-lg w-full">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="font-serif text-2xl sm:text-3xl font-bold text-[#141414] tracking-tight"
        >
          {steps[stepIndex]}
        </motion.div>

        <div className="flex items-center space-x-2 pt-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === stepIndex
                  ? "w-7 bg-[#141414]"
                  : "w-1.5 bg-[#141414]/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [selectedPreset, setSelectedPreset] = useState<ScorePreset | null>(null);
  const [ambientMusicEnabled, setAmbientMusicEnabled] = useState<boolean>(true);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [history, setHistory] = useState<PracticeSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: "single" | "all";
    sessionId?: string;
    sessionTitle?: string;
  } | null>(null);
  const [customImageUri, setCustomImageUri] = useState<string | null>(null);
  const [customImageMime, setCustomImageMime] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState<string | null>(null);
  const [sampleModalOpen, setSampleModalOpen] = useState<boolean>(false);
  const [isLoadingSample, setIsLoadingSample] = useState<boolean>(false);

  // Active page step: 'setup' (Page 1) or 'report' (Page 2)
  const [page, setPage] = useState<"setup" | "report">("setup");

  // Audio Performance recording & upload states
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioMime, setAudioMime] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [lastAnalyzedWithAudio, setLastAnalyzedWithAudio] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [mobileStageTab, setMobileStageTab] = useState<"notation" | "audio">("notation");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDraggingAudio, setIsDraggingAudio] = useState<boolean>(false);

  // AI Chatbot Assistant states
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [hasFinishedInitialJump, setHasFinishedInitialJump] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<
    { id: string; role: "user" | "assistant"; text: string; timestamp: Date }[]
  >([
    {
      id: "welcome",
      role: "assistant",
      text: "Hello! I'm TempoSight Maestro AI. Ask me anything about sheet music notation, key signatures, rhythm subdivisions, or practice techniques!",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isChatSending, setIsChatSending] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat thread to bottom
  useEffect(() => {
    if (chatOpen && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatSending, chatOpen]);

  const handleSendChatMessage = async (presetQuery?: string) => {
    const textToSend = (presetQuery || chatInput).trim();
    if (!textToSend || isChatSending) return;

    const userMsg = {
      id: Date.now().toString(),
      role: "user" as const,
      text: textToSend,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    audioSystem.playMessageSent();
    if (!presetQuery) setChatInput("");
    setIsChatSending(true);

    try {
      const context = {
        sheetName: selectedPreset ? selectedPreset.title : customFileName || undefined,
        difficulty,
        hasAnalysis: Boolean(analysisResult),
      };

      const apiMessages = [...chatMessages, userMsg].map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, context }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to get AI response.");
      }

      audioSystem.playMessageReceived();
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: data.reply,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      console.error("Chat error:", err);
      audioSystem.playMessageReceived();
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "I experienced a brief connectivity issue. Please try sending your question again!",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  const renderInlineChat = (rawText: string) => {
    // Replace markdown bold/italic/code syntax into clean React elements
    const tokens: React.ReactNode[] = [];
    const regex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g;
    const parts = rawText.split(regex);

    parts.forEach((part, idx) => {
      if (!part) return;
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        tokens.push(
          <code key={idx} className="bg-black/10 text-[#141414] px-1 py-0.5 rounded text-[11px] font-mono">
            {part.slice(1, -1)}
          </code>
        );
      } else if (part.startsWith("***") && part.endsWith("***") && part.length >= 6) {
        tokens.push(
          <strong key={idx} className="font-bold italic text-[#141414]">
            {part.slice(3, -3)}
          </strong>
        );
      } else if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        tokens.push(
          <strong key={idx} className="font-bold text-[#141414]">
            {part.slice(2, -2)}
          </strong>
        );
      } else if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        tokens.push(
          <em key={idx} className="italic text-[#141414]">
            {part.slice(1, -1)}
          </em>
        );
      } else if (part.startsWith("_") && part.endsWith("_") && part.length >= 2) {
        tokens.push(
          <em key={idx} className="italic text-[#141414]">
            {part.slice(1, -1)}
          </em>
        );
      } else {
        tokens.push(part);
      }
    });

    return tokens.length > 0 ? tokens : rawText;
  };

  const renderFormattedChatText = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((rawLine, lIdx) => {
      const trimmed = rawLine.trim();

      if (!trimmed) {
        return <div key={lIdx} className="h-1.5" />;
      }

      // Check for Markdown Headings: #, ##, ###, ####, etc.
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const headingLevel = headingMatch[1].length;
        const headingText = headingMatch[2];
        return (
          <div
            key={lIdx}
            className={`font-serif font-bold text-[#141414] ${
              headingLevel <= 2 
                ? "text-sm sm:text-[14.5px] mt-2 mb-1" 
                : "text-xs sm:text-[13.5px] mt-1.5 mb-0.5"
            }`}
          >
            {renderInlineChat(headingText)}
          </div>
        );
      }

      // Check for Bullet points: * , - , + , • , ◦ , ▪ 
      const bulletMatch = trimmed.match(/^([\*\-\+\•\◦\▪])\s+(.*)$/);
      if (bulletMatch) {
        const bulletText = bulletMatch[2];
        return (
          <div key={lIdx} className="flex items-start gap-2 my-1 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#141414]/70 mt-1.5 shrink-0" />
            <div className="flex-1 leading-relaxed">
              {renderInlineChat(bulletText)}
            </div>
          </div>
        );
      }

      // Standard paragraph line
      return (
        <p key={lIdx} className="leading-relaxed">
          {renderInlineChat(trimmed)}
        </p>
      );
    });
  };

  // Recorder and playback refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playbackRef = useRef<HTMLAudioElement | null>(null);

  // Custom cursor movement & spring physics logic
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 20, stiffness: 450, mass: 0.4 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Scroll velocity tracking for fluid cursor stretch
  const scrollVelocity = useMotionValue(0);
  // Soft, bouncy spring for a liquid bubble look
  const scrollVelocitySpring = useSpring(scrollVelocity, { damping: 12, stiffness: 120, mass: 0.5 });

  // Map scroll velocity to vertical stretch and horizontal squeeze to preserve volume
  const cursorScaleY = useTransform(scrollVelocitySpring, [-3, 0, 3], [1.5, 1, 1.5]);
  const cursorScaleX = useTransform(scrollVelocitySpring, [-3, 0, 3], [0.75, 1, 0.75]);
  // Scrolling down (positive velocity) -> pull visual upwards (negative translateY)
  // Scrolling up (negative velocity) -> pull visual downwards (positive translateY)
  const cursorStretchYOffset = useTransform(scrollVelocitySpring, [-3, 0, 3], [24, 0, -24]);

  const [isPressed, setIsPressed] = useState(false);
  const [isCursorVisible, setIsCursorVisible] = useState(false);

  // Auto-resume audio system context and auto-play BGM once user interacts with the app
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (ambientMusicEnabled) {
        audioSystem.startBGM();
      }
      // Clean up listeners immediately
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [ambientMusicEnabled]);

  // Sync state with audio System
  const toggleAmbientMusic = () => {
    if (audioSystem.isBGMPlaying()) {
      audioSystem.stopBGM();
      setAmbientMusicEnabled(false);
    } else {
      audioSystem.startBGM();
      setAmbientMusicEnabled(true);
    }
  };

  // Load practice history on initial mount
  useEffect(() => {
    try {
      const rawHistory = localStorage.getItem("temposight_practice_history");
      if (rawHistory) {
        setHistory(JSON.parse(rawHistory));
      }
    } catch (err) {
      console.error("Failed to load practice history:", err);
    }
  }, []);

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => {
      const updated = prev.filter(session => session.id !== sessionId);
      try {
        localStorage.setItem("temposight_practice_history", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save history to localStorage:", err);
      }
      return updated;
    });
  };

  const handleSelectSession = (session: PracticeSession) => {
    setAnalysisResult(session.rawResult);
    setDifficulty(session.difficulty);
    setCurrentModel(session.modelUsed || "gemini-3.5-flash");
    setFallbackUsed(session.fallbackUsed || false);
    setLastAnalyzedWithAudio(true);
    setError(null);
    
    if (session.presetId) {
      const foundPreset = PRESETS.find(p => p.id === session.presetId);
      if (foundPreset) {
        setSelectedPreset(foundPreset);
        setCustomImageUri(null);
        setCustomImageMime(null);
        setCustomFileName(null);
      } else {
        setSelectedPreset(null);
        setCustomFileName(session.sheetName);
        setCustomImageUri(session.customImageUri || null);
        setCustomImageMime(session.customImageMime || null);
      }
    } else {
      setSelectedPreset(null);
      setCustomFileName(session.sheetName);
      setCustomImageUri(session.customImageUri || null);
      setCustomImageMime(session.customImageMime || null);
    }
    
    setPage("report");
    setSidebarOpen(false);
  };

  // Satisfying global tactile micro-click handler on literally any mouse click
  useEffect(() => {
    const playClickOnInteraction = () => {
      audioSystem.playClick();
    };

    window.addEventListener("click", playClickOnInteraction, { capture: true });
    return () => {
      window.removeEventListener("click", playClickOnInteraction, { capture: true });
    };
  }, []);

  useEffect(() => {
    // Only track cursor physics on fine-pointer devices (desktop/mouse)
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    let idleTimeout: NodeJS.Timeout | null = null;
    let scrollTimeout: NodeJS.Timeout | null = null;
    let scrollRafId: number | null = null;
    
    let lastScrollY = window.scrollY;
    let lastScrollYTime = performance.now();

    const moveCursor = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setIsCursorVisible(true);

      // Check if mouse buttons are held. e.buttons === 0 means no button is pressed.
      if (e.buttons === 0) {
        setIsPressed(false);
      }

      // Reset any active idle timers
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }

      // If mouse becomes inactive (idle for 1.2s), reset clicked status to normal size
      idleTimeout = setTimeout(() => {
        setIsPressed(false);
      }, 1200);
    };

    const handleScroll = () => {
      if (scrollRafId !== null) return;

      scrollRafId = requestAnimationFrame(() => {
        scrollRafId = null;
        const currentScrollY = window.scrollY;
        const currentScrollTime = performance.now();
        const dt = currentScrollTime - lastScrollYTime; // dt in ms
        const dy = currentScrollY - lastScrollY;

        if (dt > 0) {
          const velocity = dy / dt; // pixels per ms
          // Clamp velocity value to keep distortion aesthetic & non-exploding
          const clampedVelocity = Math.max(-4, Math.min(4, velocity));
          scrollVelocity.set(clampedVelocity);
        }

        lastScrollY = currentScrollY;
        lastScrollYTime = currentScrollTime;

        // Reset back to zero with hysteresis bounce on inactive scroll
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(() => {
          scrollVelocity.set(0);
        }, 80);
      });
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (e.button === 0) { // Only track left clicks
        setIsPressed(true);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      setIsPressed(false);
    };

    const handlePointerCancel = () => {
      setIsPressed(false);
    };

    const handlePointerLeave = () => {
      setIsCursorVisible(false);
      setIsPressed(false);
    };

    const handlePointerEnter = () => {
      setIsCursorVisible(true);
    };

    const handleBlur = () => {
      setIsPressed(false);
    };

    window.addEventListener("pointermove", moveCursor, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerCancel, { passive: true });
    window.addEventListener("blur", handleBlur);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("pointerleave", handlePointerLeave);
    document.addEventListener("pointerenter", handlePointerEnter);

    return () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (scrollRafId !== null) cancelAnimationFrame(scrollRafId);
      window.removeEventListener("pointermove", moveCursor);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("pointerenter", handlePointerEnter);
    };
  }, []);

  // Intro loading state machine:
  // - 'centered': only show large, beautiful logo in center of viewport
  // - 'moving': transition/movement of logo to the header position
  // - 'done': show other layout components with cascading bottom-up slide animations
  const [introPhase, setIntroPhase] = useState<'centered' | 'moving' | 'done'>('centered');

  // Dynamically calculate responsive metrics so the intro logo is always beautifully centered and fully in-frame
  const getIntroMetrics = useCallback(() => {
    if (typeof window === "undefined") {
      return { centerY: 280, scale: 2.3, isMobile: false };
    }
    const w = window.visualViewport?.width || window.innerWidth || 390;
    const h = window.visualViewport?.height || window.innerHeight || 844;
    const isMobile = w < 640;

    // Center Y relative to the header center (pt-1.5 = 6px, h-11 = 44px -> header center is at 28px from top)
    const centerY = Math.max(h / 2 - 28, 50);

    // Dynamic responsive scale to ensure the badge stays safely and comfortably in-frame on all devices
    // Keep scaled badge width to at most ~76% of viewport width on mobile (unscaled badge width is ~194px on mobile)
    const unscaledW = isMobile ? 194 : 210;
    const targetMaxWidth = Math.min(w * 0.76, 480);
    const scaleByW = targetMaxWidth / unscaledW;

    // Guard against short screen heights (e.g. mobile landscape)
    const targetMaxHeight = h * 0.26;
    const scaleByH = targetMaxHeight / 46;

    const computedScale = Math.min(scaleByW, scaleByH, 2.3);
    const scale = Math.max(1.15, Math.round(computedScale * 100) / 100);

    return { centerY, scale, isMobile };
  }, []);

  const [introMetrics, setIntroMetrics] = useState<{ centerY: number; scale: number; isMobile: boolean }>(() => {
    if (typeof window !== "undefined") {
      const w = window.visualViewport?.width || window.innerWidth || 390;
      const h = window.visualViewport?.height || window.innerHeight || 844;
      const isMobile = w < 640;
      const centerY = Math.max(h / 2 - 28, 50);
      const unscaledW = isMobile ? 194 : 210;
      const targetMaxWidth = Math.min(w * 0.76, 480);
      const scaleByW = targetMaxWidth / unscaledW;
      const targetMaxHeight = h * 0.26;
      const scaleByH = targetMaxHeight / 46;
      const computedScale = Math.min(scaleByW, scaleByH, 2.3);
      const scale = Math.max(1.15, Math.round(computedScale * 100) / 100);
      return { centerY, scale, isMobile };
    }
    return { centerY: 280, scale: 2.3, isMobile: false };
  });

  useEffect(() => {
    // Eagerly preload sample notation sheets and audio recordings into memory
    preloadSampleAssets();

    const updateMetrics = () => {
      setIntroMetrics(getIntroMetrics());
    };
    window.addEventListener("resize", updateMetrics);
    window.addEventListener("orientationchange", updateMetrics);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateMetrics);
    }

    // 1. Remain centered for 900ms to register brand with the practicing user
    const tCenter = setTimeout(() => {
      setIntroPhase('moving');
    }, 900);

    // 2. Allow another 900ms for extra smooth transition of the logo upward to its spot in the header
    const tMove = setTimeout(() => {
      setIntroPhase('done');
    }, 1800);

    return () => {
      window.removeEventListener("resize", updateMetrics);
      window.removeEventListener("orientationchange", updateMetrics);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateMetrics);
      }
      clearTimeout(tCenter);
      clearTimeout(tMove);
    };
  }, [getIntroMetrics]);

  // Parse markdown bold text
  const formatBoldText = (text: string) => {
    const regex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: text.substring(lastIndex, match.index), isBold: false });
      }
      parts.push({ text: match[1], isBold: true });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.substring(lastIndex), isBold: false });
    }

    if (parts.length === 0) {
      return <span>{text}</span>;
    }

    return (
      <span>
        {parts.map((p, i) =>
          p.isBold ? (
            <strong key={i} className="font-bold text-[#141414]">
              {p.text}
            </strong>
          ) : (
            p.text
          )
        )}
      </span>
    );
  };

  // Helper to bold important musical and evaluative keywords specifically on the performance rating card
  const formatRatingRationale = (text: string) => {
    if (!text) return null;

    // Pattern for important performance evaluation keywords, musical terms, and measure markers
    const keywordPattern = /\b(steady (?:pulse|tempo|meter|rhythm)|tempo consistency|rhythmic (?:accuracy|precision|deviations?|flow|hesitation)|pitch (?:accuracy|deviations?|errors?)|clean (?:articulation|execution|delivery)|strong (?:execution|delivery|rhythm|foundation)|solid foundation|excellent flow|fluency|fluent|tempo|rhythm|pulse|subdivisions?|hesitations?|hesitated|hesitant|pauses?|paused|rushing|rushed|dragging|dragged|stumbling|stumbled|articulation|legato|staccato|phrasing|dynamics|accidentals?|flats?|sharps?|naturals?|wrong notes?|missed notes?|correct notes?|octaves?|intervals?|syncopations?|syncopated|cadences?|half cadence|authentic cadence|measures? \d+(?:[–\-]\d+)?|mm?\.\s*\d+(?:[–\-]\d+)?|bars? \d+(?:[–\-]\d+)?)\b/gi;

    // First handle any existing markdown bold **...**
    const boldSegments = text.split(/(\*\*.*?\*\*)/g);

    return (
      <span>
        {boldSegments.map((segment, segIdx) => {
          if (segment.startsWith("**") && segment.endsWith("**")) {
            const inner = segment.slice(2, -2);
            return (
              <strong key={segIdx} className="font-bold text-[#141414]">
                {inner}
              </strong>
            );
          }

          // In standard text, highlight keyword matches
          const parts: { text: string; isKeyword: boolean }[] = [];
          let lastIndex = 0;
          let match: RegExpExecArray | null;
          keywordPattern.lastIndex = 0;

          while ((match = keywordPattern.exec(segment)) !== null) {
            if (match.index > lastIndex) {
              parts.push({ text: segment.substring(lastIndex, match.index), isKeyword: false });
            }
            parts.push({ text: match[0], isKeyword: true });
            lastIndex = keywordPattern.lastIndex;
          }

          if (lastIndex < segment.length) {
            parts.push({ text: segment.substring(lastIndex), isKeyword: false });
          }

          if (parts.length === 0) {
            return <span key={segIdx}>{segment}</span>;
          }

          return (
            <span key={segIdx}>
              {parts.map((p, pIdx) =>
                p.isKeyword ? (
                  <strong key={pIdx} className="font-bold text-[#141414]">
                    {p.text}
                  </strong>
                ) : (
                  p.text
                )
              )}
            </span>
          );
        })}
      </span>
    );
  };

  // Structured breakdown of the diagnostic output
  const parseAnalysisResult = (rawText: string) => {
    const sections = {
      blueprint: [] as string[],
      chords: [] as string[],
      trapDoors: [] as string[],
      strategy: [] as string[],
      performance: [] as string[],
      unclassified: [] as string[],
    };

    if (!rawText) return sections;

    const rawLines = rawText.split("\n");
    let currentCategory: "blueprint" | "chords" | "trapDoors" | "strategy" | "performance" | "unclassified" = "unclassified";

    for (let i = 0; i < rawLines.length; i++) {
      const rawLine = rawLines[i];
      const trimmed = rawLine.trim();
      if (!trimmed) continue;
      
      const lowerLine = trimmed.toLowerCase();
      if (lowerLine.includes("musical blueprint") || lowerLine.startsWith("# the musical blueprint")) {
        currentCategory = "blueprint";
        continue;
      } else if (lowerLine.includes("chord progression") || lowerLine.includes("chord progressions") || lowerLine.startsWith("# main chord progressions") || lowerLine.includes("main chord progression")) {
        currentCategory = "chords";
        continue;
      } else if (lowerLine.includes("technical trap doors") || lowerLine.includes("technical trap door") || lowerLine.startsWith("# technical trap doors")) {
        currentCategory = "trapDoors";
        continue;
      } else if (lowerLine.includes("practice strategy") || lowerLine.includes("practice strategies") || lowerLine.startsWith("# practice strategy")) {
        currentCategory = "strategy";
        continue;
      } else if (lowerLine.includes("auditory performance feedback") || lowerLine.startsWith("# auditory performance feedback")) {
        currentCategory = "performance";
        continue;
      }

      // Add actual bullet content or clean text lines
      const cleanLine = trimmed.replace(/^[\*\-\s\•\+\◦\▪]+/, "").trim();
      if (!cleanLine) continue;

      if (currentCategory === "unclassified") {
        sections.unclassified.push(trimmed);
        continue;
      }

      const targetList = sections[currentCategory];

      const isIndentedSubBullet = /^\s{2,}|\t/.test(rawLine);
      const isMajorCategoryHeader = /^(\*\*[^*]+\*\*|phase \d+|key signature|time signature|primary chord|harmonic function|expert rating|fluency|tempo|key & accidental|accuracy|rhythmic|actionable)/i.test(cleanLine);

      if (targetList.length > 0) {
        const lastIdx = targetList.length - 1;
        const prevItem = targetList[lastIdx].trim();
        const prevEndsWithColon = prevItem.endsWith(":") || prevItem.endsWith(":\*\*") || prevItem.endsWith(":**");
        const isMeasureOrHarmonicSubItem = /^(m\.|mm\.|measure|bar|\d+[\.\-\–\—])/i.test(cleanLine);

        if (
          isIndentedSubBullet ||
          prevEndsWithColon ||
          (currentCategory === "chords" && !isMajorCategoryHeader) ||
          (!isMajorCategoryHeader && isMeasureOrHarmonicSubItem)
        ) {
          if (prevEndsWithColon) {
            targetList[lastIdx] = `${targetList[lastIdx]} ${cleanLine}`;
          } else {
            const separator = isMeasureOrHarmonicSubItem ? ", " : " ";
            targetList[lastIdx] = `${targetList[lastIdx]}${separator}${cleanLine}`;
          }
          continue;
        }
      }

      targetList.push(cleanLine);
    }

    // Secondary pass on chords: guarantee that Primary Chord Sequence and Harmonic Function & Cadences are each unified into single seamless bullets
    if (sections.chords.length > 0) {
      const mergedChords: string[] = [];
      let currentHeading = "";
      let currentContent = "";

      for (const item of sections.chords) {
        const lower = item.toLowerCase();
        const isPrimary = lower.startsWith("**primary chord") || lower.startsWith("primary chord");
        const isHarmonic = lower.startsWith("**harmonic function") || lower.startsWith("harmonic function");

        if (isPrimary || isHarmonic) {
          if (currentHeading) {
            mergedChords.push(`${currentHeading}: ${currentContent}`.trim());
          }
          const colonIdx = item.indexOf(":");
          if (colonIdx !== -1) {
            currentHeading = item.substring(0, colonIdx).trim();
            currentContent = item.substring(colonIdx + 1).trim();
          } else {
            currentHeading = item.trim();
            currentContent = "";
          }
        } else if (currentHeading) {
          if (currentContent) {
            const isMeasure = /^(m\.|mm\.|measure|bar)/i.test(item);
            currentContent = isMeasure ? `${currentContent}, ${item}` : `${currentContent} ${item}`;
          } else {
            currentContent = item;
          }
        } else {
          mergedChords.push(item);
        }
      }

      if (currentHeading) {
        mergedChords.push(currentContent ? `${currentHeading}: ${currentContent}`.trim() : currentHeading);
      }

      if (mergedChords.length > 0) {
        sections.chords = mergedChords;
      }
    }

    return sections;
  };

  const currentAnalysis = parseAnalysisResult(analysisResult || "");

  // Handle preset selection
  const handleSelectPreset = (preset: ScorePreset) => {
    setSelectedPreset(preset);
    setCustomImageUri(null);
    setCustomImageMime(null);
    setCustomFileName(null);
    setAnalysisResult(null);
    setError(null);
  };

  // Handle sample selection (Score image + synchronized performance audio)
  const handleSelectSample = (sample: SamplePiece) => {
    audioSystem.playClick();
    setIsLoadingSample(true);
    setError(null);
    setAnalysisResult(null);

    // Reset presets and stage sample score
    setSelectedPreset(null);
    setCustomImageUri(sample.imageUrl);
    setCustomImageMime(sample.imageMimeType);
    setCustomFileName(sample.imageFileName);

    // Stop and stage sample audio recording
    if (playbackRef.current) {
      playbackRef.current.pause();
      playbackRef.current = null;
      setIsPlayingAudio(false);
    }
    setAudioUri(sample.audioUrl);
    setAudioMime(sample.audioMimeType);
    setAudioFileName(sample.audioFileName);

    // Set matching difficulty level
    if (sample.difficulty) {
      setDifficulty(sample.difficulty.toLowerCase() as any);
    }

    setSampleModalOpen(false);
    setIsLoadingSample(false);
  };

  // Convert SVG string to Base64 with appropriate header
  const getSvgBase64 = (svgString: string) => {
    const cleanSvg = svgString.replace(/class="[^"]*"/, ""); // strip browser classes
    const base64 = btoa(unescape(encodeURIComponent(cleanSvg)));
    return {
      base64: `data:image/svg+xml;base64,${base64}`,
      mimeType: "image/svg+xml"
    };
  };

  // Convert file to Base64 with compression/downscaling for larger images
  const processUploadedFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, or SVG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const base64Str = reader.result;

        // If it's SVG, do not compress, keep original
        if (file.type === "image/svg+xml") {
          setCustomImageUri(base64Str);
          setCustomImageMime(file.type);
          setCustomFileName(file.name);
          setSelectedPreset(null);
          setAnalysisResult(null);
          setError(null);
          setMobileStageTab("audio");
          return;
        }

        // Downscale image to save memory and storage space
        const img = new Image();
        img.onload = () => {
          const maxDim = 1000;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Save as jpeg to optimize size
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
            setCustomImageUri(compressedDataUrl);
            setCustomImageMime("image/jpeg");
          } else {
            setCustomImageUri(base64Str);
            setCustomImageMime(file.type);
          }
          setCustomFileName(file.name);
          setSelectedPreset(null);
          setAnalysisResult(null);
          setError(null);
          setMobileStageTab("audio");
        };
        img.onerror = () => {
          setCustomImageUri(base64Str);
          setCustomImageMime(file.type);
          setCustomFileName(file.name);
          setSelectedPreset(null);
          setAnalysisResult(null);
          setError(null);
          setMobileStageTab("audio");
        };
        img.src = base64Str;
      }
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  // Convert audio file to Base64
  const processUploadedAudioFile = (file: File) => {
    if (!file.type.startsWith("audio/")) {
      setError("Please upload an audio file (MP3, WAV, or M4A).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAudioUri(reader.result);
        setAudioMime(file.type);
        setAudioFileName(file.name);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError("Failed to read audio file.");
    };
    reader.readAsDataURL(file);
  };

  // File drag & drop handlers for sheet music
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  // File drag & drop handlers for Audio Practice
  const handleAudioDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAudio(true);
  };

  const handleAudioDragLeave = () => {
    setIsDraggingAudio(false);
  };

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAudio(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processUploadedAudioFile(files[0]);
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedAudioFile(files[0]);
    }
  };

  // Recording timer effect
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRecording]);

  // Scroll to top when changing pages
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as any });
    // Also scroll any scrollable containers (like setup-page with overflow-y-auto class)
    const scrollableElements = document.querySelectorAll(".overflow-y-auto");
    scrollableElements.forEach((el) => {
      el.scrollTo({ top: 0, behavior: "instant" as any });
    });
  }, [page]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Start microphone capture recording
  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const options = { mimeType: "audio/webm" };
      
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setAudioUri(reader.result);
            setAudioMime(recorder.mimeType || "audio/webm");
            setAudioFileName(`live_practice_${Date.now().toString().slice(-6)}.wav`);
          }
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop audio streams tracks cleanly
        stream.getTracks().forEach((track) => track.stop());
        setRecordingStream(null);
      };

      mediaRecorderRef.current = recorder;
      setRecordingStream(stream);
      recorder.start(250);
      setIsRecording(true);
    } catch (e: any) {
      console.error("Microphone access failed", e);
      setRecordingStream(null);
      setError("Microphone permission was not detected. Please upload an audio practice .mp3 or .wav via drag and drop under step 2 instead.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlayAudio = () => {
    if (!audioUri) return;
    if (isPlayingAudio) {
      playbackRef.current?.pause();
      setIsPlayingAudio(false);
    } else {
      if (playbackRef.current) {
        playbackRef.current.pause();
      }
      const aud = new Audio(audioUri);
      aud.onended = () => setIsPlayingAudio(false);
      playbackRef.current = aud;
      playbackRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleClearAudio = () => {
    if (playbackRef.current) {
      playbackRef.current.pause();
      playbackRef.current = null;
    }
    setAudioUri(null);
    setAudioMime(null);
    setAudioFileName(null);
    setIsPlayingAudio(false);
  };

  // Handle recording again from performance evaluation
  const handleRecordAgain = () => {
    audioSystem.playClick();
    if (playbackRef.current) {
      playbackRef.current.pause();
      playbackRef.current = null;
    }
    setAudioUri(null);
    setAudioMime(null);
    setAudioFileName(null);
    setRecordingTime(0);
    setIsPlayingAudio(false);
    setMobileStageTab("audio");
    setPage("setup");
  };

  const handleConfettiComplete = useCallback(() => {
    setShowConfetti(false);
  }, []);

  // Trigger professional analysis via Server API
  const handleAnalyzeScore = async () => {
    const hadAudio = Boolean(audioUri);
    setLastAnalyzedWithAudio(hadAudio);
    setIsAnalyzing(true);
    setShowConfetti(false);
    setError(null);
    setAnalysisResult(null);
    setCurrentModel(null);
    setFallbackUsed(false);
    setPage("report");

    try {
      let payloadImage = "";
      let payloadMime = "";

      if (customImageUri && customImageMime) {
        payloadImage = customImageUri;
        payloadMime = customImageMime;
      } else if (selectedPreset) {
        const svgUri = getSvgBase64(selectedPreset.svgContent);
        payloadImage = svgUri.base64;
        payloadMime = svgUri.mimeType;
      } else {
        throw new Error("Please upload a sheet music image before proceeding with the evaluation.");
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: payloadImage,
          mimeType: payloadMime,
          audio: audioUri,
          audioMimeType: audioMime,
          difficulty: difficulty,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error status: ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.analysis || "";
      const modelUsedVal = data.modelUsed || "gemini-3.5-flash";
      const fallbackUsedVal = !!data.fallbackUsed;

      setAnalysisResult(analysisText);
      setCurrentModel(modelUsedVal);
      setFallbackUsed(fallbackUsedVal);

      // Trigger interactive screen confetti and save to practice history ONLY if audio performance was included
      if (hadAudio && analysisText && !analysisText.toLowerCase().includes("unable to analyze")) {
        let isGood = true; // default true for successful score
        let scoreVal = 0;
        const parsed = parseAnalysisResult(analysisText);
        const ratingBullet = parsed.performance.find(bullet => 
          bullet.toLowerCase().startsWith("expert rating:") || 
          bullet.toLowerCase().startsWith("**expert rating**:") ||
          bullet.toLowerCase().includes("expert rating")
        );
        if (ratingBullet) {
          const scoreMatch = ratingBullet.match(/(\d+)\s*\/\s*100/);
          if (scoreMatch) {
            scoreVal = parseInt(scoreMatch[1], 10);
            isGood = scoreVal >= 75;
          }
        }
        if (isGood) {
          setShowConfetti(true);
        }

        // Save to practice history
        const newSession: PracticeSession = {
          id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toISOString(),
          sheetName: selectedPreset ? selectedPreset.title : (customFileName || "Custom Uploaded Sheet"),
          difficulty: difficulty,
          score: scoreVal || 0,
          rawResult: analysisText,
          presetId: selectedPreset ? selectedPreset.id : undefined,
          customImageUri: selectedPreset ? undefined : (customImageUri || undefined),
          customImageMime: selectedPreset ? undefined : (customImageMime || undefined),
          modelUsed: modelUsedVal,
          fallbackUsed: fallbackUsedVal,
        };

        setHistory(prev => {
          const updated = [newSession, ...prev];
          try {
            localStorage.setItem("temposight_practice_history", JSON.stringify(updated));
          } catch (e) {
            console.error("Failed to save history to localStorage:", e);
          }
          return updated;
        });
      }
    } catch (err: any) {
      setError(err.message || "Connection failure with the sheet music engine.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export diagnostic results as clean, formatted PDF file using jsPDF
  const handleExportPDF = () => {
    if (!analysisResult) return;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 16;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin) {
          doc.addPage();
          y = margin + 8;
          // Running header on sub-pages
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text("TempoSight AI Diagnostic Report", margin, margin - 3);
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.2);
          doc.line(margin, margin - 1, pageWidth - margin, margin - 1);
        }
      };

      // Header Banner
      doc.setFillColor(20, 20, 20);
      doc.rect(margin, y, contentWidth, 22, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text("TempoSight AI Diagnostic Report", margin + 6, y + 9);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(200, 200, 200);
      const sheetTitle = selectedPreset ? selectedPreset.title : (customFileName || "Custom Sheet Music");
      const dateStr = new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.text(`${sheetTitle}  •  ${dateStr}`, margin + 6, y + 16);

      y += 28;

      // Extract Performance Rating if available
      let ratingScore: string | null = null;
      let ratingTier: string | null = null;

      if (currentAnalysis.performance.length > 0) {
        const ratingBullet = currentAnalysis.performance.find((bullet) =>
          bullet.toLowerCase().includes("expert rating")
        );
        if (ratingBullet) {
          const scoreMatch = ratingBullet.match(/(\d+)\s*\/\s*100/);
          if (scoreMatch) ratingScore = scoreMatch[1];
          const tierMatch = ratingBullet.match(/\(([^)]+)\)/);
          if (tierMatch) ratingTier = tierMatch[1];
        }
      }

      if (ratingScore) {
        checkPageBreak(22);
        doc.setFillColor(242, 240, 235);
        doc.setDrawColor(20, 20, 20);
        doc.setLineWidth(0.3);
        doc.rect(margin, y, contentWidth, 16, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(20, 20, 20);
        doc.text("EXPERT PERFORMANCE SCORE:", margin + 5, y + 6.5);

        doc.setFontSize(12);
        doc.text(`${ratingScore} / 100`, margin + 65, y + 7);

        if (ratingTier) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(70, 70, 70);
          doc.text(`Level: ${ratingTier}`, margin + 95, y + 7);
        }

        y += 22;
      }

      // Helper function to render a section
      const renderSection = (title: string, bullets: string[]) => {
        if (!bullets || bullets.length === 0) return;

        checkPageBreak(18);

        // Section Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        doc.text(title.toUpperCase(), margin, y);
        y += 2;

        doc.setDrawColor(20, 20, 20);
        doc.setLineWidth(0.4);
        doc.line(margin, y, margin + contentWidth, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(30, 30, 30);

        bullets.forEach((bullet) => {
          const cleanBullet = bullet.replace(/\*\*/g, "").trim();
          const lines = doc.splitTextToSize(`• ${cleanBullet}`, contentWidth - 4);
          const blockHeight = lines.length * 4.2 + 2;

          checkPageBreak(blockHeight);

          doc.text(lines, margin + 2, y);
          y += blockHeight;
        });

        y += 4;
      };

      renderSection("Auditory Performance Feedback", currentAnalysis.performance);
      renderSection("The Musical Blueprint", currentAnalysis.blueprint);
      renderSection("Main Chord Progressions", currentAnalysis.chords);
      renderSection("Technical Trap Doors", currentAnalysis.trapDoors);
      renderSection("Practice Strategy", currentAnalysis.strategy);

      if (currentAnalysis.unclassified && currentAnalysis.unclassified.length > 0) {
        renderSection("Extended Diagnostic Logs", currentAnalysis.unclassified);
      }

      // Footer
      checkPageBreak(10);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text("Generated by TempoSight AI Optical Score & Auditory Diagnostic Engine", margin, pageHeight - 8);

      const safeFileName = (selectedPreset ? selectedPreset.title : (customFileName || "TempoSight_Report"))
        .replace(/[^a-zA-Z0-9_\-]/g, "_");
      doc.save(`${safeFileName}_Diagnostic_Report.pdf`);

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("PDF Export failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#c9c8c4] flex flex-col relative overflow-x-clip">
      <DotPatternBackground />
      <ConfettiCanvas active={showConfetti} onComplete={handleConfettiComplete} />

      {/* Drawer Sidebar: Practice History */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] cursor-pointer"
            />

            {/* Sidebar Content Panel - Floating Bouncy Liquid Glass Design originating from history button */}
            <motion.div
              initial={{ scale: 0.05, opacity: 0, x: -20, y: -10, rotate: -3 }}
              animate={{ scale: 1, opacity: 1, x: 0, y: 0, rotate: 0 }}
              exit={{ scale: 0.05, opacity: 0, x: -20, y: -10, rotate: -3 }}
              transition={{ 
                type: "spring", 
                stiffness: 350, 
                damping: 22, 
                mass: 0.75
              }}
              style={{ originX: 0.08, originY: 0.02 }}
              className="fixed top-4 bottom-4 left-4 w-[calc(100%-2rem)] sm:w-85 bg-white/40 sm:bg-white/45 backdrop-blur-3xl border border-white/70 z-[65] flex flex-col shadow-[0_32px_64px_-16px_rgba(0,0,0,0.25)] rounded-3xl overflow-hidden"
            >
              {/* Sidebar Header */}
              <div className="h-14 border-b border-[#141414]/10 flex items-center justify-between px-6 bg-white/10">
                <div className="flex items-center space-x-2">
                  <History className="w-4 h-4 text-[#141414]" />
                  <span className="font-serif font-bold text-[15px] uppercase tracking-wider text-[#141414]">Practice History</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 hover:bg-[#141414]/10 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4 text-[#141414]" />
                </button>
              </div>

              {/* Sidebar Body (Scrollable List) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 opacity-50">
                    <BookOpen className="w-8 h-8 text-[#141414]/60" />
                    <p className="font-serif text-[21px] font-bold tracking-tight text-[#141414]">No sessions recorded yet.</p>
                    <p className="text-[12px] font-mono leading-relaxed max-w-[200px]">
                      Select a sheet music preset or upload one, then run evaluation to record.
                    </p>
                  </div>
                ) : (
                  history.map((session) => {
                    const dateObj = new Date(session.timestamp);
                    const formattedDate = dateObj.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    // Color code rating score
                    let scoreBg = "bg-neutral-100 text-neutral-800 border-neutral-300";
                    if (session.score >= 85) {
                      scoreBg = "bg-green-100/90 text-green-900 border-green-500/30";
                    } else if (session.score >= 65) {
                      scoreBg = "bg-blue-100/90 text-blue-900 border-blue-500/30";
                    } else if (session.score > 0) {
                      scoreBg = "bg-amber-100/90 text-amber-900 border-amber-500/30";
                    }

                    // Difficulty badges
                    let diffBg = "bg-green-50 text-green-700 border-green-200";
                    if (session.difficulty === "intermediate") {
                      diffBg = "bg-indigo-50 text-indigo-700 border-indigo-200";
                    } else if (session.difficulty === "advanced") {
                      diffBg = "bg-rose-50 text-rose-700 border-rose-200";
                    }

                    return (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session)}
                        className="group border border-white/30 hover:border-[#141414]/10 bg-white/45 hover:bg-white/60 hover:shadow-md p-3.5 rounded-2xl cursor-pointer transition-all duration-300 relative flex flex-col justify-between gap-2"
                      >
                        {/* Session Top Bar: Date & Trash */}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono opacity-60 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {formattedDate}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({
                                isOpen: true,
                                type: "single",
                                sessionId: session.id,
                                sessionTitle: session.sheetName,
                              });
                            }}
                            className="text-red-700 hover:text-red-900 p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 cursor-pointer"
                            title="Delete this session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Sheet name / Title */}
                        <div className="font-serif font-bold text-[14px] truncate pr-4 text-[#141414]">
                          {session.sheetName}
                        </div>

                        {/* Badges & Scores footer */}
                        <div className="flex items-center justify-between pt-1">
                          {/* Difficulty badge */}
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${diffBg}`}>
                            {session.difficulty}
                          </span>
                          
                          {/* Score badge */}
                          <span className={`text-[11px] font-mono font-black px-2 py-0.5 border rounded-full ${scoreBg}`}>
                            {session.score > 0 ? `${session.score}/100` : "PENDING"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-[#141414]/10 bg-[#DCDAD7]/10 flex items-center justify-between text-[9px] font-mono text-[#141414]/65">
                <span className="text-[12px] text-left">TOTAL: {history.length} SESSIONS</span>
                {history.length > 0 && (
                  <button
                    onClick={() => {
                      setDeleteConfirm({
                        isOpen: true,
                        type: "all",
                      });
                    }}
                    className="text-red-700 hover:underline font-bold cursor-pointer uppercase text-[9px]"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete History Liquid Glass Apple-like Confirmation Menu */}
      <AnimatePresence>
        {deleteConfirm?.isOpen && (
          <>
            {/* Dark Frosted Glass Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="fixed inset-0 bg-black/35 backdrop-blur-md z-[70] cursor-pointer"
            />

            {/* Centered Liquid Glass Apple-like Pop-up Dialog */}
            <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 40, rotateX: 20 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  y: 0,
                  rotateX: 0,
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 12,
                    mass: 0.7,
                  },
                }}
                exit={{
                  scale: 0.85,
                  opacity: 0,
                  y: 15,
                  rotateX: -5,
                  transition: {
                    duration: 0.15,
                    ease: "easeIn",
                  },
                }}
                className="pointer-events-auto w-full max-w-sm bg-white/40 sm:bg-white/45 backdrop-blur-3xl border border-white/70 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.9)] rounded-3xl p-6 sm:p-7 flex flex-col items-center text-center space-y-5 relative overflow-hidden"
              >
                {/* Top Liquid Specular Light Highlight Line */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

                {/* Soft ambient inner radial glow */}
                <div className="absolute -top-16 -left-16 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Bouncy Liquid Glass Trash Icon Badge */}
                <motion.div
                  initial={{ scale: 0.3, rotate: -25 }}
                  animate={{ scale: [0.3, 1.35, 0.88, 1.1, 1], rotate: [-25, 12, -6, 3, 0] }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
                  className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/25 backdrop-blur-md flex items-center justify-center text-rose-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)]"
                >
                  <Trash2 className="w-7 h-7 stroke-[2.2] animate-bounce" style={{ animationDuration: '1.2s' }} />
                </motion.div>

                {/* Main Dialog Text */}
                <div className="space-y-1.5">
                  <h3 className="font-serif font-bold text-2xl sm:text-3xl text-[#141414] tracking-tight">
                    Hold Up!
                  </h3>
                  <p className="font-sans text-sm sm:text-[15px] text-[#141414]/85 leading-relaxed font-medium">
                    Are you sure to delete history?
                  </p>
                  {deleteConfirm.type === "single" && deleteConfirm.sessionTitle && (
                    <p className="text-xs font-mono text-[#141414]/60 truncate max-w-[240px] mx-auto pt-1">
                      "{deleteConfirm.sessionTitle}"
                    </p>
                  )}
                </div>

                {/* Liquid Glass Interactive Action Buttons */}
                <div className="flex items-center gap-3 w-full pt-1">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-[#141414]/15 bg-white/50 hover:bg-white/80 active:bg-white/95 text-[#141414] font-medium font-sans text-sm transition-all shadow-xs cursor-pointer active:scale-[0.97]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (deleteConfirm.type === "single" && deleteConfirm.sessionId) {
                        setHistory((prev) => {
                          const updated = prev.filter((s) => s.id !== deleteConfirm.sessionId);
                          try {
                            localStorage.setItem("temposight_practice_history", JSON.stringify(updated));
                          } catch (err) {
                            console.error("Failed to save history to localStorage:", err);
                          }
                          return updated;
                        });
                      } else if (deleteConfirm.type === "all") {
                        setHistory([]);
                        localStorage.removeItem("temposight_practice_history");
                      }
                      setDeleteConfirm(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-rose-600/30 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold font-sans text-sm shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.97]"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
      
      {/* Centered screen brand introduction overlay */}
      <AnimatePresence>
        {introPhase !== 'done' && (
          <motion.div 
            key="intro-backdrop"
            initial={{ opacity: 1 }}
            animate={{ opacity: introPhase === 'centered' ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-[#E4E3E0] z-40 flex flex-col items-center justify-center pointer-events-none select-none"
          />
        )}
      </AnimatePresence>

      {/* Sticky Combined Top Header & Navigation Bar */}
      <div className={`sticky top-0 z-50 w-full pt-1.5 transition-all duration-700 ease-in-out ${
        introPhase === 'centered' ? "pointer-events-none pb-0" : "pb-3.5"
      }`}>
        {/* Absolute dynamic gradient overlay supporting smooth background blur fading out downward */}
        {introPhase !== 'centered' && (
          <div 
            className="absolute inset-0 -z-10 bg-gradient-to-b from-[#DCDAD7]/40 via-[#DCDAD7]/15 to-transparent backdrop-blur-2xl pointer-events-none"
            style={{
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
            }}
          />
        )}

        {/* High Density Utility Header */}
        <header className="h-11 flex items-center justify-between px-6 relative w-full">
          {/* Left Side: Toggle Sidebar Button */}
          <div className="flex items-center justify-start w-28 shrink-0 z-20">
            {introPhase === 'done' && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 flex items-center justify-center space-x-0 sm:space-x-1.5 cursor-pointer liquid-glass-pill hover:bg-white/80 text-[#141414] font-mono text-[9px] uppercase font-bold tracking-widest rounded-full transition-all shadow-xs shrink-0"
                title="Practice History"
              >
                <History className="w-3.5 h-3.5 text-[#141414]/80 shrink-0" />
                <span className="hidden sm:inline">HISTORY</span>
              </button>
            )}
          </div>

          {/* Centered Title with Springy Intro Rise Animation & Frameless Final State */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto shrink-0 z-50">
            <motion.button 
              type="button"
              onClick={() => {
                if (introPhase === 'done') {
                  audioSystem.playClick();
                  setPage("setup");
                }
              }}
              initial={{ 
                y: introMetrics.centerY, 
                scale: introMetrics.scale,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                borderColor: "rgba(255, 255, 255, 0.9)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.18), 0 0 16px rgba(255, 255, 255, 0.8)",
                paddingLeft: introMetrics.isMobile ? "16px" : "20px",
                paddingRight: introMetrics.isMobile ? "16px" : "20px",
                paddingTop: introMetrics.isMobile ? "10px" : "12px",
                paddingBottom: introMetrics.isMobile ? "10px" : "12px",
                borderRadius: "22px"
              }}
              animate={
                introPhase === 'centered'
                  ? { 
                      y: introMetrics.centerY, 
                      scale: introMetrics.scale,
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      borderColor: "rgba(255, 255, 255, 0.9)",
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.18), 0 0 16px rgba(255, 255, 255, 0.8)",
                      paddingLeft: introMetrics.isMobile ? "16px" : "20px",
                      paddingRight: introMetrics.isMobile ? "16px" : "20px",
                      paddingTop: introMetrics.isMobile ? "10px" : "12px",
                      paddingBottom: introMetrics.isMobile ? "10px" : "12px",
                      borderRadius: "22px"
                    }
                  : { 
                      y: 0, 
                      scale: 1,
                      backgroundColor: "rgba(255, 255, 255, 0)",
                      borderColor: "rgba(255, 255, 255, 0)",
                      boxShadow: "0 0 0 0 rgba(0, 0, 0, 0)",
                      paddingLeft: "4px",
                      paddingRight: "4px",
                      paddingTop: "2px",
                      paddingBottom: "2px",
                      borderRadius: "12px"
                    }
              }
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 17,
                mass: 0.8,
              }}
              className="flex items-center space-x-2.5 cursor-pointer border backdrop-blur-md active:scale-[0.98] focus:outline-none select-none"
              title="Go to Homepage"
            >
              <span className="p-1.5 text-white liquid-glass-btn-dark rounded-xl shadow-xs shrink-0">
                <Music className="w-4 h-4" />
              </span>
              <span className="font-semibold tracking-tighter text-[16px] sm:text-[20px] text-center uppercase font-serif whitespace-nowrap text-[#141414]">
                TempoSight
              </span>
            </motion.button>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center justify-end w-28 shrink-0 z-20">
            {/* Ambient music controls in the top bar with Apple Liquid Glass styling */}
            {introPhase === 'done' && (
              <div className="flex items-center">
                <button
                  onClick={toggleAmbientMusic}
                  className={`w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 flex items-center justify-center space-x-0 sm:space-x-1.5 cursor-pointer transition-all leading-none rounded-full text-[9px] font-mono uppercase font-bold tracking-widest border shrink-0 ${
                    ambientMusicEnabled 
                      ? "liquid-glass-pill bg-emerald-500/15 text-emerald-950 border-emerald-400/80 shadow-xs" 
                      : "liquid-glass-pill bg-amber-500/15 text-amber-950 border-amber-400/80 shadow-xs"
                  }`}
                  title="Toggle Calm Piano Ambient Music"
                >
                  {ambientMusicEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-700 animate-pulse shrink-0" />
                      <span className="hidden sm:inline">AMBIENT</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="hidden sm:inline">MUTED</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Tabs / Navigation Bar - Steps feedback indicator */}
        {introPhase === 'done' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 mt-1 shrink-0 flex justify-center w-full"
          >
            <div className="flex liquid-glass-pill p-1 rounded-2xl max-w-lg w-full">
              <button
                onClick={() => setPage("setup")}
                className={`flex-grow py-2 text-center font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 rounded-xl ${
                  page === "setup" 
                    ? "liquid-glass-btn-dark text-white shadow-md" 
                    : "bg-transparent text-[#141414]/70 hover:text-[#141414] hover:bg-white/40"
                }`}
              >
                <span className="text-[14px]">UPLOAD & PLAY SHEET</span>
              </button>
              <button
                onClick={() => {
                  if (analysisResult || isAnalyzing) {
                    setPage("report");
                  }
                }}
                disabled={!analysisResult && !isAnalyzing}
                className={`flex-grow py-2 text-center font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 rounded-xl ${
                  page === "report" 
                    ? "liquid-glass-btn-dark text-white shadow-md" 
                    : "bg-transparent text-[#141414]/70 hover:text-[#141414] hover:bg-white/40"
                } ${(!analysisResult && !isAnalyzing) ? "opacity-35 cursor-not-allowed" : ""}`}
              >
                <span className="text-[14px]">Performance Evaluation</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {introPhase === 'done' && (
        <motion.div
          initial={{ opacity: 0, y: 45 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.15 }}
          className="flex-1 flex flex-col w-full"
        >
          <AnimatePresence mode="wait">
        {page === "setup" ? (
          <motion.main
            key="setup-page"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-6 sm:p-10 gap-8 min-h-[calc(100vh-7.5rem)] overflow-y-auto"
          >
            {/* Context Pitch Card */}
            <div className="liquid-glass-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-3xl">
              <div>
                <h1 className="font-serif text-[21px] font-bold tracking-tight text-[#141414]">
                  Upload & Play Sheet
                </h1>
                <p className="text-[14px] text-[#141414]/70 font-sans mt-0.5">
                  Upload your own sheet music, then capture yourself playing it with live audio.
                </p>
              </div>
            </div>

            {/* Performance Difficulty Level Segment */}
            <div className="liquid-glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-serif text-[21px] font-bold tracking-tight text-[#141414]">
                    Set Your Difficulty Level
                  </span>
                </div>
                <p className="text-[14px] text-[#141414]/70 font-sans">
                  The AI evaluator adjusts standard technical parameters, rhythm flexibility, and feedback detail matching your practice background.
                </p>
              </div>
              <div className="relative min-w-[220px]">
                <select
                  value={difficulty}
                  aria-label="Select performance difficulty level"
                  onChange={(e) => setDifficulty(e.target.value as "beginner" | "intermediate" | "advanced")}
                  className="w-full liquid-glass-pill text-[#141414] font-mono text-[14px] uppercase tracking-wider font-bold py-2.5 pl-4 pr-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#141414]/30 cursor-pointer appearance-none"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#141414]">
                  <ChevronRight className="w-4 h-4 transform rotate-90" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* COMPONENT A: Sheet Music Selection & Previews */}
              <div className={`space-y-4 liquid-glass-card p-6 flex flex-col h-full rounded-3xl ${mobileStageTab === 'notation' ? 'block' : 'hidden md:block'}`}>
                <div className="flex items-center justify-between border-b border-[#141414]/15 pb-2">
                  <h2 className="font-serif text-[21px] font-bold tracking-tight text-[#141414]">
                    1. Sheet Music Notation
                  </h2>
                  <span className="text-[0px] font-mono text-indigo-800 font-bold uppercase">
                    {customImageUri ? "Custom Upload" : "Awaiting Sheet"}
                  </span>
                </div>

                {/* Snap drop uploader box */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`liquid-glass-pill p-8 text-center cursor-pointer transition-all rounded-3xl border-dashed ${
                    isDragging 
                      ? "bg-white/60 ring-2 ring-[#141414]/20" 
                      : customImageUri 
                        ? "bg-white/50" 
                        : "hover:bg-white/60"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2 py-1">
                    <UploadCloud className="w-9 h-9 opacity-75 text-[#141414]" />
                    {customFileName ? (
                      <div className="space-y-1">
                        <p className="text-[17px] font-mono font-bold text-[#141414] line-clamp-1">{customFileName}</p>
                        <p className="text-[12px] font-mono opacity-60 uppercase">Click or drop to replace sheet file</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-[17px] font-bold text-[#141414]">Drag &amp; drop notation screenshot</p>
                        <p className="text-[12px] font-mono opacity-60 uppercase">PNG, JPG, or SVG snippet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Centered USE SAMPLE NOTATION & AUDIO Pill Button matching screenshot */}
                <div className="flex justify-center pt-1 pb-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      audioSystem.playClick();
                      setSampleModalOpen(true);
                    }}
                    className="px-6 py-2.5 bg-white/80 hover:bg-white text-[#141414] font-sans font-bold text-xs tracking-wider rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-white/90 uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    USE SAMPLE NOTATION &amp; AUDIO
                  </button>
                </div>

                {/* Rendered sheet preview with Pinch-to-Zoom & Slider controls */}
                <div className="pt-2 flex-grow flex flex-col">
                  <SheetMusicZoomViewer
                    selectedPreset={selectedPreset}
                    customImageUri={customImageUri}
                  />
                </div>

              </div>

              {/* COMPONENT B: Acoustic Practice Audio Capture */}
              <div className={`space-y-4 liquid-glass-card p-6 flex flex-col h-full rounded-3xl ${mobileStageTab === 'audio' ? 'block' : 'hidden md:block'}`}>
                <div className="flex items-center justify-between border-b border-[#141414]/15 pb-2">
                  <h2 className="font-serif text-[21px] font-bold tracking-tight text-[#141414]">
                    2. Audio Practice Recording
                  </h2>
                  <span className="text-[0px] font-mono text-green-800 font-bold uppercase">
                    {audioUri ? "Audio Loaded" : "Live Capture"}
                  </span>
                </div>

                <div className="p-5 liquid-glass-panel space-y-4 rounded-2xl flex-1 flex flex-col justify-center">
                  {!audioUri ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-4 w-full">
                      {isRecording ? (
                        <div className="flex flex-col items-center justify-center space-y-3.5 w-full">
                          <LiveWaveformVisualizer
                            stream={recordingStream}
                            isRecording={isRecording}
                            recordingTime={recordingTime}
                          />
                          <p className="text-[11px] font-mono text-[#141414]/70 text-center leading-tight px-2">
                            Play the selected score on your piano. Real-time acoustic capture is actively monitoring your performance.
                          </p>
                          <button
                            onClick={stopRecording}
                            className="w-full flex items-center justify-center space-x-2 py-3.5 bg-rose-700/95 hover:bg-rose-800 text-white font-mono text-xs font-bold uppercase cursor-pointer shadow-lg hover:shadow-xl transition-all rounded-2xl border border-white/30 active:scale-[0.98]"
                          >
                            <Square className="w-4 h-4 fill-current shrink-0" />
                            <span className="text-[13px] tracking-wider">Stop and Process Recording</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-3 w-full">
                          <button
                            onClick={startRecording}
                            className="w-full flex items-center justify-center space-x-2 py-3.5 liquid-glass-btn-dark text-white font-sans text-xs font-bold tracking-wider cursor-pointer shadow-lg transition-all rounded-2xl active:scale-[0.98]"
                          >
                            <Mic className="w-4 h-4 text-rose-400 shrink-0" />
                            <span className="text-[15px]">Record Live Mic Practice</span>
                          </button>
                          <span className="text-[10px] font-mono opacity-50 uppercase text-center tracking-widest block font-bold">
                            or drag performance audio below
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 text-[#141414] py-2 w-full">
                      <div className="flex items-center justify-between border-b border-[#141414]/15 pb-2">
                        <div className="space-y-0.5">
                          <span className="text-[12px] font-mono uppercase opacity-50 block font-bold">STAGED AUDIOSOURCE:</span>
                          <span className="text-[13px] font-mono font-bold uppercase tracking-wider block opacity-85 line-clamp-1 max-w-xs">
                            {audioFileName}
                          </span>
                        </div>
                        <button
                          onClick={handleClearAudio}
                          className="text-[12px] font-mono font-bold uppercase underline text-red-800 cursor-pointer hover:text-red-900"
                        >
                          Reset
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-center liquid-glass-panel p-3.5 rounded-2xl w-full">
                        <button
                          onClick={togglePlayAudio}
                          className="flex items-center justify-center space-x-2 w-full max-w-sm py-3 px-6 liquid-glass-btn-dark text-white font-mono uppercase font-bold cursor-pointer shadow-md transition-all rounded-xl active:scale-[0.98] min-h-[44px]"
                        >
                          {isPlayingAudio ? (
                            <>
                              <Pause className="w-4 h-4 shrink-0" />
                              <span className="text-[14px] tracking-wide">Stop</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 shrink-0 text-emerald-400 fill-emerald-400" />
                              <span className="text-[14px] tracking-wide">Play</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Drag and Drop Uploader Fallback */}
                  {!audioUri && !isRecording && (
                    <div
                      onDragOver={handleAudioDragOver}
                      onDragLeave={handleAudioDragLeave}
                      onDrop={handleAudioDrop}
                      onClick={() => audioInputRef.current?.click()}
                      className={`liquid-glass-pill p-4 text-center cursor-pointer transition-all rounded-2xl text-[#141414] border-dashed ${
                        isDraggingAudio 
                          ? "bg-white/70 ring-2 ring-[#141414]/20" 
                          : "hover:bg-white/60"
                      }`}
                    >
                      <input
                        type="file"
                        ref={audioInputRef}
                        onChange={handleAudioFileChange}
                        accept="audio/*"
                        className="hidden"
                      />
                      <div className="flex flex-col items-center justify-center space-y-1 opacity-75 py-2">
                        <UploadCloud className="w-5 h-5 shrink-0 font-bold" />
                        <span className="text-[16px] font-serif font-bold text-[#141414]">Upload audio file</span>
                        <span className="text-[10px] font-mono uppercase tracking-wider block">MP3, WAV, or M4A file</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Sticky Mobile Tab Switcher */}
            <div className="md:hidden sticky bottom-4 z-40 w-full flex justify-center px-3 py-1">
              <div className="liquid-glass-panel bg-white/85 backdrop-blur-2xl border border-white/90 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.16),0_0_16px_rgba(255,255,255,0.8)] p-1.5 rounded-full flex items-center justify-center w-full max-w-xs sm:max-w-sm gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    audioSystem.playClick();
                    setMobileStageTab("notation");
                  }}
                  className={`flex-1 w-1/2 min-h-[42px] flex items-center justify-center space-x-2 py-2.5 px-3 rounded-full text-xs font-mono uppercase font-bold transition-all duration-200 cursor-pointer ${
                    mobileStageTab === "notation"
                      ? "liquid-glass-btn-dark text-white shadow-md scale-[1.01]"
                      : "text-[#141414]/70 hover:text-[#141414] hover:bg-black/5"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Notation View</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audioSystem.playClick();
                    setMobileStageTab("audio");
                  }}
                  className={`flex-1 w-1/2 min-h-[42px] flex items-center justify-center space-x-2 py-2.5 px-3 rounded-full text-xs font-mono uppercase font-bold transition-all duration-200 cursor-pointer ${
                    mobileStageTab === "audio"
                      ? "liquid-glass-btn-dark text-white shadow-md scale-[1.01]"
                      : "text-[#141414]/70 hover:text-[#141414] hover:bg-black/5"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Audio Record</span>
                </button>
              </div>
            </div>

            {/* ERROR PANEL */}
            {error && (
              <div className="p-5 liquid-glass-card border-rose-500/40 rounded-2xl flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-rose-700 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="text-sm font-serif font-bold uppercase tracking-wide text-rose-800 block">
                    Diagnostic Interrupted
                  </span>
                  <p className="text-xs font-mono text-[#141414] leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* Analysis Activation Action Button */}
            <div className="w-full flex justify-center pt-4 pb-8 px-4 sm:px-0">
              <button
                onClick={handleAnalyzeScore}
                disabled={isAnalyzing}
                className={`max-w-xl w-full py-4 sm:py-5 px-8 font-serif font-bold uppercase tracking-wider sm:tracking-widest transition-all cursor-pointer focus:outline-none flex items-center justify-center rounded-2xl active:scale-[0.98] ${
                  isAnalyzing
                    ? "liquid-glass-pill opacity-60 text-zinc-500 cursor-not-allowed"
                    : "liquid-glass-btn-dark text-white hover:scale-[1.01] shadow-2xl"
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-2.5 animate-spin shrink-0" />
                    <span className="text-center text-[12px] sm:text-[15px] md:text-[17px] leading-tight">Processing Notation &amp; Performance...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-2.5 text-indigo-400 animate-pulse shrink-0" />
                    <span className="text-center text-[11px] min-[360px]:text-[12.5px] min-[400px]:text-[14px] sm:text-[15px] md:text-[17px] leading-tight">
                      {audioUri ? "Compare Sheet Music + Audio Performance" : "Analyze Sheet Music Only"}
                    </span>
                  </>
                )}
              </button>
            </div>

          </motion.main>
        ) : (
          <motion.main
            key="report-page"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-10 flex flex-col justify-between"
          >
            
            {/* Visual sheet music image at the top of the report */}
            <div className={`space-y-2 mb-8 liquid-glass-card p-5 relative rounded-3xl transition-all duration-500 ${
              isAnalyzing ? 'ring-2 ring-indigo-500/40' : ''
            }`}>
              <SheetMusicZoomViewer
                selectedPreset={selectedPreset}
                customImageUri={customImageUri}
                isAnalyzing={isAnalyzing}
              />
            </div>

            {/* Error panel in report page */}
            {error && (
              <div className="p-5 liquid-glass-card border-rose-500/40 rounded-2xl flex items-start space-x-3 mb-8">
                <AlertTriangle className="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="text-sm font-serif font-bold uppercase tracking-wide text-red-800 block">
                    Diagnostic Interrupted
                  </span>
                  <p className="text-xs font-mono text-[#141414]/90 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* Real-time Optical Active Loading Viewport */}
            {isAnalyzing && (
              <AnalyzingLoadingState hasAudio={Boolean(audioUri)} />
            )}

            {/* Empty report state fallback */}
            {!isAnalyzing && !analysisResult && !error && (
              <div className="space-y-8">
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="p-4 liquid-glass-panel text-[#141414] rounded-2xl">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="max-w-md space-y-2">
                    <span className="font-serif font-bold text-[#141414] text-lg block">
                      Report Generation Idle
                    </span>
                    <p className="text-xs text-[#141414] opacity-80 leading-relaxed font-sans">
                      Load your sheet and play record above to compile precise sight-reading analytics logs.
                    </p>
                  </div>
                </div>

                {/* Performance Trend Chart Section */}
                <PerformanceTrendChart history={history} />
              </div>
            )}

            {/* Diagnostic Report Result Workspace */}
            {!isAnalyzing && analysisResult && !error && (
              <div className="space-y-12 mb-10">
                {analysisResult.toLowerCase().includes("unable to analyze") ? (
                  <div className="p-5 liquid-glass-card space-y-3 rounded-3xl">
                    <div className="flex items-center space-x-2 text-[#141414]">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <span className="text-xs font-mono font-bold uppercase tracking-widest">
                        ERROR: UNREADABLE SCORE SEGMENT
                      </span>
                    </div>
                    <p className="text-xs font-mono leading-relaxed liquid-glass-panel p-4 font-bold text-red-800 rounded-2xl">
                      {analysisResult}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-10">

                    {/* AI Model Status & Processor Info Card (Shown only if fallback or non-default model is used) */}
                    {(fallbackUsed || (currentModel && currentModel !== "gemini-3.5-flash")) && (
                      <div className="liquid-glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-[#141414]">
                            <span className="font-serif font-bold uppercase tracking-wider text-xs">
                              Active Evaluation Processor
                            </span>
                          </div>
                          <p className="text-xs text-[#141414]/70 leading-relaxed font-sans max-w-lg">
                            {fallbackUsed ? (
                              <span>
                                Our advanced model <code className="font-mono bg-white/60 border border-white/80 px-1.5 py-0.5 rounded text-[11px]">gemini-3.5-flash</code> is currently experiencing high demand. To ensure instant results, your request was automatically routed to another model <code className="font-mono bg-white/60 border border-white/80 px-1.5 py-0.5 rounded text-[11px]">{currentModel || "gemini-3.1-flash-lite"}</code>.
                              </span>
                            ) : (
                              <span>
                                Your sight-reading score was analyzed using <code className="font-mono bg-white/60 border border-white/80 px-1.5 py-0.5 rounded text-[11px]">{currentModel}</code>.
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center self-start sm:self-center">
                          <div className="flex items-center space-x-1.5 text-amber-900 bg-amber-200/50 border border-amber-600 px-3 py-1.5 rounded-xl">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span className="font-mono text-[9px] font-bold uppercase tracking-wider">
                              AI Model Rerouted
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SECTION 1: AUDITORY PERFORMANCE FEEDBACK (AT THE TOP IF AUDIO WAS ANALYZED) */}
                    <div>
                      <div className="flex items-center justify-between border-b border-[#141414]/20 pb-2 mb-4">
                        <div className="flex items-center space-x-2">
                          <Activity className="w-5 h-5 text-[#141414] shrink-0" />
                          <h2 className="text-xl sm:text-2xl font-sans font-bold text-[#141414] tracking-tight">
                            Auditory Performance Feedback
                          </h2>
                        </div>
                        <button
                          onClick={handleRecordAgain}
                          className="liquid-glass-pill px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-[#141414] hover:bg-white/80 transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                          title="Record a new take for this sheet music"
                        >
                          <Mic className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Record Again</span>
                        </button>
                      </div>

                      {currentAnalysis.performance.length > 0 ? (
                        (() => {
                          const ratingBullet = currentAnalysis.performance.find(bullet => 
                            bullet.toLowerCase().startsWith("expert rating:") || 
                            bullet.toLowerCase().startsWith("**expert rating**:") ||
                            bullet.toLowerCase().includes("expert rating")
                          );

                          let scoreVal: number | null = null;
                          let tierName = "";
                          let rationaleText = "";

                          if (ratingBullet) {
                            const scoreMatch = ratingBullet.match(/(\d+)\s*\/\s*100/);
                            if (scoreMatch) {
                              scoreVal = parseInt(scoreMatch[1], 10);
                            }
                            const tierMatch = ratingBullet.match(/\(([^)]+)\)/);
                            if (tierMatch) {
                              tierName = tierMatch[1];
                            }
                            rationaleText = ratingBullet
                              .replace(/^[\*\-\s\•]*expert\s+rating[\*\s\•]*:\s*/i, "")
                              .replace(/^[\*\-\s\•]*expert\s+rating[\*\s\•]*/i, "")
                              .replace(/^[\s:\*\-\•]*/, "")
                              .replace(/^\d+\s*\/\s*100(?:\s*\([^)]+\))?/, "")
                              .replace(/^[\s\-\•\:\—\–\.\,]+/, "")
                              .trim();
                          }

                          return (
                            <PerformanceAuditSection
                              performanceBullets={currentAnalysis.performance}
                              overallScore={scoreVal}
                              tierName={tierName}
                              rationaleText={rationaleText}
                              formatBoldText={formatBoldText}
                              formatRatingRationale={formatRatingRationale}
                            />
                          );
                        })()
                      ) : (
                        <div className="p-4 border border-[#141414]/15 bg-[#DCDAD7]/15 backdrop-blur-lg flex items-start space-x-3 rounded-2xl">
                          <Info className="w-4 h-4 text-[#141414]/65 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <span className="text-[11px] font-serif font-bold uppercase tracking-wide block">
                              Auditory Performance Pending
                            </span>
                            <p className="text-xs text-[#141414]/75 font-sans leading-relaxed">
                              Record yourself playing or upload an audio file on Stage 1 to obtain rigorous tempo, key, fluency, and rhythmic accuracy diagnostics.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECTION: PERFORMANCE SCORE TREND CHART (Shown only if evaluated with audio performance) */}
                    {lastAnalyzedWithAudio && <PerformanceTrendChart history={history} />}

                    {/* SECTION 2: THE MUSICAL BLUEPRINT & KEYBOARD */}
                    <motion.div
                      layout
                      transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
                      className="space-y-4"
                    >
                      <div className="flex items-center space-x-2 border-b border-[#141414]/20 pb-2">
                        <FileText className="w-5 h-5 text-[#141414] shrink-0" />
                        <h2 className="text-xl sm:text-2xl font-sans font-bold text-[#141414] tracking-tight">
                          The Musical Blueprint
                        </h2>
                      </div>
                      
                      <MusicalBlueprintGrid blueprint={currentAnalysis.blueprint} />
                      <InteractivePianoKeyboard blueprint={currentAnalysis.blueprint} />
                    </motion.div>

                    {/* SECTION 3: MAIN CHORD PROGRESSIONS */}
                    <motion.div
                      layout
                      transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
                    >
                      <div className="flex items-center space-x-2 border-b border-[#141414]/20 pb-2 mb-4">
                        <Layers className="w-5 h-5 text-[#141414] shrink-0" />
                        <h2 className="text-xl sm:text-2xl font-sans font-bold text-[#141414] tracking-tight">
                          Main Chord Progressions
                        </h2>
                      </div>

                      <MainChordsGrid chords={currentAnalysis.chords} />
                    </motion.div>

                    {/* SECTION 4: TECHNICAL TRAP DOORS */}
                    <motion.div
                      layout
                      transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
                    >
                      <div className="flex items-center space-x-2 border-b border-[#141414]/20 pb-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-[#141414] shrink-0" />
                        <h2 className="text-xl sm:text-2xl font-sans font-bold text-[#141414] tracking-tight">
                          Technical Trap Doors
                        </h2>
                      </div>

                      <TechnicalTrapDoorsLayered trapDoors={currentAnalysis.trapDoors} />
                    </motion.div>

                    {/* SECTION 5: PRACTICE STRATEGY */}
                    <motion.div
                      layout
                      transition={{ layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }}
                    >
                      <div className="flex items-center space-x-2 border-b border-[#141414]/20 pb-2 mb-4">
                        <BookOpen className="w-5 h-5 text-[#141414] shrink-0" />
                        <h2 className="text-xl sm:text-2xl font-sans font-bold text-[#141414] tracking-tight">
                          Practice Strategy
                        </h2>
                      </div>

                      <PracticeStrategyLayered strategy={currentAnalysis.strategy} />
                    </motion.div>

                    {/* SECTION 5: EXTRA CONTENT / UNCLASSIFIED (FIFTH) */}
                    {currentAnalysis.unclassified.length > 0 && (
                      <div className="liquid-glass-card p-5 mt-8 rounded-3xl">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-2 opacity-60">
                          Extended Diagnostic Log Output
                        </span>
                        <div className="text-xs text-[#141414] leading-relaxed whitespace-pre-wrap font-mono">
                          {analysisResult}
                        </div>
                      </div>
                    )}

                    {/* OPTIONAL AUDIO PRACTICE UPLOAD FOR NOTATION-ONLY ANALYSIS */}
                    {!lastAnalyzedWithAudio && (
                      <div className="liquid-glass-card p-6 rounded-3xl space-y-5 border border-white/60 shadow-xl mt-10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#141414]/15 pb-3 gap-2">
                          <div>
                            <h3 className="font-serif text-[20px] font-bold tracking-tight text-[#141414]">
                              Upload or Record Audio Practice
                            </h3>
                            <p className="text-xs text-[#141414]/75 font-sans mt-0.5">
                              Add your acoustic playing to receive full rhythm accuracy, tempo, and score diagnostics with trend history tracking.
                            </p>
                          </div>
                        </div>

                        <div className="p-5 liquid-glass-panel space-y-4 rounded-2xl flex-1 flex flex-col justify-center">
                          {!audioUri ? (
                            <div className="flex flex-col items-center justify-center py-4 space-y-4 w-full">
                              {isRecording ? (
                                <div className="flex flex-col items-center justify-center space-y-3 w-full">
                                  <div className="flex items-center space-x-2">
                                    <span className="w-3.5 h-3.5 rounded-full bg-red-700 animate-ping shrink-0" />
                                    <span className="font-mono text-sm font-bold text-red-800 tracking-wider">
                                      RECORDING MIC: {formatTime(recordingTime)}
                                    </span>
                                  </div>
                                  <p className="text-[10px] font-mono opacity-70 text-center uppercase leading-tight px-4 pb-2">
                                    Play the score on your instrument. Recording captures clean audio diagnostics.
                                  </p>
                                  <button
                                    onClick={stopRecording}
                                    className="w-full flex items-center justify-center space-x-2 py-3 bg-rose-700/90 hover:bg-rose-800 text-white font-mono text-xs font-bold uppercase cursor-pointer shadow-md transition-all rounded-xl border border-white/30"
                                  >
                                    <Square className="w-3.5 h-3.5 shrink-0" />
                                    <span>Stop and Process</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center space-y-3 w-full">
                                  <button
                                    onClick={startRecording}
                                    className="w-full flex items-center justify-center space-x-2 py-3.5 liquid-glass-btn-dark text-white font-sans text-xs font-bold tracking-wider cursor-pointer shadow-lg transition-all rounded-2xl active:scale-[0.98]"
                                  >
                                    <Mic className="w-4 h-4 text-rose-400 shrink-0" />
                                    <span className="text-[15px]">Record Live Mic Practice</span>
                                  </button>
                                  <span className="text-[10px] font-mono opacity-50 uppercase text-center tracking-widest block font-bold">
                                    or drag performance audio below
                                  </span>
                                </div>
                              )}

                              {!isRecording && (
                                <div
                                  onDragOver={handleAudioDragOver}
                                  onDragLeave={handleAudioDragLeave}
                                  onDrop={handleAudioDrop}
                                  onClick={() => audioInputRef.current?.click()}
                                  className={`w-full liquid-glass-pill p-4 text-center cursor-pointer transition-all rounded-2xl text-[#141414] border-dashed ${
                                    isDraggingAudio 
                                      ? "bg-white/70 ring-2 ring-[#141414]/20" 
                                      : "hover:bg-white/60"
                                  }`}
                                >
                                  <input
                                    type="file"
                                    ref={audioInputRef}
                                    onChange={handleAudioFileChange}
                                    accept="audio/*"
                                    className="hidden"
                                  />
                                  <div className="flex flex-col items-center justify-center space-y-1 opacity-75 py-2">
                                    <UploadCloud className="w-5 h-5 shrink-0 font-bold" />
                                    <span className="text-[16px] font-serif font-bold text-[#141414]">Upload audio file</span>
                                    <span className="text-[10px] font-mono uppercase tracking-wider block">MP3, WAV, or M4A file</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4 text-[#141414] py-2 w-full">
                              <div className="flex items-center justify-between border-b border-[#141414]/15 pb-2">
                                <div className="space-y-0.5">
                                  <span className="text-[12px] font-mono uppercase opacity-50 block font-bold">STAGED AUDIOSOURCE:</span>
                                  <span className="text-[13px] font-mono font-bold uppercase tracking-wider block opacity-85 line-clamp-1 max-w-xs">
                                    {audioFileName}
                                  </span>
                                </div>
                                <button
                                  onClick={handleClearAudio}
                                  className="text-[12px] font-mono font-bold uppercase underline text-red-800 cursor-pointer hover:text-red-900"
                                >
                                  Reset
                                </button>
                              </div>
                              
                              <div className="flex items-center justify-center liquid-glass-panel p-3.5 rounded-2xl w-full">
                                <button
                                  onClick={togglePlayAudio}
                                  className="flex items-center justify-center space-x-2 w-full max-w-sm py-3 px-6 liquid-glass-btn-dark text-white font-mono uppercase font-bold cursor-pointer shadow-md transition-all rounded-xl active:scale-[0.98] min-h-[44px]"
                                >
                                  {isPlayingAudio ? (
                                    <>
                                      <Pause className="w-4 h-4 shrink-0" />
                                      <span className="text-[14px] tracking-wide">Stop</span>
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-4 h-4 shrink-0 text-emerald-400 fill-emerald-400" />
                                      <span className="text-[14px] tracking-wide">Play</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <button
                                onClick={handleAnalyzeScore}
                                disabled={isAnalyzing}
                                className="w-full py-4 px-6 font-serif font-bold uppercase tracking-wider transition-all cursor-pointer liquid-glass-btn-dark text-white hover:scale-[1.01] shadow-2xl flex items-center justify-center rounded-2xl active:scale-[0.98] mt-2"
                              >
                                {isAnalyzing ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin shrink-0" />
                                    <span>Evaluating Practice Recording...</span>
                                  </>
                                ) : (
                                  <>
                                    <Activity className="w-4 h-4 mr-2 text-indigo-400 animate-pulse shrink-0" />
                                    <span>Evaluate Audio Performance with Sheet Music →</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions Toolbar */}
            <div className="pt-6 border-t border-[#141414]/15 flex flex-col sm:flex-row justify-between items-center gap-4">
              <button
                onClick={() => setPage("setup")}
                className="w-full sm:w-auto px-6 py-3 liquid-glass-pill hover:bg-white/90 text-[#141414] transition-all font-serif font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center space-x-1 rounded-2xl active:scale-[0.98]"
              >
                ←  Back
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleRecordAgain}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 liquid-glass-pill hover:bg-white/90 text-[#141414] transition-all font-serif font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center space-x-2 rounded-2xl active:scale-[0.98]"
                  title="Record Again"
                >
                  <Mic className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="hidden sm:inline">Record Again</span>
                </button>

                {analysisResult && (
                  <button
                    onClick={handleExportPDF}
                    className="w-full sm:w-auto px-6 py-3 liquid-glass-btn-dark text-white transition-all font-serif font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center space-x-2 rounded-2xl active:scale-[0.98] shadow-lg"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>PDF Exported!</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Export PDF Report</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </motion.main>
        )}
      </AnimatePresence>
      </motion.div>
      )}

      {/* Floating AI Chatbot Assistant Button & Liquid Glass Apple-like Panel */}
      <AnimatePresence>
        {chatOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChatOpen(false)}
              className="fixed inset-0 bg-black/15 backdrop-blur-[2px] z-[60] cursor-pointer"
            />

            {/* Floating Bouncy Liquid Glass Menu originating from bottom right */}
            <motion.div
              initial={{ scale: 0.05, opacity: 0, x: 20, y: 20, rotate: 3 }}
              animate={{ scale: 1, opacity: 1, x: 0, y: 0, rotate: 0 }}
              exit={{ scale: 0.05, opacity: 0, x: 20, y: 20, rotate: 3 }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 22,
                mass: 0.75,
              }}
              style={{ originX: 1, originY: 1 }}
              className="fixed bottom-14 right-4 sm:bottom-16 sm:right-6 w-[calc(100%-2rem)] sm:w-96 h-[520px] max-h-[80vh] bg-white/35 sm:bg-white/40 backdrop-blur-3xl border border-white/70 z-[65] flex flex-col shadow-[0_32px_64px_-16px_rgba(0,0,0,0.22)] rounded-3xl overflow-hidden"
            >
              {/* Header */}
              <div className="h-14 border-b border-[#141414]/10 flex items-center justify-between px-5 bg-white/10 shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-white/60 border border-white/80 rounded-xl shadow-xs">
                    <Sparkles className="w-4 h-4 text-[#141414]" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-[14px] leading-none text-[#141414]">TempoSight Maestro AI</h3>
                    <p className="text-[10px] font-mono text-[#141414]/60 mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Piano Practice & Music Tutor
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {chatMessages.length > 1 && (
                    <button
                      onClick={() => {
                        audioSystem.playClick();
                        setChatMessages([
                          {
                            id: "welcome",
                            role: "assistant",
                            text: "Hello! I'm TempoSight Maestro AI. Ask me anything about sheet music notation, key signatures, rhythm subdivisions, or practice techniques!",
                            timestamp: new Date(),
                          },
                        ]);
                      }}
                      className="p-1.5 hover:bg-[#141414]/10 rounded-lg cursor-pointer transition-colors text-[#141414]/70 hover:text-[#141414]"
                      title="Clear chat history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      audioSystem.playClick();
                      setChatOpen(false);
                    }}
                    className="p-1.5 hover:bg-[#141414]/10 rounded-lg cursor-pointer transition-colors text-[#141414]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Thread */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 450, damping: 25 }}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`p-3 text-xs sm:text-[13px] leading-relaxed ${
                          isUser
                            ? "liquid-glass-btn-dark text-white rounded-2xl rounded-tr-xs max-w-[85%] shadow-md font-sans"
                            : "bg-white/65 border border-white/80 backdrop-blur-md text-[#141414] rounded-2xl rounded-tl-xs max-w-[90%] shadow-xs font-sans"
                        }`}
                      >
                        {isUser ? (
                          <p>{msg.text}</p>
                        ) : (
                          <div className="space-y-1">{renderFormattedChatText(msg.text)}</div>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-[#141414]/40 mt-1 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </motion.div>
                  );
                })}

                {/* Loading indicator */}
                {isChatSending && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="flex flex-col items-start"
                  >
                    <div className="bg-white/65 border border-white/80 backdrop-blur-md text-[#141414] p-3 rounded-2xl rounded-tl-xs max-w-[85%] shadow-xs flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#141414]/70" />
                      <span className="text-xs font-mono opacity-70">Maestro is thinking...</span>
                    </div>
                  </motion.div>
                )}

                {/* Quick Suggestion Chips */}
                {chatMessages.length === 1 && !isChatSending && (
                  <div className="pt-2 space-y-1.5">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#141414]/50 px-1">
                      Quick Questions:
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        "⚡ How can I sight-read faster and cleaner?",
                        "🎹 How do I identify key signatures easily?",
                        "🎵 Tips for counting complex rhythms",
                        "❓ How do I interpret my diagnostic report?",
                      ].map((promptText, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendChatMessage(promptText.replace(/^[^\s]+\s*/, ""))}
                          className="text-left text-xs bg-white/40 hover:bg-white/70 border border-white/60 p-2.5 rounded-xl text-[#141414] transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99]"
                        >
                          {promptText}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                className="p-3 border-t border-[#141414]/10 bg-white/10 backdrop-blur-md shrink-0 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Maestro AI a question..."
                  disabled={isChatSending}
                  className="flex-1 bg-white/50 focus:bg-white/80 border border-white/70 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#141414] placeholder-[#141414]/45 focus:outline-none transition-all duration-200 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatSending}
                  className="p-2.5 liquid-glass-btn-dark text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer shadow-md active:scale-95"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sample Notation & Audio Selection Fluid Liquid-Glass Menu */}
      <SampleNotationModal
        isOpen={sampleModalOpen}
        onClose={() => {
          audioSystem.playClick();
          setSampleModalOpen(false);
        }}
        onSelectSample={handleSelectSample}
        isLoading={isLoadingSample}
      />

      {/* Floating Bottom-Right Assistant Trigger Button (disappears when chat menu is open) */}
      <AnimatePresence>
        {introPhase === 'done' && !chatOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.3, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 15 }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 25,
              mass: 0.8,
              delay: 0.1,
            }}
            whileHover={{
              scale: 1.05,
              boxShadow:
                "0 24px 48px -12px rgba(0,0,0,0.32), 0 0 24px rgba(255,255,255,0.8), inset 0 2px 3px rgba(255,255,255,1)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              audioSystem.playClick();
              setChatOpen(true);
            }}
            className="fixed bottom-12 right-4 sm:bottom-14 sm:right-6 z-40 bg-gradient-to-br from-white/60 via-white/35 to-white/15 backdrop-blur-3xl border border-white/80 text-[#141414] shadow-[0_20px_45px_-10px_rgba(0,0,0,0.25),0_0_15px_rgba(255,255,255,0.5),inset_0_1.5px_2px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.06)] p-3.5 sm:p-4 rounded-3xl flex items-center gap-2.5 cursor-pointer transition-colors duration-200 group overflow-hidden"
          >
            {/* Liquid specular shine reflection overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

            <div className="relative">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-[#141414] transition-transform duration-300 group-hover:scale-105" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <span className="font-serif font-bold text-xs sm:text-sm tracking-tight hidden sm:inline text-[#141414] drop-shadow-xs">
              Stuck? Ask AI
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* High Density Utility Footer */}
      {introPhase === 'done' && (
        <footer 
          className="h-9 flex items-center px-6 justify-center text-[10px] font-mono text-[#141414] sticky bottom-0 z-30 shrink-0 border-t border-white/80 bg-[#EBEAE7]/70 backdrop-blur-2xl backdrop-saturate-180 shadow-xs"
        >
          <div className="uppercase tracking-wider font-bold">
            Made By Jeremy Ngai Sew Poh - 2026
          </div>
        </footer>
      )}

      {/* Custom Pointer following user mouse */}
      <motion.div
        className="custom-cursor fixed top-0 left-0 z-[9999] pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
        animate={{
          scale: isPressed ? 0.6 : 1,
          opacity: isCursorVisible ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 15,
        }}
      >
        <motion.div 
          className="w-8 h-8 rounded-full bg-[#141414]/15 backdrop-blur-[3px] border border-[#141414]/10 flex items-center justify-center transform-gpu"
          style={{
            scaleY: cursorScaleY,
            scaleX: cursorScaleX,
            y: cursorStretchYOffset,
          }}
        >
          <div className="w-2.5 h-2.5 bg-[#141414] rounded-full" />
        </motion.div>
      </motion.div>

      {/* Global CSS to disable native cursor for non-touch pointing devices */}
      <style>{`
        @media (pointer: fine) {
          *, *:hover, *:active, *:focus, a, a:hover, button, button:hover, select, option, input, label {
            cursor: none !important;
          }
        }
        @media (pointer: coarse) {
          .custom-cursor {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}
