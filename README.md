# INFINITE COLOUR CRAFT

My idea is pretty simple: start with five colours, mix them, find something new, and actually paint with what you found.

I got the idea from [Infinite Craft](https://neal.fun/infinite-craft/). That game lets you combine objects; mine is about colours, with a painting studio behind it. You can spend ages mixing stuff and then realise you still haven't drawn anything🤣

**[Play](https://hustlenix.github.io/Infinite-Colour-Craft/)** · **[Latest fixes](https://github.com/Hustlenix/Infinite-Colour-Craft/tree/codex/ai-grimoire-fixes)**

The live game follows `main`. The latest AI Lab and Grimoire fixes are on the linked branch, so those two versions can be different.

![Mixing colours on the crafting board](docs/screenshots/discovery.png)

## Play

You start with Red, Green, Blue, White and Black. Drag one colour onto another and see what happens. Some pairs have set recipes, and other pairs use the colour-mixing code.

This is colour alchemy, BTW. There are some surprising recipes, so don't treat it as a physically accurate paint simulator.

Once you have a colour you like, take it into **Studio**. There are brushes, a pen, marker, spray, chisel, smudge, rainbow, stamps, fill, colour picker and eraser. You also get symmetry, smoothing, blend modes, outlines, undo/redo and PNG export. Yeah, there is a bit more behind the canvas than it first looks✌🏻

![The painting studio](docs/screenshots/studio.png)

## AI Lab and Grimoire

**AI Lab** tries to recognise your doodles, or gives you five timed drawing rounds. The model runs in your browser. You don't need an AI API key for it.

It only knows **cat, dog, bird, fish, flower, tree, star, clock, car and book**. Draw something else and it'll still try to fit it into one of those ten. The recorded **88.68% validation accuracy** came from training; it isn't a promise about your drawing.

**Grimoire** keeps the other stuff together: recipes, editable palettes, quests and a daily challenge. You can reorder palette colours and export HEX, CSS, Tailwind v4 or JSON. Daily goals follow your local date.

Discoveries and palettes are saved in your browser. AI Lab sketches and challenge sessions survive navigation, but a reload starts them fresh. Export paintings you want to keep; the committed version doesn't restore artwork after a reload yet.

## Verified status

Don't just take my word for it. Here are the [checks, screenshots and remaining limits](docs/AI-GRIMOIRE-FIXES.md).

For the AI Lab and Grimoire fix commit `44dae94`, the recorded checks passed: **112 unit tests, 20 browser tests and 3 browser checks against the production build**, plus TypeScript and both builds.

That covers Chromium and emulated touch. Physical stylus hardware and other browser engines still need checking. The next visual refinement is local work in progress, not part of those results.

## Run it yourself

Use a current Node.js LTS release and npm. This project was checked locally with Node.js 24.

```sh
git clone https://github.com/Hustlenix/Infinite-Colour-Craft.git
cd Infinite-Colour-Craft
git switch codex/ai-grimoire-fixes
npm ci
npm run dev
```

Open **http://localhost:3000/**. No paid service is needed for solo mixing, painting or doodle recognition.

Collaboration needs a running WebSocket relay or a configured Supabase project. The local development server includes a relay. GitHub Pages can't run that server, so don't assume opening the static site means multiplayer is connected.

## Build and checks

```sh
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

For the GitHub Pages path:

```sh
npm run build:pages
npm run test:pages
```

The second command checks the build produced by the first. The [deployment workflow](.github/workflows/deploy.yml) publishes pushes to `main`; pushing this feature branch doesn't deploy it.

## What is behind it?

React, TypeScript, Vite and Tailwind for the app. Canvas 2D for drawing, Web Audio for synthesised sounds, and a trained CNN exported as weights for doodle recognition. The model uses ten categories from Google's [Quick, Draw! dataset](https://github.com/googlecreativelab/quickdraw-dataset).

AI coding tools have helped with implementation and fixes. The code and test evidence are here so you can see what actually works.

Thanks to [React](https://react.dev/), [Vite](https://vite.dev/), [Tailwind](https://tailwindcss.com/), [Lucide](https://lucide.dev/), [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/) and [canvas-confetti](https://github.com/catdad/canvas-confetti). The colour dictionary references public colour-name lists and Wikipedia; sounds are synthesised in the browser.

## Licence

[MIT](LICENSE). Third-party dependencies and datasets keep their own licences.
