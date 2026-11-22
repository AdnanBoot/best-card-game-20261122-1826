/**
 * Rival AI ("Vex") for SIGIL CLASH.
 * Operates purely on the passed state object to avoid circular imports with duel.js.
 */

const RIVAL_ENERGY = 3;

const INTENT_GLYPHS = {
  strike: '⚔',
  guard: '🛡',
  drain: '◈',
  surge: '✦',
};

/**
 * Find the subset of cards of `kind` within `budget` energy that maximizes total power.
 * Hand sizes are small (<= 6), so an exact recursive search is fast and optimal.
 */
function bestCardsForKind(hand, kind, budget) {
  const candidates = [];
  for (let i = 0; i < hand.length; i++) {
    if (hand[i].kind === kind && hand[i].cost <= budget) {
      candidates.push({ index: i, card: hand[i] });
    }
  }

  let bestPower = -1;
  let bestCount = -1;
  let bestIndices = [];

  function search(pos, remEnergy, powerSum, chosen) {
    if (powerSum > bestPower || (powerSum === bestPower && chosen.length > bestCount)) {
      bestPower = powerSum;
      bestCount = chosen.length;
      bestIndices = chosen.slice();
    }
    for (let i = pos; i < candidates.length; i++) {
      const { index, card } = candidates[i];
      if (card.cost <= remEnergy) {
        chosen.push(index);
        search(i + 1, remEnergy - card.cost, powerSum + card.power, chosen);
        chosen.pop();
      }
    }
  }

  search(0, budget, 0, []);
  return { indices: bestIndices, totalPower: Math.max(0, bestPower) };
}

/**
 * Choose Vex's telegraphed intent for the upcoming rival turn.
 * Returns { kind, power, glyph, text }.
 */
export function chooseIntent(state) {
  const rival = state.rival;
  const hand = rival.hand;
  const weakPenalty = rival.weak ? 2 : 0;

  const strikePlan = bestCardsForKind(hand, 'STRIKE', RIVAL_ENERGY);
  const guardPlan = bestCardsForKind(hand, 'GUARD', RIVAL_ENERGY);
  const drainPlan = bestCardsForKind(hand, 'DRAIN', RIVAL_ENERGY);
  const surgePlan = bestCardsForKind(hand, 'SURGE', RIVAL_ENERGY);

  const strikePower = strikePlan.indices.reduce(
    (sum, idx) => sum + Math.max(0, hand[idx].power - weakPenalty),
    0
  );
  const drainPower = drainPlan.indices.reduce(
    (sum, idx) => sum + Math.max(0, hand[idx].power - weakPenalty),
    0
  );
  const guardCount = hand.filter((c) => c.kind === 'GUARD').length;

  // Low HP and holding an affordable DRAIN -> drain intent
  if (rival.hp <= 12 && drainPlan.indices.length > 0) {
    return {
      kind: 'drain',
      power: drainPower,
      glyph: INTENT_GLYPHS.drain,
      text: `Vex plans to drain for ${drainPower}`,
    };
  }

  // Holding mostly GUARD cards -> guard intent
  if (guardPlan.indices.length > 0 && guardCount > hand.length / 2) {
    return {
      kind: 'guard',
      power: guardPlan.totalPower,
      glyph: INTENT_GLYPHS.guard,
      text: `Vex plans to guard for ${guardPlan.totalPower}`,
    };
  }

  // Prefer strongest affordable STRIKE total
  if (strikePlan.indices.length > 0) {
    return {
      kind: 'strike',
      power: strikePower,
      glyph: INTENT_GLYPHS.strike,
      text: `Vex plans to strike for ${strikePower}`,
    };
  }

  if (drainPlan.indices.length > 0) {
    return {
      kind: 'drain',
      power: drainPower,
      glyph: INTENT_GLYPHS.drain,
      text: `Vex plans to drain for ${drainPower}`,
    };
  }

  if (guardPlan.indices.length > 0) {
    return {
      kind: 'guard',
      power: guardPlan.totalPower,
      glyph: INTENT_GLYPHS.guard,
      text: `Vex plans to guard for ${guardPlan.totalPower}`,
    };
  }

  const surgePower = surgePlan.indices.length > 0 ? surgePlan.totalPower : 1;
  return {
    kind: 'surge',
    power: surgePower,
    glyph: INTENT_GLYPHS.surge,
    text: `Vex plans to surge (+${surgePower} card${surgePower === 1 ? '' : 's'})`,
  };
}

/**
 * Plan the ordered list of hand indices Vex will play this turn.
 * Follows the telegraphed intent first, then adds affordable helpful cards.
 */
export function planRivalTurn(state) {
  const rival = state.rival;
  const hand = rival.hand;
  let energy = rival.energy;
  const intentKind = (state.intent?.kind ?? 'strike').toUpperCase();

  // 1. Follow telegraphed intent first
  const primary = bestCardsForKind(hand, intentKind, energy);
  const chosen = primary.indices.slice();
  const used = new Set(chosen);
  for (const idx of chosen) {
    energy -= hand[idx].cost;
  }

  // 2. Fill remaining energy with helpful affordable cards
  const willGainGuard = intentKind === 'GUARD' && chosen.length > 0;
  const priorityOrder = [];
  if (rival.shield === 0 && !willGainGuard) priorityOrder.push('GUARD');
  if (hand.length <= 3) priorityOrder.push('SURGE');
  priorityOrder.push('DRAIN', 'STRIKE', 'GUARD', 'SURGE');

  for (const kind of priorityOrder) {
    for (let i = 0; i < hand.length; i++) {
      if (used.has(i)) continue;
      const card = hand[i];
      if (card.kind === kind && card.cost <= energy) {
        chosen.push(i);
        used.add(i);
        energy -= card.cost;
      }
    }
  }

  return chosen;
}
