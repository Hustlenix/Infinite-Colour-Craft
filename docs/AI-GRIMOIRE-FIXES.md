# AI Lab and Grimoire fixes

The implementation starts from upstream `bf7e7a32f67c91d70df7cdd7b5ff00438196f6f6` in the fresh clone, on `codex/ai-grimoire-fixes`.

The user's instruction to preserve the design takes precedence over the redesign language in the attached brief. The original branding, typography, colours, borders, cards and crafting layout remain. The global stylesheet, Navbar, WorkspaceBoard, SidebarInventory and PaintCanvas files are unchanged. New controls use the existing styles. A scroll wrapper makes the original navbar reachable on narrow screens.

## AI Lab

- Both modes share canonical vector strokes, pointer capture/cancellation, coordinate scaling, preprocessing and one lazy cached model loader. Theme changes redraw the same strokes without clearing them.
- Both modes stay mounted during navigation. Doodle Vision keeps its sketch and predictions. A challenge pauses when leaving its mode, leaving AI Lab or hiding the browser tab; returning requires **Resume round**. Drawings and sessions live in memory; reloading starts a new session, as stated in the interface.
- Doodle Vision evaluates only when Recognize is pressed, shows the top three actual predictions, and explains a blank canvas. Clear, a new stroke, navigation and unmount cancel outstanding predictions and their timers. Worker failures and unavailable/corrupt model weights have retry paths.
- Speed Challenge has five distinct prompts and five scored rounds, feedback for every round, final results and restart. A synchronous ref guards evaluation, while a `performance.now()` deadline determines remaining time and score. Display-timer throttling does not add time. Pauses preserve the fractional seconds remaining.
- The existing on-device CNN, weights and preprocessing algorithm are retained. Model shape and input tensors are validated. One lazy worker keeps inference off the UI thread; the prior cold main-thread measurement was about 160 ms, which justified it.
- The interface prominently lists the ten supported categories: cat, dog, bird, fish, flower, tree, star, clock, car and book. The technical preview is collapsible. The recorded 88.68% validation accuracy is explicitly a training metric; prediction scores are not presented as measured accuracy on player drawings.
- Unlocked pigments can be selected as ink, while preprocessing always uses a black-on-white canonical mask. Craft and Studio links share the painting colour. Predictions never award pigments.

## Grimoire

- Recipes, Palettes, Quests and Daily share visible navigation with active states. Existing navbar entry points and keyboard shortcuts remain. Section state and palette drafts survive navigation.
- Recipes support name/hex/category search, category filtering, name/date/hue/rarity sorting, an empty state and keyboard-accessible details. Details provide known ancestry, stable hexadecimal parent identifiers, colour specifications, discovery information, copying, Board/Studio actions and Add to Palette.
- A pigment keeps its first recorded recipe; additional ingredient pairs are recorded separately. Legacy parent names are migrated only when unambiguous. Unknown/reward ancestry is identified honestly. Recursive display has cycle/depth guards.
- Palettes support editing and renaming in place, adding/removing pigments, reordering with accessible controls, duplication, confirmed deletion, Studio actions and saved-state recovery. The existing `icc_palettes` storage format remains. Empty names get a default and duplicate names get a suffix.
- HEX, CSS custom properties, Tailwind v4 `@theme` and JSON export the exact saved palette. Clipboard promises must resolve before success is shown. Rejection exposes selectable text for manual copying.
- Quest definitions and evaluators are separate from their UI. Count quests use starters plus natural discoveries; category/rarity quests require actual crafting records. The multi-step quest requires verified ancestry. Self mixes and cyclic replay cannot inflate depth. Crafting metadata is recorded separately from an existing reward pigment's metadata.
- Quest and daily claims share one synchronous mechanism. A claim and its pigment unlock are saved together in one snapshot before being granted. Repeated clicks cannot duplicate the reward, already-owned rewards can still be claimed, and reward claims do not produce crafting events. A failed primary save leaves the claim available and displays a retry warning.
- Daily progress distinguishes crafting from new discovery. The three-new-colours objective rejects previously unlocked colours and repeat results. Category objectives count distinct matching pigments. Event IDs protect against duplicate delivery. Repeated combinations are accepted only for an explicitly repeatable combination objective.

## Saved data and calendar policy

`icc_progression_v1` stores discoveries, actual recipes, claims and daily state together. Existing unlocked-colour, claimed-quest and daily keys are migrated, and legacy keys remain readable after successful updates. Existing claimed rewards are retained when quest rules become more accurate.

Daily challenges use the player's **local calendar date**, not UTC or a fixed server timezone. A one-second clock check plus focus/visibility listeners refreshes the challenge without a reload. A new day clears per-day events/progress/claims. Consecutive completions preserve the streak; a missed day resets it. Previous-day calculation uses local calendar arithmetic rather than subtracting 24 hours, including DST boundaries.

The full Craft → Recipes → Palette → Studio → AI Lab → Craft journey is covered by a real browser test. Studio and AI work survive these navigation steps. Persistent progress remains scoped to the browser profile and origin; moving to another localhost port does not transfer that profile's saves automatically.

## Verification

- `npm run lint`: TypeScript passed.
- `npm run build`: the client and server production build passed.
- `npm test`: **112 tests passed** across six Vitest files. Coverage includes real model/reference inference, model retry/validation, deadline scoring, five-round transitions, inference timeout cleanup, quest evidence, deep legacy ancestry, daily duplicates/streaks/rollover, corrupted optional save fields and palette exports.
- `npm run test:e2e`: **20 browser tests passed**. Coverage includes real drawing/recognition, theme and navigation persistence, real model fetch failure/retry, rapid duplicate submission, timer throttling, restart, Grimoire navigation/search/details, palette edit/reorder/reload, blocked clipboard, one-time claims, blocked storage, already-owned daily rewards, midnight, emulated touch/cancellation and the complete cross-feature journey.
- Responsive checks passed at 1440×900 DPR1 and DPR2, 1024×768, 820×1180, 800×900, 390×844 and 320×568. Screenshots are in `docs/verification/`.
- `npm run build:pages`: passed. This command now works on Windows as well as Unix shells.
- `npm run test:pages`: **3 production browser tests passed**, including actual star recognition, touch drawing, model/worker loading and the complete cross-feature journey at the built `/Infinite-Colour-Craft/` route.

Run `npm run build:pages` immediately before `npm run test:pages`; the verification command tests the existing build output. Use `npm ci` and `npx playwright install chromium` when setting up another machine.

Reference tensors verify numerical parity, and the browser suite draws an actual star through pointer input and checks its prediction. These checks do not establish a new real-world recognition accuracy. Browser verification uses Chromium and emulated touch; physical stylus hardware and other browser engines were not tested. The existing Vite large-chunk warning remains. No production deployment or push is included.

## File manifest

The exact source/configuration changes are listed in `changed-files.txt`. Screenshot files under `verification/` are generated evidence. The four temporary implementation scripts were removed; only reusable build/verification scripts remain.
