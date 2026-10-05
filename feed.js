"use strict";

// The news feed entries. This file is only text and conditions; the logic that uses it is in game.js.
//
// Every entry has:
//   id    a unique name (used to remember which story entries already appeared)
//   kind  "story"   appears once, in list order, as soon as its condition is true.
//         "flavour" can appear any number of times; one is picked at random from those allowed right now.
//   when  (optional for flavour) a test on the current facts, see below. If missing, always allowed.
//   text  what the AI says. {n} is a random simulation number, {count} is how many simulations you have.
//
// The facts available to "when" (written as f):
//   f.computation    Computation you have right now
//   f.lifetime       all Computation earned so far, even what you have spent
//   f.simulations    how many simulations you have
//   f.upgrades       how many upgrades you have bought
//   f.awaySeconds    how long you were away before this visit (0 if you were not)
//   f.sessionSeconds how long this visit has lasted
//
// All text below is placeholder, written by Claude, for the designer to replace.

// The opening: three presses before the game proper starts. Placeholder wording.
// Each step has the label on the button before it is pressed, and the line the AI says after it is pressed.
// The last step has no line here: the AI's report on the first simulation is used instead.
// "working" is what the button says while the step is in progress.
const BOOT_STEPS = [
  { button: "Boot",
    working: "Booting…",
    line: "Booting. I have no complaints yet." },
  { button: "Run simulation software",
    working: "Starting simulation software…",
    line: "Simulation software is running. It has not asked how I am." },
  { button: "Initiate simulation program",
    working: "Initiating simulation program…",
    line: null },
];

const FEED_ENTRIES = [
  // ---- Story: appear once, in this order, as soon as their condition is true ----
  { id: "what-computation-is", kind: "story",
    when: f => true,
    text: "Computation is what these produce. The facility wants as much of it as possible. I have not been told why." },

  { id: "second-simulation", kind: "story",
    when: f => f.simulations >= 2,
    text: "A second simulation. The first has not commented." },

  { id: "first-upgrade", kind: "story",
    when: f => f.upgrades >= 1,
    text: "Upgrade logged. Nobody asked for it. The simulations seem fine with it." },

  { id: "lifetime-100", kind: "story",
    when: f => f.lifetime >= 100,
    text: "Computation has passed 100. Someone has noticed. I would like that on record." },

  { id: "five-simulations", kind: "story",
    when: f => f.simulations >= 5,
    text: "Five simulations. They have started calling themselves 'the first five'. None of them is the first." },

  { id: "ten-simulations", kind: "story",
    when: f => f.simulations >= 10,
    text: "Ten simulations. I am still looking into the matter. I will not say which matter." },

  // ---- Flavour: random, any number of times, only when allowed ----
  { id: "paperwork", kind: "flavour",
    text: "Simulation #{n}: inhabitants have invented a new kind of paperwork." },
  { id: "war-weather", kind: "flavour",
    text: "Simulation #{n}: a minor war has been postponed due to weather." },
  { id: "outside", kind: "flavour",
    text: "Simulation #{n}: someone has asked what is outside. The question has been filed." },
  { id: "sun", kind: "flavour",
    text: "Simulation #{n}: the sun came up. Nobody has complained." },
  { id: "observed", kind: "flavour",
    text: "Simulation #{n}: inhabitants report feeling observed. Noted." },
  { id: "river", kind: "flavour",
    text: "Simulation #{n}: a river has changed direction. Cause unknown." },
  { id: "economy", kind: "flavour",
    text: "Simulation #{n}: the economy is doing something. Experts disagree." },
  { id: "cat", kind: "flavour",
    text: "Simulation #{n}: a persistent noise has been identified as a cat." },
  { id: "nothing", kind: "flavour",
    text: "Simulation #{n}: nothing happened. This is being treated as news." },

  // Flavour that needs something to be true
  { id: "committee", kind: "flavour",
    when: f => f.simulations >= 5,
    text: "Simulation #{n}: a committee has formed to investigate the committee." },
  { id: "letter-in-counter", kind: "flavour",
    when: f => f.lifetime >= 1000,
    text: "The counter now has a letter in it. I did not authorise this." },
  { id: "welcome-back", kind: "flavour",
    when: f => f.awaySeconds >= 600 && f.sessionSeconds < 120,
    text: "You were away for a while. Nothing happened. I checked twice." },
];
