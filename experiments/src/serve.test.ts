import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  indexPage,
  lanAddress,
  listServable,
  resolveRequest,
  resolveUpload,
  serve,
} from './serve.js';

let dir: string;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pristine-serve-'));
  fs.writeFileSync(path.join(dir, '01-photo-control.jpg'), 'jpeg bytes');
  fs.writeFileSync(path.join(dir, '04-video-treatment.mp4'), 'mp4 bytes');
  fs.writeFileSync(path.join(dir, 'manifest.json'), '{}');
  fs.mkdirSync(path.join(dir, '.work'));
});

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('listServable', () => {
  it('lists the candidates and nothing else', () => {
    expect(listServable(dir).map((f) => f.name)).toEqual([
      '01-photo-control.jpg',
      '04-video-treatment.mp4',
    ]);
  });

  it('reports the real byte count, which is what gets checked on the phone', () => {
    const [first] = listServable(dir);
    expect(first?.bytes).toBe('jpeg bytes'.length);
  });

  it('is empty rather than throwing before generate has run', () => {
    expect(listServable(path.join(dir, 'nope'))).toEqual([]);
  });
});

describe('resolveRequest', () => {
  it('resolves a candidate', () => {
    expect(resolveRequest(dir, '/04-video-treatment.mp4')).toBe(
      path.resolve(dir, '04-video-treatment.mp4'),
    );
  });

  it('handles a name that arrived percent encoded', () => {
    expect(resolveRequest(dir, '/04-video-treatment.mp4?x=1')).toBe(
      path.resolve(dir, '04-video-treatment.mp4'),
    );
  });

  /**
   * This listens on the local network, so a request is not a trusted string.
   * Traversal is the one way a read only file server becomes a problem.
   */
  it('refuses to escape the served directory', () => {
    expect(resolveRequest(dir, '/../secrets.jpg')).toBe(null);
    expect(resolveRequest(dir, '/..%2Fsecrets.jpg')).toBe(null);
    expect(resolveRequest(dir, '/subdir/../../secrets.mp4')).toBe(null);
  });

  it('serves only the two media types, not the manifest or anything else', () => {
    expect(resolveRequest(dir, '/manifest.json')).toBe(null);
    expect(resolveRequest(dir, '/')).toBe(null);
  });

  it('returns null for a file that is not there', () => {
    expect(resolveRequest(dir, '/99-missing.mp4')).toBe(null);
  });
});

describe('lanAddress', () => {
  /** A phone cannot reach another machine's loopback, so it must be skipped. */
  it('skips loopback and picks an address the phone can reach', () => {
    const address = lanAddress({
      lo: [{ family: 'IPv4', address: '127.0.0.1', internal: true }] as never,
      wifi: [{ family: 'IPv4', address: '192.168.1.42', internal: false }] as never,
    });
    expect(address).toBe('192.168.1.42');
  });

  it('skips IPv6, which nobody is typing into a phone by hand', () => {
    const address = lanAddress({
      eth: [
        { family: 'IPv6', address: 'fe80::1', internal: false },
        { family: 'IPv4', address: '10.0.0.5', internal: false },
      ] as never,
    });
    expect(address).toBe('10.0.0.5');
  });

  it('reports nothing rather than guessing when there is no network', () => {
    expect(
      lanAddress({ lo: [{ family: 'IPv4', address: '127.0.0.1', internal: true }] as never }),
    ).toBe(null);
  });
});

describe('indexPage', () => {
  it('lists every file with the size to check against', () => {
    const page = indexPage([{ name: '04-video-treatment.mp4', bytes: 85810 }]);
    expect(page).toContain('href="/04-video-treatment.mp4"');
    expect(page).toContain('85,810 bytes');
  });

  it('offers a way back for each upload destination', () => {
    const page = indexPage([], ['returned', 'fixtures']);
    expect(page).toContain('data-destination="returned"');
    expect(page).toContain('data-destination="fixtures"');
  });

  it('offers no upload controls when none were configured', () => {
    expect(indexPage([])).not.toContain('data-destination');
  });
});

