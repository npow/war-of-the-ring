# The Sundering War

An asymmetric strategy board game for the browser, similar to classic grand-strategy war games. Two factions clash over control of a fantasy continent — one defending a secret quest, the other overwhelming with military force. Single-player vs AI. No dependencies.

![Game Board](assets/screenshot-board.png)

## Features

- **Asymmetric factions** — Dawn Covenant (4 dice, secret quest) vs Dusk Dominion (7 dice, military might)
- **Action dice system** — Roll dice each turn to determine available actions: move armies, recruit, advance politics, play events, or guide the Pilgrimage
- **Hidden movement** — The Pilgrimage moves secretly across the map while Dusk hunts for it
- **44 regions, 78 routes** — A hand-drawn-style parchment map with mountains, rivers, forests, and a shadow zone
- **8 nations with political tracks** — Nations must be rallied to war before they can muster troops
- **Combat** — Regulars, elites, and leaders clash with dice; strongholds grant siege defense
- **40 event cards** — 20 per side, with both strategic and combat effects
- **3 victory conditions** — Destroy the artifact, corrupt its bearer, or conquer enough settlements
- **AI opponent** — Plays the Dusk Dominion with army movement, mustering, and political strategy

![Gameplay](assets/screenshot-gameplay.png)

## Play

Serve the files locally and open in any modern browser:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

No build step. No `npm install`. Works from a static file server or directly from disk.

## How It Works

Each turn follows four phases:

1. **Pilgrimage** — Choose whether to hide, reveal, or continue the secret expedition
2. **Hunt** — The AI allocates dice to search for the Pilgrimage
3. **Dice Roll** — Both sides roll action dice (the Dusk "Eye" results go to the hunt pool)
4. **Actions** — Players alternate spending dice on army moves, mustering, politics, events, or guiding the Pilgrimage

The Dawn Covenant wins by moving the Pilgrimage to the Abyssal Forge before corruption reaches 12, or by capturing 4 VP of enemy settlements. The Dusk Dominion wins by corrupting the Bearer or capturing 10 VP of Dawn settlements.

Hover over any region for a tooltip showing its garrison, nation, settlement type, and VP value.

## Contributing

This is a personal project, but contributions are welcome:

- **Gameplay** — Balance tuning, AI improvements, additional event cards
- **Art** — Better map terrain, unit icons, card illustrations
- **Features** — Multiplayer, undo/redo, save/load, campaign scenarios

## License

MIT
