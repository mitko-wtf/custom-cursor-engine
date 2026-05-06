(function customCursorEngine() {
  "use strict";

  const ROOT_ID = "custom-cursor-engine-root";
  const TRAIL_INTERVAL_MS = 22;
  const TRAIL_LIFETIME_MS = 380;
  const MAX_ACTIVE_TRAILS = 36;
  const RING_LERP = 0.16;
  const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, [role="button"]';

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
    animationFrameId: 0,
    root: null,
    dot: null,
    ring: null
  };

  function ensureDomReady(callback) {
    if (document.documentElement && document.body) {
      callback();
      return;
    }

    document.addEventListener(
      "DOMContentLoaded",
      () => {
        callback();
      },
      { once: true }
    );
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

  function getRingScale() {
    const hoverScale = state.isHoveringInteractive ? 1.65 : 1;
    const pressedScale = state.isPressed ? 0.7 : 1;
    return hoverScale * pressedScale;
  }

  function setCursorVisibility(isVisible) {
    if (!state.dot || !state.ring) {
      return;
    }

    state.dot.classList.toggle("is-visible", isVisible);
    state.ring.classList.toggle("is-visible", isVisible);
  }

  function moveDot() {
    if (!state.dot) {
      return;
    }

    state.dot.style.transform = `translate3d(${state.targetX}px, ${state.targetY}px, 0) translate(-50%, -50%)`;
  }

  function moveRing() {
    if (!state.ring) {
      return;
    }

    state.ringX += (state.targetX - state.ringX) * RING_LERP;
    state.ringY += (state.targetY - state.ringY) * RING_LERP;
    state.ring.style.transform = `translate3d(${state.ringX}px, ${state.ringY}px, 0) translate(-50%, -50%) scale(${getRingScale()})`;
  }

  function createTrail(x, y) {
    if (!state.root || state.activeTrails >= MAX_ACTIVE_TRAILS) {
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
    if (now - state.lastTrailAt < TRAIL_INTERVAL_MS) {
      return;
    }

    state.lastTrailAt = now;
    createTrail(state.targetX, state.targetY);
  }

  function updateInteractiveState(target) {
    const nextHoverState = Boolean(target && target.closest && target.closest(INTERACTIVE_SELECTOR));

    if (nextHoverState !== state.isHoveringInteractive) {
      state.isHoveringInteractive = nextHoverState;
      state.ring?.classList.toggle("is-hovering-interactive", nextHoverState);
    }
  }

  function handleMouseMove(event) {
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
    state.isPressed = true;
    state.ring?.classList.add("is-pressed");
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

  function start() {
    createCursorElements();
    if (!state.root || !state.dot || !state.ring) {
      return;
    }

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
