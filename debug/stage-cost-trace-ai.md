# AI Build Cost Trace

This file traces the observed AI-assisted cost of producing this prototype, plus the planning and verification caveats around that cost.

## Direct AI-Assisted Build Cost

For the implementation/build phase:
- **`$4.5`** in token consumption for the build itself
- **`$60`** for about `45 minutes` of human-requested evolutions and debugging

Direct build subtotal:
- **`$64.5`**

## Planning Cost

For planning/requirements creation:
- probably around **`$2`** of AI cost to create the requirements document
- probably around **`30 minutes`** of expert review

If that `30 minutes` of review is priced at the same East-EU senior benchmark used in the human estimate (`$55-80/hr`), that review adds:
- low end: `0.5 x $55 = $27.5`
- high end: `0.5 x $80 = $40`

Planning subtotal:
- AI only: about **`$2`**
- AI + expert review: about **`$29.5-$42`**

## Planning Was Useful, But Not Complete

One important planning miss was hex orientation:
- the requirements specified **flat-top** hexes
- in practice, for the layout we wanted, the better fit was **pointy-top / flat left-right**

That matters because it shows the planning was strong enough to enable the build, but not perfect enough to eliminate all design corrections during execution.

## Requirements-Builder Cost Was Not Captured

This estimate does **not** include the cost of the system/harness that produced the requirements in the first place.

That upstream cost matters:
- ideally, a requirements-builder harness already contains the expertise of a human expert or company
- in practice, such a harness is created over multiple iterations, not in one shot
- its cost is partly R&D, partly process design, and partly accumulated domain knowledge

So the AI planning numbers above only cover **using** the requirements-builder flow for this project, not **building and refining** that flow.

## Current Verification Harness Was Prototype-Level

The verification harness actually applied here was limited to:
- manual testing
- running the automated tests
- around **`30 minutes`** of code and test review

That is enough for a prototype, but too little for production code.

Compared with a human developer working a full week on the same feature set, this code is still **less trustworthy**, not necessarily because the code is worse, but because the validation harness was thinner.

## Stronger Production-Grade Harness Not Included Here

The following were **not** included in the cost above.

Deterministic checks:
- lint
- stricter static analysis
- Sonar / SonarCloud style analysis
- more integration and end-to-end testing
- dependency and security scanning such as Snyk

Non-deterministic checks:
- deeper human code review
- AI-agent review passes
- security review
- broader adversarial testing

Approximate extra cost for a more credible production-grade harness on a project this size:
- light additional deterministic + non-deterministic verification: about **`$200-$300`**
- more realistic broader verification budget: about **`$300-$600`**

Important:
- this extra verification cost would apply to **both AI-built and human-built code**
- it was **not included** in the senior developer estimate either

## Practical AI Cost Read

Using only the numbers captured directly in this project:
- build AI + debug/evolution cost: about **`$64.5`**
- planning AI + expert review: about **`$29.5-$42`**

Direct observable AI-assisted project total:
- about **`$94-$106.5`**

If a stronger verification harness is added:
- roughly **`$294-$706.5`** total

And even that still excludes:
- the cost of building/refining the requirements-builder harness itself
