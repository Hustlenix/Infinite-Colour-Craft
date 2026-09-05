export interface CanvasTemplate {
  id: string;
  name: string;
  emoji: string;
  category: string;
  description: string;
  drawOutline: (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    isDarkMode: boolean,
    options?: { lineWidth?: number; strokeColor?: string }
  ) => void;
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    emoji: '📄',
    category: 'Freehand',
    description: 'Clean paper for your own original artwork',
    drawOutline: () => {},
  },
  {
    id: 'cat',
    name: 'Playful Kitten',
    emoji: '🐱',
    category: 'Animals',
    description: 'Cute anime kitten with bell collar and closed shapes for coloring',
    drawOutline: (ctx, w, h, isDarkMode, options) => {
      ctx.save();
      const s = Math.min(w, h) / 520;
      const cx = w / 2;
      const cy = h / 2 - 10 * s;

      const mainColor = options?.strokeColor || (isDarkMode ? '#F8FAFC' : '#0F172A');
      const baseWidth = (options?.lineWidth || 3.5) * s;

      ctx.strokeStyle = mainColor;
      ctx.lineWidth = baseWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Head Contour (Chubby cheeks)
      ctx.beginPath();
      ctx.moveTo(cx - 75 * s, cy - 35 * s);
      ctx.bezierCurveTo(cx - 110 * s, cy + 10 * s, cx - 90 * s, cy + 80 * s, cx, cy + 85 * s);
      ctx.bezierCurveTo(cx + 90 * s, cy + 80 * s, cx + 110 * s, cy + 10 * s, cx + 75 * s, cy - 35 * s);
      ctx.bezierCurveTo(cx + 60 * s, cy - 80 * s, cx - 60 * s, cy - 80 * s, cx - 75 * s, cy - 35 * s);
      ctx.closePath();
      ctx.stroke();

      // 2. Left Outer Ear
      ctx.beginPath();
      ctx.moveTo(cx - 65 * s, cy - 55 * s);
      ctx.quadraticCurveTo(cx - 105 * s, cy - 135 * s, cx - 85 * s, cy - 145 * s);
      ctx.quadraticCurveTo(cx - 40 * s, cy - 120 * s, cx - 25 * s, cy - 75 * s);
      ctx.closePath();
      ctx.stroke();

      // 2b. Left Inner Ear (Closed shape for filling)
      ctx.beginPath();
      ctx.moveTo(cx - 60 * s, cy - 65 * s);
      ctx.quadraticCurveTo(cx - 88 * s, cy - 122 * s, cx - 78 * s, cy - 128 * s);
      ctx.quadraticCurveTo(cx - 45 * s, cy - 110 * s, cx - 35 * s, cy - 75 * s);
      ctx.closePath();
      ctx.stroke();

      // 3. Right Outer Ear
      ctx.beginPath();
      ctx.moveTo(cx + 65 * s, cy - 55 * s);
      ctx.quadraticCurveTo(cx + 105 * s, cy - 135 * s, cx + 85 * s, cy - 145 * s);
      ctx.quadraticCurveTo(cx + 40 * s, cy - 120 * s, cx + 25 * s, cy - 75 * s);
      ctx.closePath();
      ctx.stroke();

      // 3b. Right Inner Ear (Closed shape for filling)
      ctx.beginPath();
      ctx.moveTo(cx + 60 * s, cy - 65 * s);
      ctx.quadraticCurveTo(cx + 88 * s, cy - 122 * s, cx + 78 * s, cy - 128 * s);
      ctx.quadraticCurveTo(cx + 45 * s, cy - 110 * s, cx + 35 * s, cy - 75 * s);
      ctx.closePath();
      ctx.stroke();

      // 4. Large Sparkling Eyes
      // Left Eye Outer
      ctx.beginPath();
      ctx.ellipse(cx - 42 * s, cy - 5 * s, 18 * s, 25 * s, 0.05, 0, Math.PI * 2);
      ctx.stroke();
      // Left Eye Specular shine highlights (circles inside for color separation)
      ctx.beginPath();
      ctx.arc(cx - 46 * s, cy - 14 * s, 7 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - 36 * s, cy + 6 * s, 4 * s, 0, Math.PI * 2);
      ctx.stroke();

      // Right Eye Outer
      ctx.beginPath();
      ctx.ellipse(cx + 42 * s, cy - 5 * s, 18 * s, 25 * s, -0.05, 0, Math.PI * 2);
      ctx.stroke();
      // Right Eye Specular shine highlights
      ctx.beginPath();
      ctx.arc(cx + 38 * s, cy - 14 * s, 7 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 48 * s, cy + 6 * s, 4 * s, 0, Math.PI * 2);
      ctx.stroke();

      // 5. Button Nose & Cute Smile
      ctx.beginPath();
      ctx.moveTo(cx - 8 * s, cy + 24 * s);
      ctx.lineTo(cx + 8 * s, cy + 24 * s);
      ctx.lineTo(cx, cy + 33 * s);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx - 14 * s, cy + 42 * s, 14 * s, Math.PI * 1.15, Math.PI * 1.95, true);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 14 * s, cy + 42 * s, 14 * s, Math.PI * 1.05, Math.PI * 1.85, true);
      ctx.stroke();

      // 6. Whiskers
      ctx.lineWidth = baseWidth * 0.75;
      [-1, 1].forEach((dir) => {
        ctx.beginPath();
        ctx.moveTo(cx + dir * 60 * s, cy + 22 * s);
        ctx.quadraticCurveTo(cx + dir * 105 * s, cy + 18 * s, cx + dir * 135 * s, cy + 14 * s);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + dir * 60 * s, cy + 34 * s);
        ctx.quadraticCurveTo(cx + dir * 105 * s, cy + 38 * s, cx + dir * 135 * s, cy + 40 * s);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + dir * 55 * s, cy + 46 * s);
        ctx.quadraticCurveTo(cx + dir * 100 * s, cy + 58 * s, cx + dir * 128 * s, cy + 68 * s);
        ctx.stroke();
      });

      // 7. Collar & Bell
      ctx.lineWidth = baseWidth;
      ctx.beginPath();
      ctx.moveTo(cx - 50 * s, cy + 83 * s);
      ctx.quadraticCurveTo(cx, cy + 102 * s, cx + 50 * s, cy + 83 * s);
      ctx.quadraticCurveTo(cx, cy + 114 * s, cx - 50 * s, cy + 83 * s);
      ctx.closePath();
      ctx.stroke();

      // Bell
      ctx.beginPath();
      ctx.arc(cx, cy + 115 * s, 14 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy + 115 * s, 4 * s, 0, Math.PI * 2);
      ctx.stroke();

      // 8. Paws
      ctx.beginPath();
      ctx.arc(cx - 45 * s, cy + 145 * s, 28 * s, 0, Math.PI * 2);
      ctx.stroke();
      // Paw pads
      ctx.beginPath();
      ctx.arc(cx - 45 * s, cy + 148 * s, 10 * s, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx + 45 * s, cy + 145 * s, 28 * s, 0, Math.PI * 2);
      ctx.stroke();
      // Paw pads
      ctx.beginPath();
      ctx.arc(cx + 45 * s, cy + 148 * s, 10 * s, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    },
  },
  {
    id: 'butterfly',
    name: 'Monarch Butterfly',
    emoji: '🦋',
    category: 'Nature',
    description: 'Symmetrical stained-glass wings with 16 closed cells ideal for flood filling',
    drawOutline: (ctx, w, h, isDarkMode, options) => {
      ctx.save();
      const s = Math.min(w, h) / 520;
      const cx = w / 2;
      const cy = h / 2;

      const mainColor = options?.strokeColor || (isDarkMode ? '#F8FAFC' : '#0F172A');
      const baseWidth = (options?.lineWidth || 3.5) * s;

      ctx.strokeStyle = mainColor;
      ctx.lineWidth = baseWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Symmetrical Wings Function
      [-1, 1].forEach((dir) => {
        // --- Upper Forewing Main Contour ---
        ctx.beginPath();
        ctx.moveTo(cx + dir * 12 * s, cy - 25 * s);
        ctx.bezierCurveTo(
          cx + dir * 80 * s, cy - 140 * s,
          cx + dir * 180 * s, cy - 170 * s,
          cx + dir * 215 * s, cy - 90 * s
        );
        ctx.bezierCurveTo(
          cx + dir * 210 * s, cy - 20 * s,
          cx + dir * 150 * s, cy + 25 * s,
          cx + dir * 16 * s, cy + 10 * s
        );
        ctx.closePath();
        ctx.stroke();

        // Forewing Inner Stained-Glass Cells
        // Cell 1 (Top Apex)
        ctx.beginPath();
        ctx.moveTo(cx + dir * 40 * s, cy - 45 * s);
        ctx.quadraticCurveTo(cx + dir * 120 * s, cy - 120 * s, cx + dir * 180 * s, cy - 120 * s);
        ctx.quadraticCurveTo(cx + dir * 140 * s, cy - 70 * s, cx + dir * 55 * s, cy - 35 * s);
        ctx.closePath();
        ctx.stroke();

        // Cell 2 (Outer Wing Tip)
        ctx.beginPath();
        ctx.moveTo(cx + dir * 135 * s, cy - 65 * s);
        ctx.quadraticCurveTo(cx + dir * 185 * s, cy - 100 * s, cx + dir * 195 * s, cy - 65 * s);
        ctx.quadraticCurveTo(cx + dir * 175 * s, cy - 25 * s, cx + dir * 125 * s, cy - 30 * s);
        ctx.closePath();
        ctx.stroke();

        // Cell 3 (Central Forewing)
        ctx.beginPath();
        ctx.moveTo(cx + dir * 30 * s, cy - 15 * s);
        ctx.quadraticCurveTo(cx + dir * 85 * s, cy - 50 * s, cx + dir * 125 * s, cy - 20 * s);
        ctx.quadraticCurveTo(cx + dir * 140 * s, cy + 10 * s, cx + dir * 80 * s, cy + 5 * s);
        ctx.closePath();
        ctx.stroke();

        // Cell 4 (Sub-marginal Spot 1)
        ctx.beginPath();
        ctx.arc(cx + dir * 165 * s, cy + 2 * s, 9 * s, 0, Math.PI * 2);
        ctx.stroke();

        // Cell 5 (Sub-marginal Spot 2)
        ctx.beginPath();
        ctx.arc(cx + dir * 185 * s, cy - 22 * s, 8 * s, 0, Math.PI * 2);
        ctx.stroke();

        // --- Lower Hindwing Main Contour ---
        ctx.beginPath();
        ctx.moveTo(cx + dir * 12 * s, cy + 20 * s);
        ctx.bezierCurveTo(
          cx + dir * 120 * s, cy + 30 * s,
          cx + dir * 170 * s, cy + 90 * s,
          cx + dir * 135 * s, cy + 160 * s
        );
        ctx.bezierCurveTo(
          cx + dir * 90 * s, cy + 195 * s,
          cx + dir * 40 * s, cy + 160 * s,
          cx + dir * 10 * s, cy + 85 * s
        );
        ctx.closePath();
        ctx.stroke();

        // Hindwing Inner Stained-Glass Cells
        // Cell 6 (Upper Hindwing)
        ctx.beginPath();
        ctx.moveTo(cx + dir * 30 * s, cy + 38 * s);
        ctx.quadraticCurveTo(cx + dir * 95 * s, cy + 55 * s, cx + dir * 125 * s, cy + 95 * s);
        ctx.quadraticCurveTo(cx + dir * 75 * s, cy + 105 * s, cx + dir * 25 * s, cy + 60 * s);
        ctx.closePath();
        ctx.stroke();

        // Cell 7 (Lower Scallop)
        ctx.beginPath();
        ctx.moveTo(cx + dir * 30 * s, cy + 75 * s);
        ctx.quadraticCurveTo(cx + dir * 75 * s, cy + 115 * s, cx + dir * 105 * s, cy + 145 * s);
        ctx.quadraticCurveTo(cx + dir * 65 * s, cy + 160 * s, cx + dir * 25 * s, cy + 95 * s);
        ctx.closePath();
        ctx.stroke();

        // Cell 8 (Trailing Spot)
        ctx.beginPath();
        ctx.arc(cx + dir * 75 * s, cy + 140 * s, 7 * s, 0, Math.PI * 2);
        ctx.stroke();

        // Curved Antenna
        ctx.beginPath();
        ctx.moveTo(cx + dir * 6 * s, cy - 80 * s);
        ctx.bezierCurveTo(
          cx + dir * 15 * s, cy - 130 * s,
          cx + dir * 55 * s, cy - 165 * s,
          cx + dir * 70 * s, cy - 145 * s
        );
        ctx.stroke();
        // Antenna Tip Bulb
        ctx.beginPath();
        ctx.arc(cx + dir * 68 * s, cy - 147 * s, 5 * s, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Butterfly Body (Head, Thorax, Abdomen)
      // Head
      ctx.beginPath();
      ctx.arc(cx, cy - 70 * s, 14 * s, 0, Math.PI * 2);
      ctx.stroke();
      // Eyes
      ctx.beginPath();
      ctx.arc(cx - 9 * s, cy - 72 * s, 4 * s, 0, Math.PI * 2);
      ctx.arc(cx + 9 * s, cy - 72 * s, 4 * s, 0, Math.PI * 2);
      ctx.stroke();

      // Thorax (Middle)
      ctx.beginPath();
      ctx.ellipse(cx, cy - 35 * s, 13 * s, 20 * s, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Abdomen Segments
      ctx.beginPath();
      ctx.moveTo(cx - 10 * s, cy - 15 * s);
      ctx.bezierCurveTo(cx - 14 * s, cy + 35 * s, cx - 8 * s, cy + 85 * s, cx, cy + 98 * s);
      ctx.bezierCurveTo(cx + 8 * s, cy + 85 * s, cx + 14 * s, cy + 35 * s, cx + 10 * s, cy - 15 * s);
      ctx.closePath();
      ctx.stroke();

      // Abdomen Stripes
      [-5, 15, 35, 55, 75].forEach((yOffset) => {
        ctx.beginPath();
        ctx.moveTo(cx - 9 * s, cy + yOffset * s);
        ctx.quadraticCurveTo(cx, cy + (yOffset + 4) * s, cx + 9 * s, cy + yOffset * s);
        ctx.stroke();
      });

      ctx.restore();
    },
  },
  {
    id: 'rocket',
    name: 'Cosmic Exploration',
    emoji: '🚀',
    category: 'Sci-Fi',
    description: 'Retro-futuristic rocket ship with planet Saturn, crescent moon, and sparkling stars',
    drawOutline: (ctx, w, h, isDarkMode, options) => {
      ctx.save();
      const s = Math.min(w, h) / 520;
      const cx = w / 2;
      const cy = h / 2 - 10 * s;

      const mainColor = options?.strokeColor || (isDarkMode ? '#F8FAFC' : '#0F172A');
      const baseWidth = (options?.lineWidth || 3.5) * s;

      ctx.strokeStyle = mainColor;
      ctx.lineWidth = baseWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Rocket Fuselage (Main Body)
      ctx.beginPath();
      ctx.moveTo(cx, cy - 175 * s);
      ctx.bezierCurveTo(cx + 55 * s, cy - 70 * s, cx + 50 * s, cy + 50 * s, cx + 38 * s, cy + 95 * s);
      ctx.lineTo(cx - 38 * s, cy + 95 * s);
      ctx.bezierCurveTo(cx - 50 * s, cy + 50 * s, cx - 55 * s, cy - 70 * s, cx, cy - 175 * s);
      ctx.closePath();
      ctx.stroke();

      // Nosecone Cap
      ctx.beginPath();
      ctx.moveTo(cx - 28 * s, cy - 105 * s);
      ctx.quadraticCurveTo(cx, cy - 90 * s, cx + 28 * s, cy - 105 * s);
      ctx.stroke();

      // Cockpit Porthole (Outer & Inner Ring)
      ctx.beginPath();
      ctx.arc(cx, cy - 30 * s, 26 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - 30 * s, 18 * s, 0, Math.PI * 2);
      ctx.stroke();
      // Glass glare glint
      ctx.beginPath();
      ctx.arc(cx - 6 * s, cy - 36 * s, 5 * s, 0, Math.PI * 2);
      ctx.stroke();

      // Lower Body Stripe Ring
      ctx.beginPath();
      ctx.moveTo(cx - 42 * s, cy + 45 * s);
      ctx.quadraticCurveTo(cx, cy + 60 * s, cx + 42 * s, cy + 45 * s);
      ctx.stroke();

      // 2. Wings / Thruster Fins
      // Left Fin
      ctx.beginPath();
      ctx.moveTo(cx - 42 * s, cy + 30 * s);
      ctx.quadraticCurveTo(cx - 95 * s, cy + 70 * s, cx - 90 * s, cy + 120 * s);
      ctx.lineTo(cx - 38 * s, cy + 95 * s);
      ctx.closePath();
      ctx.stroke();

      // Right Fin
      ctx.beginPath();
      ctx.moveTo(cx + 42 * s, cy + 30 * s);
      ctx.quadraticCurveTo(cx + 95 * s, cy + 70 * s, cx + 90 * s, cy + 120 * s);
      ctx.lineTo(cx + 38 * s, cy + 95 * s);
      ctx.closePath();
      ctx.stroke();

      // Center Keel Fin
      ctx.beginPath();
      ctx.moveTo(cx, cy + 40 * s);
      ctx.lineTo(cx, cy + 110 * s);
      ctx.stroke();

      // 3. Engine Exhaust Nozzle
      ctx.beginPath();
      ctx.moveTo(cx - 28 * s, cy + 95 * s);
      ctx.lineTo(cx - 22 * s, cy + 112 * s);
      ctx.lineTo(cx + 22 * s, cy + 112 * s);
      ctx.lineTo(cx + 28 * s, cy + 95 * s);
      ctx.closePath();
      ctx.stroke();

      // 4. Nested Exhaust Flame (Outer & Inner)
      // Outer Flame
      ctx.beginPath();
      ctx.moveTo(cx - 20 * s, cy + 112 * s);
      ctx.quadraticCurveTo(cx - 38 * s, cy + 155 * s, cx - 18 * s, cy + 175 * s);
      ctx.quadraticCurveTo(cx, cy + 205 * s, cx, cy + 215 * s);
      ctx.quadraticCurveTo(cx, cy + 205 * s, cx + 18 * s, cy + 175 * s);
      ctx.quadraticCurveTo(cx + 38 * s, cy + 155 * s, cx + 20 * s, cy + 112 * s);
      ctx.closePath();
      ctx.stroke();

      // Inner Hot Flame Core
      ctx.beginPath();
      ctx.moveTo(cx - 10 * s, cy + 112 * s);
      ctx.quadraticCurveTo(cx - 18 * s, cy + 145 * s, cx, cy + 170 * s);
      ctx.quadraticCurveTo(cx + 18 * s, cy + 145 * s, cx + 10 * s, cy + 112 * s);
      ctx.closePath();
      ctx.stroke();

      // 5. Cosmic Environment: Planet Saturn (Top Right)
      const px = cx + 145 * s;
      const py = cy - 110 * s;
      ctx.beginPath();
      ctx.arc(px, py, 32 * s, 0, Math.PI * 2);
      ctx.stroke();
      // Saturn Ring
      ctx.beginPath();
      ctx.ellipse(px, py, 58 * s, 14 * s, -0.35, 0, Math.PI * 2);
      ctx.stroke();

      // 6. Crescent Moon (Top Left)
      const mx = cx - 145 * s;
      const my = cy - 105 * s;
      ctx.beginPath();
      ctx.arc(mx, my, 28 * s, Math.PI * 0.25, Math.PI * 1.75);
      ctx.bezierCurveTo(mx - 8 * s, my - 16 * s, mx - 8 * s, my + 16 * s, mx + 20 * s, my + 20 * s);
      ctx.closePath();
      ctx.stroke();

      // 7. Twinkling Stars (4-Point Diamond Stars)
      const drawStar = (x: number, y: number, rad: number) => {
        ctx.beginPath();
        ctx.moveTo(x, y - rad);
        ctx.quadraticCurveTo(x, y, x + rad, y);
        ctx.quadraticCurveTo(x, y, x, y + rad);
        ctx.quadraticCurveTo(x, y, x - rad, y);
        ctx.quadraticCurveTo(x, y, x, y - rad);
        ctx.closePath();
        ctx.stroke();
      };

      drawStar(cx - 150 * s, cy + 20 * s, 16 * s);
      drawStar(cx + 155 * s, cy + 30 * s, 14 * s);
      drawStar(cx - 115 * s, cy - 25 * s, 10 * s);
      drawStar(cx + 110 * s, cy + 140 * s, 12 * s);
      drawStar(cx - 130 * s, cy + 150 * s, 11 * s);

      ctx.restore();
    },
  },
  {
    id: 'mandala',
    name: 'Sacred Lotus Mandala',
    emoji: '🌸',
    category: 'Patterns',
    description: 'Intricate 8-fold sacred geometry mandala with closed petal rings for coloring meditation',
    drawOutline: (ctx, w, h, isDarkMode, options) => {
      ctx.save();
      const s = Math.min(w, h) / 520;
      const cx = w / 2;
      const cy = h / 2;

      const mainColor = options?.strokeColor || (isDarkMode ? '#F8FAFC' : '#0F172A');
      const baseWidth = (options?.lineWidth || 3.5) * s;

      ctx.strokeStyle = mainColor;
      ctx.lineWidth = baseWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Concentric Guide Rings
      [35 * s, 75 * s, 130 * s, 185 * s, 215 * s].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 2. Central 8-Ray Star / Sunburst Core
      const rays = 8;
      for (let i = 0; i < rays; i++) {
        const angle = (i * Math.PI * 2) / rays;
        const nextAngle = ((i + 1) * Math.PI * 2) / rays;
        const midAngle = angle + Math.PI / rays;

        // Inner Core Diamond Petals
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * 15 * s, cy + Math.sin(angle) * 15 * s);
        ctx.lineTo(cx + Math.cos(midAngle) * 35 * s, cy + Math.sin(midAngle) * 35 * s);
        ctx.lineTo(cx + Math.cos(nextAngle) * 15 * s, cy + Math.sin(nextAngle) * 15 * s);
        ctx.closePath();
        ctx.stroke();

        // First Petal Ring (Between 35s and 75s)
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * 35 * s, cy + Math.sin(angle) * 35 * s);
        ctx.quadraticCurveTo(
          cx + Math.cos(midAngle) * 92 * s,
          cy + Math.sin(midAngle) * 92 * s,
          cx + Math.cos(nextAngle) * 35 * s,
          cy + Math.sin(nextAngle) * 35 * s
        );
        ctx.closePath();
        ctx.stroke();

        // Second Lotus Petal Ring (Between 75s and 130s)
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(midAngle) * 75 * s, cy + Math.sin(midAngle) * 75 * s);
        ctx.bezierCurveTo(
          cx + Math.cos(midAngle - 0.2) * 155 * s,
          cy + Math.sin(midAngle - 0.2) * 155 * s,
          cx + Math.cos(midAngle + 0.2) * 155 * s,
          cy + Math.sin(midAngle + 0.2) * 155 * s,
          cx + Math.cos(midAngle + Math.PI / 4) * 75 * s,
          cy + Math.sin(midAngle + Math.PI / 4) * 75 * s
        );
        ctx.closePath();
        ctx.stroke();

        // Outer Crown Petals (Between 130s and 185s)
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * 130 * s, cy + Math.sin(angle) * 130 * s);
        ctx.quadraticCurveTo(
          cx + Math.cos(midAngle) * 205 * s,
          cy + Math.sin(midAngle) * 205 * s,
          cx + Math.cos(nextAngle) * 130 * s,
          cy + Math.sin(nextAngle) * 130 * s
        );
        ctx.closePath();
        ctx.stroke();

        // Medallion Jewels
        const jx = cx + Math.cos(midAngle) * 160 * s;
        const jy = cy + Math.sin(midAngle) * 160 * s;
        ctx.beginPath();
        ctx.arc(jx, jy, 9 * s, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Outer Scalloped Crests (16 Petals on the rim)
      const outerCount = 16;
      for (let i = 0; i < outerCount; i++) {
        const a1 = (i * Math.PI * 2) / outerCount;
        const a2 = ((i + 1) * Math.PI * 2) / outerCount;
        const am = a1 + Math.PI / outerCount;

        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a1) * 185 * s, cy + Math.sin(a1) * 185 * s);
        ctx.quadraticCurveTo(
          cx + Math.cos(am) * 228 * s,
          cy + Math.sin(am) * 228 * s,
          cx + Math.cos(a2) * 185 * s,
          cy + Math.sin(a2) * 185 * s
        );
        ctx.stroke();

        // Tiny bead on outer rim
        ctx.beginPath();
        ctx.arc(cx + Math.cos(am) * 215 * s, cy + Math.sin(am) * 215 * s, 4 * s, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    },
  },
  {
    id: 'dragon',
    name: 'Mythic Baby Dragon',
    emoji: '🐲',
    category: 'Fantasy',
    description: 'Charming companion dragon with bat wings, segmented belly, and magic flame swirl',
    drawOutline: (ctx, w, h, isDarkMode, options) => {
      ctx.save();
      const s = Math.min(w, h) / 520;
      const cx = w / 2;
      const cy = h / 2 - 15 * s;

      const mainColor = options?.strokeColor || (isDarkMode ? '#F8FAFC' : '#0F172A');
      const baseWidth = (options?.lineWidth || 3.5) * s;

      ctx.strokeStyle = mainColor;
      ctx.lineWidth = baseWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Dragon Horns
      // Left Horn
      ctx.beginPath();
      ctx.moveTo(cx - 20 * s, cy - 90 * s);
      ctx.quadraticCurveTo(cx - 65 * s, cy - 145 * s, cx - 90 * s, cy - 130 * s);
      ctx.quadraticCurveTo(cx - 55 * s, cy - 105 * s, cx - 40 * s, cy - 75 * s);
      ctx.closePath();
      ctx.stroke();

      // Right Horn
      ctx.beginPath();
      ctx.moveTo(cx + 25 * s, cy - 90 * s);
      ctx.quadraticCurveTo(cx + 70 * s, cy - 145 * s, cx + 95 * s, cy - 130 * s);
      ctx.quadraticCurveTo(cx + 60 * s, cy - 105 * s, cx + 45 * s, cy - 75 * s);
      ctx.closePath();
      ctx.stroke();

      // 2. Dragon Head Contour
      ctx.beginPath();
      ctx.moveTo(cx - 40 * s, cy - 75 * s);
      ctx.quadraticCurveTo(cx, cy - 95 * s, cx + 45 * s, cy - 75 * s);
      ctx.bezierCurveTo(cx + 80 * s, cy - 40 * s, cx + 85 * s, cy + 15 * s, cx + 45 * s, cy + 30 * s);
      ctx.quadraticCurveTo(cx, cy + 42 * s, cx - 45 * s, cy + 30 * s);
      ctx.bezierCurveTo(cx - 85 * s, cy + 15 * s, cx - 80 * s, cy - 40 * s, cx - 40 * s, cy - 75 * s);
      ctx.closePath();
      ctx.stroke();

      // Snout Line & Nostrils
      ctx.beginPath();
      ctx.arc(cx - 14 * s, cy + 5 * s, 4 * s, 0, Math.PI * 2);
      ctx.arc(cx + 14 * s, cy + 5 * s, 4 * s, 0, Math.PI * 2);
      ctx.stroke();

      // Smiling Mouth with cute fang
      ctx.beginPath();
      ctx.moveTo(cx - 32 * s, cy + 16 * s);
      ctx.quadraticCurveTo(cx, cy + 28 * s, cx + 32 * s, cy + 16 * s);
      ctx.stroke();
      // Little Fang
      ctx.beginPath();
      ctx.moveTo(cx + 18 * s, cy + 21 * s);
      ctx.lineTo(cx + 22 * s, cy + 29 * s);
      ctx.lineTo(cx + 26 * s, cy + 20 * s);
      ctx.closePath();
      ctx.stroke();

      // Large Expressive Eyes with Highlights
      // Left Eye
      ctx.beginPath();
      ctx.ellipse(cx - 36 * s, cy - 25 * s, 15 * s, 20 * s, -0.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - 39 * s, cy - 32 * s, 6 * s, 0, Math.PI * 2);
      ctx.stroke();

      // Right Eye
      ctx.beginPath();
      ctx.ellipse(cx + 36 * s, cy - 25 * s, 15 * s, 20 * s, 0.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 33 * s, cy - 32 * s, 6 * s, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Plump Body Contour
      ctx.beginPath();
      ctx.moveTo(cx - 35 * s, cy + 30 * s);
      ctx.bezierCurveTo(cx - 90 * s, cy + 70 * s, cx - 75 * s, cy + 155 * s, cx - 25 * s, cy + 165 * s);
      ctx.lineTo(cx + 35 * s, cy + 165 * s);
      ctx.bezierCurveTo(cx + 85 * s, cy + 155 * s, cx + 90 * s, cy + 70 * s, cx + 35 * s, cy + 30 * s);
      ctx.closePath();
      ctx.stroke();

      // Segmented Soft Belly (Great for different colors)
      ctx.beginPath();
      ctx.moveTo(cx - 20 * s, cy + 38 * s);
      ctx.quadraticCurveTo(cx - 45 * s, cy + 100 * s, cx - 18 * s, cy + 165 * s);
      ctx.lineTo(cx + 18 * s, cy + 165 * s);
      ctx.quadraticCurveTo(cx + 45 * s, cy + 100 * s, cx + 20 * s, cy + 38 * s);
      ctx.closePath();
      ctx.stroke();

      // Belly Scales
      [65, 95, 125, 150].forEach((yOff) => {
        ctx.beginPath();
        ctx.moveTo(cx - 24 * s, cy + yOff * s);
        ctx.quadraticCurveTo(cx, cy + (yOff + 10) * s, cx + 24 * s, cy + yOff * s);
        ctx.stroke();
      });

      // 4. Bat Wings (Left & Right with 3 cells each)
      // Left Wing
      ctx.beginPath();
      ctx.moveTo(cx - 45 * s, cy + 45 * s);
      ctx.quadraticCurveTo(cx - 105 * s, cy - 25 * s, cx - 150 * s, cy - 10 * s);
      ctx.quadraticCurveTo(cx - 135 * s, cy + 40 * s, cx - 145 * s, cy + 75 * s);
      ctx.quadraticCurveTo(cx - 105 * s, cy + 85 * s, cx - 60 * s, cy + 95 * s);
      ctx.closePath();
      ctx.stroke();
      // Left Wing Struts (Cells)
      ctx.beginPath();
      ctx.moveTo(cx - 150 * s, cy - 10 * s);
      ctx.quadraticCurveTo(cx - 105 * s, cy + 35 * s, cx - 55 * s, cy + 60 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 145 * s, cy + 75 * s);
      ctx.quadraticCurveTo(cx - 110 * s, cy + 65 * s, cx - 55 * s, cy + 75 * s);
      ctx.stroke();

      // Right Wing
      ctx.beginPath();
      ctx.moveTo(cx + 45 * s, cy + 45 * s);
      ctx.quadraticCurveTo(cx + 105 * s, cy - 25 * s, cx + 150 * s, cy - 10 * s);
      ctx.quadraticCurveTo(cx + 135 * s, cy + 40 * s, cx + 145 * s, cy + 75 * s);
      ctx.quadraticCurveTo(cx + 105 * s, cy + 85 * s, cx + 60 * s, cy + 95 * s);
      ctx.closePath();
      ctx.stroke();
      // Right Wing Struts
      ctx.beginPath();
      ctx.moveTo(cx + 150 * s, cy - 10 * s);
      ctx.quadraticCurveTo(cx + 105 * s, cy + 35 * s, cx + 55 * s, cy + 60 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 145 * s, cy + 75 * s);
      ctx.quadraticCurveTo(cx + 110 * s, cy + 65 * s, cx + 55 * s, cy + 75 * s);
      ctx.stroke();

      // 5. Tail with Heart Spade
      ctx.beginPath();
      ctx.moveTo(cx + 25 * s, cy + 160 * s);
      ctx.bezierCurveTo(cx + 90 * s, cy + 180 * s, cx + 150 * s, cy + 160 * s, cx + 165 * s, cy + 105 * s);
      ctx.bezierCurveTo(cx + 145 * s, cy + 135 * s, cx + 90 * s, cy + 150 * s, cx + 35 * s, cy + 150 * s);
      ctx.closePath();
      ctx.stroke();

      // Tail Spade (Heart)
      const tx = cx + 172 * s;
      const ty = cy + 95 * s;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.bezierCurveTo(tx - 15 * s, ty - 22 * s, tx - 30 * s, ty + 5 * s, tx, ty + 25 * s);
      ctx.bezierCurveTo(tx + 30 * s, ty + 5 * s, tx + 15 * s, ty - 22 * s, tx, ty);
      ctx.closePath();
      ctx.stroke();

      ctx.restore();
    },
  },
  {
    id: 'crystal',
    name: 'Prismatic Gem Crystals',
    emoji: '💎',
    category: 'Mystic',
    description: 'Faceted geometric quartz crystal cluster rising from bedrock with radiant light facets',
    drawOutline: (ctx, w, h, isDarkMode, options) => {
      ctx.save();
      const s = Math.min(w, h) / 520;
      const cx = w / 2;
      const cy = h / 2 + 10 * s;

      const mainColor = options?.strokeColor || (isDarkMode ? '#F8FAFC' : '#0F172A');
      const baseWidth = (options?.lineWidth || 3.5) * s;

      ctx.strokeStyle = mainColor;
      ctx.lineWidth = baseWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Center Tall Crystal Obelisk
      const c1TopX = cx;
      const c1TopY = cy - 180 * s;
      // Apex point
      ctx.beginPath();
      ctx.moveTo(c1TopX, c1TopY);
      ctx.lineTo(c1TopX - 45 * s, c1TopY + 45 * s);
      ctx.lineTo(c1TopX - 40 * s, cy + 110 * s);
      ctx.lineTo(c1TopX + 40 * s, cy + 110 * s);
      ctx.lineTo(c1TopX + 45 * s, c1TopY + 45 * s);
      ctx.closePath();
      ctx.stroke();

      // Facet ridges on Center Crystal
      ctx.beginPath();
      ctx.moveTo(c1TopX, c1TopY);
      ctx.lineTo(c1TopX, c1TopY + 65 * s);
      ctx.lineTo(c1TopX, cy + 110 * s);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(c1TopX - 45 * s, c1TopY + 45 * s);
      ctx.lineTo(c1TopX, c1TopY + 65 * s);
      ctx.lineTo(c1TopX + 45 * s, c1TopY + 45 * s);
      ctx.stroke();

      // 2. Left Crystal Obelisk (Tilted)
      const c2TopX = cx - 85 * s;
      const c2TopY = cy - 110 * s;
      ctx.beginPath();
      ctx.moveTo(c2TopX, c2TopY);
      ctx.lineTo(c2TopX - 40 * s, c2TopY + 40 * s);
      ctx.lineTo(c2TopX - 35 * s, cy + 120 * s);
      ctx.lineTo(c2TopX + 30 * s, cy + 115 * s);
      ctx.lineTo(c2TopX + 35 * s, c2TopY + 45 * s);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(c2TopX, c2TopY);
      ctx.lineTo(c2TopX - 5 * s, c2TopY + 55 * s);
      ctx.lineTo(c2TopX, cy + 118 * s);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(c2TopX - 40 * s, c2TopY + 40 * s);
      ctx.lineTo(c2TopX - 5 * s, c2TopY + 55 * s);
      ctx.lineTo(c2TopX + 35 * s, c2TopY + 45 * s);
      ctx.stroke();

      // 3. Right Crystal Obelisk (Tilted)
      const c3TopX = cx + 85 * s;
      const c3TopY = cy - 125 * s;
      ctx.beginPath();
      ctx.moveTo(c3TopX, c3TopY);
      ctx.lineTo(c3TopX - 35 * s, c3TopY + 45 * s);
      ctx.lineTo(c3TopX - 30 * s, cy + 115 * s);
      ctx.lineTo(c3TopX + 35 * s, cy + 120 * s);
      ctx.lineTo(c3TopX + 40 * s, c3TopY + 40 * s);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(c3TopX, c3TopY);
      ctx.lineTo(c3TopX + 5 * s, c3TopY + 55 * s);
      ctx.lineTo(c3TopX, cy + 118 * s);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(c3TopX - 35 * s, c3TopY + 45 * s);
      ctx.lineTo(c3TopX + 5 * s, c3TopY + 55 * s);
      ctx.lineTo(c3TopX + 40 * s, c3TopY + 40 * s);
      ctx.stroke();

      // 4. Far Left Small Crystal Shard
      ctx.beginPath();
      ctx.moveTo(cx - 135 * s, cy - 35 * s);
      ctx.lineTo(cx - 165 * s, cy + 10 * s);
      ctx.lineTo(cx - 145 * s, cy + 130 * s);
      ctx.lineTo(cx - 105 * s, cy + 125 * s);
      ctx.lineTo(cx - 110 * s, cy + 15 * s);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 135 * s, cy - 35 * s);
      ctx.lineTo(cx - 135 * s, cy + 25 * s);
      ctx.lineTo(cx - 125 * s, cy + 128 * s);
      ctx.stroke();

      // 5. Far Right Small Crystal Shard
      ctx.beginPath();
      ctx.moveTo(cx + 135 * s, cy - 45 * s);
      ctx.lineTo(cx + 110 * s, cy + 15 * s);
      ctx.lineTo(cx + 105 * s, cy + 125 * s);
      ctx.lineTo(cx + 145 * s, cy + 130 * s);
      ctx.lineTo(cx + 165 * s, cy + 10 * s);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 135 * s, cy - 45 * s);
      ctx.lineTo(cx + 135 * s, cy + 25 * s);
      ctx.lineTo(cx + 125 * s, cy + 128 * s);
      ctx.stroke();

      // 6. Bedrock Matrix (Rocky Base)
      ctx.beginPath();
      ctx.moveTo(cx - 180 * s, cy + 130 * s);
      ctx.lineTo(cx - 140 * s, cy + 110 * s);
      ctx.lineTo(cx - 80 * s, cy + 125 * s);
      ctx.lineTo(cx, cy + 112 * s);
      ctx.lineTo(cx + 80 * s, cy + 125 * s);
      ctx.lineTo(cx + 140 * s, cy + 110 * s);
      ctx.lineTo(cx + 180 * s, cy + 130 * s);
      ctx.lineTo(cx + 160 * s, cy + 165 * s);
      ctx.lineTo(cx - 160 * s, cy + 165 * s);
      ctx.closePath();
      ctx.stroke();

      // 7. Sparkle Glints
      const drawGlint = (gx: number, gy: number, rad: number) => {
        ctx.beginPath();
        ctx.moveTo(gx, gy - rad);
        ctx.quadraticCurveTo(gx, gy, gx + rad, gy);
        ctx.quadraticCurveTo(gx, gy, gx, gy + rad);
        ctx.quadraticCurveTo(gx, gy, gx - rad, gy);
        ctx.quadraticCurveTo(gx, gy, gx, gy - rad);
        ctx.closePath();
        ctx.stroke();
      };

      drawGlint(cx + 15 * s, cy - 195 * s, 18 * s);
      drawGlint(cx - 105 * s, cy - 130 * s, 14 * s);
      drawGlint(cx + 105 * s, cy - 145 * s, 15 * s);
      drawGlint(cx - 55 * s, cy - 25 * s, 10 * s);
      drawGlint(cx + 60 * s, cy - 10 * s, 10 * s);

      ctx.restore();
    },
  },
  {
    id: 'sun_moon',
    name: 'Celestial Sun & Moon',
    emoji: '☀️',
    category: 'Mystic',
    description: 'Alchemical celestial face with crescent moon embracing radiant solar flame coronal rays',
    drawOutline: (ctx, w, h, isDarkMode, options) => {
      ctx.save();
      const s = Math.min(w, h) / 520;
      const cx = w / 2;
      const cy = h / 2;

      const mainColor = options?.strokeColor || (isDarkMode ? '#F8FAFC' : '#0F172A');
      const baseWidth = (options?.lineWidth || 3.5) * s;

      ctx.strokeStyle = mainColor;
      ctx.lineWidth = baseWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Central Circle (Inner Disc)
      const r = 90 * s;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Crescent Moon Profile (Left side dividing line)
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      // Forehead
      ctx.bezierCurveTo(cx - 25 * s, cy - 60 * s, cx - 35 * s, cy - 35 * s, cx - 18 * s, cy - 15 * s);
      // Nose
      ctx.lineTo(cx - 42 * s, cy);
      ctx.lineTo(cx - 18 * s, cy + 12 * s);
      // Lips
      ctx.quadraticCurveTo(cx - 28 * s, cy + 26 * s, cx - 18 * s, cy + 36 * s);
      // Chin
      ctx.quadraticCurveTo(cx - 32 * s, cy + 50 * s, cx - 18 * s, cy + 65 * s);
      // Jaw to bottom
      ctx.bezierCurveTo(cx - 25 * s, cy + 75 * s, cx - 10 * s, cy + 85 * s, cx, cy + r);
      ctx.stroke();

      // Moon Eye (Sleeping / Peaceful)
      ctx.beginPath();
      ctx.arc(cx - 45 * s, cy - 25 * s, 12 * s, 0.2, Math.PI - 0.2);
      ctx.stroke();
      // Eyelashes
      ctx.beginPath();
      ctx.moveTo(cx - 50 * s, cy - 16 * s); ctx.lineTo(cx - 53 * s, cy - 9 * s);
      ctx.moveTo(cx - 45 * s, cy - 13 * s); ctx.lineTo(cx - 45 * s, cy - 5 * s);
      ctx.moveTo(cx - 40 * s, cy - 16 * s); ctx.lineTo(cx - 37 * s, cy - 9 * s);
      ctx.stroke();

      // Sun Eye (Awake / Serene)
      ctx.beginPath();
      ctx.arc(cx + 35 * s, cy - 25 * s, 14 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 35 * s, cy - 25 * s, 6 * s, 0, Math.PI * 2);
      ctx.stroke();
      // Sun Eyebrow
      ctx.beginPath();
      ctx.arc(cx + 35 * s, cy - 32 * s, 18 * s, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();

      // Sun Smile & Cheek
      ctx.beginPath();
      ctx.arc(cx + 35 * s, cy + 25 * s, 18 * s, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 52 * s, cy + 8 * s, 10 * s, 0, Math.PI * 2); // Rosy cheek
      ctx.stroke();

      // 3. Alternating Coronal Sun Rays (16 Rays: 8 Triangular, 8 Flame Wavy)
      const rayCount = 16;
      for (let i = 0; i < rayCount; i++) {
        const a1 = (i * Math.PI * 2) / rayCount;
        const a2 = ((i + 1) * Math.PI * 2) / rayCount;
        const am = a1 + Math.PI / rayCount;

        if (i % 2 === 0) {
          // Sharp Triangular Ray
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
          ctx.lineTo(cx + Math.cos(am) * (r + 75 * s), cy + Math.sin(am) * (r + 75 * s));
          ctx.lineTo(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r);
          ctx.closePath();
          ctx.stroke();

          // Internal crease
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(am) * r, cy + Math.sin(am) * r);
          ctx.lineTo(cx + Math.cos(am) * (r + 75 * s), cy + Math.sin(am) * (r + 75 * s));
          ctx.stroke();
        } else {
          // Wavy Flame Ray
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
          const tipX = cx + Math.cos(am) * (r + 65 * s);
          const tipY = cy + Math.sin(am) * (r + 65 * s);
          const ctrl1X = cx + Math.cos(am - 0.15) * (r + 35 * s);
          const ctrl1Y = cy + Math.sin(am - 0.15) * (r + 35 * s);
          const ctrl2X = cx + Math.cos(am + 0.15) * (r + 45 * s);
          const ctrl2Y = cy + Math.sin(am + 0.15) * (r + 45 * s);

          ctx.bezierCurveTo(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, tipX, tipY);
          ctx.bezierCurveTo(ctrl2X, ctrl2Y, ctrl1X, ctrl1Y, cx + Math.cos(a2) * r, cy + Math.sin(a2) * r);
          ctx.closePath();
          ctx.stroke();
        }
      }

      ctx.restore();
    },
  },
  {
    id: 'wave',
    name: 'The Great Ocean Wave',
    emoji: '🌊',
    category: 'Nature',
    description: 'Majestic curling ocean crest with foam claws, water eddies, and Mount Fuji backdrop',
    drawOutline: (ctx, w, h, isDarkMode, options) => {
      ctx.save();
      const s = Math.min(w, h) / 520;
      const cx = w / 2;
      const cy = h / 2;

      const mainColor = options?.strokeColor || (isDarkMode ? '#F8FAFC' : '#0F172A');
      const baseWidth = (options?.lineWidth || 3.5) * s;

      ctx.strokeStyle = mainColor;
      ctx.lineWidth = baseWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Mount Fuji in the background
      ctx.beginPath();
      ctx.moveTo(cx - 60 * s, cy + 30 * s);
      ctx.lineTo(cx - 15 * s, cy - 45 * s);
      ctx.lineTo(cx + 15 * s, cy - 45 * s);
      ctx.lineTo(cx + 60 * s, cy + 30 * s);
      ctx.closePath();
      ctx.stroke();
      // Snow Cap on Fuji
      ctx.beginPath();
      ctx.moveTo(cx - 24 * s, cy - 25 * s);
      ctx.lineTo(cx - 15 * s, cy - 18 * s);
      ctx.lineTo(cx, cy - 23 * s);
      ctx.lineTo(cx + 15 * s, cy - 18 * s);
      ctx.lineTo(cx + 24 * s, cy - 25 * s);
      ctx.stroke();

      // 2. Primary Massive Wave Crest
      ctx.beginPath();
      ctx.moveTo(cx - 220 * s, cy + 160 * s);
      ctx.bezierCurveTo(
        cx - 200 * s, cy + 20 * s,
        cx - 160 * s, cy - 120 * s,
        cx - 40 * s, cy - 150 * s
      );
      ctx.bezierCurveTo(
        cx + 60 * s, cy - 165 * s,
        cx + 130 * s, cy - 90 * s,
        cx + 80 * s, cy - 20 * s
      );
      // Curl inwards
      ctx.bezierCurveTo(
        cx + 40 * s, cy + 25 * s,
        cx - 30 * s, cy - 10 * s,
        cx - 20 * s, cy - 70 * s
      );
      ctx.stroke();

      // 3. Wave Foam Claws / Tendrils (Closed shapes for coloring white/cyan foam)
      const clawPoints = [
        { x: cx + 115 * s, y: cy - 110 * s },
        { x: cx + 135 * s, y: cy - 75 * s },
        { x: cx + 110 * s, y: cy - 45 * s },
        { x: cx + 75 * s, y: cy - 15 * s },
        { x: cx + 30 * s, y: cy + 10 * s },
      ];

      clawPoints.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 9 * s, 0, Math.PI * 2);
        ctx.stroke();
        // Droplets
        ctx.beginPath();
        ctx.arc(pt.x + 14 * s, pt.y - 12 * s, 4 * s, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 4. Secondary Under-Wave (Right Side)
      ctx.beginPath();
      ctx.moveTo(cx - 50 * s, cy + 160 * s);
      ctx.bezierCurveTo(
        cx + 40 * s, cy + 110 * s,
        cx + 150 * s, cy + 60 * s,
        cx + 220 * s, cy + 100 * s
      );
      ctx.lineTo(cx + 220 * s, cy + 160 * s);
      ctx.closePath();
      ctx.stroke();

      // 5. Water Flow Eddies & Streaks
      [-20, 20, 60, 100].forEach((yOff) => {
        ctx.beginPath();
        ctx.moveTo(cx - 180 * s, cy + (yOff + 50) * s);
        ctx.bezierCurveTo(
          cx - 100 * s, cy + (yOff + 20) * s,
          cx + 50 * s, cy + (yOff + 10) * s,
          cx + 180 * s, cy + (yOff + 45) * s
        );
        ctx.stroke();
      });

      ctx.restore();
    },
  },
];
