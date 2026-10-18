import { exportPackage, importPackage } from '../core/spec';
import type { UDISpec } from '../core/types';

export const MAX_EXPERIENCE_URL_LENGTH = 16_000;
export const MAX_EXPERIENCE_BYTES = 64 * 1024;
const PREFIX = '#udi=';

function encode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decode(token: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(token) || token.length % 4 === 1) throw new Error('Invalid interface link.');
  const binary = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  if (encode(bytes) !== token) throw new Error('Invalid interface link.');
  return bytes;
}

async function readBounded(stream: ReadableStream<Uint8Array>): Promise<Uint8Array<ArrayBuffer>> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_EXPERIENCE_BYTES) {
        await reader.cancel();
        throw new Error('Shared interface exceeds the size limit.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}

/** Includes only a strictly validated definition. Local records and instance state are rejected. */
export async function createExperienceLink(spec: UDISpec, baseUrl = window.location.href): Promise<string> {
  const validated = importPackage(exportPackage(spec));
  const bytes = new TextEncoder().encode(JSON.stringify(validated));
  let token = `v1.p.${encode(bytes)}`;
  // An uncompressed format keeps links usable in browsers without CompressionStream.
  if (typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined') {
    const compressed = await readBounded(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate')));
    const candidate = `v1.z.${encode(compressed)}`;
    if (candidate.length < token.length) token = candidate;
  }
  const url = new URL(baseUrl);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Interface links need an HTTP or HTTPS address.');
  url.username = ''; url.password = '';
  // Keep the current desktop or phone entry and language; discard unrelated local view state.
  const language = url.searchParams.get('lang');
  url.search = '';
  if (language === 'en' || language === 'zh-CN') url.searchParams.set('lang', language);
  url.hash = `udi=${token}`;
  if (url.href.length > MAX_EXPERIENCE_URL_LENGTH) throw new Error('This interface is too large for a share link.');
  return url.href;
}

export function hasExperienceFragment(hash: string): boolean { return hash.startsWith(PREFIX); }

/** Review only: callers must never install a decoded link without an explicit user action. */
export async function parseExperienceFragment(hash: string): Promise<UDISpec | null> {
  if (!hasExperienceFragment(hash)) return null;
  if (hash.length > MAX_EXPERIENCE_URL_LENGTH) throw new Error('Shared interface exceeds the size limit.');
  const match = /^#udi=v1\.([pz])\.([A-Za-z0-9_-]+)$/.exec(hash);
  if (!match) throw new Error('Invalid or unsupported interface link.');
  let bytes = decode(match[2]);
  if (match[1] === 'z') {
    if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot open compressed interface links. Try an up-to-date browser.');
    bytes = await readBounded(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')));
  }
  if (bytes.byteLength > MAX_EXPERIENCE_BYTES) throw new Error('Shared interface exceeds the size limit.');
  return importPackage(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}
