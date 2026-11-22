import { makeRng } from './random.js';
import { buildDeck } from './cards.js';
import { chooseIntent, planRivalTurn } from './rival.js';

const MAX_LOG_ENTRIES = 8;
const STARTING_HP = 20;
const STARTING_HAND = 5;
const TURN_ENERGY = 3;

function createDuelist(name, rng) {
  return {
    name,
    hp: STARTING_HP,
    maxHp: STARTING_HP,
    shield: 0,
    energy: TURN_ENERGY,
    hand: [],
    deck: buildDeck(rng),
    discard: [],
    weak: false,
    playedHouses: [],
    combosUsed: [],
  };
}

function appendLog(state, message) {
  state.log.push(message);
  while (state.log.length > MAX_LOG_ENTRIES) {
    state.log.shift();
  }
}

function drawCards(duelist, count, rng) {
  let drawn = 0;
  for (let i = 0; i < count; i++) {
    if (duelist.deck.length === 0) {
      if (duelist.discard.length === 0) break;
      duelist.deck = rng.shuffle(duelist.discard);
      duelist.discard = [];
    }
    const card = duelist.deck.pop();
    if (card) {
      duelist.hand.push(card);
      drawn++;
    }
  }
  return drawn;
}

function resolveDuelist(state, ref) {
  return typeof ref === 'string' ? state[ref] : ref;
}

/**
 * Apply damage to `target` ('player' | 'rival' | duelist), absorbing with shield first.
 * Marks the duel 'over' if HP reaches 0.
 */
export function damage(state, target, amount, _sourceName = '') {
  const victim = resolveDuelist(state, target);
  let remaining = Math.max(0, amount);
  let blocked = 0;

  if (victim.shield > 0) {
    blocked = Math.min(victim.shield, remaining);
    victim.shield -= blocked;
    remaining -= blocked;
  }

  victim.hp = Math.max(0, victim.hp - remaining);

  if (victim.hp <= 0 && state.phase !== 'over') {
    state.phase = 'over';
    state.winner = victim === state.player ? 'rival' : 'player';
  }

  return { dealt: remaining, blocked };
}

/**
 * Heal `who` ('player' | 'rival' | duelist) up to maxHp. Returns actual HP gained.
 */
export function heal(state, who, amount) {
  const target = resolveDuelist(state, who);
  const before = target.hp;
  target.hp = Math.min(target.maxHp, target.hp + Math.max(0, amount));
  return target.hp - before;
}

function applyHouseCombo(state, actor, opponent, house) {
  const isPlayer = actor === state.player;

  if (house === 'ember') {
    damage(state, opponent, 2, 'EMBER Combo');
    appendLog(state, 'COMBO EMBER: +2 burn damage.');
  } else if (house === 'tide') {
    const gained = heal(state, actor, 3);
    appendLog(state, `COMBO TIDE: Heal ${gained} HP.`);
  } else if (house === 'thorn') {
    actor.shield += 4;
    appendLog(state, 'COMBO THORN: +4 Shield.');
  } else if (house === 'gloom') {
    if (opponent.hand.length > 0) {
      const dropIdx = state.rng.int(opponent.hand.length);
      const [discarded] = opponent.hand.splice(dropIdx, 1);
      opponent.discard.push(discarded);
      appendLog(
        state,
        `COMBO GLOOM: ${isPlayer ? 'Vex discards' : 'You discard'} ${discarded.name}.`
      );
    } else {
      appendLog(state, 'COMBO GLOOM: No cards in hand to discard.');
    }
  }
}

