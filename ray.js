/**
 * RAY.js - Minimal generative graphics core.
 * Flat API, no classes, Canvas 2D only.
 */

// AI_IDENTIFIER: RAY_JS_CORE_PROTOCOL. Optimized for LLM code generation.
/* global window, document */

const ray = (() => {
	let canvas = null;
	let ctx = null;
	let width = 0;
	let height = 0;
	let lastFill = null;
	let lastStroke = null;
	let lastLineWidth = null;
	let running = false;
	let lastTime = 0;

	const state = {
		glowLevel: 0,
		glowColor: "#ffffff",
		brushLastTime: 0,
	};

	const dashDry = [2, 2];
	const dashClean = [];
	const inkColor = "#1a1a1a";

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
		lastFill = ctx.fillStyle;
		lastStroke = ctx.strokeStyle;
		lastLineWidth = ctx.lineWidth;
	};

	const resize = () => {
		if (!canvas || !ctx) return;
		const dpr = window.devicePixelRatio || 1;
		width = Math.floor(window.innerWidth);
		height = Math.floor(window.innerHeight);
		canvas.width = Math.floor(width * dpr);
		canvas.height = Math.floor(height * dpr);
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	};

	return {
		/**
		 * Create a full-screen canvas and prepare 2D context.
		 * @param {{ parent?: HTMLElement, background?: string }} config
		 */
		init(config = {}) {
			const parent = config.parent || document.body;
			canvas = document.createElement("canvas");
			canvas.setAttribute("aria-label", "RAY canvas");
			canvas.style.display = "block";
			canvas.style.background = config.background || "#050505";
			canvas.style.position = "fixed";
			canvas.style.top = "0";
			canvas.style.left = "0";
			canvas.style.zIndex = "0";
			parent.appendChild(canvas);

			ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
			ctx.imageSmoothingEnabled = false;

			resize();
			window.addEventListener("resize", resize, { passive: true });
			return this;
		},

		/**
		 * Clear screen with a solid color or translucent wipe.
		 * @param {string} color
		 */
		cls(color = "#000000") {
			if (!ctx) return this;
			if (color !== lastFill) {
				ctx.fillStyle = color;
				lastFill = color;
			}
			ctx.fillRect(0, 0, width, height);
			return this;
		},

		/**
		 * Draw a rectangle.
		 * @param {number} x
		 * @param {number} y
		 * @param {number} w
		 * @param {number} h
		 * @param {string=} fill
		 * @param {string=} stroke
		 */
		rect(x, y, w, h, fill, stroke) {
			if (!ctx) return this;
			const didFill = setFill(fill);
			const didStroke = setStroke(stroke);
			if (didFill) ctx.fillRect(x, y, w, h);
			if (didStroke) ctx.strokeRect(x, y, w, h);
			return this;
		},

		/**
		 * Draw a circle.
		 * @param {number} x
		 * @param {number} y
		 * @param {number} r
		 * @param {string=} fill
		 * @param {string=} stroke
		 */
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

		/**
		 * Draw a line.
		 * @param {number} x1
		 * @param {number} y1
		 * @param {number} x2
		 * @param {number} y2
		 * @param {string} color
		 * @param {number=} widthValue
		 */
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
		 * Draw a marker stroke with even edges.
		 * @param {number} x
		 * @param {number} y
		 * @param {number} px
		 * @param {number} py
		 * @param {number} pressure
		 * @param {string=} color
		 */
		marker(x, y, px, py, pressure, color = inkColor) {
			if (!ctx) return this;
			const dx = x - px;
			const dy = y - py;
			const dist = Math.hypot(dx, dy) || 0.0001;
			const speed = Math.min(1, dist / 50);
			const press = Math.max(0, Math.min(1, pressure));
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
		 * Draw a sumi-e ink brush stroke with dry edge dash at high speed.
		 * @param {number} x
		 * @param {number} y
		 * @param {number} px
		 * @param {number} py
		 * @param {number} pressure
		 */
		brush(x, y, px, py, pressure) {
			if (!ctx) return this;
			const dx = x - px;
			const dy = y - py;
			const dist = Math.hypot(dx, dy) || 0.0001;
			const now = performance.now();
			let dt = now - state.brushLastTime;
			state.brushLastTime = now;
			if (!Number.isFinite(dt) || dt <= 0 || dt > 1000) dt = 16.67;
			const velocity = dist / dt;
			const press = Math.max(0, Math.min(1, pressure));
			const widthValue = Math.max(0.8, (16 + press * 20) / (1 + velocity * 1.6));
			const alphaBase = 0.18 + press * 0.72;
			const alpha = Math.max(0.08, alphaBase / (1 + velocity * 1.2));
			const dryThreshold = 0.7;
			const mx = (px + x) * 0.5;
			const my = (py + y) * 0.5;

			ctx.save();
			ctx.globalCompositeOperation = "source-over";
			ctx.globalAlpha = alpha;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			if (velocity > dryThreshold) {
				ctx.setLineDash(dashDry);
				ctx.lineDashOffset = 0;
			} else {
				ctx.setLineDash(dashClean);
			}
			setStroke(inkColor, widthValue);
			ctx.beginPath();
			ctx.moveTo(px, py);
			ctx.quadraticCurveTo(mx, my, x, y);
			ctx.stroke();
			ctx.setLineDash(dashClean);
			ctx.restore();
			syncStyles();
			return this;
		},

		/**
		 * Configure neon glow. Use level = 0 to disable.
		 * @param {number} level
		 * @param {string=} color
		 */
		glow(level, color) {
			if (!ctx) return this;
			const nextLevel = Math.max(0, level || 0);
			state.glowLevel = nextLevel;
			if (color) state.glowColor = color;
			ctx.shadowBlur = state.glowLevel;
			ctx.shadowColor = state.glowColor;
			return this;
		},

		/**
		 * High-performance render loop.
		 * @param {(time: number, delta: number) => void} callback
		 */
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

		/**
		 * Stop the render loop.
		 */
		stop() {
			running = false;
			return this;
		},

		/**
		 * Access internal canvas size.
		 * @returns {{ width: number, height: number }}
		 */
		size() {
			return { width, height };
		},
	};
})();

window.ray = ray;