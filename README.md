# RAY.js

RAY.js is a minimal, fast, flat-API generative graphics library.
It is AI-Native with a LLM-Friendly API, designed as an Agent-to-Canvas Protocol
for Machine-Readable Graphics.

Vibe: 80s cyberpunk + Matisse/Rothko minimalism.

## Manifest

RAY.js is the first graphics library where the API is optimized not for human
memory, but for the context window of Large Language Models.

- No classes. No hidden state. Just a small, direct API.
- Zero ambiguity: each method name is semantically precise and single-purpose.
- Token efficiency: short names like `ray.cls` and `ray.glow` reduce agent output.
- Predictable flow: no hidden side effects, enabling 100% render predictability.
- Canvas 2D only, tuned for performance and predictable output.
- Glow is a first-class feature, but easy to disable for speed.
- One file, zero dependencies, full control.

## Quick Start

Open index.html in a browser.

```html
<script src="./ray.js"></script>
<script>
  ray.init({ background: "#050505" });
  ray.glow(18, "#2ee8ff");
  ray.circle(200, 200, 60, "#2ee8ff");
</script>
```

## API

### ray.init(config)
Create a full-screen canvas and set up resize handling.

- config.parent (optional): mount element, default is document.body
- config.background (optional): canvas background color

### ray.cls(color)
Clear the screen with a solid or translucent color.

### ray.rect(x, y, w, h, fill, stroke)
Draw a rectangle.

### ray.circle(x, y, r, fill, stroke)
Draw a circle.

### ray.line(x1, y1, x2, y2, color, width)
Draw a line.

### ray.glow(level, color)
Neon glow control.

- level = 0 disables glow for speed
- color is optional and cached

### ray.loop(callback)
High-performance render loop.

callback signature: (time, delta) => void

### ray.stop()
Stop the active loop.

### ray.size()
Get canvas size: { width, height }

## Notes

- If you want trails, use a translucent color in ray.cls, e.g. rgba(5, 5, 5, 0.1).
- For sharp edges, keep image smoothing off (default).

## License

See LICENSE.
