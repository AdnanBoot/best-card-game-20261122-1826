import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const rootDir = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

/**
 * Copy a directory from the repository root into the output directory,
 * replacing any previous copy so no stale files remain.
 */
function syncDir(name: string): void {
  const src = join(rootDir, name);
  const dest = join(outputDir, name);
  rmSync(dest, { recursive: true, force: true });
  if (existsSync(src)) {
    cpSync(src, dest, { recursive: true });
  }
}

mkdirSync(outputDir, { recursive: true });
syncDir('game');
syncDir('screenshots');

const dossierBytes = buildDossier(outputDir, CAPS);
writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
