// ============================================================
// WAR OF THE RING - Game Data
// A digital adaptation of the classic board game
// ============================================================
window.GAME = window.GAME || {};

// ---- NATIONS ----
GAME.Nations = {
  // Free Peoples nations
  frosthold:  { name: 'The North',                side: 'dawn', politicalStart: 1, color: '#4a7c59', maxPolitical: 3 },
  verdantia:  { name: 'Elves',                    side: 'dawn', politicalStart: 2, color: '#2d6a4f', maxPolitical: 3 },
  deepforge:  { name: 'Dwarves',                  side: 'dawn', politicalStart: 2, color: '#8a7040', maxPolitical: 3 },
  windmere:   { name: 'Rohan',                    side: 'dawn', politicalStart: 1, color: '#6a8a2b', maxPolitical: 3 },
  solaris:    { name: 'Gondor',                    side: 'dawn', politicalStart: 1, color: '#3a6a9a', maxPolitical: 3 },
  // Shadow nations
  obsidian:   { name: 'Sauron',                    side: 'dusk', politicalStart: 3, color: '#8a1a1a', maxPolitical: 3 },
  dusk_spire: { name: 'Isengard',                  side: 'dusk', politicalStart: 3, color: '#5a4a5a', maxPolitical: 3 },
  southern:   { name: 'Southrons & Easterlings',   side: 'dusk', politicalStart: 1, color: '#8a5a2a', maxPolitical: 3 },
};

