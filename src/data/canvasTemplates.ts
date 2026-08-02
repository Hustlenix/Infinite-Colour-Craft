export interface CanvasTemplate {
  id: string;
  name: string;
  emoji: string;
  category: string;
  drawOutline: (ctx: CanvasRenderingContext2D, width: number, height: number, isDarkMode: boolean) => void;
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    emoji: '📄',
    category: 'Freehand',
    drawOutline: () => {},
  },
  {
    id: 'cat',
    name: 'Cute Kitten',
    emoji: '🐱',
    category: 'Animals',
    drawOutline: (ctx, w, h, isDarkMode) => {
      ctx.save();
      ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#1E293B';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const cx = w / 2;
      const cy = h / 2 - 20;

      // Head
      ctx.beginPath();
      ctx.arc(cx, cy, 100, 0, Math.PI * 2);
      ctx.stroke();

      // Ears
      ctx.beginPath();
      ctx.moveTo(cx - 70, cy - 70);
      ctx.lineTo(cx - 100, cy - 140);
      ctx.lineTo(cx - 30, cy - 95);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 70, cy - 70);
      ctx.lineTo(cx + 100, cy - 140);
      ctx.lineTo(cx + 30, cy - 95);
      ctx.stroke();

      // Eyes
      ctx.beginPath();
      ctx.ellipse(cx - 40, cy - 20, 16, 24, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 40, cy - 20, 16, 24, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Nose & Mouth
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy + 20);
      ctx.lineTo(cx + 12, cy + 20);
      ctx.lineTo(cx, cy + 32);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx - 16, cy + 42, 16, Math.PI * 1.1, Math.PI * 1.9, true);
      ctx.arc(cx + 16, cy + 42, 16, Math.PI * 1.1, Math.PI * 1.9, true);
      ctx.stroke();

      // Whiskers
      ctx.beginPath();
      ctx.moveTo(cx - 60, cy + 25); ctx.lineTo(cx - 120, cy + 15);
      ctx.moveTo(cx - 60, cy + 35); ctx.lineTo(cx - 120, cy + 38);
      ctx.moveTo(cx + 60, cy + 25); ctx.lineTo(cx + 120, cy + 15);
      ctx.moveTo(cx + 60, cy + 35); ctx.lineTo(cx + 120, cy + 38);
      ctx.stroke();

      // Paws
      ctx.beginPath();
      ctx.arc(cx - 50, cy + 140, 35, 0, Math.PI * 2);
      ctx.arc(cx + 50, cy + 140, 35, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    },
  },
  {
    id: 'butterfly',
    name: 'Magic Butterfly',
    emoji: '🦋',
    category: 'Nature',
    drawOutline: (ctx, w, h, isDarkMode) => {
      ctx.save();
      ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#1E293B';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      const cx = w / 2;
      const cy = h / 2;

      // Body
      ctx.beginPath();
      ctx.ellipse(cx, cy, 12, 80, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Head
      ctx.beginPath();
      ctx.arc(cx, cy - 90, 18, 0, Math.PI * 2);
      ctx.stroke();

      // Antennae
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 105);
      ctx.quadraticCurveTo(cx - 40, cy - 150, cx - 60, cy - 130);
      ctx.moveTo(cx + 8, cy - 105);
      ctx.quadraticCurveTo(cx + 40, cy - 150, cx + 60, cy - 130);
      ctx.stroke();

      // Top Wings
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy - 30);
      ctx.bezierCurveTo(cx - 180, cy - 180, cx - 220, cy - 20, cx - 12, cy + 10);
      ctx.moveTo(cx + 12, cy - 30);
      ctx.bezierCurveTo(cx + 180, cy - 180, cx + 220, cy - 20, cx + 12, cy + 10);
      ctx.stroke();

      // Bottom Wings
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy + 15);
      ctx.bezierCurveTo(cx - 160, cy + 80, cx - 140, cy + 180, cx - 12, cy + 70);
      ctx.moveTo(cx + 12, cy + 15);
      ctx.bezierCurveTo(cx + 160, cy + 80, cx + 140, cy + 180, cx + 12, cy + 70);
      ctx.stroke();

      // Wing Patterns
      ctx.beginPath();
      ctx.arc(cx - 90, cy - 60, 30, 0, Math.PI * 2);
      ctx.arc(cx + 90, cy - 60, 30, 0, Math.PI * 2);
      ctx.arc(cx - 70, cy + 80, 20, 0, Math.PI * 2);
      ctx.arc(cx + 70, cy + 80, 20, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    },
  },
  {
    id: 'dragon',
    name: 'Baby Dragon',
    emoji: '🐲',
    category: 'Fantasy',
    drawOutline: (ctx, w, h, isDarkMode) => {
      ctx.save();
      ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#1E293B';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      const cx = w / 2;
      const cy = h / 2 - 10;

      // Body & Head
      ctx.beginPath();
      ctx.arc(cx, cy - 40, 70, 0, Math.PI * 2); // Head
      ctx.stroke();

      // Snout
      ctx.beginPath();
      ctx.arc(cx - 50, cy - 30, 35, 0, Math.PI * 2);
      ctx.stroke();

      // Horns
      ctx.beginPath();
      ctx.moveTo(cx + 20, cy - 100);
      ctx.lineTo(cx + 60, cy - 150);
      ctx.lineTo(cx + 45, cy - 90);
      ctx.stroke();

      // Eye
      ctx.beginPath();
      ctx.arc(cx - 20, cy - 50, 14, 0, Math.PI * 2);
      ctx.stroke();

      // Cute Body
      ctx.beginPath();
      ctx.ellipse(cx + 20, cy + 80, 65, 85, -0.2, 0, Math.PI * 2);
      ctx.stroke();

      // Belly Scales
      ctx.beginPath();
      ctx.arc(cx - 10, cy + 80, 35, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();

      // Wings
      ctx.beginPath();
      ctx.moveTo(cx + 70, cy + 30);
      ctx.lineTo(cx + 150, cy - 20);
      ctx.lineTo(cx + 130, cy + 40);
      ctx.lineTo(cx + 160, cy + 70);
      ctx.lineTo(cx + 80, cy + 80);
      ctx.stroke();

      ctx.restore();
    },
  },
  {
    id: 'mandala',
    name: 'Star Portal',
    emoji: '🌌',
    category: 'Patterns',
    drawOutline: (ctx, w, h, isDarkMode) => {
      ctx.save();
      ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#1E293B';
      ctx.lineWidth = 3;

      const cx = w / 2;
      const cy = h / 2;

      // Concentric circles
      [30, 70, 120, 170, 220].forEach((radius) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Petals
      const count = 12;
      for (let i = 0; i < count; i++) {
        const angle = (i * Math.PI * 2) / count;
        const x1 = cx + Math.cos(angle) * 70;
        const y1 = cy + Math.sin(angle) * 70;
        const x2 = cx + Math.cos(angle) * 170;
        const y2 = cy + Math.sin(angle) * 170;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x1, y1, 25, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    },
  },
  {
    id: 'rocket',
    name: 'Space Rocket',
    emoji: '🚀',
    category: 'Sci-Fi',
    drawOutline: (ctx, w, h, isDarkMode) => {
      ctx.save();
      ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#1E293B';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      const cx = w / 2;
      const cy = h / 2;

      // Rocket Body
      ctx.beginPath();
      ctx.moveTo(cx, cy - 180);
      ctx.quadraticCurveTo(cx + 70, cy - 60, cx + 50, cy + 100);
      ctx.lineTo(cx - 50, cy + 100);
      ctx.quadraticCurveTo(cx - 70, cy - 60, cx, cy - 180);
      ctx.stroke();

      // Porthole Window
      ctx.beginPath();
      ctx.arc(cx, cy - 30, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - 30, 20, 0, Math.PI * 2);
      ctx.stroke();

      // Fins
      ctx.beginPath();
      ctx.moveTo(cx - 50, cy + 20);
      ctx.lineTo(cx - 100, cy + 120);
      ctx.lineTo(cx - 50, cy + 100);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 50, cy + 20);
      ctx.lineTo(cx + 100, cy + 120);
      ctx.lineTo(cx + 50, cy + 100);
      ctx.stroke();

      // Flame
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy + 100);
      ctx.lineTo(cx - 40, cy + 160);
      ctx.lineTo(cx, cy + 190);
      ctx.lineTo(cx + 40, cy + 160);
      ctx.lineTo(cx + 30, cy + 100);
      ctx.stroke();

      ctx.restore();
    },
  },
];
