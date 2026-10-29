import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '..');
let count = 0;
for (const directory of ['web', 'shared', 'worker', 'scripts', 'tests']) {
  for (const entry of await readdir(resolve(root, directory), { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.mjs')) continue;
    const check = spawnSync(process.execPath, ['--check', resolve(root, directory, entry.name)], { encoding: 'utf8' });
    if (check.status !== 0) throw new Error(check.stderr);
    count++;
  }
}
const css = await readFile(resolve(root, 'web/styles.css'), 'utf8');
if (css.includes('@import')) throw new Error('La interfaz debe funcionar sin estilos remotos.');
const config = JSON.parse(await readFile(resolve(root, 'wrangler.jsonc'), 'utf8'));
if (config.vars.AI_ENABLED !== 'false' || config.vars.BUDGET_READY !== 'false') throw new Error('El código versionado debe mantener la API de pago desactivada.');
console.log(count + ' módulos comprobados. Llamadas de pago desactivadas por defecto.');
