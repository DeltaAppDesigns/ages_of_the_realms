/* build 2026-06-08e */
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
  // Residential wall/roof colour by era: thatch → tile → brick → concrete → glass → white.
  const ERA_RES = ['#a8814c', '#b5503f', '#8a4a3a', '#9aa6b4', '#6fb1c2', '#dfe4ee'];
  const eraIndexById = (id) => { const i = ERAS.findIndex((e) => e.id === id); return i < 0 ? 0 : i; };
  function mapKind(b) {
    if (b.id === 'park') return 'park';
    if (b.id === 'solar_array') return 'solar';
    if (b.id === 'fusion_plant' || b.id === 'antimatter_plant') return 'power';
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
  // Footprint + silhouette spec per building. w,d = footprint; h = oblique height.
  function bSpec(b) {
    const k = mapKind(b);
    if (k === 'farm')  return { k, shape: 'field',   w: 30, d: 22, h: 0 };
    if (k === 'park')  return { k, shape: 'park',    w: 26, d: 22, h: 0 };
    if (k === 'solar') return { k, shape: 'solar',   w: 26, d: 20, h: 0 };
    if (k === 'res') {
      const housing = b.housing || 4;
      if (housing <= 8) return { k, shape: 'house', w: 16, d: 13, h: 10 };
      const t = Math.min(1, (housing - 8) / 60);
      return { k, shape: 'tower', w: 14 + t * 7, d: 12 + t * 4, h: 22 + t * 42 };
    }
    if (k === 'ind')   return { k, shape: 'factory', w: 28, d: 18, h: 13 };
    if (k === 'com')   return { k, shape: 'shop',    w: 20, d: 15, h: 13 };
    if (k === 'sci')   return { k, shape: 'lab',     w: 22, d: 16, h: 19 };
    if (k === 'civic') return { k, shape: 'church',  w: 18, d: 15, h: 15 };
    if (k === 'power') return { k, shape: 'plant',   w: 24, d: 20, h: 16 };
    return { k, shape: 'house', w: 16, d: 13, h: 10 };
  }
  // Draw a distinct, lightly-3D building centred at base point (X,Y), scaled by `scale`.
  function drawBuilding(ctx, b, X, Y, scale) {
    const sp = bSpec(b);
    const w = sp.w * scale, d = sp.d * scale, h = sp.h * scale, eraIdx = eraIndexById(b.era);
    const S = (v) => v * scale;
    ctx.save();
    if (sp.shape === 'field') {                           // crop field + barn
      ctx.fillStyle = '#6f9b43'; ctx.fillRect(X - w / 2, Y - d / 2, w, d);
      ctx.strokeStyle = '#577d32'; ctx.lineWidth = 1;
      for (let r = 1; r <= 3; r++) { const ly = Y - d / 2 + d * r / 4; ctx.beginPath(); ctx.moveTo(X - w / 2 + 1, ly); ctx.lineTo(X + w / 2 - 1, ly); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.strokeRect(X - w / 2, Y - d / 2, w, d);
      ctx.fillStyle = '#9a5a3a'; ctx.fillRect(X + w / 2 - S(7), Y - d / 2 + 1, S(6), S(5));
      ctx.restore(); return;
    }
    if (sp.shape === 'park') {
      ctx.fillStyle = '#4f8a3f'; roundRect(ctx, X - w / 2, Y - d / 2, w, d, S(4)); ctx.fill();
      [[0.3, 0.35], [0.7, 0.4], [0.5, 0.72]].forEach((t) => drawTree(ctx, X - w / 2 + w * t[0], Y - d / 2 + d * t[1], S(3.2), 'medieval'));
      ctx.restore(); return;
    }
    if (sp.shape === 'solar') {
      ctx.fillStyle = '#16263d'; ctx.fillRect(X - w / 2, Y - d / 2, w, d);
      ctx.fillStyle = '#3a6ea5';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) ctx.fillRect(X - w / 2 + 2 + c * (w - 4) / 3, Y - d / 2 + 2 + r * (d - 4) / 3, (w - 4) / 3 - 1.5, (d - 4) / 3 - 1.5);
      ctx.restore(); return;
    }
    // ground shadow for raised buildings
    ctx.fillStyle = 'rgba(0,0,0,.16)';
    ctx.beginPath(); ctx.ellipse(X + d * 0.12, Y, w * 0.6, d * 0.5, 0, 0, 7); ctx.fill();
    const wallStroke = () => { ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1; ctx.strokeRect(X - w / 2, Y - h, w, h); };

    if (sp.shape === 'house') {                           // small gabled cottage
      ctx.fillStyle = '#dccfb6'; ctx.fillRect(X - w / 2, Y - h, w, h); wallStroke();
      ctx.fillStyle = ERA_RES[eraIdx]; ctx.beginPath();
      ctx.moveTo(X - w / 2 - 1, Y - h); ctx.lineTo(X, Y - h - w * 0.55); ctx.lineTo(X + w / 2 + 1, Y - h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(X - w * 0.12, Y - h * 0.55, w * 0.24, h * 0.55);
    } else if (sp.shape === 'tower') {                    // tall apartment / skyscraper
      ctx.fillStyle = ERA_RES[eraIdx]; ctx.fillRect(X - w / 2, Y - h, w, h);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(X + w / 2 - w * 0.18, Y - h, w * 0.18, h); wallStroke();
      ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(X - w / 2, Y - h, w, Math.max(1.5, h * 0.05));
      ctx.fillStyle = 'rgba(20,30,45,.5)';
      const rows = Math.max(2, Math.floor(sp.h / 5));
      for (let r = 0; r < rows; r++) for (let c = 0; c < 2; c++) ctx.fillRect(X - w * 0.3 + c * w * 0.4, Y - h + (r + 0.5) * (h / (rows + 0.4)), w * 0.2, Math.max(1, h / (rows * 2.6)));
    } else if (sp.shape === 'factory') {                  // wide hall, sawtooth roof, chimney
      ctx.fillStyle = '#8a8f98'; ctx.fillRect(X - w / 2, Y - h, w, h); wallStroke();
      ctx.fillStyle = '#6a6e77'; const n = 4, sw = w / n;
      for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.moveTo(X - w / 2 + i * sw, Y - h); ctx.lineTo(X - w / 2 + i * sw + sw, Y - h - sw * 0.5); ctx.lineTo(X - w / 2 + i * sw + sw, Y - h); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#5f636b'; ctx.fillRect(X + w / 2 - S(5), Y - h - S(9), S(3.5), S(9));
      ctx.fillStyle = 'rgba(220,220,220,.5)'; ctx.beginPath(); ctx.arc(X + w / 2 - S(3.2), Y - h - S(10), S(3), 0, 7); ctx.fill();
    } else if (sp.shape === 'shop') {                     // market with awning
      ctx.fillStyle = '#cdb277'; ctx.fillRect(X - w / 2, Y - h, w, h); wallStroke();
      ctx.fillStyle = '#4e8cbf'; ctx.fillRect(X - w / 2, Y - h, w, Math.max(2, h * 0.24));
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(X - w * 0.12, Y - h * 0.5, w * 0.24, h * 0.5);
    } else if (sp.shape === 'lab') {                      // domed research hall
      ctx.fillStyle = '#cdd6e2'; ctx.fillRect(X - w / 2, Y - h, w, h); wallStroke();
      ctx.fillStyle = '#5fb0c9'; ctx.beginPath(); ctx.arc(X, Y - h, w * 0.42, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke();
      ctx.fillStyle = 'rgba(20,40,60,.4)'; for (let c = 0; c < 2; c++) ctx.fillRect(X - w * 0.28 + c * w * 0.36, Y - h * 0.55, w * 0.2, h * 0.4);
    } else if (sp.shape === 'church') {                   // nave + steeple
      ctx.fillStyle = '#d3c7ab'; ctx.fillRect(X - w / 2, Y - h, w, h); wallStroke();
      ctx.fillStyle = '#9466b8'; ctx.beginPath(); ctx.moveTo(X - w / 2 - 1, Y - h); ctx.lineTo(X, Y - h - w * 0.4); ctx.lineTo(X + w / 2 + 1, Y - h); ctx.closePath(); ctx.fill();
      const stx = X - w / 2 + w * 0.2;
      ctx.fillStyle = '#c9bd9f'; ctx.fillRect(stx - S(2), Y - h - S(12), S(4), S(12));
      ctx.fillStyle = '#9466b8'; ctx.beginPath(); ctx.moveTo(stx - S(3), Y - h - S(12)); ctx.lineTo(stx, Y - h - S(18)); ctx.lineTo(stx + S(3), Y - h - S(12)); ctx.closePath(); ctx.fill();
    } else if (sp.shape === 'plant') {                    // two cooling towers
      [-1, 1].forEach((s) => {
        const cx = X + s * w * 0.22;
        ctx.fillStyle = '#aab0b6'; ctx.beginPath();
        ctx.moveTo(cx - w * 0.16, Y); ctx.lineTo(cx - w * 0.1, Y - h); ctx.lineTo(cx + w * 0.1, Y - h); ctx.lineTo(cx + w * 0.16, Y); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(cx, Y - h, w * 0.1, w * 0.04, 0, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(230,230,230,.5)'; ctx.beginPath(); ctx.arc(cx, Y - h - S(4), S(3.2), 0, 7); ctx.fill();
      });
    }
    ctx.restore();
  }
  const MAP_VERSION = 'v9';
  // tiny seeded RNG so the surrounding countryside is stable across redraws
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function drawTree(ctx, x, y, r, era) {
    ctx.fillStyle = 'rgba(40,28,16,.7)'; ctx.fillRect(x - 1, y, 2, r);            // trunk
    const green = (era === 'space' || era === 'information') ? '#3f6b4a' : '#4f7a36';
    ctx.fillStyle = green; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.5, 0, 7); ctx.fill();
  }
  function drawCountryside(ctx, w, h, era, grass, occupied) {
    // grass base
    ctx.fillStyle = grass; ctx.fillRect(0, 0, w, h);
    // scattered trees / rocks that avoid the developed footprint
    const r = rng(1234567);
    const step = 26;
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        const rv = r();
        const jx = x + (r() - 0.5) * step * 0.7, jy = y + (r() - 0.5) * step * 0.7;
        if (occupied(jx, jy)) continue;       // keep the town clear of forest
        if (rv < 0.34) drawTree(ctx, jx, jy, 4 + r() * 2, era);
        else if (rv < 0.40) { ctx.fillStyle = 'rgba(120,120,120,.5)'; ctx.beginPath(); ctx.arc(jx, jy, 2 + r() * 1.5, 0, 7); ctx.fill(); }
      }
    }
  }
  // A river winding down the left side; the town grows beside it.
  function riverPath(ctx, cx, h, w) {
    ctx.beginPath();
    for (let y = 0; y <= h; y += 6) { const c = cx + Math.sin(y * 0.035) * 10; (y === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, c - w / 2, y); }
    for (let y = h; y >= 0; y -= 6) { const c = cx + Math.sin(y * 0.035) * 10; ctx.lineTo(c + w / 2, y); }
    ctx.closePath();
  }
  function drawRiver(ctx, cx, h, era) {
    ctx.fillStyle = (era === 'space' || era === 'information') ? 'rgba(70,95,120,.4)' : 'rgba(86,108,66,.6)';
    riverPath(ctx, cx, h, 26); ctx.fill();                                         // banks
    ctx.fillStyle = (era === 'space') ? '#2b3d68' : (era === 'information' ? '#234b63' : '#3f72a8');
    riverPath(ctx, cx, h, 16); ctx.fill();                                         // water
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let y = 0; y <= h; y += 6) { const c = cx + Math.sin(y * 0.035) * 10; (y === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, c, y); }
    ctx.stroke();
  }
  // Organic, non-grid placement: each building buds off an existing one (vertical bias),
  // so the town sprawls naturally like a settlement that grew over time.
  function layoutTown(items, seed) {
    const r = rng(seed), placed = [], GAP = 4;
    const collide = (x, y, w, d) => {
      for (const p of placed) { if (Math.abs(x - p.x) < (w + p.w) / 2 + GAP && Math.abs(y - p.y) < (d + p.d) / 2 + GAP) return true; }
      return false;
    };
    for (let idx = 0; idx < items.length; idx++) {
      const sp = items[idx].spec, b = items[idx].b;
      if (!placed.length) { placed.push({ x: 0, y: 0, w: sp.w, d: sp.d, b }); continue; }
      let done = false;
      for (let a = 0; a < 50 && !done; a++) {
        const anchor = placed[(r() * placed.length) | 0];
        const ang = r() * Math.PI * 2;
        const dist = (Math.max(anchor.w, anchor.d) + Math.max(sp.w, sp.d)) / 2 + GAP + r() * 6;
        const x = anchor.x + Math.cos(ang) * dist;
        const y = anchor.y + Math.sin(ang) * dist * 1.35;   // taller-than-wide spread
        if (!collide(x, y, sp.w, sp.d)) { placed.push({ x, y, w: sp.w, d: sp.d, b }); done = true; }
      }
      if (!done) { let my = -1e9; for (const p of placed) my = Math.max(my, p.y); placed.push({ x: (r() - 0.5) * 60, y: my + sp.d + GAP, w: sp.w, d: sp.d, b }); }
    }
    return placed;
  }
  function renderMap() {
    const s = Engine.state; if (!s) return;
    const tiles = [];
    BUILDINGS.forEach((b) => { const n = s.buildings[b.id] || 0; for (let i = 0; i < n; i++) tiles.push(b); });
    const total = tiles.length;
    const types = Object.keys(s.buildings).filter((k) => s.buildings[k] > 0).length;
    $('map-head').innerHTML = '<b>' + s.settlement + '</b> · ' + ERAS[s.eraIndex].name +
      ' · ' + total + ' buildings (' + types + ' kinds) · pop ' + Math.round(s.res.population) +
      ' <span style="opacity:.5">· map ' + MAP_VERSION + '</span>';

    const canvas = $('map-canvas');
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const host = canvas.parentElement || canvas;
    const cssW = Math.max(260, (host.clientWidth || 320));
    const era = ERAS[s.eraIndex].id;
    const T = TERRAIN[era] || TERRAIN.medieval;

    const riverZone = 40, pad = 12;
    const areaX = riverZone + pad, areaW = Math.max(120, cssW - areaX - pad);

    // organic world-space layout, then scale to fit width
    const placed = layoutTown(tiles.map((b) => ({ b, spec: bSpec(b) })), 100 + s.settlement.length * 7);
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    placed.forEach((p) => {
      const sp = bSpec(p.b);
      minX = Math.min(minX, p.x - sp.w / 2 - 2); maxX = Math.max(maxX, p.x + sp.w / 2 + 2);
      minY = Math.min(minY, p.y - sp.d / 2 - sp.h - sp.w * 0.6 - 6); maxY = Math.max(maxY, p.y + sp.d / 2 + 4);
    });
    if (!isFinite(minX)) { minX = 0; maxX = 10; minY = 0; maxY = 10; }
    const worldW = Math.max(10, maxX - minX), worldH = Math.max(10, maxY - minY);
    const scale = Math.max(0.42, Math.min(1.15, areaW / worldW));
    const drawW = worldW * scale, drawH = worldH * scale;
    const cssH = Math.max(160, Math.round(drawH + pad * 2));
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const offX = areaX + (areaW - drawW) / 2 - minX * scale;
    const offY = pad - minY * scale;
    const occupied = (x, y) => x > areaX - 8 && y > pad - 4 && y < pad + drawH + 4;

    // terrain, river, then a meandering main road behind the town
    drawCountryside(ctx, cssW, cssH, era, T.grass, occupied);
    drawRiver(ctx, riverZone / 2, cssH, era);
    ctx.strokeStyle = T.road; ctx.lineWidth = Math.max(4, 7 * scale); ctx.lineCap = 'round'; ctx.beginPath();
    for (let yy = pad; yy <= pad + drawH; yy += 8) { const xx = areaX + areaW * 0.5 + Math.sin(yy * 0.03) * areaW * 0.28; (yy === pad ? ctx.moveTo : ctx.lineTo).call(ctx, xx, yy); }
    ctx.stroke();

    // buildings painted back-to-front so nearer ones overlap correctly
    placed.slice().sort((a, b) => a.y - b.y).forEach((p) => {
      drawBuilding(ctx, p.b, offX + p.x * scale, offY + p.y * scale, scale);
    });
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
