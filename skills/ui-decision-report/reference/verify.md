# Verify round

Checks that an earlier round's `fix` findings landed, and catches regressions. It is a round of its own, in its own folder (`<round-dir>-verify` or the repo's convention), with `mode: "verify"` and `meta.stage: "verify"`.

1. **Setup**: pick the earlier round (the latest with `phase` 6, or the one the user names). Copy its `capture.json`. Phase 0 otherwise as usual, but the design rules and tracker come from the earlier round's `state.json`.
2. **Capture**: sign in and shoot with the same `capture.json`. Pages that no longer load are findings in themselves.
3. **Check**: one subagent per area, with this brief:

   ```
   You verify the fixes from <earlier round> on <project>. For each finding
   below, compare the earlier screenshot and pin with the new screenshot of the
   same view and viewport, and read the code where the fix should be. Decide:
   done, partial (what is still missing), missing, or regression (the fix
   broke something else). Give a CSS selector for where the change shows now.
   Findings: <id, title, fix, earlier screenshot + pin, new screenshot, source files>.
   Write <round-dir>/parts/<area>.json: findings with the same ids, history
   "remaining", `verification`, a one-line `why` that says what you saw, and
   `fix` (what is left, or "Nothing left." when done).
   Reply with one line: the file path and the counts per verdict.
   ```

   The technical auditor runs as in a review round. New detector findings are `regression` when they touch a fixed finding's element, and `new` otherwise.
4. **Before and after**: for each checked finding, cut the region from the earlier screenshot and from the new one:
   - `capture.mjs crop <old-shot> <x,y,w,h> <round>/verify/<id>.before.jpg`;
   - the same for the new shot, as `<id>.after.jpg`.

   Set `before` and `after` on the finding. Recommend `accept` for done, `fix` for partial, missing and regression.
5. **Report, decisions and hand-off** as phases 3–5. The user confirms each verdict with a status: `accept` means confirmed done. The plan holds only what is left. `findings.md` doubles as the verify summary.
