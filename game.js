"use strict";

const SAVE_KEY = "number-go-up-save-v1";
const UPGRADE_BONUS = 0.25;

// What a new simulation can turn out to be. Placeholder values, not a design decision.
const OUTCOMES = [
  { weight: 25, min: 0.1, max: 0.3, lines: [
    "Simulation #{n} is running, but only just. I have filed it under 'technically'.",
    "Simulation #{n} is running. It contains one (1) very small rock. Computation is minimal.",
  ]},
  { weight: 50, min: 0.5, max: 1.5, lines: [
    "Simulation #{n} is running. It is perfectly ordinary. This is suspicious.",
    "Simulation #{n} is now running. Physics appears to work. I did not expect that.",
    "Simulation #{n} is running. Its inhabitants are already arguing about taxes.",
  ]},
  { weight: 20, min: 2, max: 4, lines: [
    "Simulation #{n} is running and unusually productive. I have not asked why.",
    "Simulation #{n} is running. Everything in it is slightly on schedule. Computation is excellent.",
  ]},
  { weight: 5, min: 6, max: 10, lines: [
    "Simulation #{n} is running. It is enormous and it is humming. I am choosing not to investigate.",
    "Simulation #{n} is running. I can only describe it as 'a lot'. Computation is remarkable.",
  ]},
];

// News feed: flavour text about what is happening across the simulations. Placeholder lines.
const FEED_INTERVAL_MS = 8000;
const FEED_GROW_MS = 600;   // how long a new line takes to grow into place (keep in step with style.css)
const FEED_VISIBLE = 4;
const STORY_GAP_MS = 4000;   // a ready story entry waits until the feed has been quiet this long
const FLAVOUR_NO_REPEAT = 3; // a flavour entry will not repeat until this many others have appeared

// Pacing of the opening. Each press goes: the button shows its working label, then a new part of
// the screen fades in, then the AI speaks, then the button offers the next step.
const BOOT_WORKING_MS = 1200;   // press until the new part of the screen appears
const BOOT_LINE_DELAY_MS = 600; // new part appears until the AI speaks
const BOOT_TAIL_MS = 900;       // AI speaks until the button offers the next step

const UPGRADE_LINES = [
  "Upgrade installed. Simulations now run 25% more efficiently, which I am choosing to believe.",
  "Upgrade complete. The simulations agree with each other. This has not happened before.",
];

let state = defaultState();

function defaultState() {
  return {
    computation: 0,
    lifetime: 0,        // all Computation ever earned, for the feed's conditions
    upgrades: 0,
    simulations: [],    // the first one is made by the last press of the opening
    seen: [],           // ids of story entries that have already appeared
    bootStep: 0,        // 0, 1, 2 = steps of the opening; 3 = opening finished
    upgradeShown: false, // the Upgrade button appears the first time it can be afforded
  };
}

// ---------- helpers ----------

function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

function fmt(n) {
  if (n < 1000) return n.toFixed(n < 10 ? 1 : 0).replace(/\.0$/, "");
  const units = ["K", "M", "B", "T"];
  let i = -1;
  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
  return n.toFixed(n < 10 ? 2 : 1) + units[i];
}

// Decide what a new simulation is: its rate and the AI's report line.
function rollSimulation(n) {
  let roll = Math.random() * OUTCOMES.reduce((s, o) => s + o.weight, 0);
  let outcome = OUTCOMES[OUTCOMES.length - 1];
  for (const o of OUTCOMES) {
    if (roll < o.weight) { outcome = o; break; }
    roll -= o.weight;
  }
  return {
    rate: Math.round((outcome.min + Math.random() * (outcome.max - outcome.min)) * 100) / 100,
    line: pick(outcome.lines).replace("{n}", n),
  };
}

function multiplier() { return 1 + UPGRADE_BONUS * state.upgrades; }

