// ============================================================
// THE SUNDERING WAR - Game Engine
// Core game state management and rules
// ============================================================
window.GAME = window.GAME || {};

GAME.Engine = (function() {
  let state = null;
  let adjacencyMap = null;
  const listeners = [];

  function emit(event, data) {
    listeners.forEach(fn => fn(event, data));
  }

  function on(fn) { listeners.push(fn); }

  // ---- INITIALIZATION ----
  function initGame(options = {}) {
    adjacencyMap = GAME.buildAdjacencyMap();

    state = {
      turn: 1,
      phase: 'setup', // setup, fellowship_phase, hunt_allocation, action_roll, action_resolution, combat, game_over
      activePlayer: 'dawn',
      actionSubPhase: null, // army_move, muster_select, fellowship_move, character_move, play_card, etc.

      // Action dice
      dawnDice: [],
      duskDice: [],
      dawnDiceCount: 4,
      duskDiceCount: 7,
      huntBox: 0,       // eye dice in hunt box
      huntDiceAllocated: 0, // additional dice allocated to hunt

      // Regions with armies
      regions: {},

      // Nations / Political
      nations: {},

      // Fellowship / Pilgrimage
      fellowship: {
        position: 'haven',
        lastKnown: 'haven',
        progress: 0,        // steps since last reveal
        revealed: true,      // starts revealed
        corruption: 0,       // 0-12
        companions: [],
        guide: 'the_archon',
        moved: false,        // moved this turn
        inShadowLands: false,
      },

      // Characters
      characters: {},

      // Cards
      dawnHand: [],
      duskHand: [],
      dawnDeck: [],
      duskDeck: [],
      dawnDiscard: [],
      duskDiscard: [],

      // Hunt
      huntTiles: [],
      huntReRolls: 0,

      // Reinforcement pools
      reinforcements: { dawn: {}, dusk: {} },

      // VP tracking
      dawnMilitaryVP: 0,
      duskMilitaryVP: 0,

      // Action tracking
      currentDie: null,   // the die being used
      actionsRemaining: { dawn: 0, dusk: 0 },
      passCount: { dawn: 0, dusk: 0 },
      selectedRegion: null,
      selectedArmy: null,
      movingFrom: null,
      combatState: null,

      // Game state
      gameOver: false,
      winner: null,
      winReason: null,
      log: [],
      turnHistory: [],
      isAI: options.duskIsAI !== false,
    };

    // Initialize regions
    GAME.Regions.forEach(r => {
      state.regions[r.id] = {
        id: r.id,
        dawn: { regular: 0, elite: 0, leaders: 0, nazgul: 0 },
        dusk: { regular: 0, elite: 0, leaders: 0, nazgul: 0 },
        characters: [],
        besieged: false,
        controlled: null, // dawn, dusk, or null
      };
    });

    // Place initial armies
    Object.entries(GAME.InitialArmies).forEach(([regionId, armies]) => {
      Object.entries(armies).forEach(([side, units]) => {
        Object.entries(units).forEach(([type, count]) => {
          if (state.regions[regionId]) {
            state.regions[regionId][side][type] = count;
          }
        });
      });
    });

    // Set initial control
    GAME.Regions.forEach(r => {
      if (r.nation && GAME.Nations[r.nation]) {
        state.regions[r.id].controlled = GAME.Nations[r.nation].side;
      }
    });

    // Initialize nations
    Object.entries(GAME.Nations).forEach(([id, n]) => {
      state.nations[id] = {
        id: id,
        political: n.politicalStart,
        atWar: n.politicalStart >= 3,
      };
    });

    // Initialize characters
    Object.entries(GAME.Characters).forEach(([id, c]) => {
      state.characters[id] = {
        id: id,
        location: c.startsWith || 'available',
        eliminated: false,
        upgraded: false,
      };
    });

    // Setup fellowship companions
    const companions = Object.entries(GAME.Characters)
      .filter(([_, c]) => c.startsWith === 'fellowship')
      .map(([id, _]) => id);
    state.fellowship.companions = companions;
    companions.forEach(id => { state.characters[id].location = 'fellowship'; });

    // Place Dusk characters
    Object.entries(GAME.Characters).forEach(([id, c]) => {
      if (c.side === 'dusk' && c.startsWith && c.startsWith !== 'fellowship') {
        state.characters[id].location = c.startsWith;
        if (state.regions[c.startsWith]) {
          state.regions[c.startsWith].characters.push(id);
        }
      }
    });

    // Initialize reinforcement pools
    Object.entries(GAME.ReinforcementPools).forEach(([side, nations]) => {
      state.reinforcements[side] = {};
      Object.entries(nations).forEach(([nationId, pool]) => {
        state.reinforcements[side][nationId] = { ...pool };
      });
    });

    // Initialize hunt tiles
    state.huntTiles = [...GAME.HuntTiles].sort(() => Math.random() - 0.5);

    // Initialize card decks
    state.dawnDeck = GAME.EventCards.dawn.map(c => c.id).sort(() => Math.random() - 0.5);
    state.duskDeck = GAME.EventCards.dusk.map(c => c.id).sort(() => Math.random() - 0.5);

    // Draw initial hands (4 cards each)
    for (let i = 0; i < 4; i++) {
      if (state.dawnDeck.length) state.dawnHand.push(state.dawnDeck.pop());
      if (state.duskDeck.length) state.duskHand.push(state.duskDeck.pop());
    }

    addLog('The Sundering War begins. The Pilgrimage sets out from Haven.');
    addLog('Dawn Covenant: Destroy the Shard at the Abyssal Forge.');
    addLog('Dusk Dominion: Corrupt the Bearer or conquer the Free Lands.');

    state.phase = 'fellowship_phase';
    emit('init', state);
    emit('phase_change', state.phase);
    return state;
  }

  // ---- LOGGING ----
  function addLog(msg) {
    state.log.push({ turn: state.turn, msg, time: Date.now() });
    emit('log', msg);
  }

  // ---- PHASE MANAGEMENT ----
  function advancePhase() {
    switch (state.phase) {
      case 'fellowship_phase':
        state.phase = 'hunt_allocation';
        addLog(`Turn ${state.turn}: Dusk allocates hunt dice.`);
        emit('phase_change', state.phase);
        break;

      case 'hunt_allocation':
        state.phase = 'action_roll';
        addLog(`Turn ${state.turn}: Roll the action dice!`);
        emit('phase_change', state.phase);
        break;

      case 'action_roll':
        rollAllDice();
        state.phase = 'action_resolution';
        state.activePlayer = 'dawn';
        state.actionsRemaining.dawn = state.dawnDice.filter(d => !d.used).length;
        state.actionsRemaining.dusk = state.duskDice.filter(d => !d.used && d.face !== 'eye').length;
        addLog('Action phase begins. Dawn acts first.');
        emit('phase_change', state.phase);
        break;

      case 'action_resolution':
        endTurn();
        break;
    }
  }

  // ---- DICE ----
  function rollDie(side) {
    const faces = GAME.DiceFaces[side];
    return faces[Math.floor(Math.random() * faces.length)];
  }

  function rollAllDice() {
    state.dawnDice = [];
    state.duskDice = [];

    for (let i = 0; i < state.dawnDiceCount; i++) {
      state.dawnDice.push({ face: rollDie('dawn'), used: false, id: i });
    }

    let eyeCount = 0;
    for (let i = 0; i < state.duskDiceCount; i++) {
      const face = rollDie('dusk');
      state.duskDice.push({ face, used: face === 'eye', id: i });
      if (face === 'eye') eyeCount++;
    }

    state.huntBox = eyeCount + state.huntDiceAllocated;
    state.huntDiceAllocated = 0;

    const dawnFaces = state.dawnDice.map(d => d.face).join(', ');
    const duskFaces = state.duskDice.map(d => d.face).join(', ');
    addLog(`Dawn rolls: ${dawnFaces}`);
    addLog(`Dusk rolls: ${duskFaces} (${eyeCount} eye dice to hunt box)`);

    emit('dice_rolled', { dawn: state.dawnDice, dusk: state.duskDice });
  }

  // ---- ACTION RESOLUTION ----
  function selectDie(dieIndex, side) {
    if (state.phase !== 'action_resolution') return false;
    if (side !== state.activePlayer) return false;

    const dice = side === 'dawn' ? state.dawnDice : state.duskDice;
    const die = dice[dieIndex];
    if (!die || die.used || die.face === 'eye') return false;

    state.currentDie = die;
    emit('die_selected', { die, side });
    return true;
  }

  function deselectDie() {
    state.currentDie = null;
    emit('die_deselected', {});
  }

  function getAvailableActions(die) {
    if (!die) return [];
    const actions = [];
    const face = die.face;

    if (face === 'character' || face === 'will_of_the_west') {
      actions.push('move_character');
      actions.push('move_fellowship');
      actions.push('play_character_card');
    }
    if (face === 'army' || face === 'army_muster' || face === 'will_of_the_west') {
      actions.push('move_army');
    }
    if (face === 'muster' || face === 'army_muster' || face === 'will_of_the_west') {
      actions.push('muster_troops');
      actions.push('advance_political');
    }
    if (face === 'event' || face === 'will_of_the_west') {
      actions.push('play_event');
      actions.push('draw_event');
    }

    return actions;
  }

  function executeAction(action, params = {}) {
    if (!state.currentDie) return false;

    let success = false;
    switch (action) {
      case 'move_army':
        success = moveArmy(params.from, params.to, params.units);
        break;
      case 'move_fellowship':
        success = moveFellowship(params.to);
        break;
      case 'move_character':
        success = moveCharacter(params.characterId, params.to);
        break;
      case 'muster_troops':
        success = musterTroops(params.region, params.units);
        break;
      case 'advance_political':
        success = advancePolitical(params.nation);
        break;
      case 'play_event':
        success = playEvent(params.cardId);
        break;
      case 'draw_event':
        success = drawEvent();
        break;
      case 'play_character_card':
        success = playEvent(params.cardId);
        break;
      case 'skip':
        success = true;
        addLog(`${state.activePlayer === 'dawn' ? 'Dawn' : 'Dusk'} passes.`);
        break;
    }

    if (success) {
      state.currentDie.used = true;
      state.currentDie = null;
      state.actionSubPhase = null;

      // Check victory after each action
      checkVictory();
      if (!state.gameOver) {
        nextAction();
      }
    }

    emit('action_executed', { action, success });
    return success;
  }

  function nextAction() {
    const dawnLeft = state.dawnDice.filter(d => !d.used).length;
    const duskLeft = state.duskDice.filter(d => !d.used && d.face !== 'eye').length;

    if (dawnLeft === 0 && duskLeft === 0) {
      advancePhase(); // End turn
      return;
    }

    // Switch to other player if they have dice
    if (state.activePlayer === 'dawn') {
      if (duskLeft > 0) {
        state.activePlayer = 'dusk';
      } else if (dawnLeft > 0) {
        state.activePlayer = 'dawn';
      }
    } else {
      if (dawnLeft > 0) {
        state.activePlayer = 'dawn';
      } else if (duskLeft > 0) {
        state.activePlayer = 'dusk';
      }
    }

    state.currentDie = null;
    emit('next_action', { activePlayer: state.activePlayer, dawnLeft, duskLeft });
  }

  // ---- ARMY MOVEMENT ----
  function moveArmy(from, to, units) {
    if (!from || !to || !units) return false;
    if (!adjacencyMap[from] || !adjacencyMap[from].includes(to)) return false;

    const side = state.activePlayer;
    const fromRegion = state.regions[from];
    const toRegion = state.regions[to];

    // Validate units available
    for (const [type, count] of Object.entries(units)) {
      if (count < 0 || fromRegion[side][type] < count) return false;
    }

    const totalMoving = Object.values(units).reduce((a, b) => a + b, 0);
    if (totalMoving === 0) return false;

    // Check stacking limit
    const currentInDest = toRegion[side].regular + toRegion[side].elite + toRegion[side].leaders + toRegion[side].nazgul;
    if (currentInDest + totalMoving > GAME.StackingLimits.maxUnitsPerRegion) return false;

    // Move units
    for (const [type, count] of Object.entries(units)) {
      fromRegion[side][type] -= count;
      toRegion[side][type] += count;
    }

    const unitStr = Object.entries(units).filter(([_,c]) => c > 0).map(([t,c]) => `${c} ${t}`).join(', ');
    addLog(`${side === 'dawn' ? 'Dawn' : 'Dusk'} moves ${unitStr} from ${GAME.getRegion(from).name} to ${GAME.getRegion(to).name}.`);

    // Check if entering enemy region -> combat
    const enemySide = side === 'dawn' ? 'dusk' : 'dawn';
    const enemyUnits = toRegion[enemySide].regular + toRegion[enemySide].elite;
    if (enemyUnits > 0) {
      initiateCombat(to, side);
    } else {
      // Check control change
      updateRegionControl(to);
    }

    emit('army_moved', { from, to, units, side });
    return true;
  }

  function getArmyMoveTargets(from) {
    if (!from || !adjacencyMap[from]) return [];
    return adjacencyMap[from];
  }

  function getTotalUnits(regionId, side) {
    const r = state.regions[regionId];
    return r[side].regular + r[side].elite + r[side].leaders + r[side].nazgul;
  }

  // ---- FELLOWSHIP MOVEMENT ----
  function moveFellowship(to) {
    if (state.activePlayer !== 'dawn') return false;
    if (!state.fellowship.position) return false;

    const from = state.fellowship.position;
    if (!adjacencyMap[from] || !adjacencyMap[from].includes(to)) return false;

    state.fellowship.position = to;
    state.fellowship.progress++;
    state.fellowship.revealed = false;
    state.fellowship.inShadowLands = GAME.ShadowRegions.includes(to);

    addLog(`The Pilgrimage moves secretly (${state.fellowship.progress} steps from last known position).`);

    // Hunt check
    resolveHunt();

    // Check if reached Abyssal Forge
    if (to === 'abyssal_forge') {
      addLog('The Pilgrimage reaches the Abyssal Forge!');
      if (state.fellowship.corruption < GAME.VictoryConditions.maxCorruption) {
        state.gameOver = true;
        state.winner = 'dawn';
        state.winReason = 'The Shard is cast into the Abyssal Forge! The Dawn Covenant is victorious!';
        emit('game_over', { winner: 'dawn', reason: state.winReason });
      }
    }

    emit('fellowship_moved', { from, to });
    return true;
  }

  function resolveHunt() {
    if (state.huntBox <= 0 && state.huntTiles.length === 0) return;

    // Roll hunt dice (1 die per hunt box, +1 if in shadow lands)
    let huntDice = state.huntBox;
    if (state.fellowship.inShadowLands) huntDice += 1;

    let successes = 0;
    const rolls = [];
    for (let i = 0; i < huntDice; i++) {
      const roll = Math.floor(Math.random() * 6) + 1;
      rolls.push(roll);
      if (roll >= 5) successes++;
    }

    // Also check: number of companions reduces hunt threshold
    const companionCount = state.fellowship.companions.length;
    const reRolls = Math.min(successes === 0 ? 1 : 0, companionCount > 0 ? 1 : 0);

    if (successes > 0 || state.fellowship.inShadowLands) {
      // Draw hunt tile
      if (state.huntTiles.length > 0) {
        const tile = state.huntTiles.pop();
        let damage = tile.damage + (state.fellowship.inShadowLands ? 1 : 0);

        // Reduce by guide level
        const guide = GAME.Characters[state.fellowship.guide];
        if (guide) {
          damage = Math.max(0, damage - guide.level > 2 ? 1 : 0);
        }

        state.fellowship.corruption += damage;
        addLog(`Hunt: Rolled [${rolls.join(', ')}] - "${tile.text}" - ${damage} corruption (total: ${state.fellowship.corruption}/${GAME.VictoryConditions.maxCorruption})`);

        if (tile.reveal) {
          state.fellowship.revealed = true;
          state.fellowship.lastKnown = state.fellowship.position;
          state.fellowship.progress = 0;
          addLog(`The Pilgrimage is revealed at ${GAME.getRegion(state.fellowship.position).name}!`);
        }

        // Check corruption victory
        if (state.fellowship.corruption >= GAME.VictoryConditions.maxCorruption) {
          state.gameOver = true;
          state.winner = 'dusk';
          state.winReason = 'The Bearer is consumed by shadow! The Dusk Dominion triumphs!';
          emit('game_over', { winner: 'dusk', reason: state.winReason });
        }

        emit('hunt_resolved', { tile, damage, rolls });
      }
    } else {
      addLog(`Hunt: Rolled [${rolls.join(', ')}] - The Pilgrimage slips past unseen.`);
    }
  }

  // ---- CHARACTER MOVEMENT ----
  function moveCharacter(characterId, to) {
    const charDef = GAME.Characters[characterId];
    const charState = state.characters[characterId];
    if (!charDef || !charState) return false;
    if (charState.eliminated) return false;
    if (charDef.side !== state.activePlayer) return false;

    const from = charState.location;
    if (from === 'fellowship') {
      // Leaving the fellowship (companion separation)
      return separateCompanion(characterId, to);
    }

    if (!adjacencyMap[from] || !adjacencyMap[from].includes(to)) return false;

    // Move character
    if (state.regions[from]) {
      const idx = state.regions[from].characters.indexOf(characterId);
      if (idx >= 0) state.regions[from].characters.splice(idx, 1);
    }
    charState.location = to;
    if (state.regions[to]) {
      state.regions[to].characters.push(characterId);
    }

    addLog(`${charDef.name} moves to ${GAME.getRegion(to).name}.`);
    emit('character_moved', { characterId, from, to });
    return true;
  }

  function separateCompanion(characterId, to) {
    const charDef = GAME.Characters[characterId];
    if (characterId === 'the_bearer' || characterId === 'the_stalwart') return false;

    const idx = state.fellowship.companions.indexOf(characterId);
    if (idx < 0) return false;

    state.fellowship.companions.splice(idx, 1);
    state.characters[characterId].location = to || state.fellowship.position;
    const regionId = to || state.fellowship.position;
    if (state.regions[regionId]) {
      state.regions[regionId].characters.push(characterId);
    }

    // Advance political track of companion's nation
    if (charDef.nation && state.nations[charDef.nation]) {
      const nation = state.nations[charDef.nation];
      if (nation.political < GAME.Nations[charDef.nation].maxPolitical) {
        nation.political = Math.min(nation.political + 1, 3);
        if (nation.political >= 3) nation.atWar = true;
        addLog(`${charDef.name}'s departure advances ${GAME.Nations[charDef.nation].name} politically (now ${nation.political}/3).`);
      }
    }

    addLog(`${charDef.name} leaves the Pilgrimage at ${GAME.getRegion(regionId).name}.`);

    // Update guide if needed
    if (characterId === state.fellowship.guide) {
      updateGuide();
    }

    emit('companion_separated', { characterId, regionId });
    return true;
  }

  function updateGuide() {
    // Priority: archon > heir > forest_lord > stone_king > shield_captain > wanderer
    const priority = ['the_archon', 'the_heir', 'the_forest_lord', 'the_stone_king', 'the_shield_captain', 'the_wanderer', 'the_stalwart'];
    for (const id of priority) {
      if (state.fellowship.companions.includes(id)) {
        state.fellowship.guide = id;
        addLog(`${GAME.Characters[id].name} now guides the Pilgrimage.`);
        return;
      }
    }
    state.fellowship.guide = null;
  }

  // ---- MUSTER ----
  function musterTroops(regionId, units) {
    const side = state.activePlayer;
    const region = state.regions[regionId];
    const regionDef = GAME.getRegion(regionId);
    if (!region || !regionDef) return false;

    // Must have a settlement
    if (!regionDef.settlement) return false;

    // Must be controlled by active player
    if (region.controlled !== side) return false;

    // Nation must be at war (or stronghold in active nation)
    const nationId = regionDef.nation;
    if (!nationId) return false;
    const nation = state.nations[nationId];
    if (!nation || !nation.atWar) return false;

    // Check reinforcement pool
    const sideNations = Object.entries(GAME.Nations).filter(([_, n]) => n.side === side).map(([id]) => id);
    const pool = state.reinforcements[side][nationId];
    if (!pool) return false;

    // Validate units
    const maxRegular = regionDef.settlement === 'stronghold' ? 2 : 1;
    const maxElite = regionDef.settlement === 'stronghold' ? 1 : 0;

    const regToAdd = Math.min(units.regular || 0, maxRegular, pool.regular);
    const eliteToAdd = Math.min(units.elite || 0, maxElite, pool.elite);

    if (regToAdd + eliteToAdd === 0) return false;

    // Check stacking
    const current = getTotalUnits(regionId, side);
    if (current + regToAdd + eliteToAdd > GAME.StackingLimits.maxUnitsPerRegion) return false;

    // Place units
    region[side].regular += regToAdd;
    region[side].elite += eliteToAdd;
    pool.regular -= regToAdd;
    pool.elite -= eliteToAdd;

    const parts = [];
    if (regToAdd > 0) parts.push(`${regToAdd} regular`);
    if (eliteToAdd > 0) parts.push(`${eliteToAdd} elite`);
    addLog(`${side === 'dawn' ? 'Dawn' : 'Dusk'} musters ${parts.join(' and ')} in ${regionDef.name}.`);

    emit('mustered', { regionId, units: { regular: regToAdd, elite: eliteToAdd }, side });
    return true;
  }

  function getMusterableRegions(side) {
    const results = [];
    GAME.Regions.forEach(r => {
      if (!r.settlement) return;
      const region = state.regions[r.id];
      if (region.controlled !== side) return;
      if (!r.nation) return;
      const nation = state.nations[r.nation];
      if (!nation || !nation.atWar) return;
      results.push(r.id);
    });
    return results;
  }

  // ---- POLITICAL TRACK ----
  function advancePolitical(nationId) {
    const side = state.activePlayer;
    const nationDef = GAME.Nations[nationId];
    if (!nationDef) return false;
    if (nationDef.side !== side) return false;

    const nation = state.nations[nationId];
    if (nation.political >= 3) return false;

    nation.political++;
    if (nation.political >= 3) {
      nation.atWar = true;
      addLog(`${nationDef.name} goes to war!`);
    } else {
      addLog(`${nationDef.name} political track advances to ${nation.political}/3.`);
    }

    emit('political_advanced', { nationId, political: nation.political });
    return true;
  }

  // ---- CARDS ----
  function drawEvent() {
    const side = state.activePlayer;
    const deck = side === 'dawn' ? state.dawnDeck : state.duskDeck;
    const hand = side === 'dawn' ? state.dawnHand : state.duskHand;

    if (deck.length === 0) {
      addLog(`${side === 'dawn' ? 'Dawn' : 'Dusk'} deck is empty!`);
      return true; // Still costs the action
    }

    const cardId = deck.pop();
    hand.push(cardId);
    addLog(`${side === 'dawn' ? 'Dawn' : 'Dusk'} draws a card.`);
    emit('card_drawn', { side, cardId });
    return true;
  }

  function playEvent(cardId) {
    const side = state.activePlayer;
    const hand = side === 'dawn' ? state.dawnHand : state.duskHand;
    const discard = side === 'dawn' ? state.dawnDiscard : state.duskDiscard;

    const idx = hand.indexOf(cardId);
    if (idx < 0) return false;

    const allCards = side === 'dawn' ? GAME.EventCards.dawn : GAME.EventCards.dusk;
    const card = allCards.find(c => c.id === cardId);
    if (!card) return false;

    // Apply card effect
    const applied = applyCardEffect(card, side);
    if (!applied) return false;

    hand.splice(idx, 1);
    discard.push(cardId);
    addLog(`${side === 'dawn' ? 'Dawn' : 'Dusk'} plays "${card.name}": ${card.text}`);
    emit('card_played', { side, card });
    return true;
  }

  function applyCardEffect(card, side) {
    switch (card.effect) {
      case 'remove_corruption':
        state.fellowship.corruption = Math.max(0, state.fellowship.corruption - (card.value || 1));
        return true;
      case 'add_corruption':
        state.fellowship.corruption = Math.min(12, state.fellowship.corruption + (card.value || 1));
        if (state.fellowship.corruption >= 12) {
          state.gameOver = true;
          state.winner = 'dusk';
          state.winReason = 'The Bearer is consumed by shadow!';
        }
        return true;
      case 'advance_political':
        if (card.nation && state.nations[card.nation]) {
          state.nations[card.nation].political = Math.min(3, state.nations[card.nation].political + (card.value || 1));
          if (state.nations[card.nation].political >= 3) state.nations[card.nation].atWar = true;
        }
        return true;
      case 'advance_political_multi':
        if (card.nations) {
          card.nations.forEach(n => {
            if (state.nations[n]) {
              state.nations[n].political = Math.min(3, state.nations[n].political + (card.value || 1));
              if (state.nations[n].political >= 3) state.nations[n].atWar = true;
            }
          });
        }
        return true;
      case 'reinforce':
        if (card.region && state.regions[card.region]) {
          const r = state.regions[card.region];
          const unitType = card.unitType || 'regular';
          r[side][unitType] += card.value || 1;
        }
        return true;
      case 'specific_reinforce':
        if (card.region && state.regions[card.region]) {
          const r = state.regions[card.region];
          if (card.regular) r[side].regular += card.regular;
          if (card.elite) r[side].elite += card.elite;
        }
        return true;
      case 'safe_move':
        // Store safe moves for next fellowship movement
        state.fellowship.safeMoves = card.value || 1;
        return true;
      case 'reveal_fellowship':
        state.fellowship.revealed = true;
        state.fellowship.lastKnown = state.fellowship.position;
        state.fellowship.progress = 0;
        state.fellowship.corruption++;
        return true;
      case 'reduce_political':
        // Find a Dawn nation and reduce
        const dawnNations = Object.entries(state.nations).filter(([id]) => GAME.Nations[id] && GAME.Nations[id].side === 'dawn' && state.nations[id].political > 0);
        if (dawnNations.length > 0) {
          // AI picks highest political nation
          dawnNations.sort((a, b) => b[1].political - a[1].political);
          const target = dawnNations[0][0];
          state.nations[target].political = Math.max(0, state.nations[target].political - (card.value || 1));
          if (state.nations[target].political < 3) state.nations[target].atWar = false;
        }
        return true;
      case 'mass_muster':
        // Add regulars to all dusk strongholds
        GAME.Regions.forEach(r => {
          if (r.settlement === 'stronghold' && r.nation && GAME.Nations[r.nation] && GAME.Nations[r.nation].side === 'dusk') {
            if (state.regions[r.id].controlled === 'dusk') {
              state.regions[r.id].dusk.regular += card.value || 2;
            }
          }
        });
        return true;
      case 'free_move':
      case 'double_attack':
      case 'double_muster':
      case 'sea_move':
      case 'corsair_raid':
      case 'ranger_ambush':
      case 'swift_journey':
      case 'tree_shepherd':
      case 'cancel_hunt':
      case 'remove_betrayer':
      case 'extra_hunt':
      case 'move_seekers':
      case 'remove_companion':
      case 'total_muster':
      case 'reinforce_stronghold':
      case 'fast_march':
      case 'reduce_political_war':
        // Simplified: just apply a generic benefit
        if (card.value && card.effect === 'extra_hunt') {
          state.huntBox += card.value;
        }
        return true;

      // Combat cards
      case 'combat_boost':
      case 'auto_hits':
      case 'reroll_misses':
      case 'siege_defense':
      case 'fear_retreat':
      case 'eliminate_leader':
        // These are stored and applied during combat
        if (state.combatState) {
          if (!state.combatState.combatCards) state.combatState.combatCards = [];
          state.combatState.combatCards.push(card);
        }
        return true;

      default:
        return true;
    }
  }

  function getPlayableCards(side) {
    const hand = side === 'dawn' ? state.dawnHand : state.duskHand;
    const allCards = side === 'dawn' ? GAME.EventCards.dawn : GAME.EventCards.dusk;
    return hand.map(id => allCards.find(c => c.id === id)).filter(Boolean);
  }

  // ---- COMBAT ----
  function initiateCombat(regionId, attackerSide) {
    const defenderSide = attackerSide === 'dawn' ? 'dusk' : 'dawn';
    const region = state.regions[regionId];
    const regionDef = GAME.getRegion(regionId);

    state.combatState = {
      regionId,
      attacker: attackerSide,
      defender: defenderSide,
      round: 1,
      isSiege: regionDef.settlement === 'stronghold' && region.controlled === defenderSide,
      attackerHits: 0,
      defenderHits: 0,
      combatCards: [],
      resolved: false,
    };

    addLog(`Battle at ${regionDef.name}! ${attackerSide === 'dawn' ? 'Dawn' : 'Dusk'} attacks!`);
    state.phase = 'combat';
    emit('combat_start', state.combatState);
  }

  function resolveCombatRound() {
    if (!state.combatState) return;

    const cs = state.combatState;
    const region = state.regions[cs.regionId];

    // Attacker rolls
    const atkRegular = region[cs.attacker].regular;
    const atkElite = region[cs.attacker].elite;
    const atkLeaders = region[cs.attacker].leaders + region[cs.attacker].nazgul;

    // Defender rolls
    const defRegular = region[cs.defender].regular;
    const defElite = region[cs.defender].elite;
    const defLeaders = region[cs.defender].leaders + region[cs.defender].nazgul;

    // Roll dice: regular hit on 5+, elite hit on 5+ (but roll +1 die for elites)
    let atkHits = 0;
    let defHits = 0;

    // Attacker: regulars
    for (let i = 0; i < atkRegular; i++) {
      if (Math.floor(Math.random() * 6) + 1 >= 5) atkHits++;
    }
    // Attacker: elites (hit on 5+, but count as better units)
    for (let i = 0; i < atkElite; i++) {
      if (Math.floor(Math.random() * 6) + 1 >= 5) atkHits++;
      // Bonus roll for elite
      if (Math.floor(Math.random() * 6) + 1 >= 5) atkHits++;
    }
    // Leader re-rolls (each leader gives 1 re-roll)
    for (let i = 0; i < atkLeaders; i++) {
      if (Math.floor(Math.random() * 6) + 1 >= 5) atkHits++;
    }

    // Defender: regulars
    for (let i = 0; i < defRegular; i++) {
      if (Math.floor(Math.random() * 6) + 1 >= 5) defHits++;
    }
    // Defender: elites
    for (let i = 0; i < defElite; i++) {
      if (Math.floor(Math.random() * 6) + 1 >= 5) defHits++;
      if (Math.floor(Math.random() * 6) + 1 >= 5) defHits++;
    }
    // Leader re-rolls
    for (let i = 0; i < defLeaders; i++) {
      if (Math.floor(Math.random() * 6) + 1 >= 5) defHits++;
    }

    // Siege bonus: defender gets +1 hit in stronghold
    if (cs.isSiege) {
      defHits += 1;
    }

    // Apply combat cards
    cs.combatCards.forEach(card => {
      if (card.effect === 'auto_hits') {
        if (card.id && card.id.startsWith('dc')) atkHits += card.value;
        else defHits += card.value;
      }
    });

    cs.attackerHits = atkHits;
    cs.defenderHits = defHits;

    // Apply casualties - remove regulars first, then elites
    applyCasualties(cs.regionId, cs.defender, atkHits);
    applyCasualties(cs.regionId, cs.attacker, defHits);

    addLog(`Combat Round ${cs.round}: Attacker deals ${atkHits} hits, Defender deals ${defHits} hits.`);

    // Check if combat continues
    const atkRemaining = region[cs.attacker].regular + region[cs.attacker].elite;
    const defRemaining = region[cs.defender].regular + region[cs.defender].elite;

    if (atkRemaining <= 0 || defRemaining <= 0) {
      endCombat();
    } else {
      cs.round++;
      emit('combat_round', cs);
    }
  }

  function applyCasualties(regionId, side, hits) {
    const region = state.regions[regionId];
    let remaining = hits;

    // Remove regulars first
    const regCas = Math.min(remaining, region[side].regular);
    region[side].regular -= regCas;
    remaining -= regCas;

    // Then elites
    const eliteCas = Math.min(remaining, region[side].elite);
    region[side].elite -= eliteCas;
    remaining -= eliteCas;

    // Then leaders (only if all combat units are gone)
    if (region[side].regular === 0 && region[side].elite === 0 && remaining > 0) {
      const leaderCas = Math.min(remaining, region[side].leaders);
      region[side].leaders -= leaderCas;
    }
  }

  function endCombat() {
    if (!state.combatState) return;
    const cs = state.combatState;
    const region = state.regions[cs.regionId];
    const regionDef = GAME.getRegion(cs.regionId);

    const atkRemaining = region[cs.attacker].regular + region[cs.attacker].elite;
    const defRemaining = region[cs.defender].regular + region[cs.defender].elite;

    if (defRemaining <= 0 && atkRemaining > 0) {
      addLog(`${cs.attacker === 'dawn' ? 'Dawn' : 'Dusk'} wins the battle at ${regionDef.name}!`);
      updateRegionControl(cs.regionId);
    } else if (atkRemaining <= 0) {
      addLog(`${cs.defender === 'dawn' ? 'Dawn' : 'Dusk'} successfully defends ${regionDef.name}!`);
    } else {
      addLog(`Battle at ${regionDef.name} ends in a stalemate.`);
    }

    cs.resolved = true;
    state.combatState = null;
    state.phase = 'action_resolution';
    checkVictory();
    emit('combat_end', cs);
  }

  function retreatFromCombat(side) {
    if (!state.combatState || state.combatState.resolved) return false;
    const cs = state.combatState;
    const region = state.regions[cs.regionId];

    if (side !== cs.attacker && side !== cs.defender) return false;

    // Find a valid retreat region
    const retreatOptions = adjacencyMap[cs.regionId].filter(rId => {
      const r = state.regions[rId];
      const enemy = side === 'dawn' ? 'dusk' : 'dawn';
      return (r[enemy].regular + r[enemy].elite) === 0;
    });

    if (retreatOptions.length === 0) return false;

    const retreatTo = retreatOptions[0]; // Simplified: retreat to first available
    const units = { ...region[side] };

    // Move all units to retreat region
    Object.keys(units).forEach(type => {
      state.regions[retreatTo][side][type] += region[side][type];
      region[side][type] = 0;
    });

    addLog(`${side === 'dawn' ? 'Dawn' : 'Dusk'} retreats from ${GAME.getRegion(cs.regionId).name} to ${GAME.getRegion(retreatTo).name}.`);

    endCombat();
    return true;
  }

  // ---- REGION CONTROL ----
  function updateRegionControl(regionId) {
    const region = state.regions[regionId];
    const regionDef = GAME.getRegion(regionId);
    const oldControl = region.controlled;

    const dawnPresence = region.dawn.regular + region.dawn.elite;
    const duskPresence = region.dusk.regular + region.dusk.elite;

    if (dawnPresence > 0 && duskPresence === 0) {
      region.controlled = 'dawn';
    } else if (duskPresence > 0 && dawnPresence === 0) {
      region.controlled = 'dusk';
    }

    // Check VP changes
    if (oldControl !== region.controlled && regionDef.vp > 0) {
      if (oldControl === 'dawn' && region.controlled === 'dusk') {
        state.duskMilitaryVP += regionDef.vp;
        addLog(`Dusk captures ${regionDef.name} (+${regionDef.vp} VP, total: ${state.duskMilitaryVP})`);
      } else if (oldControl === 'dusk' && region.controlled === 'dawn') {
        state.dawnMilitaryVP += regionDef.vp;
        addLog(`Dawn captures ${regionDef.name} (+${regionDef.vp} VP, total: ${state.dawnMilitaryVP})`);
      }

      // Also reduce the other side's VP if they had captured this before
      if (region.controlled === 'dawn' && regionDef.nation && GAME.Nations[regionDef.nation] && GAME.Nations[regionDef.nation].side === 'dusk') {
        // Dawn captured a Dusk settlement
      } else if (region.controlled === 'dusk' && regionDef.nation && GAME.Nations[regionDef.nation] && GAME.Nations[regionDef.nation].side === 'dawn') {
        // Dusk captured a Dawn settlement
      }

      emit('control_changed', { regionId, oldControl, newControl: region.controlled });
    }
  }

  // Recalculate all VPs from scratch
  function recalculateVP() {
    state.dawnMilitaryVP = 0;
    state.duskMilitaryVP = 0;

    GAME.Regions.forEach(r => {
      if (r.vp <= 0) return;
      const region = state.regions[r.id];
      const originalSide = r.nation && GAME.Nations[r.nation] ? GAME.Nations[r.nation].side : null;

      if (region.controlled === 'dawn' && originalSide === 'dusk') {
        state.dawnMilitaryVP += r.vp;
      } else if (region.controlled === 'dusk' && originalSide === 'dawn') {
        state.duskMilitaryVP += r.vp;
      }
    });
  }

  // ---- VICTORY ----
  function checkVictory() {
    if (state.gameOver) return;

    recalculateVP();

    // Dawn military victory
    if (state.dawnMilitaryVP >= GAME.VictoryConditions.dawnMilitaryVP) {
      state.gameOver = true;
      state.winner = 'dawn';
      state.winReason = `Dawn Covenant military victory! (${state.dawnMilitaryVP} VP captured)`;
      emit('game_over', { winner: 'dawn', reason: state.winReason });
      return;
    }

    // Dusk military victory
    if (state.duskMilitaryVP >= GAME.VictoryConditions.duskMilitaryVP) {
      state.gameOver = true;
      state.winner = 'dusk';
      state.winReason = `Dusk Dominion military victory! (${state.duskMilitaryVP} VP captured)`;
      emit('game_over', { winner: 'dusk', reason: state.winReason });
      return;
    }

    // Corruption victory (already checked in hunt/card resolution)
    if (state.fellowship.corruption >= GAME.VictoryConditions.maxCorruption) {
      state.gameOver = true;
      state.winner = 'dusk';
      state.winReason = 'The Bearer is consumed by shadow!';
      emit('game_over', { winner: 'dusk', reason: state.winReason });
    }
  }

  // ---- TURN MANAGEMENT ----
  function endTurn() {
    state.turn++;
    state.fellowship.moved = false;
    state.currentDie = null;
    state.actionSubPhase = null;
    state.passCount = { dawn: 0, dusk: 0 };

    addLog(`--- Turn ${state.turn} begins ---`);
    state.phase = 'fellowship_phase';
    emit('turn_end', { turn: state.turn });
    emit('phase_change', state.phase);
  }

  // ---- FELLOWSHIP PHASE ----
  function declareFellowship(action) {
    if (state.phase !== 'fellowship_phase') return false;

    switch (action) {
      case 'hide':
        if (state.fellowship.revealed) {
          state.fellowship.revealed = false;
          addLog('The Pilgrimage hides from sight.');
        }
        break;
      case 'declare':
        state.fellowship.revealed = true;
        state.fellowship.lastKnown = state.fellowship.position;
        state.fellowship.progress = 0;
        addLog(`Dawn declares the Pilgrimage at ${GAME.getRegion(state.fellowship.position).name}.`);
        break;
      case 'continue':
        addLog('The Pilgrimage continues its hidden journey.');
        break;
    }

    advancePhase();
    return true;
  }

  // ---- HUNT ALLOCATION ----
  function allocateHuntDice(count) {
    if (state.phase !== 'hunt_allocation') return false;
    state.huntDiceAllocated = Math.max(0, count);
    addLog(`Dusk allocates ${count} additional dice to the hunt.`);
    advancePhase();
    return true;
  }

  // ---- STATE EXPOSURE ----
  function getState() { return state; }
  function getPhase() { return state ? state.phase : null; }
  function getActivePlayer() { return state ? state.activePlayer : null; }

  function getRegionInfo(regionId) {
    const regionDef = GAME.getRegion(regionId);
    const regionState = state.regions[regionId];
    if (!regionDef || !regionState) return null;
    return { ...regionDef, ...regionState };
  }

  function isAdjacent(a, b) {
    return adjacencyMap[a] && adjacencyMap[a].includes(b);
  }

  function getAdjacent(regionId) {
    return adjacencyMap[regionId] || [];
  }

  function getFellowshipRegion() {
    return state ? state.fellowship.position : null;
  }

  // Expose game state for testing
  window.render_game_to_text = function() {
    if (!state) return JSON.stringify({ status: 'no_game' });
    return JSON.stringify({
      turn: state.turn,
      phase: state.phase,
      activePlayer: state.activePlayer,
      fellowship: {
        position: state.fellowship.position,
        corruption: state.fellowship.corruption,
        companions: state.fellowship.companions.length,
        revealed: state.fellowship.revealed,
      },
      dawnVP: state.dawnMilitaryVP,
      duskVP: state.duskMilitaryVP,
      dawnDice: state.dawnDice.filter(d => !d.used).map(d => d.face),
      duskDice: state.duskDice.filter(d => !d.used && d.face !== 'eye').map(d => d.face),
      huntBox: state.huntBox,
      gameOver: state.gameOver,
      winner: state.winner,
    }, null, 2);
  };

  return {
    initGame,
    getState,
    getPhase,
    getActivePlayer,
    getRegionInfo,
    isAdjacent,
    getAdjacent,
    getFellowshipRegion,
    advancePhase,
    selectDie,
    deselectDie,
    getAvailableActions,
    executeAction,
    moveArmy,
    moveFellowship,
    moveCharacter,
    musterTroops,
    advancePolitical,
    drawEvent,
    playEvent,
    declareFellowship,
    allocateHuntDice,
    resolveCombatRound,
    retreatFromCombat,
    endCombat,
    getArmyMoveTargets,
    getTotalUnits,
    getMusterableRegions,
    getPlayableCards,
    separateCompanion,
    addLog,
    on,
    recalculateVP,
  };
})();
