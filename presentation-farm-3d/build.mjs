import { devTool } from './dev-tools.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const folder=dirname(fileURLToPath(import.meta.url));
const {build}=devTool('esbuild');
await build({entryPoints:[resolve(folder,'farm.mjs')],outfile:resolve(folder,'farm.bundle.js'),bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,legalComments:'eof',alias:{three:resolve(folder,'vendor/three.module.js')}});
console.log('Built presentation-farm-3d/farm.bundle.js — offline, double-click ready.');
