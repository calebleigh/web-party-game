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

// The source dictionary (google-10000 ∩ ENABLE) still contains junk 3-letter
// entries — names (ben, mae), abbreviations (dev, rec, mil), Greek letters
// (phi, psi, chi), and obscure/archaic words (asp, gnu, thy, wan, eau). Short
// words dominate easy boards, so restrict 3-letter answers to this hand-checked
// list of genuinely common words. (4+ letter words are left as-is.)
const COMMON3 = new Set(("abs ace act add ads age ago aid aim air all amp and ant any apt arc are arm art ash " +
  "ask ate bad bag ban bar bat bay bed bee bet bid big bin bio bit bob bow box boy bra bug bus but buy bye cab " +
  "can cap car cat cod con cop cow cry cup cut dad dam day den did die dig dim dip doc dog don dot dry due duo " +
  "ear eat egg end era eve eye fan far fat fax fed fee few fig fin fit fix flu fly fog for fox fun fur gap gas " +
  "gay gel gem get gig got gun guy gym had ham has hat hay her hey him hip his hit hop hot how hub ice ill ink " +
  "inn ion its jam jar jaw jay jet job jog joy key kid kit lab lap law lay leg let lid lie lip lit log lot low " +
  "mad man map mat may men met mix mob mod mom mud mug nap net new nod nor not now nut oak odd off oil old one " +
  "opt our out own pad pal pan par pat paw pay pea pen pet pic pie pig pin pit pod pop pot pro pub put ram ran " +
  "rap rat raw ray red ref rep rev rib rid rim rip rob rod row rug rub run sad sap sat saw say sea sec see set " +
  "she sin sip sir sit six ski sky son spa spy sub sue sum sun tab tag tan tap tar tax tea tee ten the tie tin " +
  "tip toe ton too top toy try tub two use van vat vet via war was wax way web wed wet who why wig win wit won " +
  "wow yen yes yet you zip zoo").split(" "));

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
    .filter((w) => /^[a-z]+$/.test(w) && w.length >= 3)
    .filter((w) => w.length !== 3 || COMMON3.has(w)); // drop junk 3-letter words
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
