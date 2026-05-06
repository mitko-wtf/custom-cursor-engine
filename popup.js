"use strict";

const DEFAULT_SETTINGS = {
  enabled: true,
  cursorStyle: "neon",
  trailStyle: "comet",
  clickEffect: "pulse",
  trailIntensity: "balanced",
  accentColor: "#00f5ff",
  hotColor: "#ff3df2",
  dotSize: 7,
  ringSize: 30,
  customEmoji: "✨"
};

const PRESETS = {
  cursorStyle: [
    ["neon", "Neon"],
    ["spotlight", "Spotlight"],
    ["glass", "Glass"],
    ["laser", "Laser"],
    ["mono", "Mono"],
    ["sunset", "Sunset"],
    ["plasma", "Plasma"],
    ["terminal", "Terminal"],
    ["bubble", "Bubble"],
    ["minimal", "Minimal"],
    ["geocities", "GeoCities"],
    ["arcade", "Arcade"],
    ["vhs", "VHS"],
    ["magicwand", "Magic"],
    ["smiley", "Smiley"],
    ["heart", "Heart"],
    ["star", "Star"],
    ["candy", "Candy"],
    ["clock", "Clock"],
    ["rainbow", "Rainbow"]
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
    ["dust", "Dust"],
    ["glitter", "Glitter"],
    ["rainbow", "Rainbow"],
    ["hearts", "Hearts"],
    ["stars", "Stars"],
    ["snow", "Snow"],
    ["coins", "Coins"],
    ["cards", "Cards"],
    ["matrix", "Matrix"],
    ["leaves", "Leaves"],
    ["rain", "Rain"],
    ["magic", "Magic"],
    ["fire", "Fire"],
    ["party", "Party"],
    ["emoji", "Emoji"]
  ],
  clickEffect: [
    ["pulse", "Pulse"],
    ["ripple", "Ripple"],
    ["burst", "Burst"],
    ["shockwave", "Shock"],
    ["sparkle", "Sparkle"],
    ["target", "Target"],
    ["pop", "Pop"],
    ["halo", "Halo"],
    ["square", "Square"],
    ["confetti", "Confetti"],
    ["fireworks", "Fireworks"],
    ["boom", "Boom"],
    ["pixelblast", "Pixel Blast"],
    ["starburst", "Starburst"],
    ["heartsplosion", "Hearts"],
    ["coinburst", "Coins"],
    ["cardblast", "Cards"],
    ["comicpow", "POW"],
    ["ringstorm", "Ringstorm"],
    ["magicnova", "Magic Nova"],
    ["meteor", "Meteor"],
    ["smoke", "Smoke"],
    ["emoji", "Emoji"]
  ]
};

const TRAIL_INTENSITY = [
  ["subtle", "Subtle"],
  ["balanced", "Balanced"],
  ["loud", "Loud"],
  ["off", "Off"]
];

const controls = {
  enabled: document.getElementById("enabled"),
  cursorStyle: document.getElementById("cursorStyle"),
  trailStyle: document.getElementById("trailStyle"),
  clickEffect: document.getElementById("clickEffect"),
  cursorStyleLabel: document.getElementById("cursorStyleLabel"),
  trailStyleLabel: document.getElementById("trailStyleLabel"),
  clickEffectLabel: document.getElementById("clickEffectLabel"),
  trailIntensity: document.getElementById("trailIntensity"),
  accentColor: document.getElementById("accentColor"),
  hotColor: document.getElementById("hotColor"),
  dotSize: document.getElementById("dotSize"),
  ringSize: document.getElementById("ringSize"),
  customEmoji: document.getElementById("customEmoji"),
  reset: document.getElementById("reset"),
  status: document.getElementById("status")
};

let currentSettings = { ...DEFAULT_SETTINGS };

function getLabel(group, value) {
  const match = PRESETS[group]?.find(([presetValue]) => presetValue === value);
  return match ? match[1] : value;
}

function setStatus(message) {
  controls.status.textContent = message;
  window.setTimeout(() => {
    if (controls.status.textContent === message) {
      controls.status.textContent = "";
    }
  }, 900);
}

function createPresetButton(group, value, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `preset-card preset-${group}-${value}`;
  button.dataset.group = group;
  button.dataset.value = value;
  button.setAttribute("role", "radio");
  button.setAttribute("aria-label", label);
  button.innerHTML = `
    <span class="preset-preview" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
    </span>
    <span class="preset-name">${label}</span>
  `;
  button.addEventListener("click", () => {
    saveSettings({ [group]: value });
  });
  controls[group].appendChild(button);
}

function fillPresetGroup(group) {
  PRESETS[group].forEach(([value, label]) => createPresetButton(group, value, label));
}

function fillTrailIntensity() {
  TRAIL_INTENSITY.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    controls.trailIntensity.appendChild(option);
  });
}

function updateActivePreset(group, value) {
  [...controls[group].querySelectorAll(".preset-card")].forEach((button) => {
    const isActive = button.dataset.value === value;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-checked", String(isActive));
  });
}

function render(settings) {
  currentSettings = { ...DEFAULT_SETTINGS, ...settings };

  controls.enabled.checked = currentSettings.enabled;
  controls.trailIntensity.value = currentSettings.trailIntensity;
  controls.accentColor.value = currentSettings.accentColor;
  controls.hotColor.value = currentSettings.hotColor;
  controls.dotSize.value = currentSettings.dotSize;
  controls.ringSize.value = currentSettings.ringSize;
  controls.customEmoji.value = currentSettings.customEmoji;

  updateActivePreset("cursorStyle", currentSettings.cursorStyle);
  updateActivePreset("trailStyle", currentSettings.trailStyle);
  updateActivePreset("clickEffect", currentSettings.clickEffect);

  controls.cursorStyleLabel.textContent = getLabel("cursorStyle", currentSettings.cursorStyle);
  controls.trailStyleLabel.textContent = getLabel("trailStyle", currentSettings.trailStyle);
  controls.clickEffectLabel.textContent = getLabel("clickEffect", currentSettings.clickEffect);
}

function saveSettings(partialSettings) {
  const nextSettings = { ...currentSettings, ...partialSettings };
  chrome.storage.sync.set(partialSettings, () => {
    render(nextSettings);
    setStatus("Saved");
  });
}

Object.keys(PRESETS).forEach(fillPresetGroup);
fillTrailIntensity();

chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
  render(settings);
});

controls.enabled.addEventListener("change", () => {
  saveSettings({ enabled: controls.enabled.checked });
});

controls.trailIntensity.addEventListener("change", () => {
  saveSettings({ trailIntensity: controls.trailIntensity.value });
});

["accentColor", "hotColor"].forEach((id) => {
  controls[id].addEventListener("input", () => {
    saveSettings({ [id]: controls[id].value });
  });
});

["dotSize", "ringSize"].forEach((id) => {
  controls[id].addEventListener("input", () => {
    saveSettings({ [id]: Number(controls[id].value) });
  });
});

controls.customEmoji.addEventListener("input", () => {
  const emoji = controls.customEmoji.value.trim() || DEFAULT_SETTINGS.customEmoji;
  saveSettings({ customEmoji: emoji.slice(0, 4) });
});

controls.reset.addEventListener("click", () => {
  chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
    render(DEFAULT_SETTINGS);
    setStatus("Reset");
  });
});