describe('resolveUpload', () => {
  const uploads = { returned: '/tmp/returned', fixtures: '/tmp/fixtures' };

  it('routes a file to the destination it names', () => {
    expect(resolveUpload(uploads, '/upload/returned/04-back.mp4')).toEqual({
      dir: '/tmp/returned',
      file: path.resolve('/tmp/returned', '04-back.mp4'),
    });
  });

  it('refuses a destination this run did not offer', () => {
    expect(resolveUpload(uploads, '/upload/results/report.mp4')).toBe(null);
    expect(resolveUpload(uploads, '/upload/../../etc/passwd.mp4')).toBe(null);
  });

  /** A path sent from the phone must not get to choose where the file lands. */
  it('reduces a path to its basename', () => {
    expect(resolveUpload(uploads, '/upload/returned/..%2F..%2Fevil.mp4')?.file).toBe(
      path.resolve('/tmp/returned', 'evil.mp4'),
    );
    expect(resolveUpload(uploads, '/upload/returned/nested%2Fdeep%2F04.mp4')?.file).toBe(
      path.resolve('/tmp/returned', '04.mp4'),
    );
  });

  it('accepts only media, and nothing hidden', () => {
    expect(resolveUpload(uploads, '/upload/returned/notes.txt')).toBe(null);
    expect(resolveUpload(uploads, '/upload/returned/script.sh')).toBe(null);
    expect(resolveUpload(uploads, '/upload/returned/.gitignore')).toBe(null);
    expect(resolveUpload(uploads, '/upload/fixtures/photo.JPG')).not.toBe(null);
  });

  it('refuses a malformed upload path', () => {
    expect(resolveUpload(uploads, '/upload/returned')).toBe(null);
    expect(resolveUpload(uploads, '/04-video.mp4')).toBe(null);
  });
});

describe('serve', () => {
  it('hands back the exact bytes, as an attachment', async () => {
    const running = await serve({ dir, port: 0, host: '127.0.0.1' });
    try {
      const port = new URL(running.url).port;
      const response = await fetch(`http://127.0.0.1:${port}/04-video-treatment.mp4`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('video/mp4');
      // Saved, not decoded into a player. A file the browser re-rendered is
      // not the file that was built.
      expect(response.headers.get('content-disposition')).toContain('attachment');
      const body = Buffer.from(await response.arrayBuffer());
      expect(body).toEqual(fs.readFileSync(path.join(dir, '04-video-treatment.mp4')));
    } finally {
      await running.close();
    }
  });

  it('refuses a traversal over the wire, not just in the resolver', async () => {
    const running = await serve({ dir, port: 0, host: '127.0.0.1' });
    try {
      const port = new URL(running.url).port;
      const response = await fetch(`http://127.0.0.1:${port}/..%2F..%2Fpackage.json`);
      expect(response.status).toBe(404);
    } finally {
      await running.close();
    }
  });

  it('takes a file back off the phone byte for byte', async () => {
    const inbox = fs.mkdtempSync(path.join(os.tmpdir(), 'pristine-returned-'));
    const running = await serve({
      dir,
      uploads: { returned: inbox },
      port: 0,
      host: '127.0.0.1',
    });
    try {
      const port = new URL(running.url).port;
      const payload = Buffer.from('what whatsapp handed back');
      const response = await fetch(`http://127.0.0.1:${port}/upload/returned/04-back.mp4`, {
        method: 'PUT',
        body: payload,
      });
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('saved');
      expect(fs.readFileSync(path.join(inbox, '04-back.mp4'))).toEqual(payload);
    } finally {
      await running.close();
      fs.rmSync(inbox, { recursive: true, force: true });
    }
  });

  it('refuses an upload to a destination it was not given', async () => {
    const inbox = fs.mkdtempSync(path.join(os.tmpdir(), 'pristine-returned-'));
    const running = await serve({ dir, uploads: { returned: inbox }, port: 0, host: '127.0.0.1' });
    try {
      const port = new URL(running.url).port;
      const response = await fetch(`http://127.0.0.1:${port}/upload/fixtures/sneaky.mp4`, {
        method: 'PUT',
        body: Buffer.from('no'),
      });
      expect(response.status).toBe(400);
      expect(fs.existsSync(path.join(inbox, 'sneaky.mp4'))).toBe(false);
    } finally {
      await running.close();
      fs.rmSync(inbox, { recursive: true, force: true });
    }
  });

  /** A truncated file scored as a real return would poison the run silently. */
  it('writes nothing at all for an empty upload', async () => {
    const inbox = fs.mkdtempSync(path.join(os.tmpdir(), 'pristine-returned-'));
    const running = await serve({ dir, uploads: { returned: inbox }, port: 0, host: '127.0.0.1' });
    try {
      const port = new URL(running.url).port;
      const response = await fetch(`http://127.0.0.1:${port}/upload/returned/05-back.mp4`, {
        method: 'PUT',
        body: Buffer.alloc(0),
      });
      expect(response.status).toBe(400);
      expect(fs.existsSync(path.join(inbox, '05-back.mp4'))).toBe(false);
    } finally {
      await running.close();
      fs.rmSync(inbox, { recursive: true, force: true });
    }
  });
});
