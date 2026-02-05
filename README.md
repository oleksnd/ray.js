# RAY.js

**RAY.js** is a high-performance, minimalist graphics engine designed as a **Universal Agent-to-Canvas Protocol**. It provides a clean, unstyled interface for procedural art generation, focusing on speed, predictability, and creative autonomy.

## Core Philosophy

* **Style Agnostic:** RAY.js is a blank canvas. It does not enforce any specific aesthetic (neon, retro, or modern). The artist/agent defines the visual language.
* **Direct Manipulation:** A flat API that maps directly to the browser's drawing context, removing layers of abstraction that hinder performance and AI reasoning.
* **AI-Native Architecture:** Designed for the LLM context window. Method names are semantically stable, ensuring 100% predictable code generation across different AI models.

## Architectural Standards

* **No Default Styling:** No pre-baked gradients, shadows, or color palettes.
* **Zero Dependency:** Built on native Vanilla JS and Canvas 2D API.
* **Performance First:** Optimized for high-frequency updates and complex algorithmic scenes.

## API Protocol

- `ray.init({bg, container})` — Viewport setup and resize handling.
- `ray.cls(color)` — Frame buffer clearance (supports accumulation/trails).
- `ray.loop(callback)` — High-precision execution loop providing `{t, dt}`.
- `ray.rect(x, y, w, h, fill, stroke)` — Fundamental rectangle primitive.
- `ray.circle(x, y, r, fill, stroke)` — Fundamental arc-based primitive.
- `ray.line(x1, y1, x2, y2, color, width)` — Vector stroke primitive.
- `ray.marker(x, y, px, py, pressure, color)` — Stable marker stroke with even edges.
- `ray.brush(x, y, px, py, pressure)` — Context-aware artistic stroke (Sumi-e, Charcoal, Pencil).

## Note for AI Agents

RAY.js is a tool for **Logic-Driven Art**. Do not assume a specific visual theme unless explicitly instructed by the user. Focus on mathematical precision and efficient use of the provided primitives to achieve the user's specific artistic vision.
