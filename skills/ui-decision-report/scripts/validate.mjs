// Checks a findings.json against the schema in reference/findings-schema.md.
// Returns a list of error strings; empty means valid.
export const SEVERITIES = ['P0', 'P1', 'P2', 'P3'];
export const STATUSES = ['fix', 'later', 'accept', 'discuss'];
const SOURCES = ['critique', 'audit'];
const HISTORY = ['new', 'remaining', 'changed'];
const VERIFICATION = ['done', 'partial', 'missing', 'regression'];
const ID = /^[a-z0-9][a-z0-9-]*$/;

const isText = v => typeof v === 'string' && v.trim().length > 0;
const isPct = v => typeof v === 'number' && v >= 0 && v <= 100;

export function validate(data, fileExists) {
  const errors = [];
  const err = m => errors.push(m);
  const file = (label, f) => { if (!isText(f) || !fileExists(f)) err(`${label}: file "${f}" does not exist`); };
  const m = data.meta ?? {};
  if (!isText(m.title)) err('meta.title is required');
  if (!['sv', 'en'].includes(m.language)) err('meta.language must be "sv" or "en"');
  if (!isText(m.date)) err('meta.date is required');
  if (m.stage !== undefined && !['decisions', 'discussion', 'verify'].includes(m.stage)) err('meta.stage must be decisions, discussion or verify');

  const views = data.views ?? [], screens = data.screens ?? [], findings = data.findings ?? [], questions = data.questions ?? [];
  const viewIds = new Set();
  for (const v of views) {
    if (!isText(v.id) || !ID.test(v.id)) err(`view id "${v.id}" must be lower-case ASCII letters, digits and hyphens`);
    else if (viewIds.has(v.id)) err(`view id "${v.id}" is not unique`);
    viewIds.add(v.id);
    if (!isText(v.label)) err(`view "${v.id}" has no label`);
    if (v.inventory !== undefined && !Array.isArray(v.inventory)) err(`view "${v.id}" inventory must be a list`);
    if (v.scores) for (let i = 1; i <= 10; i++) {
      const s = v.scores['h' + i];
      if (s !== null && s !== undefined && !(Number.isInteger(s) && s >= 0 && s <= 4)) err(`view "${v.id}" score h${i} must be 0–4 or null`);
    }
  }
  const screenKeys = new Set();
  for (const s of screens) {
    if (!viewIds.has(s.view)) err(`screen ${s.file} points at unknown view "${s.view}"`);
    if (!isText(s.viewport)) err(`screen ${s.file} has no viewport`);
    if (!(s.w > 0 && s.h > 0)) err(`screen ${s.file} needs w and h`);
    file(`screen of ${s.view}`, s.file);
    screenKeys.add(`${s.view}|${s.viewport}`);
  }
  const questionIds = new Set();
  for (const q of questions) {
    if (!isText(q.id) || questionIds.has(q.id)) err(`question id "${q.id}" is missing or not unique`);
    questionIds.add(q.id);
    if (!isText(q.question)) err(`question ${q.id} has no question text`);
    const opts = q.options ?? [];
    if (opts.length < 2) err(`question ${q.id} needs at least two options`);
    if (new Set(opts.map(o => o.key)).size !== opts.length) err(`question ${q.id} has duplicate option keys`);
    if (opts.filter(o => o.recommended).length !== 1) err(`question ${q.id} needs exactly one recommended option`);
    for (const o of opts) {
      if (!isText(o.key) || !isText(o.label)) err(`question ${q.id} has an option without key or label`);
      if (o.mock !== undefined) err(`question ${q.id} option ${o.key} uses "mock"; use a "mockup" file instead`);
      if (o.mockup !== undefined) file(`question ${q.id} option ${o.key} mockup`, o.mockup);
    }
  }
  const findingIds = new Set();
  for (const f of findings) {
    const at = `finding "${f.id}"`;
    if (!isText(f.id) || !ID.test(f.id)) err(`${at}: id must be lower-case ASCII letters, digits and hyphens`);
    else if (findingIds.has(f.id)) err(`${at} is not unique`);
    findingIds.add(f.id);
    if (!viewIds.has(f.view)) err(`${at} points at unknown view "${f.view}"`);
    for (const k of ['title', 'why', 'fix']) if (!isText(f[k])) err(`${at} has no ${k}`);
    if (!SEVERITIES.includes(f.severity)) err(`${at} severity must be one of ${SEVERITIES}`);
    if (!SOURCES.includes(f.source)) err(`${at} source must be one of ${SOURCES}`);
    if (!STATUSES.includes(f.suggested)) err(`${at} suggested must be one of ${STATUSES}`);
    if (!isText(f.theme)) err(`${at} has no theme`);
    if (f.history !== undefined && !HISTORY.includes(f.history)) err(`${at} history must be one of ${HISTORY}`);
    if (f.verification !== undefined && !VERIFICATION.includes(f.verification)) err(`${at} verification must be one of ${VERIFICATION}`);
    if (f.viewport && !screenKeys.has(`${f.view}|${f.viewport}`)) err(`${at} has viewport "${f.viewport}" but no screenshot for it`);
    if (f.pin) {
      if (!f.viewport) err(`${at} has a pin but no viewport`);
      if (![f.pin.x, f.pin.y, f.pin.w, f.pin.h].every(isPct)) err(`${at} pin values must be percentages 0–100`);
    }
    for (const [vpName, pin] of Object.entries(f.pins ?? {})) {
      if (f.viewport) err(`${at} has pins per viewport but also a viewport; use pin`);
      if (!screenKeys.has(`${f.view}|${vpName}`)) err(`${at} has a pin for "${vpName}" but no screenshot for it`);
      if (![pin.x, pin.y, pin.w, pin.h].every(isPct)) err(`${at} pins.${vpName} values must be percentages 0–100`);
    }
    if (f.question && !questionIds.has(f.question)) err(`${at} points at unknown question "${f.question}"`);
    if (f.rule && !(isText(f.rule.says) && isText(f.rule.does))) err(`${at} rule needs says and does`);
    if (f.alsoFlaggedBy !== undefined && !(Array.isArray(f.alsoFlaggedBy) && f.alsoFlaggedBy.every(isText))) err(`${at} alsoFlaggedBy must be a list of names`);
    for (const id of f.appliesTo ?? []) if (!viewIds.has(id)) err(`${at} appliesTo unknown view "${id}"`);
    if (f.mockup?.before !== undefined) file(`${at} mockup.before`, f.mockup.before);
    if (f.mockup?.after !== undefined) file(`${at} mockup.after`, f.mockup.after);
    if (f.before !== undefined) file(`${at} before`, f.before);
    if (f.after !== undefined) file(`${at} after`, f.after);
  }
  for (const q of questions) for (const id of q.findings ?? []) if (!findingIds.has(id)) err(`question ${q.id} lists unknown finding "${id}"`);
  return errors;
}
