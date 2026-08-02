# Infinite Colour Craft 🎨✨

> **Tagline:** A gamified color alchemy studio and tactile digital paint engine where players synthesize secret pigments and express their creativity with real-time acoustic brush feedback.

---

## Inspiration

Traditional color mixing in physical painting is magical: dragging yellow into cobalt blue yields organic greens with texture, weight, and depth. However, digital painting tools often reduce color selection to cold, mechanical RGB sliders and hex input boxes.

**Infinite Colour Craft** was born from a desire to bring back the joyful alchemy of hands-on pigment discovery. We wanted to build a game where color isn't just picked—it is *crafted* through chemical-like combinations on an alchemy workspace, and then painted onto interactive canvases with physical acoustic feedback that mimics real bristles, paper friction, and pressure.

---

## What it does

**Infinite Colour Craft** turns digital art into an engaging, multi-layered creative playground:

1. **Pigment Alchemy Workspace:**
   * Start with fundamental primary pigments ($Red$, $Yellow$, $Blue$, $White$, $Black$).
   * Drag, drop, and fuse tiles on a floating workspace board to discover over **30+ secret pigments** (e.g. *Saffron Yellow*, *Emerald Green*, *Royal Indigo*, *Terracotta*, *Cosmic Magenta*).
   * Discover recipe books, complete daily quests, and build a customized palette.

2. **Tactile 2D Paint Studio:**
   * **10 Organic Tools:** Expressive Wet Brush, Ink Pen, Felt Marker, Aerosol Spray, Chisel Calligraphy, Rainbow Brush, Badge Stamps, Flood Fill Bucket, Eyedropper, and Precision Eraser.
   * **Symmetry & Kaleidoscope Stencil Engine:** Paint in 2-Way Mirror, 4-Way Quad, 8-Way Mandala, or 12-Way Kaleidoscope modes with frame-perfect precision.
   * **Interactive Template Outlines:** Color in templates including *Cute Kitten*, *Magic Butterfly*, *Baby Dragon*, *Star Portal*, and *Space Rocket*.
   * **Canvas Textures:** Switch between White Paper, Dark Slate, Vintage Parchment, Blueprint Grid, and Neon Glow paper backgrounds.

3. **Real-time Synthesized Audio Acoustics:**
   * Hear custom Web Audio API synthesized sounds while drawing: wet bristle rustling, felt marker glide, aerosol hiss, and chime notifications on pigment unlocks.

4. **Touch & Mobile Optimizations:**
   * Custom gesture interceptors that disable browser pull-to-refresh and multi-touch pinch-zoom on touch devices, enabling frame-perfect painting.

---

## How we built it

**Infinite Colour Craft** is built with modern web technologies and mathematical color algorithms:

* **Frontend Framework:** React 18 with TypeScript and Vite.
* **Styling & UI:** Tailwind CSS with a bold, neo-brutalist tactile design aesthetic.
* **Canvas Engine:** HTML5 Canvas API with sub-pixel interpolation, smooth quadratic Bezier curve stroke smoothing, and High-DPI scaling.
* **Audio Synthesizer:** Pure Web Audio API pink noise generators with dynamic Biquad bandpass filter modulations for organic drawing sounds.

### Mathematical & Algorithmic Foundations

#### 1. Subtractive Pigment Blending Model
Unlike additive RGB blending where red and green yield yellow ($R+G=Y$), physical paint uses subtractive mixing. We calculate pigment weight blends using weighted power-law gamma interpolation:

$$\mathbf{C}_{\text{blend}} = \left( \sum_{i=1}^{k} w_i \cdot \mathbf{C}_i^{\gamma} \right)^{\frac{1}{\gamma}}$$

where $\mathbf{C}_i = (R_i, G_i, B_i)$ represents individual pigment channels, $w_i$ is the normalized mixing weight ($\sum w_i = 1$), and $\gamma = 2.2$ accounts for perceptual gamma correction.

#### 2. Multi-Way Symmetry Transformation
Symmetry modes calculate transformed point coordinates $(x', y')$ from primary pointer input $(x, y)$ around canvas center $(x_c, y_c)$ using 2D rotation matrices:

$$\begin{pmatrix} x' \\ y' \end{pmatrix} = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix} \begin{pmatrix} x - x_c \\ y - y_c \end{pmatrix} + \begin{pmatrix} x_c \\ y_c \end{pmatrix}$$

where $\theta = \frac{2\pi \cdot k}{N}$ for an $N$-way symmetry stencil ($N \in \{2, 4, 8, 12\}$).

#### 3. Real-Time Acoustic Frequency Modulation
Bristle friction frequency $f_{\text{bristle}}$ dynamically updates based on drawing velocity $v = \frac{\Delta d}{\Delta t}$ and stroke parameters:

$$f_{\text{bristle}} = f_{\text{base}} + \alpha \cdot v + \beta \cdot H_{\text{hue}}$$

where $f_{\text{base}} \in [300\,\text{Hz}, 2200\,\text{Hz}]$, $\alpha$ controls friction pitch shift, and $H_{\text{hue}}$ introduces subtle timbre shifts based on pigment color hue.

---

## Challenges we ran into

1. **Touch Gesture Conflicts:** Mobile browsers default to pull-to-refresh gestures or multi-finger pinch-zooming when dragging across full-screen canvases. We resolved this by implementing non-passive native `touchstart`, `touchmove`, and `gesturestart` listeners with `preventDefault()` calls on touch surfaces.
2. **Smooth High-DPI Stroke Rendering:** High speed mouse/pointer moves emit sparse events resulting in jagged line segments. We created a RequestAnimationFrame (RAF) queue batching pointer events into smooth quadratic Bezier curves ($\mathbf{B}(t) = (1-t)^2 P_0 + 2(1-t)t P_1 + t^2 P_2$).
3. **Subtractive Flood Fill Performance:** Performing recursive flood fill on high-resolution $2K/4K$ canvases can lock the main thread. We optimized the stack-based flood fill with Uint8 visited bit-arrays and threshold matching.

---

## Accomplishments that we're proud of

* **Zero Latency Painting:** Smooth 60 FPS drawing experience with multi-tool options and multi-way kaleidoscope symmetry.
* **Tactile Procedural Audio:** Fully functional Web Audio API sound synthesizer without external audio asset downloads or latency.
* **Gamified Pigment Discovery:** A seamless blend of puzzle gameplay and creative art studio that makes learning color theory fun.
* **Robust Touch Support:** Complete touch support preventing browser interference on mobile devices.

---

## What we learned

* How to emulate physical subtractive color spaces (RYB/Kubelka-Munk) using digital RGB representations.
* Advanced Web Audio API node routing (Noise Buffers $\to$ Bandpass Filters $\to$ Lowpass Filters $\to$ Gain Envelopes) for sound synthesis.
* Event handling strategies for pointer capture across multi-touch mobile devices and desktop inputs.

---

## What's next for Infinite Colour Craft

* **Community Palette Exchange:** Allow players to share discovered custom color pigments and artwork online.
* **Animated Frame Studio:** Add multi-layer frame animation to let players draw animated GIFs and short loops.
* **AI Color Assistant:** Integrate Gemini API to generate personalized daily coloring prompts and analyze color harmony scores in finished artwork.
