# Subagent briefs

Each subagent is isolated. Fill in the `<…>` slots and send the brief as its prompt. Reviewers never see each other's output; you merge their parts afterwards.

## Area reviewer (one per area)

```
You are a design reviewer for <project>. Run Impeccable's critique, Assessment A
(design review), on the views below. Impeccable is installed at <impeccable-dir>:
read <impeccable-dir>/SKILL.md "Setup" and run its `impeccable context` command
from <repo-root>, then follow <impeccable-dir>/reference/critique.md
"Assessment A: Design Review", including its heuristics scoring guide, cognitive
load, personas and P0–P3 severities. You are Assessment A only: do not run the
detector. You are a subagent inside a larger round: skip Impeccable's "Persist
the Snapshot" and "Ask the User" steps, never run `impeccable hooks on`, and
change no file in the repo. Write only your part file.

Views in your area (<area>), each one route as one role in one state:
<for each view: id, label, role, state, URL, source files, screenshots by viewport:
 <round-dir>/screens/<file>>

Look at every screenshot (Read the image files) and the source behind it. Fixed
bars can land mid-image in full-page screenshots; that is the screenshot, not a
defect. <if the app runs: You may open pages to check behaviour; session for role
<role> is in <state-file>. Interact only against the local database.>

Design rules: <sources from state.json designRules, or "none">. Locked brand:
<state.json brand, or "none">. When a finding breaks a design rule, add `rule`
with ref, what the rule says and what the view does. Never propose changing a
locked brand element; if it causes a problem, report it once with `brand: true`.

<follow-up rounds only: Earlier findings for these views, with their decisions:
<id · title · decision>. Reuse an earlier id for the same problem; history
"remaining" if unchanged, "changed" if it shows in a new form, "new" otherwise.
Skip findings decided `accept` unless they got clearly worse.>

For each view, first write:
- `job`: the one thing the view exists for, in one sentence;
- `inventory`: everything the user can do and know here, ranked by importance.
Then judge the view against its job through these lenses: hierarchy, friction,
consistency, states, mobile, accessibility, copy, delight.

Report every problem that matters for the view's job, however many that is, and
nothing that doesn't. Delight belongs at the peaks and endings of a task, not
everywhere. A finding that only a new feature would solve gets `newFeature: true`;
never describe a feature the app does not have as if it existed. A pattern that
recurs across views is one finding with `appliesTo` listing the views, written
once.

Write in <language>. Quote UI text exactly as the app shows it.

Write your part to <round-dir>/parts/<area>.json in the findings.json shape
(<skill-dir>/reference/findings-schema.md): `views` (id, label, area, role,
state, job, inventory, summary, strengths, scores) and `findings`, with
`source: "critique"`, a `theme`, a `suggested` status with `suggestedWhy`, and
for single-element findings a CSS `selector` plus the `viewport` of the screenshot
it shows in. Add `questionCandidates` (array of {question, why, findings,
options: [{label, detail}]}) for design choices you would leave to the owner.

You are done when every view in your area has job, inventory, scores and a
summary, and every problem you saw is a finding with why, fix, severity, theme
and suggested status. Reply with one line: the file path and the number of
findings.
```

## Technical auditor (one per round)

```
You are the technical auditor for <project>. Run Impeccable's critique
Assessment B (detector and browser evidence, static and rendered, desktop and
mobile) and Impeccable's audit on the views below. Impeccable is installed at
<impeccable-dir>: read <impeccable-dir>/SKILL.md "Setup" and run
`impeccable context` from <repo-root>, then follow
<impeccable-dir>/reference/critique.md "Assessment B" and
<impeccable-dir>/reference/audit.md. You are a subagent inside a larger round:
skip Impeccable's "Persist the Snapshot" and "Ask the User" steps, never run
`impeccable hooks on`, and change no file in the repo. Write only your part file.

Views: <all views in scope with URLs, roles, source files and screenshots>.
<sessions, design rules, locked brand and follow-up rules as for area reviewers>

Write in <language>. Write your part to <round-dir>/parts/audit.json: `audit`
(scores 0–4 for accessibility, performance, theming, responsive, integrity,
with a one-line note each) and `findings` with `source: "audit"`, using the same
field rules as the area reviewers. For each detector finding, put the detector
rule's name in `detectorRule`. Record detector false positives in your reply, not
as findings.

You are done when every audit dimension is scored and every failed check is a
finding. Reply with one line: the file path, the number of findings, and the
detector false positives.
```

## Mockup builder (one per area with mockups)

```
You build static mockups for <project>'s design review. For each item below,
write one standalone HTML file that shows the proposed change on the real view.

Items: <for each: output path under <round-dir>/mockups/, the finding or question
option it shows, its fix or option text, the view's screenshot path, and the
view's source files>.

Project look: tokens from <token or theme files>, fonts from <font source>.
Where the app has several themes, match the one the screenshots show: read the
active theme's colours and fonts from the running page or its theme file, not
from the defaults. Embed the tokens as CSS custom properties in the file. Load fonts only from
Google Fonts, or inline them with @font-face data URIs; give every face a
fallback stack.

Rules:
- One self-contained file: inline CSS, no scripts, no other external requests.
- Real content: the labels, data and copy from the screenshot, not lorem ipsum.
- Show the whole view the change lives in, with the change in place, so it reads
  in context. Change only what the item proposes.
- Responsive: it must read right at 390 px and at 1440 px wide, with nothing
  scrolling sideways.
- Write UI text in the app's language.

Check each file with
`node <skill-dir>/scripts/capture.mjs snap <file> <scratch-dir>/<name>.png 1440`
and again at 390,
look at both images, and fix what is off.

You are done when every file exists and both renders look right. Reply with the
list of files.
```