// ---- MAP REGIONS ----
GAME.Regions = [
  // THE NORTH (Shire & Arnor) - Northwest
  { id: 'meadowshire',    name: 'The Shire',        x: 130, y: 345, nation: 'frosthold', settlement: 'city',       vp: 1, terrain: 'plains' },
  { id: 'crossroads',     name: 'Bree',             x: 215, y: 305, nation: 'frosthold', settlement: 'town',       vp: 0, terrain: 'hills' },
  { id: 'westfold_hills', name: 'North Downs',      x: 170, y: 240, nation: 'frosthold', settlement: null,         vp: 0, terrain: 'hills' },
  { id: 'northwatch',     name: 'Weather Hills',    x: 275, y: 210, nation: 'frosthold', settlement: null,         vp: 0, terrain: 'hills' },
  { id: 'oldwatch',       name: 'Fornost',          x: 235, y: 160, nation: 'frosthold', settlement: null,         vp: 0, terrain: 'plains' },

  // ELVES
  { id: 'starfall',       name: 'Grey Havens',      x: 55,  y: 250, nation: 'verdantia', settlement: 'stronghold', vp: 2, terrain: 'coast' },
  { id: 'haven',          name: 'Rivendell',        x: 385, y: 195, nation: 'verdantia', settlement: 'stronghold', vp: 2, terrain: 'valley' },
  { id: 'crystal_falls',  name: 'Lothl\u00f3rien',  x: 575, y: 290, nation: 'verdantia', settlement: 'stronghold', vp: 2, terrain: 'forest' },
  { id: 'deepwood',       name: 'Woodland Realm',   x: 670, y: 130, nation: 'verdantia', settlement: 'stronghold', vp: 2, terrain: 'forest' },

  // DWARVES
  { id: 'blue_peaks',     name: 'Ered Luin',        x: 60,  y: 155, nation: 'deepforge', settlement: 'stronghold', vp: 2, terrain: 'mountain' },
  { id: 'deepforge_hold', name: 'Erebor',           x: 790, y: 80,  nation: 'deepforge', settlement: 'stronghold', vp: 2, terrain: 'mountain' },
  { id: 'ironridge',      name: 'Iron Hills',       x: 870, y: 140, nation: 'deepforge', settlement: null,         vp: 0, terrain: 'mountain' },

  // ROHAN
  { id: 'stormfords',     name: 'Fords of Isen',    x: 415, y: 415, nation: 'windmere',  settlement: null,         vp: 0, terrain: 'fords' },
  { id: 'windmere_city',  name: 'Edoras',           x: 475, y: 460, nation: 'windmere',  settlement: 'city',       vp: 1, terrain: 'plains' },
  { id: 'thunder_gate',   name: "Helm's Deep",      x: 370, y: 470, nation: 'windmere',  settlement: 'stronghold', vp: 2, terrain: 'fortress' },

  // GONDOR - South
  { id: 'sunspire',       name: 'Minas Tirith',     x: 660, y: 530, nation: 'solaris',   settlement: 'stronghold', vp: 2, terrain: 'city' },
  { id: 'bridgewatch',    name: 'Osgiliath',        x: 725, y: 490, nation: 'solaris',   settlement: null,         vp: 0, terrain: 'ruins' },
  { id: 'pearl_harbor',   name: 'Dol Amroth',       x: 490, y: 575, nation: 'solaris',   settlement: 'stronghold', vp: 2, terrain: 'coast' },
  { id: 'rivermount',     name: 'Pelargir',         x: 565, y: 620, nation: 'solaris',   settlement: 'city',       vp: 1, terrain: 'river' },
  { id: 'greendale',      name: 'Lossarnach',       x: 500, y: 535, nation: 'solaris',   settlement: null,         vp: 0, terrain: 'hills' },
  { id: 'brightfields',   name: 'Ithilien',         x: 595, y: 485, nation: 'solaris',   settlement: null,         vp: 0, terrain: 'plains' },
  { id: 'vale_of_erech',  name: 'Erech',            x: 420, y: 510, nation: 'solaris',   settlement: null,         vp: 0, terrain: 'valley' },
  { id: 'silverwood',     name: 'Emyn Muil',        x: 720, y: 420, nation: 'solaris',   settlement: null,         vp: 0, terrain: 'forest' },

  // Neutral/Passage regions
  { id: 'ridgepass',      name: 'Gap of Rohan',     x: 370, y: 370, nation: null,         settlement: null,         vp: 0, terrain: 'pass' },
  { id: 'high_pass',      name: 'High Pass',        x: 345, y: 250, nation: null,         settlement: null,         vp: 0, terrain: 'mountain' },
  { id: 'eregion',        name: 'Eregion',          x: 355, y: 305, nation: null,         settlement: null,         vp: 0, terrain: 'hills' },
  { id: 'ancient_wood',   name: 'Fangorn',          x: 500, y: 340, nation: null,         settlement: null,         vp: 0, terrain: 'forest' },
  { id: 'parth_galen',    name: 'Parth Galen',      x: 595, y: 365, nation: null,         settlement: null,         vp: 0, terrain: 'lake' },
  { id: 'dale',           name: 'Dale',             x: 755, y: 140, nation: null,         settlement: 'town',       vp: 0, terrain: 'town' },

  // ISENGARD
  { id: 'blighted_spire', name: 'Orthanc',          x: 455, y: 330, nation: 'dusk_spire', settlement: 'stronghold', vp: 2, terrain: 'tower' },

  // SAURON (Mordor)
  { id: 'dark_mines',     name: 'Moria',            x: 420, y: 260, nation: 'obsidian',  settlement: 'stronghold', vp: 2, terrain: 'mountain' },
  { id: 'shadow_keep',    name: 'Dol Guldur',       x: 700, y: 260, nation: 'obsidian',  settlement: 'stronghold', vp: 2, terrain: 'forest' },
  { id: 'iron_gate',      name: 'Morannon',         x: 870, y: 405, nation: 'obsidian',  settlement: 'stronghold', vp: 2, terrain: 'fortress' },
  { id: 'dread_spire',    name: 'Minas Morgul',     x: 815, y: 500, nation: 'obsidian',  settlement: 'stronghold', vp: 2, terrain: 'fortress' },
  { id: 'ashlands',       name: 'Gorgoroth',        x: 965, y: 430, nation: 'obsidian',  settlement: null,         vp: 0, terrain: 'wasteland' },
  { id: 'obsidian_citadel', name: 'Barad-d\u00fbr', x: 1040, y: 380, nation: 'obsidian', settlement: 'stronghold', vp: 2, terrain: 'fortress' },
  { id: 'abyssal_forge',  name: 'Mount Doom',       x: 995, y: 470, nation: 'obsidian',  settlement: null,         vp: 0, terrain: 'volcano' },
  { id: 'dark_marshes',   name: 'Dead Marshes',     x: 830, y: 365, nation: 'obsidian',  settlement: null,         vp: 0, terrain: 'marsh' },
  { id: 'nurn',           name: 'Nurn',             x: 985, y: 530, nation: 'obsidian',  settlement: null,         vp: 0, terrain: 'plains' },

  // SOUTHRONS & EASTERLINGS
  { id: 'corsair_port',   name: 'Umbar',            x: 645, y: 650, nation: 'southern',  settlement: 'stronghold', vp: 2, terrain: 'coast' },
  { id: 'southern_sands', name: 'Near Harad',       x: 755, y: 630, nation: 'southern',  settlement: 'city',       vp: 1, terrain: 'desert' },
  { id: 'deep_desert',    name: 'Far Harad',        x: 845, y: 670, nation: 'southern',  settlement: 'city',       vp: 1, terrain: 'desert' },
  { id: 'steppes',        name: 'Rh\u00fbn',        x: 905, y: 265, nation: 'southern',  settlement: 'city',       vp: 1, terrain: 'steppe' },
  { id: 'eastern_wastes', name: 'East Rh\u00fbn',   x: 965, y: 310, nation: 'southern',  settlement: 'city',       vp: 1, terrain: 'wasteland' },
];

