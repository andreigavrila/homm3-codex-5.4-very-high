# Build Context and Decision Audit

This note answers four questions:
- how much context was consumed during the build
- how many formal rules were present in the original requirements
- how many additional implementation rules had to be inferred during coding
- how many decisions were already made by the requirements versus how many had to be made during implementation/debugging

## Method

To keep the counts honest, I used two counting modes:

- `strict count`: only explicitly tagged items such as `[RULE-xx]`, `[DECISION-xx]`, and `[PENDING-xx]`
- `working count`: broader implementation constraints already fixed by the blueprints, including tech stack selections, NFR targets, scope exclusions, and component specs

Context usage is approximate because there is no exact token meter exposed in the workspace. Token estimates below use a rough conversion of about `1 token ~= 4 characters`.

## 1. Context Spent During The Build

Measured source material:
- requirements corpus: `213,577` characters, `30,781` words, `3,820` lines
- source code text read/written: `97,622` characters, `9,319` words, `3,413` lines
- test code text read/written: `31,139` characters, `3,162` words, `846` lines

Approximate token footprint:
- requirements docs: about `53k` tokens
- source + tests: about `32k` tokens
- runtime errors, terminal output, screenshots, rereads, and follow-up debug context: about `5k` to `15k` tokens

Estimated total working context across the full build:
- about `90k` to `100k` tokens

Practical read:
- this was not a tiny prompt-to-code task
- most of the context budget went into reading the blueprint set and then iterating on UI/debug details after the first playable build

### Important Caveat: This Does Not Include Hidden Reasoning

The `90k` to `100k` estimate above is a visible-material estimate:
- requirements
- code and tests
- terminal output
- screenshots
- follow-up debug context

It does **not** directly measure hidden internal reasoning/computation, because that meter is not exposed in the workspace.

Reasonable estimate for hidden reasoning overhead on a task like this:
- about `0.75x` to `7.0x` the visible-material token volume

That implies a more realistic total compute estimate for the full build session of roughly:
- `165k` to `100k` tokens total

My best practical estimate for this specific project/thread:
- around `500k` to `800k` total tokens when hidden reasoning is included

Interpretation:
- visible inputs were already large because the blueprint set was extensive
- hidden reasoning was also substantial, especially during engine design, store orchestration, UI bug tracing, and the React/Zustand loop fix
- so yes, the real total was materially higher than the earlier lower-bound estimate

## 2. Rules In The Original Requirements

Strict formal rules found in the requirements:
- `14` business rules
- source: `[RULE-01]` through `[RULE-14]` in `requirements/02_functional_design.md`

Missing core formal rules:
- `0`

Interpretation:
- the combat/gameplay layer was unusually well specified
- I did not have to invent new core combat rules from scratch

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

## 3. Decisions Already Taken In The Requirements

### Strict explicit decision count

Already decided before implementation:
- `10` explicit product decisions in `01_requirements_strategy.md`
- `4` pending decisions already answered in `02_functional_design.md`

Strict explicit total:
- `14`

### Broader working decision/constraint count

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

## 4. Decisions I Still Had To Take

Additional implementation/debug decisions taken during the build:
- about `13`

Split:
- technical decisions: `7`
- UX / operational / presentation decisions: `6`

Examples of technical decisions I still had to take:
1. exact module boundaries inside the engine and state layer
2. precise selector shape and derived highlight computation
3. runtime fix for unstable external-store snapshots in React 19
4. SVG layering model for units versus base cells
5. image-fallback detection logic
6. public-asset strategy for manually replaced unit art
7. exact test coverage shape beyond the blueprint matrix

Examples of UX / operational decisions I still had to take:
1. use initials as fallback unit marks instead of broken glyphs
2. portrait containment rules on full cards
3. creature-count badge placement/readability treatment
4. reduction of hex overlap for readability
5. pointy-top hex orientation after user feedback
6. debug documentation structure and estimation notes

## Summary

Conservative summary:
- context spent: about `90k` to `100k` tokens
- estimated total including hidden reasoning: about `165k` to `1000k`, with `500k` to `800k` as the best estimate
- formal original rules: `14`
- missing formal gameplay rules: `0`
- inferred implementation rules/behaviors: `11`
- explicit pre-made decisions in requirements: `14`
- broader usable requirement-side decisions/constraints: `67`
- additional implementation/debug decisions taken during the build: about `13`
- all the above are higher level rules/decisions

Most important conclusion:
- the blueprints were strong on product and gameplay definition
- the remaining work was mostly implementation detail, UI behavior, and debug/problem-solving rather than invention of the core game itself
