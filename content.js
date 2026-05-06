(function customCursorEngine() {
  "use strict";

  const ROOT_ID = "custom-cursor-engine-root";
  const STYLE_PREFIX = "cursor-style-";
  const TRAIL_PREFIX = "trail-style-";
  const CLICK_PREFIX = "click-effect-";
  const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, [role="button"]';

  const DEFAULT_SETTINGS = {
    enabled: true,
    cursorStyle: "neon",
    trailStyle: "comet",
    clickEffect: "pulse",
    trailIntensity: "balanced"
  };

  const TRAIL_CONFIG = {
    off: { interval: Infinity, max: 0 },
    subtle: { interval: 44, max: 18 },
    balanced: { interval: 24, max: 34 },
    loud: { interval: 14, max: 58 }
  };

  const CLICK_PARTICLES = {
    pulse: 1,
    ripple: 1,
    burst: 10,
    shockwave: 1,
    sparkle: 12,
    target: 4,
    pop: 8,
    halo: 1,
    square: 6,
    confetti: 14
  };

  const RING_LERP = 0.16;
  const TRAIL_LIFETIME_MS = 460;
  const CLICK_LIFETIME_MS = 560;
  const MAX_ACTIVE_CLICKS = 120;
  const extensionStorage =
    typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync
      ? chrome.storage.sync
      : null;
  const extensionStorageChanges =
    typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged
      ? chrome.storage.onChanged
      : null;

  if (window.__customCursorEngineActive) {
    return;
  }
  window.__customCursorEngineActive = true;

  const state = {
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    ringX: window.innerWidth / 2,
    ringY: window.innerHeight / 2,
    hasPointer: false,
    isHoveringInteractive: false,
    isPressed: false,
    lastTrailAt: 0,
    activeTrails: 0,
    activeClicks: 0,
    animationFrameId: 0,
    settings: { ...DEFAULT_SETTINGS },
    root: null,
    dot: null,
    ring: null
  };

  function ensureDomReady(callback) {
    if (document.documentElement && document.body) {
      callback();
      return;
    }

    document.addEventListener("DOMContentLoaded", callback, { once: true });
  }

  function createCursorElements() {
    if (document.getElementById(ROOT_ID)) {
      return;
    }

    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.setAttribute("aria-hidden", "true");

    const dot = document.createElement("div");
    dot.className = "cursor-dot";

    const ring = document.createElement("div");
    ring.className = "cursor-ring";

    root.append(dot, ring);
    document.documentElement.appendChild(root);

    state.root = root;
    state.dot = dot;
    state.ring = ring;
  }

  function normalizeSettings(nextSettings) {
    return {
      ...DEFAULT_SETTINGS,
      ...nextSettings
    };
  }

  function getStoredSettings() {
    return new Promise((resolve) => {
      if (!extensionStorage) {
        resolve(DEFAULT_SETTINGS);
        return;
      }

      extensionStorage.get(DEFAULT_SETTINGS, (storedSettings) => {
        resolve(normalizeSettings(storedSettings));
      });
    });
  }

  function removeClassPrefix(element, prefix) {
    [...element.classList].forEach((className) => {
      if (className.startsWith(prefix)) {
        element.classList.remove(className);
      }
    });
  }

  function applySettings(nextSettings) {
    state.settings = normalizeSettings(nextSettings);

    if (!state.root) {
      return;
    }

    removeClassPrefix(state.root, STYLE_PREFIX);
    removeClassPrefix(state.root, TRAIL_PREFIX);
    removeClassPrefix(state.root, CLICK_PREFIX);

    state.root.classList.add(`${STYLE_PREFIX}${state.settings.cursorStyle}`);
    state.root.classList.add(`${TRAIL_PREFIX}${state.settings.trailStyle}`);
    state.root.classList.add(`${CLICK_PREFIX}${state.settings.clickEffect}`);
    state.root.classList.toggle("is-disabled", !state.settings.enabled);
    document.documentElement.classList.toggle("custom-cursor-disabled", !state.settings.enabled);
  }

  function getRingScale() {
    const hoverScale = state.isHoveringInteractive ? 1.68 : 1;
    const pressedScale = state.isPressed ? 0.72 : 1;
    return hoverScale * pressedScale;
  }

  function setCursorVisibility(isVisible) {
    if (!state.dot || !state.ring || !state.settings.enabled) {
      return;
    }

    state.dot.classList.toggle("is-visible", isVisible);
    state.ring.classList.toggle("is-visible", isVisible);
  }

  function moveDot() {
    if (!state.dot || !state.settings.enabled) {
      return;
    }

    state.dot.style.transform = `translate3d(${state.targetX}px, ${state.targetY}px, 0) translate(-50%, -50%)`;
  }

  function moveRing() {
    if (!state.ring || !state.settings.enabled) {
      return;
    }

    state.ringX += (state.targetX - state.ringX) * RING_LERP;
    state.ringY += (state.targetY - state.ringY) * RING_LERP;
    state.ring.style.transform = `translate3d(${state.ringX}px, ${state.ringY}px, 0) translate(-50%, -50%) scale(${getRingScale()})`;
  }

  function getAngle(index, total) {
    return (Math.PI * 2 * index) / Math.max(total, 1);
  }

  function createTrail(x, y) {
    const trailConfig = TRAIL_CONFIG[state.settings.trailIntensity] || TRAIL_CONFIG.balanced;

    if (!state.root || state.activeTrails >= trailConfig.max || !state.settings.enabled) {
      return;
    }

    const trail = document.createElement("div");
    trail.className = "cursor-trail";
    trail.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;

    state.root.appendChild(trail);
    state.activeTrails += 1;

    window.setTimeout(() => {
      trail.remove();
      state.activeTrails = Math.max(0, state.activeTrails - 1);
    }, TRAIL_LIFETIME_MS);
  }

  function maybeCreateTrail(now) {
    const trailConfig = TRAIL_CONFIG[state.settings.trailIntensity] || TRAIL_CONFIG.balanced;

    if (now - state.lastTrailAt < trailConfig.interval) {
      return;
    }

    state.lastTrailAt = now;
    createTrail(state.targetX, state.targetY);
  }

  function createClickParticle(x, y, index, total) {
    if (!state.root || !state.settings.enabled || state.activeClicks >= MAX_ACTIVE_CLICKS) {
      return;
    }

    const angle = getAngle(index, total);
    const distance = 22 + (index % 4) * 7;
    const particle = document.createElement("div");
    particle.className = "cursor-click";
    particle.style.setProperty("--click-x", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--click-y", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--click-rotate", `${Math.round((angle * 180) / Math.PI)}deg`);
    particle.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;

    state.root.appendChild(particle);
    state.activeClicks += 1;

    window.setTimeout(() => {
      particle.remove();
      state.activeClicks = Math.max(0, state.activeClicks - 1);
    }, CLICK_LIFETIME_MS);
  }

  function createClickEffect(x, y) {
    const count = CLICK_PARTICLES[state.settings.clickEffect] || 1;

    for (let index = 0; index < count; index += 1) {
      createClickParticle(x, y, index, count);
    }
  }

  function updateInteractiveState(target) {
    const nextHoverState = Boolean(target && target.closest && target.closest(INTERACTIVE_SELECTOR));

    if (nextHoverState !== state.isHoveringInteractive) {
      state.isHoveringInteractive = nextHoverState;
      state.ring?.classList.toggle("is-hovering-interactive", nextHoverState);
    }
  }

  function handleMouseMove(event) {
    if (!state.settings.enabled) {
      return;
    }

    state.targetX = event.clientX;
    state.targetY = event.clientY;

    if (!state.hasPointer) {
      state.hasPointer = true;
      state.ringX = state.targetX;
      state.ringY = state.targetY;
      setCursorVisibility(true);
    }

    moveDot();
    updateInteractiveState(event.target);
    maybeCreateTrail(performance.now());
  }

  function handleMouseDown() {
    if (!state.settings.enabled) {
      return;
    }

    state.isPressed = true;
    state.ring?.classList.add("is-pressed");
    createClickEffect(state.targetX, state.targetY);
  }

  function handleMouseUp() {
    state.isPressed = false;
    state.ring?.classList.remove("is-pressed");
  }

  function handleMouseLeave() {
    setCursorVisibility(false);
    state.hasPointer = false;
  }

  function handleMouseEnter() {
    setCursorVisibility(true);
  }

  function animationLoop() {
    moveRing();
    state.animationFrameId = window.requestAnimationFrame(animationLoop);
  }

  async function start() {
    createCursorElements();
    if (!state.root || !state.dot || !state.ring) {
      return;
    }

    applySettings(await getStoredSettings());

    extensionStorageChanges?.addListener((changes, areaName) => {
      if (areaName !== "sync") {
        return;
      }

      const nextSettings = { ...state.settings };
      Object.keys(DEFAULT_SETTINGS).forEach((key) => {
        if (changes[key]) {
          nextSettings[key] = changes[key].newValue;
        }
      });
      applySettings(nextSettings);
    });

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mousedown", handleMouseDown, { passive: true });
    document.addEventListener("mouseup", handleMouseUp, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    document.addEventListener("mouseenter", handleMouseEnter, { passive: true });
    document.addEventListener("mouseover", (event) => updateInteractiveState(event.target), {
      passive: true
    });

    state.animationFrameId = window.requestAnimationFrame(animationLoop);
  }

  ensureDomReady(start);
})();
