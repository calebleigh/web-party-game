import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { GAMES } from "./games/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(join(__dirname, "public")));
app.get("/play", (_req, res) => res.sendFile(join(__dirname, "public", "play.html")));

/* ------------------------------------------------------------------ *
 *  Room + player state
 * ------------------------------------------------------------------ */

/** @type {Map<string, Room>} */
const rooms = new Map();

const HOST_GRACE_MS = 120_000; // keep a room alive this long after the host disconnects
const VIP_GRACE_MS = 15_000; // hand VIP to someone else if the VIP is gone this long

const AVATAR_COLORS = [
  "#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF7AC6",
  "#B983FF", "#FF9F45", "#42C2FF", "#F45B69", "#3DDC97",
];

function makeCode() {
  // Unambiguous letters only (no O/0, I/1) — easy to read off a screen.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = Array.from({ length: 4 }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join("");
  } while (rooms.has(code));
  return code;
}

class Room {
  constructor(code, hostSocketId) {
    this.code = code;
    this.hostSocketId = hostSocketId;
    this.hostId = null; // persistent host identity so a refresh resumes this room
    this.hostGraceTimer = null; // grace before tearing down after host disconnects
    this.vipId = null; // controlling player (first to join) — drives the big screen
    this.votes = {}; // playerId -> gameId (lobby game voting)
    this.vipGraceTimer = null; // grace before handing VIP to someone else
    /** @type {Map<string, Player>} keyed by persistent playerId */
    this.players = new Map();
    this.phase = "lobby"; // lobby | hub | game
    this.hubGameId = null; // game being configured in the hub
    this.config = {}; // chosen options for the hub game
    this.gameId = null;
    this.game = null; // active game controller
    this.timers = new Set();
  }

  get playerList() {
    return [...this.players.values()];
  }

  activePlayers() {
    // Pending players (joined mid-game on a non-drop-in game) wait it out.
    return this.playerList.filter((p) => p.connected && !p.pending);
  }

  clearPending() {
    for (const p of this.players.values()) p.pending = false;
  }

  /** First connected player controls the big screen; hands off if they leave. */
  assignVip() {
    const cur = this.vipId && this.players.get(this.vipId);
    if (cur && cur.connected && !cur.pending) return;
    const next = this.playerList.find((p) => p.connected && !p.pending);
    this.vipId = next ? next.id : null;
  }

  vote(playerId, gameId) {
    if (this.phase !== "lobby") return;
    if (!GAMES.some((g) => g.id === gameId)) return;
    this.votes[playerId] = gameId;
  }

  clearVotes() { this.votes = {}; }

  voteTally() {
    const t = {};
    for (const [pid, gid] of Object.entries(this.votes)) {
      if (this.players.has(pid)) t[gid] = (t[gid] || 0) + 1;
    }
    return t;
  }

  addPlayer(playerId, name, socketId, color) {
    const chosen = AVATAR_COLORS.includes(color)
      ? color
      : AVATAR_COLORS[this.players.size % AVATAR_COLORS.length];
    const player = {
      id: playerId,
      name,
      color: chosen,
      socketId,
      connected: true,
      score: 0,
    };
    this.players.set(playerId, player);
    return player;
  }

  setTimer(fn, ms) {
    const t = setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
    return t;
  }

  clearTimers() {
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
  }

  /** Push fresh state to the host screen and every connected phone. */
  sync() {
    io.to(this.hostSocketId).emit("host:state", this.hostState());
    for (const p of this.players.values()) {
      if (p.connected && p.socketId) {
        io.to(p.socketId).emit("player:state", this.playerState(p.id));
      }
    }
  }

  /** Update only the big screen — used for per-second countdowns so phones
   *  aren't re-rendered (and don't lose what a player is typing). */
  syncHost() {
    io.to(this.hostSocketId).emit("host:state", this.hostState());
  }

