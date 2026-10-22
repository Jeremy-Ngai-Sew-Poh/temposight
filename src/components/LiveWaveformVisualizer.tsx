import React, { useEffect, useRef, useState } from "react";
import { Mic, Activity, Radio, Volume2 } from "lucide-react";
import { motion } from "motion/react";

interface LiveWaveformVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
  recordingTime: number;
}

export const LiveWaveformVisualizer: React.FC<LiveWaveformVisualizerProps> = ({
  stream,
  isRecording,
  recordingTime,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [visualMode, setVisualMode] = useState<"waveform" | "bars">("waveform");
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isAudioDetected, setIsAudioDetected] = useState<boolean>(false);
  const [dominantFreqLabel, setDominantFreqLabel] = useState<string>("");

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!stream || !isRecording) {
      setAudioLevel(0);
      setIsAudioDetected(false);
      return;
    }

    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let sourceNode: MediaStreamAudioSourceNode | null = null;
    let animationFrameId: number;

    try {
      audioCtx = new AudioContextClass();
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.8;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;

      sourceNode = audioCtx.createMediaStreamSource(stream);
      sourceNode.connect(analyser);
    } catch (err) {
      console.error("Failed to initialize AudioContext for waveform visualizer:", err);
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const timeDomainData = new Uint8Array(bufferLength);
    const frequencyData = new Uint8Array(bufferLength);

    let smoothedLevel = 0;
    let lastUiUpdate = 0;

    const render = (time: number) => {
      if (!analyser || !canvasRef.current) return;

      analyser.getByteTimeDomainData(timeDomainData);
      analyser.getByteFrequencyData(frequencyData);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // 1. Calculate RMS audio level from time domain
      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (timeDomainData[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / bufferLength);
      const targetLevel = Math.min(1, rms * 4.5); // Amplified for piano sensitivity
      smoothedLevel = smoothedLevel * 0.75 + targetLevel * 0.25;

      // Update UI state throttled at ~15fps for performance
      if (time - lastUiUpdate > 66) {
        lastUiUpdate = time;
        const levelPct = Math.round(smoothedLevel * 100);
        setAudioLevel(levelPct);
        const hasSound = levelPct > 4;
        setIsAudioDetected(hasSound);

        if (hasSound) {
          // Detect highest frequency band
          let maxFreqVal = 0;
          let maxFreqIdx = 0;
          for (let i = 2; i < bufferLength / 2; i++) {
            if (frequencyData[i] > maxFreqVal) {
              maxFreqVal = frequencyData[i];
              maxFreqIdx = i;
            }
          }
          if (audioCtx) {
            const nyquist = audioCtx.sampleRate / 2;
            const approxHz = Math.round((maxFreqIdx / (bufferLength / 2)) * nyquist);
            if (approxHz > 50 && approxHz < 4500) {
              setDominantFreqLabel(`~${approxHz} Hz`);
            } else {
              setDominantFreqLabel("Acoustic Input");
            }
          }
        } else {
          setDominantFreqLabel("Listening...");
        }
      }

      // 2. Clear Canvas with dark modern gradient background
      ctx.clearRect(0, 0, width, height);

      // Background Subtle Glass Grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      const gridSpacingY = height / 6;
      for (let y = gridSpacingY; y < height; y += gridSpacingY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const gridSpacingX = width / 12;
      for (let x = gridSpacingX; x < width; x += gridSpacingX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Center Reference Line
      const centerY = height / 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      if (visualMode === "waveform") {
        // === MODE 1: Smooth Oscilloscope Sine Wave ===
        
        // Ambient glow background fill behind wave
        const gradientFill = ctx.createLinearGradient(0, 0, 0, height);
        gradientFill.addColorStop(0, "rgba(239, 68, 68, 0.18)"); // red-500 tint
        gradientFill.addColorStop(0.5, "rgba(244, 63, 94, 0.05)");
        gradientFill.addColorStop(1, "rgba(239, 68, 68, 0.18)");

        ctx.beginPath();
        ctx.moveTo(0, centerY);

        const sliceWidth = width / (bufferLength - 1);
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeDomainData[i] / 128.0; // 1.0 is neutral center
          const deviation = (v - 1.0) * (height * 0.42); // Amplitude height
          const y = centerY + deviation;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            // Smooth curve
            const prevX = x - sliceWidth;
            const prevV = timeDomainData[i - 1] / 128.0;
            const prevY = centerY + (prevV - 1.0) * (height * 0.42);
            const midX = (prevX + x) / 2;
            const midY = (prevY + y) / 2;
            ctx.quadraticCurveTo(prevX, prevY, midX, midY);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, centerY);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = gradientFill;
        ctx.fill();

        // Main High-Definition Glowing Waveform Path
        ctx.beginPath();
        x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = timeDomainData[i] / 128.0;
          const deviation = (v - 1.0) * (height * 0.42);
          const y = centerY + deviation;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevX = x - sliceWidth;
            const prevV = timeDomainData[i - 1] / 128.0;
            const prevY = centerY + (prevV - 1.0) * (height * 0.42);
            const midX = (prevX + x) / 2;
            const midY = (prevY + y) / 2;
            ctx.quadraticCurveTo(prevX, prevY, midX, midY);
          }
          x += sliceWidth;
        }

        // Outer glow stroke
        ctx.shadowColor = smoothedLevel > 0.1 ? "rgba(244, 63, 94, 0.8)" : "rgba(255, 255, 255, 0.3)";
        ctx.shadowBlur = 10;
        ctx.strokeStyle = smoothedLevel > 0.05 ? "#fb7185" : "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Core bright line stroke
        ctx.shadowBlur = 0;
        ctx.strokeStyle = smoothedLevel > 0.05 ? "#ffffff" : "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else {
        // === MODE 2: Multi-Band Dynamic Frequency Spectrum Bars ===
        const numBars = 48;
        const barGap = 3;
        const totalBarWidth = (width - barGap * (numBars - 1)) / numBars;
        const step = Math.floor((bufferLength * 0.65) / numBars);

        for (let i = 0; i < numBars; i++) {
          const freqVal = frequencyData[i * step] || 0;
          const barHeightFraction = freqVal / 255;
          const barHeight = Math.max(4, barHeightFraction * (height * 0.82));
          const barX = i * (totalBarWidth + barGap);
          const barY = height - barHeight - 4;

          const barGrad = ctx.createLinearGradient(0, barY, 0, height);
          if (barHeightFraction > 0.65) {
            barGrad.addColorStop(0, "#f43f5e"); // rose-500
            barGrad.addColorStop(0.5, "#fb7185"); // rose-400
            barGrad.addColorStop(1, "#fbbf24"); // amber-400
          } else {
            barGrad.addColorStop(0, "#fb7185");
            barGrad.addColorStop(0.6, "#f43f5e");
            barGrad.addColorStop(1, "rgba(244, 63, 94, 0.4)");
          }

          ctx.fillStyle = barGrad;
          // Draw rounded top bar
          const radius = Math.min(3, totalBarWidth / 2);
          ctx.beginPath();
          ctx.moveTo(barX + radius, barY);
          ctx.lineTo(barX + totalBarWidth - radius, barY);
          ctx.quadraticCurveTo(barX + totalBarWidth, barY, barX + totalBarWidth, barY + radius);
          ctx.lineTo(barX + totalBarWidth, height - 2);
          ctx.lineTo(barX, height - 2);
          ctx.lineTo(barX, barY + radius);
          ctx.quadraticCurveTo(barX, barY, barX + radius, barY);
          ctx.closePath();
          ctx.fill();

          // Highlight top cap
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(barX, barY, totalBarWidth, 1.5);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (sourceNode) {
        sourceNode.disconnect();
      }
      if (analyser) {
        analyser.disconnect();
      }
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
    };
  }, [stream, isRecording, visualMode]);

  // Sync canvas width and height to container with High DPI (Retina) scaling
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height) || 120;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="w-full flex flex-col space-y-2.5">
      {/* Top Status Bar: Recording Time + Live Status Indicators */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
          </span>
          <span className="font-mono text-[13px] font-bold text-rose-800 tracking-wider">
            REC {formatTime(recordingTime)}
          </span>
          <span className="text-[11px] font-mono text-[#141414]/50 font-semibold uppercase">
            • {dominantFreqLabel || "Live Feed"}
          </span>
        </div>

        {/* View mode toggle button */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setVisualMode(visualMode === "waveform" ? "bars" : "waveform")}
            className="h-6 px-2 rounded-md bg-white/70 hover:bg-white text-[#141414] border border-[#141414]/15 flex items-center space-x-1 shadow-2xs text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
            title="Switch Waveform / Spectrum EQ Mode"
          >
            {visualMode === "waveform" ? (
              <>
                <Activity className="w-3 h-3 text-rose-600" />
                <span>Wave</span>
              </>
            ) : (
              <>
                <Radio className="w-3 h-3 text-rose-600" />
                <span>Bars</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Waveform Canvas Viewport (Apple Liquid Glass Dark Card) */}
      <div
        ref={containerRef}
        className="relative w-full h-[120px] sm:h-[135px] rounded-2xl overflow-hidden liquid-glass-dark border border-white/25 shadow-inner flex items-center justify-center"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

        {/* Ambient Overlay Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/40" />

        {/* Watermark Label in canvas */}
        <div className="absolute top-2 left-3 pointer-events-none flex items-center space-x-1.5 opacity-60">
          <Mic className="w-3 h-3 text-white" />
          <span className="text-[9px] font-mono uppercase tracking-widest text-white font-bold">
            Web Audio Capture Engine
          </span>
        </div>

        {/* Dynamic Acoustic Detection Badge */}
        <div className="absolute bottom-2 right-3 pointer-events-none flex items-center space-x-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              isAudioDetected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-white/30"
            }`}
          />
          <span className="text-[9.5px] font-mono uppercase tracking-wider text-white/75 font-semibold">
            {isAudioDetected ? "Capturing Acoustic Signal" : "Awaiting piano sound..."}
          </span>
        </div>
      </div>

      {/* Live VU Amplitude & Decibel Meter Bar */}
      <div className="flex items-center space-x-2 px-1 pt-0.5">
        <Volume2 className="w-3.5 h-3.5 text-[#141414]/60 shrink-0" />
        <div className="flex-1 h-2 bg-black/10 rounded-full overflow-hidden p-0.5 border border-black/5 flex items-center">
          <motion.div
            className={`h-full rounded-full transition-all duration-75 ${
              audioLevel > 75
                ? "bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600"
                : audioLevel > 35
                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(100, Math.max(3, audioLevel))}%` }}
          />
        </div>
        <span className="font-mono text-[10px] font-bold text-[#141414]/70 w-8 text-right shrink-0">
          {audioLevel}%
        </span>
      </div>
    </div>
  );
};
