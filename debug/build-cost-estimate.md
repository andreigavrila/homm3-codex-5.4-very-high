# Build Cost Estimate

## Executive Summary

Two ways to think about the cost of building this prototype:

- human-only path: an East-EU senior contractor would likely take about **`3-7 working days`** and cost about **`$1,320-$4,480`** for the build itself, or about **`$1,760-$5,600`** with a modest non-AI verification harness; an intermediate developer would likely take about **`2-3 working weeks`** and cost about **`$3,200-$7,200`** for the build, or about **`$3,640-$8,320`** with the same harness
- AI-assisted path: the directly observed build time was about **`30-50 minutes`**; direct observed cost for this project was about **`$94-$106.5`** including build, planning, and limited human review; with a stronger but still modest verification harness, the practical total becomes about **`$294-$706.5`**

Median comparison against the East-EU senior-with-harness baseline: about **`40 minutes`** and **`$500`** for the AI-assisted path versus about **`5 working days`** and **`$3,680`** for the human path, which is roughly **`60x faster`** and **`7.4x cheaper`**.

Main tradeoff:
- the AI-assisted path was dramatically cheaper and faster for a prototype
- the human path is slower and more expensive, but usually comes with stronger built-in judgment and, in a normal engagement, a more trusted validation process

Detailed breakdowns live here:

- `build-cost-estimate-human.md`: what it would likely cost for a human developer/contractor to build the same prototype
- `build-cost-trace-ai.md`: the observed AI-assisted build cost, planning cost, and the missing harness/verification costs

Use those files for the detailed numbers.
