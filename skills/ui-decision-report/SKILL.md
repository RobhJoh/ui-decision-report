---
name: ui-decision-report
description: Run an Impeccable design review of a whole web app and turn it into a visual decision report — annotated screenshots, real mockups, a decision per finding — then write the decisions back to the repo and the issue tracker as a plan. Use when the user asks for a UI decision report, a design review of the app they can decide on, a follow-up round, a verify round, or the status of one. For a single view or component, use Impeccable directly.
argument-hint: "[verify | status]"
---

# UI decision report

A **round** reviews the app's views, lets the user decide on every finding in a published report, and ends as a plan in the project's tracker. Impeccable does the reviewing; this skill owns everything around it. **Every decision is the user's click**: you recommend a status per finding and an option per question, and nothing counts until the user has chosen.

Modes:

- *(no argument)*: continue the open round, or start a review round.
- `verify`: check that an earlier round's `fix` findings landed. Read [`reference/verify.md`](reference/verify.md).
- `status`: read the open round's `state.json` and say the phase, the gate and what waits on whom. Change nothing.

## The skill folder

`<skill-dir>` is the folder holding this file.

- `template/report.html` is the report page. It already follows the Artifact page contract: publish what `build.mjs` makes rather than writing a page.
- `scripts/` (Node, with Playwright in `scripts/node_modules`):
  - `capture.mjs`: sign-in per role, screenshots, pins, mockup renders and crops.
  - `build.mjs`: validates and renders the report.
  - `open-items.mjs`: lists what is still undecided.
  - `writeback.mjs`: writes the decisions into the repo.
- `reference/`, one file per phase; read each when its phase starts:
  - `findings-schema.md`: the `findings.json` every step shares;
  - `capture.md`: views, roles and states, sign-in, screenshots;
  - `reviewer-brief.md`: the subagent prompts;
  - `synthesis.md`: merging, mockups and the gate-2 summary;
  - `discussion.md`: the discussion loop;
  - `tracker.md`: plan and issues;
  - `verify.md`: verify rounds.

## State and gates

The round folder holds `state.json`; write it at every phase change and gate:

```json
{ "mode": "review", "phase": 2, "gate": "waiting-on-user", "roundDir": "docs/design-review/2026-11-26",
  "language": "sv", "designRules": ["DESIGN.md", "https://figma.com/…"], "brand": ["logo", "primary colour"],
  "roles": ["admin", "technician"], "tracker": { "kind": "github", "repo": "owner/name" },
  "artifactUrl": null, "discussionRounds": 0, "updatedAt": "2026-11-26T15:00:00Z" }
```

On start without an argument, look for a round folder whose `state.json` has `phase` below 6 and resume at its gate. Session files live in the scratchpad and may be gone after a break: sign in again when they are.

Each phase ends at a **gate**: say what was done and what the user must decide, set `gate` to `waiting-on-user`, and stop until they answer.

| Phase | Work | Gate |
|---|---|---|
| 0 Setup | Preconditions, round folder, language, design rules, tracker | User confirms the settings |
| 1 Capture | Views with roles and states, sign-in, screenshots | User approves the view list, then a sample of screenshots |
| 2 Review | Reviewers in parallel, synthesis | User approves the summary |
| 3 Report | Mockups, build, publish; the user decides | Every finding and question decided |
| 4 Discussion | Variants for what is marked discuss | Nothing open |
| 5 Hand-off | `findings.md`, `plan.md`, issues | User approves the plan, then the issue drafts |

## 0. Setup

