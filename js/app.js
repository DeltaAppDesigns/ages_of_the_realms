/* Bootstrap: wires the DOM, drives the game loop, registers the service worker. */
window.App = (function () {
  const $ = (id) => document.getElementById(id);
  let autoTimer = null;

  /* ---------- screens ---------- */
  function showGameScreen() {
    $('start-screen').classList.add('hidden');
    $('game-screen').classList.remove('hidden');
  }
  function startGame(checkEvent) {
    showGameScreen();
    UI.renderAll();
    Save.save(Engine.state);
    syncAutoLabel();
    if (checkEvent) {
      const ev = Engine.peekEvent();
      if (ev) UI.showEvent(ev);
    }
  }
  function newGame() {
    Engine.newGame();
    startGame(true);
  }
  function continueGame() {
    const s = Save.load();
    if (!s) { newGame(); return; }
    Engine.loadState(s);
    startGame(false);
    if (Engine.state.gameOver) UI.showGameOver();
  }
  function restart() {
    UI.hideEvent();
    if (Engine.state) Engine.state.auto = false;
    newGame();
  }

  /* ---------- actions ---------- */
  function afterAction() { UI.renderAll(); Save.save(Engine.state); }

  function build(id) {
    const r = Engine.build(id);
    if (r.ok) { UI.toast('Built ' + r.name); afterAction(); }
    else UI.toast(r.msg);
  }
  function research(id) {
    const r = Engine.research(id);
    if (r.ok) { UI.toast('Researched ' + r.name); afterAction(); }
    else UI.toast(r.msg);
  }
  function advance() {
    if (Engine.state.gameOver || UI.isEventOpen()) return;
    const r = Engine.advanceYear();
    afterAction();
    if (r.gameOver) { stopAuto(); UI.showGameOver(); }
    else if (r.event) UI.showEvent(r.event);
  }
  function chooseEvent(eventId, idx) {
    Engine.resolveEvent(eventId, idx);
    UI.hideEvent();
    afterAction();
    if (Engine.state.gameOver) { stopAuto(); UI.showGameOver(); }
  }

  /* ---------- auto-advance ---------- */
  function syncAutoLabel() { $('btn-auto').textContent = 'Auto: ' + (Engine.state.auto ? 'On' : 'Off'); }
  function toggleAuto() {
    Engine.state.auto = !Engine.state.auto;
    syncAutoLabel();
    UI.toast(Engine.state.auto ? 'Auto-advance on' : 'Auto-advance off');
  }
  function stopAuto() { if (Engine.state) { Engine.state.auto = false; syncAutoLabel(); } }
  function tick() {
    if (!Engine.state || Engine.state.gameOver || !Engine.state.auto) return;
    if (UI.isEventOpen()) return; // pause for the player's decision
    advance();
  }

  /* ---------- save sharing ---------- */
  function openMenu() { $('menu-status').textContent = ''; $('menu-overlay').classList.remove('hidden'); }
  function closeMenu() { $('menu-overlay').classList.add('hidden'); }
  function saveGame() { Save.save(Engine.state); $('menu-status').textContent = 'Game saved.'; UI.toast('Saved'); }
  function exportSave() {
    const code = Save.exportString(Engine.state);
    if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {});
    window.prompt('Your save code (copied — paste somewhere safe):', code);
    $('menu-status').textContent = 'Save code generated.';
  }
  function importSave() {
    const code = window.prompt('Paste a save code to load it:');
    if (!code) return;
    const s = Save.importString(code);
    if (!s || !s.res) { UI.toast('That code could not be read'); return; }
    Engine.loadState(s);
    Save.save(s);
    closeMenu();
    startGame(false);
    UI.toast('Save loaded');
  }

  /* ---------- wiring ---------- */
  function wire() {
    // start screen
    if (Save.hasSave()) $('btn-continue').classList.remove('hidden');
    $('btn-continue').addEventListener('click', continueGame);
    $('btn-new-game').addEventListener('click', () => {
      if (Save.hasSave() && !window.confirm('Start a new realm? Your current save will be replaced.')) return;
      newGame();
    });
    $('btn-import').addEventListener('click', importSave);

    // tabs
    document.querySelectorAll('.tab').forEach((t) =>
      t.addEventListener('click', () => UI.setTab(t.dataset.tab)));

    // control bar
    $('btn-advance').addEventListener('click', advance);
    $('btn-auto').addEventListener('click', toggleAuto);
    $('btn-menu').addEventListener('click', openMenu);

    // menu
    $('btn-save').addEventListener('click', saveGame);
    $('btn-export').addEventListener('click', exportSave);
    $('btn-import-2').addEventListener('click', importSave);
    $('btn-restart').addEventListener('click', () => {
      if (window.confirm('Abandon this realm and start over?')) { closeMenu(); restart(); }
    });
    $('btn-close-menu').addEventListener('click', closeMenu);

    // loop
    autoTimer = setInterval(tick, 1600);
  }

  function registerSW() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch(() => {});
      });
    }
  }

  function init() { wire(); registerSW(); }

  document.addEventListener('DOMContentLoaded', init);

  return { newGame, continueGame, restart, build, research, advance, chooseEvent, toggleAuto, importSave };
})();
