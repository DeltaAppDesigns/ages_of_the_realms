<!-- build 2026-06-08e -->
# Ages of the Realm

A text-based, story-driven **city builder** that evolves through history — from a medieval hamlet all the way to a star-faring metropolis. It runs entirely in your browser, **works fully offline**, and installs on your iPhone home screen like a real app. No App Store, no Mac, no build tools.

---

## Play it

Open `index.html` in any modern browser, or play the hosted version once you publish it (see below). Lead a single settlement across **six ages**:

**Medieval → Renaissance → Industrial → Modern → Information → Space**

### How it works
- **Advance Year** runs one turn: buildings produce and consume resources, your population grows or shrinks, and a story event may appear.
- **Six resources:** 🌾 Food, 🪙 Coin, 🪵 Materials, 👤 People, 😊 Mood, 📜 Knowledge. Keep timber and coin flowing — lumber camps and markets feed each other, so don't let either hit zero.
- **Build** farms, homes, markets, workshops, factories, data centers, spaceports and more — 38 buildings across the ages. Each needs workers (jobs) and many provide housing. People need food and a roof, or your city starves and empties.
- **Map tab** shows a top-down view of your city that fills in with every building you place, and recolors as you reach each new age.
- **Research** spends Knowledge to unlock new buildings and bonuses (34 technologies). Certain "key" techs plus a population threshold are required to enter the next age.
- **Story events** present choices with real consequences — welcome a wanderer, fight off raiders, weather a plague, hand the city to an AI, launch to the colonies. Your choices ripple through the chronicle.
- **Auto** toggles automatic year-by-year advancement; it pauses whenever a decision needs you.
- The game **auto-saves** every turn to your device. **Menu → Export** gives you a code you can paste back later or on another device.

### Goal
Carry your realm across all six ages and reach the **Space Age**, then build the greatest star city you can. Lose if your people ever fall to zero.

---

## Publish it on GitHub (free, ~3 minutes)

1. Create a new repository on GitHub (e.g. `ages-of-the-realm`).
2. Upload **all the files in this folder** to the repo (keep the folder structure — `index.html` must be at the top level of what you upload).
3. In the repo, go to **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Pick branch **`main`** and folder **`/ (root)`**, then **Save**.
6. Wait ~1 minute. GitHub gives you a URL like:
   `https://YOUR-USERNAME.github.io/ages-of-the-realm/`

That URL is your live game. (The included `.nojekyll` file tells GitHub Pages to serve everything as-is.)

---

## Install it on your iPhone

1. Open the GitHub Pages URL in **Safari** on your iPhone.
2. Tap the **Share** button (the square with an up-arrow).
3. Scroll down and tap **Add to Home Screen**.
4. Name it (e.g. "Realm") and tap **Add**.

It now lives on your home screen as a full-screen app. **Open it once while online** so it can cache itself — after that it **plays with no signal**, on a plane, anywhere. Your saves stay on the device.

> Tip: To get an updated version later, re-open it online once; the app refreshes its cache automatically.

---

## Make it your own

The game is plain HTML/CSS/JavaScript with **no dependencies and no build step**. All the content lives in small data files you can edit:

| File | What's inside |
|------|---------------|
| `js/data/buildings.js` | Every building: cost, jobs, housing, production, mood |
| `js/data/tech.js` | The research tree and its bonuses |
| `js/data/events.js` | Story & crisis events and their choices |
| `js/data/eras.js` | The four ages and what's required to advance |
| `js/data/resources.js` | Resources and core balance numbers (growth, taxes, food) |

Add a building or a story event by copying an existing entry and changing the values — then refresh. The game engine (`js/engine.js`), display (`js/ui.js`), and wiring (`js/app.js`) pick it up automatically.

### File layout
```
index.html              App shell + PWA tags
manifest.webmanifest    Home-screen app metadata
service-worker.js       Offline caching
css/styles.css          Styles (theme shifts each era)
js/engine.js            Game rules & simulation
js/ui.js                Rendering
js/app.js               Bootstrap & game loop
js/save.js              Save / load / export
js/data/*.js            All game content
icons/                  App icons
```

---

*Built to run anywhere, even off the grid. Have fun building your realm.*