  hostState() {
    const base = {
      code: this.code,
      phase: this.phase,
      players: this.playerList.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        score: p.score,
        connected: p.connected,
      })),
      games: GAMES.map((g) => ({
        id: g.id,
        name: g.name,
        emoji: g.emoji,
        blurb: g.blurb,
        minPlayers: g.minPlayers,
      })),
      vipId: this.vipId,
      vipName: (this.vipId && this.players.get(this.vipId)?.name) || null,
      votes: this.voteTally(),
    };
    if (this.phase === "hub" && this.hubGameId) {
      const def = GAMES.find((g) => g.id === this.hubGameId);
      if (def) {
        base.hub = {
          gameId: def.id,
          name: def.name,
          blurb: def.blurb,
          minPlayers: def.minPlayers,
          howTo: def.howTo || [],
          options: def.options || [],
          config: this.config,
          canStart: this.activePlayers().length >= def.minPlayers,
        };
      }
    }
    if (this.phase === "game" && this.game) {
      base.gameId = this.gameId;
      base.gameName = this.game.def.name;
      base.gameEmoji = this.game.def.emoji;
      base.game = this.game.hostView();
    }
    return base;
  }

  playerState(playerId) {
    const player = this.players.get(playerId);
    if (!player) return { phase: "kicked" };
    if (player.pending) {
      return {
        phase: "waiting",
        code: this.code,
        gameName: this.game ? this.game.def.name : "",
        me: { id: player.id, name: player.name, color: player.color, score: player.score },
      };
    }
    const isVip = playerId === this.vipId;
    const base = {
      phase: this.phase,
      code: this.code,
      me: {
        id: player.id,
        name: player.name,
        color: player.color,
        score: player.score,
      },
      isVip,
      vipName: (this.vipId && this.players.get(this.vipId)?.name) || null,
    };
    if (this.phase === "lobby") {
      base.games = GAMES.map((g) => ({ id: g.id, name: g.name, blurb: g.blurb, minPlayers: g.minPlayers }));
      base.votes = this.voteTally();
      base.myVote = this.votes[playerId] || null;
      base.playerCount = this.activePlayers().length;
    }
    if (this.phase === "hub" && this.hubGameId) {
      const def = GAMES.find((g) => g.id === this.hubGameId);
      base.hub = { gameId: this.hubGameId, name: def ? def.name : "", howTo: def ? def.howTo || [] : [] };
      if (isVip && def) {
        base.hub.options = def.options || [];
        base.hub.config = this.config;
        base.hub.minPlayers = def.minPlayers;
        base.hub.canStart = this.activePlayers().length >= def.minPlayers;
      }
    }
    if (this.phase === "game" && this.game) {
      base.gameId = this.gameId;
      base.gameName = this.game.def.name;
      base.game = this.game.playerView(playerId);
    }
    return base;
  }

  openHub(gameId) {
    const def = GAMES.find((g) => g.id === gameId);
    if (!def) return;
    this.clearTimers();
    this.clearVotes();
    this.phase = "hub";
    this.hubGameId = gameId;
    this.config = {};
    for (const o of def.options || []) this.config[o.key] = o.default;
    this.game = null;
    this.sync();
  }

  setConfig(patch) {
    if (this.phase !== "hub" || !patch) return;
    this.config = { ...this.config, ...patch };
    this.sync();
  }

  backToLobby() {
    this.clearTimers();
    this.clearPending();
    this.clearVotes();
    this.phase = "lobby";
    this.hubGameId = null;
    this.gameId = null;
    this.game = null;
    this.sync();
  }

  startGame(gameId, config) {
    const def = GAMES.find((g) => g.id === gameId);
    if (!def) return;
    this.clearTimers();
    this.gameId = gameId;
    this.phase = "game";
    this.game = new GameController(this, def, config || {});
    this.game.start();
    this.sync();
  }

  endGame() {
    this.clearTimers();
    this.clearPending();
    this.clearVotes();
    this.phase = "lobby";
    this.hubGameId = null;
    this.gameId = null;
    this.game = null;
    this.sync();
  }
}

/* ------------------------------------------------------------------ *
 *  Game controller — the sandbox every game module runs inside.
 *  A game definition is a plain object with lifecycle hooks; the
 *  controller gives it a tidy `ctx` of helpers so games never touch
 *  sockets directly.
 * ------------------------------------------------------------------ */

