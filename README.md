# 🛋️ Couch Clash

A bright, friendly, Jackbox-style party game platform. One **main screen** shows the
game; everyone else joins from their **phones** with a 4-letter room code — just like
Words on Stream.

## Run it

```bash
npm install
npm start
```

Then:

- 📺 **Main screen** (TV / laptop / projector): open **http://localhost:3000**
- 📱 **Players**: open **http://localhost:3000/play** on each phone and enter the room code.

> Phones need to be on the **same network** as the main screen. To play on real phones,
> replace `localhost` with your computer's local IP (e.g. `http://192.168.1.20:3000/play`).

## The 5 games

| Game | Emoji | How it plays |
|------|-------|--------------|
| **Word Hunt** | 🔤 | Everyone races to spell hidden words from a shared letter pool (collaborative, timed). |
| **Trivia Rush** | 🧠 | Multiple-choice trivia — the faster you answer correctly, the more points. |
| **Liar Liar** | 🤥 | Write a convincing fake answer, then spot the real one among everyone's lies. |
| **Prompt Party** | 🎤 | Answer silly prompts, then vote for the funniest response. |
| **Quick Draw** | ⚡ | Fast-reaction minigames — tap green, hit the color, solve the math. Fastest wins. |
| **Herd Mentality** | 🐑 | Answer the question — but match the majority to score. |
| **Doodle Dash** | ✏️ | One player draws a secret word; everyone races to guess it. |

## How it's built

- **`server.js`** — Express + Socket.IO. Manages rooms, players, reconnection, and runs
  each game authoritatively (all scoring & timers live on the server).
- **`games/`** — one module per game. Each exports lifecycle hooks (`start`, `onAction`,
  `hostView`, `playerView`) and runs inside a small sandbox (`GameController`) so games
  never touch sockets directly. **Add a new game** by dropping a module in `games/` and
  listing it in `games/index.js` — the lobby, the router, and scoring pick it up.
- **`public/`** — no build step. `index.html` + `host.js` render the big screen;
  `play.html` + `player.js` render the phone controller; `style.css` is the shared
  "bright & friendly" design system.

## Adding a game

Create `games/myGame.js`:

```js
export default {
  id: "myGame",
  name: "My Game",
  emoji: "🎲",
  blurb: "One-line description shown on the lobby card.",
  minPlayers: 1,
  start(state, ctx) { /* set up state; use ctx.after(ms, fn) for timers */ },
  onAction(state, playerId, action, ctx) { /* handle a phone action */ },
  hostView(state, ctx) { return { screen: "..." }; },   // data for the big screen
  playerView(state, playerId, ctx) { return { screen: "..." }; }, // per-phone data
};
```

Then add it to `games/index.js`, and add a `case "myGame"` render branch in
`public/host.js` and `public/player.js`.

`ctx` helpers: `players()`, `player(id)`, `award(id, pts)`, `setScore(id, pts)`,
`after(ms, fn)`, `sync()`, `now()`.
