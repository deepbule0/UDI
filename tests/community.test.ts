import { describe, expect, it, vi } from 'vitest';
import { initialSpec, exportPackage, importPackage } from '../src/core/spec';
import { COMMUNITY_API, COMMUNITY_CACHE_KEY, COMMUNITY_MARKER, MAX_ISSUE_BYTES, createPublication, loadCommunity, parseCommunityIssue, parseCommunityIssues, starterInterfaces } from '../src/community/registry';

function issue(overrides: Record<string, unknown> = {}) {
  return { number: 42, state: 'open', title: 'My reviewed interface', labels: [{ name: 'udi-interface' }], user: { login: 'example-user' }, created_at: '2026-10-17T01:00:00Z',
    body: `${COMMUNITY_MARKER}\n\n\`\`\`json\n${exportPackage(initialSpec())}\`\`\``, ...overrides };
}
function memoryStore() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}

describe('community registry trust boundary', () => {
  it('reads a labeled issue with strict data and reconstructs its trusted repository URL', () => {
    const parsed = parseCommunityIssue(issue({ html_url: 'javascript:alert(1)', title: '<img onerror=alert(1)>' }));
    expect(parsed?.url).toBe('https://github.com/deepbule0/UDI/issues/42');
    expect(parsed?.title).toBe('<img onerror=alert(1)>'); // UI renders plain React text.
    expect(parsed?.spec).toEqual(initialSpec());
  });
  it.each([
    { labels: [] }, { body: 'No registry marker' }, { pull_request: {} }, { state: 'closed' }, { number: -1 },
    { user: { login: 'javascript:alert(1)' } }, { title: '' },
    { body: `${COMMUNITY_MARKER}\n\`\`\`json\n{"executable":"evil"}\n\`\`\`` },
    { body: `${COMMUNITY_MARKER}\n${' '.repeat(MAX_ISSUE_BYTES)}` },
  ])('rejects malformed or ineligible posts: %j', overrides => { expect(parseCommunityIssue(issue(overrides))).toBeNull(); });
  it('rejects extra fields that try to transport grants, notes, or executable code', () => {
    for (const key of ['grants', 'notes', 'credentials', 'records', 'agentCode']) {
      const body = `${COMMUNITY_MARKER}\n\n\`\`\`json\n${JSON.stringify({ ...initialSpec(), [key]: 'PRIVATE' })}\n\`\`\``;
      expect(parseCommunityIssue(issue({ body }))).toBeNull();
    }
  });
  it('rejects ambiguous multiple JSON package blocks', () => {
    const original = issue();
    expect(parseCommunityIssue({ ...original, body: `${original.body}\n\n\`\`\`json\n${exportPackage(initialSpec())}\`\`\`` })).toBeNull();
  });
  it('bounds, deduplicates, and ignores invalid feed entries', () => {
    expect(parseCommunityIssues([issue(), issue(), issue({ number: 8, labels: [] })])).toHaveLength(1);
    expect(parseCommunityIssues(Array.from({ length: 70 }, (_, index) => issue({ number: index + 1 })))).toHaveLength(50);
    expect(() => parseCommunityIssues({ message: 'API error' })).toThrow();
  });
  it('clearly identifies bundled examples as project starters and returns separate valid definitions', () => {
    const templates = starterInterfaces();
    expect(templates).toHaveLength(3);
    expect(templates.every(template => template.source === 'starter' && template.author === 'UDI project' && !template.url)).toBe(true);
    templates.forEach(template => expect(importPackage(exportPackage(template.spec))).toEqual(template.spec));
    expect(templates[1].spec.layout).toBe('focus');
    expect(templates[2].spec.views.find(view => view.type === 'table')?.filter).toBe('failed');
  });
});

