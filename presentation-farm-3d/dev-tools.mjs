import { createRequire } from 'node:module';

const local = createRequire(import.meta.url);
const workspace = createRequire(new URL('../.ds-sync/package.json', import.meta.url));

// Standalone installs take priority; reuse the workspace tools when available.
export function devTool(name) {
  let path;
  try { path = local.resolve(name); }
  catch { path = workspace.resolve(name); }
  return local(path);
}
