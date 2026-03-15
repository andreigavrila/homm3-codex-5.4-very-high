# Build Context Trace

This note focuses only on context volume:
- how much was consumed as input
- how much was produced as output
- what the visible context lower bound looks like
- what hidden reasoning may have added on top

## Method

Context usage is approximate because there is no exact token meter exposed in the workspace. Token estimates below use a rough conversion of about `1 token ~= 4 characters`.

## Input

Measured source material read during the build:
- requirements corpus: `213,577` characters, `30,781` words, `3,820` lines

Approximate token footprint for the requirements input:
- about `53k` tokens

Additional visible input beyond the requirements:
- runtime errors
- terminal output
- screenshots
- rereads of code and tests
- follow-up debug context

Approximate extra visible input:
- about `5k` to `15k` tokens

Practical read:
- the blueprint set was the dominant input cost
- the later UI/debug iterations added a meaningful but smaller tail of context

## Output

Measured code and test output:
- source code text read/written: `97,622` characters, `9,319` words, `3,413` lines
- test code text read/written: `31,139` characters, `3,162` words, `846` lines

Approximate token footprint for code/test output:
- source + tests: about `32k` tokens

There was also small additional output in:
- short documentation/debug notes
- terminal/tool interactions
- iterative explanations and checks

Those were comparatively small next to the code/test output.

## Visible Context Lower Bound

Estimated total visible working context across the full build:
- about `90k` to `100k` tokens

This is the lower-bound view because it only counts visible material:
- requirements
- code and tests
- terminal output
- screenshots
- follow-up debug context

## Hidden Reasoning Estimate

The `90k` to `100k` estimate above does **not** directly measure hidden internal reasoning/computation.

That meter is not exposed in the workspace, so this part is only a guess.

Reasonable working assumption for a task like this:
- hidden reasoning overhead may have been several times larger than the visible lower bound

Best practical estimate for this specific project/thread:
- around `500k` to `800k` total tokens when hidden reasoning is included

Interpretation:
- visible input/output was already large
- hidden reasoning likely dominated during engine design, store orchestration, bug tracing, animation wiring, and UI iteration

## Summary

Conservative summary:
- input-heavy visible material: roughly `58k-68k` tokens
- code/test output: roughly `32k` tokens
- visible lower-bound total: about `90k-100k` tokens
- speculative total including hidden reasoning: about `500k-800k` tokens

Most important conclusion:
- the visible artifact counts matter, but they are still only the floor
- the real total cost of the build was likely much higher once reasoning is included