// ---- MAP CONNECTIONS ----
GAME.Connections = [
  // The North internal
  ['starfall', 'blue_peaks'],
  ['starfall', 'meadowshire'],
  ['blue_peaks', 'westfold_hills'],
  ['meadowshire', 'westfold_hills'],
  ['meadowshire', 'crossroads'],
  ['crossroads', 'westfold_hills'],
  ['crossroads', 'northwatch'],
  ['westfold_hills', 'northwatch'],
  ['westfold_hills', 'oldwatch'],
  ['northwatch', 'oldwatch'],
  ['northwatch', 'haven'],
  ['oldwatch', 'haven'],

  // Rivendell area
  ['haven', 'high_pass'],
  ['haven', 'eregion'],
  ['high_pass', 'dark_mines'],
  ['high_pass', 'eregion'],
  ['eregion', 'dark_mines'],
  ['eregion', 'ridgepass'],
  ['eregion', 'blighted_spire'],

  // Northeast (Elves & Dwarves)
  ['deepwood', 'dale'],
  ['dale', 'deepforge_hold'],
  ['dale', 'ironridge'],
  ['dale', 'crystal_falls'],
  ['deepforge_hold', 'ironridge'],
  ['deepwood', 'crystal_falls'],
  ['deepwood', 'shadow_keep'],
  ['ironridge', 'shadow_keep'],
  ['ironridge', 'steppes'],

  // Central (Isengard area)
  ['dark_mines', 'blighted_spire'],
  ['blighted_spire', 'ancient_wood'],
  ['blighted_spire', 'ridgepass'],
  ['ancient_wood', 'crystal_falls'],
  ['ancient_wood', 'parth_galen'],
  ['ancient_wood', 'ridgepass'],

  // Parth Galen connections
  ['parth_galen', 'crystal_falls'],
  ['parth_galen', 'silverwood'],
  ['parth_galen', 'shadow_keep'],
  ['parth_galen', 'dark_marshes'],

  // Rohan
  ['ridgepass', 'crossroads'],
  ['ridgepass', 'stormfords'],
  ['stormfords', 'windmere_city'],
  ['stormfords', 'thunder_gate'],
  ['windmere_city', 'thunder_gate'],
  ['windmere_city', 'brightfields'],

  // Gondor
  ['thunder_gate', 'vale_of_erech'],
  ['vale_of_erech', 'greendale'],
  ['vale_of_erech', 'pearl_harbor'],
  ['greendale', 'brightfields'],
  ['greendale', 'pearl_harbor'],
  ['greendale', 'rivermount'],
  ['brightfields', 'sunspire'],
  ['sunspire', 'bridgewatch'],
  ['sunspire', 'rivermount'],
  ['pearl_harbor', 'rivermount'],
  ['bridgewatch', 'silverwood'],

  // Eastern approaches (to Mordor)
  ['shadow_keep', 'dark_marshes'],
  ['silverwood', 'dread_spire'],
  ['silverwood', 'dark_marshes'],
  ['dark_marshes', 'iron_gate'],
  ['dark_marshes', 'dread_spire'],
  ['bridgewatch', 'dread_spire'],

  // Mordor interior
  ['iron_gate', 'ashlands'],
  ['iron_gate', 'dread_spire'],
  ['dread_spire', 'ashlands'],
  ['ashlands', 'obsidian_citadel'],
  ['ashlands', 'abyssal_forge'],
  ['ashlands', 'nurn'],
  ['obsidian_citadel', 'abyssal_forge'],
  ['abyssal_forge', 'nurn'],

  // Eastern allies
  ['iron_gate', 'steppes'],
  ['steppes', 'eastern_wastes'],
  ['eastern_wastes', 'obsidian_citadel'],
  ['eastern_wastes', 'dark_marshes'],

  // Southern allies
  ['corsair_port', 'southern_sands'],
  ['corsair_port', 'rivermount'],
  ['southern_sands', 'deep_desert'],
  ['southern_sands', 'dread_spire'],
  ['deep_desert', 'nurn'],
];

