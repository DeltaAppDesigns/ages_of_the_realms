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
  // Top-down rooftop colours per building role (flat "map" look, not icons).
  const ROOF = {
    res:   { f: '#bb6a4a', a: '#974f37' },
    com:   { f: '#4e8cbf', a: '#386b96' },
    ind:   { f: '#8c9099', a: '#666a73' },
    sci:   { f: '#5fb0c9', a: '#43899f' },
    civic: { f: '#b98fd6', a: '#9466b8' },
    power: { f: '#3fa898', a: '#2c8273' },
    misc:  { f: '#9a8f76', a: '#766c57' }
  };
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
  // Residential rooftop colour by era: thatch → tile → brick → concrete → glass → white.
  const ERA_RES = ['#9c7a4a', '#b5503f', '#8a4a3a', '#7d8a99', '#5a9aa8', '#cdd3e0'];
  const ERA_RES_A = ['#7c5e34', '#8f3e30', '#6c382b', '#5d6877', '#427883', '#9aa3b8'];
  const eraIndexById = (id) => { const i = ERAS.findIndex((e) => e.id === id); return i < 0 ? 0 : i; };

  // Draw one parcel as a flat, top-down footprint. Style evolves with the building's era.
  function drawBuilding(ctx, b, x, y, sz) {
    const k = mapKind(b);
    const i = 1.4, fx = x + i, fy = y + i, fw = sz - 2 * i, fh = sz - 2 * i;
    ctx.save();
    if (k === 'farm') {                                   // cropland (era-agnostic)
      roundRect(ctx, fx, fy, fw, fh, 2); ctx.fillStyle = '#6f9b43'; ctx.fill();
      ctx.strokeStyle = '#577d32'; ctx.lineWidth = 1;
      for (let r = 1; r <= 3; r++) { const ly = fy + (fh * r) / 4; ctx.beginPath(); ctx.moveTo(fx + 1.5, ly); ctx.lineTo(fx + fw - 1.5, ly); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; roundRect(ctx, fx, fy, fw, fh, 2); ctx.stroke();
      ctx.restore(); return;
    }
    if (k === 'park') {
      roundRect(ctx, fx, fy, fw, fh, 4); ctx.fillStyle = '#4f8a3f'; ctx.fill();
      [[0.32, 0.34], [0.7, 0.42], [0.48, 0.72]].forEach((t) => drawTree(ctx, fx + fw * t[0], fy + fh * t[1], 3, 'medieval'));
      ctx.restore(); return;
    }
    if (k === 'solar') {
      roundRect(ctx, fx, fy, fw, fh, 2); ctx.fillStyle = '#16263d'; ctx.fill();
      ctx.fillStyle = '#3a6ea5';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) ctx.fillRect(fx + 2 + c * (fw - 4) / 3, fy + 2 + r * (fh - 4) / 3, (fw - 4) / 3 - 1.5, (fh - 4) / 3 - 1.5);
      ctx.restore(); return;
    }

    // --- general buildings: geometry & palette shift with the era ---
    const eraIdx = eraIndexById(b.era);
    const gen = eraIdx <= 1 ? 0 : (eraIdx <= 3 ? 1 : 2); // old / industrial-modern / future
    const ins = gen === 0 ? 3 : 1.4;                     // older = smaller footprint, more green
    const rad = gen === 2 ? 5 : 1.6;                     // future = rounded corners
    const gx = x + ins, gy = y + ins, gw = sz - 2 * ins, gh = sz - 2 * ins;
    const col = ROOF[k] || ROOF.misc;
    const fill = (k === 'res') ? ERA_RES[eraIdx] : col.f;
    const acc = (k === 'res') ? ERA_RES_A[eraIdx] : col.a;
    roundRect(ctx, gx, gy, gw, gh, rad); ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1; roundRect(ctx, gx, gy, gw, gh, rad); ctx.stroke();

    if (gen === 0) {                                      // pitched roof (ridge + hips)
      ctx.strokeStyle = acc; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(gx + gw / 2, gy + 2); ctx.lineTo(gx + gw / 2, gy + gh - 2); ctx.stroke();
      ctx.lineWidth = 0.8; ctx.beginPath();
      ctx.moveTo(gx, gy); ctx.lineTo(gx + gw / 2, gy + gh / 2);
      ctx.moveTo(gx + gw, gy); ctx.lineTo(gx + gw / 2, gy + gh / 2); ctx.stroke();
    } else if (k === 'res') {                             // flat residential: window grid
      ctx.fillStyle = acc;
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) ctx.fillRect(gx + gw * (0.2 + c * 0.36), gy + gh * (0.22 + r * 0.36), gw * 0.22, gh * 0.22);
    } else if (k === 'ind') {                             // rooftop vents
      ctx.fillStyle = acc; ctx.fillRect(gx + gw * 0.2, gy + gh * 0.28, gw * 0.2, gh * 0.2); ctx.fillRect(gx + gw * 0.55, gy + gh * 0.52, gw * 0.22, gh * 0.22);
    } else if (k === 'com') {                             // skylight
      ctx.fillStyle = 'rgba(255,255,255,.32)'; ctx.fillRect(gx + gw * 0.27, gy + gh * 0.27, gw * 0.46, gh * 0.46);
    } else if (k === 'sci') {                             // rooftop equipment
      ctx.fillStyle = acc; ctx.fillRect(gx + gw * 0.28, gy + gh * 0.28, gw * 0.44, gh * 0.26);
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(gx + gw * 0.28, gy + gh * 0.6, gw * 0.44, gh * 0.12);
    } else if (k === 'civic') {                           // dome
      ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(gx + gw / 2, gy + gh / 2, Math.min(gw, gh) * 0.24, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(gx + gw / 2, gy + gh / 2, 1.4, 0, 7); ctx.fill();
    } else if (k === 'power') {                           // cooling tower
      ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(gx + gw / 2, gy + gh / 2, Math.min(gw, gh) * 0.3, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(gx + gw / 2, gy + gh / 2, Math.min(gw, gh) * 0.14, 0, 7); ctx.fill();
    }
    if (gen === 2) {                                      // future sheen
      ctx.fillStyle = 'rgba(255,255,255,.14)'; roundRect(ctx, gx + 1, gy + 1, gw * 0.5, gh * 0.3, 3); ctx.fill();
    }
    ctx.restore();
  }
  const MAP_VERSION = 'v7';
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
  // Dashed lane markings down the interior streets — the key "this is a road map" cue.
  function drawStreets(ctx, tl, tt, dW, dH, cols, rows, blockSize, road) {
    ctx.save(); if (ctx.setLineDash) ctx.setLineDash([4, 5]);
    ctx.strokeStyle = 'rgba(232,212,120,.5)'; ctx.lineWidth = 1;
    for (let c = 1; c < cols; c++) { const x = tl + c * (blockSize + road) - road / 2; ctx.beginPath(); ctx.moveTo(x, tt); ctx.lineTo(x, tt + dH); ctx.stroke(); }
    for (let r = 1; r < rows; r++) { const y = tt + r * (blockSize + road) - road / 2; ctx.beginPath(); ctx.moveTo(tl, y); ctx.lineTo(tl + dW, y); ctx.stroke(); }
    if (ctx.setLineDash) ctx.setLineDash([]); ctx.restore();
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

    // ---- layout: a river on the left, the town (city blocks) to its right ----
    const riverZone = 46, pad = 12, outer = 10;
    const plot = 26, pg = 2, BN = 3, blockSize = BN * plot + (BN - 1) * pg; // 82
    const road = 12;
    const areaX = riverZone + pad;
    const areaW = cssW - areaX - pad;
    const bpr = Math.max(1, Math.floor((areaW - outer * 2 + road) / (blockSize + road)));
    const blocks = Math.max(1, Math.ceil(Math.max(total, 1) / (BN * BN)));
    const devCols = Math.min(blocks, bpr);
    const devRows = Math.ceil(blocks / bpr);
    const devW = devCols * (blockSize + road) - road;
    const devH = devRows * (blockSize + road) - road;
    const cssH = pad * 2 + outer * 2 + devH;
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const townLeft = areaX + outer + Math.max(0, (areaW - outer * 2 - devW) / 2);
    const townTop = pad + outer;
    const blockXY = (b) => ({ x: townLeft + (b % bpr) * (blockSize + road), y: townTop + ((b / bpr) | 0) * (blockSize + road) });
    const occupied = (x, y) => x > townLeft - road && x < townLeft + devW + road && y > townTop - road && y < townTop + devH + road;

    // 1) countryside, then the river over the left margin
    drawCountryside(ctx, cssW, cssH, era, T.grass, occupied);
    drawRiver(ctx, riverZone / 2, cssH, era);
    // 2) paved town base framing the blocks
    roundRect(ctx, townLeft - road / 2, townTop - road / 2, devW + road, devH + road, 8);
    ctx.fillStyle = T.road; ctx.fill();
    // 3) blocks + building rooftops
    for (let b = 0; b < blocks; b++) {
      const o = blockXY(b);
      roundRect(ctx, o.x, o.y, blockSize, blockSize, 4); ctx.fillStyle = T.lot; ctx.fill();
      for (let p = 0; p < BN * BN; p++) {
        const idx = b * BN * BN + p;
        const px = o.x + (p % BN) * (plot + pg), py = o.y + ((p / BN) | 0) * (plot + pg);
        if (idx < total) drawBuilding(ctx, tiles[idx], px, py, plot);
      }
    }
    // 4) street lane markings on top of the road grid
    drawStreets(ctx, townLeft, townTop, devW, devH, devCols, devRows, blockSize, road);
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
