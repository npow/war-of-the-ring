// ============================================================
// THE SUNDERING WAR - Main Entry Point
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
    statusEl.textContent = 'The Sundering War begins! You command the Dawn Covenant.';
  }

  console.log('The Sundering War initialized successfully.');
  console.log('Game state available via: window.render_game_to_text()');
});
