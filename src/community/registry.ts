import { assertSpec, exportPackage, importPackage, initialSpec } from '../core/spec';
import { applyProposal, planIntent } from '../core/planner';
import type { UDISpec } from '../core/types';

export const COMMUNITY_LABEL = 'udi-interface';
export const COMMUNITY_MARKER = '<!-- udi-interface:0.1 -->';
export const COMMUNITY_API = 'https://api.github.com/repos/deepbule0/UDI/issues?state=open&labels=udi-interface&per_page=50';
export const COMMUNITY_ISSUES = 'https://github.com/deepbule0/UDI/issues';
export const COMMUNITY_CACHE_KEY = 'udi-community:0.1';
export const MAX_ISSUE_BYTES = 80 * 1024;
const MAX_FEED_BYTES = 4 * 1024 * 1024;
const encoder = new TextEncoder();

export interface CommunityPost {
  id: string;
  number?: number;
  title: string;
  author: string;
  createdAt?: string;
  url?: string;
  spec: UDISpec;
  source: 'github' | 'starter';
}
export interface CommunityFeed {
  posts: CommunityPost[];
  source: 'live' | 'cache' | 'unavailable';
  fetchedAt?: string;
  error?: string;
}
type CacheStore = Pick<Storage, 'getItem' | 'setItem'>;
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }

// Issue text is untrusted. Accept only the labeled, marked data format, never
// execute Markdown/HTML, and run the same strict importer used for local files.
export function parseCommunityIssue(value: unknown): CommunityPost | null {
  if (!record(value) || 'pull_request' in value || value.state !== 'open') return null;
  if (!Number.isSafeInteger(value.number) || (value.number as number) < 1) return null;
  if (!Array.isArray(value.labels) || !value.labels.some(label => label === COMMUNITY_LABEL || (record(label) && label.name === COMMUNITY_LABEL))) return null;
  if (typeof value.body !== 'string' || encoder.encode(value.body).length > MAX_ISSUE_BYTES || !value.body.includes(COMMUNITY_MARKER)) return null;
  const blocks = [...value.body.matchAll(/^```json[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm)];
  if (blocks.length !== 1) return null;
  if (!record(value.user) || typeof value.user.login !== 'string' || !/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(value.user.login)) return null;
  if (typeof value.title !== 'string' || !value.title.trim() || value.title.length > 256) return null;
  try {
    const spec = importPackage(blocks[0][1]);
    const number = value.number as number;
    return {
      id: `github-${number}`, number, title: value.title.trim(), author: value.user.login,
      createdAt: typeof value.created_at === 'string' && Number.isFinite(Date.parse(value.created_at)) ? value.created_at : undefined,
      url: `${COMMUNITY_ISSUES}/${number}`, spec, source: 'github',
    };
  } catch { return null; }
}

export function parseCommunityIssues(value: unknown): CommunityPost[] {
  if (!Array.isArray(value)) throw new Error('Unexpected community response.');
  const seen = new Set<string>();
  return value.slice(0, 50).flatMap(issue => {
    const post = parseCommunityIssue(issue);
    if (!post || seen.has(post.id)) return [];
    seen.add(post.id);
    return [post];
  });
}

function browserStore(): CacheStore | undefined { try { return globalThis.localStorage; } catch { return undefined; } }
function readCache(storage?: CacheStore): CommunityFeed | undefined {
  try {
    const raw = storage?.getItem(COMMUNITY_CACHE_KEY);
    if (!raw || encoder.encode(raw).length > MAX_FEED_BYTES) return;
    const cache: unknown = JSON.parse(raw);
    if (!record(cache) || cache.version !== 1 || typeof cache.fetchedAt !== 'string' || !Number.isFinite(Date.parse(cache.fetchedAt))) return;
    return { posts: parseCommunityIssues(cache.issues), source: 'cache', fetchedAt: cache.fetchedAt };
  } catch { return undefined; }
}

export async function loadCommunity(options: { fetcher?: typeof fetch; storage?: CacheStore; signal?: AbortSignal } = {}): Promise<CommunityFeed> {
  const storage = options.storage ?? browserStore();
  try {
    const response = await (options.fetcher ?? fetch)(COMMUNITY_API, {
      headers: { Accept: 'application/vnd.github+json' }, credentials: 'omit', referrerPolicy: 'no-referrer', signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(12_000)]) : AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(response.status === 403 || response.status === 429 ? 'GitHub rate limit or access restriction.' : `GitHub returned ${response.status}.`);
    if (Number(response.headers.get('content-length') ?? 0) > MAX_FEED_BYTES) throw new Error('Community response is too large.');
    const text = await response.text();
    if (encoder.encode(text).length > MAX_FEED_BYTES) throw new Error('Community response is too large.');
    const issues: unknown = JSON.parse(text);
    const posts = parseCommunityIssues(issues);
    const fetchedAt = new Date().toISOString();
    // Cache validated canonical records only. Private instance state is never read.
    const canonical = posts.map(post => ({ number: post.number, state: 'open', title: post.title,
      labels: [COMMUNITY_LABEL], user: { login: post.author }, created_at: post.createdAt,
      body: `${COMMUNITY_MARKER}\n\n\`\`\`json\n${exportPackage(post.spec)}\`\`\``,
    }));
    try { storage?.setItem(COMMUNITY_CACHE_KEY, JSON.stringify({ version: 1, fetchedAt, issues: canonical })); } catch { /* Browsing still works without cache. */ }
    return { posts, source: 'live', fetchedAt };
  } catch (error) {
    if (options.signal?.aborted) throw error;
    const message = error instanceof Error ? error.message : 'Community is unavailable.';
    const cache = readCache(storage);
    return cache ? { ...cache, error: message } : { posts: [], source: 'unavailable', error: message };
  }
}

