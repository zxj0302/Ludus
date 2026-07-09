import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('cross-platform shell packaging', () => {
  it('tauri.conf.json points to web dist', () => {
    const confPath = resolve(root, 'apps/desktop/src-tauri/tauri.conf.json');
    const conf = JSON.parse(readFileSync(confPath, 'utf8')) as {
      build: { frontendDist: string; beforeBuildCommand: string; beforeDevCommand: string };
    };
    expect(conf.build.frontendDist).toBe('../../web/dist');
    expect(conf.build.beforeBuildCommand).toContain('build:shell');
    // workspace filter — independent of Tauri beforeDevCommand cwd (apps/desktop)
    expect(conf.build.beforeDevCommand).toContain('ludus-web');
    const distPath = resolve(root, 'apps/desktop/src-tauri', conf.build.frontendDist);
    expect(distPath).toBe(resolve(root, 'apps/web/dist'));
  });

  it('capacitor.config.ts uses web dist', () => {
    const capPath = resolve(root, 'apps/mobile/capacitor.config.ts');
    const text = readFileSync(capPath, 'utf8');
    expect(text).toContain("webDir: '../web/dist'");
  });

  it('shell mode uses relative asset base', () => {
    const vitePath = resolve(root, 'apps/web/vite.config.ts');
    const text = readFileSync(vitePath, 'utf8');
    expect(text).toContain("mode === 'shell'");
    expect(text).toContain("'./'");
  });

  it('pages mode uses /Ludus/ base for GitHub Pages', () => {
    const vitePath = resolve(root, 'apps/web/vite.config.ts');
    const text = readFileSync(vitePath, 'utf8');
    expect(text).toContain("mode === 'pages'");
    expect(text).toContain("'/Ludus/'");
  });
});
