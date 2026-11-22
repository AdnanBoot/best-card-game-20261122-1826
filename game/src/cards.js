/** The four sigil houses, each identified by both color and geometric glyph. */
export const HOUSES = [
  {
    id: 'ember',
    name: 'EMBER',
    color: '#E4572E',
    glyph: '▲',
    comboText: '+2 bonus damage',
  },
  {
    id: 'tide',
    name: 'TIDE',
    color: '#2E86DE',
    glyph: '●',
    comboText: 'Heal 3 HP',
  },
  {
    id: 'thorn',
    name: 'THORN',
    color: '#27AE60',
    glyph: '■',
    comboText: '+4 Shield',
  },
  {
    id: 'gloom',
    name: 'GLOOM',
    color: '#8E44AD',
    glyph: '⬟',
    comboText: 'Rival discards 1 random card',
  },
];

/** 12 original cards (3 per house) across STRIKE, GUARD, DRAIN, and SURGE. */
export const CARDS = [
  // EMBER
  {
    id: 'cinder-flick',
    name: 'Cinder Flick',
    house: 'ember',
    cost: 0,
    kind: 'STRIKE',
    power: 2,
    text: 'Deal 2 damage.',
  },
  {
    id: 'hearth-ward',
    name: 'Hearth Ward',
    house: 'ember',
    cost: 1,
    kind: 'GUARD',
    power: 4,
    text: 'Gain 4 Shield.',
  },
  {
    id: 'furnace-cleave',
    name: 'Furnace Cleave',
    house: 'ember',
    cost: 3,
    kind: 'STRIKE',
    power: 8,
    text: 'Deal 8 damage.',
  },

  // TIDE
  {
    id: 'foam-veil',
    name: 'Foam Veil',
    house: 'tide',
    cost: 1,
    kind: 'GUARD',
    power: 5,
    text: 'Gain 5 Shield.',
  },
  {
    id: 'undertow-sip',
    name: 'Undertow Sip',
    house: 'tide',
    cost: 2,
    kind: 'DRAIN',
    power: 4,
    text: 'Deal 4 damage. Heal 4 HP.',
  },
  {
    id: 'rip-current',
    name: 'Rip Current',
    house: 'tide',
    cost: 1,
    kind: 'SURGE',
    power: 2,
    text: 'Draw 2 cards.',
  },

  // THORN
  {
    id: 'nettle-jab',
    name: 'Nettle Jab',
    house: 'thorn',
    cost: 1,
    kind: 'STRIKE',
    power: 3,
    weak: true,
    text: 'Deal 3 damage. Apply Weak (1 turn).',
  },
  {
    id: 'bark-bulwark',
    name: 'Bark Bulwark',
    house: 'thorn',
    cost: 2,
    kind: 'GUARD',
    power: 8,
    text: 'Gain 8 Shield.',
  },
  {
    id: 'sap-leech',
    name: 'Sap Leech',
    house: 'thorn',
    cost: 2,
    kind: 'DRAIN',
    power: 3,
    weak: true,
    text: 'Deal 3 damage. Heal 3 HP. Apply Weak.',
  },

  // GLOOM
  {
    id: 'dusk-glimpse',
    name: 'Dusk Glimpse',
    house: 'gloom',
    cost: 0,
    kind: 'SURGE',
    power: 1,
    text: 'Draw 1 card.',
  },
  {
    id: 'murk-lash',
    name: 'Murk Lash',
    house: 'gloom',
    cost: 2,
    kind: 'STRIKE',
    power: 5,
    weak: true,
    text: 'Deal 5 damage. Apply Weak (1 turn).',
  },
  {
    id: 'velvet-siphon',
    name: 'Velvet Siphon',
    house: 'gloom',
    cost: 3,
    kind: 'DRAIN',
    power: 6,
    text: 'Deal 6 damage. Heal 6 HP.',
  },
];

const DECK_SIZE = 22;

/**
 * Build a shuffled 22-card deck from the catalogue (duplicates allowed).
 * Includes one copy of each card first so every deck sees all 12 designs,
 * then fills the remaining 10 slots with seeded picks.
 */
export function buildDeck(rng) {
  const deck = CARDS.map((card) => ({ ...card }));
  while (deck.length < DECK_SIZE) {
    deck.push({ ...rng.pick(CARDS) });
  }
  return rng.shuffle(deck);
}
