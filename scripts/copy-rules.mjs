/**
 * Copies the mobile repo's security rules and indexes into emulator/rules/
 * so the Emulator Suite runs the exact rules production uses. The mobile
 * repo stays the single source of truth: this only reads from it, and the
 * copies are git-ignored. Set HARBOR_MOBILE_REPO if it isn't a sibling
 * folder named "Harbor".
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mobile = path.resolve(root, process.env.HARBOR_MOBILE_REPO ?? '../Harbor');
const out = path.join(root, 'emulator', 'rules');
const files = ['firestore.rules', 'storage.rules', 'firestore.indexes.json'];

mkdirSync(out, { recursive: true });
for (const f of files) {
  const src = path.join(mobile, f);
  if (!existsSync(src)) {
    console.error(`Missing ${src}. Set HARBOR_MOBILE_REPO to the mobile app's folder.`);
    process.exit(1);
  }
  copyFileSync(src, path.join(out, f));
}
console.log(`Copied ${files.join(', ')} from ${mobile}`);

// Opt-in, emulator copy only: storage.rules line 32 writes the regex escape
// as '\.', which the Storage emulator's rules runtime rejects as a syntax
// error (Firebase documents '\\.'). This patches ONLY the git-ignored copy
// so the Storage checks can run; the mobile repo's file is never touched.
if (process.env.HARBOR_EMULATOR_PATCH_STORAGE_ESCAPE === '1') {
  const p = path.join(out, 'storage.rules');
  const before = readFileSync(p, 'utf8');
  const after = before.replace("{1,64}\\.jpg'", "{1,64}\\\\.jpg'");
  writeFileSync(p, after);
  console.warn(
    after === before
      ? 'WARNING: storage escape patch requested but the pattern was not found; rules copied unchanged.'
      : "WARNING: emulator copy of storage.rules patched: '\\.jpg' -> '\\\\.jpg' (see the sync report).",
  );
}
