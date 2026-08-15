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
  /** Destination name to directory, for files coming back off the phone. */
  readonly uploads?: Readonly<Record<string, string>>;
  readonly port: number;
  readonly host?: string;
}

/**
 * Cap on a single upload.
 *
 * A returned Status video is small, and the largest candidate here is under
 * 4 MB. This is not a security boundary, it is a stop on filling the disk if
 * something points at this endpoint that should not.
 */
export const MAX_UPLOAD_BYTES = 64 * 1024 * 1024;

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

const UPLOADABLE = ['.jpg', '.jpeg', '.png', '.mp4'];

/**
 * Where an upload should land, or null.
 *
 * The destination has to be one this run offered, and the name is reduced to
 * its basename before anything else, so a path sent from the phone cannot
 * decide where the file goes. Same reasoning as `resolveRequest`: this is
 * listening on the network, so nothing arriving over it is trusted.
 */
export function resolveUpload(
  uploads: Readonly<Record<string, string>>,
  url: string,
): { dir: string; file: string } | null {
  // Split before decoding, not after. Decoding first would turn an encoded
  // separator into a real one and change the shape of the path, which is the
  // usual way this kind of check gets walked past.
  const parts = (url.split('?')[0] ?? '').replace(/^\/+/, '').split('/');
  if (parts.length !== 3 || parts[0] !== 'upload') return null;
  const destination = decodeURIComponent(parts[1] ?? '');
  const requested = decodeURIComponent(parts[2] ?? '');
  const dir = uploads[destination];
  if (dir === undefined) return null;

  const name = path.basename(requested);
  if (name === '' || name.startsWith('.')) return null;
  if (!UPLOADABLE.includes(path.extname(name).toLowerCase())) return null;

  const resolved = path.resolve(dir, name);
  if (!resolved.startsWith(path.resolve(dir) + path.sep)) return null;
  return { dir, file: resolved };
}

/**
 * The listing page. Deliberately plain: it is read once, on a phone.
 *
 * Colours come from the token package rather than being written here, because
 * the repo allows colour literals in exactly one place and this is not it.
 * Nothing else about this page is shared with the app, and it is not worth
 * making it so.
 */
export function indexPage(files: readonly ServedFile[], uploads: readonly string[] = []): string {
  const rows = files
    .map(
      (file) =>
        `<li><a href="/${encodeURIComponent(file.name)}" download>${file.name}</a>` +
        ` <span>${file.bytes.toLocaleString('en')} bytes</span></li>`,
    )
    .join('\n');

  const sendBack = uploads
    .map(
      (destination) => `<section>
<h2>Send to ${destination}/</h2>
<input type="file" multiple data-destination="${destination}" accept=".jpg,.jpeg,.png,.mp4">
<p class="log" id="log-${destination}"></p>
</section>`,
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
  h2 { font-size: 15px; margin: 0 0 8px; }
  p { color: ${color.text.muted}; margin: 0 0 24px; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { padding: 14px 0; border-bottom: 1px solid ${color.border.subtle}; display: flex; justify-content: space-between; gap: 12px; }
  a { color: ${color.accent.base}; text-decoration: none; font-weight: 600; }
  span { color: ${color.text.muted}; font-size: 13px; white-space: nowrap; }
  section { margin-top: 32px; padding-top: 20px; border-top: 1px solid ${color.border.subtle}; }
  input { width: 100%; }
  .log { margin: 12px 0 0; font-size: 13px; white-space: pre-line; }
</style>
</head>
<body>
<h1>Pristine candidates</h1>
<p>Save each one, then check the size on the phone matches the size here. If it does not, the download changed the file and the run is void.</p>
<ul>
${rows}
</ul>
${sendBack}
<script>
for (const input of document.querySelectorAll('input[type=file]')) {
  input.addEventListener('change', async () => {
    const destination = input.dataset.destination;
    const log = document.getElementById('log-' + destination);
    for (const file of input.files) {
      log.textContent += file.name + ' sending\\n';
      try {
        const response = await fetch('/upload/' + destination + '/' + encodeURIComponent(file.name), {
          method: 'PUT',
          body: file,
        });
        const body = await response.text();
        log.textContent += '  ' + (response.ok ? body.trim() : 'failed: ' + body.trim()) + '\\n';
      } catch (error) {
        log.textContent += '  failed: ' + error + '\\n';
      }
    }
    input.value = '';
  });
}
</script>
</body>
</html>`;
}

/**
 * Writes an upload to disk, or refuses it.
 *
 * Buffered rather than streamed straight to the destination, so a connection
 * that drops halfway leaves nothing behind. A truncated file in `returned/`
 * would be scored as a real return and would quietly poison the run, which is
 * a worse outcome than a failed upload the user can see and retry.
 */
function receiveUpload(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  file: string,
): void {
  const chunks: Buffer[] = [];
  let total = 0;
  let refused = false;

  request.on('data', (chunk: Buffer) => {
    if (refused) return;
    total += chunk.length;
    if (total > MAX_UPLOAD_BYTES) {
      refused = true;
      response.writeHead(413, { 'content-type': 'text/plain' });
      response.end('too large\n');
      request.destroy();
      return;
    }
    chunks.push(chunk);
  });

  request.on('error', () => {
    if (refused) return;
    refused = true;
    response.writeHead(400, { 'content-type': 'text/plain' });
    response.end('upload interrupted\n');
  });

  request.on('end', () => {
    if (refused) return;
    const body = Buffer.concat(chunks);
    if (body.length === 0) {
      response.writeHead(400, { 'content-type': 'text/plain' });
      response.end('empty\n');
      return;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
    response.writeHead(200, { 'content-type': 'text/plain' });
    response.end(`saved ${body.length.toLocaleString('en')} bytes\n`);
  });
}

export function serve(options: ServeOptions): Promise<Served> {
  const files = listServable(options.dir);

  const uploads = options.uploads ?? {};

  const server = http.createServer((request, response) => {
    const url = request.url ?? '/';
    if (url === '/' || url.startsWith('/?')) {
      const body = indexPage(listServable(options.dir), Object.keys(uploads));
      response.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'content-length': Buffer.byteLength(body),
      });
      response.end(body);
      return;
    }

    if (request.method === 'PUT') {
      const target = resolveUpload(uploads, url);
      if (target === null) {
        response.writeHead(400, { 'content-type': 'text/plain' });
        response.end('cannot accept that name or destination\n');
        return;
      }
      receiveUpload(request, response, target.file);
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
