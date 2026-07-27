# Flip7 Companion — Product Specification

## Purpose

Flip7 Companion is a mobile-first, installable web app for recording Flip7 scores without paper. It is designed for one scorekeeper using an iPhone during a game night.

## Core rules

- A game has 2–10 players.
- Players enter one score each per round. A bust records `0`.
- Scores accumulate across rounds.
- A round is always completed before the game ends.
- If at least one player has 200 or more points at the end of a round, the highest final total wins.
- Equal highest totals produce joint winners.
- The only correction action is **Undo last round**, which removes every score in that round.

## Essential experience

- Player names are remembered for later games.
- There is one resumable active game.
- During score entry, the scorekeeper moves through players card by card, using the number keyboard and a Bust shortcut.
- Player cards are swipeable and show total, progress to 200, rank/leader state, the last five rounds, and a compact leaderboard.
- Completed games are kept indefinitely on the device and can be replayed round by round.
- Statistics include games played/won, win rate, highest round, busts, average round, highest final score, and fastest win.

## Visual direction

- Aqua/turquoise game-table background.
- Cream playing-card surfaces with decorative gold borders.
- Bold retro display treatment for scores and headings; plain, highly legible body text.
- Each player receives a restrained accent colour for small details, while the deck-like card aesthetic remains consistent.
- The winner treatment includes confetti, a brief trophy animation, and final standings; no sound.

## Technical boundaries

- React + TypeScript + Vite.
- Installable PWA with offline caching.
- Local browser storage only in version 1; no login, backend, cloud sync, or payments.
- GitHub is the source of truth. Initial deployment target: GitHub Pages.
