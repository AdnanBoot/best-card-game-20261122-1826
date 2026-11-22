import { createDuel, playCard, endPlayerTurn } from './duel.js';
import { renderTitle, renderTable, renderOver } from './render.js';
import { buildScene } from './shots.js';

const app = document.getElementById('app');
const params = new URLSearchParams(window.location.search);

if (params.has('shot')) {
  document.body.classList.add('shot');
  const shotName = params.get('shot') || 'title';
  const rawSeed = params.get('seed');
  const parsedSeed = rawSeed !== null && rawSeed !== '' ? Number(rawSeed) : 7;
  const scene = buildScene(shotName, Number.isFinite(parsedSeed) ? parsedSeed : 7);

  if (scene.screen === 'title') {
    renderTitle(app, () => {});
  } else if (scene.screen === 'table') {
    renderTable(app, scene.state, {
      lastPlayed: scene.lastPlayed,
      onPlay: () => {},
      onEnd: () => {},
    });
  } else {
    renderOver(app, scene.state, () => {});
  }
} else {
  let state = null;
  let lastPlayed = null;

  function renderCurrent() {
    if (!state) {
      renderTitle(app, startDuel);
      return;
    }
    if (state.phase === 'over') {
      renderOver(app, state, startDuel);
      return;
    }
    renderTable(app, state, {
      lastPlayed,
      onPlay: handlePlay,
      onEnd: handleEnd,
    });
  }

  function startDuel() {
    state = createDuel(Date.now() % 100000);
    lastPlayed = null;
    renderCurrent();
  }

  function handlePlay(index) {
    if (!state || state.phase !== 'player') return;
    const card = state.player.hand[index];
    if (!card) return;
    if (playCard(state, index)) {
      lastPlayed = card;
      renderCurrent();
    }
  }

  function handleEnd() {
    if (!state || state.phase !== 'player') return;
    lastPlayed = null;
    endPlayerTurn(state);
    renderCurrent();
  }

  window.addEventListener('keydown', (event) => {
    if (!state || state.phase !== 'player') return;
    if (event.key >= '1' && event.key <= '5') {
      const index = Number(event.key) - 1;
      if (index < state.player.hand.length) {
        handlePlay(index);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      handleEnd();
    }
  });

  renderTitle(app, startDuel);
}
