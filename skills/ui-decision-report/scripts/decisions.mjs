// The status a finding ends up with, from the decisions read back from the Artifact.
// A finding linked to a question that has an answer counts as fix when it is undecided or marked
// discuss: the user's answer settles it, so the chosen option becomes its fix. The report writes the
// same thing when the user answers; this is the guard for decisions saved before that.
export function statusOf(f, got, questions = []) {
  const d = got.decisions?.[f.id] ?? {};
  const q = f.question && questions.find(x => x.id === f.question);
  const option = q && got.answers?.[q.id]?.option;
  if (option && (!d.status || d.status === 'discuss')) return { status: 'fix', note: d.note ?? '', via: `${q.id} ${option}` };
  return { status: d.status ?? null, note: d.note ?? '', via: d.via ?? null };
}

// Findings whose final fix must be written before the plan: a fix or later decision with an answered
// question or a note from the user, either of which can change what the original fix says.
export const needsFinalFix = (f, questions = []) => ['fix', 'later'].includes(f.decision?.status) && !f.finalFix
  && (Boolean(f.decision.note?.trim()) || Boolean(f.decision.via) || Boolean(f.question && questions.find(q => q.id === f.question)?.answer));
