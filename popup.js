"use strict";

const DEFAULT_SETTINGS = {
  enabled: true,
  cursorStyle: "neon",
  trailStyle: "comet",
  clickEffect: "pulse",
  trailIntensity: "balanced"
};

const OPTIONS = {
  cursorStyle: [
    ["neon", "Neon Ring"],
    ["spotlight", "Spotlight"],
    ["glass", "Glass Lens"],
    ["laser", "Laser"],
    ["mono", "Mono Focus"],
    ["sunset", "Sunset Pop"],
    ["plasma", "Plasma"],
    ["terminal", "Terminal"],
    ["bubble", "Bubble"],
    ["minimal", "Minimal"]
  ],
  trailStyle: [
    ["comet", "Comet"],
    ["ember", "Ember"],
    ["spark", "Spark"],
    ["ghost", "Ghost"],
    ["ribbon", "Ribbon"],
    ["bubble", "Bubble"],
    ["pixel", "Pixel"],
    ["strobe", "Strobe"],
    ["ink", "Ink"],
    ["dust", "Dust"]
  ],
  clickEffect: [
    ["pulse", "Pulse"],
    ["ripple", "Ripple"],
    ["burst", "Burst"],
    ["shockwave", "Shockwave"],
    ["sparkle", "Sparkle"],
    ["target", "Target"],
    ["pop", "Pop"],
    ["halo", "Halo"],
    ["square", "Square"],
    ["confetti", "Confetti"]
  ],
  trailIntensity: [
    ["subtle", "Subtle"],
    ["balanced", "Balanced"],
    ["loud", "Loud"],
    ["off", "Off"]
  ]
};

const controls = {
  enabled: document.getElementById("enabled"),
  cursorStyle: document.getElementById("cursorStyle"),
  trailStyle: document.getElementById("trailStyle"),
  clickEffect: document.getElementById("clickEffect"),
  trailIntensity: document.getElementById("trailIntensity"),
  reset: document.getElementById("reset"),
  status: document.getElementById("status")
};

function fillSelect(id) {
  OPTIONS[id].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    controls[id].appendChild(option);
  });
}

function setStatus(message) {
  controls.status.textContent = message;
  window.setTimeout(() => {
    if (controls.status.textContent === message) {
      controls.status.textContent = "";
    }
  }, 900);
}

function render(settings) {
  controls.enabled.checked = settings.enabled;
  controls.cursorStyle.value = settings.cursorStyle;
  controls.trailStyle.value = settings.trailStyle;
  controls.clickEffect.value = settings.clickEffect;
  controls.trailIntensity.value = settings.trailIntensity;
}

function saveSettings(partialSettings) {
  chrome.storage.sync.set(partialSettings, () => {
    setStatus("Saved");
  });
}

Object.keys(OPTIONS).forEach(fillSelect);

chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
  render({ ...DEFAULT_SETTINGS, ...settings });
});

controls.enabled.addEventListener("change", () => {
  saveSettings({ enabled: controls.enabled.checked });
});

["cursorStyle", "trailStyle", "clickEffect", "trailIntensity"].forEach((id) => {
  controls[id].addEventListener("change", () => {
    saveSettings({ [id]: controls[id].value });
  });
});

controls.reset.addEventListener("click", () => {
  chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
    render(DEFAULT_SETTINGS);
    setStatus("Reset");
  });
});
