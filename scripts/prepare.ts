// generate stub html files for dev entry
import { execSync } from 'node:child_process';
import fs from 'fs-extra';
import chokidar from 'chokidar';
import { isDev, log, port, r } from './utils';

/**
 * Stub html to use Vite in development
 */
async function stubIndexHtml() {
  const views = ['options', 'popup'];

  for (const view of views) {
    await fs.ensureDir(r(`extension/dist/${view}`));
    let data = await fs.readFile(r(`src/${view}.html`), 'utf-8');
    data = data
      .replace(`"./${view}.js"`, `"http://localhost:${port}/${view}.js"`)
      .replace(
        '<div id="tl-webext-app"></div>',
        '<div id="tl-webext-app">Vite server did not start</div>'
      );
    await fs.writeFile(r(`extension/dist/${view}.html`), data, 'utf-8');
    log('PRE', `stub ${view}`);
  }
}

function writeManifest() {
  execSync('npx esno ./scripts/manifest.ts', { stdio: 'inherit' });
}

writeManifest();

if (isDev) {
  stubIndexHtml();
  chokidar.watch(r('src/**/*.html')).on('change', () => {
    stubIndexHtml();
  });
  chokidar.watch([r('src/manifest.ts'), r('package.json')]).on('change', () => {
    writeManifest();
  });
}
