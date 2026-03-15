# Build Time Estimate

Scope assumed:
- solo developer
- current app scope only
- React/Vite frontend, game state, combat/pathfinding rules, setup/battle/victory screens, tests, and basic asset integration
- no multiplayer, no AI campaign layer, no save/load, no backend

## Estimated delivery time

Senior developer (10 years):
- 4 to 7 working days for the current quality level
- 7 to 10 working days if including a cleaner art pass, extra polish, and stronger bug fixing

Intermediate developer (4 years):
- 2 to 3 working weeks
- closer to 4 weeks if they are not already comfortable with hex-grid math, turn systems, and React state architecture

Junior developer (1 year):
- 4 to 8 working weeks with regular review support
- without guidance, schedule risk is high and quality would likely be uneven, especially around combat rules, pathfinding, and UI state bugs

## Main time drivers

- turning vague requirements into concrete game rules
- getting hex-grid rendering and movement logic correct
- avoiding state update loops and UI sync bugs
- writing enough tests to keep combat and turn flow stable
- integrating and tuning visual assets

## Actual time in this build

Collaborative build time for this prototype:
- initial playable iteration: roughly 20 to 30 minutes
- follow-up debugging and visual fixes and evolutions: roughly 15 to 20 minutes

Total:
- about 30-50 minutes for the current prototype state

## Bottom line

If the developer is focused full-time and competent in the stack, this is a small-project prototype:
- senior: 3-7 days 48-100x times slower
- intermediate: about 2 to 3 weeks 160-240x times slower
- junior: very improbable to succeed