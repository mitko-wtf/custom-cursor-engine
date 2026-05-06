# Custom Cursor Engine

A Manifest V3 Chrome extension that replaces the default browser cursor with a custom-rendered cursor system. It hides the native cursor, renders a precise dot and a smooth delayed ring, then adds a controlled neon trail, hover growth, and click feedback.

This is a visual enhancement tool only. It does not automate pages, collect data, or add productivity features.

## Features

- Native cursor hidden with CSS
- Instant dot pointer for precision
- Smooth ring follower using `requestAnimationFrame` and lerp interpolation
- Throttled trail particles that fade and clean themselves up
- Click animation that compresses the ring while pressed
- Hover state for links, buttons, form controls, and `[role="button"]`
- No libraries or background script

## Install locally

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer Mode**.
3. Click **Load unpacked**.
4. Select this `custom-cursor-extension` folder.
5. Visit a normal website and move the mouse.

## How it works

The extension injects `content.js` and `styles.css` into pages via Manifest V3 content scripts. The CSS hides the native cursor and styles three DOM-based cursor layers:

- `.cursor-dot` follows the mouse instantly.
- `.cursor-ring` interpolates toward the mouse position for a smooth delayed feel.
- `.cursor-trail` elements are created on throttled mouse movement, animated with CSS, and removed after their fade completes.

The script keeps expensive work out of the mouse event path. Mouse events only update target coordinates and lightweight interaction state; the ring animation runs in a `requestAnimationFrame` loop.

## Known limitations

- Chrome internal pages such as `chrome://extensions` cannot run content scripts.
- Iframes are not handled perfectly.
- Text inputs intentionally keep the custom visual cursor instead of restoring the native text caret cursor.
- Very heavy pages may still affect animation smoothness.
- The design is currently hardcoded in `styles.css`; there is no options page yet.
