import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const SRC = process.argv[2];
const OUT = process.argv[3];

const html = fs.readFileSync(SRC, 'utf8');

function scriptBody(type) {
  const open = html.indexOf(`<script type="${type}">`);
  if (open < 0) return null;
  const start = html.indexOf('>', open) + 1;
  const end = html.indexOf('</script>', start);
  return html.slice(start, end);
}

const manifest = JSON.parse(scriptBody('__bundler/manifest'));
const template = JSON.parse(scriptBody('__bundler/template'));
const pageOrderRaw = scriptBody('__bundler/page_order');
const pageOrder = pageOrderRaw ? JSON.parse(pageOrderRaw) : [];

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });

const report = [];
for (const [uuid, entry] of Object.entries(manifest)) {
  let bytes = Buffer.from(entry.data, 'base64');
  if (entry.compressed) bytes = zlib.gunzipSync(bytes);
  const isPage = pageOrder.includes(uuid);
  const mime = entry.mime || '';
  let ext = 'bin';
  if (isPage || /html/.test(mime)) ext = 'html';
  else if (/woff2/.test(mime)) ext = 'woff2';
  else if (/woff/.test(mime)) ext = 'woff';
  else if (/ttf|truetype/.test(mime)) ext = 'ttf';
  else if (/otf|opentype/.test(mime)) ext = 'otf';
  else if (/svg/.test(mime)) ext = 'svg';
  else if (/png/.test(mime)) ext = 'png';
  else if (/jpe?g/.test(mime)) ext = 'jpg';
  else if (/css/.test(mime)) ext = 'css';
  else if (/javascript/.test(mime)) ext = 'js';
  else if (/json/.test(mime)) ext = 'json';
  else if (/woff|font/.test(mime)) ext = 'font';
  const name = `${uuid}.${ext}`;
  fs.writeFileSync(path.join(OUT, 'assets', name), bytes);
  report.push({ uuid, mime, compressed: !!entry.compressed, bytes: bytes.length, isPage, name });
}

fs.writeFileSync(path.join(OUT, 'template.html'), template);
fs.writeFileSync(
  path.join(OUT, 'manifest-report.json'),
  JSON.stringify({ pageOrder, report }, null, 2),
);

console.log('template chars:', template.length);
console.log('pageOrder:', pageOrder.length);
console.table(
  report.map((r) => ({ name: r.name, mime: r.mime, bytes: r.bytes, isPage: r.isPage })),
);
