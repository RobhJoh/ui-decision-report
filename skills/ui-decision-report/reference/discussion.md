# Discussion loop

Runs while `open-items.mjs` lists findings marked `discuss`, or notes that ask a question.

1. For each item, read the user's note and comments: the Artifact's comment threads (`ArtifactComments` `read`) as well as the note field.
2. Write a discussion question per item, or one per group of items that one answer settles:
   - Answer the user's question first, in `why`.
   - Give 2–3 variants, each with a zoom and a full-view mockup (built as `synthesis.md` describes) and one recommended.
   - Where the variants differ in something measurable (contrast, tap-target size, number of steps), state the numbers before and after in `detail`.
3. Add the questions to `findings.json` with `round` set to the next discussion number. Set `meta.stage` to `"discussion"` and `meta.discussionRound` to that number. Link each question's findings to it with `question`.
4. Build and republish to the same file path. The page then opens on "only what is open": the discussed findings and the new questions.
5. Tell the user what is waiting, and stop at gate 4. When they are done, read the decisions back and run `open-items.mjs` again. Repeat until it exits 0, or until the user says to leave the rest open for the team.

Answering the question settles its linked findings: the report sets each one that is undecided or marked `discuss` to `fix` per the chosen option, and the card says so. The user can still click another status (`later`, `accept`) on the finding; that click wins. Increment `discussionRounds` in `state.json` each loop.