describe('live community with honest offline cache', () => {
  it('uses an unauthenticated public read and falls back to validated cached data after rate limiting', async () => {
    const storage = memoryStore();
    const fetcher = vi.fn(async () => new Response(JSON.stringify([issue()]), { status: 200 }));
    const live = await loadCommunity({ fetcher, storage });
    expect(live.source).toBe('live');
    expect(live.posts).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledWith(COMMUNITY_API, expect.objectContaining({ credentials: 'omit', referrerPolicy: 'no-referrer' }));
    const cached = await loadCommunity({ fetcher: vi.fn(async () => new Response('', { status: 403 })), storage });
    expect(cached.source).toBe('cache');
    expect(cached.error).toContain('rate limit');
    expect(cached.posts).toEqual(live.posts);
  });
  it('does not describe an empty live feed as a fabricated community', async () => {
    const feed = await loadCommunity({ fetcher: vi.fn(async () => new Response('[]')), storage: memoryStore() });
    expect(feed).toMatchObject({ source: 'live', posts: [] });
    expect(feed.error).toBeUndefined();
  });
  it('revalidates tampered cache and reports unavailable without a successful cache', async () => {
    const storage = memoryStore();
    storage.setItem(COMMUNITY_CACHE_KEY, JSON.stringify({ version: 1, fetchedAt: new Date().toISOString(), issues: [issue({ labels: [] })] }));
    const fetcher = vi.fn(async () => { throw new Error('Offline'); });
    expect(await loadCommunity({ fetcher, storage })).toMatchObject({ source: 'cache', posts: [], error: 'Offline' });
    expect(await loadCommunity({ fetcher, storage: memoryStore() })).toMatchObject({ source: 'unavailable', posts: [], error: 'Offline' });
  });
  it('does not turn request cancellation into a stale feed update', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(loadCommunity({ fetcher: vi.fn(async () => { throw new Error('aborted'); }), storage: memoryStore(), signal: controller.signal })).rejects.toThrow('aborted');
  });
});

describe('reviewed public publication handoff', () => {
  it('builds an actual repository issue composer with auto-label template and a valid package body', () => {
    const publication = createPublication(initialSpec(), 'My interface & 中文', 'My public introduction');
    const url = new URL(publication.composerUrl);
    expect(url.origin + url.pathname).toBe('https://github.com/deepbule0/UDI/issues/new');
    expect(url.searchParams.get('template')).toBe('share-interface.md');
    expect(url.searchParams.get('title')).toBe('My interface & 中文');
    expect(url.searchParams.get('body')).toBe(publication.body);
    expect(parseCommunityIssue(issue({ body: publication.body }))?.spec).toEqual(initialSpec());
  });
  it('exports only the validated definition while preserving free text for human privacy review', () => {
    const spec = initialSpec(); spec.metadata.description = 'PRIVATE_TEXT_REQUIRES_REVIEW';
    const publication = createPublication(spec, 'Reviewed interface', 'Public intro');
    expect(publication.body).toContain('PRIVATE_TEXT_REQUIRES_REVIEW');
    const parsed = parseCommunityIssue(issue({ body: publication.body }));
    expect(parsed?.spec).not.toHaveProperty('grants');
    expect(parsed?.spec).not.toHaveProperty('notes');
    expect(() => createPublication({ ...spec, grants: ['notes.write'] } as unknown as typeof spec, 'title', '')).toThrow();
  });
  it('provides the complete body separately when the composer URL is too long', () => {
    const publication = createPublication(initialSpec(), 'Long interface', '中文'.repeat(450));
    expect(publication.requiresPaste).toBe(true);
    expect(new URL(publication.composerUrl).searchParams.has('body')).toBe(false);
    expect(new URL(publication.composerUrl).searchParams.get('template')).toBe('share-interface.md');
    expect(parseCommunityIssue(issue({ body: publication.body }))?.spec).toEqual(initialSpec());
  });
  it('rejects publication title bounds and extra JSON fences in introductions', () => {
    expect(() => createPublication(initialSpec(), ' ', '')).toThrow();
    expect(() => createPublication(initialSpec(), 'x'.repeat(121), '')).toThrow();
    expect(() => createPublication(initialSpec(), 'title', 'x'.repeat(1001))).toThrow();
    expect(() => createPublication(initialSpec(), 'title', '```json\n{}\n```')).toThrow();
  });
});
