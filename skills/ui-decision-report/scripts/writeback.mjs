#!/usr/bin/env node
// Merges the decisions read from the Artifact into findings.json and writes findings.md.
// Refuses while any finding has no decision or any question no answer: every decision is the user's click.
// Usage: node writeback.mjs <roundDir> <decisions.json>
// decisions.json: { "decisions": { "<findingId>": { "status", "note" } }, "answers": { "<questionId>": { "option", "note" } } }
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { STATUSES } from './validate.mjs';

const [roundDir, decisionsPath] = process.argv.slice(2);
if (!roundDir || !decisionsPath) { console.error('Usage: node writeback.mjs <roundDir> <decisions.json>'); process.exit(2); }
const path = join(roundDir, 'findings.json');
const data = JSON.parse(readFileSync(path, 'utf8'));
const got = JSON.parse(readFileSync(decisionsPath, 'utf8'));
const errors = [], undecided = [], unanswered = [];

for (const f of data.findings) {
  const d = got.decisions?.[f.id] ?? {};
  if (!d.status) { undecided.push(f.id); continue; }
  if (!STATUSES.includes(d.status)) errors.push(`decision for ${f.id} has unknown status "${d.status}"`);
  f.decision = { status: d.status, note: d.note ?? '' };
}
for (const q of data.questions ?? []) {
  const a = got.answers?.[q.id] ?? {};
  if (!a.option) { unanswered.push(q.id); continue; }
  if (!q.options.some(o => o.key === a.option)) errors.push(`answer for ${q.id} has unknown option "${a.option}"`);
  q.answer = { option: a.option, note: a.note ?? '' };
}
const known = new Set(data.findings.map(f => f.id));
for (const id of Object.keys(got.decisions ?? {})) if (!known.has(id)) errors.push(`decision for unknown finding "${id}"`);
if (undecided.length) errors.push(`${undecided.length} finding(s) have no decision yet: ${undecided.join(', ')}`);
if (unanswered.length) errors.push(`${unanswered.length} question(s) have no answer yet: ${unanswered.join(', ')}`);
if (errors.length) { console.error(`Nothing written; ${errors.length} problem(s):\n- ` + errors.join('\n- ')); process.exit(1); }

writeFileSync(path, JSON.stringify(data, null, 2));

const sv = data.meta.language === 'sv';
const W = sv
  ? { findings: 'Fynd', questions: 'Frågor', status: { fix: 'Åtgärda', later: 'Senare', accept: 'Acceptera', discuss: 'Diskutera' }, why: 'Varför', fix: 'Åtgärd', decision: 'Beslut', recommended: 'rekommendation', note: 'Anteckning', report: 'Rapport', rule: 'Designregel', says: 'säger', does: 'gör', answer: 'Svar', noTheme: 'Övrigt', decidedBy: 'Avgörs av', newFeatures: 'Nya funktioner (utanför omfånget)', open: 'Fortfarande öppna', appliesTo: 'gäller', alsoFlaggedBy: 'flaggat även av', verification: 'Kontroll' }
  : { findings: 'Findings', questions: 'Questions', status: { fix: 'Fix', later: 'Later', accept: 'Accept', discuss: 'Discuss' }, why: 'Why', fix: 'Fix', decision: 'Decision', recommended: 'recommended', note: 'Note', report: 'Report', rule: 'Design rule', says: 'says', does: 'does', answer: 'Answer', noTheme: 'Other', decidedBy: 'Settled by', newFeatures: 'New features (out of scope)', open: 'Still open', appliesTo: 'applies to', alsoFlaggedBy: 'also flagged by', verification: 'Check' };
