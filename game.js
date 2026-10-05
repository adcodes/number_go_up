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
const FEED_VISIBLE = 4;
const STORY_GAP_MS = 4000;   // a ready story entry waits until the feed has been quiet this long
const FLAVOUR_NO_REPEAT = 3; // a flavour entry will not repeat until this many others have appeared

const UPGRADE_LINES = [
  "Upgrade installed. Simulations now run 25% more efficiently, which I am choosing to believe.",
  "Upgrade complete. The simulations agree with each other. This has not happened before.",
];

// The AI's report on the very first simulation, shown in the feed on a fresh start.
let introLine = null;

let state = defaultState();

function defaultState() {
  const first = rollSimulation(1);
  introLine = first.line;
  return {
    computation: 0,
    lifetime: 0,        // all Computation ever earned, for the feed's conditions
    upgrades: 0,
    simulations: [{ rate: first.rate }],
    seen: [],           // ids of story entries that have already appeared
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
      introLine = null;   // not a fresh start
    }
  } catch (e) { /* corrupt save: start fresh */ }
}

// ---------- rendering ----------

const el = {
  computation: document.getElementById("computation"),
  rate: document.getElementById("rate"),
  create: document.getElementById("create"),
  createDetail: document.getElementById("create-detail"),
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
  el.feed.firstChild.classList.add(isEvent ? "event" : "new");
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
  const entry = readyStory() || pickFlavour();
  if (entry) fireEntry(entry); else scheduleFeed();
}

// Story entries should not wait for the slow timer, but also should not land on top of an event.
function checkStory() {
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

function renderFeed() {
  el.feed.textContent = "";
  for (const line of feedLines) {
    const li = document.createElement("li");
    li.textContent = line;
    el.feed.append(li);
  }
  // Never show a line cut in half: drop lines from the bottom until everything fits.
  // The card has padding, so compare against the bottom of its content area.
  const pad = parseFloat(getComputedStyle(el.feed).paddingBottom);
  const limit = el.feed.getBoundingClientRect().bottom - pad;
  while (el.feed.children.length > 1 &&
         el.feed.lastChild.getBoundingClientRect().bottom > limit + 0.5) {
    el.feed.lastChild.remove();
  }
}

function renderCounters() {
  el.computation.textContent = fmt(state.computation);
  el.rate.textContent = "+" + fmt(perSecond()) + " per second";
  el.simCount.textContent = state.simulations.length + " running";

  const sc = simulationCost();
  el.createDetail.textContent = "Costs " + fmt(sc) + " Computation";
  el.create.disabled = state.computation < sc;

  const uc = upgradeCost();
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

el.create.addEventListener("click", createSimulation);
el.buyUpgrade.addEventListener("click", buyUpgrade);
el.reset.addEventListener("click", () => {
  if (confirm("Delete your save and start again?")) {
    state = defaultState();
    save();
    feedLines = [];
    recentFlavour = [];
    pushFeed(introLine);
    renderCounters();
  }
});

load();
renderCounters();
if (introLine) pushFeed(introLine); else addFeedLine();
requestAnimationFrame(tick);
setInterval(checkStory, 1000);
setInterval(save, 5000);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
