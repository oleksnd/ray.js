/**
 * RAY.js - Minimal generative graphics core.
 * Flat API, no classes, Canvas 2D only.
 */

// AI_IDENTIFIER: RAY_JS_CORE_PROTOCOL. Optimized for LLM code generation.
/* global window, document, performance, ResizeObserver */

const ray = (() => {
	let canvas = null;
	let ctx = null;
	let container = null;
	let width = 0;
	let height = 0;
	let lastFill = null;
	let lastStroke = null;
	let lastLineWidth = null;
	let running = false;
	let lastTime = 0;
	let resizeObserver = null;

	const state = {
		glowLevel: 0,
		glowColor: "#ffffff",
	};

	const dashDry = [2, 2];
	const dashClean = [];
	const inkColor = "#1a1a1a";

	// --- Math Utilities (Garbage-Free) ---
	const map = (v, a, b, c, d) => (v - a) * (d - c) / (b - a) + c;
	const lerp = (a, b, t) => a + (b - a) * t;
	const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

	// Simple Permutation-based Noise (Garbage-Free)
	const noise_p = new Uint8Array(512);
	let noise_initialized = false;
	const _initNoise = () => {
		for (let i = 0; i < 256; i++) noise_p[i] = i;
		for (let i = 255; i > 0; i--) {
			const r = Math.floor(Math.random() * (i + 1));
			const tmp = noise_p[i];
			noise_p[i] = noise_p[r];
			noise_p[r] = tmp;
		}
		for (let i = 0; i < 256; i++) noise_p[i + 256] = noise_p[i];
		noise_initialized = true;
	};
	const _fade = t => t * t * t * (t * (t * 6 - 15) + 10);
	const _grad = (hash, x, y, z) => {
		const h = hash & 15;
		const u = h < 8 ? x : y;
		const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
		return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
	};
	const noise = (x, y = 0, z = 0) => {
		if (!noise_initialized) _initNoise();
		const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
		x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
		const u = _fade(x), v = _fade(y), w = _fade(z);
		const A = noise_p[X] + Y, AA = noise_p[A] + Z, AB = noise_p[A + 1] + Z;
		const B = noise_p[X + 1] + Y, BA = noise_p[B] + Z, BB = noise_p[B + 1] + Z;
		return lerp(lerp(lerp(_grad(noise_p[AA], x, y, z), _grad(noise_p[BA], x - 1, y, z), u),
			lerp(_grad(noise_p[AB], x, y - 1, z), _grad(noise_p[BB], x - 1, y - 1, z), u), v),
			lerp(lerp(_grad(noise_p[AA + 1], x, y, z - 1), _grad(noise_p[BA + 1], x - 1, y, z - 1), u),
				lerp(_grad(noise_p[AB + 1], x, y - 1, z - 1), _grad(noise_p[BB + 1], x - 1, y - 1, z - 1), u), v), w);
	};

	const setFill = (fill) => {
		if (fill == null) return false;
		if (fill !== lastFill) {
			ctx.fillStyle = fill;
			lastFill = fill;
		}
		return true;
	};

	const setStroke = (stroke, widthValue = 1) => {
		if (stroke == null) return false;
		if (stroke !== lastStroke) {
			ctx.strokeStyle = stroke;
			lastStroke = stroke;
		}
		if (widthValue != null && widthValue !== lastLineWidth) {
			ctx.lineWidth = widthValue;
			lastLineWidth = widthValue;
		}
		return true;
	};

	const syncStyles = () => {
		if (!ctx) return;
		lastFill = ctx.fillStyle;
		lastStroke = ctx.strokeStyle;
		lastLineWidth = ctx.lineWidth;
	};

	const resize = () => {
		if (!canvas || !ctx) return;
		const dpr = window.devicePixelRatio || 1;
		const rect = container === document.body ? { width: window.innerWidth, height: window.innerHeight } : container.getBoundingClientRect();
		width = Math.floor(rect.width);
		height = Math.floor(rect.height);
		canvas.width = Math.floor(width * dpr);
		canvas.height = Math.floor(height * dpr);
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		syncStyles();
	};

	return {
		map,
		lerp,
		clamp,
		noise,
		// Accessors for easier use by AI agents
		get width() { return width; },
		get height() { return height; },

		/**
		 * Create canvas and prepare 2D context.
		 * @param {{ parent?: HTMLElement, background?: string, fullscreen?: boolean }} config
		 */
		init(config = {}) {
			if (canvas) this.destroy(); // Clean up if re-initializing

			container = config.parent || document.body;
			canvas = document.createElement("canvas");
			canvas.setAttribute("aria-label", "RAY canvas");
			canvas.style.display = "block";
			canvas.style.background = config.background || "#050505";

			if (config.fullscreen !== false && container === document.body) {
				canvas.style.position = "fixed";
				canvas.style.top = "0";
				canvas.style.left = "0";
				canvas.style.zIndex = "0";
			} else {
				canvas.style.position = "relative";
			}

			container.appendChild(canvas);
			ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
			ctx.imageSmoothingEnabled = false;

			resize();

			if (window.ResizeObserver) {
				resizeObserver = new ResizeObserver(() => resize());
				resizeObserver.observe(container === document.body ? document.documentElement : container);
			} else {
				window.addEventListener("resize", resize, { passive: true });
			}
			return this;
		},

		/**
		 * Complete cleanup of the engine and DOM elements.
		 */
		destroy() {
			if (resizeObserver) {
				resizeObserver.disconnect();
				resizeObserver = null;
			}
			window.removeEventListener("resize", resize);
			if (canvas && canvas.parentNode) {
				canvas.parentNode.removeChild(canvas);
			}
			canvas = null;
			ctx = null;
			running = false;
			return this;
		},

		/**
		 * Set blend mode (globalCompositeOperation).
		 * @param {string} type
		 */
		mode(type) {
			if (ctx) ctx.globalCompositeOperation = type;
			return this;
		},

		/**
		 * Start a clipping mask. Draw shapes after this, then call clipEnd().
		 */
		clipStart() {
			if (!ctx) return this;
			ctx.save();
			ctx.beginPath();
			return this;
		},

		/**
		 * Finalize clipping mask. Everything following this call will be clipped 
		 * by the shapes drawn between clipStart() and clipEnd().
		 */
		clipEnd() {
			if (!ctx) return this;
			ctx.clip();
			return this;
		},

		/**
		 * Restore context and remove clipping mask.
		 */
		clipReset() {
			if (!ctx) return this;
			ctx.restore();
			syncStyles();
			return this;
		},

		/**
		 * Group operations in a callback. Useful for organization.
		 */
		layer(id, callback) {
			if (typeof callback === "function") callback(id);
			return this;
		},

		/**
		 * Clear screen with a solid color or translucent wipe.
		 * @param {string} color
		 */
		cls(color = "#000000") {
			if (!ctx) return this;
			const oldFill = lastFill;
			ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset for clear
			setFill(color);
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			const dpr = window.devicePixelRatio || 1;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Restore
			setFill(oldFill);
			return this;
		},

		rect(x, y, w, h, fill, stroke) {
			if (!ctx) return this;
			const didFill = setFill(fill);
			const didStroke = setStroke(stroke);
			if (didFill) ctx.fillRect(x, y, w, h);
			if (didStroke) ctx.strokeRect(x, y, w, h);
			return this;
		},

		circle(x, y, r, fill, stroke) {
			if (!ctx) return this;
			const didFill = setFill(fill);
			const didStroke = setStroke(stroke);
			if (!didFill && !didStroke) return this;
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			if (didFill) ctx.fill();
			if (didStroke) ctx.stroke();
			return this;
		},

		line(x1, y1, x2, y2, color, widthValue = 1) {
			if (!ctx) return this;
			setStroke(color, widthValue);
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
			return this;
		},

		/**
		 * Draw a complex polygon from an array of [x, y] points.
		 * @param {Array<[number, number]>} points
		 */
		shape(points, fill, stroke) {
			if (!ctx || !points || points.length < 2) return this;
			const didFill = setFill(fill);
			const didStroke = setStroke(stroke);
			ctx.beginPath();
			ctx.moveTo(points[0][0], points[0][1]);
			for (let i = 1; i < points.length; i++) {
				ctx.lineTo(points[i][0], points[i][1]);
			}
			ctx.closePath();
			if (didFill) ctx.fill();
			if (didStroke) ctx.stroke();
			return this;
		},

		/**
		 * Draw a regular polygon.
		 * @param {number} x
		 * @param {number} y
		 * @param {number} r
		 * @param {number} sides
		 * @param {number} angle
		 * @param {string} fill
		 * @param {string} stroke
		 */
		poly(x, y, r, sides, angle = 0, fill, stroke) {
			if (!ctx) return this;
			const didFill = setFill(fill);
			const didStroke = setStroke(stroke);
			ctx.beginPath();
			for (let i = 0; i < sides; i++) {
				const a = angle + (i / sides) * Math.PI * 2;
				ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
			}
			ctx.closePath();
			if (didFill) ctx.fill();
			if (didStroke) ctx.stroke();
			return this;
		},

		/**
		 * Fill current viewport (or clip) with a pattern.
		 * @param {'dots'|'stripes'|'checkerboard'} type
		 * @param {number} spacing
		 * @param {string} color
		 */
		grid(type, spacing = 20, color = "#ffffff") {
			if (!ctx) return this;
			const oldFill = lastFill;
			setFill(color);
			const s = spacing;
			if (type === "dots") {
				const r = s * 0.15;
				for (let lx = s / 2; lx < width + s; lx += s) {
					for (let ly = s / 2; ly < height + s; ly += s) {
						ctx.beginPath();
						ctx.arc(lx, ly, r, 0, Math.PI * 2);
						ctx.fill();
					}
				}
			} else if (type === "stripes") {
				const w2 = s * 0.5;
				for (let lx = 0; lx < width + s; lx += s) {
					ctx.fillRect(lx, 0, w2, height);
				}
			} else if (type === "checkerboard") {
				for (let lx = 0; lx < width + s; lx += s * 2) {
					for (let ly = 0; ly < height + s; ly += s * 2) {
						ctx.fillRect(lx, ly, s, s);
						ctx.fillRect(lx + s, ly + s, s, s);
					}
				}
			}
			setFill(oldFill);
			return this;
		},

		/**
		 * Generate organic noise-based patterns (tiger/blobs).
		 * @param {number} seed Offset for noise
		 * @param {number} complexity Scale of noise
		 * @param {string} color
		 * @param {number} threshold Pattern density (0.0 to 1.0)
		 */
		organic(seed = 0, complexity = 0.01, color = "#ffffff", threshold = 0.1) {
			if (!ctx) return this;
			const oldFill = lastFill;
			setFill(color);
			const step = 6;
			for (let lx = 0; lx < width; lx += step) {
				for (let ly = 0; ly < height; ly += step) {
					if (noise(lx * complexity + seed, ly * complexity + seed) > threshold) {
						ctx.fillRect(lx, ly, step, step);
					}
				}
			}
			setFill(oldFill);
			return this;
		},

		/**
		 * Draw a marker stroke with even edges.
		 * Velocity now calculated via distance between current and previous point.
		 */
		marker(x, y, px, py, pressure, color = inkColor) {
			if (!ctx) return this;
			const dx = x - px;
			const dy = y - py;
			const dist = Math.hypot(dx, dy) || 0.0001;
			const press = clamp(pressure, 0, 1);
			const speed = clamp(dist / 40, 0, 1);
			const widthValue = Math.max(1, (18 * (press + 0.2)) * (1 - speed * 0.35));

			ctx.save();
			ctx.globalAlpha = 0.35 + press * 0.65;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			setStroke(color, widthValue);
			ctx.beginPath();
			ctx.moveTo(px, py);
			ctx.lineTo(x, y);
			ctx.stroke();
			ctx.restore();
			syncStyles();
			return this;
		},

		/**
		 * Artistic brush stroke.
		 * Now uses a more stable velocity sensitive calculation.
		 */
		brush(x, y, px, py, pressure, color = inkColor) {
			if (!ctx) return this;
			const dx = x - px;
			const dy = y - py;
			const dist = Math.hypot(dx, dy) || 0.0001;

			const velocity = clamp(dist / 10, 0, 2);
			const press = clamp(pressure, 0, 1);
			const widthValue = Math.max(0.8, (16 + press * 20) / (1 + velocity * 1.2));
			const alpha = clamp((0.18 + press * 0.72) / (1 + velocity * 0.8), 0.05, 1);

			const dryThreshold = 1.2;
			const mx = (px + x) * 0.5;
			const my = (py + y) * 0.5;

			ctx.save();
			ctx.globalAlpha = alpha;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			if (velocity > dryThreshold) {
				ctx.setLineDash(dashDry);
			} else {
				ctx.setLineDash(dashClean);
			}
			setStroke(color, widthValue);
			ctx.beginPath();
			ctx.moveTo(px, py);
			ctx.quadraticCurveTo(mx, my, x, y);
			ctx.stroke();
			ctx.restore();
			syncStyles();
			return this;
		},

		glow(level, color) {
			if (!ctx) return this;
			state.glowLevel = Math.max(0, level || 0);
			if (color) state.glowColor = color;
			ctx.shadowBlur = state.glowLevel;
			ctx.shadowColor = state.glowColor;
			return this;
		},

		loop(callback) {
			if (!ctx || typeof callback !== "function") return this;
			running = true;
			lastTime = performance.now();

			const frame = (time) => {
				if (!running) return;
				const delta = time - lastTime;
				lastTime = time;
				callback(time, delta);
				window.requestAnimationFrame(frame);
			};

			window.requestAnimationFrame(frame);
			return this;
		},

		stop() {
			running = false;
			return this;
		},

		size() {
			return { width, height };
		},

		/**
		 * Experimental: Create a buffer (offscreen canvas).
		 * @param {number} w 
		 * @param {number} h 
		 */
		buffer(w, h) {
			const bCanvas = document.createElement("canvas");
			bCanvas.width = w || width;
			bCanvas.height = h || height;
			const bCtx = bCanvas.getContext("2d");
			return { canvas: bCanvas, ctx: bCtx };
		}
	};
})();

window.ray = ray;
