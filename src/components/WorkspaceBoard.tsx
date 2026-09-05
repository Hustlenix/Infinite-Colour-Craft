import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BoardTile, ColorItem, DailyChallenge, DailyChallengeState } from '../types';
import { blendColors, hexToRgb, rgbToHsl } from '../utils/colorEngine';
import { audioSynth } from '../utils/audioSynth';
import { 
  collaborationService, 
  RemoteTileMove, 
  RemoteTileFuse 
} from '../services/collaborationService';
import { 
  Copy, 
  Trash2, 
  RotateCcw, 
  Grid, 
  Sparkles, 
  Flame, 
  Layers,
  Calendar,
  Zap,
  MousePointer2
} from 'lucide-react';

interface WorkspaceBoardProps {
  tiles: BoardTile[];
  setTiles: React.Dispatch<React.SetStateAction<BoardTile[]>>;
  unlockedColorsMap: Map<string, ColorItem>;
  onDiscoverNewColor: (newColor: ColorItem) => void;
  onSpawnBaseSpectrum: () => void;
  setIsTrashOver: (over: boolean) => void;
  dailyChallenge?: DailyChallenge;
  dailyState?: DailyChallengeState;
  onOpenDailyTab?: () => void;
  isDarkMode?: boolean;
}

export const WorkspaceBoard: React.FC<WorkspaceBoardProps> = ({
  tiles,
  setTiles,
  unlockedColorsMap,
  onDiscoverNewColor,
  onSpawnBaseSpectrum,
  setIsTrashOver,
  dailyChallenge,
  dailyState,
  onOpenDailyTab,
  isDarkMode = false,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const isFusingRef = useRef<boolean>(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [targetFuseTileId, setTargetFuseTileId] = useState<string | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(10);
  const [isAligning, setIsAligning] = useState<boolean>(false);
  const [activeParticles, setActiveParticles] = useState<{
    id: string;
    x: number;
    y: number;
    color: string;
    name: string;
    emoji: string;
  }[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<{
    id: string;
    name: string;
    color: string;
    x: number;
    y: number;
  }[]>([]);
  const lastTileMoveBroadcastRef = useRef<number>(0);
  const lastCursorBroadcastRef = useRef<number>(0);

  // Subscribe to Real-Time Collaboration Events (Supabase / Relay)
  useEffect(() => {
    const handleRemoteTileMove = (data: RemoteTileMove) => {
      setTiles((prev) =>
        prev.map((t) =>
          t.id === data.tileId ? { ...t, x: data.x, y: data.y, zIndex: data.zIndex } : t
        )
      );
    };

    const handleRemoteTileFuse = (data: RemoteTileFuse) => {
      triggerFusionParticles(
        data.x,
        data.y,
        data.resultingColorHex,
        data.resultingColorName,
        data.resultingColorEmoji
      );
      audioSynth.playFuse(180);

      // Auto-unlock if unknown locally
      if (!unlockedColorsMap.has(data.resultingColorHex)) {
        const rgb = hexToRgb(data.resultingColorHex);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const newColor: ColorItem = {
          id: data.resultingColorHex,
          name: data.resultingColorName,
          hex: data.resultingColorHex,
          rgb,
          hsl,
          emoji: data.resultingColorEmoji,
          discoveredAt: Date.now(),
          rarity: 'Rare',
          category: 'Secondary',
        };
        onDiscoverNewColor(newColor);
      }
    };

    const handleRemoteTileSpawn = (tile: BoardTile) => {
      setTiles((prev) => {
        if (prev.some((t) => t.id === tile.id)) return prev;
        return [...prev, tile];
      });
    };

    const handleRemoteTileDelete = (data: { tileId: string }) => {
      setTiles((prev) => prev.filter((t) => t.id !== data.tileId));
    };

    const handleRemoteCursor = (data: any) => {
      if (data.tab === 'board' && data.user) {
        setRemoteCursors((prev) => {
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

    collaborationService.on('tile_move', handleRemoteTileMove);
    collaborationService.on('tile_fuse', handleRemoteTileFuse);
    collaborationService.on('tile_spawn', handleRemoteTileSpawn);
    collaborationService.on('tile_delete', handleRemoteTileDelete);
    collaborationService.on('cursor', handleRemoteCursor);

    return () => {
      collaborationService.off('tile_move', handleRemoteTileMove);
      collaborationService.off('tile_fuse', handleRemoteTileFuse);
      collaborationService.off('tile_spawn', handleRemoteTileSpawn);
      collaborationService.off('tile_delete', handleRemoteTileDelete);
      collaborationService.off('cursor', handleRemoteCursor);
    };
  }, [unlockedColorsMap, onDiscoverNewColor]);

  // Spawn visual particle explosion on fusion
  const triggerFusionParticles = (x: number, y: number, colorHex: string, colorName = 'Pigment', colorEmoji = '✨') => {
    const id = Date.now().toString() + Math.random().toString();
    setActiveParticles((prev) => [...prev, { id, x, y, color: colorHex, name: colorName, emoji: colorEmoji }]);
    setTimeout(() => {
      setActiveParticles((prev) => prev.filter((p) => p.id !== id));
    }, 900);
  };

  // Drag handlers for board tiles
  const handlePointerDown = (e: React.PointerEvent, tile: BoardTile) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    const newZ = maxZIndex + 1;
    setMaxZIndex(newZ);

    setTiles((prev) =>
      prev.map((t) => (t.id === tile.id ? { ...t, zIndex: newZ } : t))
    );

    setActiveDragId(tile.id);
    audioSynth.playPop();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (boardRef.current) {
      const boardRect = boardRef.current.getBoundingClientRect();
      const relX = e.clientX - boardRect.left;
      const relY = e.clientY - boardRect.top;
      const now = Date.now();
      if (now - lastCursorBroadcastRef.current > 50) {
        lastCursorBroadcastRef.current = now;
        collaborationService.sendCursor(relX, relY, 'board');
      }
    }

    if (!activeDragId || !boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const newX = e.clientX - boardRect.left - dragOffset.x;
    const newY = e.clientY - boardRect.top - dragOffset.y;

    // Check collision / overlap with other tiles on board
    let closestTargetId: string | null = null;
    let minDistance = 60; // Collision threshold in px

    tiles.forEach((targetTile) => {
      if (targetTile.id === activeDragId) return;

      const dx = targetTile.x - newX;
      const dy = targetTile.y - newY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDistance) {
        minDistance = dist;
        closestTargetId = targetTile.id;
      }
    });

    setTargetFuseTileId(closestTargetId);

    // Check if dragging near trash zone
    const trashEl = document.getElementById('trash-zone');
    if (trashEl) {
      const trashRect = trashEl.getBoundingClientRect();
      const isOverTrash =
        e.clientX >= trashRect.left &&
        e.clientX <= trashRect.right &&
        e.clientY >= trashRect.top &&
        e.clientY <= trashRect.bottom;
      setIsTrashOver(isOverTrash);
    }

    // Broadcast tile move throttled (~30ms)
    const now = Date.now();
    if (now - lastTileMoveBroadcastRef.current > 30) {
      lastTileMoveBroadcastRef.current = now;
      collaborationService.sendTileMove({
        tileId: activeDragId,
        x: newX,
        y: newY,
        zIndex: maxZIndex,
      });
    }

    // Move current tile
    setTiles((prev) =>
      prev.map((t) => (t.id === activeDragId ? { ...t, x: newX, y: newY } : t))
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!activeDragId || !boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const draggedTile = tiles.find((t) => t.id === activeDragId);
    setActiveDragId(null);

    // Check if dropped in trash zone
    const trashEl = document.getElementById('trash-zone');
    if (trashEl && draggedTile) {
      const trashRect = trashEl.getBoundingClientRect();
      const isOverTrash =
        e.clientX >= trashRect.left &&
        e.clientX <= trashRect.right &&
        e.clientY >= trashRect.top &&
        e.clientY <= trashRect.bottom;

      if (isOverTrash) {
        collaborationService.sendTileDelete(draggedTile.id);
        setTiles((prev) => prev.filter((t) => t.id !== activeDragId));
        audioSynth.playTrash();
        setIsTrashOver(false);
        setTargetFuseTileId(null);
        return;
      }
    }

    setIsTrashOver(false);

    // Perform Fusion if dropped on another tile
    if (targetFuseTileId && draggedTile && !isFusingRef.current) {
      isFusingRef.current = true;
      const targetTile = tiles.find((t) => t.id === targetFuseTileId);

      if (targetTile) {
        const color1 = unlockedColorsMap.get(draggedTile.hex) || {
          id: draggedTile.hex,
          name: draggedTile.name,
          hex: draggedTile.hex,
          rgb: { r: 128, g: 128, b: 128 },
          hsl: { h: 0, s: 0, l: 50 },
          emoji: draggedTile.emoji,
          discoveredAt: Date.now(),
          rarity: 'Common',
          category: 'Base',
        };

        const color2 = unlockedColorsMap.get(targetTile.hex) || {
          id: targetTile.hex,
          name: targetTile.name,
          hex: targetTile.hex,
          rgb: { r: 128, g: 128, b: 128 },
          hsl: { h: 0, s: 0, l: 50 },
          emoji: targetTile.emoji,
          discoveredAt: Date.now(),
          rarity: 'Common',
          category: 'Base',
        };

        // Synthesize new pigment color
        const resultColor = blendColors(color1 as ColorItem, color2 as ColorItem);

        // Sound effect
        audioSynth.playFuse(resultColor.hsl.h);

        // Visual particles at center of target tile
        triggerFusionParticles(targetTile.x + 70, targetTile.y + 22, resultColor.hex, resultColor.name, resultColor.emoji);

        // Broadcast fusion to peers
        collaborationService.sendTileFuse({
          parent1Id: draggedTile.id,
          parent2Id: targetTile.id,
          resultingColorHex: resultColor.hex,
          resultingColorName: resultColor.name,
          resultingColorEmoji: resultColor.emoji,
          x: targetTile.x + 70,
          y: targetTile.y + 22,
        });

        // Check if discovered
        onDiscoverNewColor(resultColor);

        // Replace target tile with fused tile and remove dragged tile
        const newFusedTile: BoardTile = {
          id: Date.now().toString() + Math.random().toString(),
          colorId: resultColor.id,
          name: resultColor.name,
          hex: resultColor.hex,
          emoji: resultColor.emoji,
          x: targetTile.x,
          y: targetTile.y,
          zIndex: maxZIndex + 2,
          isNew: true,
        };

        setTiles((prev) =>
          prev
            .filter((t) => t.id !== draggedTile.id && t.id !== targetTile.id)
            .concat(newFusedTile)
        );
      }

      setTimeout(() => {
        isFusingRef.current = false;
      }, 100);
    } else if (draggedTile) {
      // Clamp tile within board bounds
      const clampedX = Math.max(10, Math.min(boardRect.width - 130, draggedTile.x));
      const clampedY = Math.max(10, Math.min(boardRect.height - 50, draggedTile.y));

      collaborationService.sendTileMove({
        tileId: draggedTile.id,
        x: clampedX,
        y: clampedY,
        zIndex: draggedTile.zIndex,
      });

      setTiles((prev) =>
        prev.map((t) => (t.id === draggedTile.id ? { ...t, x: clampedX, y: clampedY } : t))
      );
    }

    setTargetFuseTileId(null);
  };

  // Drop handler for dragging from sidebar onto board
  const handleBoardDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data || !boardRef.current) return;

    try {
      const color: ColorItem = JSON.parse(data);
      const boardRect = boardRef.current.getBoundingClientRect();
      const newX = e.clientX - boardRect.left - 50;
      const newY = e.clientY - boardRect.top - 20;

      const newZ = maxZIndex + 1;
      setMaxZIndex(newZ);

      const newTile: BoardTile = {
        id: Date.now().toString() + Math.random().toString(),
        colorId: color.id,
        name: color.name,
        hex: color.hex,
        emoji: color.emoji,
        x: Math.max(10, Math.min(boardRect.width - 120, newX)),
        y: Math.max(10, Math.min(boardRect.height - 60, newY)),
        zIndex: newZ,
      };

      setTiles((prev) => [...prev, newTile]);
      audioSynth.playPop();
    } catch {
      // Ignore drop error
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Duplicate / Clone tile on double click
  const handleDoubleClickTile = (tile: BoardTile) => {
    const newZ = maxZIndex + 1;
    setMaxZIndex(newZ);

    const clone: BoardTile = {
      ...tile,
      id: Date.now().toString() + Math.random().toString(),
      x: tile.x + 24,
      y: tile.y + 24,
      zIndex: newZ,
    };

    setTiles((prev) => [...prev, clone]);
    audioSynth.playPop();
  };

  // Delete individual tile
  const handleDeleteTile = (tileId: string) => {
    setTiles((prev) => prev.filter((t) => t.id !== tileId));
    audioSynth.playTrash();
  };

  // Auto align tiles in a neat, non-overlapping grid that respects header & UI controls
  const handleAutoAlign = useCallback(() => {
    if (!boardRef.current) return;
    const boardWidth = boardRef.current.clientWidth || 800;
    const boardHeight = boardRef.current.clientHeight || 600;

    // Start comfortably below the top control bar (y: 82) and leave clean margin on left (x: 28)
    const startX = 28;
    const startY = 82;
    const minColWidth = 180;
    const preferredColWidth = 205;
    const rowHeight = 54;
    const paddingBottom = 24;

    const availableWidth = Math.max(160, boardWidth - startX * 2);
    const availableHeight = Math.max(100, boardHeight - startY - paddingBottom);

    // Trigger smooth layout glide transition for 350ms
    setIsAligning(true);
    setTimeout(() => setIsAligning(false), 360);

    setTiles((prev) => {
      if (prev.length === 0) return prev;
      const totalTiles = prev.length;

      // Calculate max rows and cols that comfortably fit in board without clipping
      const maxRowsThatFit = Math.max(1, Math.floor(availableHeight / rowHeight));
      const maxColsThatFit = Math.max(1, Math.floor(availableWidth / minColWidth));

      // Calculate natural columns based on preferred column width
      let cols = Math.max(1, Math.floor(availableWidth / preferredColWidth));

      // If rows would exceed screen height, expand columns up to maxColsThatFit
      const rowsNeededAtCurrentCols = Math.ceil(totalTiles / cols);
      if (rowsNeededAtCurrentCols > maxRowsThatFit && maxColsThatFit > cols) {
        cols = Math.min(maxColsThatFit, Math.ceil(totalTiles / maxRowsThatFit));
      }

      // Compute actual column step (spacing)
      const colStep = Math.min(
        preferredColWidth,
        Math.max(minColWidth, Math.floor(availableWidth / cols))
      );

      const alignedTiles = prev.map((tile, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const newX = Math.round(startX + col * colStep);
        const newY = Math.round(startY + row * rowHeight);

        return {
          ...tile,
          x: newX,
          y: newY,
        };
      });

      // Broadcast new positions to real-time collaboration peers
      alignedTiles.forEach((t) => {
        collaborationService.sendTileMove({
          tileId: t.id,
          x: t.x,
          y: t.y,
          zIndex: t.zIndex,
        });
      });

      return alignedTiles;
    });

    audioSynth.playPop();
  }, [setTiles]);

  // Keyboard Shortcuts for Workspace Board (A/R = Align, S = Spawn Starter, C/Del = Clear Board)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (!isCtrlOrCmd) {
        if (key === 'a' || key === 'r') {
          e.preventDefault();
          handleAutoAlign();
          return;
        }
        if (key === 's') {
          e.preventDefault();
          onSpawnBaseSpectrum();
          audioSynth.playUnlock();
          return;
        }
        if (key === 'c' || e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          setTiles([]);
          audioSynth.playTrash();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAutoAlign, onSpawnBaseSpectrum, setTiles]);

  // Disable default browser touch gestures (pull-to-refresh, pinch-zoom, swipe scroll) on the board
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const preventTouchMove = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const preventTouchStart = (e: TouchEvent) => {
      // Prevent multi-touch pinch-zoom gestures on board
      if (e.touches.length > 1 && e.cancelable) {
        e.preventDefault();
      }
    };

    const preventGesture = (e: Event) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const opts: AddEventListenerOptions = { passive: false };

    board.addEventListener('touchstart', preventTouchStart, opts);
    board.addEventListener('touchmove', preventTouchMove, opts);
    board.addEventListener('gesturestart', preventGesture, opts);
    board.addEventListener('gesturechange', preventGesture, opts);
    board.addEventListener('gestureend', preventGesture, opts);

    return () => {
      board.removeEventListener('touchstart', preventTouchStart);
      board.removeEventListener('touchmove', preventTouchMove);
      board.removeEventListener('gesturestart', preventGesture);
      board.removeEventListener('gesturechange', preventGesture);
      board.removeEventListener('gestureend', preventGesture);
    };
  }, []);

  return (
    <main
      ref={boardRef}
      onDragOver={handleDragOver}
      onDrop={handleBoardDrop}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`flex-1 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] relative overflow-hidden touch-none select-none transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#EBEBEB] text-black'
      }`}
      style={{
        backgroundImage: `radial-gradient(circle, ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'} 1.5px, transparent 1.5px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Background Watermark Header */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <h1 className={`text-[90px] sm:text-[120px] md:text-[160px] font-black uppercase italic tracking-tighter leading-none ${
          isDarkMode ? 'text-white/5' : 'text-black/5'
        }`}>
          INFINITE CRAFT
        </h1>
      </div>

      {/* Board Controls Overlay */}
      <div className={`absolute top-4 left-4 z-20 flex items-center gap-2 border rounded-xl p-1.5 shadow-md ${
        isDarkMode ? 'bg-slate-900/90 border-slate-700 text-white backdrop-blur-xs' : 'bg-white/95 border-slate-300 text-black backdrop-blur-xs'
      }`}>
        <button
          onClick={onSpawnBaseSpectrum}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-300 rounded-lg border-2 border-slate-900 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all hover:bg-yellow-400"
        >
          <Flame className="w-3.5 h-3.5 text-black fill-black" />
          <span>Spawn Base Spectrum</span>
        </button>

        {tiles.length > 0 && (
          <>
            <button
              onClick={handleAutoAlign}
              className={`p-1.5 md:px-3 md:py-1.5 rounded-lg border-2 transition-colors text-xs font-black uppercase flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700 border-slate-700' : 'bg-white text-black hover:bg-slate-100 border-slate-800'
              }`}
              title="Auto-Arrange Tiles into Grid"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Align Grid</span>
            </button>

            <button
              onClick={() => setTiles([])}
              className={`p-1.5 rounded-lg border-2 hover:bg-red-300 transition-colors text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                isDarkMode ? 'bg-slate-800 text-white border-slate-700 hover:text-black' : 'bg-white text-black border-slate-800'
              }`}
              title="Clear Board"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Daily Challenge Board Mini Widget */}
      {dailyChallenge && (
        <div
          onClick={onOpenDailyTab}
          className="absolute top-4 right-4 z-20 bg-amber-300 border-2 border-black p-2 shadow-[4px_4px_0px_0px_#000] cursor-pointer hover:bg-amber-400 transition-all flex items-center gap-2"
          title="Click to view Daily Color Challenge details"
        >
          <div className="w-7 h-7 bg-black text-amber-300 border border-black flex items-center justify-center font-black text-xs shadow-[1px_1px_0px_0px_#000]">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-[9px] font-black uppercase text-black leading-none flex items-center gap-1">
              <span>Daily Goal</span>
              {dailyState?.completed && (
                <span className="bg-emerald-400 text-black px-1 text-[8px] font-mono border border-black">DONE</span>
              )}
            </p>
            <p className="text-xs font-black uppercase text-black max-w-[140px] truncate leading-tight">
              {dailyChallenge.title}
            </p>
          </div>
          <div className="bg-white border-2 border-black px-2 py-0.5 font-mono text-xs font-black text-black shadow-[1px_1px_0px_0px_#000]">
            {dailyState?.progress || 0}/{dailyChallenge.requiredAmount}
          </div>
        </div>
      )}

      {/* Empty State Instructions */}
      {tiles.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
          <div className="w-16 h-16 bg-yellow-300 border-4 border-black flex items-center justify-center mb-4 text-black shadow-[6px_6px_0px_0px_#000] animate-bounce">
            <Sparkles className="w-8 h-8 fill-black" />
          </div>
          <h2 className={`text-2xl font-black uppercase tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>Crafting Board Empty</h2>
          <p className={`text-xs font-bold max-w-sm mb-6 leading-relaxed uppercase border-2 p-3 shadow-[3px_3px_0px_0px_#000] ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-black text-slate-700'
          }`}>
            Drag fundamental primary color tiles from the sidebar or click below to spawn the starter spectrum onto the board!
          </p>
          <button
            onClick={onSpawnBaseSpectrum}
            className="pointer-events-auto px-6 py-3 bg-yellow-300 border-4 border-black text-black font-black uppercase text-xs shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-yellow-400 transition-all flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>Spawn Starter Colors (Red, Green, Blue, White, Black)</span>
          </button>
        </div>
      )}

      {/* Board Tiles */}
      {tiles.map((tile) => {
        const isDragging = activeDragId === tile.id;
        const isTargetOfFusion = targetFuseTileId === tile.id;

        return (
          <div
            key={tile.id}
            onPointerDown={(e) => handlePointerDown(e, tile)}
            onDoubleClick={() => handleDoubleClickTile(tile)}
            style={{
              transform: `translate3d(${tile.x}px, ${tile.y}px, 0px)`,
              zIndex: tile.zIndex,
            }}
            className={`absolute top-0 left-0 cursor-grab active:cursor-grabbing group touch-none select-none ${
              isAligning ? 'transition-transform duration-300 ease-out' : 'transition-shadow'
            } ${
              isDragging ? 'scale-105 opacity-90' : ''
            }`}
          >
            {/* Target Fusion Energy Aura & Badge */}
            {isTargetOfFusion && (
              <>
                <div className="absolute -inset-2.5 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 rounded-xl blur-sm opacity-90 animate-pulse pointer-events-none z-0" />
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-yellow-300 border-2 border-black px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap shadow-[2px_2px_0px_0px_#000] flex items-center gap-1 z-30 animate-bounce rounded-full">
                  <Sparkles className="w-3 h-3 fill-yellow-300 text-yellow-300 animate-spin" />
                  <span>SYNTHESIZE</span>
                </div>
              </>
            )}

            {/* Tile Container */}
            <div
              className={`relative z-10 flex items-center gap-2.5 px-3 py-2 rounded-lg border-2 select-none transition-all ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-700 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.6)] hover:border-slate-500'
                  : 'bg-white border-slate-900 text-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,0.9)] hover:border-black'
              } ${
                isTargetOfFusion
                  ? 'animate-alchemy-target ring-2 ring-yellow-400 ring-offset-2 ring-offset-black bg-yellow-300 border-slate-950 text-black shadow-[5px_5px_0px_0px_#000] scale-105'
                  : 'hover:-translate-y-0.5'
              } ${tile.isNew ? 'animate-tile-spawn' : ''}`}
            >
              {/* Color Swatch Box */}
              <div
                className="w-5 h-5 rounded-md border border-black/30 dark:border-white/20 shadow-xs flex items-center justify-center text-[10px] shrink-0"
                style={{ backgroundColor: tile.hex }}
              >
                <span className="drop-shadow-xs">{tile.emoji}</span>
              </div>

              {/* Title */}
              <span className={`text-xs font-black uppercase tracking-tight ${isDarkMode && !isTargetOfFusion ? 'text-white' : 'text-slate-900'}`}>
                {tile.name}
              </span>

              {/* Hover Actions Bar */}
              <div className={`opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-1 pl-1.5 border-l transition-opacity ${
                isDarkMode ? 'border-slate-700' : 'border-slate-300'
              }`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDoubleClickTile(tile);
                  }}
                  className={`p-1 rounded border transition-colors ${isDarkMode ? 'border-slate-700 text-white hover:bg-yellow-300 hover:text-black hover:border-black' : 'border-slate-300 text-slate-800 hover:bg-yellow-300 hover:border-black'}`}
                  title="Clone Tile"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTile(tile.id);
                  }}
                  className={`p-1 rounded border transition-colors ${isDarkMode ? 'border-slate-700 text-white hover:bg-red-400 hover:text-black hover:border-black' : 'border-slate-300 text-slate-800 hover:bg-red-400 hover:border-black'}`}
                  title="Remove Tile"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Particle Effects Layer on Fusion */}
      {activeParticles.map((p) => (
        <div
          key={p.id}
          className="absolute pointer-events-none z-50 w-0 h-0 flex items-center justify-center"
          style={{ left: p.x, top: p.y }}
        >
          {/* Central Chromatic Flare Burst */}
          <div
            className="absolute w-28 h-28 rounded-full border-2 border-black animate-alchemy-flare shadow-[0_0_25px_rgba(253,224,71,0.8)]"
            style={{ backgroundColor: p.color }}
          />

          {/* Expanding Shockwave Ring */}
          <div
            className="absolute w-24 h-24 rounded-full border-4 border-black bg-yellow-300/30 animate-alchemy-shockwave shadow-[2px_2px_0px_0px_#000]"
          />

          {/* 12-Direction Radial Spark Droplets */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((idx) => (
            <div
              key={idx}
              className="absolute w-3.5 h-3.5 rounded-full border border-black shadow-[1px_1px_0px_0px_#000]"
              style={{
                backgroundColor: p.color,
                animation: `spark-p${idx} 0.65s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
              }}
            />
          ))}

          {/* Floating Synthesis Banner Tag */}
          <div className="absolute -top-12 animate-alchemy-banner whitespace-nowrap bg-black text-white border-2 border-black px-3 py-1.5 rounded-full font-black text-xs uppercase shadow-[4px_4px_0px_0px_#000] flex items-center gap-2 z-50">
            <div
              className="w-4 h-4 rounded-full border border-white shrink-0 flex items-center justify-center text-[9px]"
              style={{ backgroundColor: p.color }}
            >
              <span>{p.emoji}</span>
            </div>
            <span className="tracking-wide text-yellow-300">FUSED:</span>
            <span className="text-white">{p.name}</span>
            <Sparkles className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
          </div>
        </div>
      ))}

      {/* Remote Collaborator Cursors */}
      {remoteCursors.map((cursor) => (
        <div
          key={cursor.id}
          className="absolute pointer-events-none z-40 transition-all duration-75 flex items-center gap-1.5"
          style={{
            transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
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
    </main>
  );
};
