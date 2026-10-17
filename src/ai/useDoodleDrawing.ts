import { useEffect, useRef, useState } from 'react';
import { preprocessCanvas } from '../utils/doodlePreprocess';
type Point = { x: number; y: number };
type Stroke = Point[];
export const DOODLE_SIZE = 480;
function draw(canvas: HTMLCanvasElement, strokes: Stroke[], ink: string, opaque = false) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.clearRect(0, 0, DOODLE_SIZE, DOODLE_SIZE);
  if (opaque) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, DOODLE_SIZE, DOODLE_SIZE); }
  ctx.strokeStyle = ctx.fillStyle = ink; ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = 18;
  for (const stroke of strokes) {
    if (!stroke.length) continue;
    ctx.beginPath(); ctx.arc(stroke[0].x, stroke[0].y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(stroke[0].x, stroke[0].y);
    stroke.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
  }
}
export function useDoodleDrawing(ink: string, enabled = true, onStroke?: () => void) {
  const canvas = useRef<HTMLCanvasElement>(null), strokes = useRef<Stroke[]>([]), pointer = useRef<number | null>(null);
  const [count, setCount] = useState(0);
  const callback = useRef(onStroke); callback.current = onStroke;
  const redraw = () => { if (canvas.current) draw(canvas.current, strokes.current, ink); };
  useEffect(redraw, [ink]);
  const finish = () => { if (pointer.current !== null) { pointer.current = null; setCount(strokes.current.length); callback.current?.(); } };
  useEffect(() => { if (!enabled) finish(); }, [enabled]);
  useEffect(() => () => { pointer.current = null; }, []);
  const pos = (e: React.PointerEvent | PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: Math.max(0, Math.min(480, (e.clientX - r.left) * 480 / r.width)), y: Math.max(0, Math.min(480, (e.clientY - r.top) * 480 / r.height)) };
  };
  return { canvas, count, clear: () => { pointer.current = null; strokes.current = []; setCount(0); redraw(); },
    undo: () => { pointer.current = null; strokes.current.pop(); setCount(strokes.current.length); redraw(); },
    preprocess: () => { const mask = document.createElement('canvas'); mask.width = mask.height = DOODLE_SIZE; draw(mask, strokes.current, '#000000', true); return preprocessCanvas(mask, false); },
    handlers: {
      onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!enabled || e.button !== 0 || pointer.current !== null) return;
        if (strokes.current.length >= 200) return;
        e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); pointer.current = e.pointerId;
        callback.current?.();
        strokes.current.push([pos(e)]); setCount(strokes.current.length); redraw();
      },
      onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (pointer.current !== e.pointerId) return;
        e.preventDefault(); const stroke = strokes.current.at(-1); if (!stroke) return;
        const events = e.nativeEvent.getCoalescedEvents?.() || [];
        for (const event of events.length ? events : [e.nativeEvent]) { const p = pos(event), prev = stroke.at(-1)!;
          if (stroke.length < 4000 && Math.hypot(p.x - prev.x, p.y - prev.y) > 1) stroke.push(p); }
        redraw();
      },
      onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => { if (pointer.current === e.pointerId) { finish(); if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); } },
      onPointerCancel: finish, onLostPointerCapture: finish,
    } };
}
