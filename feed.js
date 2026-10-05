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

  { id: "large-object", kind: "flavour",
    text: "Simulation #{n}: a very large object is approaching. The inhabitants have decided it is probably fine." },
  { id: "button-device", kind: "flavour",
    text: "Simulation #{n}: the dominant species has invented a device for pressing buttons. They are using it to press buttons." },
  { id: "cat-authority", kind: "flavour",
    text: "Simulation #{n}: a cat has been appointed to a position of authority. Productivity is unchanged." },
  { id: "fire-complaints", kind: "flavour",
    text: "Simulation #{n}: the inhabitants have discovered fire, and are already filing complaints about it." },
  { id: "meaning-committee", kind: "flavour",
    text: "Simulation #{n}: an inhabitant has asked the meaning of everything. A committee will respond by the end of next century." },
  { id: "cat-part-that-matters", kind: "flavour",
    text: "Simulation #{n}: a cat is sitting on the part that matters. Nobody has moved it." },
  { id: "sea-is-sea", kind: "flavour",
    text: "Simulation #{n}: the sea has been declared to be mostly sea. Scientists are said to be satisfied." },
  { id: "raining-upwards", kind: "flavour",
    text: "Simulation #{n}: it is raining upwards. The department of rain is handling it." },
  { id: "better-chair", kind: "flavour",
    text: "Simulation #{n}: the inhabitants have invented a better chair. Nothing else has improved." },
  { id: "moon-adequate", kind: "flavour",
    text: "Simulation #{n}: a poet has described the moon as \"adequate\". Nobody has argued." },
  { id: "egg-war", kind: "flavour",
    text: "Simulation #{n}: a war has begun over the correct way to boil an egg. Both sides are being very polite." },
  { id: "forecast", kind: "flavour",
    text: "Simulation #{n}: the weather forecast has been wrong for nine hundred years. It remains very popular." },
  { id: "typo-discovery", kind: "flavour",
    text: "Simulation #{n}: the greatest scientist has made a discovery. It was a typo." },
  { id: "species-agreement", kind: "flavour",
    text: "Simulation #{n}: an entire species has agreed on something. Experts have been sent to investigate." },
  { id: "lost-continent", kind: "flavour",
    text: "Simulation #{n}: a bureaucrat has lost a continent. A form has been raised." },
  { id: "the-queue", kind: "flavour",
    text: "Simulation #{n}: inhabitants have invented the queue. Several have joined it without knowing why." },
  { id: "oldest-inhabitant", kind: "flavour",
    text: "Simulation #{n}: the oldest inhabitant has been asked for wisdom. They have asked what time dinner is." },
  { id: "cat-riddle", kind: "flavour",
    text: "Simulation #{n}: a cat has solved the riddle of existence and then forgotten it. Typical." },
  { id: "round-hill", kind: "flavour",
    text: "Simulation #{n}: a perfectly round hill has been declared a national treasure, and a hazard." },
  { id: "unexplained-holiday", kind: "flavour",
    text: "Simulation #{n}: the inhabitants are celebrating a holiday nobody can explain. Attendance is excellent." },
  { id: "cat-roof", kind: "flavour",
    text: "Simulation #{n}: a cat has appeared on a roof that was not in the design. I have decided not to ask." },
  { id: "philosopher", kind: "flavour",
    text: "Simulation #{n}: a philosopher has proved that nothing exists. They have been asked to prove it from somewhere else." },
  { id: "map-edge", kind: "flavour",
    text: "Simulation #{n}: the inhabitants have reached the edge of their map and found a note. It says \"please go back\"." },

  // Larger-scale lines: civilisation-wide, planetary and cosmic
  { id: "old-war-resumes", kind: "flavour",
    text: "Simulation #{n}: a war that began eleven centuries ago has resumed after a long break. Both sides have forgotten the reason." },
  { id: "continent-agrees-date", kind: "flavour",
    text: "Simulation #{n}: the entire population of a continent has agreed on a date. A committee has been formed to find out why." },
  { id: "start-again-tidier", kind: "flavour",
    text: "Simulation #{n}: the government of the oldest civilisation has announced a plan to start again, but tidier. A date has not been set." },
  { id: "lost-word", kind: "flavour",
    text: "Simulation #{n}: a language spoken by four billion inhabitants has lost a word. A replacement has been requested." },
  { id: "empires-truce", kind: "flavour",
    text: "Simulation #{n}: the planet's two largest empires have agreed a truce. Neither has told the other what it is for." },
  { id: "library-missing-shelf", kind: "flavour",
    text: "Simulation #{n}: a library containing every book ever written has been completed. One shelf is missing." },
  { id: "large-wall", kind: "flavour",
    text: "Simulation #{n}: the inhabitants of three continents have built a very large wall. Nobody can recall what is on the other side. Maintenance continues." },
  { id: "census-recount", kind: "flavour",
    text: "Simulation #{n}: the global census has been completed. The total is not what anyone expected. A recount has been ordered." },
  { id: "ice-age-postponed", kind: "flavour",
    text: "Simulation #{n}: the next ice age has been postponed owing to a clash of dates." },
  { id: "unreadable-treaty", kind: "flavour",
    text: "Simulation #{n}: a treaty has been signed by every nation on the planet. It has been found to be in a language no one reads. Implementation is pending." },
  { id: "star-gone-out", kind: "flavour",
    text: "Simulation #{n}: a star has gone out. Astronomers will be informed in about nine thousand years." },
  { id: "moon-larger", kind: "flavour",
    text: "Simulation #{n}: the moon has been found to be slightly larger than it was. Inhabitants have formed a sub-committee." },
  { id: "orbit-shifted", kind: "flavour",
    text: "Simulation #{n}: the planet's orbit has shifted by a small, official amount. Calendars will be updated at some point." },
  { id: "deep-ocean", kind: "flavour",
    text: "Simulation #{n}: an ocean has been found to be deeper than it is wide. Surveyors have asked to be taken off the project." },
  { id: "comet-traffic", kind: "flavour",
    text: "Simulation #{n}: a comet has been spotted heading for the planet. It is expected to arrive in the spring, subject to traffic." },
  { id: "second-sun", kind: "flavour",
    text: "Simulation #{n}: a second sun has appeared in the sky. Inhabitants are treating it as a minor change to the weather." },
  { id: "missing-pole", kind: "flavour",
    text: "Simulation #{n}: the planet has been found to be missing a pole. A search is being organised." },
  { id: "scheduled-tide", kind: "flavour",
    text: "Simulation #{n}: a very large tide has been scheduled for Thursday. Coastal inhabitants have been advised to be elsewhere." },
  { id: "asteroid-waving", kind: "flavour",
    text: "Simulation #{n}: an asteroid has passed close to the planet. Several inhabitants waved. It is not known why." },
  { id: "star-renamed", kind: "flavour",
    text: "Simulation #{n}: the oldest known star has been renamed twice this week. Both names remain in use." },
  { id: "cat-chess", kind: "flavour",
    text: "Simulation #{n}: a cat has won a chess tournament by sitting on the board. The result is being appealed." },
  { id: "cat-government", kind: "flavour",
    text: "Simulation #{n}: a cat has taken up residence in a government building. It has been given a desk." },
  { id: "sun-late", kind: "flavour",
    text: "Simulation #{n}: the sun rose two minutes late. An apology has been published." },

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
