import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('cross-platform shell packaging', () => {
  it('release package versions are synced to v0.1.1', () => {
    const expectedVersion = '0.1.1';
    const packagePaths = [
      'apps/web/package.json',
      'apps/desktop/package.json',
      'apps/mobile/package.json',
      'packages/core/package.json',
      'packages/games/package.json',
      'packages/education/package.json',
      'packages/ui/package.json',
    ];

    for (const packagePath of packagePaths) {
      const pkg = JSON.parse(readFileSync(resolve(root, packagePath), 'utf8')) as { version: string };
      expect(pkg.version, packagePath).toBe(expectedVersion);
    }

    const tauriConf = JSON.parse(readFileSync(resolve(root, 'apps/desktop/src-tauri/tauri.conf.json'), 'utf8')) as {
      version: string;
    };
    expect(tauriConf.version).toBe(expectedVersion);

    const cargoToml = readFileSync(resolve(root, 'apps/desktop/src-tauri/Cargo.toml'), 'utf8');
    expect(cargoToml).toContain(`version = "${expectedVersion}"`);
  });

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