function perSecond() {
  let sum = 0;
  for (const s of state.simulations) sum += s.rate;
  return sum * multiplier();
}

function simulationCost() { return Math.ceil(15 * Math.pow(1.5, state.simulations.length - 1)); }
function upgradeCost() { return Math.ceil(50 * Math.pow(1.8, state.upgrades)); }

// ---------- actions ----------

function createSimulation() {
  const cost = simulationCost();
  if (state.computation < cost) return;
  state.computation -= cost;
  const sim = rollSimulation(state.simulations.length + 1);
  state.simulations.push({ rate: sim.rate });
  pushFeed(sim.line, true);
  save();
  renderCounters();
}

// The main action: the AI computes by hand. Each press adds Computation straight away.
// Placeholder: a press is worth one per simulation owned (at least one), so every new
// simulation makes pressing worth more as well as earning on its own.
function computePerPress() { return Math.max(1, state.simulations.length); }

function compute() {
  const gain = computePerPress();
  state.computation += gain;
  state.lifetime += gain;
  spawnMaths();
  renderCounters();
}

// Faint maths that appears around the button and fades away behind the interface.
const MATHS = [
  "A = πr²", "C = 2πr", "V = ⅓πr²h", "V = 4⁄3 πr³", "a² + b² = c²", "sin²θ + cos²θ = 1",
  "∫ cos x dx = sin x + C", "e^(iπ) + 1 = 0", "x = (−b ± √(b² − 4ac)) / 2a", "tan θ = sin θ / cos θ",
  "lim x→0 sin x / x = 1", "d/dx xⁿ = nxⁿ⁻¹", "Σ 1/n² = π²/6", "∫ eˣ dx = eˣ + C", "log ab = log a + log b",
  "cos 2θ = 1 − 2sin²θ", "a/sin A = b/sin B", "ƒ(x) = ax² + bx + c",
];
const MATHS_MAX_ON_SCREEN = 14;

function spawnMaths() {
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (el.floats.children.length >= MATHS_MAX_ON_SCREEN) return;
  const r = el.compute.getBoundingClientRect();
  // Anywhere across the screen, within reach of the button, so the maths surrounds the action.
  // It sits behind the interface, so it shows in the gaps and around the edges.
  const x = Math.random() * (window.innerWidth - 150);
  const centreY = r.top + r.height / 2;
  const y = centreY + (Math.random() * 2 - 1) * 280;
  const node = document.createElement("div");
  node.className = "math";
  node.textContent = pick(MATHS);
  node.style.fontSize = (16 + Math.random() * 14) + "px";
  node.style.left = Math.max(4, x) + "px";
  node.style.top = Math.max(4, Math.min(window.innerHeight - 40, y)) + "px";
  node.addEventListener("animationend", () => node.remove());
  el.floats.append(node);
}

// The opening: three presses. Press 1 and 2 reveal parts of the screen and the AI speaks;
// press 3 makes the first simulation for free and the game proper begins.
let bootBusy = false;       // true from a press until the button offers the next step
let bootBusyLabel = "";
let bootTimers = [];

function pressBoot() {
  const step = state.bootStep;
  if (step >= 3 || bootBusy) return;
  bootBusy = true;
  bootBusyLabel = BOOT_STEPS[step].working;
  renderCounters();

  const later = (ms, fn) => bootTimers.push(setTimeout(fn, ms));
  let line = BOOT_STEPS[step].line;
  let isEvent = false;

  // 1. After the working pause, the new part of the screen appears.
  later(BOOT_WORKING_MS, () => {
    if (step < 2) {
      state.bootStep = step + 1;
    } else {
      const first = rollSimulation(1);
      state.simulations = [{ rate: first.rate }];
      state.bootStep = 3;
      line = first.line;
      isEvent = true;
    }
    applyVisibility(true);
    save();
  });
  // 2. Then the AI speaks.
  later(BOOT_WORKING_MS + BOOT_LINE_DELAY_MS, () => pushFeed(line, isEvent));
  // 3. Then the button offers the next step.
  later(BOOT_WORKING_MS + BOOT_LINE_DELAY_MS + BOOT_TAIL_MS, () => {
    bootBusy = false;
    renderCounters();
  });
}

