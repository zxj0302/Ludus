import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(webRoot, 'dist');
const indexPath = resolve(distDir, 'index.html');

function hasShellDist(): boolean {
  if (!existsSync(indexPath)) return false;
  const html = readFileSync(indexPath, 'utf8');
  return html.includes('src="./assets/');
}

describe.skipIf(!hasShellDist())('shell build artifacts (mobile/desktop simulation)', () => {
  it('dist exists after build:shell', () => {
    expect(existsSync(distDir), 'run pnpm build:shell first').toBe(true);
    expect(existsSync(indexPath)).toBe(true);
  });

  it('index.html uses relative asset paths for WebView embedding', () => {
    const html = readFileSync(indexPath, 'utf8');
    expect(html).toMatch(/src="\.\/assets\//);
    expect(html).toMatch(/href="\.\/assets\//);
    expect(html).not.toMatch(/src="\/assets\//);
    expect(html).not.toMatch(/href="\/assets\//);
  });

  it('bundled assets and solver worker are present', () => {
    const assetsDir = resolve(distDir, 'assets');
    expect(existsSync(assetsDir)).toBe(true);

    const assets = readdirSync(assetsDir);
    const jsBundles = assets.filter((name) => name.startsWith('index-') && name.endsWith('.js'));
    expect(jsBundles.length).toBeGreaterThan(0);

    const worker = assets.find((name) => name.startsWith('solver.worker-') && name.endsWith('.js'));
    expect(worker, 'solver worker must ship for background solves').toBeTruthy();
  });
});
