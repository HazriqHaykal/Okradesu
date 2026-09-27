// Builds @okradesu/ui: the app's components compiled for the web with
// react-native-web, plus .d.ts types, into .design-sync/pkg/dist for the
// design-sync converter. Run from the repo root: node .design-sync/build-web.mjs
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const require = createRequire(resolve(root, '.ds-sync/package.json'));
const { build } = require('esbuild');

const dist = resolve(root, '.design-sync/pkg/dist');
rmSync(dist, { recursive: true, force: true });

await build({
  absWorkingDir: root,
  entryPoints: ['src/design-system/index.ts'],
  outfile: '.design-sync/pkg/dist/index.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  tsconfig: '.design-sync/tsconfig.dts.json',
  // React stays external so the converter binds it to the page's React.
  external: ['react', 'react/*', 'react-dom', 'react-dom/*'],
  alias: { 'react-native': 'react-native-web' },
  resolveExtensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  mainFields: ['browser', 'module', 'main'],
  loader: { '.js': 'jsx', '.ttf': 'file', '.png': 'file' },
  define: {
    __DEV__: 'false',
    'process.env.NODE_ENV': '"production"',
    'process.env.EXPO_OS': '"web"',
    global: 'globalThis',
  },
  logLevel: 'warning',
});

// react-native-web injects <style id="react-native-stylesheet"> and fills it
// through the CSSOM, so its innerHTML stays empty. The converter's render check
// takes the first element whose id starts with "r" as the preview root and
// reads that empty tag as "root empty". Rename it to something not starting with "r"; nothing else uses the id.
const bundlePath = join(dist, 'index.js');
writeFileSync(bundlePath, readFileSync(bundlePath, 'utf8').replaceAll('react-native-stylesheet', 'okradesu-native-styles'));

// Types: the converter reads each component's props from these.
execSync('npx tsc -p .design-sync/tsconfig.dts.json', { cwd: root, stdio: 'inherit' });

// tsc keeps the app's `@/` aliases and the real expo-router import in the
// emitted .d.ts; rewrite both to relative paths so the converter's type
// reader can follow every re-export without the app's tsconfig.
const types = join(dist, 'types');
const srcTypes = join(types, 'src');
const shimTypes = join(types, '.design-sync', 'shims', 'expo-router');
const rel = (from, to) => {
  const r = relative(dirname(from), to).split(sep).join('/');
  return r.startsWith('.') ? r : `./${r}`;
};
const walk = (d) =>
  readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const ALIAS = /(from\s+|import\()(['"])@\/([^'"]+)\2/g;
const ROUTER = /(from\s+|import\()(['"])expo-router\2/g;
for (const file of walk(types).filter((f) => f.endsWith('.d.ts'))) {
  const text = readFileSync(file, 'utf8')
    .replace(ALIAS, (_, pre, q, p) => `${pre}${q}${rel(file, join(srcTypes, p))}${q}`)
    .replace(ROUTER, (_, pre, q) => `${pre}${q}${rel(file, shimTypes)}${q}`);
  writeFileSync(file, text);
}
// Root types entry so the converter reads the whole tree.
writeFileSync(join(types, 'index.d.ts'), "export * from './src/design-system/index';\n");
console.log('built .design-sync/pkg/dist');
