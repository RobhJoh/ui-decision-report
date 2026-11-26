#!/usr/bin/env node
// Reports what is still open in a round from the decisions read back from the Artifact:
// findings without a decision, findings marked discuss, and questions without an answer.
// Usage: node open-items.mjs <roundDir> <decisions.json>   (exit 0 when nothing is open)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const [roundDir, decisionsPath] = process.argv.slice(2);
if (!roundDir || !decisionsPath) { console.error('Usage: node open-items.mjs <roundDir> <decisions.json>'); process.exit(2); }
const data = JSON.parse(readFileSync(join(roundDir, 'findings.json'), 'utf8'));
const got = JSON.parse(readFileSync(decisionsPath, 'utf8'));
const undecided = data.findings.filter(f => !got.decisions?.[f.id]?.status);
const discuss = data.findings.filter(f => got.decisions?.[f.id]?.status === 'discuss');
const unanswered = (data.questions ?? []).filter(q => !got.answers?.[q.id]?.option);
const withNotes = data.findings.filter(f => got.decisions?.[f.id]?.note?.includes('?'));
const show = (title, list, fmt) => { if (list.length) console.log(`${title} (${list.length}):\n` + list.map(x => '- ' + fmt(x)).join('\n')); };
show('No decision yet', undecided, f => `${f.id} · ${f.title}`);
show('Marked discuss', discuss, f => `${f.id} · ${f.title}${got.decisions[f.id].note ? ` — note: ${got.decisions[f.id].note}` : ''}`);
show('Questions without an answer', unanswered, q => `${q.id} · ${q.question}`);
show('Notes that ask a question', withNotes, f => `${f.id} — ${got.decisions[f.id].note}`);
const openCount = undecided.length + discuss.length + unanswered.length;
console.log(openCount ? `${openCount} item(s) open.` : 'Nothing is open.');
process.exit(openCount ? 1 : 0);