// ---- CHARACTERS ----
GAME.Characters = {
  // Free Peoples Companions (Fellowship)
  the_bearer:      { name: 'Frodo',             side: 'dawn', type: 'companion', level: 0, leadership: 0, startsWith: 'fellowship', ability: 'ring_bearer', nation: null },
  the_stalwart:    { name: 'Sam',               side: 'dawn', type: 'companion', level: 0, leadership: 0, startsWith: 'fellowship', ability: 'loyal_guard', nation: null },
  the_heir:        { name: 'Strider',           side: 'dawn', type: 'companion', level: 3, leadership: 2, startsWith: 'fellowship', ability: 'rightful_king', nation: 'solaris' },
  the_archon:      { name: 'Gandalf the Grey',  side: 'dawn', type: 'companion', level: 3, leadership: 1, startsWith: 'fellowship', ability: 'arcane_power', nation: null },
  the_forest_lord: { name: 'Legolas',           side: 'dawn', type: 'companion', level: 2, leadership: 1, startsWith: 'fellowship', ability: 'keen_eye', nation: 'verdantia' },
  the_stone_king:  { name: 'Gimli',             side: 'dawn', type: 'companion', level: 2, leadership: 1, startsWith: 'fellowship', ability: 'stout_heart', nation: 'deepforge' },
  the_shield_captain: { name: 'Boromir',        side: 'dawn', type: 'companion', level: 2, leadership: 1, startsWith: 'fellowship', ability: 'valor', nation: 'solaris' },
  the_wanderer:    { name: 'Pippin',            side: 'dawn', type: 'companion', level: 1, leadership: 1, startsWith: 'fellowship', ability: 'scouting', nation: 'frosthold' },

  // Free Peoples characters (not in fellowship)
  the_shield_maiden: { name: '\u00c9owyn',      side: 'dawn', type: 'character', level: 2, leadership: 1, startsWith: null, ability: 'fearless', nation: 'windmere' },
  the_tree_shepherd: { name: 'Treebeard',       side: 'dawn', type: 'character', level: 3, leadership: 0, startsWith: null, ability: 'ancient_wrath', nation: null },

  // Shadow characters
  the_witch_lord:  { name: 'The Witch-king',    side: 'dusk', type: 'seeker',    level: 3, leadership: 2, startsWith: 'dread_spire', ability: 'terror' },
  seeker_2:        { name: 'Nazg\u00fbl',       side: 'dusk', type: 'seeker',    level: 2, leadership: 1, startsWith: 'dread_spire', ability: null },
  seeker_3:        { name: 'Nazg\u00fbl',       side: 'dusk', type: 'seeker',    level: 2, leadership: 1, startsWith: 'obsidian_citadel', ability: null },
  seeker_4:        { name: 'Nazg\u00fbl',       side: 'dusk', type: 'seeker',    level: 1, leadership: 1, startsWith: 'shadow_keep', ability: null },
  seeker_5:        { name: 'Kham\u00fbl',       side: 'dusk', type: 'seeker',    level: 1, leadership: 1, startsWith: 'iron_gate', ability: null },
  the_betrayer:    { name: 'Saruman',           side: 'dusk', type: 'character', level: 3, leadership: 1, startsWith: 'blighted_spire', ability: 'corruption' },
  the_baleful:     { name: 'The Balrog',        side: 'dusk', type: 'character', level: 3, leadership: 0, startsWith: 'dark_mines', ability: 'flame_shadow' },
};

