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
	};

	const setFill = (fill) => {
		if (fill == null) return false;
		if (fill !== lastFill) {
			ctx.fillStyle = fill;
			lastFill = fill;
		}
		return true;
	};

	const setStroke = (stroke, widthValue) => {
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