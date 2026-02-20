// ============================================================
// WAR OF THE RING - Main Entry Point
// ============================================================
window.GAME = window.GAME || {};

document.addEventListener('DOMContentLoaded', () => {
  // Initialize systems
  GAME.AI.init();
  GAME.Renderer.init();
  GAME.UI.init();

  // Start the game
  const state = GAME.Engine.initGame({ duskIsAI: true });
  GAME.Renderer.fullUpdate(state);

  // Initial status
  const statusEl = document.getElementById('status-message');
  if (statusEl) {
    statusEl.textContent = 'The War of the Ring begins! You command the Free Peoples.';
  }

  console.log('War of the Ring initialized successfully.');
  console.log('Game state available via: window.render_game_to_text()');
});