class GameController {
  constructor(room, def, config = {}) {
    this.room = room;
    this.def = def;
    this.config = config;
    this.state = {};
    // Snapshot every player's session score at kickoff so we can report the
    // points earned IN THIS PLAY (delta) separately from the running session total.
    this.startScores = new Map();
    for (const [id, p] of room.players) this.startScores.set(id, p.score);
    this.ctx = {
      players: () => room.activePlayers(),
      player: (id) => room.players.get(id),
      award: (id, points) => {
        const p = room.players.get(id);
        if (p) p.score += points;
      },
      setScore: (id, points) => {
        const p = room.players.get(id);
        if (p) p.score = points;
      },
      // Points a player has earned during THIS game only (score − snapshot).
      // Falls back to the current score as the baseline for anyone who joined
      // after kickoff, so they read 0 rather than their whole session total.
      gameScore: (id) => {
        const p = room.players.get(id);
        if (!p) return 0;
        const base = this.startScores.has(id) ? this.startScores.get(id) : p.score;
        return p.score - base;
      },
      // Active players ranked by this-game points — same shape as util.leaderboard,
      // but `score` is the per-play delta rather than the session total.
      gameLeaderboard: () => room.activePlayers()
        .map((p) => ({ id: p.id, name: p.name, color: p.color, score: this.ctx.gameScore(p.id) }))
        .sort((a, b) => b.score - a.score),
      // Competition rank for a player by this-game score: tied players share a
      // rank (two firsts -> both rank 1, next is rank 3). `tied` is true when at
      // least one other active player has the same score.
      gameRank: (id) => {
        const actives = room.activePlayers();
        const mine = this.ctx.gameScore(id);
        const higher = actives.filter((p) => this.ctx.gameScore(p.id) > mine).length;
        const same = actives.filter((p) => this.ctx.gameScore(p.id) === mine).length;
        return { rank: higher + 1, total: actives.length, tied: same > 1 };
      },
      after: (ms, fn) => room.setTimer(fn, ms),
      sync: () => room.sync(),
      syncHost: () => room.syncHost(),
      finish: () => this.finish(),
      now: () => Date.now(),
      // Lightweight relay to host + all phones WITHOUT a full re-render
      // (used for live drawing in Doodle Dash).
      broadcast: (event, data) => {
        io.to(room.hostSocketId).emit(event, data);
        for (const p of room.players.values()) {
          if (p.connected && p.socketId) io.to(p.socketId).emit(event, data);
        }
      },
      emitTo: (id, event, data) => {
        const p = room.players.get(id);
        if (p && p.connected && p.socketId) io.to(p.socketId).emit(event, data);
      },
    };
  }

  start() {
    this.def.start(this.state, this.ctx, this.config);
  }

  hostView() {
    return this.def.hostView(this.state, this.ctx);
  }

  playerView(playerId) {
    return this.def.playerView(this.state, playerId, this.ctx);
  }

  action(playerId, action) {
    if (this.def.onAction) this.def.onAction(this.state, playerId, action, this.ctx);
  }

  finish() {
    // Return to lobby but keep scores visible in a results screen first.
    this.state.finished = true;
    this.room.sync();
  }
}

/* ------------------------------------------------------------------ *
 *  Socket wiring
 * ------------------------------------------------------------------ */

function findRoomByCode(code) {
  return rooms.get((code || "").toUpperCase());
}

