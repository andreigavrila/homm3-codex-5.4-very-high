# Planning vs Implementation Delta

This note focuses on the delta between:
- what the requirements/planning had already decided
- what still had to be decided during implementation/debugging

## Counting Method

Two counting modes were used:

- `strict count`: only explicitly tagged items such as `[RULE-xx]`, `[DECISION-xx]`, and `[PENDING-xx]`
- `working count`: broader implementation constraints already fixed by the blueprints, including tech stack selections, NFR targets, scope exclusions, and component specs

## Rules Already Present In Planning

Strict formal rules found in the requirements:
- `14` business rules
- source: `[RULE-01]` through `[RULE-14]` in `requirements/02_functional_design.md`

Missing core formal rules:
- `0`

Interpretation:
- the combat/gameplay layer was unusually well specified
- the LLM did not have to invent new core combat rules from scratch

## Rules Still Inferred During Implementation

Additional implementation rules/behaviors that still had to be inferred:
- `11`

These were not missing game-design rules so much as missing operational rules needed to turn the blueprint into working code:
1. exact store action/reducer contract and event names
2. selector-driven derived-state recomputation strategy
3. exact queue/index handling after kills, waits, and round transitions in the store
4. combat-log message formatting and summary construction details
5. fallback behavior when a unit icon is not a valid image asset
6. SVG overlay layering so portraits and creature-count badges render above base hexes
7. stabilization of Zustand selectors to avoid the React 19 max-update-depth loop
8. asset-loading strategy for user-replaced images
9. portrait fitting rules on cards and info panels
10. hex spacing tuning for legibility
11. final hex orientation change to pointy-top after user feedback

Bottom line on rules:
- `14` formal rules were already present
- `0` formal gameplay rules were truly missing
- `11` implementation-level behaviors still had to be decided to make the app work cleanly

## Decisions Already Taken In Planning

### Strict Explicit Decision Count

Already decided before implementation:
- `10` explicit product decisions in `01_requirements_strategy.md`
- `4` pending decisions already answered in `02_functional_design.md`

Strict explicit total:
- `14`

### Broader Working Decision / Constraint Count

If counting all requirement-side choices that materially constrained implementation, the blueprints had already made at least:
- `10` explicit strategy decisions
- `4` resolved pending decisions
- `14` scope exclusions
- `8` tech-stack selections
- `18` NFR targets/constraints
- `13` component specs in the design system

Working total already decided in the requirements:
- `67`

This broader number is the more useful one from an engineering perspective, because those items materially reduced ambiguity during implementation.

## Decisions Still Taken During Implementation

Additional implementation/debug decisions taken during the build:
- about `13`

Split:
- technical decisions: `7`
- UX / operational / presentation decisions: `6`

Examples of technical decisions still taken by the LLM during implementation:
1. exact module boundaries inside the engine and state layer
2. precise selector shape and derived highlight computation
3. runtime fix for unstable external-store snapshots in React 19
4. SVG layering model for units versus base cells
5. image-fallback detection logic
6. public-asset sync strategy for manually replaced unit art
7. exact test coverage shape beyond the blueprint matrix

Examples of UX / operational decisions still taken by the LLM during implementation:
1. use initials as fallback unit marks instead of broken glyphs
2. portrait containment rules on full cards
3. creature-count badge placement/readability treatment
4. reduction of hex overlap for readability
5. pointy-top hex orientation after user feedback
6. debug documentation structure and estimation notes

## Summary

Conservative summary:
- formal original rules: `14`
- missing formal gameplay rules: `0`
- inferred implementation rules/behaviors: `11`
- explicit pre-made decisions in requirements: `14`
- broader usable requirement-side decisions/constraints: `67`
- additional implementation/debug decisions taken during the build: about `13`

Most important conclusion:
- the blueprints were strong on product and gameplay definition
- the remaining work was mostly implementation detail, UI behavior, and debug/problem-solving rather than invention of the core game itself