const count = s => data.findings.filter(f => f.decision.status === s).length;
const viewName = id => { const v = data.views.find(x => x.id === id); return v ? [v.label, v.role, v.state].filter(Boolean).join(' · ') : id; };
const line = f => `- **${f.severity} · ${f.title}** (\`${f.id}\`, ${viewName(f.view)}${f.viewport ? ` @ ${f.viewport}` : ''}, ${f.source}${f.history ? `, ${f.history}` : ''})`;
const lines = [`# ${data.meta.title}`, '', [data.meta.project, data.meta.date, data.meta.round ? `#${data.meta.round}` : null].filter(Boolean).join(' · '), ''];
if (data.meta.lede) lines.push(data.meta.lede, '');
if (data.meta.artifactUrl) lines.push(`${W.report}: ${data.meta.artifactUrl}`, '');
lines.push(`**${W.findings}:** ${data.findings.length} — ` + STATUSES.map(s => `${W.status[s]} ${count(s)}`).join(', '), '');
if (data.audit?.scores) lines.push(`**Audit:** ` + Object.entries(data.audit.scores).map(([k, v]) => `${k} ${v}`).join(', '), '');

const open = data.findings.filter(f => f.decision.status === 'discuss');
if (open.length) { lines.push(`## ${W.open}`, ''); for (const f of open) lines.push(line(f) + (f.decision.note ? ` — ${f.decision.note}` : '')); lines.push(''); }

if (data.questions?.length) {
  lines.push(`## ${W.questions}`, '');
  for (const q of data.questions) {
    const o = q.options.find(x => x.key === q.answer.option), rec = q.options.find(x => x.recommended);
    lines.push(`### ${q.id} · ${q.question}`, '');
    if (q.why) lines.push(q.why, '');
    lines.push(`**${W.answer}:** ${o.key}) ${o.label}${o.detail ? ` — ${o.detail}` : ''}${rec.key !== o.key ? ` (${W.recommended}: ${rec.key}) ${rec.label})` : ''}`);
    if (q.answer.note) lines.push(`${W.note}: ${q.answer.note}`);
    if (q.findings?.length) lines.push(`${W.findings}: ${q.findings.join(', ')}`);
    lines.push('');
  }
}

lines.push(`## ${W.findings}`, '');
const themes = [...new Set(data.findings.map(f => f.theme ?? W.noTheme))];
for (const t of themes) {
  lines.push(`### ${t}`, '');
  const order = f => STATUSES.indexOf(f.decision.status) * 10 + ['P0', 'P1', 'P2', 'P3'].indexOf(f.severity);
  for (const f of data.findings.filter(x => (x.theme ?? W.noTheme) === t).sort((a, b) => order(a) - order(b))) {
    lines.push(line(f));
    if (f.appliesTo?.length) lines.push(`  - ${W.appliesTo}: ${f.appliesTo.map(viewName).join(', ')}`);
    lines.push(`  - ${W.why}: ${f.why}`);
    lines.push(`  - ${W.fix}: ${f.fix}`);
    if (f.rule) lines.push(`  - ${W.rule}${f.rule.ref ? ` ${f.rule.ref}` : ''}: ${W.says} "${f.rule.says.replace(/[.]\s*$/, '')}", ${W.does} "${f.rule.does.replace(/[.]\s*$/, '')}"`);
    if (f.alsoFlaggedBy?.length) lines.push(`  - ${W.alsoFlaggedBy}: ${f.alsoFlaggedBy.join(', ')}`);
    if (f.verification) lines.push(`  - ${W.verification}: ${f.verification}`);
    if (f.question) lines.push(`  - ${W.decidedBy} ${f.question}`);
    lines.push(`  - ${W.decision}: **${W.status[f.decision.status]}**${f.decision.status !== f.suggested ? ` (${W.recommended}: ${W.status[f.suggested]})` : ''}${f.decision.note ? ` — ${f.decision.note}` : ''}`);
  }
  lines.push('');
}
const features = data.findings.filter(f => f.newFeature && ['fix', 'later'].includes(f.decision.status));
if (features.length) { lines.push(`## ${W.newFeatures}`, ''); for (const f of features) lines.push(line(f)); lines.push(''); }

writeFileSync(join(roundDir, 'findings.md'), lines.join('\n'));
const changed = data.findings.filter(f => f.decision.status !== f.suggested).length;
console.log(`Wrote findings.md and updated findings.json: ${changed} of ${data.findings.length} decisions differ from the recommendation; ` + STATUSES.map(s => `${s} ${count(s)}`).join(', ') + '.');
