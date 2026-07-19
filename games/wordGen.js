/* Word Hunt puzzle generator — turns a common-words dictionary into an
 * effectively unlimited supply of "letter bank + findable words" puzzles, so a
 * long session almost never repeats a board.
 *
 * A puzzle is the same shape the curated PUZZLES use: { letters, words }, where
 * every word is spellable from `letters`. Only these listed words score in-game,
 * so the generator just needs to pick a good bank word and a varied set of the
 * common words hiding inside it. If the word list is missing, generatorReady()
 * returns false and wordWaterfall falls back to its curated puzzles. */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { shuffle, pick } from "./util.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DICT = new Set();                     // every valid word (length >= 3)
const BANKS = { easy: [], medium: [], hard: [] };

function letterCounts(word) {
  const c = {};
  for (const ch of word) c[ch] = (c[ch] || 0) + 1;
  return c;
}

function canSpell(word, bankC) {
  const need = {};
  for (const ch of word) {
    need[ch] = (need[ch] || 0) + 1;
    if (need[ch] > (bankC[ch] || 0)) return false;
  }
  return true;
}

/** All dictionary words (length 3..bank.length) that fit inside `bank`. */
function subWords(bank) {
  const bankC = letterCounts(bank);
  const out = [];
  for (const w of DICT) {
    if (w.length < 3 || w.length > bank.length || w === bank) continue;
    if (canSpell(w, bankC)) out.push(w);
  }
  return out;
}

try {
  const raw = readFileSync(join(__dirname, "data", "common-words.txt"), "utf8");
  const words = raw.split(/\r?\n/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => /^[a-z]+$/.test(w) && w.length >= 3);
  for (const w of words) DICT.add(w);
  for (const w of words) {
    const n = w.length;
    if (n === 4) BANKS.easy.push(w);
    if (n === 6 || n === 7) BANKS.medium.push(w);
    if (n === 7 || n === 8) BANKS.hard.push(w);
  }
  // 4-letter banks are the hardest to fill (few sub-words), so pre-filter easy
  // to banks that actually hide >= 5 shorter words. Cheap: ~1100 banks x dict.
  BANKS.easy = BANKS.easy.filter((b) => subWords(b).length >= 5);
} catch (_) {
  // No dictionary bundled — generator stays disabled; caller uses curated pool.
}

/** Choose the full bank word plus a length-varied spread of its sub-words. */
function chooseTargets(bank, subs, n) {
  const picks = new Set([bank]);
  const byLen = {};
  for (const w of subs) (byLen[w.length] = byLen[w.length] || []).push(w);
  const pools = Object.keys(byLen).sort((a, b) => a - b).map((l) => shuffle(byLen[l]));
  let i = 0;
  while (picks.size < n && pools.some((p) => p.length)) {
    const p = pools[i % pools.length];
    if (p.length) picks.add(p.pop());
    i++;
  }
  return [...picks];
}

/**
 * Generate a fresh puzzle for a difficulty. Returns { letters, words } (all
 * uppercase) or null if it couldn't build one (missing dict / unlucky banks).
 */
export function generatePuzzle(difficulty, { words = 7, minWords = 6, tries = 60 } = {}) {
  const banks = BANKS[difficulty] || BANKS.medium;
  if (!banks.length) return null;
  const floor = difficulty === "easy" ? 5 : minWords;
  for (let t = 0; t < tries; t++) {
    const bank = pick(banks);
    const subs = subWords(bank);
    if (subs.length + 1 < floor) continue;                 // +1 for the bank word itself
    const targets = chooseTargets(bank, subs, Math.min(words, subs.length + 1));
    if (targets.length < floor) continue;
    return { letters: bank.toUpperCase(), words: targets.map((w) => w.toUpperCase()) };
  }
  return null;
}

/** A single bank word for Quickdraw mode (a one-word anagram race). */
export function generateQuickWord(difficulty) {
  const banks = BANKS[difficulty] || BANKS.medium;
  const src = banks.length ? banks : [...DICT].filter((w) => w.length >= 4 && w.length <= 6);
  return src.length ? pick(src).toUpperCase() : null;
}

export function generatorReady() {
  return DICT.size > 0 && BANKS.easy.length > 0 && BANKS.medium.length > 0;
}
