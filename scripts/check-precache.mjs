// sw.js PRECACHE listesini dosya sistemiyle karşılaştırır.
// Eksik dosya ya da listeye eklenmemiş css/js varsa hata verir.  `npm run check`
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const list = [...sw.matchAll(/'\.\/([^']*)'/g)].map(m => m[1]).filter(Boolean);
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [relative(root, p)]; });

let bad = 0;
for (const f of list) if (!existsSync(join(root, f))) { console.error('✗ listede var, dosya yok:', f); bad++; }
for (const f of [...walk(join(root, 'js')), ...walk(join(root, 'css'))]) if (!list.includes(f)) { console.error('✗ önbellek listesinde yok:', f); bad++; }
if (bad) process.exit(1);
console.log(`✓ precache listesi tamam (${list.length} dosya)`);
