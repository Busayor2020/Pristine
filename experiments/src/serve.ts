/**
 * Hands the candidates to the phone over the local network.
 *
 * The files are built on a computer and posted from a handset, and every
 * convenient way of bridging that gap is one that re-encodes: sending them
 * through WhatsApp compresses them, and a gallery sync set to anything but
 * original quality resamples them. Either would mean the run measures damage
 * that happened before Status ever saw the file.
 *
 * A plain HTTP GET does not. The bytes that leave here are the bytes that
 * arrive, which is the only property this needs to have. Everything is served
 * as an attachment so the browser saves the file rather than decoding it into
 * a player or an image view, and every response carries its length so the
 * download can be checked against the listing.
 *
 * Read only, and only while the command is running.
 */
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { color } from '@pristine/tokens';

export interface ServeOptions {
  readonly dir: string;
  readonly port: number;
  readonly host?: string;
}

export interface Served {
  readonly url: string;
  readonly files: readonly ServedFile[];
  readonly close: () => Promise<void>;
}

export interface ServedFile {
  readonly name: string;
  readonly bytes: number;
}

/** The candidates, ignoring the manifest and the scratch directory. */
export function listServable(dir: string): ServedFile[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.jpg') || name.endsWith('.mp4'))
    .sort()
    .map((name) => ({ name, bytes: fs.statSync(path.join(dir, name)).size }));
}

/**
 * The address the phone should type in.
 *
 * A phone cannot reach `localhost` on another machine, so the loopback
 * addresses are no use here and are skipped. IPv4 only, because typing an IPv6
 * address into a phone by hand is not a thing anyone should be asked to do.
 */
export function lanAddress(interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>): string | null {
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) return entry.address;
    }
  }
  return null;
}

const TYPES: Readonly<Record<string, string>> = {
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
};

/**
 * Turns a request path into a file in the served directory, or null.
 *
 * The directory is on the machine's own network, so this checks the resolved
 * path really sits inside it rather than trusting the request. A served
 * directory is a small thing to get wrong and an unpleasant thing to get wrong.
 */
export function resolveRequest(dir: string, url: string): string | null {
  const name = decodeURIComponent((url.split('?')[0] ?? '').replace(/^\/+/, ''));
  if (name === '') return null;
  if (!(name.endsWith('.jpg') || name.endsWith('.mp4'))) return null;
  const resolved = path.resolve(dir, name);
  const within = path.resolve(dir) + path.sep;
  if (!resolved.startsWith(within)) return null;
  return fs.existsSync(resolved) ? resolved : null;
}

/**
 * The listing page. Deliberately plain: it is read once, on a phone.
 *
 * Colours come from the token package rather than being written here, because
 * the repo allows colour literals in exactly one place and this is not it.
 * Nothing else about this page is shared with the app, and it is not worth
 * making it so.
 */
export function indexPage(files: readonly ServedFile[]): string {
  const rows = files
    .map(
      (file) =>
        `<li><a href="/${encodeURIComponent(file.name)}" download>${file.name}</a>` +
        ` <span>${file.bytes.toLocaleString('en')} bytes</span></li>`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pristine candidates</title>
<style>
  body { font: 16px/1.6 system-ui, sans-serif; margin: 0; padding: 24px; background: ${color.surface[0]}; color: ${color.text.primary}; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p { color: ${color.text.muted}; margin: 0 0 24px; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { padding: 14px 0; border-bottom: 1px solid ${color.border.subtle}; display: flex; justify-content: space-between; gap: 12px; }
  a { color: ${color.accent.base}; text-decoration: none; font-weight: 600; }
  span { color: ${color.text.muted}; font-size: 13px; white-space: nowrap; }
</style>
</head>
<body>
<h1>Pristine candidates</h1>
<p>Save each one, then check the size on the phone matches the size here. If it does not, the download changed the file and the run is void.</p>
<ul>
${rows}
</ul>
</body>
</html>`;
}

export function serve(options: ServeOptions): Promise<Served> {
  const files = listServable(options.dir);

  const server = http.createServer((request, response) => {
    const url = request.url ?? '/';
    if (url === '/' || url.startsWith('/?')) {
      const body = indexPage(listServable(options.dir));
      response.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'content-length': Buffer.byteLength(body),
      });
      response.end(body);
      return;
    }

    const file = resolveRequest(options.dir, url);
    if (file === null) {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('not found\n');
      return;
    }

    const { size } = fs.statSync(file);
    response.writeHead(200, {
      'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
      'content-length': size,
      // Save it, do not open it in a player. A file the browser decoded is not
      // the file that was built.
      'content-disposition': `attachment; filename="${path.basename(file)}"`,
    });
    fs.createReadStream(file).pipe(response);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port, options.host ?? '0.0.0.0', () => {
      const address = server.address();
      const port = typeof address === 'object' && address !== null ? address.port : options.port;
      const host = lanAddress(os.networkInterfaces()) ?? 'localhost';
      resolve({
        url: `http://${host}:${port}/`,
        files,
        close: () =>
          new Promise((done) => {
            server.close(() => done());
          }),
      });
    });
  });
}
