# Flip7 Companion

An installable, offline-friendly scorekeeper for Flip7 game nights. It supports 2–10 players, round-by-round scoring, cumulative totals, saved game history, and player statistics.

## Status

The foundation and specification are in place. The next development milestone is the New Game flow and local game persistence.

## Run locally

Requires Node.js 20.19+ (or a current LTS version) and Git.

```sh
npm install
npm run dev
```

To create a production build:

```sh
npm run build
```

## Project layout

- `docs/` — the agreed product and technical specifications
- `src/types/` — domain models, kept independent of the interface
- `src/utils/` — pure scoring and statistic calculations
- `src/services/` — browser storage and external boundaries
- `src/components/` — reusable interface components
- `src/features/` — screen-level feature modules

## Development principles

- The app works without an account or server.
- One game can be active at a time; completed games are retained indefinitely on that device.
- Every scoring rule is covered by automated tests before interface work relies on it.
- The design is inspired by retro game-show/card-game energy, not by copied Flip7 artwork.
