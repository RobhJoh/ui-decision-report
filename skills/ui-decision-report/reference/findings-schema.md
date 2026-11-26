# findings.json

The one file a round revolves around. Reviewers return pieces of it, synthesis merges them, `build.mjs` validates and renders it, and `writeback.mjs` adds the user's decisions. `scripts/validate.mjs` is the authority; this page explains the fields.

```jsonc
{
  "meta": {
    "title": "The admin views, reviewed",       // report heading
    "project": "Acme",                           // eyebrow
    "round": 2,                                  // 1 for the first round
    "date": "2026-11-26",
    "language": "sv",                            // "sv" | "en": report UI, findings.md, plan and issues
    "stage": "decisions",                        // "decisions" | "discussion" | "verify"
    "discussionRound": 1,                        // the current discussion loop, when stage is "discussion"
    "lede": "Twelve views at desktop and phone width …",
    "previousRounds": ["docs/design-review/2026-10-29"],
    "artifactUrl": "https://claude.ai/artifact/…",          // set after the first publish
    "accent": {                                   // optional, from the project's tokens
      "color": "#7d0a2b", "colorFg": "#fff", "colorDark": "#e0547a", "colorDarkFg": "#14070b",
      "display": "\"Chakra Petch\", sans-serif", "body": "Inter, sans-serif", "mono": "\"JetBrains Mono\", monospace",
      "fontsHref": "https://fonts.googleapis.com/css2?family=…"   // only Google Fonts loads
    }
  },
  "views": [
    { "id": "orders-admin-empty", "label": "/orders", "area": "Orders", "role": "admin", "state": "empty",
      "job": "Find the order that needs the advisor next.",
      "inventory": ["See which orders wait on me", "Open an order", "Create an order"],
      "summary": "One sentence on how the view does overall.",
      "strengths": ["What works, kept short"],
      "scores": { "h1": 2, "h2": 3, "h3": 3, "h4": 2, "h5": null, "h6": 2, "h7": 1, "h8": 2, "h9": null, "h10": 1 } },
    { "id": "orders-all", "label": "Orders: across views", "area": "Orders" }   // cross-cutting view, no screens
  ],
  "screens": [
    { "view": "orders-admin-empty", "viewport": "desktop", "w": 1440, "h": 2210, "file": "screens/orders-admin-empty.desktop.jpg" }
  ],
  "audit": {
    "scores": { "accessibility": 2, "performance": 3, "theming": 4, "responsive": 3, "integrity": 3 },
    "notes": { "accessibility": "One line on why" }
  },
  "questions": [
    { "id": "Q1", "round": 0, "theme": "Words", "question": "What is the start page called?",
      "why": "The menu says X, the tab says Y.", "findings": ["orders-start-name"],
      "options": [
        { "key": "a", "label": "Översikt", "detail": "One line on the trade-off.", "recommended": true,
          "mockup": "mockups/Q1/a.html" },
        { "key": "b", "label": "Start", "detail": "…", "mockup": "mockups/Q1/b.html" }
      ] }
  ],
  "findings": [
    { "id": "orders-status-ambiguous",           // lower-case ASCII slug: view + subject; final once published
      "view": "orders-admin-empty", "viewport": "desktop",   // viewport null = the whole view
      "title": "Three statuses read the same", "severity": "P1",
      "source": "critique",                      // "critique" | "audit"
      "category": "copy",                        // lens: hierarchy, friction, consistency, states, mobile, a11y, copy, delight, layout
      "theme": "Status and wording",             // required: the plan task it lands in
      "why": "What goes wrong for whom.", "fix": "What to change.",
      "selector": "main .order-list li:nth-child(3)",       // capture.mjs pins turns it into pin
      "pin": { "x": 12.5, "y": 30.1, "w": 40, "h": 3.2 },   // % of the full-page screenshot, when viewport is set
      // "pins": { "phone": {…}, "tablet": {…} }          // instead of pin, when viewport is null
      "rule": { "ref": "DESIGN.md §Colour", "says": "…", "does": "…" },
      "suggested": "fix", "suggestedWhy": "Known answer, small change on the main flow.",
      "alsoFlaggedBy": ["Impeccable audit"],
      "detectorRule": "low-contrast-text",       // audit findings from the detector
      "appliesTo": ["orders-admin", "orders-admin-empty"],  // cross-cutting findings
      "newFeature": false,                       // true: only a new feature solves it
      "brand": false,                            // true: caused by a locked brand element
      "mockup": { "after": "mockups/orders-status-ambiguous/after.html" },   // layout and hierarchy findings
      "question": "Q1",                          // an open question settles it
      "history": "new",                          // follow-up rounds: "new" | "remaining" | "changed"
      "verification": "done",                    // verify rounds: "done" | "partial" | "missing" | "regression"
      "before": "verify/orders-status-ambiguous.before.jpg", "after": "verify/orders-status-ambiguous.after.jpg"
    }
  ]
}
```

## Field rules

- **ids** are lower-case ASCII slugs that say what the item is about (`orders-status-ambiguous`), never counters. Once published they are final. A follow-up round reuses the earlier id for the same problem.
- **severity** uses Impeccable's scale: P0 Blocking, P1 Major, P2 Minor, P3 Polish.
- **suggested** is your recommendation, shown as a dashed button. It never counts as a decision.
  - `fix`: the answer is known and belongs in this round.
  - `later`: worth doing, but not now (large refactor, low value, blocked, or a new feature).
  - `accept`: intentional, a locked brand element, or a placeholder that other work replaces.
  - `discuss`: a product or behaviour question with no clear answer. When the open part is a choice between concrete design alternatives, write a question instead, link the finding to it, and suggest `fix`.
- **pin** marks one element. Leave it out for findings about the whole view; the card then shows ▣ instead of a number.
- **mockup** files are full-view standalone HTML (see `synthesis.md`). Sketches are not used.
- **theme** names the plan task the finding lands in.

## Decisions in the Artifact

The published report writes to its database:

- `decisions/<findingId>`: `{ status, note, by, at }`. A null `status` means undecided.
- `answers/<questionId>`: `{ option, note, by, at }`. A null `option` means unanswered.

Read both collections with `ArtifactData` `list`, and write them to `decisions.json` in your scratchpad, in the shape `open-items.mjs` and `writeback.mjs` take:

```json
{ "decisions": { "<findingId>": { "status": "later", "note": "…" } },
  "answers": { "Q1": { "option": "b", "note": "" } } }
```
