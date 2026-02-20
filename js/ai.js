// ============================================================
// WAR OF THE RING - AI Opponent
// Basic AI for the Shadow forces
// ============================================================
window.GAME = window.GAME || {};

GAME.AI = (function() {
  const adjacencyMap = {};

  function init() {
    // Build adjacency map
    const adj = GAME.buildAdjacencyMap();
    Object.assign(adjacencyMap, adj);
  }

  function decideHuntAllocation(state) {
    // Allocate 0-2 extra dice based on fellowship progress
    if (state.fellowship.progress >= 3) return 2;
    if (state.fellowship.progress >= 1) return 1;
    return 0;
  }

  function takeTurn(state) {
    if (state.gameOver || state.activePlayer !== 'dusk') return;

    // Find available dice
    const availableDice = state.duskDice
      .map((d, i) => ({ ...d, index: i }))
      .filter(d => !d.used && d.face !== 'eye');

    if (availableDice.length === 0) return;

    // Pick a die (prioritize army > muster > character > event)
    const priority = ['army', 'army_muster', 'muster', 'character', 'event'];
    let selectedDie = null;
    for (const face of priority) {
      selectedDie = availableDice.find(d => d.face === face);
      if (selectedDie) break;
    }
    if (!selectedDie) selectedDie = availableDice[0];

    const success = GAME.Engine.selectDie(selectedDie.index, 'dusk');
    if (!success) {
      // Fallback: skip
      GAME.Engine.executeAction('skip');
      return;
    }

    const actions = GAME.Engine.getAvailableActions(selectedDie);

    // Decide action based on die face and game state
    let actionTaken = false;

    // Try army movement (attack or reinforcement)
    if (actions.includes('move_army')) {
      actionTaken = tryArmyMove(state);
    }

    // Try mustering
    if (!actionTaken && actions.includes('muster_troops')) {
      actionTaken = tryMuster(state);
    }

    // Try advance political
    if (!actionTaken && actions.includes('advance_political')) {
      actionTaken = tryAdvancePolitical(state);
    }

    // Try playing events
    if (!actionTaken && actions.includes('play_event')) {
      actionTaken = tryPlayEvent(state);
    }

    // Draw a card as fallback
    if (!actionTaken && actions.includes('draw_event')) {
      GAME.Engine.executeAction('draw_event');
      actionTaken = true;
    }

    if (!actionTaken) {
      GAME.Engine.executeAction('skip');
    }
  }

  function tryArmyMove(state) {
    // Find strongest dusk army that can attack a dawn region
    let bestMove = null;
    let bestScore = -Infinity;

    GAME.Regions.forEach(fromRegion => {
      const from = state.regions[fromRegion.id];
      const duskStrength = from.dusk.regular + from.dusk.elite * 2;
      if (duskStrength < 2) return; // Need some force

      const adjacent = adjacencyMap[fromRegion.id] || [];
      adjacent.forEach(toId => {
        const to = state.regions[toId];
        const toDef = GAME.getRegion(toId);
        if (!to || !toDef) return;

        let score = 0;

        // Attacking dawn region
        const dawnStrength = to.dawn.regular + to.dawn.elite * 2;
        if (dawnStrength > 0 && duskStrength > dawnStrength * 1.3) {
          score = toDef.vp * 10 + (duskStrength - dawnStrength) * 2;
          if (toDef.settlement === 'stronghold') score += 5;
          if (toDef.settlement === 'city') score += 3;
        }

        // Moving toward key targets (Sunspire, Thunder Gate, etc.)
        if (dawnStrength === 0 && to.controlled === 'dawn' && toDef.vp > 0) {
          score = toDef.vp * 5;
        }

        // Moving toward fellowship (if known)
        if (state.fellowship.revealed && toId === state.fellowship.position) {
          score += 15;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMove = {
            from: fromRegion.id,
            to: toId,
            units: {
              regular: Math.min(from.dusk.regular, 5),
              elite: from.dusk.elite,
              leaders: from.dusk.leaders,
              nazgul: from.dusk.nazgul,
            },
          };
        }
      });
    });

    if (bestMove && bestScore > 0) {
      // Leave 1 unit behind if in a settlement
      const fromDef = GAME.getRegion(bestMove.from);
      if (fromDef && fromDef.settlement && bestMove.units.regular > 1) {
        bestMove.units.regular -= 1;
      }

      return GAME.Engine.executeAction('move_army', bestMove);
    }

    // If no good attack, try to consolidate forces
    return tryConsolidate(state);
  }

  function tryConsolidate(state) {
    // Move small dusk armies toward larger ones
    let bestMove = null;
    let bestScore = -Infinity;

    GAME.Regions.forEach(fromRegion => {
      const from = state.regions[fromRegion.id];
      const duskCount = from.dusk.regular + from.dusk.elite;
      if (duskCount === 0 || duskCount > 4) return; // Only move small forces

      const adjacent = adjacencyMap[fromRegion.id] || [];
      adjacent.forEach(toId => {
        const to = state.regions[toId];
        if (!to) return;

        const toCount = to.dusk.regular + to.dusk.elite;
        const dawnCount = to.dawn.regular + to.dawn.elite;

        if (dawnCount > 0) return; // Don't walk into enemy unless strong enough

        // Score based on moving toward frontlines
        let score = toCount * 2; // Join larger forces
        const toDef = GAME.getRegion(toId);

        // Prefer moving west (toward Dawn lands)
        if (toDef && fromRegion) {
          score += (fromRegion.x - toDef.x) * 0.01; // Slight westward preference
        }

        if (score > bestScore) {
          bestScore = score;
          bestMove = {
            from: fromRegion.id,
            to: toId,
            units: {
              regular: from.dusk.regular,
              elite: from.dusk.elite,
              leaders: from.dusk.leaders,
              nazgul: 0,
            },
          };
        }
      });
    });

    if (bestMove && bestScore > 0) {
      return GAME.Engine.executeAction('move_army', bestMove);
    }
    return false;
  }

  function tryMuster(state) {
    // Find best region to muster in
    const musterRegions = GAME.Engine.getMusterableRegions('dusk');
    if (musterRegions.length === 0) return false;

    // Prioritize regions near the front
    let bestRegion = null;
    let bestScore = -Infinity;

    musterRegions.forEach(regionId => {
      const regionDef = GAME.getRegion(regionId);
      let score = 0;

      // Prefer strongholds (can muster more)
      if (regionDef.settlement === 'stronghold') score += 5;
      if (regionDef.settlement === 'city') score += 3;

      // Prefer regions with existing forces
      const duskForce = state.regions[regionId].dusk.regular + state.regions[regionId].dusk.elite;
      score += duskForce;

      // Prefer regions near Dawn territory
      const adjacent = adjacencyMap[regionId] || [];
      const nearDawn = adjacent.some(adj => {
        const adjDef = GAME.getRegion(adj);
        return adjDef && adjDef.nation && GAME.Nations[adjDef.nation] && GAME.Nations[adjDef.nation].side === 'dawn';
      });
      if (nearDawn) score += 10;

      if (score > bestScore) {
        bestScore = score;
        bestRegion = regionId;
      }
    });

    if (bestRegion) {
      const regionDef = GAME.getRegion(bestRegion);
      const maxRegular = regionDef.settlement === 'stronghold' ? 2 : 1;
      const maxElite = regionDef.settlement === 'stronghold' ? 1 : 0;
      return GAME.Engine.executeAction('muster_troops', {
        region: bestRegion,
        units: { regular: maxRegular, elite: maxElite },
      });
    }
    return false;
  }

  function tryAdvancePolitical(state) {
    const nations = Object.entries(GAME.Nations)
      .filter(([_, n]) => n.side === 'dusk')
      .filter(([id]) => state.nations[id] && state.nations[id].political < 3);

    if (nations.length === 0) return false;

    // Prioritize southern hordes (they start at 1 and have lots of troops)
    const target = nations.find(([id]) => id === 'southern') || nations[0];
    return GAME.Engine.executeAction('advance_political', { nation: target[0] });
  }

  function tryPlayEvent(state) {
    const cards = GAME.Engine.getPlayableCards('dusk');
    if (cards.length === 0) return false;

    // Play army or muster type cards preferentially
    const card = cards.find(c => c.type === 'army' || c.type === 'muster' || c.type === 'event') || cards[0];
    if (card && card.type !== 'combat') {
      return GAME.Engine.executeAction('play_event', { cardId: card.id });
    }
    return false;
  }

  return {
    init,
    decideHuntAllocation,
    takeTurn,
  };
})();
