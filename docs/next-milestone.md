# Next milestone — New Game

Build the first usable flow from the approved specification:

1. Show a home screen with **New Game** and **Resume Game** when an active game exists.
2. Let the scorekeeper select 2–10 players.
3. Offer remembered players alongside an **Add player** action.
4. Require a non-empty, unique name for every selected player.
5. Assign an accent colour to each player in selection order.
6. Create an active game with no rounds, then save it locally.
7. Route to the active-game player card view.

## Acceptance checks

- A game cannot start with fewer than two or more than ten players.
- Refreshing the browser after starting a game preserves the active game.
- Starting a game adds newly created players to the saved player library.
- The app does not yet expose a way to create a second active game.
