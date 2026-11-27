# Plan and issues

## Find the tracker (phase 0)

Check in this order, and stop at the first hit:

1. The repo's own instructions: `CLAUDE.md`, `AGENTS.md`, `docs/agents/issue-tracker.md`, `CONTRIBUTING.md`. They may name the tracker, labels, templates and language.
2. Issue templates in `.github/ISSUE_TEMPLATE/` or `.gitlab/issue_templates/`.
3. A GitHub or GitLab remote (`git remote -v`) with issues enabled.
4. A connected Notion, Linear or Jira tool in this session that the user names for this project.

Ask when two candidates fit or none does. With no tracker, `plan.md` is the deliverable.

## plan.md (phase 5)

Phases ordered by dependency, so each phase builds on finished work:

0. **Design manual**, only when `state.json` has `designManual: true`: Impeccable writes `DESIGN.md` from the round's decided direction. Every other task depends on it.
1. **Shared building blocks**: tokens, components and patterns that several views use: cross-cutting findings and themes such as "Page header" or "Date and money formats".
2. **Views**, one task per theme or view area, in the order the user's main flows run.
3. **Later**: everything decided `later`, grouped by theme, with no order promised.

Each task has:

- a title and the finding ids it covers;
- the answered questions that apply;
- the views it touches;
- acceptance criteria that someone can check in the browser, one per finding, taken from its `finalFix`, or its `fix` when it has none.

A finding's criterion says one thing. When an answer or the user's note changes the fix (another number, another place, a setting instead of a constant), `writeback.mjs` lists the finding: write `finalFix` in `findings.json` as the single criterion where the answer and the note win and whatever they contradict is gone, then run `writeback.mjs` again until it lists none. Never write "the original fix, where it does not conflict".

List the `newFeature` findings decided `fix` or `later` under "Out of scope: new features", each with one line on what it would take. List any findings still marked `discuss` as open questions. `accept` findings stay in `findings.md` only.

## Issues (phase 5)

One issue per task, a parent for the round, and the phases as milestones or epics where the tracker has them. The issues must be safe to build in parallel by whoever picks up the parent (for example `/mattpocock-skills:implement-spec <parent>`): a task can start only when the tasks it depends on are done.

- **Parent**: the round title. Its body has the report link, the counts per decision, the answered questions, the open questions and the out-of-scope features.
- **Task issues**: the task from `plan.md`, with its checklist of acceptance criteria. Make them ready to build: someone can pick one up without opening the report.
- `later` tasks get the tracker's backlog label or status when it has one.

**Dependencies**: every task in a phase depends on every task in the phases before it, and on any task in its own phase that changes the same files. Later tasks depend on all of phases 0–2.

On GitHub, make tasks real sub-issues of the parent (`gh api` on the sub-issues endpoint), and fall back to a task list of links in the parent. Add each dependency as a native one: `gh api --method POST repos/<owner>/<repo>/issues/<task>/dependencies/blocked_by -F issue_id=<blocker database id>`, where the database id comes from `gh api repos/<owner>/<repo>/issues/<n> --jq .id`; fall back to a `Blocked by: #<n>` line at the top of the body. On a project board, set the tasks nothing blocks to Ready and the rest to Backlog. On GitLab, use an epic or a milestone. In Notion, add rows to the project's database with a relation to the parent. In Linear, use a project or a parent issue.

Write the drafts to `<round>/issue-drafts.md` and show them first:

- the parent's title;
- each issue's title, phase and number of findings;
- what each issue is blocked by;
- the labels you will use;
- where it all goes.

Creating issues is outward-facing, so create them only after the user says yes. Then put each issue's link in `plan.md`.
