# Build Cost Estimate

## Executive Summary

Two ways to think about the cost of building this prototype:

- human-only path senior: an East-EU contractor would likely take about **`3-7 working days`** and cost about **`$1,320-$4,480`** for the build itself, or about **`$1,760-$5,600`** with a modest non-AI verification harness;
- human-only path intermediate: an East-EU contractor would likely take about **`2-3 working weeks`** and cost about **`$3,200-$7,200`** for the build, or about **`$3,640-$8,320`** with the same harness
- AI-assisted path: the directly observed build time was about **`30-50 minutes`**; direct observed cost for this project was about **`$94-$106.5`** including build, planning, and limited human review; with a stronger verification harness, the practical total becomes about **`$294-$706.5`**

Median comparison against the East-EU senior-with-harness baseline:

| Path             | Time            | Cost    |
| --------------   | --------------- | ------- |
| AI-PoC           | ~30 minutes     | ~$100   |
| AI-Validated     | ~90 minutes     | ~$500   |
| Human-PoC        | ~5 working days | ~$2,000 |
| Human-Validated  | ~8 working days | ~$3,600 |

**Result PoC: ~80x faster and ~20x cheaper**
**Result Validated: ~42x faster and ~7.2x cheaper**

Main tradeoff:

- the AI-assisted path was dramatically cheaper and faster for a prototype
- the human path is slower and more expensive, but usually comes with stronger built-in judgment and, in a normal engagement, a more trusted validation process

Detailed breakdowns live here:

- `build-cost-estimate-human.md`: what it would likely cost for a human developer/contractor to build the same prototype
- `build-cost-trace-ai.md`: the observed AI-assisted build cost, planning cost, and the missing harness/verification costs

Use those files for the detailed numbers.
