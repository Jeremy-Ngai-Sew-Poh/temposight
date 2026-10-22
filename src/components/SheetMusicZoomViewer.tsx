import React, { useState, useRef, useEffect, useCallback } from "react";
import { ZoomIn, ZoomOut, Move } from "lucide-react";
import { ScorePreset } from "../presets";

interface SheetMusicZoomViewerProps {
  selectedPreset: ScorePreset | null;
  customImageUri: string | null;
  isAnalyzing?: boolean;
  className?: string;
}

export const SheetMusicZoomViewer: React.FC<SheetMusicZoomViewerProps> = ({
  selectedPreset,
  customImageUri,
  isAnalyzing = false,
  className = "",
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragStartOffset, setDragStartOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(100);

  // Helper to clamp pan offset within logical bounds based on current zoom
  const clampOffset = useCallback((x: number, y: number, currentZoom: number) => {
    const scale = currentZoom / 100;
    if (scale <= 1) return { x: 0, y: 0 };

    const width = containerRef.current?.clientWidth || 400;
    const height = containerRef.current?.clientHeight || 250;

    // Allow generous horizontal and vertical panning for long notation scores
    const maxPanX = Math.max(80, (width * (scale - 1)) / 2 + 160);
    const maxPanY = Math.max(60, (height * (scale - 1)) / 2 + 100);

    return {
      x: Math.min(Math.max(x, -maxPanX), maxPanX),
      y: Math.min(Math.max(y, -maxPanY), maxPanY),
    };
  }, []);

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.min(Math.max(newZoom, 100), 350);
    setZoom(clamped);
    if (clamped === 100) {
      setPanOffset({ x: 0, y: 0 });
    } else {
      setPanOffset((prev) => clampOffset(prev.x, prev.y, clamped));
    }
  };

  const handleZoomIn = () => handleZoomChange(zoom + 25);
  const handleZoomOut = () => handleZoomChange(zoom - 25);

  // Image load handler to calculate natural aspect ratio
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      setImageAspectRatio(ratio);
    }
  };

  // Wheel zoom handling: only pinch-to-zoom (ctrl/meta key); normal mouse wheel scrolling does NOT move/pan the sheet
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 15 : -15;
      handleZoomChange(zoom + delta);
    }
  };

  // Touch handling for mobile: support 1-finger panning when zoomed and 2-finger pinch-to-zoom
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches);
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoom;
    } else if (e.touches.length === 1 && zoom > 100) {
      setIsPanning(true);
      setPanStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setDragStartOffset({ ...panOffset });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current) {
      const currentDist = getTouchDistance(e.touches);
      const scale = currentDist / touchStartDistRef.current;
      const newZoom = Math.round(touchStartZoomRef.current * scale);
      handleZoomChange(newZoom);
    } else if (e.touches.length === 1 && isPanning) {
      const dx = e.touches[0].clientX - panStart.x;
      const dy = e.touches[0].clientY - panStart.y;
      setPanOffset(clampOffset(dragStartOffset.x + dx, dragStartOffset.y + dy, zoom));
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
    setIsPanning(false);
  };

  // Mouse Drag-to-pan handling on desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 100 || e.button !== 0) return;
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    setDragStartOffset({ ...panOffset });
  };

  // Global mousemove and mouseup listeners while dragging on desktop
  useEffect(() => {
    if (!isPanning) return;

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanOffset(clampOffset(dragStartOffset.x + dx, dragStartOffset.y + dy, zoom));
    };

    const onMouseUp = () => {
      setIsPanning(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isPanning, panStart, dragStartOffset, zoom, clampOffset]);

  const renderContent = () => {
    const transformStyle = {
      transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoom / 100})`,
      transition: isPanning ? "none" : "transform 0.15s ease-out",
      transformOrigin: "center center",
      maxWidth: "100%",
      maxHeight: "100%",
    };

    if (selectedPreset) {
      return (
        <div
          className="w-full h-full flex items-center justify-center relative text-[#141414] select-none pointer-events-none [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto [&>svg]:object-contain"
          style={transformStyle}
          dangerouslySetInnerHTML={{ __html: selectedPreset.svgContent }}
        />
      );
    }

    if (customImageUri) {
      return (
        <div
          className="w-full h-full flex items-center justify-center relative select-none pointer-events-none"
          style={transformStyle}
        >
          <img
            ref={imageRef}
            src={customImageUri}
            alt="Sheet music notation"
            onLoad={handleImageLoad}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="max-h-full max-w-full w-auto h-auto object-contain filter contrast-125 select-none pointer-events-none rounded-lg"
            referrerPolicy="no-referrer"
            draggable={false}
          />
        </div>
      );
    }

    return (
      <div className="text-center p-4">
        <span className="text-xs font-mono opacity-50 block uppercase">No notation sheet uploaded</span>
      </div>
    );
  };

  return (
    <div className={`relative flex flex-col ${className}`}>
      {/* Zoom Toolbar Top Bar */}
      <div className="flex items-center justify-between mb-2 px-1 gap-2">
        {/* Left Side: Header Label */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase opacity-65 tracking-wider font-bold">
            Notation View
          </span>
        </div>

        {/* Right Side: Zoom Controls Pill (Minus, Slider, Plus) */}
        <div className="flex items-center space-x-1 liquid-glass-pill p-1 rounded-2xl shadow-xs">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 100}
            className="p-1 hover:bg-[#141414]/10 rounded-xl text-[#141414] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Zoom Out (-25%)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Slider matching app palette */}
          <input
            type="range"
            min="100"
            max="300"
            step="5"
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="w-16 sm:w-24 h-1.5 bg-[#141414]/20 rounded-lg appearance-none cursor-pointer accent-[#141414] focus:outline-none"
            title={`Zoom level: ${zoom}%`}
          />

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 350}
            className="p-1 hover:bg-[#141414]/10 rounded-xl text-[#141414] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Zoom In (+25%)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Outer Frame with Liquid Glass Edge */}
      <div className="relative rounded-2xl overflow-hidden liquid-glass-panel shadow-sm">
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onMouseDown={handleMouseDown}
          style={{ touchAction: zoom > 100 ? "none" : "pan-y" }}
          className={`w-full bg-[#D1CFCC]/40 backdrop-blur-md relative flex items-center justify-center overflow-hidden p-3 sm:p-4 min-h-[170px] h-[200px] sm:h-[240px] md:h-[270px] select-none ${
            zoom > 100 ? "cursor-grab active:cursor-grabbing touch-none" : "touch-pan-y"
          } ${isAnalyzing ? "ring-2 ring-indigo-500/20" : ""}`}
        >
          {renderContent()}
        </div>

        {/* Pan helper tooltip anchored at the bottom-left of the viewer frame with liquid dark glass */}
        {zoom > 100 && (
          <div className="absolute bottom-2.5 left-2.5 z-10 liquid-glass-dark text-white px-3 py-1.5 rounded-xl text-[9.5px] font-mono flex items-center gap-1.5 pointer-events-none opacity-95 shadow-md">
            <Move className="w-3 h-3 text-white/90" />
            <span>Drag to pan</span>
          </div>
        )}
      </div>
    </div>
  );
};


