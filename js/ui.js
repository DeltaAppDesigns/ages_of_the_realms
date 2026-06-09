/* build 2026-06-08b */
/* Rendering layer. Reads Engine.state; delegates interactions to window.App. */
window.UI = (function () {
  const RES = window.GAME_RESOURCES;
  const ERAS = window.GAME_ERAS;
  const BUILDINGS = window.GAME_BUILDINGS;
  const TECH = window.GAME_TECH;

  const $ = (id) => document.getElementById(id);
  const resById = {}; RES.forEach((r) => { resById[r.id] = r; });

  let activeTab = 'build';

  /* ---------- formatting ---------- */
  function fmtStock(id, v) {
    if (id === 'happiness') return Math.round(v);
    if (id === 'population') return Math.round(v);
    return Math.floor(v);
  }
  function fmtDelta(id, d) {
    if (d === undefined || d === null) return '';
    let v = (id === 'population' || id === 'happiness') ? Math.round(d) : Math.round(d * 10) / 10;
    if (Math.abs(v) < 0.05) return '';
    return (v > 0 ? '+' : '') + v + '/yr';
  }
  function costStr(cost) {
    return Object.keys(cost).map((r) => resById[r].icon + cost[r]).join(' ');
  }
  function effectStr(eff) {
    const parts = [];
    for (const r in eff) {
      if (!resById[r]) continue;
      const v = eff[r];
      parts.push((v > 0 ? '+' : '') + v + resById[r].icon);
    }
    return parts.join('  ');
  }

  /* ---------- top bar ---------- */
  function renderTop() {
    const s = Engine.state;
    $('era-name').textContent = ERAS[s.eraIndex].name;
    $('settlement-name').textContent = s.settlement + ' · ' + ERAS[s.eraIndex].title;
    $('year-label').textContent = 'Year ' + s.year;
    renderResources();
    renderEraProgress();
  }

  function renderResources() {
    const s = Engine.state;
    const d = s.lastDeltas || {};
    $('resource-bar').innerHTML = RES.map((r) => {
      const delta = fmtDelta(r.id, d[r.id]);
      const cls = (d[r.id] > 0.05) ? 'delta-pos' : (d[r.id] < -0.05 ? 'delta-neg' : '');
      return '<div class="res">' +
        '<div class="res-top"><span class="res-ico">' + r.icon + '</span>' +
        '<span class="res-name">' + r.name + '</span></div>' +
        '<span class="res-val">' + fmtStock(r.id, s.res[r.id]) + (r.id === 'happiness' ? '' : '') + '</span>' +
        '<span class="res-delta ' + cls + '">' + delta + '</span>' +
        '</div>';
    }).join('');
  }

  function renderEraProgress() {
    const p = Engine.eraProgress(Engine.state);
    $('era-progress-fill').style.width = p.pct + '%';
    if (!p.next) { $('era-progress-label').textContent = ERAS[Engine.state.eraIndex].name + ' — the pinnacle of your realm 🏆'; return; }
    let label = 'Toward the ' + p.next.name + ' — ';
    const bits = [];
    bits.push('People ' + Math.round(Engine.state.res.population) + '/' + p.popNeed);
    if (p.techsLeft.length) bits.push('Research: ' + p.techsLeft.join(', '));
    else bits.push('research complete');
    $('era-progress-label').textContent = label + bits.join(' · ');
  }

  /* ---------- build tab ---------- */
  function renderBuildings() {
    const s = Engine.state;
    const shown = BUILDINGS.filter((b) => Engine.eraIndexOf(b.era) <= s.eraIndex);
    $('building-list').innerHTML = shown.map((b) => {
      const n = s.buildings[b.id] || 0;
      const u = Engine.buildingUnlock(b);
      const cost = Engine.buildingCost(b);
      const afford = Engine.canAfford(cost);
      const stats = [];
      if (b.produces) for (const r in b.produces) stats.push('<span class="stat-pos">+' + b.produces[r] + resById[r].icon + '</span>');
      if (b.upkeep) for (const r in b.upkeep) stats.push('<span class="stat-neg">-' + b.upkeep[r] + resById[r].icon + '</span>');
      if (b.jobs) stats.push('<span class="stat-neutral">' + b.jobs + ' jobs</span>');
      if (b.housing) stats.push('<span class="stat-pos">+' + b.housing + ' homes</span>');
      if (b.happiness) stats.push('<span class="' + (b.happiness > 0 ? 'stat-pos' : 'stat-neg') + '">' + (b.happiness > 0 ? '+' : '') + b.happiness + '😊</span>');
      if (b.growth) stats.push('<span class="stat-pos">+health</span>');

      let action;
      if (!u.techOk) {
        const t = Engine.techDef(b.tech);
        action = '<button class="btn btn-ghost" disabled>🔒 ' + (t ? t.name : 'Locked') + '</button>';
      } else {
        action = '<button class="btn btn-primary" ' + (afford ? '' : 'disabled') +
          ' onclick="App.build(\'' + b.id + '\')">Build · ' + costStr(cost) + '</button>';
      }
      return '<div class="card' + (u.techOk ? '' : ' locked') + '">' +
        '<div class="card-head"><span class="card-ico">' + b.icon + '</span>' +
        '<span class="card-title">' + b.name + '</span>' +
        '<span class="card-count">' + (n ? '×' + n : '') + '</span></div>' +
        '<div class="card-desc">' + b.desc + '</div>' +
        '<div class="card-stats">' + stats.join('') + '</div>' +
        '<div class="card-actions">' + action + '</div>' +
        '</div>';
    }).join('');
  }

  /* ---------- research tab ---------- */
  function renderTech() {
    const s = Engine.state;
    const shown = TECH.filter((t) => Engine.eraIndexOf(t.era) <= s.eraIndex);
    if (!shown.length) { $('tech-list').innerHTML = '<div class="card"><div class="card-desc">New research will appear as your realm grows.</div></div>'; return; }
    $('tech-list').innerHTML = shown.map((t) => {
      const st = Engine.techState(t);
      let action;
      if (st.researched) action = '<button class="btn btn-ghost" disabled>✓ Researched</button>';
      else if (!st.available) action = '<button class="btn btn-ghost" disabled>🔒 Needs: ' + (st.prereqLeft.join(', ') || 'earlier age') + '</button>';
      else action = '<button class="btn btn-primary" ' + (st.affordable ? '' : 'disabled') +
        ' onclick="App.research(\'' + t.id + '\')">Research · ' + t.cost + '📜</button>';
      return '<div class="card' + (st.researched ? '' : (st.available ? '' : ' locked')) + '">' +
        '<div class="card-head"><span class="card-ico">' + t.icon + '</span>' +
        '<span class="card-title">' + t.name + '</span>' +
        '<span class="card-count">' + t.cost + '📜</span></div>' +
        '<div class="card-desc">' + t.desc + '</div>' +
        '<div class="card-actions">' + action + '</div>' +
        '</div>';
    }).join('');
  }

  /* ---------- city tab ---------- */
  function renderCity() {
    const s = Engine.state;
    const st = s.stats || {};
    const inc = st.income || {};
    const p = Engine.eraProgress(s);
    function kv(k, v) { return '<div class="kv"><span>' + k + '</span><span class="v">' + v + '</span></div>'; }
    function netStr(id) { const v = inc[id] || 0; const r = Math.round(v * 10) / 10; return (r > 0 ? '+' : '') + r + ' ' + resById[id].icon; }

    let pathBlock = '';
    if (p.next) {
      pathBlock = '<div class="summary-block"><h3>Path to the ' + p.next.name + '</h3>' +
        kv('Progress', p.pct + '%') +
        kv('People', Math.round(s.res.population) + ' / ' + p.popNeed) +
        kv('Research left', p.techsLeft.length ? p.techsLeft.join(', ') : 'Done') +
        '</div>';
    } else {
      pathBlock = '<div class="summary-block"><h3>' + ERAS[s.eraIndex].name + '</h3>' +
        kv('Status', 'Final age reached 🏆') +
        kv('Keep building', 'Grow your star city as large as you dare') +
        '</div>';
    }

    $('city-summary').innerHTML =
      '<div class="summary-block"><h3>The Realm of ' + s.settlement + '</h3>' +
        kv('Age', ERAS[s.eraIndex].name + ' · ' + ERAS[s.eraIndex].title) +
        kv('Year', s.year) +
        kv('Population', Math.round(s.res.population)) +
        kv('Mood', Math.round(s.res.happiness) + ' / 100 (trending ' + (st.target >= s.res.happiness ? '↑' : '↓') + ' ' + st.target + ')') +
      '</div>' +
      '<div class="summary-block"><h3>Yearly Economy</h3>' +
        kv('Food', netStr('food')) +
        kv('Coin', netStr('coin')) +
        kv('Materials', netStr('materials')) +
        kv('Knowledge', netStr('knowledge')) +
      '</div>' +
      '<div class="summary-block"><h3>Workforce & Housing</h3>' +
        kv('Jobs filled', (st.employed || 0) + ' / ' + (st.jobs || 0)) +
        kv('Housing used', Math.round(s.res.population) + ' / ' + (st.housing || 0)) +
        kv('Open homes', (st.housingFree || 0)) +
      '</div>' +
      pathBlock;
  }

  /* ---------- chronicle tab ---------- */
  function renderLog() {
    const s = Engine.state;
    if (!s.log.length) { $('log-feed').innerHTML = '<div class="log-item">Your story begins here.</div>'; return; }
    $('log-feed').innerHTML = s.log.map((l) =>
      '<div class="log-item ' + (l.cls || '') + '"><span class="log-year">Yr ' + l.year + '</span>' + l.text + '</div>'
    ).join('');
  }

  /* ---------- city map (top-down emoji tiles) ---------- */
  function renderMap() {
    const s = Engine.state;
    const tiles = [];
    // BUILDINGS is era-ordered, so iterating it clusters similar structures into "districts"
    BUILDINGS.forEach((b) => {
      const n = s.buildings[b.id] || 0;
      for (let i = 0; i < n; i++) tiles.push({ e: b.icon, name: b.name });
    });
    const total = tiles.length;
    const types = Object.keys(s.buildings).filter((k) => s.buildings[k] > 0).length;
    $('map-head').innerHTML = '<b>' + s.settlement + '</b> · ' + ERAS[s.eraIndex].name +
      ' · ' + total + ' buildings (' + types + ' kinds) · pop ' + Math.round(s.res.population);

    if (!total) {
      $('city-map').innerHTML = '<div class="map-empty">Your land is empty. Build something on the Build tab to watch your realm take shape here.</div>';
      return;
    }
    const ground = ERA_GROUND[ERAS[s.eraIndex].id] || '🌿';
    const pad = Math.max(10, Math.ceil(total * 0.4));
    let html = tiles.map((t) => '<div class="tile bld" title="' + t.name + '">' + t.e + '</div>').join('');
    for (let i = 0; i < pad; i++) html += '<div class="tile ground">' + ground + '</div>';
    $('city-map').innerHTML = html;
  }

  /* ---------- tabs ---------- */
  function setTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    $('tab-' + tab).classList.add('active');
    renderActive();
  }
  function renderActive() {
    if (activeTab === 'build') renderBuildings();
    else if (activeTab === 'map') renderMap();
    else if (activeTab === 'tech') renderTech();
    else if (activeTab === 'city') renderCity();
    else if (activeTab === 'log') renderLog();
  }

  function renderAll() {
    setEraTheme();
    renderTop();
    renderActive();
    updateAdvanceState();
  }

  const ERA_BG = { medieval: '#1a1410', renaissance: '#15161f', industrial: '#14130f', modern: '#0c1116',
                   information: '#0a1016', space: '#0b0a16' };
  const ERA_GROUND = { medieval: '🌿', renaissance: '🌳', industrial: '🪨', modern: '▫️', information: '⬛', space: '🌑' };
  function setEraTheme() {
    const era = ERAS[Engine.state.eraIndex].id;
    document.body.setAttribute('data-era', era);
    // keep the root (and iOS home-indicator safe area) matching the era
    document.documentElement.style.backgroundColor = ERA_BG[era] || '#1a1410';
    const tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.setAttribute('content', ERA_BG[era] || '#1a1410');
  }

  function updateAdvanceState() {
    const over = Engine.state.gameOver;
    $('btn-advance').disabled = over;
    $('btn-auto').disabled = over;
  }

  /* ---------- event modal ---------- */
  let eventOpen = false;
  function showEvent(e) {
    eventOpen = true;
    $('event-title').textContent = (e.icon ? e.icon + ' ' : '') + e.title;
    $('event-body').textContent = e.body;
    $('event-choices').innerHTML = e.choices.map((c, i) => {
      let preview = c.preview || (c.apply ? 'Outcome uncertain…' : effectStr(c.effects || {}));
      return '<button class="btn btn-primary" onclick="App.chooseEvent(\'' + e.id + '\',' + i + ')">' +
        c.text + (preview ? '<span class="choice-effects">' + preview + '</span>' : '') + '</button>';
    }).join('');
    $('event-overlay').classList.remove('hidden');
  }
  function hideEvent() { eventOpen = false; $('event-overlay').classList.add('hidden'); }
  function isEventOpen() { return eventOpen; }

  /* ---------- game over ---------- */
  function showGameOver() {
    eventOpen = true;
    $('event-title').textContent = '☠️ The Realm Has Fallen';
    $('event-body').textContent = 'After ' + Engine.state.year + ' years, the realm of ' + Engine.state.settlement +
      ' is no more. Every great city is built on hard lessons — begin again and build one that endures.';
    $('event-choices').innerHTML = '<button class="btn btn-primary" onclick="App.restart()">Begin a New Realm</button>';
    $('event-overlay').classList.remove('hidden');
  }

  /* ---------- toast ---------- */
  let toastTimer = null;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), 1700);
  }

  return {
    renderAll, renderTop, renderActive, setTab, setEraTheme,
    showEvent, hideEvent, isEventOpen, showGameOver, toast
  };
})();
