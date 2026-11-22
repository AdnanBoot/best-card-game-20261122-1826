import { HOUSES } from './cards.js';

const HOUSE_BY_ID = Object.fromEntries(HOUSES.map((h) => [h.id, h]));
const MAX_ENERGY = 3;

function showScreen(root, activeId) {
  for (const id of ['screen-title', 'screen-table', 'screen-over']) {
    const el = root.querySelector(`#${id}`);
    if (el) el.hidden = id !== activeId;
  }
}

/**
 * Build a face-up card DOM node styled by house color and geometric glyph.
 */
export function cardElement(card, options = {}) {
  const house = HOUSE_BY_ID[card.house] ?? HOUSES[0];
  const interactive = typeof options.onClick === 'function' && !options.unaffordable;

  const el = document.createElement(interactive || options.onClick ? 'button' : 'div');
  if (el.tagName === 'BUTTON') {
    el.type = 'button';
  }
  el.className = 'card';
  if (options.unaffordable) {
    el.classList.add('unaffordable');
    el.setAttribute('aria-disabled', 'true');
  }
  el.dataset.house = card.house;
  el.style.setProperty('--house', house.color);

  const band = document.createElement('div');
  band.className = 'card-band';

  const costWrap = document.createElement('span');
  costWrap.className = 'card-cost';
  costWrap.setAttribute('aria-label', `Cost ${card.cost}`);
  for (let i = 0; i < MAX_ENERGY; i++) {
    const pip = document.createElement('span');
    pip.className = i < card.cost ? 'cost-pip filled' : 'cost-pip';
    costWrap.appendChild(pip);
  }
  band.appendChild(costWrap);

  const glyph = document.createElement('span');
  glyph.className = 'card-glyph';
  glyph.textContent = house.glyph;
  band.appendChild(glyph);

  if (options.keyHint != null) {
    const keyHint = document.createElement('span');
    keyHint.className = 'card-key';
    keyHint.textContent = String(options.keyHint);
    band.appendChild(keyHint);
  }

  const watermark = document.createElement('div');
  watermark.className = 'card-watermark';
  watermark.setAttribute('aria-hidden', 'true');
  watermark.textContent = house.glyph;

  const body = document.createElement('div');
  body.className = 'card-body';

  const power = document.createElement('div');
  power.className = 'card-power';
  power.textContent = String(card.power);

  const kind = document.createElement('div');
  kind.className = 'card-kind';
  kind.textContent = card.kind;

  const name = document.createElement('div');
  name.className = 'card-name';
  name.textContent = card.name;

  const text = document.createElement('div');
  text.className = 'card-text';
  text.textContent = card.text;

  body.append(power, kind, name, text);
  el.append(band, watermark, body);

  if (interactive) {
    el.addEventListener('click', options.onClick);
  }

  return el;
}

/**
 * Build a face-down card back node displaying the four house glyphs in a diamond.
 */
export function cardBackElement() {
  const el = document.createElement('div');
  el.className = 'card-back';
  el.setAttribute('aria-hidden', 'true');

  const diamond = document.createElement('div');
  diamond.className = 'card-back-diamond';
  for (const house of HOUSES) {
    const span = document.createElement('span');
    span.textContent = house.glyph;
    diamond.appendChild(span);
  }
  el.appendChild(diamond);
  return el;
}

/**
 * Render the title screen with the house legend and wire the Start button.
 */
export function renderTitle(root, onStart) {
  showScreen(root, 'screen-title');

  const legend = root.querySelector('#house-legend');
  legend.innerHTML = '';
  for (const house of HOUSES) {
    const chip = document.createElement('div');
    chip.className = 'legend-chip';
    chip.style.setProperty('--house', house.color);

    const glyph = document.createElement('span');
    glyph.className = 'legend-glyph';
    glyph.textContent = house.glyph;

    const name = document.createElement('span');
    name.className = 'legend-name';
    name.textContent = house.name;

    const combo = document.createElement('span');
    combo.className = 'legend-combo';
    combo.textContent = `2+ Combo: ${house.comboText}`;

    chip.append(glyph, name, combo);
    legend.appendChild(chip);
  }

  const startBtn = root.querySelector('#btn-start');
  startBtn.onclick = onStart;
}

/**
 * Render the active duel table from the current engine state.
 */
