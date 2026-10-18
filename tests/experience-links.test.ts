import { afterEach, describe, expect, it, vi } from 'vitest';
import { initialSpec } from '../src/core/spec';
import { createExperienceLink, hasExperienceFragment, MAX_EXPERIENCE_BYTES, MAX_EXPERIENCE_URL_LENGTH, parseExperienceFragment } from '../src/experience/links';

const base = 'https://deepbule0.github.io/UDI/mobile.html?lang=zh-CN&view=community#old';
const token = (value: unknown) => {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return `#udi=v1.p.${btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
};
afterEach(() => vi.unstubAllGlobals());

describe('ordinary-user interface links', () => {
  it('round trips a validated definition, including Chinese and emoji', async () => {
    const spec = initialSpec();
    spec.metadata.title = '我的工作界面 🌿';
    spec.metadata.description = '只看失败的实验 — partager mon interface';
    const link = await createExperienceLink(spec, base);
    expect(await parseExperienceFragment(new URL(link).hash)).toEqual(spec);
    expect(link.length).toBeLessThan(MAX_EXPERIENCE_URL_LENGTH);
  });

  it('keeps GitHub Pages subpath, phone entry, and selected language', async () => {
    const url = new URL(await createExperienceLink(initialSpec(), base));
    expect(url.origin + url.pathname).toBe('https://deepbule0.github.io/UDI/mobile.html');
    expect(url.search).toBe('?lang=zh-CN');
    expect(url.hash).toMatch(/^#udi=v1\.[pz]\./);
    expect(url.href).not.toContain('view=');
  });

  it('supports the desktop entry without changing it to the phone route', async () => {
    const url = new URL(await createExperienceLink(initialSpec(), 'https://deepbule0.github.io/UDI/?lang=en'));
    expect(url.pathname).toBe('/UDI/');
    expect(url.search).toBe('?lang=en');
  });

  it('never copies credentials or unrelated query state into a link', async () => {
    const url = new URL(await createExperienceLink(initialSpec(), 'https://user:secret@example.com/nested/index.html?token=private&lang=no'));
    expect(url.username).toBe(''); expect(url.password).toBe(''); expect(url.search).toBe('');
    expect(url.pathname).toBe('/nested/index.html');
  });

  it('rejects non-web link origins', async () => {
    await expect(createExperienceLink(initialSpec(), 'javascript:alert(1)')).rejects.toThrow();
  });

  it('uses a plain format when compression is unavailable', async () => {
    vi.stubGlobal('CompressionStream', undefined);
    const link = await createExperienceLink(initialSpec(), base);
    expect(new URL(link).hash).toMatch(/^#udi=v1\.p\./);
    expect(await parseExperienceFragment(new URL(link).hash)).toEqual(initialSpec());
  });

  it('uses compressed links when browser compression is available', async () => {
    const link = await createExperienceLink(initialSpec(), base);
    expect(new URL(link).hash).toMatch(/^#udi=v1\.z\./);
    expect(await parseExperienceFragment(new URL(link).hash)).toEqual(initialSpec());
  });

  it('returns a new definition rather than mutating the sender', async () => {
    const spec = initialSpec();
    const before = structuredClone(spec);
    const link = await createExperienceLink(spec, base);
    const shared = await parseExperienceFragment(new URL(link).hash);
    shared!.metadata.title = 'Changed by recipient';
    expect(spec).toEqual(before);
  });

  it('rejects attached record payloads, grants, and other local state', async () => {
    for (const extras of [{ records: [{ secret: 'private' }] }, { grants: ['notes.write'] }, { notes: ['private note'] }, { datasetId: 'private-source' }, { chat: ['private message'] }]) {
      const value = { ...initialSpec(), ...extras };
      await expect(createExperienceLink(value, base)).rejects.toThrow();
      await expect(parseExperienceFragment(token(value))).rejects.toThrow();
    }
  });

  it('rejects a whole saved session rather than stripping it silently', async () => {
    const state = { spec: initialSpec(), datasetId: 'aurora', instances: { aurora: { grants: ['experiments.read'], notes: ['private'] } }, audit: [] };
    await expect(parseExperienceFragment(token(state))).rejects.toThrow();
  });

  it('returns null for ordinary navigation fragments', async () => {
    expect(await parseExperienceFragment('')).toBeNull();
    expect(await parseExperienceFragment('#community')).toBeNull();
    expect(hasExperienceFragment('#community')).toBe(false);
    expect(hasExperienceFragment('#udi=broken')).toBe(true);
  });

  it('rejects unsupported versions and malformed encodings', async () => {
    for (const hash of ['#udi=', '#udi=v2.p.e30', '#udi=v1.x.e30', '#udi=v1.p.!!!!', '#udi=v1.p.A', '#udi=v1.p.e30=', '#udi=v1.p.e31', '#udi=v1.z.bm90IHppcA']) {
      await expect(parseExperienceFragment(hash)).rejects.toThrow();
    }
  });

  it('rejects well-formed links with an invalid or semantically inconsistent definition', async () => {
    const spec = initialSpec(); spec.views[0].source = 'missing-source';
    await expect(parseExperienceFragment(token(spec))).rejects.toThrow();
    await expect(parseExperienceFragment(token({ text: 'not an interface' }))).rejects.toThrow();
  });

  it('bounds incoming link length before decoding', async () => {
    await expect(parseExperienceFragment(`#udi=v1.p.${'A'.repeat(MAX_EXPERIENCE_URL_LENGTH)}`)).rejects.toThrow('size limit');
  });

  it('bounds decompressed size to reject highly compressed oversized payloads', async () => {
    const bytes = new TextEncoder().encode(' '.repeat(MAX_EXPERIENCE_BYTES + 1));
    const packed = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
    const encoded = btoa(Array.from(packed, byte => String.fromCharCode(byte)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(encoded.length).toBeLessThan(500);
    await expect(parseExperienceFragment(`#udi=v1.z.${encoded}`)).rejects.toThrow('size limit');
  });

  it('reports unsupported decompression clearly without trying to install anything', async () => {
    const link = await createExperienceLink(initialSpec(), base);
    vi.stubGlobal('DecompressionStream', undefined);
    await expect(parseExperienceFragment(new URL(link).hash)).rejects.toThrow('compressed interface links');
  });

  it('rejects malformed UTF-8 instead of silently replacing text', async () => {
    await expect(parseExperienceFragment('#udi=v1.p._w')).rejects.toThrow();
  });
});
