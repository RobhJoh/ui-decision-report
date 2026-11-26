# Synthesis: from parts to one findings.json

Merge `parts/*.json` into `<round>/findings.json` (shape in `findings-schema.md`).

## Merge rules

- **Duplicates**: when two sources report the same problem on the same element, keep one finding. Keep the clearer why and fix and the higher severity, and list the other sources in `alsoFlaggedBy` (for example `"Impeccable audit"`, `"area: Orders"`).
- **Detector rules**: at most one finding per detector rule and area. Fold the rest into it with `appliesTo`.
- **Cross-cutting**: a problem on several views becomes one finding on the area's cross-cutting view (`<area>-all`, label "<area>: across views", no screenshots), with `appliesTo` listing the views. Pin it nowhere.
- **Brand guard**: a finding that would change a locked brand element (`state.json` `brand`) becomes one finding with `brand: true` and `suggested: "accept"`, saying what the brand causes and that it is locked.
- **New features**: keep `newFeature: true`. Recommend `later`, unless the problem is P0.
- **ids** are final from the first publish on: decisions are stored against them. After that, add findings, and never rename or reuse an id.

## Themes, recommendations, questions

- **Themes**: rename the reviewers' themes into the units the plan will build. Use a shared building block ("Page header", "Date and money formats") or a view area ("Order page"). Each finding gets exactly one theme.
- **Recommendation**: check each `suggested` against the schema's rules and give it a one-line `suggestedWhy`. Be decisive. `discuss` is for open product or behaviour questions, not for findings you are unsure of.
- **Questions**: turn `questionCandidates` worth the user's time into `questions`. Each gets 2–4 options, one of them recommended, and links to the findings it settles.
- **History** (follow-up rounds): every finding has `history`. For earlier `fix` findings that no reviewer reported again, check the new screenshots, and add the ones still there as `remaining`.
- Fill `meta` (accent colour and fonts from the project's tokens) and copy `screens.json` into `screens`.

## Gate-2 summary

Show the user:

- the number of findings per severity, per source, and per theme;
- the three findings that matter most, and why;
- the questions you will ask;
- the mockups you will build: one per option of every visual question, and one `after` per finding about layout or hierarchy.

Stop at gate 2. Change the findings as the user asks before building mockups.

## Mockups

Real, full-view HTML mockups at both widths, never sketches. Build them for:

- every option of a question whose options look different;
- every finding with category `layout` or `hierarchy`, as `mockup.after`. The screenshot is the before. Add `mockup.before` only when the screenshot cannot show the current state.

Paths: `mockups/<finding-id>/after.html` and `mockups/<question-id>/<option-key>.html`. Spawn one mockup builder per area in one message ([`reviewer-brief.md`](reviewer-brief.md)), then open two or three of the results yourself with `capture.mjs snap` before building the report.
