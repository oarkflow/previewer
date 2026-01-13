import { mkdir, copyFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..');
const dstDir = path.join(repoRoot, 'public');
const dst = path.join(dstDir, 'pdf.worker.mjs');

async function findPdfWorker() {
  // Preferred: resolve via Node's module resolution.
  try {
    const require = createRequire(import.meta.url);
    const pkgJsonPath = require.resolve('pdfjs-dist/package.json');
    const pkgRoot = path.dirname(pkgJsonPath);
    return path.join(pkgRoot, 'build', 'pdf.worker.min.mjs');
  } catch {
    // fall through
  }

  // Fallback for pnpm layouts: scan node_modules/.pnpm for pdfjs-dist.
  const pnpmDir = path.join(repoRoot, 'node_modules', '.pnpm');
  const entries = await readdir(pnpmDir).catch(() => []);
  for (const entry of entries) {
    if (!entry.startsWith('pdfjs-dist@')) continue;
    const candidate = path.join(pnpmDir, entry, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
    try {
      const s = await stat(candidate);
      if (s.isFile()) return candidate;
    } catch {
      // ignore
    }
  }

  throw new Error('Could not locate pdfjs-dist worker file');
}

try {
	const src = await findPdfWorker();
  await mkdir(dstDir, { recursive: true });
  await copyFile(src, dst);
  // eslint-disable-next-line no-console
  console.log(`[copy-pdf-worker] Copied ${path.relative(repoRoot, src)} -> ${path.relative(repoRoot, dst)}`);
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[copy-pdf-worker] Failed to copy PDF worker. Ensure dependencies are installed.', err);
  process.exit(1);
}