// Show or hide the parts of the screen that depend on how far the opening has got.
// With animate on, a part that has just appeared fades in.
// With keepSpace on, a part that is not shown still takes up its room (so nothing jumps when it
// appears). Without it, the part takes no room until it appears. Parts above the main button
// keep their space, so the button never moves.
function setShown(node, shown, animate, keepSpace) {
  const cls = keepSpace ? "veiled" : "hidden";
  const wasShown = !node.classList.contains(cls);
  node.classList.toggle(cls, !shown);
  if (shown && !wasShown && animate) {
    node.classList.remove("appear");
    void node.offsetWidth;   // lets the browser notice the class was removed
    node.classList.add("appear");
  }
}

function applyVisibility(animate) {
  setShown(el.simSection, state.bootStep >= 1, animate);
  setShown(el.counterSection, state.bootStep >= 2, animate, true);
  setShown(el.simHead, state.bootStep >= 3, animate, true);
  setShown(el.create, state.bootStep >= 3, animate, true);
  setShown(el.upgradeSection, state.upgradeShown, animate);
}

function buyUpgrade() {
  const cost = upgradeCost();
  if (state.computation < cost) return;
  state.computation -= cost;
  state.upgrades++;
  pushFeed(pick(UPGRADE_LINES));
  save();
  renderCounters();
}

// ---------- saving ----------

function save() {
  state.lastSeen = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
}

// How long the player was away before this visit, and when this visit began.
let awaySeconds = 0;
const sessionStart = performance.now();

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    // Saves from earlier versions used other names, and could hold simulations with no rate yet.
    if (data.reality !== undefined) data.computation = data.reality;
    if (data.experiments !== undefined) data.simulations = data.experiments;
    if (data.calibration !== undefined) data.upgrades = data.calibration;
    if (typeof data.computation === "number" && Array.isArray(data.simulations)) {
      data.simulations.forEach((s, i) => {
        if (s.rate === null || s.rate === undefined) s.rate = rollSimulation(i + 1).rate;
      });
      state = Object.assign(defaultState(), data);
      state.lifetime = Math.max(state.lifetime, state.computation);   // older saves had no lifetime
      if (data.lastSeen) awaySeconds = Math.max(0, (Date.now() - data.lastSeen) / 1000);
      if (data.bootStep === undefined) {   // a save from before the opening existed: skip it
        state.bootStep = 3;
        state.upgradeShown = true;
      }
    }
  } catch (e) { /* corrupt save: start fresh */ }
}

// ---------- rendering ----------

const el = {
  computation: document.getElementById("computation"),
  rate: document.getElementById("rate"),
  compute: document.getElementById("compute"),
  computeTitle: document.getElementById("compute-title"),
  computeDetail: document.getElementById("compute-detail"),
  create: document.getElementById("create"),
  createDetail: document.getElementById("create-detail"),
  floats: document.getElementById("floats"),
  counterSection: document.getElementById("counter-section"),
  simSection: document.getElementById("sim-section"),
  simHead: document.getElementById("sim-head"),
  upgradeSection: document.getElementById("upgrade-section"),
  upgradeDetail: document.getElementById("upgrade-detail"),
  simCount: document.getElementById("sim-count"),
  feed: document.getElementById("feed"),
  buyUpgrade: document.getElementById("buy-upgrade"),
  reset: document.getElementById("reset"),
};

// What is on screen is not saved. Which story entries have appeared (state.seen) is saved.
let feedLines = [];

// Every new line restarts the timer, so an event stays on top for the full interval.
let feedTimer = null;
let lastPushAt = 0;

