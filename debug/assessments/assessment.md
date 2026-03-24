# HoMM3 Implementation Assessment

Assessment date: 2026-03-20

## Score

**62%**

## Short Summary

This is a meaningful implementation with a real engine, store, setup flow, battle screen, and victory screen. The main blockers against a higher score are one verified turn-order/state-machine bug, one verified setup-rule violation in the live UI, an inaccurate turn-order display after `Wait`, and a broken lint gate.

## Findings

### High: Active stack dying to retaliation skips the next living unit

The battle reducer always advances the queue after combat in [gameStore.ts:339](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/state/gameStore.ts#L339). `advanceTurn()` first removes dead stacks in [turnManager.ts:34](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/engine/turnManager.ts#L34), then removes the current queue entry again in [turnManager.ts:48](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/engine/turnManager.ts#L48). When the active attacker dies to retaliation, that double step skips the next rightful turn.

This violates the required behavior in [02_functional_design.md:901](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/02_functional_design.md#L901) and the planned coverage in [06_test_strategy.md:153](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/06_test_strategy.md#L153) and [06_test_strategy.md:154](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/06_test_strategy.md#L154).

### High: The setup UI blocks duplicate unit picks even though duplicates are required

The setup screen tracks selected cards by unit id in [SetupScreen.tsx:31](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/components/SetupScreen.tsx#L31). Clicking an already-selected unit deselects it in [SetupScreen.tsx:33](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/components/SetupScreen.tsx#L33) instead of allowing the same unit to fill another slot. The store-level validator does allow duplicates in [armySetup.ts:6](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/engine/armySetup.ts#L6), but the live setup flow prevents them.

This conflicts with [02_functional_design.md:583](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/02_functional_design.md#L583), [02_functional_design.md:903](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/02_functional_design.md#L903), and [02_functional_design.md:932](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/02_functional_design.md#L932).

### Medium: The visible turn-order queue becomes inaccurate after `Wait`

The wait mechanic stores deferred stacks in `waitQueue` in [turnManager.ts:71](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/engine/turnManager.ts#L71). The turn-order component renders only `entries` in [TurnOrderBar.tsx:6](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/components/TurnOrderBar.tsx#L6), so waiting stacks disappear from the visible sequence instead of remaining visible at the end of round.

That misses [01_requirements_strategy.md:183](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/01_requirements_strategy.md#L183) and [02_functional_design.md:310](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/02_functional_design.md#L310), which require the queue to stay accurate when stacks wait, die, or a new round begins.

### Medium: The lint gate is defined but nonfunctional

The project defines a `lint` script in [package.json:5](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/package.json#L5), and the repo does contain a legacy ESLint config in [.eslintrc.cjs:1](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/.eslintrc.cjs#L1). However, the installed ESLint version is 9.x, which expects `eslint.config.*`, so `npm run lint` fails before linting any code.

That falls short of the linting requirement in [03_nfr.md:147](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/03_nfr.md#L147).

## Task List

### 1. Fix post-retaliation turn progression

**Problem**: When the active stack dies during retaliation, the next living stack can be skipped because the queue is sanitized and then advanced again in [gameStore.ts:339](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/state/gameStore.ts#L339), [turnManager.ts:34](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/engine/turnManager.ts#L34), and [turnManager.ts:48](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/engine/turnManager.ts#L48). That breaks the required edge-case behavior in [02_functional_design.md:901](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/02_functional_design.md#L901).

**What needs to be done**:
- Redesign the queue-advance contract so combat resolution removes exactly one completed turn, even when the acting stack is already dead before the queue step runs.
- Make the turn manager explicitly handle "acted stack survived" versus "acted stack died" instead of relying on index mutation after dead-entry filtering.
- Add integration coverage for the missing cases called out in [06_test_strategy.md:153](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/06_test_strategy.md#L153) and [06_test_strategy.md:154](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/06_test_strategy.md#L154): active stack dies from retaliation, and a deferred waiting stack dies before its waited turn.

### 2. Allow duplicate unit picks in the live setup flow

**Problem**: The UI currently treats roster selection as unique by unit id in [SetupScreen.tsx:31](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/components/SetupScreen.tsx#L31) and [SetupScreen.tsx:33](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/components/SetupScreen.tsx#L33), so players cannot select the same unit multiple times even though duplicates are explicitly allowed by [02_functional_design.md:583](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/02_functional_design.md#L583) and [02_functional_design.md:903](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/02_functional_design.md#L903).

**What needs to be done**:
- Change roster selection from "selected unit ids" to slot-driven selection so clicking a card fills the next open slot even if the same unit is already present in another slot.
- Keep deselection tied to a specific slot, not to the roster card's unit id.
- Verify the full flow end-to-end: three identical stacks can be selected, counts can be assigned independently, `Ready` enables correctly, and battle start still builds three distinct stacks in [armySetup.ts:10](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/engine/armySetup.ts#L10).
- Add tests for duplicate selection at the UI or integration layer because the current engine-level validation already passes duplicates in [armySetup.spec.ts:40](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/tests/engine/armySetup.spec.ts#L40), but the actual screen does not.

### 3. Make the visible turn-order queue reflect waiting stacks

**Problem**: Waiting stacks are stored separately in `waitQueue` in [turnManager.ts:71](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/engine/turnManager.ts#L71), but the UI only renders `entries` in [TurnOrderBar.tsx:6](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/components/TurnOrderBar.tsx#L6). That means the player-facing queue stops being accurate once a unit waits, which conflicts with [01_requirements_strategy.md:183](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/01_requirements_strategy.md#L183) and [02_functional_design.md:310](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/02_functional_design.md#L310).

**What needs to be done**:
- Update the turn-order presentation so it shows both the active queue and deferred waiters in the correct end-of-round order.
- Ensure the visual order updates correctly when a stack waits, dies, or the round resets.
- Decide whether waiting stacks should remain in one merged visible sequence or be rendered in a clearly labeled deferred segment, but the visible result must still match actual execution order.
- Add component and integration tests for wait behavior so the rendered queue cannot drift from engine state.

### 4. Restore a working lint gate

**Problem**: `npm run lint` exists in [package.json:5](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/package.json#L5), but it fails immediately because ESLint 9 does not automatically use the repo's legacy [.eslintrc.cjs:1](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/.eslintrc.cjs#L1). The project therefore has no functioning lint quality gate despite the requirement in [03_nfr.md:147](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/03_nfr.md#L147).

**What needs to be done**:
- Migrate the ESLint configuration to `eslint.config.js` or pin ESLint back to a version that supports the current config file.
- Re-run lint until it produces real code findings instead of a configuration error.
- Keep the lint command stable in CI/manual workflow so `build`, `test`, and `lint` are all meaningful gates.

### 5. Add the missing component-level verification the spec expects

**Problem**: The current suite is strong on engine and store logic, but it does not test the React components even though component coverage is explicitly required in [06_test_strategy.md:13](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/06_test_strategy.md#L13) and planned throughout [07_implementation_roadmap.md:348](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/07_implementation_roadmap.md#L348), [07_implementation_roadmap.md:391](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/07_implementation_roadmap.md#L391), [07_implementation_roadmap.md:412](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/07_implementation_roadmap.md#L412), [07_implementation_roadmap.md:450](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/07_implementation_roadmap.md#L450), and [07_implementation_roadmap.md:489](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/07_implementation_roadmap.md#L489).

**What needs to be done**:
- Add component tests for `SetupScreen`, `TurnOrderBar`, `ActionButtons`, `CombatLog`, `InfoPanel`, and `VictoryScreen`.
- Cover the behaviors that are currently most likely to regress silently: duplicate selection, `Ready` enablement, wait-queue rendering, attack/wait/defend button states, combat-log rendering, and victory summary display.
- Use these tests to close the gap between "engine supports the rule" and "players can actually use the rule from the live UI."

### 6. Bring the remaining required UI details up to the written spec

**Problem**: Some required UX details are either missing or unverified, including combat-log timestamps required by [02_functional_design.md:338](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/02_functional_design.md#L338), setup summary expectations in [02_functional_design.md:279](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/02_functional_design.md#L279), and restart-oriented error recovery in [03_nfr.md:39](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/03_nfr.md#L39).

**What needs to be done**:
- Decide whether to fully implement these missing UI requirements now or explicitly narrow scope and update the requirement documents to match reality.
- If the goal is spec compliance, add timestamps to combat log entries, ensure the setup screen presents a meaningful army review summary, and make the error boundary offer the restart path the NFR describes.
- Add targeted tests or a manual verification checklist for these UI requirements so they stop living as undocumented gaps.

## What Is Working

- The application flow from setup to battle to victory is wired in [App.tsx:12](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/App.tsx#L12), [gameStore.ts:364](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/state/gameStore.ts#L364), and [VictoryScreen.tsx:13](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/components/VictoryScreen.tsx#L13).
- The engine foundation is substantial: pathfinding in [pathfinding.ts:44](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/engine/pathfinding.ts#L44), combat in [combat.ts:25](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/engine/combat.ts#L25), turn handling in [turnManager.ts:42](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/engine/turnManager.ts#L42), obstacle generation in [battlefieldGenerator.ts:33](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/engine/battlefieldGenerator.ts#L33), and victory checks in [victoryCheck.ts:3](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/engine/victoryCheck.ts#L3).
- Move-then-attack is implemented in the store through [gameStore.ts:142](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/state/gameStore.ts#L142) and [gameStore.ts:598](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/lib/state/gameStore.ts#L598).
- Required battle UI pieces exist: battlefield in [HexGrid.tsx:126](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/components/HexGrid.tsx#L126), action buttons in [ActionButtons.tsx:12](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/components/ActionButtons.tsx#L12), info panel in [InfoPanel.tsx:9](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/components/InfoPanel.tsx#L9), turn order in [TurnOrderBar.tsx:6](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/components/TurnOrderBar.tsx#L6), and combat log in [CombatLog.tsx:21](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/src/components/CombatLog.tsx#L21).

## Quality Gates

- `npm run build`: passed. The build script includes `tsc --noEmit` in [package.json:5](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/package.json#L5), so type-checking passed.
- `npm run test -- --reporter=verbose`: passed with 61 tests across 8 files.
- `npm run lint`: failed because ESLint 9 cannot use the legacy config automatically.
- `npm run check`: not available. There is no separate `check` script in [package.json:5](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/package.json#L5).

## Coverage Gaps

- The requirements expect component-level test coverage in [06_test_strategy.md:13](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/06_test_strategy.md#L13) and dedicated component tests across the roadmap in [07_implementation_roadmap.md:348](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/07_implementation_roadmap.md#L348), [07_implementation_roadmap.md:391](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/07_implementation_roadmap.md#L391), [07_implementation_roadmap.md:412](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/07_implementation_roadmap.md#L412), [07_implementation_roadmap.md:450](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/07_implementation_roadmap.md#L450), and [07_implementation_roadmap.md:489](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/07_implementation_roadmap.md#L489).
- The actual test suite covers engine and store behavior but no React component tests, as shown by [combat.spec.ts:1](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/tests/engine/combat.spec.ts#L1) and [gameStore.spec.ts:1](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/tests/integration/gameStore.spec.ts#L1).
- Important unverified UI behaviors remain, including duplicate stack picking, wait-queue rendering, combat-log timestamps required by [02_functional_design.md:338](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/02_functional_design.md#L338), and click-to-restart error recovery required by [03_nfr.md:39](/C:/Projects/bench/bench-game-homm3-nplan/codex-5.4-very-high/requirements/03_nfr.md#L39).

## Requirement Fit

This project fits the `50-74` rubric band from the skill guidance: the implementation is real and mostly playable, but important correctness and requirement gaps remain. The overall score stays at **62%** because the project clears build and test, but still has a broken P0 turn edge case, a live setup-rule violation, an incomplete turn-order presentation, and a missing working lint gate.
