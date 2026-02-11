# RAY.js

**RAY.js** is a high-performance, minimalist graphics engine designed as a **Universal Agent-to-Canvas Protocol**. It provides a clean, unstyled interface for procedural art generation, focusing on speed, predictability, and creative autonomy.

## Core Philosophy

* **Style Agnostic:** RAY.js is a blank canvas. It does not enforce any aesthetic.
* **Direct Manipulation:** A flat API mapping directly to the Canvas 2D context.
* **AI-Native Architecture:** Designed for the LLM context window. 100% predictable code generation.

## API Protocol

- `ray.init({parent, background, fullscreen})` — Setup with auto-resize (via ResizeObserver).
- `ray.cls(color)` — Frame buffer clearance (chainable).
- `ray.mode(type)` — Set blend mode (e.g., 'multiply', 'screen').
- `ray.clipStart()` / `ray.clipEnd()` / `ray.clipReset()` — Clipping mask workflow.
- `ray.layer(id, callback)` — Grouping logic.
- `ray.grid(type, spacing, color)` — Patterns: 'dots', 'stripes', 'checkerboard'.
- `ray.organic(seed, complexity, color, threshold)` — Organic blobs/noise patterns.
- `ray.loop(callback)` — High-precision loop providing `{t, dt}`.
- `ray.rect(x, y, w, h, fill, stroke)`
- `ray.circle(x, y, r, fill, stroke)`
- `ray.poly(x, y, r, sides, angle, fill)` — Regular polygon.
- `ray.shape(points, fill, stroke)` — Custom polygon from array of points.
- `ray.line(x1, y1, x2, y2, color, width)`
- `ray.marker(x, y, px, py, pressure, color)` — Velocity-aware marker.
- `ray.brush(x, y, px, py, pressure, color)` — Artistic stroke (stable velocity).
- `ray.buffer(w, h)` — Create an offscreen buffer.

## Math & Procedural Tools (Top-Level)

- `ray.map(v, a, b, c, d)` — Remap value from range [a,b] to [c,d].
- `ray.lerp(a, b, t)` — Linear interpolation.
- `ray.noise(x, y, z)` — High-performance Simplex-like noise.
- `ray.clamp(v, min, max)` — Keep value within bounds.

## Example Usage

```javascript
ray.init()
   .loop((t) => {
     const n = ray.noise(t * 0.001);
     const x = ray.map(n, -1, 1, 0, ray.size().width);
     ray.cls("#050505")
        .mode('screen')
        .circle(x, 300, 50, "#ff0044");
   });
```
