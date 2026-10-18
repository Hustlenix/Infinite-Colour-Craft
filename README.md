# INFINITE COLOUR CRAFT

This is my idea in play, inspired by [Infinite Craft](https://neal.fun/infinite-craft/).

My idea is that make a game where you mix colours to discover new ones, and you gotta use those colours to paint. You start with red, green, blue, white and black, and keep mixing from there.

My idea in play: [game](https://hustlenix.github.io/Infinite-Colour-Craft/).

![Mixing colours on the board](docs/screenshots/discovery.png)

## Play

I published it on GitHub Pages, and am doing the version control using github.

**[Play](https://hustlenix.github.io/Infinite-Colour-Craft/)** · **[Latest work](https://github.com/Hustlenix/Infinite-Colour-Craft/tree/codex/ai-grimoire-fixes)**

The AI Lab and Grimoire fixes are on that branch. The live game still follows `main`.

## Verified status

OFC this works, dont trust me?

See: [verification evidence and remaining device-QA limits](docs/AI-GRIMOIRE-FIXES.md).

Those results are for the AI Lab and Grimoire fix commit `44dae94`. The next visual changes are still local and being checked.

## My idea

My plan was to make a simple colour experiment with a painting studio behind it. So you can mix colours, discover something you like, and actually use it in a drawing.

The studio has brushes, fill, stamps, symmetry, outlines and stuff. You can undo, redo and export your painting as a PNG.

![Painting studio](docs/screenshots/studio.png)

I also added **AI Lab** and **Grimoire**. In AI Lab you draw and the model tries to guess it, or you can play the five-round drawing challenge. Grimoire is for recipes, palettes, quests and daily challenges.

**TRY THE STUDIO TOO, DONT JUST MIX THE COLOURS AND LEAVE!**✌🏻

The AI only knows cat, dog, bird, fish, flower, tree, star, clock, car and book. It runs in your browser, no API key needed. The mixes are game recipes and colour maths, not a simulation of real paint.

Discovered colours and palettes are saved in your browser. Export paintings you want to keep — the version on this branch doesn't recover them after a refresh yet.

## Build and release

**Dependency**

1. Node.js and npm. Local checks used Node.js 24.
2. Github, for version control and Pages hosting.
3. A running relay or a configured Supabase project, if you want multiplayer. The local server includes a relay; GitHub Pages can't run it.

**Command**

```sh
git clone https://github.com/Hustlenix/Infinite-Colour-Craft.git
cd Infinite-Colour-Craft
git switch codex/ai-grimoire-fixes
npm ci
npm run dev
```

Open http://localhost:3000/.

For the checks:

```sh
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

For GitHub Pages, run `npm run build:pages`, then `npm run test:pages` to check that build.

## Credits

Made with React, TypeScript, Vite, Tailwind, Canvas 2D and Web Audio, with help from AI coding tools. Icons are from [Lucide](https://lucide.dev/), celebrations use [canvas-confetti](https://github.com/catdad/canvas-confetti), and the doodle model uses ten categories from Google's [Quick, Draw! dataset](https://github.com/googlecreativelab/quickdraw-dataset). Sounds are made in the browser.

# Licence

[MIT](LICENSE). Dependencies and datasets keep their own licences.
