// ============================================================
// WAR OF THE RING - UI Controller
// Handles user interactions and game flow
// ============================================================
window.GAME = window.GAME || {};

GAME.UI = (function() {
  let currentAction = null;
  let selectedFrom = null;
  let selectedUnits = null;
  let awaitingTarget = false;
  let musterMode = false;
  let charMoveId = null; // for character move mode

  function init() {
    // Region click handlers
    document.getElementById('map-svg').addEventListener('click', handleMapClick);
    document.getElementById('map-svg').addEventListener('mousemove', handleMapHover);
    document.getElementById('map-svg').addEventListener('mouseleave', () => GAME.Renderer.hideRegionTooltip());

    // Dice click handlers (delegated)
    document.getElementById('dawn-dice').addEventListener('click', handleDieClick);
    document.getElementById('dusk-dice').addEventListener('click', handleDieClick);

    // Action menu (delegated)
    document.getElementById('action-menu').addEventListener('click', handleActionClick);

    // Phase prompt (delegated)
    document.getElementById('phase-prompt').addEventListener('click', handlePromptClick);

    // Combat panel (delegated)
    document.getElementById('combat-panel').addEventListener('click', handleCombatClick);

    // Cards (delegated)
    document.getElementById('dawn-cards').addEventListener('click', handleCardClick);

    // Listen to game events
    GAME.Engine.on(handleGameEvent);
  }

  function handleGameEvent(event, data) {
    const state = GAME.Engine.getState();
    GAME.Renderer.fullUpdate(state);

    switch (event) {
      case 'phase_change':
        handlePhaseChange(data);
        break;
      case 'combat_start':
        GAME.Renderer.showCombatPanel(data, state);
        break;
      case 'combat_end':
        GAME.Renderer.hideCombatPanel();
        GAME.Renderer.fullUpdate(state);
        break;
      case 'game_over':
        GAME.Renderer.showVictoryScreen(data.winner, data.reason);
        break;
      case 'next_action':
        handleNextAction(data);
        break;
    }
  }

  function handlePhaseChange(phase) {
    const state = GAME.Engine.getState();
    GAME.Renderer.hideActionMenu();
    GAME.Renderer.hidePhasePrompt();
    GAME.Renderer.clearHighlights();
    resetSelection();

    switch (phase) {
      case 'fellowship_phase':
        if (state.isAI) {
          // Player is always Dawn
          GAME.Renderer.showPhasePrompt(
            'Fellowship Phase: What does the Fellowship do?',
            [
              { label: '\u{1F6E1} Hide', action: 'fellowship_hide' },
              { label: '\u{1F4CD} Declare Position', action: 'fellowship_declare' },
              { label: '\u27A1 Continue Hidden', action: 'fellowship_continue' },
            ]
          );
        }
        break;

      case 'hunt_allocation':
        if (state.isAI) {
          // AI handles hunt allocation
          const aiAlloc = GAME.AI ? GAME.AI.decideHuntAllocation(state) : 0;
          setTimeout(() => {
            GAME.Engine.allocateHuntDice(aiAlloc);
          }, 500);
        }
        break;

      case 'action_roll':
        GAME.Renderer.showPhasePrompt(
          'Roll the action dice!',
          [{ label: '\u{1F3B2} Roll Dice', action: 'roll_dice' }]
        );
        break;

      case 'action_resolution':
        handleNextAction({ activePlayer: state.activePlayer });
        break;

      case 'combat':
        // Combat UI is handled by combat_start event
        break;
    }
  }

  function handleNextAction(data) {
    const state = GAME.Engine.getState();
    if (state.gameOver) return;

    resetSelection();
    GAME.Renderer.hideActionMenu();
    GAME.Renderer.clearHighlights();

    if (state.activePlayer === 'dusk' && state.isAI) {
      // AI's turn
      setTimeout(() => {
        if (GAME.AI) {
          GAME.AI.takeTurn(state);
        }
      }, 600);
    } else {
      // Human's turn - prompt to select a die
      updateStatusMessage('Your turn! Select an action die to use.');
    }
  }

  function handleMapClick(e) {
    const regionGroup = e.target.closest('[data-region]');
    if (!regionGroup) return;

    const regionId = regionGroup.dataset.region;
    const state = GAME.Engine.getState();

    if (state.phase === 'combat') return;

    if (awaitingTarget) {
      handleTargetSelection(regionId);
      return;
    }

    if (currentAction === 'move_army' && !selectedFrom) {
      // Selecting source region for army movement
      selectArmySource(regionId);
      return;
    }

    if (currentAction === 'move_fellowship') {
      handleFellowshipMove(regionId);
      return;
    }

    if (currentAction === 'muster_troops') {
      handleMuster(regionId);
      return;
    }

    if (currentAction === 'move_character') {
      handleCharacterMove(regionId);
      return;
    }

    // Default: show region info
    GAME.Renderer.clearHighlights();
    GAME.Renderer.highlightRegions([regionId], '#88ccff');
    GAME.Renderer.highlightConnections(regionId);
  }

  function handleMapHover(e) {
    const regionGroup = e.target.closest('[data-region]');
    if (regionGroup) {
      const rect = document.getElementById('map-container').getBoundingClientRect();
      GAME.Renderer.showRegionTooltip(regionGroup.dataset.region, e.clientX - rect.left, e.clientY - rect.top);
    } else {
      GAME.Renderer.hideRegionTooltip();
    }
  }

  function handleDieClick(e) {
    const dieEl = e.target.closest('.die.selectable');
    if (!dieEl) return;

    const state = GAME.Engine.getState();
    if (state.phase !== 'action_resolution') return;

    const index = parseInt(dieEl.dataset.index);
    const side = dieEl.dataset.side;

    if (side !== state.activePlayer) return;

    const success = GAME.Engine.selectDie(index, side);
    if (success) {
      const die = state.currentDie;
      const actions = GAME.Engine.getAvailableActions(die);
      GAME.Renderer.showActionMenu(actions);

      // Highlight selected die
      document.querySelectorAll('.die').forEach(d => d.classList.remove('selected'));
      dieEl.classList.add('selected');

      updateStatusMessage(`Selected ${die.face.replace(/_/g, ' ')} die. Choose an action.`);
    }
  }

  function handleActionClick(e) {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;

    const action = btn.dataset.action;
    const state = GAME.Engine.getState();

    GAME.Renderer.hideActionMenu();
    currentAction = action;

    switch (action) {
      case 'move_army':
        updateStatusMessage('Select a region with your armies to move.');
        highlightRegionsWithArmies(state.activePlayer);
        break;

      case 'move_fellowship':
        if (state.activePlayer !== 'dawn') return;
        updateStatusMessage('Select an adjacent region for the Fellowship.');
        const fellowPos = state.fellowship.position;
        const targets = GAME.Engine.getAdjacent(fellowPos);
        GAME.Renderer.highlightRegions([fellowPos], '#4488ff');
        GAME.Renderer.highlightRegions(targets, '#ffcc00');
        break;

      case 'move_character':
        updateStatusMessage('Select a region with your characters.');
        highlightRegionsWithCharacters(state.activePlayer);
        break;

      case 'muster_troops':
        updateStatusMessage('Select a settlement to muster troops.');
        const musterRegions = GAME.Engine.getMusterableRegions(state.activePlayer);
        GAME.Renderer.highlightRegions(musterRegions, '#44cc44');
        break;

      case 'advance_political':
        showPoliticalOptions(state);
        break;

      case 'play_event':
      case 'play_character_card':
        showCardSelection(state);
        break;

      case 'draw_event':
        GAME.Engine.executeAction('draw_event');
        break;

      case 'skip':
        GAME.Engine.executeAction('skip');
        break;
    }
  }

  function handlePromptClick(e) {
    const btn = e.target.closest('.prompt-btn');
    if (!btn) return;

    const action = btn.dataset.action;
    GAME.Renderer.hidePhasePrompt();

    switch (action) {
      case 'fellowship_hide':
        GAME.Engine.declareFellowship('hide');
        break;
      case 'fellowship_declare':
        GAME.Engine.declareFellowship('declare');
        break;
      case 'fellowship_continue':
        GAME.Engine.declareFellowship('continue');
        break;
      case 'roll_dice':
        GAME.Engine.advancePhase();
        break;
      case 'advance_political':
        const data = btn.dataset.data ? JSON.parse(btn.dataset.data) : {};
        GAME.Engine.executeAction('advance_political', { nation: data.nation });
        break;
    }
  }

  function handleCombatClick(e) {
    const btn = e.target.closest('.combat-btn');
    if (!btn) return;

    const action = btn.dataset.action;
    const state = GAME.Engine.getState();

    if (action === 'fight') {
      GAME.Engine.resolveCombatRound();
      if (state.combatState && !state.combatState.resolved) {
        GAME.Renderer.showCombatPanel(state.combatState, state);
      }
    } else if (action === 'retreat') {
      const side = state.combatState ? state.combatState.attacker : state.activePlayer;
      GAME.Engine.retreatFromCombat(side);
    }
  }

  function handleCardClick(e) {
    const cardEl = e.target.closest('.card');
    if (!cardEl) return;

    const cardId = cardEl.dataset.cardId;
    if (currentAction === 'play_event' || currentAction === 'play_character_card') {
      const success = GAME.Engine.executeAction('play_event', { cardId });
      if (success) {
        currentAction = null;
      }
    }
  }

  // ---- ARMY MOVEMENT ----
  function selectArmySource(regionId) {
    const state = GAME.Engine.getState();
    const region = state.regions[regionId];
    const side = state.activePlayer;

    const totalUnits = GAME.Engine.getTotalUnits(regionId, side);
    if (totalUnits <= 0) {
      updateStatusMessage('No armies in that region. Select a region with your armies.');
      return;
    }

    selectedFrom = regionId;
    const targets = GAME.Engine.getArmyMoveTargets(regionId);

    GAME.Renderer.clearHighlights();
    GAME.Renderer.highlightRegions([regionId], '#4488ff');
    GAME.Renderer.highlightRegions(targets, '#ffcc00');
    GAME.Renderer.highlightConnections(regionId);

    awaitingTarget = true;

    // Show unit selection UI
    showUnitSelectionPanel(regionId, side);
    updateStatusMessage(`Moving from ${GAME.getRegion(regionId).name}. Select units then click destination.`);
  }

  function showUnitSelectionPanel(regionId, side) {
    const state = GAME.Engine.getState();
    const region = state.regions[regionId];
    const units = region[side];

    const panel = document.getElementById('unit-selection');
    panel.style.display = 'block';
    panel.innerHTML = `
      <div class="unit-sel-title">Select Units to Move</div>
      <div class="unit-sel-row">
        <label>Regular (${units.regular}): <input type="number" id="sel-regular" min="0" max="${units.regular}" value="${units.regular}"></label>
      </div>
      <div class="unit-sel-row">
        <label>Elite (${units.elite}): <input type="number" id="sel-elite" min="0" max="${units.elite}" value="${units.elite}"></label>
      </div>
      <div class="unit-sel-row">
        <label>Leaders (${units.leaders}): <input type="number" id="sel-leaders" min="0" max="${units.leaders}" value="${units.leaders}"></label>
      </div>
      <button class="cancel-btn" onclick="GAME.UI.cancelAction()">Cancel</button>
    `;
  }

  function handleTargetSelection(regionId) {
    if (!selectedFrom) return;
    const state = GAME.Engine.getState();

    if (!GAME.Engine.isAdjacent(selectedFrom, regionId)) {
      updateStatusMessage('Not adjacent! Select a highlighted region.');
      return;
    }

    // Character move mode
    if (charMoveId) {
      const success = GAME.Engine.executeAction('move_character', {
        characterId: charMoveId,
        to: regionId,
      });
      if (success) {
        resetSelection();
      } else {
        updateStatusMessage('Cannot move there!');
      }
      return;
    }

    // Army move mode - get selected units
    const selReg = document.getElementById('sel-regular');
    const selElite = document.getElementById('sel-elite');
    const selLeaders = document.getElementById('sel-leaders');

    const regular = selReg ? parseInt(selReg.value || 0) : 0;
    const elite = selElite ? parseInt(selElite.value || 0) : 0;
    const leaders = selLeaders ? parseInt(selLeaders.value || 0) : 0;

    const units = { regular, elite, leaders, nazgul: 0 };
    const success = GAME.Engine.executeAction('move_army', {
      from: selectedFrom,
      to: regionId,
      units,
    });

    if (success) {
      hideUnitSelection();
      resetSelection();
    } else {
      updateStatusMessage('Invalid move! Try again.');
    }
  }

  function hideUnitSelection() {
    const panel = document.getElementById('unit-selection');
    if (panel) {
      panel.style.display = 'none';
      panel.innerHTML = '';
    }
  }

  // ---- FELLOWSHIP MOVEMENT ----
  function handleFellowshipMove(regionId) {
    const state = GAME.Engine.getState();
    const fellowPos = state.fellowship.position;
    const targets = GAME.Engine.getAdjacent(fellowPos);

    if (!targets.includes(regionId)) {
      updateStatusMessage('Not adjacent to the Fellowship!');
      return;
    }

    const success = GAME.Engine.executeAction('move_fellowship', { to: regionId });
    if (success) {
      resetSelection();
    }
  }

  // ---- CHARACTER MOVEMENT ----
  function handleCharacterMove(regionId) {
    const state = GAME.Engine.getState();
    const region = state.regions[regionId];
    const side = state.activePlayer;

    // Find characters of current side in this region
    const chars = region.characters.filter(cid => {
      const c = GAME.Characters[cid];
      return c && c.side === side;
    });

    if (chars.length === 0) {
      // Also check fellowship companions
      if (side === 'dawn' && regionId === state.fellowship.position) {
        showCompanionSeparation();
        return;
      }
      updateStatusMessage('No characters to move there.');
      return;
    }

    // For simplicity, move the first character
    const charId = chars[0];
    const targets = GAME.Engine.getAdjacent(regionId);
    GAME.Renderer.clearHighlights();
    GAME.Renderer.highlightRegions([regionId], '#4488ff');
    GAME.Renderer.highlightRegions(targets, '#ffcc00');

    awaitingTarget = true;
    selectedFrom = regionId;
    charMoveId = charId;

    updateStatusMessage(`Moving ${GAME.Characters[charId].name}. Click destination.`);
  }

  function showCompanionSeparation() {
    const state = GAME.Engine.getState();
    const companions = state.fellowship.companions.filter(cid =>
      cid !== 'the_bearer' && cid !== 'the_stalwart'
    );

    if (companions.length === 0) {
      updateStatusMessage('No companions can leave the Fellowship.');
      return;
    }

    GAME.Renderer.showPhasePrompt(
      'Separate a companion from the Fellowship?',
      companions.map(cid => ({
        label: GAME.Characters[cid].name,
        action: 'separate_companion',
        data: { characterId: cid },
      })).concat([{ label: 'Cancel', action: 'cancel' }])
    );

    // Override prompt handler temporarily
    const origPromptHandler = handlePromptClick;
    const promptEl = document.getElementById('phase-prompt');
    const handler = (e) => {
      const btn = e.target.closest('.prompt-btn');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'separate_companion') {
        const data = JSON.parse(btn.dataset.data);
        const success = GAME.Engine.executeAction('move_character', { characterId: data.characterId, to: state.fellowship.position });
        if (success) {
          GAME.Renderer.hidePhasePrompt();
          resetSelection();
        }
      } else if (action === 'cancel') {
        GAME.Renderer.hidePhasePrompt();
        resetSelection();
      }
      promptEl.removeEventListener('click', handler);
    };
    promptEl.addEventListener('click', handler);
  }

  // ---- MUSTER ----
  function handleMuster(regionId) {
    const state = GAME.Engine.getState();
    const musterRegions = GAME.Engine.getMusterableRegions(state.activePlayer);

    if (!musterRegions.includes(regionId)) {
      updateStatusMessage('Cannot muster there!');
      return;
    }

    const regionDef = GAME.getRegion(regionId);
    const maxRegular = regionDef.settlement === 'stronghold' ? 2 : 1;
    const maxElite = regionDef.settlement === 'stronghold' ? 1 : 0;

    // Simple muster: max units
    const success = GAME.Engine.executeAction('muster_troops', {
      region: regionId,
      units: { regular: maxRegular, elite: maxElite },
    });

    if (success) {
      resetSelection();
    }
  }

  // ---- POLITICAL ----
  function showPoliticalOptions(state) {
    const side = state.activePlayer;
    const nations = Object.entries(GAME.Nations)
      .filter(([_, n]) => n.side === side)
      .filter(([id]) => state.nations[id] && state.nations[id].political < 3);

    if (nations.length === 0) {
      updateStatusMessage('All your nations are already at war!');
      GAME.Engine.executeAction('skip');
      return;
    }

    GAME.Renderer.showPhasePrompt(
      'Advance which nation\'s political track?',
      nations.map(([id, n]) => ({
        label: `${n.name} (${state.nations[id].political}/3)`,
        action: 'advance_political',
        data: { nation: id },
      }))
    );
  }

  // ---- CARD SELECTION ----
  function showCardSelection(state) {
    const cards = GAME.Engine.getPlayableCards(state.activePlayer);
    if (cards.length === 0) {
      updateStatusMessage('No cards to play!');
      GAME.Engine.executeAction('skip');
      return;
    }

    updateStatusMessage('Click a card in your hand to play it.');
    document.querySelectorAll('.card').forEach(el => el.classList.add('playable'));
  }

  // ---- HELPERS ----
  function highlightRegionsWithArmies(side) {
    const regions = GAME.Regions.filter(r => {
      const region = GAME.Engine.getState().regions[r.id];
      return GAME.Engine.getTotalUnits(r.id, side) > 0;
    }).map(r => r.id);
    GAME.Renderer.highlightRegions(regions, '#44cc44');
  }

  function highlightRegionsWithCharacters(side) {
    const state = GAME.Engine.getState();
    const regions = [];

    // Regions with characters
    GAME.Regions.forEach(r => {
      const chars = state.regions[r.id].characters.filter(cid => {
        const c = GAME.Characters[cid];
        return c && c.side === side;
      });
      if (chars.length > 0) regions.push(r.id);
    });

    // Fellowship position (for companion separation)
    if (side === 'dawn' && state.fellowship.companions.length > 2) {
      regions.push(state.fellowship.position);
    }

    GAME.Renderer.highlightRegions(regions, '#ff88ff');
  }

  function resetSelection() {
    currentAction = null;
    selectedFrom = null;
    selectedUnits = null;
    awaitingTarget = false;
    musterMode = false;
    charMoveId = null;
    hideUnitSelection();
    GAME.Renderer.clearHighlights();
    document.querySelectorAll('.die').forEach(d => d.classList.remove('selected'));
    document.querySelectorAll('.card').forEach(el => el.classList.remove('playable'));
  }

  function cancelAction() {
    resetSelection();
    GAME.Renderer.hideActionMenu();
    GAME.Engine.deselectDie();
    updateStatusMessage('Action cancelled. Select a die.');
  }

  function updateStatusMessage(msg) {
    const el = document.getElementById('status-message');
    if (el) el.textContent = msg;
  }

  return {
    init,
    cancelAction,
    resetSelection,
  };
})();