// ---- ACTION DICE FACES ----
GAME.DiceFaces = {
  dawn: ['character', 'army', 'muster', 'event', 'will_of_the_west', 'army_muster'],
  dusk: ['character', 'army', 'muster', 'event', 'army_muster', 'eye'],
};

GAME.DiceIcons = {
  character: '\u2694',      // Swords
  army: '\u265F',           // Pawn/soldier
  muster: '\u2691',         // Flag
  event: '\u2605',          // Star
  will_of_the_west: '\u2600', // Sun (wild)
  army_muster: '\u265F\u2691', // Combined
  eye: '\u25C9',            // Eye of Sauron
};

// ---- INITIAL ARMY SETUP ----
GAME.InitialArmies = {
  // Free Peoples forces
  haven:          { dawn: { regular: 2, elite: 0, leaders: 0, nazgul: 0 } },
  starfall:       { dawn: { regular: 1, elite: 0, leaders: 0, nazgul: 0 } },
  blue_peaks:     { dawn: { regular: 1, elite: 1, leaders: 0, nazgul: 0 } },
  deepwood:       { dawn: { regular: 1, elite: 1, leaders: 0, nazgul: 0 } },
  crystal_falls:  { dawn: { regular: 1, elite: 1, leaders: 0, nazgul: 0 } },
  deepforge_hold: { dawn: { regular: 2, elite: 1, leaders: 0, nazgul: 0 } },
  ironridge:      { dawn: { regular: 1, elite: 0, leaders: 0, nazgul: 0 } },
  dale:           { dawn: { regular: 1, elite: 0, leaders: 0, nazgul: 0 } },
  windmere_city:  { dawn: { regular: 1, elite: 0, leaders: 0, nazgul: 0 } },
  thunder_gate:   { dawn: { regular: 2, elite: 1, leaders: 0, nazgul: 0 } },
  sunspire:       { dawn: { regular: 3, elite: 1, leaders: 1, nazgul: 0 } },
  pearl_harbor:   { dawn: { regular: 2, elite: 1, leaders: 0, nazgul: 0 } },
  rivermount:     { dawn: { regular: 1, elite: 0, leaders: 0, nazgul: 0 } },
  bridgewatch:    { dawn: { regular: 2, elite: 0, leaders: 0, nazgul: 0 } },

  // Shadow forces
  blighted_spire:   { dusk: { regular: 4, elite: 1, leaders: 0, nazgul: 0 } },
  dark_mines:       { dusk: { regular: 2, elite: 0, leaders: 0, nazgul: 0 } },
  shadow_keep:      { dusk: { regular: 3, elite: 1, leaders: 0, nazgul: 1 } },
  iron_gate:        { dusk: { regular: 5, elite: 1, leaders: 0, nazgul: 1 } },
  dread_spire:      { dusk: { regular: 3, elite: 1, leaders: 0, nazgul: 2 } },
  obsidian_citadel: { dusk: { regular: 4, elite: 2, leaders: 0, nazgul: 1 } },
  ashlands:         { dusk: { regular: 2, elite: 0, leaders: 0, nazgul: 0 } },
  nurn:             { dusk: { regular: 2, elite: 0, leaders: 0, nazgul: 0 } },
  corsair_port:     { dusk: { regular: 2, elite: 0, leaders: 0, nazgul: 0 } },
  southern_sands:   { dusk: { regular: 2, elite: 0, leaders: 0, nazgul: 0 } },
  deep_desert:      { dusk: { regular: 2, elite: 1, leaders: 0, nazgul: 0 } },
  steppes:          { dusk: { regular: 2, elite: 0, leaders: 0, nazgul: 0 } },
  eastern_wastes:   { dusk: { regular: 2, elite: 0, leaders: 0, nazgul: 0 } },
};

// ---- REINFORCEMENT POOLS ----
GAME.ReinforcementPools = {
  dawn: {
    frosthold:  { regular: 3, elite: 2, leaders: 1 },
    verdantia:  { regular: 3, elite: 3, leaders: 1 },
    deepforge:  { regular: 3, elite: 2, leaders: 1 },
    windmere:   { regular: 4, elite: 2, leaders: 1 },
    solaris:    { regular: 5, elite: 3, leaders: 2 },
  },
  dusk: {
    obsidian:   { regular: 8, elite: 4, leaders: 2 },
    dusk_spire: { regular: 4, elite: 2, leaders: 1 },
    southern:   { regular: 5, elite: 2, leaders: 1 },
  },
};