export function renderTable(root, state, handlers = {}) {
  showScreen(root, 'screen-table');

  // Rival plate
  const rivalPct = Math.max(0, Math.min(100, (state.rival.hp / state.rival.maxHp) * 100));
  root.querySelector('#rival-hp-fill').style.width = `${rivalPct}%`;
  root.querySelector('#rival-hp-text').textContent = `${state.rival.hp} / ${state.rival.maxHp}`;

  const rivalShield = root.querySelector('#rival-shield');
  rivalShield.hidden = state.rival.shield <= 0;
  rivalShield.textContent = `🛡 ${state.rival.shield}`;

  root.querySelector('#rival-weak').hidden = !state.rival.weak;

  const intentBadge = root.querySelector('#intent-badge');
  if (state.intent) {
    intentBadge.dataset.intent = state.intent.kind;
    intentBadge.textContent = `${state.intent.glyph} ${state.intent.text}`;
  } else {
    intentBadge.textContent = '';
  }

  const rivalHandEl = root.querySelector('#rival-hand');
  rivalHandEl.innerHTML = '';
  for (let i = 0; i < state.rival.hand.length; i++) {
    rivalHandEl.appendChild(cardBackElement());
  }
  root.querySelector('#rival-hand-count').textContent = `${state.rival.hand.length} cards`;

  // Center stage
  const stageEl = root.querySelector('#stage');
  stageEl.innerHTML = '';
  if (handlers.lastPlayed) {
    stageEl.appendChild(cardElement(handlers.lastPlayed, { inStage: true }));
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'stage-placeholder';
    placeholder.textContent = `Turn ${state.turn} · Play a Card`;
    stageEl.appendChild(placeholder);
  }

  // Combo banner & combat log (last 3 lines)
  const latestLog = state.log[state.log.length - 1] ?? '';
  const comboBanner = root.querySelector('#combo-banner');
  if (latestLog.includes('COMBO')) {
    comboBanner.hidden = false;
    comboBanner.textContent = latestLog;
  } else {
    comboBanner.hidden = true;
  }

  const logEl = root.querySelector('#log');
  logEl.innerHTML = '';
  for (const line of state.log.slice(-3)) {
    const li = document.createElement('li');
    li.textContent = line;
    logEl.appendChild(li);
  }

  // Player plate
  const playerPct = Math.max(0, Math.min(100, (state.player.hp / state.player.maxHp) * 100));
  root.querySelector('#player-hp-fill').style.width = `${playerPct}%`;
  root.querySelector('#player-hp-text').textContent = `${state.player.hp} / ${state.player.maxHp}`;

  const playerShield = root.querySelector('#player-shield');
  playerShield.hidden = state.player.shield <= 0;
  playerShield.textContent = `🛡 ${state.player.shield}`;

  root.querySelector('#player-weak').hidden = !state.player.weak;

  const energyEl = root.querySelector('#energy');
  energyEl.innerHTML = '';
  for (let i = 0; i < MAX_ENERGY; i++) {
    const orb = document.createElement('span');
    orb.className = i < state.player.energy ? 'energy-orb filled' : 'energy-orb';
    energyEl.appendChild(orb);
  }
  const energyLabel = document.createElement('span');
  energyLabel.className = 'energy-label';
  energyLabel.textContent = `${state.player.energy}/3`;
  energyEl.appendChild(energyLabel);

  root.querySelector('#deck-count').textContent = `Deck: ${state.player.deck.length}`;
  root.querySelector('#discard-count').textContent = `Discard: ${state.player.discard.length}`;

  // Player hand
  const handEl = root.querySelector('#hand');
  handEl.innerHTML = '';
  const count = state.player.hand.length;
  const mid = (count - 1) / 2;

  state.player.hand.forEach((card, index) => {
    const unaffordable = state.phase !== 'player' || card.cost > state.player.energy;
    const node = cardElement(card, {
      unaffordable,
      keyHint: index < 5 ? index + 1 : undefined,
      onClick: () => handlers.onPlay?.(index),
    });
    const offset = index - mid;
    node.style.setProperty('--fan-angle', `${(offset * 2.2).toFixed(1)}deg`);
    node.style.setProperty('--fan-y', `${(Math.abs(offset) * 2.2).toFixed(1)}px`);
    handEl.appendChild(node);
  });

  const endBtn = root.querySelector('#btn-end');
  endBtn.onclick = handlers.onEnd;
}

/**
 * Render the end-of-duel screen with victory flourish or defeat summary.
 */
export function renderOver(root, state, onRestart) {
  showScreen(root, 'screen-over');

  const isVictory = state.winner === 'player';
  const titleEl = root.querySelector('#over-title');
  titleEl.textContent = isVictory ? 'VICTORY' : 'DEFEAT';
  titleEl.className = isVictory ? 'over-title victory' : 'over-title defeat';

  const statsEl = root.querySelector('#over-stats');
  const hpSummary = isVictory
    ? `Your HP remaining: ${state.player.hp} / ${state.player.maxHp}`
    : `Vex HP remaining: ${state.rival.hp} / ${state.rival.maxHp}`;
  statsEl.textContent = `Turns taken: ${state.turn} · ${hpSummary}`;

  const flourishEl = root.querySelector('#flourish');
  flourishEl.innerHTML = '';
  if (isVictory) {
    // Static ring of the four house glyphs around the VICTORY panel (always visible, even in body.shot)
    const ringCount = 8;
    for (let i = 0; i < ringCount; i++) {
      const house = HOUSES[i % HOUSES.length];
      const angle = (i / ringCount) * Math.PI * 2 - Math.PI / 2;
      const rx = Math.round(Math.cos(angle) * 275);
      const ry = Math.round(Math.sin(angle) * 168);
      const ringGlyph = document.createElement('span');
      ringGlyph.className = 'flourish-ring-glyph';
      ringGlyph.textContent = house.glyph;
      ringGlyph.style.setProperty('--house', house.color);
      ringGlyph.style.setProperty('--rx', `${rx}px`);
      ringGlyph.style.setProperty('--ry', `${ry}px`);
      flourishEl.appendChild(ringGlyph);
    }

    // Live-play floating glyph burst
    for (let i = 0; i < 12; i++) {
      const house = HOUSES[i % HOUSES.length];
      const glyph = document.createElement('span');
      glyph.className = 'flourish-glyph';
      glyph.textContent = house.glyph;
      glyph.style.setProperty('--house', house.color);
      glyph.style.left = `${8 + i * 7.8}%`;
      glyph.style.animationDelay = `${(i % 4) * 0.45}s`;
      flourishEl.appendChild(glyph);
    }
  }

  root.querySelector('#btn-again').onclick = onRestart;
}
