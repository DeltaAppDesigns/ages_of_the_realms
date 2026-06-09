/* build 2026-06-08f */
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
      (function () {
        const pop = Math.round(s.res.population), beds = st.housing || 0;
        const homeless = Math.max(0, pop - beds);
        const hv = homeless > 0
          ? '<span class="v" style="color:var(--bad)">' + homeless + ' ⚠️</span>'
          : '<span class="v" style="color:var(--good)">0 ✓</span>';
        return '<div class="summary-block"><h3>Workforce & Housing</h3>' +
          kv('Jobs filled', (st.employed || 0) + ' / ' + (st.jobs || 0)) +
          kv('Beds (housing)', beds) +
          kv('People housed', Math.min(pop, beds) + ' / ' + pop) +
          kv('Open beds', st.housingFree || 0) +
          '<div class="kv"><span>Homeless</span>' + hv + '</div>' +
        '</div>';
      })() +
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
  // Each building id gets its own shape so the map shows real variety.
  function bSpec(b) {
    const k = mapKind(b), id = b.id;
    const M = { // explicit per-building silhouettes
      farm: 'field', mechanized_farm: 'field', orbital_farm: 'field',
      granary: 'silo', windmill: 'mill', greenhouse: 'greenhouse', vertical_farm: 'greenhouse', bio_dome: 'dome',
      lumber_camp: 'lumber', workshop: 'workshop', recycling_center: 'workshop',
      market: 'market', bank: 'bank', textile_mill: 'factory',
      factory: 'factory', steel_mill: 'factory', composite_works: 'factory', nanofabricator: 'factory',
      rail_depot: 'depot', transit_hub: 'depot', maglev: 'depot', spaceport: 'launch',
      chapel: 'church', watchtower: 'watch', theater: 'theater', hospital: 'hospital',
      scholars_hall: 'study', university: 'study', public_school: 'study',
      tech_park: 'lab', data_center: 'lab', ai_lab: 'lab', quantum_lab: 'lab',
      fusion_plant: 'plant', antimatter_plant: 'plant', solar_array: 'solar', park: 'park'
    };
    const sizes = {
      field: [30, 22, 0], park: [26, 22, 0], solar: [26, 20, 0],
      silo: [18, 16, 16], mill: [15, 15, 24], greenhouse: [26, 18, 12], dome: [28, 24, 16],
      lumber: [22, 18, 9], workshop: [22, 17, 12], market: [24, 16, 10], bank: [22, 16, 16],
      factory: [28, 18, 13], depot: [30, 15, 11], launch: [24, 20, 28],
      church: [18, 15, 15], watch: [13, 13, 26], theater: [24, 17, 14], hospital: [24, 18, 16],
      study: [22, 16, 13], lab: [24, 17, 17], plant: [24, 20, 16]
    };
    if (vertical_farm_is(id)) return { k, shape: 'greenhouse', w: 18, d: 16, h: 42 };
    if (M[id]) { const s = sizes[M[id]] || [20, 15, 13]; return { k, shape: M[id], w: s[0], d: s[1], h: s[2] }; }
    if (k === 'res' || b.housing) {
      const housing = b.housing || 4;
      if (housing <= 8) return { k, shape: 'house', w: 16, d: 13, h: 10 };
      const t = Math.min(1, (housing - 8) / 60);
      return { k, shape: 'tower', w: 14 + t * 7, d: 12 + t * 4, h: 22 + t * 42 };
    }
    if (k === 'farm') return { k, shape: 'field', w: 30, d: 22, h: 0 };
    if (k === 'ind') return { k, shape: 'factory', w: 28, d: 18, h: 13 };
    if (k === 'sci') return { k, shape: 'lab', w: 24, d: 17, h: 17 };
    if (k === 'civic') return { k, shape: 'church', w: 18, d: 15, h: 15 };
    if (k === 'power') return { k, shape: 'plant', w: 24, d: 20, h: 16 };
    return { k, shape: 'market', w: 20, d: 15, h: 12 };
  }
  function vertical_farm_is(id) { return id === 'vertical_farm'; }

  // Draw a distinct, lightly-3D building centred at base point (X,Y), scaled by `scale`.
  function drawBuilding(ctx, b, X, Y, scale) {
    const sp = bSpec(b), sh = sp.shape;
    const w = sp.w * scale, d = sp.d * scale, h = sp.h * scale, eraIdx = eraIndexById(b.era);
    const S = (v) => v * scale;
    const L = X - w / 2, R = X + w / 2, TOP = Y - h;
    ctx.save();

    // ---- flat ground parcels (no height) ----
    if (sh === 'field') {
      ctx.fillStyle = '#6f9b43'; ctx.fillRect(L, Y - d / 2, w, d);
      ctx.strokeStyle = '#577d32'; ctx.lineWidth = 1;
      for (let r = 1; r <= 3; r++) { const ly = Y - d / 2 + d * r / 4; ctx.beginPath(); ctx.moveTo(L + 1, ly); ctx.lineTo(R - 1, ly); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.strokeRect(L, Y - d / 2, w, d);
      ctx.fillStyle = '#9a5a3a'; ctx.fillRect(R - S(7), Y - d / 2 + 1, S(6), S(5));
      ctx.restore(); return;
    }
    if (sh === 'park') {
      ctx.fillStyle = '#4f8a3f'; roundRect(ctx, L, Y - d / 2, w, d, S(4)); ctx.fill();
      [[0.3, 0.35], [0.7, 0.4], [0.5, 0.72]].forEach((t) => drawTree(ctx, L + w * t[0], Y - d / 2 + d * t[1], S(3.2), 'medieval'));
      ctx.restore(); return;
    }
    if (sh === 'solar') {
      ctx.fillStyle = '#16263d'; ctx.fillRect(L, Y - d / 2, w, d);
      ctx.fillStyle = '#3a6ea5';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) ctx.fillRect(L + 2 + c * (w - 4) / 3, Y - d / 2 + 2 + r * (d - 4) / 3, (w - 4) / 3 - 1.5, (d - 4) / 3 - 1.5);
      ctx.restore(); return;
    }

    // ground shadow + a reusable boxed wall
    ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.beginPath(); ctx.ellipse(X + d * 0.12, Y, w * 0.6, d * 0.5, 0, 0, 7); ctx.fill();
    const box = (col) => { ctx.fillStyle = col; ctx.fillRect(L, TOP, w, h); ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(R - w * 0.16, TOP, w * 0.16, h); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1; ctx.strokeRect(L, TOP, w, h); };
    const door = () => { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(X - w * 0.1, Y - h * 0.5, w * 0.2, h * 0.5); };

    if (sh === 'house') {
      ctx.fillStyle = '#dccfb6'; ctx.fillRect(L, TOP, w, h); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.strokeRect(L, TOP, w, h);
      ctx.fillStyle = ERA_RES[eraIdx]; ctx.beginPath(); ctx.moveTo(L - 1, TOP); ctx.lineTo(X, TOP - w * 0.55); ctx.lineTo(R + 1, TOP); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke(); door();
    } else if (sh === 'tower') {
      box(ERA_RES[eraIdx]);
      ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(L, TOP, w, Math.max(1.5, h * 0.05));
      ctx.fillStyle = 'rgba(20,30,45,.5)'; const rows = Math.max(2, Math.floor(sp.h / 5));
      for (let r = 0; r < rows; r++) for (let c = 0; c < 2; c++) ctx.fillRect(X - w * 0.3 + c * w * 0.4, TOP + (r + 0.5) * (h / (rows + 0.4)), w * 0.2, Math.max(1, h / (rows * 2.6)));
    } else if (sh === 'factory') {
      box('#8a8f98');
      ctx.fillStyle = '#6a6e77'; const n = 4, sw = w / n;
      for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.moveTo(L + i * sw, TOP); ctx.lineTo(L + i * sw + sw, TOP - sw * 0.5); ctx.lineTo(L + i * sw + sw, TOP); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#5f636b'; ctx.fillRect(R - S(5), TOP - S(9), S(3.5), S(9));
      ctx.fillStyle = 'rgba(220,220,220,.5)'; ctx.beginPath(); ctx.arc(R - S(3.2), TOP - S(10), S(3), 0, 7); ctx.fill();
    } else if (sh === 'market') {                          // striped market stalls
      ctx.fillStyle = '#b79256'; ctx.fillRect(L, Y - h * 0.5, w, h * 0.5);
      const n = 3, sw = w / n;
      for (let i = 0; i < n; i++) { ctx.fillStyle = (i % 2 ? '#d9d2c4' : '#c0533f'); ctx.fillRect(L + i * sw, TOP, sw, h * 0.55); }
      ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.strokeRect(L, TOP, w, h);
    } else if (sh === 'bank') {                            // columned facade + pediment
      box('#d8d2c2');
      ctx.fillStyle = '#c9b27a'; ctx.beginPath(); ctx.moveTo(L - 1, TOP); ctx.lineTo(X, TOP - w * 0.3); ctx.lineTo(R + 1, TOP); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let c = 0; c < 4; c++) ctx.fillRect(L + w * (0.14 + c * 0.22), TOP + h * 0.18, w * 0.06, h * 0.7);
    } else if (sh === 'silo') {                            // grain silos + barn
      ctx.fillStyle = '#9a5a3a'; ctx.fillRect(L, Y - h * 0.55, w * 0.46, h * 0.55);  // barn
      ctx.fillStyle = '#6f3f28'; ctx.beginPath(); ctx.moveTo(L, Y - h * 0.55); ctx.lineTo(L + w * 0.23, Y - h * 0.8); ctx.lineTo(L + w * 0.46, Y - h * 0.55); ctx.closePath(); ctx.fill();
      [0.62, 0.84].forEach((fx) => { const cx = L + w * fx, cw = w * 0.16; ctx.fillStyle = '#cdbb8e'; ctx.fillRect(cx - cw / 2, TOP + S(3), cw, h - S(3)); ctx.beginPath(); ctx.arc(cx, TOP + S(3), cw / 2, Math.PI, 0); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke(); });
    } else if (sh === 'mill') {                            // windmill tower + sails
      ctx.fillStyle = '#cdbb95'; ctx.beginPath(); ctx.moveTo(L, Y); ctx.lineTo(X - w * 0.2, TOP); ctx.lineTo(X + w * 0.2, TOP); ctx.lineTo(R, Y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.stroke();
      ctx.strokeStyle = '#5a4a32'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(X - S(8), TOP - S(8)); ctx.lineTo(X + S(8), TOP + S(8)); ctx.moveTo(X - S(8), TOP + S(8)); ctx.lineTo(X + S(8), TOP - S(8)); ctx.stroke();
    } else if (sh === 'greenhouse') {                      // glass house / vertical farm
      ctx.fillStyle = '#bfe3d0'; ctx.fillRect(L, TOP, w, h); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.strokeRect(L, TOP, w, h);
      ctx.strokeStyle = 'rgba(90,150,120,.6)'; ctx.lineWidth = 1;
      for (let gy = TOP + S(4); gy < Y; gy += S(5)) { ctx.beginPath(); ctx.moveTo(L, gy); ctx.lineTo(R, gy); ctx.stroke(); }
      ctx.fillStyle = 'rgba(120,200,150,.5)'; ctx.fillRect(L + 1, Y - S(4), w - 2, S(3));
    } else if (sh === 'dome') {                            // geodesic bio-dome
      ctx.fillStyle = '#a9d8c6'; ctx.beginPath(); ctx.arc(X, Y, w * 0.5, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.moveTo(X - w * 0.5, Y); ctx.lineTo(X + w * 0.5, Y); ctx.moveTo(X, Y); ctx.lineTo(X, Y - w * 0.5); ctx.moveTo(X - w * 0.35, Y - w * 0.35); ctx.lineTo(X + w * 0.35, Y - w * 0.35); ctx.stroke();
    } else if (sh === 'lumber') {                          // log cabin + log piles
      ctx.fillStyle = '#9a6b3f'; ctx.fillRect(L, TOP, w * 0.6, h); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.strokeRect(L, TOP, w * 0.6, h);
      ctx.fillStyle = '#6f4a28'; ctx.beginPath(); ctx.moveTo(L - 1, TOP); ctx.lineTo(L + w * 0.3, TOP - h * 0.5); ctx.lineTo(L + w * 0.6 + 1, TOP); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b07d4a'; for (let i = 0; i < 3; i++) ctx.fillRect(R - w * 0.34, Y - S(3) - i * S(3), w * 0.32, S(2.4));
    } else if (sh === 'workshop') {                        // craft hall + gear
      box('#b98b54');
      ctx.fillStyle = '#7a5a30'; ctx.beginPath(); ctx.moveTo(L - 1, TOP); ctx.lineTo(X, TOP - w * 0.32); ctx.lineTo(R + 1, TOP); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(40,30,18,.6)'; ctx.beginPath(); ctx.arc(X, Y - h * 0.5, Math.min(w, h) * 0.16, 0, 7); ctx.fill();
    } else if (sh === 'depot') {                           // transit platform + vehicle
      ctx.fillStyle = '#9a9388'; ctx.fillRect(L, Y - h * 0.4, w, h * 0.4);          // platform
      const vc = (eraIdx >= 4) ? '#5fb0c9' : '#7d5a3a';
      ctx.fillStyle = vc; roundRect(ctx, L + w * 0.08, TOP, w * 0.84, h * 0.7, S(3)); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.stroke();
      ctx.fillStyle = 'rgba(20,30,40,.5)'; for (let c = 0; c < 4; c++) ctx.fillRect(L + w * (0.16 + c * 0.2), TOP + h * 0.18, w * 0.1, h * 0.3);
    } else if (sh === 'launch') {                          // spaceport pad + rocket
      ctx.fillStyle = '#7a7d82'; ctx.fillRect(L, Y - h * 0.18, w, h * 0.18);
      ctx.fillStyle = '#e7e7ee'; ctx.fillRect(X - S(3), TOP + S(4), S(6), h - S(4));  // body
      ctx.fillStyle = '#c0533f'; ctx.beginPath(); ctx.moveTo(X - S(3), TOP + S(4)); ctx.lineTo(X, TOP - S(3)); ctx.lineTo(X + S(3), TOP + S(4)); ctx.closePath(); ctx.fill(); // nose
      ctx.fillStyle = '#b0b4ba'; ctx.beginPath(); ctx.moveTo(X - S(3), Y - S(2)); ctx.lineTo(X - S(7), Y); ctx.lineTo(X - S(3), Y - h * 0.3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(X + S(3), Y - S(2)); ctx.lineTo(X + S(7), Y); ctx.lineTo(X + S(3), Y - h * 0.3); ctx.closePath(); ctx.fill();
    } else if (sh === 'church') {
      box('#d3c7ab');
      ctx.fillStyle = '#9466b8'; ctx.beginPath(); ctx.moveTo(L - 1, TOP); ctx.lineTo(X, TOP - w * 0.4); ctx.lineTo(R + 1, TOP); ctx.closePath(); ctx.fill();
      const stx = L + w * 0.2;
      ctx.fillStyle = '#c9bd9f'; ctx.fillRect(stx - S(2), TOP - S(12), S(4), S(12));
      ctx.fillStyle = '#9466b8'; ctx.beginPath(); ctx.moveTo(stx - S(3), TOP - S(12)); ctx.lineTo(stx, TOP - S(18)); ctx.lineTo(stx + S(3), TOP - S(12)); ctx.closePath(); ctx.fill();
    } else if (sh === 'watch') {                           // stone watchtower + crenellations
      ctx.fillStyle = '#b9b2a2'; ctx.fillRect(L, TOP, w, h); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.strokeRect(L, TOP, w, h);
      ctx.fillStyle = '#9a937f'; for (let c = 0; c < 3; c++) ctx.fillRect(L + c * (w / 3), TOP - S(3), w / 3 - S(1.2), S(3));
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(X - S(1.5), Y - h * 0.5, S(3), h * 0.3);
    } else if (sh === 'theater') {                         // marquee
      box('#caa6c0');
      ctx.fillStyle = '#e6c84a'; ctx.fillRect(L, Y - h * 0.34, w, h * 0.2);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let c = 0; c < 5; c++) ctx.beginPath(), ctx.arc(L + w * (0.12 + c * 0.19), Y - h * 0.24, S(1), 0, 7), ctx.fill();
    } else if (sh === 'hospital') {
      box('#e8e8ee');
      ctx.fillStyle = '#d54b4b'; const cs = Math.min(w, h) * 0.26;
      ctx.fillRect(X - cs * 0.16, Y - h * 0.7, cs * 0.32, cs); ctx.fillRect(X - cs * 0.5, Y - h * 0.7 + cs * 0.34, cs, cs * 0.32);
    } else if (sh === 'study') {                           // scholarly hall + cupola
      box('#d3cab0');
      ctx.fillStyle = '#b6a981'; ctx.fillRect(L, TOP, w, S(2.5));
      ctx.fillStyle = '#8a6f9c'; ctx.beginPath(); ctx.arc(X, TOP, w * 0.16, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(20,40,60,.35)'; for (let c = 0; c < 3; c++) ctx.fillRect(L + w * (0.16 + c * 0.28), Y - h * 0.55, w * 0.14, h * 0.45);
    } else if (sh === 'lab') {                             // modern research, dome + antenna
      box('#cdd6e2');
      ctx.fillStyle = '#5fb0c9'; ctx.beginPath(); ctx.arc(X, TOP, w * 0.4, Math.PI, 0); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke();
      ctx.strokeStyle = '#888'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(R - S(3), TOP); ctx.lineTo(R - S(3), TOP - S(7)); ctx.stroke();
      ctx.fillStyle = '#d54b4b'; ctx.beginPath(); ctx.arc(R - S(3), TOP - S(7), S(1.4), 0, 7); ctx.fill();
    } else if (sh === 'plant') {                           // cooling towers
      [-1, 1].forEach((s) => {
        const cx = X + s * w * 0.22;
        ctx.fillStyle = '#aab0b6'; ctx.beginPath(); ctx.moveTo(cx - w * 0.16, Y); ctx.lineTo(cx - w * 0.1, TOP); ctx.lineTo(cx + w * 0.1, TOP); ctx.lineTo(cx + w * 0.16, Y); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(cx, TOP, w * 0.1, w * 0.04, 0, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(230,230,230,.5)'; ctx.beginPath(); ctx.arc(cx, TOP - S(4), S(3.2), 0, 7); ctx.fill();
      });
    } else { box('#b9ab93'); }
    ctx.restore();
  }
  const MAP_VERSION = 'v10';
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
  // Central old-town that grows outward: buildings are placed in build order on a
  // golden-angle spiral, so the earliest (oldest) sit at the core and newer ones ring
  // outward — organic, non-grid, and clearly a city radiating from its centre.
  function layoutTown(items, seed) {
    const r = rng(seed), placed = [], GAP = 4, GA = 2.399963;
    let avg = 0; items.forEach((it) => { avg += Math.max(it.spec.w, it.spec.d); });
    avg = avg / Math.max(1, items.length);
    const base = Math.max(8, avg * 0.6);
    const collide = (x, y, w, d) => {
      for (const p of placed) { if (Math.abs(x - p.x) < (w + p.w) / 2 + GAP && Math.abs(y - p.y) < (d + p.d) / 2 + GAP) return true; }
      return false;
    };
    for (let i = 0; i < items.length; i++) {
      const sp = items[i].spec, b = items[i].b;
      if (i === 0) { placed.push({ x: 0, y: 0, w: sp.w, d: sp.d, b }); continue; }
      const ang = i * GA + r() * 0.35;
      let rad = base * Math.sqrt(i + 0.5);
      let x = Math.cos(ang) * rad, y = Math.sin(ang) * rad, guard = 0;
      while (collide(x, y, sp.w, sp.d) && guard++ < 80) { rad += 2.5; x = Math.cos(ang) * rad; y = Math.sin(ang) * rad; }
      placed.push({ x, y, w: sp.w, d: sp.d, b });
    }
    return placed;
  }
  function renderMap() {
    const s = Engine.state; if (!s) return;
    const tiles = [];
    BUILDINGS.forEach((b) => { const n = s.buildings[b.id] || 0; for (let i = 0; i < n; i++) tiles.push(b); });
    const total = tiles.length;
    const types = Object.keys(s.buildings).filter((k) => s.buildings[k] > 0).length;
    const beds = (s.stats && s.stats.housing) || 0, homeless = Math.max(0, Math.round(s.res.population) - beds);
    const bedTag = homeless > 0
      ? ' · <span style="color:var(--bad)">⚠ ' + homeless + ' homeless</span>'
      : ' · <span style="color:var(--good)">🛏 ' + ((s.stats && s.stats.housingFree) || 0) + ' free</span>';
    $('map-head').innerHTML = '<b>' + s.settlement + '</b> · ' + ERAS[s.eraIndex].name +
      ' · ' + total + ' buildings · pop ' + Math.round(s.res.population) + bedTag +
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
