<div align="center">

# 🎨 Infinite Colour Craft

**A color mixing game and paint studio for the browser.**

Mix paints to discover new colors, hit daily goals, unlock rewards, and draw your own artwork — no downloads, no installs.

[▶️ Live Demo — GitHub Pages](https://Hustlenix.github.io/Infinite-Colour-Craft/)

</div>

---

## What is it?

You start with five paints — Red, Green, Blue, White and Black. Drag two colors together and the game mixes them for you (with real paint-style RYB math). Some mixes match known recipes, like Orange or Purple. Everything else gets matched to the nearest real color name, so you always discover a color you can recognize.

## Features

- **Crafting board** — drag colors together to mix new ones and unlock them permanently.
- **Daily challenge** — one new goal every day, plus a streak counter and a unique reward color.
- **Quests** — milestone goals that unlock bonus colors and badges.
- **Paint studio** — a canvas with brush, pen, marker, spray, bucket fill, eyedropper and more, plus symmetry modes, outline templates, undo/redo, and PNG export.
- **Recipe book** — see how each color you discovered was made.
- **Palette builder** — save your own palettes from colors you've unlocked.
- **Procedural audio** — mixing and painting sounds are synthesized live with Web Audio, so there are no audio files to load.
- **Dark / light mode**, and your progress is saved in the browser.

## Run locally

**Prerequisites:** Node.js 18+ (or [Bun](https://bun.sh))

```bash
# with npm
npm install
npm run dev

# with bun
bun install
bun run dev
```

Then open http://localhost:3000/Infinite-Colour-Craft/ (the base path matches the GitHub Pages subpath).

## Build & deploy

```bash
npm run build   # or: bun run build
npm run preview # serve the production build locally
```

The repo includes a [GitHub Actions workflow](.github/workflows/deploy.yml) that builds and publishes to GitHub Pages on every push to `main`.

## Checks

```bash
npm run lint    # TypeScript typecheck (tsc --noEmit)
```

## Project structure

```
src/
  App.tsx                  # App shell, state, localStorage persistence
  components/              # Navbar, Crafting Board, Paint Canvas, modals, sidebar
  data/canvasTemplates.ts  # Paint studio outline templates
  data/realColors.ts       # Dictionary of real color names used for naming
  utils/
    colorEngine.ts         # Hex/RGB/HSL/RYB math, recipes, procedural naming
    audioSynth.ts          # Web Audio synthesizer
    dailyChallengeEngine.ts# Deterministic daily challenge generator
  types.ts
```
