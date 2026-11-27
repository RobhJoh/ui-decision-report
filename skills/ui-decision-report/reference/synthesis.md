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
- **Questions**: turn `questionCandidates` worth the user's time into `questions`. Each gets 2–4 options, one of them recommended. Link it both ways: the ids from the candidate's `findings` go in the question's `findings`, and each of those findings gets `question` set to the question's id. The report uses that link: an answer turns the linked findings into `fix` per the chosen option.
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

Real mockups, never sketches. Build them for:

- every option of a question whose options look different;
- every finding with category `layout` or `hierarchy`, as an "after". The screenshot is the before. Add a "before" only when the screenshot cannot show the current state.

Each one is a pair:

- **the full view**: standalone HTML of the whole view with the change in place, readable at 390 and 1440 px: `mockups/<question-id>/<option-key>-vy.html`, `mockups/<finding-id>/after-vy.html`;
- **the zoom**: an image of just the changed part, cut from the full view with `capture.mjs zoom`: `<option-key>.jpg`, `after.jpg`. This is what the user compares, so the change must fill it. Cut every option of one question with the same rectangle (`zoom` prints it), unless the options change different places.

In `findings.json`: an option's `mockup` is the zoom and `mockupView` the full view; a finding's `mockup.after` is the zoom and `mockup.afterView` the full view (`before` and `beforeView` the same way). Copy each builder's list of invented content into `madeUp` on the option or on the finding's `mockup`; the report prints it under the image.

Spawn one mockup builder per area in one message ([`reviewer-brief.md`](reviewer-brief.md)). Open two or three zooms yourself before building the report, and check that the change is what fills them.