// ---- HUNT TILES ----
GAME.HuntTiles = [
  { id: 'h1', damage: 0, reveal: false, special: 'eye', text: 'Lost in shadows' },
  { id: 'h2', damage: 0, reveal: false, special: 'eye', text: 'False trail' },
  { id: 'h3', damage: 1, reveal: false, special: null, text: 'Shadow whispers' },
  { id: 'h4', damage: 1, reveal: false, special: null, text: 'Dark echo' },
  { id: 'h5', damage: 1, reveal: true,  special: null, text: 'Glimpsed!' },
  { id: 'h6', damage: 2, reveal: false, special: null, text: 'Creeping dread' },
  { id: 'h7', damage: 2, reveal: false, special: null, text: 'Nightmare' },
  { id: 'h8', damage: 2, reveal: true,  special: null, text: 'Spotted!' },
  { id: 'h9', damage: 3, reveal: true,  special: null, text: 'Ambush!' },
  { id: 'h10', damage: 3, reveal: true,  special: null, text: 'Found!' },
  { id: 'h11', damage: 1, reveal: false, special: 'eye', text: 'Distant gaze' },
  { id: 'h12', damage: 0, reveal: true,  special: 'sheltered', text: 'Safe haven' },
  { id: 'h13', damage: 1, reveal: false, special: null, text: 'Weariness' },
  { id: 'h14', damage: 2, reveal: true,  special: null, text: 'Dark pursuit' },
  { id: 'h15', damage: 1, reveal: false, special: null, text: 'Shadow grows' },
  { id: 'h16', damage: 3, reveal: true,  special: 'wound', text: 'Dire wound!' },
];

// ---- SHADOW REGIONS (for hunt modifiers) ----
GAME.ShadowRegions = ['dark_mines', 'shadow_keep', 'iron_gate', 'dread_spire', 'ashlands',
  'obsidian_citadel', 'abyssal_forge', 'dark_marshes', 'nurn', 'blighted_spire'];

