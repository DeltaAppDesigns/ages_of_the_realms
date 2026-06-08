/* Game engine: state, yearly simulation, building, research, eras, events. */
window.Engine = (function () {
  const RES = window.GAME_RESOURCES;
  const T = window.GAME_TUNING;
  const ERAS = window.GAME_ERAS;
  const BUILDINGS = window.GAME_BUILDINGS;
  const TECH = window.GAME_TECH;
  const EVENTS = window.GAME_EVENTS;

  const EVENT_CHANCE = 0.42; // odds a random event rolls in a quiet year
  const SETTLEMENT_NAMES = ['Oakhollow','Riverford','Stonehaven','Greenvale','Brightwater',
    'Thornwick', 'Elmsworth', 'Ashford', 'Westmere', 'Fairhill', 'Highcrest', 'Larkspur'];

  let state = null;

  /* ---------- helpers ---------- */
  const eraIndexOf = (id) => ERAS.findIndex((e) => e.id === id);
  const buildingDef = (id) => BUILDINGS.find((b) => b.id === id);
  const techDef = (id) => TECH.find((t) => t.id === id);

  function clampRes(s) {
    ['food','coin','materials','knowledge'].forEach((r) => { if (s.res[r] < 0) s.res[r] = 0; });
    s.res.happiness = Math.max(0, Math.min(100, s.res.happiness));
    s.res.population = Math.max(0, Math.round(s.res.population));
  }

  function addLog(s, text, cls) {
    s.log.unshift({ year: s.year, text: text, cls: cls || '' });
    if (s.log.length > 80) s.log.length = 80;
  }

  /* ---------- new game ---------- */
  function newGame(name) {
    const res = {};
    RES.forEach((r) => { res[r.id] = r.start; });
    state = {
      settlement: name || SETTLEMENT_NAMES[Math.floor(Math.random() * SETTLEMENT_NAMES.length)],
      year: 1, eraIndex: 0,
      res: res, buildings: {}, tech: {}, flags: {},
      log: [], firedEvents: {}, lastDeltas: {}, stats: {},
      auto: false, gameOver: false, victory: false
    };
    computeYear(state); // prime stats/deltas for first render
    return state;
  }

  function loadState(saved) {
    state = saved;
    if (!state.lastDeltas) state.lastDeltas = {};
    if (!state.stats) state.stats = {};
    computeYear(state);
    return state;
  }

  /* ---------- yearly simulation ----------
     Returns { deltas, stats } and writes them onto state (does NOT advance the year). */
  function computeYear(s) {
    let jobs = 0, housing = 0, hapBuild = 0, growthBonus = 0;
    const prod = { food: 0, coin: 0, materials: 0, knowledge: 0 };
    const upk = { food: 0, coin: 0, materials: 0 };

    BUILDINGS.forEach((b) => {
      const n = s.buildings[b.id] || 0; if (!n) return;
      jobs += (b.jobs || 0) * n;
      housing += (b.housing || 0) * n;
    });

    const pop = s.res.population;
    const employment = jobs > 0 ? Math.min(1, pop / jobs) : 1;

    BUILDINGS.forEach((b) => {
      const n = s.buildings[b.id] || 0; if (!n) return;
      if (b.produces) for (const r in b.produces) prod[r] += b.produces[r] * n * employment;
      if (b.upkeep) for (const r in b.upkeep) upk[r] += b.upkeep[r] * n;
      hapBuild += (b.happiness || 0) * n;
      growthBonus += (b.growth || 0) * n;
    });

    // tech multipliers
    const mult = { food: 1, coin: 1, materials: 1, knowledge: 1 };
    let hapFlat = 0, allMult = 0;
    TECH.forEach((t) => {
      if (!s.tech[t.id] || !t.bonus) return;
      const b = t.bonus;
      if (b.type === 'all_mult') allMult += b.value;
      else if (b.type === 'food_mult') mult.food += b.value;
      else if (b.type === 'materials_mult') mult.materials += b.value;
      else if (b.type === 'coin_mult') mult.coin += b.value;
      else if (b.type === 'knowledge_mult') mult.knowledge += b.value;
      else if (b.type === 'happiness_flat') hapFlat += b.value;
    });
    for (const r in mult) mult[r] += allMult;
    prod.food *= mult.food; prod.coin *= mult.coin;
    prod.materials *= mult.materials; prod.knowledge *= mult.knowledge;

    // economy
    const tax = pop * T.TAX_PER_POP * (s.res.happiness / 100);
    prod.coin += tax;
    const foodEaten = pop * T.FOOD_PER_POP;

    const dFood = prod.food - upk.food - foodEaten;
    const dCoin = prod.coin - upk.coin;
    const dMat = prod.materials - upk.materials;
    const dKno = prod.knowledge;

    // mood target
    let target = T.HAPPINESS_BASE + hapBuild + hapFlat;
    const homeless = Math.max(0, pop - housing);
    target -= homeless * 2.5;
    const idle = jobs > 0 ? Math.max(0, pop - jobs) : pop;
    target -= Math.min(20, (idle / Math.max(1, pop)) * 25);
    if (dFood < 0) target -= 15;
    target = Math.max(0, Math.min(100, target));
    const dHap = (target - s.res.happiness) * T.HAPPINESS_DRIFT;

    // population
    const housingFree = Math.max(0, housing - pop);
    let dPop = 0;
    const projFood = s.res.food + dFood;
    if (projFood < 0 && pop > 0) {
      dPop = -Math.max(1, Math.floor(pop * T.STARVE_RATE));
    } else if (s.res.happiness < 25 && pop > 0) {
      dPop = -Math.max(1, Math.floor(pop * T.UNREST_RATE));
    } else if (s.res.happiness >= 50 && housingFree > 0) {
      const g = pop * (T.GROWTH_RATE + growthBonus) * (s.res.happiness / 100);
      dPop = Math.min(housingFree, Math.max(0, Math.round(g)));
      if (dPop < 1 && g > 0.4) dPop = 1; // gentle early-game growth
    }

    const deltas = { food: dFood, coin: dCoin, materials: dMat, knowledge: dKno, happiness: dHap, population: dPop };
    const stats = { jobs, housing, housingFree, employment, employed: Math.min(pop, jobs),
                    target: Math.round(target), homeless, idle, tax,
                    income: { food: dFood, coin: dCoin, materials: dMat, knowledge: dKno } };
    s.lastDeltas = deltas;
    s.stats = stats;
    return { deltas, stats };
  }

  /* ---------- advance one year ---------- */
  function advanceYear() {
    const s = state;
    if (s.gameOver) return { event: null, gameOver: true };

    const { deltas } = computeYear(s);
    s.res.food += deltas.food;
    s.res.coin += deltas.coin;
    s.res.materials += deltas.materials;
    s.res.knowledge += deltas.knowledge;
    s.res.happiness += deltas.happiness;
    s.res.population += deltas.population;
    clampRes(s);
    s.year += 1;

    // narrate hardship
    if (deltas.population < 0) {
      const why = (s.res.food <= 0) ? 'Famine grips the realm' : 'Unrest drives people away';
      addLog(s, why + ' — ' + Math.abs(deltas.population) + ' lost.', 'log-bad');
    }

    // game over?
    if (s.res.population <= 0) {
      s.gameOver = true;
      addLog(s, 'The last of your people are gone. The realm falls silent.', 'log-bad');
      computeYear(s);
      return { event: null, gameOver: true };
    }

    tryAdvanceEra(s);
    computeYear(s); // refresh preview deltas for the new state
    const event = pickEvent(s);
    return { event: event, gameOver: false };
  }

  function tryAdvanceEra(s) {
    const next = ERAS[s.eraIndex + 1];
    if (!next || !next.advance) return false;
    const req = next.advance;
    const popOk = s.res.population >= req.population;
    const techOk = req.techs.every((t) => s.tech[t]);
    if (popOk && techOk) {
      s.eraIndex += 1;
      if (s.eraIndex >= 3) s.victory = true;
      addLog(s, 'Your realm enters the ' + next.name + '!', 'log-story');
      return true;
    }
    return false;
  }

  function eraProgress(s) {
    const next = ERAS[s.eraIndex + 1];
    if (!next || !next.advance) return { pct: 100, next: null, popOk: true, techsLeft: [] };
    const req = next.advance;
    const popPct = Math.min(1, s.res.population / req.population);
    const techsDone = req.techs.filter((t) => s.tech[t]).length;
    const techPct = req.techs.length ? techsDone / req.techs.length : 1;
    const pct = Math.round(((popPct + techPct) / 2) * 100);
    return {
      pct, next,
      popOk: s.res.population >= req.population,
      popNeed: req.population,
      techsLeft: req.techs.filter((t) => !s.tech[t]).map((t) => { const d = techDef(t); return d ? d.name : t; })
    };
  }

  /* ---------- building ---------- */
  function buildingCost(b) {
    const n = state.buildings[b.id] || 0;
    const scale = Math.pow(b.costScale || 1.15, n);
    const cost = {};
    for (const r in b.cost) cost[r] = Math.ceil(b.cost[r] * scale);
    return cost;
  }
  function buildingUnlock(b) {
    const eraOk = eraIndexOf(b.era) <= state.eraIndex;
    const techOk = !b.tech || !!state.tech[b.tech];
    return { eraOk, techOk, buildable: eraOk && techOk };
  }
  function canAfford(cost) {
    return Object.keys(cost).every((r) => state.res[r] >= cost[r]);
  }
  function build(id) {
    const b = buildingDef(id); if (!b) return { ok: false, msg: 'Unknown building' };
    const u = buildingUnlock(b); if (!u.buildable) return { ok: false, msg: 'Not yet available' };
    const cost = buildingCost(b);
    if (!canAfford(cost)) return { ok: false, msg: 'Not enough resources' };
    for (const r in cost) state.res[r] -= cost[r];
    state.buildings[id] = (state.buildings[id] || 0) + 1;
    computeYear(state);
    return { ok: true, name: b.name };
  }

  /* ---------- research ---------- */
  function techAvailable(t) {
    if (state.tech[t.id]) return false;
    if (eraIndexOf(t.era) > state.eraIndex) return false;
    return (t.prereq || []).every((p) => state.tech[p]);
  }
  function techState(t) {
    const researched = !!state.tech[t.id];
    const available = techAvailable(t);
    const affordable = available && state.res.knowledge >= t.cost;
    const prereqLeft = (t.prereq || []).filter((p) => !state.tech[p]).map((p) => { const d = techDef(p); return d ? d.name : p; });
    return { researched, available, affordable, prereqLeft };
  }
  function research(id) {
    const t = techDef(id); if (!t) return { ok: false, msg: 'Unknown tech' };
    if (!techAvailable(t)) return { ok: false, msg: 'Locked' };
    if (state.res.knowledge < t.cost) return { ok: false, msg: 'Not enough knowledge' };
    state.res.knowledge -= t.cost;
    state.tech[id] = true;
    addLog(state, 'Researched ' + t.name + '.', 'log-story');
    tryAdvanceEra(state);
    computeYear(state);
    return { ok: true, name: t.name, advanced: false };
  }

  /* ---------- events ---------- */
  function safeCond(e, s) { try { return e.cond ? !!e.cond(s) : true; } catch (err) { return false; } }
  function isOnce(e) { return e.once !== undefined ? e.once : (e.type === 'story'); }

  function pickEvent(s) {
    const story = EVENTS.filter((e) => e.type === 'story' && !s.firedEvents[e.id] && safeCond(e, s));
    if (story.length) return story[0];
    if (Math.random() < EVENT_CHANCE) {
      const pool = EVENTS.filter((e) => e.type === 'random' && safeCond(e, s) && !(isOnce(e) && s.firedEvents[e.id]));
      if (pool.length) {
        const total = pool.reduce((a, e) => a + (e.weight || 1), 0);
        let r = Math.random() * total;
        for (const e of pool) { r -= (e.weight || 1); if (r <= 0) return e; }
        return pool[pool.length - 1];
      }
    }
    return null;
  }

  function resolveEvent(eventId, choiceIndex) {
    const s = state;
    const e = EVENTS.find((x) => x.id === eventId); if (!e) return;
    const c = e.choices[choiceIndex]; if (!c) return;
    let log = c.log, cls = c.logClass || 'log-story';
    if (typeof c.apply === 'function') {
      const r = c.apply(s) || {};
      if (r.log) log = r.log; if (r.logClass) cls = r.logClass;
    }
    if (c.effects) { for (const r in c.effects) { if (r in s.res) s.res[r] += c.effects[r]; } }
    if (c.flags) Object.assign(s.flags, c.flags);
    clampRes(s);
    if (isOnce(e)) s.firedEvents[e.id] = true;
    if (log) addLog(s, log, cls);
    if (s.res.population <= 0 && !s.gameOver) {
      s.gameOver = true;
      addLog(s, 'The realm has fallen. There is no one left to lead.', 'log-bad');
    }
    tryAdvanceEra(s);
    computeYear(s);
  }

  /* ---------- accessors ---------- */
  return {
    newGame, loadState,
    get state() { return state; },
    computeYear, advanceYear,
    eraProgress, tryAdvanceEra,
    buildingCost, buildingUnlock, canAfford, build,
    techState, research,
    resolveEvent,
    peekEvent: function () { return pickEvent(state); },
    eraIndexOf, buildingDef, techDef,
    addLog
  };
})();
