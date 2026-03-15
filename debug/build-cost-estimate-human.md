# Human Build Cost Estimate

This file estimates what it would cost to build this prototype using market-rate contractor pricing.

Important:
- these are **contractor / freelance-style hourly rates**, not employee salaries
- rates are shown in **USD/hour** because the source benchmarks are published in USD
- the project is a React + TypeScript tactical game prototype, so I used frontend/full-stack web ranges as the nearest fit

## Source Rate Benchmarks

Primary rate references:
- Index.dev, React developer hourly rates by region (published July 10, 2025): Western Europe mid `$60-90/hr`, senior `$80-120/hr`; Eastern Europe mid `$40-60/hr`, senior `$55-80/hr`; Asia mid `$25-45/hr`, senior `$40-70/hr`
  - https://www.index.dev/blog/React-Developer-Hourly-Rates-in-2025-Global-Cost-Guide
- Index.dev, European developer contractor ranges (2025/2026 guide): Western Europe contractors `$64-108/hr`; Central & Eastern Europe contractors `$45-70/hr`
  - https://www.index.dev/blog/european-developer-hourly-rates
- Index.dev, country-level freelance benchmarks: India avg `$30-50/hr`, senior `$40-70/hr`
  - https://www.index.dev/blog/freelance-developer-rates-by-country

## Hourly Cost Table

Recommended planning ranges for this project:

| Region | Intermediate (4 yrs) | Senior (10 yrs) |
|:---|:---:|:---:|
| West Europe | `$60-90/hr` | `$80-120/hr` |
| East Europe | `$40-60/hr` | `$55-80/hr` |
| India | `$25-45/hr` | `$40-70/hr` |

## East-Europe Cost Calculation

Assumption from our build note:
- actual prototype build time in this thread: about `2 hours` end-to-end

This estimate uses the earlier human-delivery time ranges, which are more realistic than simply multiplying the AI-assisted elapsed time.

## Cost Using The Earlier Time Estimates

### Senior East-EU Developer

Assumed time:
- `3-7 working days`
- assuming `8 hours/day` => `24-56 hours`

Rate:
- `$55-80/hr`

Estimated cost:
- low end: `24 x $55 = $1,320`
- high end: `56 x $80 = $4,480`

Range:
- **`$1,320-$4,480`**

### Intermediate East-EU Developer

Assumed time:
- `2-3 working weeks`
- assuming `5 days/week`, `8 hours/day` => `80-120 hours`

Rate:
- `$40-60/hr`

Estimated cost:
- low end: `80 x $40 = $3,200`
- high end: `120 x $60 = $7,200`

Range:
- **`$3,200-$7,200`**

## Practical Bottom Line

If someone were budgeting this prototype for a normal East-EU contractor market:
- realistic senior budget: roughly **`$2k-$4k`**
- realistic intermediate budget: roughly **`$4k-$7k`**

## Non-AI Verification Harness Estimate

To keep this simple, the verification harness below is priced using the same East-EU senior benchmark:
- **`$55-80/hr`**

This harness is intentionally non-AI and includes:
- deterministic static checks such as lint, stricter static analysis, Sonar-style analysis, and Snyk/dependency scanning
- human code review by a senior developer
- extra human manual testing beyond the prototype-level pass

Estimated effort for this size of project:
- deterministic tooling setup, run, triage, and follow-up: `3-5 hours`
- senior human code review: `2-4 hours`
- extra manual testing and issue verification: `3-5 hours`

Total harness effort:
- **`8-14 hours`**

Harness cost:
- low end: `8 x $55 = $440`
- high end: `14 x $80 = $1,120`

Range:
- **`$440-$1,120`**

### Human Build Plus Harness

Senior build + harness:
- low end: `$1,320 + $440 = $1,760`
- high end: `$4,480 + $1,120 = $5,600`

Range:
- **`$1,760-$5,600`**

Intermediate build + harness:
- low end: `$3,200 + $440 = $3,640`
- high end: `$7,200 + $1,120 = $8,320`

Range:
- **`$3,640-$8,320`**

## Important Notes

- the harness estimate above is labor-only for simplicity
- it does **not** include software subscription/license costs for tools like Sonar or Snyk
- it also does **not** include deeper security review, penetration testing, or a full QA cycle
- this makes the comparison with the AI-assisted path fairer, because both sides still exclude a larger enterprise-grade validation program