// ---- EVENT CARDS ----
GAME.EventCards = {
  dawn: [
    { id: 'dc1',  name: "Gandalf's Staff",        type: 'character', text: 'Remove 1 corruption from the Fellowship.', effect: 'remove_corruption', value: 1 },
    { id: 'dc2',  name: 'Ride of the Rohirrim',   type: 'army',      text: 'Move 2 Rohan armies for free.', effect: 'free_move', nation: 'windmere', value: 2 },
    { id: 'dc3',  name: "Aragorn's Claim",        type: 'character', text: 'Advance Gondor political track by 2.', effect: 'advance_political', nation: 'solaris', value: 2, condition: 'heir_separated' },
    { id: 'dc4',  name: 'Dwarves Rally',          type: 'army',      text: 'Add 2 elite units to any Dwarven settlement.', effect: 'reinforce', nation: 'deepforge', unitType: 'elite', value: 2 },
    { id: 'dc5',  name: 'The Last Alliance',      type: 'muster',    text: 'Advance Elves and Dwarves political tracks by 1.', effect: 'advance_political_multi', nations: ['verdantia', 'deepforge'], value: 1 },
    { id: 'dc6',  name: 'Secret Paths',           type: 'character', text: 'Move the Fellowship 2 steps without a hunt roll.', effect: 'safe_move', value: 2 },
    { id: 'dc7',  name: 'Rally of the Free',      type: 'muster',    text: 'Muster troops in any 2 Free Peoples settlements.', effect: 'double_muster' },
    { id: 'dc8',  name: 'Ents Awaken',            type: 'event',     text: 'Destroy all Shadow units in Fangorn. Place Treebeard there.', effect: 'tree_shepherd', region: 'ancient_wood' },
    { id: 'dc9',  name: 'Shield Wall',            type: 'combat',    text: 'In battle: All your regulars hit on 4+ this round.', effect: 'combat_boost', hitOn: 4 },
    { id: 'dc10', name: 'Heroic Charge',          type: 'combat',    text: 'In battle: Deal 2 automatic hits.', effect: 'auto_hits', value: 2 },
    { id: 'dc11', name: 'Fortify the Walls',      type: 'army',      text: 'Add 3 regular units to any Free Peoples stronghold.', effect: 'reinforce_stronghold', value: 3 },
    { id: 'dc12', name: 'Hope Endures',           type: 'event',     text: 'Remove 2 corruption from the Fellowship.', effect: 'remove_corruption', value: 2, condition: 'corruption_gte_4' },
    { id: 'dc13', name: 'Grey Havens Fleet',      type: 'army',      text: 'Move any Free Peoples army to a coastal region.', effect: 'sea_move' },
    { id: 'dc14', name: 'Vigilant Watch',         type: 'character', text: 'Cancel one hunt result. Draw a new tile.', effect: 'cancel_hunt' },
    { id: 'dc15', name: 'Breaking of Isengard',   type: 'event',     text: 'If Orthanc is Free Peoples-controlled, remove Saruman.', effect: 'remove_betrayer', condition: 'blighted_spire_dawn' },
    { id: 'dc16', name: 'Desperate Valor',        type: 'combat',    text: 'In battle: Re-roll all misses once.', effect: 'reroll_misses' },
    { id: 'dc17', name: 'Dol Amroth Rally',       type: 'muster',    text: 'Recruit 2 regular and 1 elite in Dol Amroth.', effect: 'specific_reinforce', region: 'pearl_harbor', regular: 2, elite: 1 },
    { id: 'dc18', name: 'Rangers of the North',   type: 'character', text: 'Place 2 Northern regulars in any region with a Free Peoples character.', effect: 'ranger_ambush', nation: 'frosthold', value: 2 },
    { id: 'dc19', name: 'Defiance',               type: 'combat',    text: 'In siege: Defender rolls +2 dice this round.', effect: 'siege_defense', value: 2 },
    { id: 'dc20', name: 'Swift Journey',          type: 'character', text: 'Move the Fellowship 3 steps. Hunt rolls are at -1.', effect: 'swift_journey', value: 3 },
  ],
  dusk: [
    { id: 'sc1',  name: 'Shadow Grows',           type: 'event',     text: 'Add 1 corruption to the Fellowship.', effect: 'add_corruption', value: 1 },
    { id: 'sc2',  name: 'Nazg\u00fbl Unleashed',  type: 'character', text: 'Move all Nazg\u00fbl up to 2 regions each.', effect: 'move_seekers', value: 2 },
    { id: 'sc3',  name: 'Mustering of the Hordes', type: 'muster',   text: 'Recruit 3 regulars in each Shadow stronghold.', effect: 'mass_muster', value: 3 },
    { id: 'sc4',  name: 'Corruption Spreads',     type: 'event',     text: 'Add 2 corruption to the Fellowship.', effect: 'add_corruption', value: 2, condition: 'corruption_gte_3' },
    { id: 'sc5',  name: "Saruman's Voice",        type: 'character', text: "Reduce a Free Peoples nation's political track by 1.", effect: 'reduce_political', value: 1 },
    { id: 'sc6',  name: 'Siege Engines',          type: 'combat',    text: 'In siege: Attacker deals 3 automatic hits.', effect: 'auto_hits', value: 3 },
    { id: 'sc7',  name: 'Dark Ritual',            type: 'event',     text: 'Place 2 elite Shadow units in Barad-d\u00fbr.', effect: 'reinforce', region: 'obsidian_citadel', unitType: 'elite', value: 2 },
    { id: 'sc8',  name: 'Relentless Assault',     type: 'army',      text: 'Move 2 Shadow armies. Each can attack.', effect: 'double_attack' },
    { id: 'sc9',  name: 'Terror of the Witch-king', type: 'combat',  text: 'In battle: Eliminate 1 Free Peoples leader before combat.', effect: 'eliminate_leader' },
    { id: 'sc10', name: 'The Eye Sees All',       type: 'event',     text: 'Reveal the Fellowship. Add 1 corruption.', effect: 'reveal_fellowship' },
    { id: 'sc11', name: 'Southern March',         type: 'army',      text: 'Advance Southrons & Easterlings political track by 2.', effect: 'advance_political', nation: 'southern', value: 2 },
    { id: 'sc12', name: 'Dread and Despair',      type: 'event',     text: 'A Free Peoples nation at war reduces by 1 political step.', effect: 'reduce_political_war', value: 1 },
    { id: 'sc13', name: 'Blinding Speed',         type: 'army',      text: 'Move one Shadow army 3 regions instead of 2.', effect: 'fast_march', value: 3 },
    { id: 'sc14', name: 'Orc Horde',              type: 'muster',    text: 'Place 4 regular units in Morannon.', effect: 'specific_reinforce', region: 'iron_gate', regular: 4, elite: 0 },
    { id: 'sc15', name: 'Shadow of Fear',         type: 'combat',    text: 'In battle: Free Peoples must retreat or take 2 extra hits.', effect: 'fear_retreat', value: 2 },
    { id: 'sc16', name: 'Poisoned Whispers',      type: 'character', text: 'Remove one companion from the Fellowship.', effect: 'remove_companion' },
    { id: 'sc17', name: 'Iron Fist',              type: 'muster',    text: 'Recruit in all Shadow settlements with armies.', effect: 'total_muster' },
    { id: 'sc18', name: 'Corsair Raiders',        type: 'army',      text: 'Move Corsair army to any coastal Free Peoples region.', effect: 'corsair_raid' },
    { id: 'sc19', name: 'Dark Sorcery',           type: 'combat',    text: 'In battle: All your elites hit on 4+ this round.', effect: 'combat_boost', hitOn: 4 },
    { id: 'sc20', name: "Sauron's Will",          type: 'event',     text: 'Place 2 Eye results in the hunt box.', effect: 'extra_hunt', value: 2 },
  ],
};