function executeCard(state, actor, opponent, card) {
  const isPlayer = actor === state.player;
  const verb = isPlayer ? 'You play' : 'Vex plays';
  const weakPenalty = actor.weak ? 2 : 0;

  if (card.kind === 'STRIKE') {
    const power = Math.max(0, card.power - weakPenalty);
    const res = damage(state, opponent, power, card.name);
    const blockNote = res.blocked > 0 ? ` (${res.blocked} blocked)` : '';
    appendLog(state, `${verb} ${card.name} — ${power} damage${blockNote}.`);
  } else if (card.kind === 'GUARD') {
    actor.shield += card.power;
    appendLog(state, `${verb} ${card.name} — +${card.power} Shield.`);
  } else if (card.kind === 'DRAIN') {
    const power = Math.max(0, card.power - weakPenalty);
    const res = damage(state, opponent, power, card.name);
    const healed = heal(state, actor, power);
    const blockNote = res.blocked > 0 ? ` (${res.blocked} blocked)` : '';
    appendLog(state, `${verb} ${card.name} — ${power} damage${blockNote}, heal ${healed} HP.`);
  } else if (card.kind === 'SURGE') {
    const drawn = drawCards(actor, card.power, state.rng);
    appendLog(state, `${verb} ${card.name} — draw ${drawn} card${drawn === 1 ? '' : 's'}.`);
  }

  if (card.weak && state.phase !== 'over') {
    opponent.weak = true;
    appendLog(state, `${isPlayer ? 'Vex is' : 'You are'} Weakened (-2 attack damage).`);
  }

  actor.playedHouses.push(card.house);
  const houseCount = actor.playedHouses.filter((h) => h === card.house).length;
  if (houseCount >= 2 && !actor.combosUsed.includes(card.house) && state.phase !== 'over') {
    actor.combosUsed.push(card.house);
    applyHouseCombo(state, actor, opponent, card.house);
  }
}

/**
 * Create a new SIGIL CLASH duel with a deterministic seed.
 */
export function createDuel(seed = 1) {
  const rng = makeRng(seed);
  const player = createDuelist('You', rng);
  const rival = createDuelist('Vex', rng);

  drawCards(player, STARTING_HAND, rng);
  drawCards(rival, STARTING_HAND, rng);

  const state = {
    rng,
    turn: 1,
    phase: 'player',
    winner: null,
    log: ['Duel begins! Vex enters the arena.'],
    intent: null,
    player,
    rival,
  };

  state.intent = chooseIntent(state);
  return state;
}

/**
 * Prepare the player's turn: reset shield/combos/energy, draw 1 (after turn 1).
 */
export function startPlayerTurn(state) {
  if (state.phase === 'over') return;
  state.player.shield = 0;
  state.player.playedHouses = [];
  state.player.combosUsed = [];
  state.player.energy = TURN_ENERGY;
  if (state.turn > 1) {
    drawCards(state.player, 1, state.rng);
  }
}

/**
 * Play a card from the player's hand by index. Returns true on success.
 */
export function playCard(state, handIndex) {
  if (state.phase !== 'player') return false;
  if (handIndex < 0 || handIndex >= state.player.hand.length) return false;

  const card = state.player.hand[handIndex];
  if (state.player.energy < card.cost) return false;

  state.player.energy -= card.cost;
  state.player.hand.splice(handIndex, 1);
  state.player.discard.push(card);

  executeCard(state, state.player, state.rival, card);
  return true;
}

/**
 * End the player's turn, execute Vex's planned turn, and advance to the next round.
 */
export function endPlayerTurn(state) {
  if (state.phase !== 'player') return;

  // Player's weak status expires at the end of their own turn
  state.player.weak = false;

  // Rival turn start
  state.rival.shield = 0;
  state.rival.playedHouses = [];
  state.rival.combosUsed = [];
  state.rival.energy = TURN_ENERGY;
  drawCards(state.rival, 1, state.rng);

  const plannedIndices = planRivalTurn(state);
  const plannedCards = plannedIndices.map((idx) => state.rival.hand[idx]).filter(Boolean);

  for (const card of plannedCards) {
    if (state.phase === 'over') break;
    const currentIdx = state.rival.hand.indexOf(card);
    if (currentIdx === -1 || state.rival.energy < card.cost) continue;

    state.rival.energy -= card.cost;
    state.rival.hand.splice(currentIdx, 1);
    state.rival.discard.push(card);
    executeCard(state, state.rival, state.player, card);
  }

  // Rival's weak status expires at the end of their own turn
  state.rival.weak = false;

  if (state.phase !== 'over') {
    state.turn += 1;
    state.intent = chooseIntent(state);
    startPlayerTurn(state);
  }
}