io.on("connection", (socket) => {
  // ----- HOST (the big screen) -----
  socket.on("host:hello", ({ hostId, code } = {}) => {
    // Resume the same room on a refresh/reconnect if the host identity matches.
    let room = code ? rooms.get((code || "").toUpperCase()) : null;
    if (room && room.hostId && room.hostId === hostId) {
      room.hostSocketId = socket.id;
      if (room.hostGraceTimer) { clearTimeout(room.hostGraceTimer); room.hostGraceTimer = null; }
      socket.data.role = "host";
      socket.data.roomCode = room.code;
      socket.join(room.code);
      socket.emit("host:welcome", { code: room.code, hostId: room.hostId });
      room.sync();
      return;
    }
    // Otherwise start a fresh room (reusing the browser's host id if it has one).
    const newCode = makeCode();
    const hid = hostId || `h_${Math.random().toString(36).slice(2, 12)}`;
    room = new Room(newCode, socket.id);
    room.hostId = hid;
    rooms.set(newCode, room);
    socket.data.role = "host";
    socket.data.roomCode = newCode;
    socket.join(newCode);
    socket.emit("host:welcome", { code: newCode, hostId: hid });
    room.sync();
  });

  socket.on("host:openHub", ({ gameId }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || socket.id !== room.hostSocketId) return;
    room.openHub(gameId);
  });

  socket.on("host:setConfig", ({ config }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || socket.id !== room.hostSocketId) return;
    room.setConfig(config);
  });

  socket.on("host:startGame", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || socket.id !== room.hostSocketId) return;
    if (room.phase !== "hub" || !room.hubGameId) return;
    const def = GAMES.find((g) => g.id === room.hubGameId);
    if (def && room.activePlayers().length < def.minPlayers) return;
    room.startGame(room.hubGameId, room.config);
  });

  socket.on("host:backToLobby", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || socket.id !== room.hostSocketId) return;
    room.backToLobby();
  });

  socket.on("host:endGame", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || socket.id !== room.hostSocketId) return;
    room.endGame();
  });

  socket.on("host:kick", ({ playerId }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || socket.id !== room.hostSocketId) return;
    const p = room.players.get(playerId);
    if (p && p.socketId) io.to(p.socketId).emit("player:state", { phase: "kicked" });
    room.players.delete(playerId);
    room.assignVip();
    room.sync();
  });

  // ----- VIP: a player controlling the big screen from their phone -----
  const isVip = (room) => room && socket.data.playerId && socket.data.playerId === room.vipId;

  socket.on("player:vote", ({ gameId }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !socket.data.playerId) return;
    room.vote(socket.data.playerId, gameId);
    room.sync();
  });

  socket.on("player:openHub", ({ gameId }) => {
    const room = rooms.get(socket.data.roomCode);
    if (isVip(room)) room.openHub(gameId);
  });

  socket.on("player:setConfig", ({ config }) => {
    const room = rooms.get(socket.data.roomCode);
    if (isVip(room)) room.setConfig(config);
  });

  socket.on("player:startGame", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!isVip(room) || room.phase !== "hub" || !room.hubGameId) return;
    const def = GAMES.find((g) => g.id === room.hubGameId);
    if (def && room.activePlayers().length < def.minPlayers) return;
    room.startGame(room.hubGameId, room.config);
  });

  socket.on("player:backToLobby", () => {
    const room = rooms.get(socket.data.roomCode);
    if (isVip(room)) room.backToLobby();
  });

  socket.on("player:endGame", () => {
    const room = rooms.get(socket.data.roomCode);
    if (isVip(room)) room.endGame();
  });

  // ----- PLAYER (a phone) -----
  socket.on("player:join", ({ code, name, playerId, color }) => {
    const room = findRoomByCode(code);
    if (!room) {
      socket.emit("player:error", { message: "No game found with that code." });
      return;
    }
    name = (name || "").trim().slice(0, 16);
    if (!name) {
      socket.emit("player:error", { message: "Please enter a name." });
      return;
    }

    let player = playerId && room.players.get(playerId);
    if (player) {
      // Reconnect / rename / recolor.
      player.socketId = socket.id;
      player.connected = true;
      player.name = name;
      if (AVATAR_COLORS.includes(color)) player.color = color;
    } else {
      if (room.playerList.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
        socket.emit("player:error", { message: "That name is taken — try another." });
        return;
      }
      const id = playerId || `p_${Math.random().toString(36).slice(2, 10)}`;
      player = room.addPlayer(id, name, socket.id, color);
      // Joining while a non-drop-in game is running? Wait for it to finish.
      if (room.phase === "game" && !(room.game && room.game.def.joinMidGame)) {
        player.pending = true;
      }
    }

    // VIP handling: keep the returning VIP; otherwise assign the first player.
    if (room.vipGraceTimer && player.id === room.vipId) {
      clearTimeout(room.vipGraceTimer);
      room.vipGraceTimer = null;
    }
    room.assignVip();

    socket.data.role = "player";
    socket.data.roomCode = room.code;
    socket.data.playerId = player.id;
    socket.join(room.code);
    socket.emit("player:joined", { playerId: player.id, code: room.code });
    room.sync();
  });

  socket.on("player:action", (action) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !room.game) return;
    room.game.action(socket.data.playerId, action || {});
  });

  // ----- DISCONNECT -----
  socket.on("disconnect", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;

    if (socket.data.role === "host" && socket.id === room.hostSocketId) {
      // Host connection dropped — keep the room (and game) alive for a grace
      // window so a refresh/blip can resume. Tear down only if it never returns.
      if (room.hostGraceTimer) clearTimeout(room.hostGraceTimer);
      room.hostGraceTimer = setTimeout(() => {
        room.clearTimers();
        for (const p of room.players.values()) {
          if (p.socketId) io.to(p.socketId).emit("player:state", { phase: "closed" });
        }
        rooms.delete(room.code);
      }, HOST_GRACE_MS);
      return;
    }

    if (socket.data.role === "player") {
      const p = room.players.get(socket.data.playerId);
      // Only mark offline if this is still their current socket. On a refresh the
      // new socket may reconnect before this fires — don't clobber that.
      if (p && p.socketId === socket.id) {
        p.connected = false;
        p.socketId = null;
        // If the VIP dropped, hand off after a short grace (survives a refresh).
        if (p.id === room.vipId) {
          if (room.vipGraceTimer) clearTimeout(room.vipGraceTimer);
          room.vipGraceTimer = setTimeout(() => {
            room.vipGraceTimer = null;
            room.assignVip();
            room.sync();
          }, VIP_GRACE_MS);
        }
        room.sync();
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`\n  🎉  Shindig! running!`);
  console.log(`  📺  Main screen:  http://localhost:${PORT}`);
  console.log(`  📱  Players join: http://localhost:${PORT}/play\n`);
});
