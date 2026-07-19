export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

export function normalize(s) {
  return (s || "").toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function leaderboard(players) {
  return [...players]
    .sort((a, b) => b.score - a.score)
    .map((p) => ({ id: p.id, name: p.name, color: p.color, score: p.score }));
}

/* Shared "get ready" beat: 3 · 2 · 1 · GO on a real `countin` screen, then onDone.
 * Clients render the "countin" screen generically, so every game looks the same. */
export function countIn(state, ctx, onDone) {
  state.screen = "countin";
  state.countin = 3;
  ctx.sync();
  ctx.after(1000, () => { if (state.screen === "countin") { state.countin = 2; ctx.sync(); } });
  ctx.after(2000, () => { if (state.screen === "countin") { state.countin = 1; ctx.sync(); } });
  ctx.after(3000, () => { if (state.screen === "countin") { state.countin = "GO"; ctx.sync(); } });
  ctx.after(3600, () => { if (state.screen === "countin") onDone(); });
}

/* Shared "TIME'S UP!" beat shown when a displayed countdown actually hits zero,
 * before moving on to the reveal/result. `label` lets a game tweak the wording. */
export function timesUp(state, ctx, onDone, { ms = 1700, label = "TIME'S UP!" } = {}) {
  state.screen = "timesup";
  state.timesUpLabel = label;
  ctx.sync();
  ctx.after(ms, () => { if (state.screen === "timesup") onDone(); });
}
