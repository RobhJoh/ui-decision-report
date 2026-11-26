#!/usr/bin/env node
// Validates <roundDir>/findings.json and builds <roundDir>/report.html from the template.
// Usage: node build.mjs <roundDir>
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from './validate.mjs';

const roundDir = process.argv[2];
if (!roundDir) { console.error('Usage: node build.mjs <roundDir>'); process.exit(2); }

const data = JSON.parse(readFileSync(join(roundDir, 'findings.json'), 'utf8'));
const errors = validate(data, file => existsSync(join(roundDir, file)));
if (errors.length) {
  console.error(`findings.json has ${errors.length} error(s):\n- ` + errors.join('\n- '));
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(here, '..', 'template', 'report.html'), 'utf8');
const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const html = template.replace('__TITLE__', () => escapeHtml(data.meta.title)).replace('__DATA__', () => json);
writeFileSync(join(roundDir, 'report.html'), html);

const files = [...new Set([
  ...data.screens.map(s => s.file),
  ...data.findings.flatMap(f => [f.mockup?.before, f.mockup?.after, f.before, f.after]),
  ...(data.questions ?? []).flatMap(q => q.options.map(o => o.mockup)),
].filter(Boolean))];
console.log(`Built ${join(roundDir, 'report.html')}: ${data.findings.length} findings, ${(data.questions ?? []).length} questions, ${files.length} files to publish beside the page.`);
console.log('Publish with files: ' + JSON.stringify(Object.fromEntries(files.map(f => [f, join(roundDir, f)]))));
