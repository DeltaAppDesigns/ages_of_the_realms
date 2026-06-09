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

  /* ---------- city map (top-down canvas) ---------- */
  // Terrain palette per era: ground (lots), grass tint, and road colour.
  const TERRAIN = {
    medieval:    { lot: '#5c7a3f', grass: '#557235', road: '#6b573a' },
    renaissance: { lot: '#56743c', grass: '#4f6c36', road: '#7a6648' },
    industrial:  { lot: '#5f5a4a', grass: '#565142', road: '#3b362c' },
    modern:      { lot: '#3c4753', grass: '#36404b', road: '#262e37' },
    information: { lot: '#1f2c3a', grass: '#1b2733', road: '#121d27' },
    space:       { lot: '#241d3e', grass: '#1e1834', road: '#100c22' }
  };
  // Building category -> colours. Derived from each building's role (see mapKind).
  const KIND = {
    res:   { body: '#ddcfb4', roof: '#b65140', detail: '#3a2c22' },
    farm:  { body: '#6fa84a', roof: '#557f38', detail: '#456a2c' },
    ind:   { body: '#8c919a', roof: '#5f636b', detail: '#cfa14a' },
    com:   { body: '#e0b85a', roof: '#b98a30', detail: '#7a5b1c' },
    sci:   { body: '#cdd6e2', roof: '#5b8fb0', detail: '#7fd0e8' },
    civic: { body: '#cdbce0', roof: '#8a5fb0', detail: '#efe6d6' },
    misc:  { body: '#b9ab93', roof: '#7a6f5c', detail: '#3a3228' }
  };
  function mapKind(b) {
    if (b.housing) return 'res';
    const p = b.produces || {};
    if (p.food) return 'farm';
    if (p.knowledge) return 'sci';
    if (p.materials) return 'ind';
    if (p.coin) return 'com';
    if ((b.happiness || 0) > 0) return 'civic';
    return 'misc';
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function drawBuilding(ctx, b, x, y, lot) {
    const k = mapKind(b), c = KIND[k];
    const m = Math.round(lot * 0.18);
    const bx = x + m, by = y + m, bw = lot - 2 * m, bh = lot - 2 * m;
    ctx.save();
    if (k === 'farm') {
      roundRect(ctx, bx, by, bw, bh, 3); ctx.fillStyle = c.body; ctx.fill();
      ctx.strokeStyle = c.detail; ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) { const fy = by + (bh * i) / 4; ctx.beginPath(); ctx.moveTo(bx + 2, fy); ctx.lineTo(bx + bw - 2, fy); ctx.stroke(); }
    } else if (k === 'res') {
      const wallH = bh * 0.6, roofH = bh - wallH;
      ctx.fillStyle = c.body; ctx.fillRect(bx, by + roofH, bw, wallH);            // wall
      ctx.fillStyle = c.roof; ctx.beginPath();                                     // peaked roof
      ctx.moveTo(bx - 1, by + roofH); ctx.lineTo(bx + bw / 2, by); ctx.lineTo(bx + bw + 1, by + roofH); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c.detail;                                                    // window
      ctx.fillRect(bx + bw / 2 - 1.5, by + roofH + wallH * 0.35, 3, 3);
    } else if (k === 'ind') {
      roundRect(ctx, bx, by, bw, bh, 2); ctx.fillStyle = c.body; ctx.fill();
      ctx.fillStyle = c.roof; ctx.fillRect(bx, by, bw, bh * 0.28);                 // dark roof strip
      ctx.fillStyle = c.roof; ctx.fillRect(bx + bw * 0.6, by - bh * 0.22, bw * 0.18, bh * 0.32); // chimney
      ctx.fillStyle = 'rgba(220,220,220,.5)'; ctx.beginPath(); ctx.arc(bx + bw * 0.69, by - bh * 0.22, bw * 0.13, 0, 7); ctx.fill(); // smoke
    } else if (k === 'sci') {
      roundRect(ctx, bx, by, bw, bh, 3); ctx.fillStyle = c.body; ctx.fill();
      ctx.fillStyle = c.detail;                                                    // glass windows
      for (let r = 0; r < 2; r++) for (let cc = 0; cc < 2; cc++) ctx.fillRect(bx + 3 + cc * (bw / 2), by + 4 + r * (bh / 2.4), bw / 2 - 5, bh / 3.4);
      ctx.strokeStyle = c.roof; ctx.lineWidth = 1; ctx.beginPath();                // antenna
      ctx.moveTo(bx + bw / 2, by); ctx.lineTo(bx + bw / 2, by - bh * 0.25); ctx.stroke();
      ctx.fillStyle = c.detail; ctx.beginPath(); ctx.arc(bx + bw / 2, by - bh * 0.25, 1.6, 0, 7); ctx.fill();
    } else if (k === 'civic') {
      const wallH = bh * 0.62;
      ctx.fillStyle = c.body; ctx.fillRect(bx, by + (bh - wallH), bw, wallH);
      ctx.fillStyle = c.roof; ctx.beginPath();                                     // dome
      ctx.arc(bx + bw / 2, by + (bh - wallH), bw / 2, Math.PI, 0); ctx.fill();
      ctx.fillStyle = c.detail; ctx.fillRect(bx + bw / 2 - 0.8, by + (bh - wallH) - bw / 2 - 3, 1.6, 3); // spire
    } else if (k === 'com') {
      roundRect(ctx, bx, by, bw, bh, 2); ctx.fillStyle = c.body; ctx.fill();
      ctx.fillStyle = c.roof; ctx.fillRect(bx, by + bh * 0.42, bw, bh * 0.16);     // sign band
      ctx.fillStyle = c.detail; ctx.fillRect(bx + bw * 0.4, by + bh * 0.66, bw * 0.2, bh * 0.34); // door
    } else {
      roundRect(ctx, bx, by, bw, bh, 2); ctx.fillStyle = c.body; ctx.fill();
      ctx.fillStyle = c.roof; ctx.fillRect(bx, by, bw, bh * 0.3);
    }
    ctx.restore();
  }
  function renderMap() {
    const s = Engine.state; if (!s) return;
    const tiles = [];
    BUILDINGS.forEach((b) => { const n = s.buildings[b.id] || 0; for (let i = 0; i < n; i++) tiles.push(b); });
    const total = tiles.length;
    const types = Object.keys(s.buildings).filter((k) => s.buildings[k] > 0).length;
    $('map-head').innerHTML = '<b>' + s.settlement + '</b> · ' + ERAS[s.eraIndex].name +
      ' · ' + total + ' buildings (' + types + ' kinds) · pop ' + Math.round(s.res.population);

    const canvas = $('map-canvas');
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const host = canvas.parentElement || canvas;
    const cssW = Math.max(260, (host.clientWidth || 320));
    const lot = 46, gap = 8, pad = 10;
    const cols = Math.max(3, Math.floor((cssW - pad * 2 + gap) / (lot + gap)));
    const rows = Math.max(4, Math.ceil(Math.max(total, 1) / cols));
    const cssH = pad * 2 + rows * lot + (rows - 1) * gap;
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const T = TERRAIN[ERAS[s.eraIndex].id] || TERRAIN.medieval;
    ctx.fillStyle = T.road; ctx.fillRect(0, 0, cssW, cssH);                        // streets underneath
    for (let i = 0; i < rows * cols; i++) {
      const col = i % cols, row = (i / cols) | 0;
      const x = pad + col * (lot + gap), y = pad + row * (lot + gap);
      roundRect(ctx, x, y, lot, lot, 6);                                           // grass lot
      ctx.fillStyle = (i % 2 === (row % 2)) ? T.lot : T.grass; ctx.fill();
      if (i < total) drawBuilding(ctx, tiles[i], x, y, lot);
    }
    if (!total) {
      ctx.fillStyle = 'rgba(239,230,214,.7)'; ctx.font = '13px -apple-system, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Your land awaits — build to populate the map.', cssW / 2, cssH / 2);
    }
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