1. Find Impeccable's skill folder: `impeccable/SKILL.md` in the personal skills folder, the repo's `.claude/skills/`, or an installed plugin. Without it, stop and point the user to https://github.com/pbakaus/impeccable: this skill wraps it. Run its `impeccable context` once from the repo root.
2. If `<skill-dir>/scripts/node_modules/playwright` is missing, ask before installing: `npm install && npx playwright install chromium` in `<skill-dir>/scripts`.
3. **Round folder**: follow the repo's docs conventions (`CLAUDE.md`, README, the `docs/` layout); without one, propose `docs/design-review/<YYYY-MM-DD>/`. Earlier rounds are sibling folders with a `findings.json`.
4. **Language**: the language of the repo's docs and issues. Ask if the user wants the product's language instead. UI text is always quoted as the app shows it.
5. **Design rules.** Search for them:
   - `PRODUCT.md` and `DESIGN.md`;
   - folders or files named design manual, design system, brand, style guide, or tokens;
   - theme and token files in the code;
   - Storybook;
   - links to Figma, Notion or Zeroheight in the README and the `CLAUDE.md` files.

   Tell the user what you found. Always ask whether the product has a design manual or brand rules you have not found, inside or outside the repo (a Figma file, a PDF, a web page), and which parts of the brand are locked. Record the sources in `designRules` and the locked parts in `brand`. With none, say the review uses Impeccable's general criteria.
6. **Tracker**: find it as [`reference/tracker.md`](reference/tracker.md) says, and confirm it. Nothing is written there before phase 5.
7. For a follow-up round, read the latest earlier `findings.json`: its decisions decide what the reviewers skip (`accept`) and track (`fix`, `later`, `discuss`).
8. Write `state.json`, show the settings, and stop at **gate 0**.

## 1. Capture

Follow [`reference/capture.md`](reference/capture.md): propose the views, with their roles, states and viewports, and stop at **gate 1a** for the user's changes. Then sign in once per role and shoot. Check the screenshots yourself, then show the user a sample and stop at **gate 1b**.

## 2. Review

1. Spawn every reviewer in one message, so they run in parallel: one area reviewer per area and one technical auditor, with the briefs in [`reference/reviewer-brief.md`](reference/reviewer-brief.md). Wait until each has written its part in `<round>/parts/`.
2. Merge the parts as [`reference/synthesis.md`](reference/synthesis.md) says.
3. Show the gate-2 summary it describes and stop at **gate 2**.

## 3. Report

1. Build the mockups ([`reference/synthesis.md`](reference/synthesis.md), "Mockups").
2. Run `capture.mjs pins <round>`, then `build.mjs <round>`. Fix what the validator reports and build again until it passes.
3. When the screens show real people's data (customers, staff), say so and ask before publishing.
4. Publish `<round>/report.html` with the Artifact tool:
   - `capabilities: { db: {}, user: {}, comments: { composer_only: true } }`;
   - the `files` map that `build.mjs` prints;
   - `icon: "checklist"`.

   Put the URL in `meta.artifactUrl` and in `state.json`, then build and republish to the same file path.
5. Give the user the link. Every finding needs a status and every question an option; the dashed button is your recommendation. Stop at **gate 3**.
6. When the user says they are done:
   1. Read the `decisions` and `answers` collections with `ArtifactData` `list` into `decisions.json` in your scratchpad (shape in the schema).
   2. Run `open-items.mjs <round> <decisions.json>` and show what it lists.
   3. While anything is undecided, stay at gate 3. Notes that ask a question go to the discussion too.

## 4. Discussion

While findings are marked `discuss`, or notes ask questions, follow [`reference/discussion.md`](reference/discussion.md). Each loop ends at **gate 4**. The phase is done when `open-items.mjs` exits 0, unless the user explicitly leaves items open for the team.

## 5. Hand-off

1. Run `node <skill-dir>/scripts/writeback.mjs <round> <decisions.json>`. It refuses while anything is undecided. It updates `findings.json` and writes `findings.md`.
2. Write `<round>/plan.md` and the issue drafts as [`reference/tracker.md`](reference/tracker.md) says. Stop at **gate 5a** for the user's approval of `findings.md` and `plan.md`, and at **gate 5b** for the issue drafts.
3. Create the issues, link them from `plan.md`, and delete `parts/`.
4. Commit the round folder by the repo's own commit rules: `state.json`, `capture.json`, `findings.json`, `findings.md`, `plan.md`, `report.html`, `screens/` and `mockups/`. Session files stay out of the repo.
5. Set `phase` to 6 in `state.json`.

The round is done when every finding has the user's decision, every `fix` and `later` finding sits in an issue, and the user has the links.