// ---- STACKING LIMITS ----
GAME.StackingLimits = {
  maxUnitsPerRegion: 10,
  maxLeadersPerRegion: 2,
  maxNazgulPerRegion: 5,
};

// ---- VICTORY CONDITIONS ----
GAME.VictoryConditions = {
  dawnMilitaryVP: 4,      // VP needed for Free Peoples military victory
  duskMilitaryVP: 10,     // VP needed for Shadow military victory
  maxCorruption: 12,      // Corruption that defeats Free Peoples
};

// ---- TERRAIN DISPLAY ----
GAME.TerrainColors = {
  plains:    '#8fbc6a',
  hills:     '#a89060',
  mountain:  '#8a7d6a',
  forest:    '#4a7c4b',
  coast:     '#5b9bba',
  valley:    '#7fb069',
  fortress:  '#6a5a4a',
  ruins:     '#7a7a6a',
  fords:     '#6aaa8a',
  pass:      '#9a8a6a',
  tower:     '#5a4a5a',
  city:      '#baa040',
  lake:      '#5a8aaa',
  town:      '#aa9060',
  marsh:     '#5a7a5a',
  wasteland: '#6a4a3a',
  volcano:   '#aa3a1a',
  desert:    '#caa860',
  steppe:    '#9a8a50',
  river:     '#5a8a9a',
};

// ---- SIDE DISPLAY NAMES ----
GAME.SideNames = {
  dawn: 'Free Peoples',
  dusk: 'Shadow',
};

// ---- SIDE COLORS ----
GAME.SideColors = {
  dawn: { primary: '#3a7abf', secondary: '#1a4a7f', bg: '#e8eef4', text: '#1a2a3a', light: '#b0c8e0' },
  dusk: { primary: '#8b1a1a', secondary: '#4a1942', bg: '#2a1a2a', text: '#e8d8c8', light: '#6a3a3a' },
};

// Helper: build adjacency map
GAME.buildAdjacencyMap = function() {
  const adj = {};
  GAME.Regions.forEach(r => { adj[r.id] = []; });
  GAME.Connections.forEach(([a, b]) => {
    if (adj[a] && adj[b]) {
      if (!adj[a].includes(b)) adj[a].push(b);
      if (!adj[b].includes(a)) adj[b].push(a);
    }
  });
  return adj;
};

// Helper: get region by id
GAME.getRegion = function(id) {
  return GAME.Regions.find(r => r.id === id);
};

// Helper: get side display name
GAME.sideName = function(side) {
  return GAME.SideNames[side] || side;
};
