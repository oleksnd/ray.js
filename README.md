# RAY.js

**RAY.js** is a high-performance, minimalist graphics engine designed as a **Universal Agent-to-Canvas Protocol**. It provides a clean, unstyled interface for procedural art generation, focusing on speed, predictability, and creative autonomy.

## Core Philosophy

* **Style Agnostic:** RAY.js is a blank canvas. It does not enforce any aesthetic.
* **Direct Manipulation:** A flat API mapping directly to the Canvas 2D context.
* **AI-Native Architecture:** Designed for the LLM context window. 100% predictable code generation.

## API Protocol

- `ray.init({parent, background, fullscreen, canvas, context})` — Setup with auto-resize for internal canvas mode.
- `ray.destroy()` — Stop loop and release listeners/observer; removes canvas only if RAY.js created it.
- `ray.target(ctx, w, h)` / `ray.restore()` — Temporary render-target switching.
- `ray.cls(color)` — Frame buffer clearance (chainable).
- `ray.mode(type)` — Set blend mode (e.g., 'multiply', 'screen').
- `ray.clipStart()` / `ray.clipEnd()` / `ray.clipReset()` — Clipping mask workflow.
- `ray.layer(id, callback)` — Grouping logic.
- `ray.grid(type, spacing, color)` — Patterns: 'dots', 'stripes', 'checkerboard'.
- `ray.organic(seed, complexity, color, threshold)` — Organic blobs/noise patterns.
- `ray.loop(callback)` — High-precision loop. Single-arg callback receives `{t, dt}`; two-arg callback receives `(t, dt)`.
- `ray.stop()` — Stop active loop.
- `ray.size()` — Returns `{width, height}`.
- `ray.rect(x, y, w, h, fill, stroke)`
- `ray.circle(x, y, r, fill, stroke)`
- `ray.poly(x, y, r, sides, angle, fill)` — Regular polygon.
- `ray.shape(points, fill, stroke)` — Custom polygon from array of points.
- `ray.line(x1, y1, x2, y2, color, width)`
- `ray.stamp(x, y, r, alpha, color)`
- `ray.marker(x, y, px, py, pressure, color)` — Velocity-aware marker.
- `ray.brush(x, y, px, py, pressure, color)` — Artistic stroke (stable velocity).
- `ray.dry(x, y, px, py, pressure, color)`
- `ray.wet(x, y, px, py, pressure, color)`
- `ray.oil(x, y, px, py, pressure, color)`
- `ray.knife(x, y, px, py, pressure, color)`
- `ray.splatter(x, y, intensity, color)`
- `ray.glow(level, color)`
- `ray.buffer(w, h)` — Create an offscreen buffer.

## Math & Procedural Tools (Top-Level)

- `ray.map(v, a, b, c, d)` — Remap value from range [a,b] to [c,d].
- `ray.lerp(a, b, t)` — Linear interpolation.
- `ray.noise(x, y, z)` — High-performance Simplex-like noise.
- `ray.clamp(v, min, max)` — Keep value within bounds.

## Example Usage

```javascript
ray.init()
   .loop(({ t }) => {
     const n = ray.noise(t * 0.001);
     const x = ray.map(n, -1, 1, 0, ray.size().width);
     ray.cls("#050505")
        .mode('screen')
        .circle(x, 300, 50, "#ff0044");
   });
```

## Agent Recipe: Generative Collage

The collage style from the demo is **not a single built-in preset**. It is composed from low-level primitives in a strict layer order:

1. `ray.cls("#fdf8f0")` base paper color.
2. Clip a large irregular polygon (`ray.clipStart` + `ray.shape` + `ray.clipEnd`).
3. Fill clipped area with `ray.rect(...)` using a flat accent color.
4. Add texture with `ray.grid("dots", 40, "rgba(0,0,0,0.2)")`.
5. `ray.clipReset()` to end mask.
6. Add one big rotated polygon with `ray.mode("multiply")` then return to `source-over`.
7. Add organic blobs using `ray.organic(seed + t * 0.0001, 0.02, color, 0.1)`.

In short: **clip mask + flat geometry + blend mode + sparse noise texture**.

If an agent only reads `ray.js`, it can generate art but may not infer this exact visual language reliably. If it reads this recipe (or the demo), it will usually reproduce the style correctly.

### Prompt Template For Agents

Use this when asking another coding agent to reproduce the same look:

```text
Create a RAY.js animation in a Matisse-like generative collage style.
Requirements:
- Background paper color #fdf8f0.
- One clipped irregular polygon region filled with a flat warm color.
- Dot texture inside the clipped region using ray.grid('dots', 40, 'rgba(0,0,0,0.2)').
- One large rotating triangle/polygon layer in multiply blend mode.
- Organic pink noise-like blobs over the composition using ray.organic(..., 0.02, ..., 0.1).
- Keep shapes large, minimal, and poster-like.
- Use ray.loop(({ t, dt }) => ...) and re-seed on interaction.
```
