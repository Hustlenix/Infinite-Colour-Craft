import React, { useRef, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { ColorItem } from '../types';
import { audioSynth, StrokeTool } from '../utils/audioSynth';
import { hexToRgb, normalizeHex } from '../utils/colorEngine';
import { CANVAS_TEMPLATES, CanvasTemplate } from '../data/canvasTemplates';
import { 
  Paintbrush, 
  RotateCcw, 
  RotateCw, 
  Download, 
  Trash2, 
  Palette, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Eraser, 
  PenTool, 
  Highlighter, 
  Keyboard, 
  X, 
  Pipette, 
  PaintBucket, 
  Smile, 
  Check, 
  Layers, 
  Copy,
  Wand2,
  Brush,
  Sun,
  Moon,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  Hand,
  Zap,
  Eye,
  MousePointer2
} from 'lucide-react';
import { collaborationService, RemoteStroke } from '../services/collaborationService';

// Live Vector Preview Thumbnail for Outline Templates
const TemplateThumbnail: React.FC<{
  template: CanvasTemplate;
  isDarkMode: boolean;
}> = ({ template, isDarkMode }) => {
  const thumbRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = thumbRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = isDarkMode ? '#1E293B' : '#F8FAFC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (template.id === 'blank') {
      ctx.save();
      ctx.strokeStyle = isDarkMode ? '#475569' : '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      ctx.restore();
      return;
    }

    template.drawOutline(ctx, canvas.width, canvas.height, isDarkMode, {
      lineWidth: 2.2,
      strokeColor: isDarkMode ? '#F8FAFC' : '#0F172A',
    });
  }, [template, isDarkMode]);

  return (
    <canvas
      ref={thumbRef}
      width={130}
      height={100}
      className="w-full h-24 object-contain rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-inner"
    />
  );
};

interface PaintCanvasProps {
  activeColor: ColorItem;
  unlockedColors: ColorItem[];
  onSelectColor: (color: ColorItem) => void;
  isDarkMode?: boolean;
}

export type PaperTexture = 'white' | 'dark' | 'parchment' | 'grid' | 'glow';

const STAMP_EMOJIS = ['⭐', '🎨', '🌟', '💖', '🌈', '👑', '🦄', '⚡', '🍀', '🔥', '🌸', '🔮', '💎', '🚀', '🐱'];