export function starterInterfaces(): CommunityPost[] {
  const base = initialSpec();
  const focused = applyProposal(base, 0, planIntent('Focus on experiments', base, 0));
  focused.metadata = { ...focused.metadata, id: 'udi-starter-focused', title: 'Focused experiments', description: 'Project starter: a compact layout for experiment metrics and results.' };
  const failed = applyProposal(base, 0, planIntent('Show only failed experiments', base, 0));
  failed.metadata = { ...failed.metadata, id: 'udi-starter-failed', title: 'Regression review', description: 'Project starter: keep failed experiments in view for a closer review.' };
  return [base, focused, failed].map((spec, index) => ({ id: `starter-${index}`, title: spec.metadata.title, author: 'UDI project', source: 'starter', spec: assertSpec(spec) }));
}

export function createPublication(spec: UDISpec, title: string, introduction: string): { title: string; body: string; composerUrl: string; requiresPaste: boolean } {
  const cleanTitle = title.trim();
  if (!cleanTitle || cleanTitle.length > 120) throw new Error('Choose a title between 1 and 120 characters.');
  if (introduction.length > 1000) throw new Error('Keep the introduction under 1,000 characters.');
  const packageText = exportPackage(spec);
  // Avoid Markdown fence ambiguity from user-controlled strings inside JSON.
  if (/^```/m.test(introduction) || introduction.includes(COMMUNITY_MARKER)) throw new Error('The introduction cannot contain code fences or the registry marker.');
  const body = `${COMMUNITY_MARKER}\n\n${introduction.trim()}\n\nInterface package / 界面包\n\n\`\`\`json\n${packageText}\`\`\`\n\nPublished through UDI. This definition includes no instance bindings, grants, notes, records, or activity. Review free text before submitting.\n`;
  const params = new URLSearchParams({ template: 'share-interface.md', title: cleanTitle, body });
  const fullUrl = `${COMMUNITY_ISSUES}/new?${params.toString()}`;
  const requiresPaste = fullUrl.length > 6000;
  const fallback = new URLSearchParams({ template: 'share-interface.md', title: cleanTitle });
  return { title: cleanTitle, body, composerUrl: requiresPaste ? `${COMMUNITY_ISSUES}/new?${fallback.toString()}` : fullUrl, requiresPaste };
}
