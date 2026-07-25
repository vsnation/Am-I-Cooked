// The engine is duplicated on purpose — the PWA has no bundler and cooked-skill ships
// standalone — so apps/api is the single source and every copy must be byte-identical.
// Drift here is not cosmetic: the stale cooked-skill copy was scoring the same wallet
// differently from the app (no per-protocol dedup, substring incident matching, no
// !r.ok guard), and nothing caught it until someone diffed the files by hand.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../../../', import.meta.url);
const sha = p => createHash('sha256').update(readFileSync(new URL(p, root))).digest('hex');

const COPIES = {
  'autopsy.js': ['apps/web/lib/autopsy.js', 'packages/cooked-skill/src/autopsy.js'],
  'approvals.js': ['apps/web/lib/approvals.js'],
};

for (const [name, copies] of Object.entries(COPIES)) {
  const canonical = `apps/api/${name}`;
  for (const copy of copies) {
    test(`${copy} is identical to ${canonical}`, () => {
      assert.equal(sha(copy), sha(canonical),
        `${copy} has drifted from ${canonical} — copy the canonical file over it (cp ${canonical} ${copy})`);
    });
  }
}
