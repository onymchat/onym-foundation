// Browser tests: layout at 390px and 1440px, mobile menu behavior, and an
// axe-core accessibility pass. Drives an installed Chrome via puppeteer-core;
// set CHROME_PATH to the binary, or the macOS default is used. Skips (with a
// warning) when no Chrome is available.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { AxePuppeteer } from '@axe-core/puppeteer';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
const CHROME = process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain' };

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.join(SITE, p);
      if (!file.startsWith(SITE) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(fs.readFileSync(file));
    });
    srv.listen(0, () => resolve(srv));
  });
}

if (!fs.existsSync(CHROME)) {
  test('browser tests', { skip: 'no Chrome binary found (set CHROME_PATH)' }, () => {});
} else {
  test('browser', async t => {
    const srv = await serve();
    const base = `http://localhost:${srv.address().port}`;
    const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
    t.after(async () => { await browser.close(); srv.close(); });

    const PAGES = ['/index.html', '/seats.html', '/governance.html', '/transparency.html',
      '/sponsors.html', '/pledge.html', '/contracts/message/UI-Message.html', '/contracts/bank/UI-Bank.html'];

    await t.test('no horizontal overflow at 390px on any page', async () => {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844 });
      for (const p of PAGES) {
        await page.goto(base + p, { waitUntil: 'networkidle0' });
        const over = await page.evaluate(() =>
          document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(over <= 1, `${p}: page is ${over}px wider than the 390px viewport`);
      }
      await page.close();
    });

    await t.test('mobile menu collapses and toggles', async () => {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844 });
      await page.goto(base + '/index.html', { waitUntil: 'networkidle0' });
      const btnVisible = await page.$eval('.menubtn', el => getComputedStyle(el).display !== 'none');
      assert.ok(btnVisible, 'menu button should be visible at 390px');
      const linksHidden = await page.$eval('#sitemenu', el => getComputedStyle(el).display === 'none');
      assert.ok(linksHidden, 'nav links should be collapsed at 390px');
      await page.click('.menubtn');
      const open = await page.$eval('#sitemenu', el => getComputedStyle(el).display !== 'none');
      assert.ok(open, 'menu should open on click');
      assert.equal(await page.$eval('.menubtn', el => el.getAttribute('aria-expanded')), 'true');
      await page.close();
    });

    await t.test('desktop 1440px shows full nav, no overflow', async () => {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(base + '/index.html', { waitUntil: 'networkidle0' });
      const over = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(over <= 1, `page is ${over}px wider than the viewport`);
      const links = await page.$eval('#sitemenu', el => getComputedStyle(el).display);
      assert.equal(links, 'flex');
      await page.close();
    });

    await t.test('contract page renders content with badges', async () => {
      const page = await browser.newPage();
      await page.goto(base + '/contracts/message/UI-Message.html', { waitUntil: 'networkidle0' });
      const h1 = await page.$eval('.doc h1', el => el.textContent);
      assert.match(h1, /Message Transport Boundary/);
      const badge = await page.$eval('.badges .tag', el => el.textContent);
      assert.equal(badge, 'draft');
      await page.close();
    });

    await t.test('axe: no serious or critical violations on key pages', async () => {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      for (const p of ['/index.html', '/seats.html', '/sponsors.html', '/contracts/message/UI-Message.html']) {
        await page.goto(base + p, { waitUntil: 'networkidle0' });
        const results = await new AxePuppeteer(page).analyze();
        const bad = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
        assert.deepEqual(bad.map(v => `${p}: ${v.id} — ${v.help}`), [], JSON.stringify(bad, null, 2).slice(0, 2000));
      }
      await page.close();
    });
  });
}
