/**
 * Seeded mulberry32 pseudo-random number generator.
 * Returns deterministic helpers for floats, integers, picks, and shuffles.
 */
export function makeRng(seed = 1) {
  let state = seed >>> 0;

  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function int(n) {
    if (n <= 0) return 0;
    return Math.floor(next() * n);
  }

  function pick(arr) {
    if (!arr || arr.length === 0) return undefined;
    return arr[int(arr.length)];
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = int(i + 1);
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  return { next, int, pick, shuffle };
}
