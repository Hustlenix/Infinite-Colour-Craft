import React, { useRef, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { ColorItem } from '../types';
import { audioSynth, StrokeTool } from '../utils/audioSynth';
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
  Moon
} from 'lucide-react';

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

  // Custom Color State
  const [customHex, setCustomHex] = useState<string>(activeColor.hex);

  // Undo / Redo Stacks
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);

  // UI Modals
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Keep customHex in sync with activeColor prop
  useEffect(() => {
    setCustomHex(activeColor.hex);
  }, [activeColor]);

  // Convert hex color to RGB
  const hexToRgb = useCallback((hex: string) => {
    const cleanHex = hex.replace('#', '');
    const num = parseInt(cleanHex, 16) || 0;
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }, []);

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
        selectedTemplate.drawOutline(ctx, displayWidth, displayHeight, paperTexture === 'dark' || paperTexture === 'glow');
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
    }
  }, [getPaperBgColor, paperTexture, pushUndoState, selectedTemplate]);

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

    ctx.fillStyle = getPaperBgColor(paperTexture);
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    if (selectedTemplate.id !== 'blank') {
      selectedTemplate.drawOutline(ctx, displayWidth, displayHeight, paperTexture === 'dark' || paperTexture === 'glow');
    }

    pushUndoState();
    audioSynth.playTrash();
  }, [getPaperBgColor, paperTexture, pushUndoState, selectedTemplate]);

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
      template.drawOutline(ctx, displayWidth, displayHeight, paperTexture === 'dark' || paperTexture === 'glow');
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
      audioSynth.playUnlock();
    } else {
      audioSynth.playPop();
    }

    pushUndoState();
  }, [getPaperBgColor, paperTexture, pushUndoState]);

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

  // Get Point Coordinates from Event
  const getCanvasCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Draw Segment between points with Tool Specific rendering
  const drawSegment = useCallback((
    ctx: CanvasRenderingContext2D,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    tool: StrokeTool,
    colorHex: string,
    size: number,
    opacity: number
  ) => {
    ctx.save();

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = size * 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      ctx.stroke();
    } else if (tool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = colorHex;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = Math.max(1, size * 0.4);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      ctx.stroke();
    } else if (tool === 'marker') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = colorHex;
      ctx.globalAlpha = opacity * 0.35; // Translucent marker layer
      ctx.lineWidth = size * 1.2;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'bevel';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    } else if (tool === 'spray') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = colorHex;
      ctx.globalAlpha = opacity * 0.4;
      const density = Math.floor(size * 1.8);
      for (let i = 0; i < density; i++) {
        const offsetR = Math.random() * size * 0.8;
        const angle = Math.random() * Math.PI * 2;
        const sx = p2.x + Math.cos(angle) * offsetR;
        const sy = p2.y + Math.sin(angle) * offsetR;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (tool === 'calligraphy') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = colorHex;
      ctx.globalAlpha = opacity;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const ribbonWidth = Math.max(2, size * Math.abs(Math.sin(angle + Math.PI / 4)));

      ctx.beginPath();
      ctx.arc(p2.x, p2.y, ribbonWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (tool === 'rainbow') {
      ctx.globalCompositeOperation = 'source-over';
      const currentHue = (rainbowHue + 8) % 360;
      setRainbowHue(currentHue);
      ctx.strokeStyle = `hsl(${currentHue}, 90%, 60%)`;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      ctx.stroke();
    } else {
      // Default 'brush': Soft wet bristle stroke
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = colorHex;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = size * 0.2;
      ctx.shadowColor = colorHex;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      ctx.stroke();
    }

    ctx.restore();
  }, [rainbowHue]);

  // Apply Stencil Symmetry across canvas
  const drawSymmetricSegment = useCallback((
    ctx: CanvasRenderingContext2D,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    w: number,
    h: number
  ) => {
    const cx = w / 2;
    const cy = h / 2;

    const drawPair = (pt1: { x: number; y: number }, pt2: { x: number; y: number }) => {
      drawSegment(ctx, pt1, pt2, brushTool, customHex, brushSize, brushOpacity);
    };

    // Primary
    drawPair(p1, p2);

    if (stencilMode === 'mirror' || stencilMode === 'quad' || stencilMode === 'mandala' || stencilMode === 'kaleidoscope') {
      // Mirror X
      drawPair(
        { x: w - p1.x, y: p1.y },
        { x: w - p2.x, y: p2.y }
      );
    }

    if (stencilMode === 'quad' || stencilMode === 'mandala' || stencilMode === 'kaleidoscope') {
      // Mirror Y
      drawPair(
        { x: p1.x, y: h - p1.y },
        { x: p2.x, y: h - p2.y }
      );
      // Mirror XY
      drawPair(
        { x: w - p1.x, y: h - p1.y },
        { x: w - p2.x, y: h - p2.y }
      );
    }

    if (stencilMode === 'mandala' || stencilMode === 'kaleidoscope') {
      const rotations = stencilMode === 'kaleidoscope' ? 12 : 8;
      for (let i = 1; i < rotations; i++) {
        const angle = (i * Math.PI * 2) / rotations;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const r1 = {
          x: cx + (p1.x - cx) * cos - (p1.y - cy) * sin,
          y: cy + (p1.x - cx) * sin + (p1.y - cy) * cos,
        };
        const r2 = {
          x: cx + (p2.x - cx) * cos - (p2.y - cy) * sin,
          y: cy + (p2.x - cx) * sin + (p2.y - cy) * cos,
        };
        drawPair(r1, r2);
      }
    }
  }, [brushOpacity, brushSize, brushTool, customHex, drawSegment, stencilMode]);

  // Batch Processor for smooth RAF drawing
  const processPointerBatch = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayWidth = parseFloat(canvas.style.width) || canvas.width;
    const displayHeight = parseFloat(canvas.style.height) || canvas.height;

    const queue = pointsQueueRef.current;
    if (queue.length === 0) {
      rafIdRef.current = null;
      return;
    }

    while (queue.length > 0) {
      const pt = queue.shift()!;
      if (!prevPtRef.current) {
        prevPtRef.current = pt;
        continue;
      }

      drawSymmetricSegment(ctx, prevPtRef.current, pt, displayWidth, displayHeight);

      const dx = pt.x - prevPtRef.current.x;
      const dy = pt.y - prevPtRef.current.y;
      const speed = Math.hypot(dx, dy);

      audioSynth.updatePaintSound({
        rgb: hexToRgb(customHex),
        speed,
        tool: brushTool,
        brushSize,
        brushOpacity,
        stencilMode,
      });

      prevPtRef.current = pt;
    }

    rafIdRef.current = requestAnimationFrame(processPointerBatch);
  }, [brushOpacity, brushSize, brushTool, customHex, drawSymmetricSegment, hexToRgb, stencilMode]);

  // Pointer Handlers
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
    pointsQueueRef.current = [pt];

    audioSynth.startPaintSound({
      rgb: hexToRgb(customHex),
      speed: 10,
      tool: brushTool,
      brushSize,
      brushOpacity,
      stencilMode,
    });

    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(processPointerBatch);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const pt = getCanvasCoords(e);
    pointsQueueRef.current.push(pt);

    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(processPointerBatch);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    canvasRef.current?.releasePointerCapture(e.pointerId);

    isDrawingRef.current = false;
    prevPtRef.current = null;
    pointsQueueRef.current = [];

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

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
      else if (key === 'r') setBrushTool('rainbow');
      else if (key === 'g') setBrushTool('stamp');
      else if (key === 'f') setBrushTool('bucket');
      else if (key === 'i') setBrushTool('eyedropper');
      else if (key === 'e') setBrushTool('eraser');
      else if (key === 'x') {
        setBrushTool((prev) => (prev === 'eraser' ? 'brush' : 'eraser'));
      } else if (key === '[') setBrushSize((s) => Math.max(2, s - 3));
      else if (key === ']') setBrushSize((s) => Math.min(80, s + 3));
      else if (key === 'delete' || key === 'backspace') handleClearCanvas();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClearCanvas, handleRedo, handleUndo]);

  // Export Artwork PNG
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const link = document.createElement('a');
      link.download = `infinite-colour-masterpiece-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
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

  // Copy Canvas to Clipboard
  const handleCopyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopiedNotification(true);
        audioSynth.playPop();
        setTimeout(() => setCopiedNotification(false), 2000);
      });
    } catch {
      // Fallback
    }
  };

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
          <div className="relative w-full h-full border-4 border-black shadow-[6px_6px_0px_0px_#000] bg-white overflow-hidden flex items-center justify-center">
            
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="touch-none cursor-crosshair w-full h-full block"
            />

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

            {/* Template Badge Indicator */}
            {selectedTemplate.id !== 'blank' && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-yellow-300 text-black border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]">
                <span>{selectedTemplate.emoji}</span>
                <span>{selectedTemplate.name}</span>
                <button
                  onClick={() => handleSelectTemplate(CANVAS_TEMPLATES[0])}
                  className="ml-1 hover:text-red-600 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Copy Notification Toast */}
            {copiedNotification && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-green-300 text-black border-2 border-black px-3 py-1 font-black text-xs uppercase shadow-[4px_4px_0px_0px_#000] animate-bounce flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>Copied to Clipboard!</span>
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
          <div className={`relative w-full max-w-lg border-4 p-5 shadow-[8px_8px_0px_0px_#000] space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-black text-black'
          }`}>
            <div className="flex items-center justify-between border-b-2 pb-2 border-black">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-pink-500" />
                <h3 className="font-black text-base uppercase italic">Select Outline Template</h3>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="w-7 h-7 flex items-center justify-center font-black border-2 border-black bg-white text-black hover:bg-yellow-300"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
              {CANVAS_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`p-3 border-2 border-black font-black text-left flex flex-col items-center gap-2 shadow-[3px_3px_0px_0px_#000] transition-all hover:scale-105 active:scale-95 ${
                    selectedTemplate.id === tpl.id ? 'bg-pink-300 text-black' : isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-50 text-black'
                  }`}
                >
                  <span className="text-3xl">{tpl.emoji}</span>
                  <div className="text-center">
                    <div className="text-xs uppercase">{tpl.name}</div>
                    <div className="text-[9px] text-slate-500 uppercase">{tpl.category}</div>
                  </div>
                </button>
              ))}
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
                { key: 'C / R / G', desc: 'Chisel / Rainbow / Stamp' },
                { key: 'F / I / E', desc: 'Bucket Fill / Eyedropper / Eraser' },
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
