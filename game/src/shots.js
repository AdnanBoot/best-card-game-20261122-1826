import { CARDS } from './cards.js';
import { createDuel, playCard, endPlayerTurn, damage } from './duel.js';

// Keep imports referenced for deterministic scene verification.
void CARDS;
void damage;

const MAX_SIM_TURNS = 40;

/**
 * Find two hand indices of the same house whose combined cost fits within `maxTotalCost`.
 */
function findSameHousePair(hand, maxTotalCost) {
  for (let i = 0; i < hand.length; i++) {
    for (let j = i + 1; j < hand.length; j++) {
      if (hand[i].house === hand[j].house && hand[i].cost + hand[j].cost <= maxTotalCost) {
        return [i, j];
      }
    }
  }
  return null;
}

/**
 * Build a deterministic mid-duel table scene via real engine calls.
 */
function buildTableScene(seed) {
  const state = createDuel(seed);
  let lastPlayed = null;

  // Turn 1: play at most one cheap card if needed, then end turn so Vex acts and HP/intent update
  const cheapIdx = state.player.hand.findIndex((c) => c.cost <= 1);
  if (cheapIdx !== -1 && state.player.hand.length > 4) {
    lastPlayed = state.player.hand[cheapIdx];
    playCard(state, cheapIdx);
  }
  endPlayerTurn(state);

  if (state.phase !== 'over') {
    // Turn 2: try to play a same-house pair leaving at least 1 energy, else any affordable pair
    const hand = state.player.hand;
    const pair =
      findSameHousePair(hand, state.player.energy - 1) ??
      findSameHousePair(hand, state.player.energy);

    if (pair) {
      const [firstIdx, secondIdx] = pair;
      const firstCard = hand[firstIdx];
      const secondCard = hand[secondIdx];
      if (playCard(state, state.player.hand.indexOf(firstCard))) {
        lastPlayed = firstCard;
      }
      const idx2 = state.player.hand.indexOf(secondCard);
      if (idx2 !== -1 && playCard(state, idx2)) {
        lastPlayed = secondCard;
      }
    } else {
      // Fallback: play up to two cheapest affordable cards, stopping early if energy would hit 0
      for (let step = 0; step < 2; step++) {
        let bestIdx = -1;
        for (let i = 0; i < state.player.hand.length; i++) {
          const card = state.player.hand[i];
          if (card.cost <= state.player.energy) {
            if (bestIdx === -1 || card.cost < state.player.hand[bestIdx].cost) {
              bestIdx = i;
            }
          }
        }
        if (bestIdx === -1) break;
        const chosen = state.player.hand[bestIdx];
        if (playCard(state, bestIdx)) {
          lastPlayed = chosen;
        }
        if (state.player.energy <= 1) break;
      }
    }
  }

  return { screen: 'table', state, lastPlayed };
}

function pickBestAttackIndex(hand, energy) {
  let bestIdx = -1;
  let bestScore = -1;
  for (let i = 0; i < hand.length; i++) {
    const card = hand[i];
    if (card.cost > energy) continue;
    const kindWeight =
      card.kind === 'STRIKE' ? 100 : card.kind === 'DRAIN' ? 80 : card.kind === 'GUARD' ? 20 : 10;
    const score = kindWeight + card.power;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function buildWinScene() {
  for (let s = 1; s <= 50; s++) {
    const state = createDuel(s);
    while (state.phase === 'player' && state.turn <= MAX_SIM_TURNS) {
      while (state.phase === 'player') {
        const idx = pickBestAttackIndex(state.player.hand, state.player.energy);
        if (idx === -1) break;
        playCard(state, idx);
      }
      if (state.phase === 'player') {
        endPlayerTurn(state);
      }
    }
    if (state.phase === 'over' && state.winner === 'player') {
      return { screen: 'over', state, lastPlayed: null };
    }
  }
  throw new Error('Could not find a winning duel within 50 seeds.');
}

function buildLossScene() {
  for (let s = 1; s <= 50; s++) {
    const state = createDuel(s);
    while (state.phase === 'player' && state.turn <= MAX_SIM_TURNS) {
      endPlayerTurn(state);
    }
    if (state.phase === 'over' && state.winner === 'rival') {
      return { screen: 'over', state, lastPlayed: null };
    }
  }
  throw new Error('Could not find a losing duel within 50 seeds.');
}

/**
 * Build a deterministic screenshot scene ('title' | 'table' | 'win' | 'loss').
 */
export function buildScene(name, seed = 7) {
  if (name === 'title') {
    return { screen: 'title', state: null, lastPlayed: null };
  }
  if (name === 'table') {
    return buildTableScene(seed);
  }
  if (name === 'win') {
    return buildWinScene();
  }
  if (name === 'loss') {
    return buildLossScene();
  }
  return { screen: 'title', state: null, lastPlayed: null };
}
