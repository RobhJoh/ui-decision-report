# ui-decision-report

A [Claude Code](https://claude.com/claude-code) skill that reviews a whole web app's UI and lets you decide on every finding in one visual report.

1. **Review.** [Impeccable](https://github.com/pbakaus/impeccable) critiques and audits each view, one reviewer per area, at the widths you choose.
2. **Decide.** Claude publishes a private report on claude.ai, with annotated screenshots, real mockups of proposed changes, and heuristic scores. Each finding gets your decision: Fix, Later, Accept or Discuss. Claude recommends one, but nothing counts until you click.
3. **Discuss.** Anything marked Discuss comes back as concrete variants with mockups.
4. **Hand off.** The decisions are written back to the repo as `findings.md` and `plan.md`. Issue drafts for your tracker (GitHub, GitLab, Notion, Linear) are created only after you approve them.

Every step stops at a gate for your approval.

## Requirements

- Claude Code, with access to claude.ai Artifacts for the report.
- The [Impeccable](https://github.com/pbakaus/impeccable) skill, which does the reviewing.
- Node.js 18 or later. On first use, the skill asks before installing Playwright and Chromium for screenshots.

## Install

In Claude Code:

```
/plugin marketplace add RobhJoh/ui-decision-report
/plugin install ui-decision-report@ui-decision-report
```

## Use

Ask Claude for a UI decision report or a design review of your app. Run `/ui-decision-report:ui-decision-report verify` to check that an earlier round's fixes landed, or `status` to see where a round stands.

How the skill works is in [`skills/ui-decision-report/SKILL.md`](skills/ui-decision-report/SKILL.md).

## License

[MIT](LICENSE)