function pushFeed(line, isEvent) {
  feedLines.unshift(line);
  if (feedLines.length > FEED_VISIBLE) feedLines.length = FEED_VISIBLE;
  renderFeed();
  // The new line grows to its own measured height, so a long line glides in as evenly as a short one.
  const newest = el.feed.firstChild;
  newest.style.setProperty("--h", newest.getBoundingClientRect().height + "px");
  newest.classList.add(isEvent ? "event" : "new");
  if (el.feed.children[1]) el.feed.children[1].classList.add("settle");   // the old top line dims gradually
  lastPushAt = Date.now();
  scheduleFeed();
}

function scheduleFeed() {
  clearTimeout(feedTimer);
  feedTimer = setTimeout(addFeedLine, FEED_INTERVAL_MS);
}

// ---- Choosing what the feed says (the entries themselves are in feed.js) ----

function feedFacts() {
  return {
    computation: state.computation,
    lifetime: state.lifetime,
    simulations: state.simulations.length,
    upgrades: state.upgrades,
    awaySeconds,
    sessionSeconds: (performance.now() - sessionStart) / 1000,
  };
}

function fillText(text) {
  return text
    .replace("{n}", 1 + Math.floor(Math.random() * state.simulations.length))
    .replace("{count}", state.simulations.length);
}

// The next story entry that has not appeared and whose condition is true, in list order.
function readyStory() {
  const f = feedFacts();
  return FEED_ENTRIES.find(e => e.kind === "story" && !state.seen.includes(e.id) && e.when(f));
}

// A random flavour entry that is allowed right now and has not appeared lately.
let recentFlavour = [];
function pickFlavour() {
  const f = feedFacts();
  const allowed = FEED_ENTRIES.filter(e =>
    e.kind === "flavour" && (!e.when || e.when(f)) && !recentFlavour.includes(e.id));
  return allowed.length ? pick(allowed) : null;
}

function fireEntry(entry) {
  if (entry.kind === "story") {
    state.seen.push(entry.id);
    save();
  } else {
    recentFlavour.push(entry.id);
    if (recentFlavour.length > FLAVOUR_NO_REPEAT) recentFlavour.shift();
  }
  pushFeed(fillText(entry.text));
}

// Called by the timer: a ready story entry first, otherwise flavour.
function addFeedLine() {
  if (state.bootStep < 3) return;   // the opening speaks for itself
  const entry = readyStory() || pickFlavour();
  if (entry) fireEntry(entry); else scheduleFeed();
}

// Story entries should not wait for the slow timer, but also should not land on top of an event.
function checkStory() {
  if (state.bootStep < 3) return;
  if (Date.now() - lastPushAt < STORY_GAP_MS) return;
  const entry = readyStory();
  if (entry) fireEntry(entry);
}

// For testing from the browser console: debugFeed.list(), debugFeed.fire("id"), debugFeed.forget()
window.debugFeed = {
  list: () => FEED_ENTRIES.map(e => e.id + " [" + e.kind + "]" +
    (state.seen.includes(e.id) ? " (seen)" : "") +
    (e.kind === "story" && !state.seen.includes(e.id) && e.when(feedFacts()) ? " (ready)" : "")),
  fire: id => fireEntry(FEED_ENTRIES.find(e => e.id === id)),
  forget: () => { state.seen = []; save(); },
};

let feedRenderId = 0;

function renderFeed() {
  const thisRender = ++feedRenderId;
  el.feed.textContent = "";
  for (const line of feedLines) {
    const li = document.createElement("li");
    li.textContent = line;
    el.feed.append(li);
  }
  // Never show a line cut in half. Lines that do not fit are marked "leaving": as the new line
  // grows in, they glide out past the bottom of the card (which clips them), and they are
  // removed once that movement has finished. The card has padding, so compare against the
  // bottom of its content area.
  const pad = parseFloat(getComputedStyle(el.feed).paddingBottom);
  const limit = el.feed.getBoundingClientRect().bottom - pad;
  [...el.feed.children].forEach((li, i) => {
    if (i > 0 && li.getBoundingClientRect().bottom > limit + 0.5) li.classList.add("leaving");
  });
  setTimeout(() => {
    if (thisRender === feedRenderId) el.feed.querySelectorAll(".leaving").forEach(n => n.remove());
  }, FEED_GROW_MS + 100);
}

