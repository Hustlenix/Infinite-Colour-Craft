<div align="center">

# 🎨 Infinite Colour Craft

**A gamified color alchemy studio & tactical 2D paint engine.**

Combine pigments to discover 100+ new colors, unlock rare tiers, complete daily challenges & quests, and paint expressive artwork in the studio — all with real-time acoustic brush feedback.

[▶️ Live Demo — GitHub Pages](https://Hustlenix.github.io/Infinite-Colour-Craft/)

</div>

---

## ✨ Features

- **🧪 Alchemy Crafting Board** — Drag base spectrum elements together (Red, Green, Blue, White, Black) to synthesize new pigments. Known recipes unlock curated colors; everything else is procedurally generated with real RYB paint-mixing math.
- **🎯 Daily Challenges** — A fresh deterministic alchemy goal every midnight, with streak tracking and exclusive daily reward pigments.
- **⚔️ Quests & Rewards** — Milestone quests that grant bonus secret pigments & badges.
- **🖌️ Paint Studio** — Full-featured canvas with 10 brush tools (brush, pen, marker, spray, chisel, rainbow, stamp, bucket fill, eyedropper, eraser), symmetry stencils (2/4/8/12-way), paper textures, outline templates, undo/redo, and PNG export.
- **🔊 Procedural Audio** — Web Audio synthesized pops, chimes, and per-tool 2D acoustic brush sounds (no audio files needed).
- **📖 Recipe Book** — Inspect every discovered pigment's lineage, parent components, and color specs.
- **🎛️ Palette Builder** — Save custom palettes from your discoveries.
- **🌗 Dark / Light mode** and progress persisted in `localStorage`.

## 🚀 Run Locally

**Prerequisites:** Node.js 18+ (or [Bun](https://bun.sh))

```bash
# with npm
npm install
npm run dev

# with bun
bun install
bun run dev
```

Open http://localhost:3000/Infinite-Colour-Craft/ (the base path matches the GitHub Pages subpath).

## 🏗️ Build & Deploy

```bash
npm run build   # or: bun run build
npm run preview # serve the production build locally
```

The repo includes a [GitHub Actions workflow](.github/workflows/deploy.yml) that automatically builds and publishes to GitHub Pages on every push to `main`.

## 🧪 Quality Checks

```bash
npm run lint    # TypeScript typecheck (tsc --noEmit)
```

## 📁 Project Structure

```
src/
  App.tsx                  # App shell, state, localStorage persistence
  components/              # Navbar, Crafting Board, Paint Canvas, modals, sidebar
  data/canvasTemplates.ts  # Paint studio outline templates
  utils/
    colorEngine.ts         # Hex/RGB/HSL/RYB math, recipes, procedural naming
    audioSynth.ts          # Web Audio synthesizer
    dailyChallengeEngine.ts# Deterministic daily challenge generator
  types.ts
```
