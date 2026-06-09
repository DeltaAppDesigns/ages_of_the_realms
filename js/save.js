/* build 2026-06-08b */
/* Persistence via localStorage. State is plain serializable data. */
window.Save = (function () {
  const KEY = 'aotr_save_v1';

  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }
  }
  function load() {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  }
  function hasSave() { return !!localStorage.getItem(KEY); }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) {} }
  function exportString(state) {
    try { return btoa(unescape(encodeURIComponent(JSON.stringify(state)))); }
    catch (e) { return JSON.stringify(state); }
  }
  function importString(str) {
    if (!str) return null;
    const txt = str.trim();
    try { return JSON.parse(decodeURIComponent(escape(atob(txt)))); }
    catch (e) {
      try { return JSON.parse(txt); } catch (e2) { return null; }
    }
  }

  return { save, load, hasSave, clear, exportString, importString };
})();