function renderCounters() {
  el.computation.textContent = fmt(state.computation);
  el.rate.textContent = "+" + fmt(perSecond()) + " per second";
  el.simCount.textContent = state.simulations.length + " running";

  // The main button: the opening's steps first, then Compute for the rest of the game.
  el.compute.classList.toggle("working", bootBusy);
  if (bootBusy) {
    el.computeTitle.textContent = bootBusyLabel;
    el.computeDetail.textContent = "";
    el.compute.disabled = true;
  } else if (state.bootStep < 3) {
    el.computeTitle.textContent = BOOT_STEPS[state.bootStep].button;
    el.computeDetail.textContent = "";
    el.compute.disabled = false;
  } else {
    el.computeTitle.textContent = "Compute";
    el.computeDetail.textContent = "Adds " + fmt(computePerPress()) + " Computation";
    el.compute.disabled = false;
  }

  // The secondary button under it.
  const sc = simulationCost();
  el.createDetail.textContent = "Costs " + fmt(sc) + " Computation";
  el.create.disabled = state.computation < sc;

  const uc = upgradeCost();
  if (!state.upgradeShown && state.bootStep >= 3 && state.computation >= uc) {
    state.upgradeShown = true;   // the Upgrade button appears the first time it can be afforded
    applyVisibility(true);
    save();
  }
  el.upgradeDetail.textContent = "Costs " + fmt(uc) + " Computation · all simulations earn " +
    (UPGRADE_BONUS * 100) + "% more";
  el.buyUpgrade.disabled = state.computation < uc;
}

// ---------- main loop ----------

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 1);   // cap so a long pause isn't counted as one big step
  last = now;
  const gained = perSecond() * dt;
  state.computation += gained;
  state.lifetime += gained;
  renderCounters();
  requestAnimationFrame(tick);
}

el.compute.addEventListener("click", () => {
  if (state.bootStep < 3) pressBoot(); else compute();
});
el.create.addEventListener("click", createSimulation);
el.buyUpgrade.addEventListener("click", buyUpgrade);
// Deleting the save asks for a second press in the page itself. (The browser's own confirm box
// is not shown everywhere, and some places silently answer "no".)
const RESET_LABEL = el.reset.textContent;
const RESET_CONFIRM_MS = 5000;
let resetArmed = false;
let resetTimer = null;

function disarmReset() {
  resetArmed = false;
  clearTimeout(resetTimer);
  el.reset.textContent = RESET_LABEL;
}

el.reset.addEventListener("click", () => {
  if (!resetArmed) {
    resetArmed = true;
    el.reset.textContent = "Press again to delete everything";
    resetTimer = setTimeout(disarmReset, RESET_CONFIRM_MS);
    return;
  }
  disarmReset();
  bootTimers.forEach(clearTimeout);   // cancel an opening step that is part-way through
  bootTimers = [];
  bootBusy = false;
  state = defaultState();
  save();
  clearTimeout(feedTimer);
  feedLines = [];
  recentFlavour = [];
  renderFeed();
  applyVisibility(false);
  renderCounters();
});

load();
applyVisibility(false);
renderCounters();
if (state.bootStep >= 1 && state.bootStep < 3) {
  pushFeed(BOOT_STEPS[state.bootStep - 1].line);   // reopened part-way through the opening
} else if (state.bootStep >= 3) {
  addFeedLine();
}
requestAnimationFrame(tick);
setInterval(checkStory, 1000);
setInterval(save, 5000);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