export const PaintCanvas: React.FC<PaintCanvasProps> = ({
  activeColor,
  unlockedColors,
  onSelectColor,
  isDarkMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef<boolean>(false);

  // Stroke queue & animation frame
  const pointsQueueRef = useRef<{ x: number; y: number }[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const prevPtRef = useRef<{ x: number; y: number } | null>(null);
  const prevMidPtRef = useRef<{ x: number; y: number } | null>(null);

  // Tools & State
  const [brushTool, setBrushTool] = useState<StrokeTool>('brush');
  const [brushSize, setBrushSize] = useState<number>(14);
  const [brushOpacity, setBrushOpacity] = useState<number>(1);
  const [stencilMode, setStencilMode] = useState<'free' | 'mirror' | 'quad' | 'mandala' | 'kaleidoscope'>('free');
  const [paperTexture, setPaperTexture] = useState<PaperTexture>(isDarkMode ? 'dark' : 'white');
  const [selectedTemplate, setSelectedTemplate] = useState<CanvasTemplate>(CANVAS_TEMPLATES[0]);
  const [selectedStamp, setSelectedStamp] = useState<string>('⭐');
  const [rainbowHue, setRainbowHue] = useState<number>(0);

  // Pro 2D Brush Engine States (Inspired by 2D Painting Software Compendium)
  const [strokeBlendMode, setStrokeBlendMode] = useState<GlobalCompositeOperation>('source-over');
  const [smoothingLevel, setSmoothingLevel] = useState<'off' | 'low' | 'medium' | 'high'>('low');
  const [speedDynamics, setSpeedDynamics] = useState<boolean>(true);
  const [flipX, setFlipX] = useState<boolean>(false);
  const [flipY, setFlipY] = useState<boolean>(false);
  const [showNavigator, setShowNavigator] = useState<boolean>(false);

  // Custom Color State (always normalized to a valid #RRGGBB)
  const [customHex, setCustomHex] = useState<string>(() => normalizeHex(activeColor.hex));

  // Undo / Redo Stacks
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);

  // UI Modals
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Outline Enhancement Controls (Coloring Book Overlay Mode)
  const outlineOverlayRef = useRef<HTMLCanvasElement>(null);
  const [outlineOnTop, setOutlineOnTop] = useState<boolean>(true);
  const [outlineLineWidth, setOutlineLineWidth] = useState<number>(3.5);
  const [outlineColorStyle, setOutlineColorStyle] = useState<'auto' | 'dark' | 'white' | 'gold' | 'indigo'>('auto');

  // Real-time Collaboration State
  const [remoteCanvasCursors, setRemoteCanvasCursors] = useState<{
    id: string;
    name: string;
    color: string;
    x: number;
    y: number;
  }[]>([]);
  const currentLocalStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const lastCanvasCursorBroadcastRef = useRef<number>(0);

  // Compute stroke color for outline
  const getOutlineStrokeColor = useCallback(() => {
    switch (outlineColorStyle) {
      case 'dark':
        return '#0F172A';
      case 'white':
        return '#F8FAFC';
      case 'gold':
        return '#D97706';
      case 'indigo':
        return '#2563EB';
      case 'auto':
      default:
        return (paperTexture === 'dark' || paperTexture === 'glow') ? '#F8FAFC' : '#0F172A';
    }
  }, [outlineColorStyle, paperTexture]);

  // Redraw Outline Overlay on top-layer canvas (keeps lines razor-sharp above colors)
  const drawOutlineOverlay = useCallback(() => {
    const overlay = outlineOverlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = parseFloat(overlay.style.width) || overlay.width / dpr;
    const displayHeight = parseFloat(overlay.style.height) || overlay.height / dpr;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (selectedTemplate.id === 'blank' || !outlineOnTop) {
      return;
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const strokeColor = getOutlineStrokeColor();
    selectedTemplate.drawOutline(ctx, displayWidth, displayHeight, paperTexture === 'dark' || paperTexture === 'glow', {
      lineWidth: outlineLineWidth,
      strokeColor,
    });
    ctx.restore();
  }, [selectedTemplate, outlineOnTop, getOutlineStrokeColor, outlineLineWidth, paperTexture]);

  useEffect(() => {
    drawOutlineOverlay();
  }, [drawOutlineOverlay]);

  // Keep customHex in sync with activeColor prop
  useEffect(() => {
    setCustomHex(normalizeHex(activeColor.hex));
    setBrushTool((prev) => (prev === 'eraser' ? 'brush' : prev));
  }, [activeColor]);

  // Save Canvas State to Undo
  const pushUndoState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setUndoStack((prev) => {
        const next = [...prev, imageData];
        if (next.length > 30) next.shift(); // Max 30 undo steps
        return next;
      });
      setRedoStack([]); // Clear redo stack on new stroke
    } catch {
      // Ignore
    }
  }, []);

  // Get Background Color for Selected Paper Texture
  const getPaperBgColor = useCallback((texture: PaperTexture) => {
    switch (texture) {
      case 'dark':
        return '#0F172A';
      case 'parchment':
        return '#FDF6E3';
      case 'grid':
        return '#F8FAFC';
      case 'glow':
        return '#050515';
      case 'white':
      default:
        return '#FFFFFF';
    }
  }, []);

  // Initialize or Resize Canvas with High-DPI Scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = parent.clientWidth;
    const displayHeight = parent.clientHeight;
    const internalWidth = Math.floor(displayWidth * dpr);
    const internalHeight = Math.floor(displayHeight * dpr);

    if (canvas.width !== internalWidth || canvas.height !== internalHeight) {
      let tempCanvas: HTMLCanvasElement | null = null;
      if (canvas.width > 0 && canvas.height > 0) {
        tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) tempCtx.drawImage(canvas, 0, 0);
      }

      canvas.width = internalWidth;
      canvas.height = internalHeight;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      if (outlineOverlayRef.current) {
        outlineOverlayRef.current.width = internalWidth;
        outlineOverlayRef.current.height = internalHeight;
        outlineOverlayRef.current.style.width = `${displayWidth}px`;
        outlineOverlayRef.current.style.height = `${displayHeight}px`;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Fill paper background
      ctx.fillStyle = getPaperBgColor(paperTexture);
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // Draw Grid lines if Grid texture selected
      if (paperTexture === 'grid') {
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1;
        const gridSize = 24;
        for (let x = 0; x < displayWidth; x += gridSize) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, displayHeight); ctx.stroke();
        }
        for (let y = 0; y < displayHeight; y += gridSize) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(displayWidth, y); ctx.stroke();
        }
      }

      // Draw Selected Template Outline if active
      if (selectedTemplate.id !== 'blank') {
        const strokeColor = getOutlineStrokeColor();
        selectedTemplate.drawOutline(ctx, displayWidth, displayHeight, paperTexture === 'dark' || paperTexture === 'glow', {
          lineWidth: outlineLineWidth,
          strokeColor,
        });
      }

      if (tempCanvas) {
        try {
          ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, displayWidth, displayHeight);
        } catch {
          // Ignore
        }
      } else {
        pushUndoState();
      }

      drawOutlineOverlay();
    }
  }, [getPaperBgColor, paperTexture, pushUndoState, selectedTemplate, outlineLineWidth, getOutlineStrokeColor, drawOutlineOverlay]);

  // Handle Undo
  const handleUndo = useCallback(() => {
    if (undoStack.length <= 1 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newUndo = [...undoStack];
    const prevData = newUndo.pop()!;
    const restoreData = newUndo[newUndo.length - 1];

    if (restoreData) {
      ctx.putImageData(restoreData, 0, 0);
      setUndoStack(newUndo);
      setRedoStack((prev) => [...prev, currentData]);
      audioSynth.playPop();
    }
  }, [undoStack]);

  // Handle Redo
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newRedo = [...redoStack];
    const nextData = newRedo.pop()!;

    ctx.putImageData(nextData, 0, 0);
    setRedoStack(newRedo);
    setUndoStack((prev) => [...prev, currentData]);
    audioSynth.playPop();
  }, [redoStack]);

  // Clear Canvas
  const handleClearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    pushUndoState();

    const displayWidth = parseFloat(canvas.style.width) || canvas.width;
    const displayHeight = parseFloat(canvas.style.height) || canvas.height;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = getPaperBgColor(paperTexture);
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    ctx.restore();

    if (selectedTemplate.id !== 'blank') {
      const strokeColor = getOutlineStrokeColor();
      selectedTemplate.drawOutline(ctx, displayWidth, displayHeight, paperTexture === 'dark' || paperTexture === 'glow', {
        lineWidth: outlineLineWidth,
        strokeColor,
      });
    }

    drawOutlineOverlay();
    pushUndoState();
    audioSynth.playTrash();
    collaborationService.sendClearCanvas();
  }, [getPaperBgColor, paperTexture, pushUndoState, selectedTemplate, getOutlineStrokeColor, outlineLineWidth, drawOutlineOverlay]);

  // Apply Template Outline
  const handleSelectTemplate = useCallback((template: CanvasTemplate) => {
    setSelectedTemplate(template);
    setShowTemplatesModal(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    pushUndoState();

    const displayWidth = parseFloat(canvas.style.width) || canvas.width;
    const displayHeight = parseFloat(canvas.style.height) || canvas.height;

    ctx.fillStyle = getPaperBgColor(paperTexture);
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    if (template.id !== 'blank') {
      const strokeColor = getOutlineStrokeColor();
      template.drawOutline(ctx, displayWidth, displayHeight, paperTexture === 'dark' || paperTexture === 'glow', {
        lineWidth: outlineLineWidth,
        strokeColor,
      });
      setOutlineOnTop(true);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
      audioSynth.playUnlock();
    } else {
      audioSynth.playPop();
    }

    drawOutlineOverlay();
    pushUndoState();
  }, [getPaperBgColor, paperTexture, pushUndoState, getOutlineStrokeColor, outlineLineWidth, drawOutlineOverlay]);

  // Flood Fill / Paint Bucket Algorithm
  const handleFloodFill = useCallback((startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    pushUndoState();

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width;
    const height = canvas.height;

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const px = Math.floor(startX * dpr);
    const py = Math.floor(startY * dpr);

    if (px < 0 || px >= width || py < 0 || py >= height) return;

    const startIdx = (py * width + px) * 4;
    const startR = data[startIdx];
    const startG = data[startIdx + 1];
    const startB = data[startIdx + 2];
    const startA = data[startIdx + 3];

    const fillRgb = hexToRgb(customHex);

    // Color match threshold helper
    const matchesTarget = (idx: number) => {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      return Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB) + Math.abs(a - startA) < 70;
    };

    if (
      Math.abs(startR - fillRgb.r) < 5 &&
      Math.abs(startG - fillRgb.g) < 5 &&
      Math.abs(startB - fillRgb.b) < 5
    ) {
      return; // Already target color
    }

    const queue: number[] = [px + py * width];
    const visited = new Uint8Array(width * height);
    visited[px + py * width] = 1;

    let iterations = 0;
    const maxIterations = width * height;

    while (queue.length > 0 && iterations < maxIterations) {
      const curr = queue.pop()!;
      iterations++;

      const cx = curr % width;
      const cy = Math.floor(curr / width);
      const idx = (cy * width + cx) * 4;

      data[idx] = fillRgb.r;
      data[idx + 1] = fillRgb.g;
      data[idx + 2] = fillRgb.b;
      data[idx + 3] = Math.floor(brushOpacity * 255);

      const neighbors = [
        cx > 0 ? curr - 1 : -1,
        cx < width - 1 ? curr + 1 : -1,
        cy > 0 ? curr - width : -1,
        cy < height - 1 ? curr + width : -1,
      ];

      for (const n of neighbors) {
        if (n >= 0 && !visited[n]) {
          visited[n] = 1;
          if (matchesTarget(n * 4)) {
            queue.push(n);
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    audioSynth.playBucketFill();
    pushUndoState();
  }, [brushOpacity, customHex, hexToRgb, pushUndoState]);

  // Eyedropper Color Picker
  const handleEyedropper = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const px = Math.floor(x * dpr);
    const py = Math.floor(y * dpr);

    const pixel = ctx.getImageData(px, py, 1, 1).data;
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1).toUpperCase()}`;

    setCustomHex(hex);
    const matchedColor = unlockedColors.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
    if (matchedColor) {
      onSelectColor(matchedColor);
    }
    audioSynth.playEyedropper();
  }, [onSelectColor, unlockedColors]);

  // Stamp Placement
  const handlePlaceStamp = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    pushUndoState();

    ctx.save();
    ctx.font = `${brushSize * 3}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(selectedStamp, x, y);
    ctx.restore();

    audioSynth.playStamp();
    pushUndoState();
  }, [brushSize, pushUndoState, selectedStamp]);

  // Get Point Coordinates from Event (accounting for flip view transforms)
  const getCanvasCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    if (flipX) {
      x = rect.width - x;
    }
    if (flipY) {
      y = rect.height - y;
    }

    return { x, y };
  }, [flipX, flipY]);

  const smoothPointRef = useRef<{ x: number; y: number } | null>(null);
  const currentBrushSizeRef = useRef<number>(14);

  // Draw Smooth Curve Segment between points with Tool Specific rendering
  const drawCurveSegment = useCallback((
    ctx: CanvasRenderingContext2D,
    pStart: { x: number; y: number },
    pCtrl: { x: number; y: number },
    pEnd: { x: number; y: number },
    tool: StrokeTool,
    colorHex: string,
    size: number,
    opacity: number
  ) => {
    ctx.save();

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = Math.max(1, size * 1.5);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.quadraticCurveTo(pCtrl.x, pCtrl.y, pEnd.x, pEnd.y);
      ctx.stroke();
    } else if (tool === 'pen') {
      ctx.globalCompositeOperation = strokeBlendMode;
      ctx.strokeStyle = colorHex;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = Math.max(1, size * 0.45);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.quadraticCurveTo(pCtrl.x, pCtrl.y, pEnd.x, pEnd.y);
      ctx.stroke();
    } else if (tool === 'marker') {
      ctx.globalCompositeOperation = strokeBlendMode;
      ctx.strokeStyle = colorHex;
      ctx.globalAlpha = Math.min(1, opacity * 0.45);
      ctx.lineWidth = Math.max(2, size * 1.25);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.quadraticCurveTo(pCtrl.x, pCtrl.y, pEnd.x, pEnd.y);
      ctx.stroke();
    } else if (tool === 'rainbow') {
      ctx.globalCompositeOperation = strokeBlendMode;
      const currentHue = (rainbowHue + 4) % 360;
      setRainbowHue(currentHue);
      ctx.strokeStyle = `hsl(${currentHue}, 90%, 60%)`;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.quadraticCurveTo(pCtrl.x, pCtrl.y, pEnd.x, pEnd.y);
      ctx.stroke();
    } else if (tool === 'spray') {
      ctx.globalCompositeOperation = strokeBlendMode;
      ctx.fillStyle = colorHex;
      ctx.globalAlpha = opacity * 0.45;
      const density = Math.floor(Math.max(4, size * 1.6));
      for (let i = 0; i < density; i++) {
        const t = Math.random();
        // Quadratic bezier interpolation point
        const bx = (1 - t) * (1 - t) * pStart.x + 2 * (1 - t) * t * pCtrl.x + t * t * pEnd.x;
        const by = (1 - t) * (1 - t) * pStart.y + 2 * (1 - t) * t * pCtrl.y + t * t * pEnd.y;
        const offsetR = Math.random() * size * 0.85;
        const angle = Math.random() * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(
          bx + Math.cos(angle) * offsetR,
          by + Math.sin(angle) * offsetR,
          Math.random() * 1.5 + 0.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    } else if (tool === 'calligraphy') {
      ctx.globalCompositeOperation = strokeBlendMode;
      ctx.strokeStyle = colorHex;
      ctx.fillStyle = colorHex;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = Math.max(2, size * 0.45);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.quadraticCurveTo(pCtrl.x, pCtrl.y, pEnd.x, pEnd.y);
      ctx.stroke();

      const dx = pEnd.x - pStart.x;
      const dy = pEnd.y - pStart.y;
      const angle = Math.atan2(dy, dx);
      const ribbonWidth = Math.max(2, size * Math.abs(Math.sin(angle + Math.PI / 4)));
      ctx.beginPath();
      ctx.arc(pEnd.x, pEnd.y, ribbonWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (tool === 'smudge') {
      try {
        const dpr = window.devicePixelRatio || 1;
        const radius = Math.max(5, size * 0.9);
        const sourceRadius = radius * 1.2;

        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = Math.min(0.85, opacity * 0.7);

        // Clip to circular soft feathered brush at destination
        ctx.beginPath();
        ctx.arc(pEnd.x, pEnd.y, radius, 0, Math.PI * 2);
        ctx.clip();

        // Sample directly from canvas without CPU roundtrip (GPU accelerated texture blit)
        const sx = Math.max(0, (pStart.x - sourceRadius) * dpr);
        const sy = Math.max(0, (pStart.y - sourceRadius) * dpr);
        const sw = Math.min(ctx.canvas.width - sx, sourceRadius * 2 * dpr);
        const sh = Math.min(ctx.canvas.height - sy, sourceRadius * 2 * dpr);

        if (sw > 0 && sh > 0) {
          ctx.drawImage(
            ctx.canvas,
            sx, sy, sw, sh,
            pEnd.x - radius, pEnd.y - radius, radius * 2, radius * 2
          );
        }

        // Feathered blend with active pigment so smudging mixes colors realistically
        const grad = ctx.createRadialGradient(
          pEnd.x, pEnd.y, 0,
          pEnd.x, pEnd.y, radius
        );
        grad.addColorStop(0, colorHex);
        grad.addColorStop(0.5, `${colorHex}55`);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.globalAlpha = Math.min(0.3, opacity * 0.25);
        ctx.fillRect(pEnd.x - radius, pEnd.y - radius, radius * 2, radius * 2);

        ctx.restore();
      } catch {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = colorHex;
        ctx.globalAlpha = opacity * 0.2;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.quadraticCurveTo(pCtrl.x, pCtrl.y, pEnd.x, pEnd.y);
        ctx.stroke();
      }
    } else {
      // Default 'brush': Soft silky smooth curved stroke with zero gaps
      ctx.globalCompositeOperation = strokeBlendMode;
      ctx.strokeStyle = colorHex;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.quadraticCurveTo(pCtrl.x, pCtrl.y, pEnd.x, pEnd.y);
      ctx.stroke();
    }

    ctx.restore();
  }, [rainbowHue, strokeBlendMode]);

  // Backward compatible segment connector
  const drawSegment = useCallback((
    ctx: CanvasRenderingContext2D,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    tool: StrokeTool,
    colorHex: string,
    baseSize: number,
    opacity: number
  ) => {
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    drawCurveSegment(ctx, p1, mid, p2, tool, colorHex, baseSize, opacity);
  }, [drawCurveSegment]);

  // Draw Initial Touch/Click Dab (Dot)
  const drawSymmetricDot = useCallback((
    ctx: CanvasRenderingContext2D,
    pt: { x: number; y: number },
    w: number,
    h: number,
    tool = brushTool,
    color = customHex,
    size = brushSize,
    opacity = brushOpacity
  ) => {
    const drawDot = (p: { x: number; y: number }) => {
      ctx.save();
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, size / 2), 0, Math.PI * 2);
        ctx.fill();
      } else if (tool === 'smudge') {
        ctx.globalCompositeOperation = 'source-over';
        const r = Math.max(4, size / 2);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        grad.addColorStop(0, color);
        grad.addColorStop(0.5, `${color}66`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalAlpha = Math.min(0.4, opacity * 0.35);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalCompositeOperation = strokeBlendMode;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, size / 2), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    drawDot(pt);

    if (stencilMode === 'mirror' || stencilMode === 'quad' || stencilMode === 'mandala' || stencilMode === 'kaleidoscope') {
      drawDot({ x: w - pt.x, y: pt.y });
    }
    if (stencilMode === 'quad' || stencilMode === 'mandala' || stencilMode === 'kaleidoscope') {
      drawDot({ x: pt.x, y: h - pt.y });
      drawDot({ x: w - pt.x, y: h - pt.y });
    }
    if (stencilMode === 'mandala' || stencilMode === 'kaleidoscope') {
      const rotations = stencilMode === 'kaleidoscope' ? 12 : 8;
      const cx = w / 2;
      const cy = h / 2;
      for (let i = 1; i < rotations; i++) {
        const angle = (i * Math.PI * 2) / rotations;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        drawDot({
          x: cx + (pt.x - cx) * cos - (pt.y - cy) * sin,
          y: cy + (pt.x - cx) * sin + (pt.y - cy) * cos,
        });
      }
    }
  }, [brushOpacity, brushSize, brushTool, customHex, stencilMode, strokeBlendMode]);

  // Apply Stencil Symmetry across canvas for smooth curves
  const drawSymmetricCurve = useCallback((
    ctx: CanvasRenderingContext2D,
    pStart: { x: number; y: number },
    pCtrl: { x: number; y: number },
    pEnd: { x: number; y: number },
    w: number,
    h: number,
    tool = brushTool,
    color = customHex,
    size = brushSize,
    opacity = brushOpacity
  ) => {
    const cx = w / 2;
    const cy = h / 2;

    const draw = (
      s: { x: number; y: number },
      c: { x: number; y: number },
      e: { x: number; y: number }
    ) => {
      drawCurveSegment(ctx, s, c, e, tool, color, size, opacity);
    };

    // Primary stroke
    draw(pStart, pCtrl, pEnd);

    if (stencilMode === 'mirror' || stencilMode === 'quad' || stencilMode === 'mandala' || stencilMode === 'kaleidoscope') {
      // Mirror X
      draw(
        { x: w - pStart.x, y: pStart.y },
        { x: w - pCtrl.x, y: pCtrl.y },
        { x: w - pEnd.x, y: pEnd.y }
      );
    }

    if (stencilMode === 'quad' || stencilMode === 'mandala' || stencilMode === 'kaleidoscope') {
      // Mirror Y
      draw(
        { x: pStart.x, y: h - pStart.y },
        { x: pCtrl.x, y: h - pCtrl.y },
        { x: pEnd.x, y: h - pEnd.y }
      );
      // Mirror XY
      draw(
        { x: w - pStart.x, y: h - pStart.y },
        { x: w - pCtrl.x, y: h - pCtrl.y },
        { x: w - pEnd.x, y: h - pEnd.y }
      );
    }

    if (stencilMode === 'mandala' || stencilMode === 'kaleidoscope') {
      const rotations = stencilMode === 'kaleidoscope' ? 12 : 8;
      for (let i = 1; i < rotations; i++) {
        const angle = (i * Math.PI * 2) / rotations;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const rotatePt = (p: { x: number; y: number }) => ({
          x: cx + (p.x - cx) * cos - (p.y - cy) * sin,
          y: cy + (p.x - cx) * sin + (p.y - cy) * cos,
        });

        draw(rotatePt(pStart), rotatePt(pCtrl), rotatePt(pEnd));
      }
    }
  }, [brushOpacity, brushSize, brushTool, customHex, drawCurveSegment, stencilMode]);

  // Backward compatible symmetric segment connector
  const drawSymmetricSegment = useCallback((
    ctx: CanvasRenderingContext2D,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    w: number,
    h: number
  ) => {
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    drawSymmetricCurve(ctx, p1, mid, p2, w, h);
  }, [drawSymmetricCurve]);

  // Real-time Collaboration: Sync remote strokes, canvas clear, and cursors
  useEffect(() => {
    const handleRemoteStroke = (stroke: RemoteStroke) => {
      const canvas = canvasRef.current;
      if (!canvas || !stroke.points || stroke.points.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pts = stroke.points;
      const tool = (stroke.tool as StrokeTool) || 'brush';
      const color = stroke.color;
      const size = stroke.size || 12;
      const opacity = stroke.opacity ?? 0.8;

      if (pts.length === 1) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, Math.max(1, size / 2), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }

      let lastMid = pts[0];
      for (let i = 1; i < pts.length; i++) {
        const pPrev = pts[i - 1];
        const pCurr = pts[i];
        const mid = { x: (pPrev.x + pCurr.x) / 2, y: (pPrev.y + pCurr.y) / 2 };
        drawCurveSegment(ctx, lastMid, pPrev, mid, tool, color, size, opacity);
        lastMid = mid;
      }
      const lastPt = pts[pts.length - 1];
      drawCurveSegment(ctx, lastMid, lastPt, lastPt, tool, color, size, opacity);
    };

    const handleRemoteClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const displayWidth = parseFloat(canvas.style.width) || canvas.width;
      const displayHeight = parseFloat(canvas.style.height) || canvas.height;
      ctx.fillStyle = getPaperBgColor(paperTexture);
      ctx.fillRect(0, 0, displayWidth, displayHeight);
    };

    const handleRemoteCursor = (data: any) => {
      if (data.tab === 'studio' && data.user) {
        setRemoteCanvasCursors((prev) => {
          const filtered = prev.filter((c) => c.id !== data.user.id);
          return [
            ...filtered,
            {
              id: data.user.id,
              name: data.user.name,
              color: data.user.color,
              x: data.x,
              y: data.y,
            },
          ];
        });
      }
    };

    collaborationService.on('stroke', handleRemoteStroke);
    collaborationService.on('clear_canvas', handleRemoteClear);
    collaborationService.on('cursor', handleRemoteCursor);

    return () => {
      collaborationService.off('stroke', handleRemoteStroke);
      collaborationService.off('clear_canvas', handleRemoteClear);
      collaborationService.off('cursor', handleRemoteCursor);
    };
  }, [drawCurveSegment, getPaperBgColor, paperTexture]);

  // Pointer Handlers with Continuous Smooth Spline Engine
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);

    const pt = getCanvasCoords(e);

    if (brushTool === 'bucket') {
      handleFloodFill(pt.x, pt.y);
      return;
    }

    if (brushTool === 'eyedropper') {
      handleEyedropper(pt.x, pt.y);
      return;
    }

    if (brushTool === 'stamp') {
      handlePlaceStamp(pt.x, pt.y);
      return;
    }

    isDrawingRef.current = true;
    prevPtRef.current = pt;
    prevMidPtRef.current = pt;
    smoothPointRef.current = pt;
    currentBrushSizeRef.current = brushSize;
    currentLocalStrokeRef.current = [pt];

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const displayWidth = parseFloat(canvas.style.width) || canvas.width;
        const displayHeight = parseFloat(canvas.style.height) || canvas.height;
        drawSymmetricDot(ctx, pt, displayWidth, displayHeight, brushTool, customHex, brushSize, brushOpacity);
      }
    }

    audioSynth.startPaintSound({
      rgb: hexToRgb(customHex),
      speed: 10,
      tool: brushTool,
      brushSize,
      brushOpacity,
      stencilMode,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rawPt = getCanvasCoords(e);

    // Broadcast cursor position in studio tab throttled (~50ms)
    const now = Date.now();
    if (now - lastCanvasCursorBroadcastRef.current > 50) {
      lastCanvasCursorBroadcastRef.current = now;
      collaborationService.sendCursor(rawPt.x, rawPt.y, 'studio');
    }

    if (!isDrawingRef.current) return;
    e.preventDefault();

    // StreamLine filter stabilizer for buttery curved paths
    let pt = rawPt;
    if (smoothingLevel !== 'off') {
      const weight = smoothingLevel === 'high' ? 0.2 : smoothingLevel === 'medium' ? 0.42 : 0.72;
      if (!smoothPointRef.current) {
        smoothPointRef.current = rawPt;
      }
      smoothPointRef.current = {
        x: smoothPointRef.current.x + (rawPt.x - smoothPointRef.current.x) * weight,
        y: smoothPointRef.current.y + (rawPt.y - smoothPointRef.current.y) * weight,
      };
      pt = smoothPointRef.current;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayWidth = parseFloat(canvas.style.width) || canvas.width;
    const displayHeight = parseFloat(canvas.style.height) || canvas.height;

    const pPrev = prevPtRef.current || pt;
    const pMidPrev = prevMidPtRef.current || pPrev;

    // Calculate next midpoint
    const mid = {
      x: (pPrev.x + pt.x) / 2,
      y: (pPrev.y + pt.y) / 2,
    };

    const dist = Math.hypot(pt.x - pPrev.x, pt.y - pPrev.y);

    // Velocity taper with smooth exponential blend
    if (speedDynamics) {
      const targetScale = Math.max(0.76, Math.min(1.22, 1.15 - dist / 55));
      const targetSize = brushSize * targetScale;
      currentBrushSizeRef.current = currentBrushSizeRef.current
        ? currentBrushSizeRef.current * 0.75 + targetSize * 0.25
        : targetSize;
    } else {
      currentBrushSizeRef.current = brushSize;
    }
    const effectiveSize = currentBrushSizeRef.current;

    // Draw C1-continuous smooth quadratic spline from pMidPrev through pPrev to mid
    drawSymmetricCurve(
      ctx,
      pMidPrev,
      pPrev,
      mid,
      displayWidth,
      displayHeight,
      brushTool,
      customHex,
      effectiveSize,
      brushOpacity
    );

    audioSynth.updatePaintSound({
      rgb: hexToRgb(customHex),
      speed: dist,
      tool: brushTool,
      brushSize: effectiveSize,
      brushOpacity,
      stencilMode,
    });

    prevMidPtRef.current = mid;
    prevPtRef.current = pt;
    currentLocalStrokeRef.current.push(pt);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    canvasRef.current?.releasePointerCapture(e.pointerId);

    const canvas = canvasRef.current;
    if (canvas && prevPtRef.current && prevMidPtRef.current) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const displayWidth = parseFloat(canvas.style.width) || canvas.width;
        const displayHeight = parseFloat(canvas.style.height) || canvas.height;
        // Finish final segment to tip
        drawSymmetricCurve(
          ctx,
          prevMidPtRef.current,
          prevPtRef.current,
          prevPtRef.current,
          displayWidth,
          displayHeight,
          brushTool,
          customHex,
          currentBrushSizeRef.current || brushSize,
          brushOpacity
        );
      }
    }

    isDrawingRef.current = false;
    prevPtRef.current = null;
    prevMidPtRef.current = null;
    smoothPointRef.current = null;
    pointsQueueRef.current = [];

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (currentLocalStrokeRef.current.length > 0) {
      collaborationService.sendStroke({
        points: currentLocalStrokeRef.current,
        color: customHex,
        size: brushSize,
        opacity: brushOpacity,
        tool: brushTool,
        stencilMode,
      });
    }
    currentLocalStrokeRef.current = [];

    audioSynth.stopPaintSound();
    pushUndoState();
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing if active in input field
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toLowerCase();

      if (e.ctrlKey || e.metaKey) {
        if (key === 'z') {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
          return;
        }
        if (key === 'y') {
          e.preventDefault();
          handleRedo();
          return;
        }
      }

      if (key === 'b') setBrushTool('brush');
      else if (key === 'p') setBrushTool('pen');
      else if (key === 'm') setBrushTool('marker');
      else if (key === 's') setBrushTool('spray');
      else if (key === 'c') setBrushTool('calligraphy');
      else if (key === 'u') setBrushTool('smudge');
      else if (key === 'r') setBrushTool('rainbow');
      else if (key === 'g') setBrushTool('stamp');
      else if (key === 'f') setBrushTool('bucket');
      else if (key === 'i') setBrushTool('eyedropper');
      else if (key === 'e') setBrushTool('eraser');
      else if (key === 'h') setFlipX((prev) => !prev);
      else if (key === 'v') setFlipY((prev) => !prev);
      else if (key === 'x') {
        setBrushTool((prev) => (prev === 'eraser' ? 'brush' : 'eraser'));
      } else if (key === '[') setBrushSize((s) => Math.max(2, s - 3));
      else if (key === ']') setBrushSize((s) => Math.min(80, s + 3));
      else if (key === 'delete' || key === 'backspace') handleClearCanvas();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClearCanvas, handleRedo, handleUndo]);

  // Export Artwork PNG (combines paint layer and outline layer)
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      let exportDataUrl = '';
      if (outlineOverlayRef.current && outlineOnTop && selectedTemplate.id !== 'blank') {
        const mergeCanvas = document.createElement('canvas');
        mergeCanvas.width = canvas.width;
        mergeCanvas.height = canvas.height;
        const mergeCtx = mergeCanvas.getContext('2d');
        if (mergeCtx) {
          mergeCtx.drawImage(canvas, 0, 0);
          mergeCtx.drawImage(outlineOverlayRef.current, 0, 0);
          exportDataUrl = mergeCanvas.toDataURL('image/png');
        }
      }
      if (!exportDataUrl) {
        exportDataUrl = canvas.toDataURL('image/png');
      }

      const link = document.createElement('a');
      link.download = `infinite-colour-${selectedTemplate.id !== 'blank' ? selectedTemplate.id : 'masterpiece'}-${Date.now()}.png`;
      link.href = exportDataUrl;
      link.click();

      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
      });
      audioSynth.playUnlock();
    } catch {
      // Ignore
    }
  };

  // Copy Canvas to Clipboard with multi-tier fallback (Promise ClipboardItem -> Direct Blob -> Data URL -> Download)
  const handleCopyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      let targetCanvas: HTMLCanvasElement = canvas;
      if (outlineOverlayRef.current && outlineOnTop && selectedTemplate.id !== 'blank') {
        const mergeCanvas = document.createElement('canvas');
        mergeCanvas.width = canvas.width;
        mergeCanvas.height = canvas.height;
        const mergeCtx = mergeCanvas.getContext('2d');
        if (mergeCtx) {
          mergeCtx.drawImage(canvas, 0, 0);
          mergeCtx.drawImage(outlineOverlayRef.current, 0, 0);
          targetCanvas = mergeCanvas;
        }
      }

      // Tier 1: Modern Promise-based ClipboardItem (keeps transient user gesture active in Chrome/Edge/Safari)
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
        try {
          const blobPromise = new Promise<Blob>((resolve, reject) => {
            targetCanvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('toBlob failed'));
            }, 'image/png');
          });

          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blobPromise })
          ]);
          setCopiedNotification('Artwork PNG copied to clipboard! (Ctrl+V to paste)');
          audioSynth.playPop();
          setTimeout(() => setCopiedNotification(null), 2500);
          return;
        } catch (itemErr) {
          console.warn('Promise ClipboardItem write failed, trying awaited blob write:', itemErr);
          const blob = await new Promise<Blob | null>((resolve) => targetCanvas.toBlob(resolve, 'image/png'));
          if (blob) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);
              setCopiedNotification('Artwork PNG copied to clipboard! (Ctrl+V to paste)');
              audioSynth.playPop();
              setTimeout(() => setCopiedNotification(null), 2500);
              return;
            } catch (blobErr) {
              console.warn('Direct blob write failed:', blobErr);
            }
          }
        }
      }

      // Tier 2: Text clipboard fallback with Data-URL
      const dataUrl = targetCanvas.toDataURL('image/png');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(dataUrl);
        setCopiedNotification('Image Data-URL copied to clipboard!');
        audioSynth.playPop();
        setTimeout(() => setCopiedNotification(null), 2500);
        return;
      }

      // Tier 3: Trigger PNG download
      handleExportPNG();
      setCopiedNotification('Downloaded artwork PNG!');
      setTimeout(() => setCopiedNotification(null), 2500);
    } catch (err) {
      console.error('All copy to clipboard strategies failed:', err);
      handleExportPNG();
      setCopiedNotification('Downloaded artwork PNG!');
      setTimeout(() => setCopiedNotification(null), 2500);
    }
  };

  // Support pasting images from clipboard (Ctrl+V) directly onto canvas
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Don't intercept paste inside text inputs
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (!file) continue;

          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;

              pushUndoState();

              const displayWidth = parseFloat(canvas.style.width) || canvas.width;
              const displayHeight = parseFloat(canvas.style.height) || canvas.height;

              // Fit nicely on canvas
              const maxW = displayWidth * 0.85;
              const maxH = displayHeight * 0.85;
              let drawW = img.width;
              let drawH = img.height;

              const scale = Math.min(maxW / drawW, maxH / drawH, 1);
              drawW *= scale;
              drawH *= scale;

              const posX = (displayWidth - drawW) / 2;
              const posY = (displayHeight - drawH) / 2;

              ctx.save();
              ctx.globalCompositeOperation = 'source-over';
              ctx.globalAlpha = 1;
              ctx.drawImage(img, posX, posY, drawW, drawH);
              ctx.restore();

              pushUndoState();
              audioSynth.playPop();
              setCopiedNotification('Pasted image onto canvas!');
              setTimeout(() => setCopiedNotification(null), 2500);
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [pushUndoState]);

  return (
    <div className={`flex-1 flex flex-col h-full relative overflow-hidden select-none ${
      isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-black'
    }`}>
      
      {/* Studio Header Toolbar */}
      <div className={`h-12 border-b-2 px-3 flex items-center justify-between gap-2 shrink-0 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-black'
      }`}>
        {/* Left: Tool Selection Pill */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar">
          {[
            { id: 'brush', label: 'Brush', icon: Paintbrush, shortcut: 'B' },
            { id: 'pen', label: 'Pen', icon: PenTool, shortcut: 'P' },
            { id: 'marker', label: 'Marker', icon: Highlighter, shortcut: 'M' },
            { id: 'spray', label: 'Spray', icon: Sparkles, shortcut: 'S' },
            { id: 'calligraphy', label: 'Chisel', icon: Brush, shortcut: 'C' },
            { id: 'smudge', label: 'Smudge', icon: Hand, shortcut: 'U' },
            { id: 'rainbow', label: 'Rainbow', icon: Wand2, shortcut: 'R' },
            { id: 'stamp', label: 'Stamp', icon: Smile, shortcut: 'G' },
            { id: 'bucket', label: 'Fill', icon: PaintBucket, shortcut: 'F' },
            { id: 'eyedropper', label: 'Picker', icon: Pipette, shortcut: 'I' },
            { id: 'eraser', label: 'Eraser', icon: Eraser, shortcut: 'E' },
          ].map((tool) => {
            const Icon = tool.icon;
            const isActive = brushTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setBrushTool(tool.id as StrokeTool);
                  audioSynth.playPop();
                }}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase border-2 shadow-[2px_2px_0px_0px_#000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shrink-0 ${
                  isActive
                    ? 'bg-yellow-300 text-black border-black'
                    : isDarkMode
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-white text-slate-800 border-black hover:bg-slate-100'
                }`}
                title={`${tool.label} (${tool.shortcut})`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tool.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Studio Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setFlipX((f) => !f)}
            className={`p-1.5 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
              flipX ? 'bg-amber-300 text-black' : 'bg-white text-black hover:bg-slate-100'
            }`}
            title="Flip View Horizontally (H)"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setFlipY((f) => !f)}
            className={`p-1.5 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
              flipY ? 'bg-amber-300 text-black' : 'bg-white text-black hover:bg-slate-100'
            }`}
            title="Flip View Vertically (V)"
          >
            <FlipVertical className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowTemplatesModal(true)}
            className="px-2.5 py-1 text-xs font-black uppercase bg-pink-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-pink-400 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Outlines</span>
          </button>

          <button
            onClick={handleUndo}
            disabled={undoStack.length <= 1}
            className={`p-1.5 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
              undoStack.length <= 1 ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-400' : 'bg-white text-black hover:bg-slate-100'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className={`p-1.5 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
              redoStack.length === 0 ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-400' : 'bg-white text-black hover:bg-slate-100'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleClearCanvas}
            className="p-1.5 border-2 border-black bg-red-400 text-black hover:bg-red-500 font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            title="Clear Canvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExportPNG}
            className="px-2.5 py-1 text-xs font-black uppercase bg-cyan-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-cyan-400 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1"
            title="Download Artwork PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Export</span>
          </button>

          <button
            onClick={() => setShowShortcutsModal(true)}
            className="p-1.5 border-2 border-black bg-yellow-300 text-black hover:bg-yellow-400 font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            title="Studio Controls & Shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-2 md:p-4">
          <div className="relative w-full h-full border-2 border-slate-900 dark:border-slate-700 shadow-md bg-white rounded-xl overflow-hidden flex items-center justify-center">
            
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="touch-none cursor-crosshair w-full h-full block"
              style={{ transform: `scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})` }}
            />

            {/* Top-layer Outline Overlay Canvas (Keeps lines razor-sharp above color) */}
            <canvas
              ref={outlineOverlayRef}
              className="absolute inset-0 pointer-events-none touch-none w-full h-full block"
              style={{ transform: `scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})` }}
            />

            {/* Remote Collaborator Cursors in Studio */}
            {remoteCanvasCursors.map((cursor) => (
              <div
                key={cursor.id}
                className="absolute pointer-events-none z-30 transition-all duration-75 flex items-center gap-1.5"
                style={{
                  left: `${cursor.x}px`,
                  top: `${cursor.y}px`,
                  transform: 'translate(-2px, -2px)',
                }}
              >
                <MousePointer2
                  className="w-4 h-4 -rotate-45 drop-shadow-md"
                  style={{ color: cursor.color, fill: cursor.color }}
                />
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white shadow-sm border border-black/20 select-none whitespace-nowrap"
                  style={{ backgroundColor: cursor.color }}
                >
                  {cursor.name}
                </span>
              </div>
            ))}

            {/* View Flip Active Indicator Badge */}
            {(flipX || flipY) && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-amber-300 text-black border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]">
                <span>Flipped {flipX && 'Horizontal'} {flipY && 'Vertical'}</span>
                <button
                  onClick={() => { setFlipX(false); setFlipY(false); }}
                  className="ml-1 hover:text-red-600 font-bold"
                  title="Reset View"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Floating Quick Swatch Overlay (Bottom Right) */}
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-xs border-2 border-black p-1.5 shadow-[3px_3px_0px_0px_#000]">
              <div 
                className="w-7 h-7 rounded-full border-2 border-black shadow-inner shrink-0"
                style={{ backgroundColor: customHex }}
              />
              <span className="font-mono text-xs font-black text-black uppercase tracking-wider">{customHex}</span>
              <input 
                type="color" 
                value={customHex}
                onChange={(e) => setCustomHex(e.target.value)}
                className="w-6 h-6 p-0 border-0 cursor-pointer opacity-0 absolute"
              />
            </div>

            {/* Outline Controls Panel when a template is active */}
            {selectedTemplate.id !== 'blank' && (
              <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs text-black dark:text-white border-2 border-slate-900 dark:border-slate-700 rounded-lg p-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] max-w-[90%]">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 rounded text-xs font-black uppercase">
                  <span>{selectedTemplate.emoji}</span>
                  <span className="truncate max-w-[120px]">{selectedTemplate.name}</span>
                </div>

                {/* Keep on Top Toggle */}
                <button
                  onClick={() => setOutlineOnTop((prev) => !prev)}
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border transition-all flex items-center gap-1 ${
                    outlineOnTop
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                  title="When active, the crisp black outline stays on top of your brush strokes like a real coloring book"
                >
                  <Eye className="w-3 h-3" />
                  <span>{outlineOnTop ? 'Outline: Over Color' : 'Outline: Flat'}</span>
                </button>

                {/* Outline Weight Options */}
                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setOutlineLineWidth(2)}
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${outlineLineWidth === 2 ? 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-xs' : 'text-slate-500'}`}
                    title="Fine line weight"
                  >
                    Fine
                  </button>
                  <button
                    onClick={() => setOutlineLineWidth(3.5)}
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${outlineLineWidth === 3.5 ? 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-xs' : 'text-slate-500'}`}
                    title="Medium line weight"
                  >
                    Med
                  </button>
                  <button
                    onClick={() => setOutlineLineWidth(5)}
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${outlineLineWidth === 5 ? 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-xs' : 'text-slate-500'}`}
                    title="Thick line weight"
                  >
                    Bold
                  </button>
                </div>

                {/* Outline Color Style Options */}
                <div className="flex items-center gap-1 pl-1">
                  <button
                    onClick={() => setOutlineColorStyle('dark')}
                    className={`w-4 h-4 rounded-full bg-slate-900 border ${outlineColorStyle === 'dark' ? 'ring-2 ring-pink-500' : 'border-slate-300'}`}
                    title="Ink Black outline"
                  />
                  <button
                    onClick={() => setOutlineColorStyle('gold')}
                    className={`w-4 h-4 rounded-full bg-amber-500 border ${outlineColorStyle === 'gold' ? 'ring-2 ring-pink-500' : 'border-slate-300'}`}
                    title="Gold Alchemical outline"
                  />
                  <button
                    onClick={() => setOutlineColorStyle('indigo')}
                    className={`w-4 h-4 rounded-full bg-blue-600 border ${outlineColorStyle === 'indigo' ? 'ring-2 ring-pink-500' : 'border-slate-300'}`}
                    title="Indigo blueprint outline"
                  />
                  <button
                    onClick={() => setOutlineColorStyle('white')}
                    className={`w-4 h-4 rounded-full bg-white border ${outlineColorStyle === 'white' ? 'ring-2 ring-pink-500' : 'border-slate-400'}`}
                    title="Chalk White outline"
                  />
                </div>

                {/* Dismiss / Freehand button */}
                <button
                  onClick={() => handleSelectTemplate(CANVAS_TEMPLATES[0])}
                  className="ml-auto px-1.5 py-0.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
                  title="Remove template and switch to blank freehand canvas"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Copy / Action Notification Toast */}
            {copiedNotification && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-green-300 text-black border-2 border-black px-3.5 py-1.5 font-black text-xs uppercase shadow-[4px_4px_0px_0px_#000] animate-bounce flex items-center gap-1.5 max-w-[90%] text-center">
                <Check className="w-4 h-4 shrink-0" />
                <span>{copiedNotification}</span>
              </div>
            )}
          </div>
        </div>

        {/* Studio Control Sidebar (Right Side on Desktop / Bottom Bar on Mobile) */}
        <div className={`w-full md:w-80 border-t-2 md:border-t-0 md:border-l-2 p-3 flex flex-col gap-3 overflow-y-auto shrink-0 ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-black text-black'
        }`}>
          
          {/* Section 1: Color Palette & Pigment Inventory */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-yellow-500" />
                <h4 className="font-black text-xs uppercase tracking-wider">Discovered Pigments</h4>
              </div>
              <span className="text-[10px] font-mono font-bold bg-yellow-300 text-black px-1.5 py-0.5 border border-black">
                {unlockedColors.length}
              </span>
            </div>

            {/* Swatch Grid */}
            <div className="grid grid-cols-7 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-50 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              {unlockedColors.map((color) => {
                const isSelected = customHex.toLowerCase() === color.hex.toLowerCase();
                return (
                  <button
                    key={color.id}
                    onClick={() => {
                      setCustomHex(color.hex);
                      onSelectColor(color);
                      audioSynth.playPop();
                    }}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center text-[10px] shadow-[1px_1px_0px_0px_#000] ${
                      isSelected ? 'border-black ring-2 ring-yellow-400 scale-110 font-bold' : 'border-black/50'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={`${color.name} (${color.hex})`}
                  >
                    {isSelected && <span className="text-white drop-shadow-md">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Brush Size & Opacity Controls */}
          <div className="space-y-3 bg-amber-50/50 p-3 border-2 border-black shadow-[2px_2px_0px_0px_#000] text-black">
            <div>
              <div className="flex justify-between text-xs font-black uppercase mb-1">
                <span>Stroke Size</span>
                <span className="font-mono">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="80"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-black uppercase mb-1">
                <span>Opacity</span>
                <span className="font-mono">{Math.round(brushOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={brushOpacity}
                onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
            </div>
          </div>

          {/* Section 2.5: Pro Brush Physics & Blend Dynamics */}
          <div className="space-y-2 bg-blue-50/70 p-3 border-2 border-black shadow-[2px_2px_0px_0px_#000] text-black">
            <h5 className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Pro Engine Dynamics</span>
            </h5>

            {/* Blend Mode Selector */}
            <div>
              <label className="block text-[10px] font-black uppercase mb-1 text-slate-700">Blend Mode</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'source-over', label: 'Normal' },
                  { id: 'multiply', label: 'Multiply' },
                  { id: 'screen', label: 'Screen' },
                  { id: 'overlay', label: 'Overlay' },
                  { id: 'color-dodge', label: 'Dodge' },
                ].map((bm) => (
                  <button
                    key={bm.id}
                    onClick={() => {
                      setStrokeBlendMode(bm.id as GlobalCompositeOperation);
                      audioSynth.playPop();
                    }}
                    className={`py-1 px-1 text-[10px] font-black uppercase border border-black shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                      strokeBlendMode === bm.id ? 'bg-yellow-300 text-black font-bold' : 'bg-white text-black hover:bg-slate-100'
                    }`}
                  >
                    {bm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Stabilizer / StreamLine */}
            <div>
              <label className="block text-[10px] font-black uppercase mb-1 text-slate-700">StreamLine Stabilizer</label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'off', label: 'Off' },
                  { id: 'low', label: 'Low' },
                  { id: 'medium', label: 'Med' },
                  { id: 'high', label: 'High' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setSmoothingLevel(st.id as typeof smoothingLevel);
                      audioSynth.playPop();
                    }}
                    className={`py-1 text-[10px] font-black uppercase border border-black shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                      smoothingLevel === st.id ? 'bg-cyan-300 text-black font-bold' : 'bg-white text-black hover:bg-slate-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed Dynamics Toggle */}
            <div className="pt-1 flex items-center justify-between border-t border-slate-300">
              <span className="text-[10px] font-black uppercase text-slate-700">Velocity Taper</span>
              <button
                onClick={() => setSpeedDynamics((v) => !v)}
                className={`px-2 py-0.5 text-[10px] font-black uppercase border border-black shadow-[1px_1px_0px_0px_#000] ${
                  speedDynamics ? 'bg-green-300 text-black' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {speedDynamics ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Section 3: Stamp Picker (If Stamp tool active) */}
          {brushTool === 'stamp' && (
            <div className="space-y-1.5 bg-purple-50 p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] text-black">
              <h5 className="font-black text-xs uppercase">Choose Stamp Badge</h5>
              <div className="flex flex-wrap gap-1">
                {STAMP_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setSelectedStamp(emoji);
                      audioSynth.playPop();
                    }}
                    className={`w-8 h-8 text-base border-2 border-black flex items-center justify-center font-bold shadow-[2px_2px_0px_0px_#000] ${
                      selectedStamp === emoji ? 'bg-yellow-300 scale-110' : 'bg-white hover:bg-slate-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Symmetry & Stencil Modes */}
          <div className="space-y-1.5">
            <h5 className="font-black text-xs uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Symmetry Mirror</span>
            </h5>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'free', label: 'Free' },
                { id: 'mirror', label: '2-Way' },
                { id: 'quad', label: '4-Way' },
                { id: 'mandala', label: '8-Way' },
                { id: 'kaleidoscope', label: '12-Way' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setStencilMode(st.id as typeof stencilMode);
                    audioSynth.playPop();
                  }}
                  className={`py-1 text-[11px] font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                    stencilMode === st.id ? 'bg-purple-300 text-black' : isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-black'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 5: Paper Canvas Texture Selection */}
          <div className="space-y-1.5">
            <h5 className="font-black text-xs uppercase tracking-wider">Canvas Paper</h5>
            <div className="grid grid-cols-5 gap-1">
              {[
                { id: 'white', label: 'White', color: '#FFFFFF' },
                { id: 'dark', label: 'Dark', color: '#0F172A' },
                { id: 'parchment', label: 'Vintage', color: '#FDF6E3' },
                { id: 'grid', label: 'Grid', color: '#E2E8F0' },
                { id: 'glow', label: 'Glow', color: '#050515' },
              ].map((tex) => (
                <button
                  key={tex.id}
                  onClick={() => {
                    setPaperTexture(tex.id as PaperTexture);
                    audioSynth.playPop();
                  }}
                  className={`h-7 border-2 border-black text-[9px] font-black uppercase shadow-[1px_1px_0px_0px_#000] flex items-center justify-center ${
                    paperTexture === tex.id ? 'ring-2 ring-yellow-400 font-bold scale-105' : ''
                  }`}
                  style={{ backgroundColor: tex.color, color: tex.id === 'dark' || tex.id === 'glow' ? '#FFF' : '#000' }}
                  title={tex.label}
                >
                  {tex.label[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="mt-auto pt-2 flex items-center gap-1.5 border-t border-slate-300">
            <button
              onClick={handleCopyToClipboard}
              className="flex-1 py-1.5 bg-yellow-300 text-black font-black uppercase text-xs border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>

        </div>
      </div>

      {/* Outlines / Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn select-none">
          <div className={`relative w-full max-w-2xl border-2 rounded-xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-800 text-black'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-pink-500" />
                <div>
                  <h3 className="font-black text-base uppercase tracking-tight">Artistic Coloring Outlines</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Handcrafted vector drawings with closed paths, ideal for coloring & flood-fill</p>
                </div>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto p-1 max-h-[60vh] pr-2">
              {CANVAS_TEMPLATES.map((tpl) => {
                const isActive = selectedTemplate.id === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`p-3 rounded-lg border-2 text-left flex flex-col gap-2 transition-all hover:-translate-y-0.5 ${
                      isActive
                        ? 'bg-pink-50 dark:bg-pink-950/40 border-pink-500 ring-2 ring-pink-400 shadow-md'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 shadow-xs'
                    }`}
                  >
                    {/* Live Vector Thumbnail */}
                    <div className="relative">
                      <TemplateThumbnail template={tpl} isDarkMode={isDarkMode} />
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5 px-2 py-0.5 bg-pink-500 text-white font-black text-[9px] uppercase rounded-full shadow-xs">
                          Active
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">{tpl.emoji}</span>
                        <span className="text-xs font-black uppercase text-slate-900 dark:text-white truncate">{tpl.name}</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {tpl.category}
                      </span>
                    </div>

                    {tpl.description && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn select-none">
          <div className={`relative w-full max-w-md border-4 p-5 shadow-[8px_8px_0px_0px_#000] space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-black text-black'
          }`}>
            <div className="flex items-center justify-between border-b-2 pb-2 border-black">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-yellow-500" />
                <h3 className="font-black text-base uppercase italic">Studio Shortcuts</h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="w-7 h-7 flex items-center justify-center font-black border-2 border-black bg-white text-black hover:bg-yellow-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-bold">
              {[
                { key: 'B / P / M / S', desc: 'Brush / Pen / Marker / Spray' },
                { key: 'C / U / R / G', desc: 'Chisel / Smudge / Rainbow / Stamp' },
                { key: 'F / I / E', desc: 'Bucket Fill / Eyedropper / Eraser' },
                { key: 'H / V', desc: 'Flip View Horiz / Vert' },
                { key: 'X', desc: 'Swap Brush & Eraser' },
                { key: '[ / ]', desc: 'Decrease / Increase Size' },
                { key: 'Ctrl + Z / Y', desc: 'Undo / Redo' },
                { key: 'Delete', desc: 'Clear Canvas' },
              ].map((sc, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-50 p-2 border border-black text-black">
                  <span className="font-mono bg-yellow-300 px-1.5 py-0.5 border border-black">{sc.key}</span>
                  <span className="text-[11px] uppercase">{sc.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
