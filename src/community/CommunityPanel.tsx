import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, Check, Copy, Download, GitFork, Globe2, RefreshCw, Search, Send, ShieldCheck, X } from 'lucide-react';
import { capabilityLabels, exportPackage, forkPackage, importPackage } from '../core/spec';
import type { UDISpec } from '../core/types';
import { useI18n } from '../i18n';
import { COMMUNITY_ISSUES, createPublication, loadCommunity, starterInterfaces, type CommunityFeed, type CommunityPost } from './registry';
import './community.css';

function CommunityDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { locale } = useI18n();
  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element?.showModal();
    return () => { element?.close(); if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} className="udi-community-dialog" aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <header><strong>{title}</strong><button className="uc-icon" aria-label={locale === 'en' ? 'Close community dialog' : '关闭社区对话框'} onClick={onClose}><X size={21} /></button></header>
    <div className="uc-dialog-body">{children}</div>
  </dialog>;
}

export function CommunityPanel({ spec, onInstall }: { spec: UDISpec; onInstall: (spec: UDISpec) => void }) {
  const { locale, t } = useI18n();
  const s = (en: string, zh: string) => locale === 'en' ? en : zh;
  const [feed, setFeed] = useState<CommunityFeed>({ posts: [], source: 'unavailable' });
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'github' | 'starter'>('all');
  const [selected, setSelected] = useState<CommunityPost | null>(null);
  const [installReviewed, setInstallReviewed] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishSpec, setPublishSpec] = useState<UDISpec>(spec);
  const [title, setTitle] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [publishReviewed, setPublishReviewed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [notice, setNotice] = useState('');
  const [installError, setInstallError] = useState('');
  const starters = starterInterfaces();
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    loadCommunity({ signal: controller.signal }).then(result => { setFeed(result); setLoading(false); }).catch(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  const all = [...feed.posts, ...starters];
  const items = all.filter(post => (filter === 'all' || post.source === filter) && `${post.title} ${post.author} ${post.spec.metadata.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  let publication: ReturnType<typeof createPublication> | undefined;
  let publicationError = '';
  if (publishing) try { publication = createPublication(publishSpec, title, introduction); } catch (error) { publicationError = error instanceof Error ? error.message : String(error); }
  const review = (post: CommunityPost) => { setSelected(post); setInstallReviewed(false); setInstallError(''); };
  const install = (fork: boolean) => {
    if (!selected || !installReviewed) return;
    try {
      const next = importPackage(exportPackage(selected.spec));
      onInstall(fork ? forkPackage(next) : next);
      setSelected(null);
      setNotice(s('Interface installed. Review data access before using it.', '界面已安装。使用前请审阅数据访问权限。'));
    } catch (error) { setInstallError(error instanceof Error ? error.message : String(error)); }
  };
  const openPublish = () => { setPublishSpec(importPackage(exportPackage(spec))); setTitle(spec.metadata.title); setIntroduction(spec.metadata.description); setPublishReviewed(false); setCopied(false); setCopyFailed(false); setPublishing(true); };
  async function copyBody() {
    if (!publication) return;
    try { await navigator.clipboard.writeText(publication.body); setCopied(true); setCopyFailed(false); } catch { setCopyFailed(true); }
  }

  return <section className="udi-community" aria-label={s('Interface community', '界面社区')}>
    <div className="uc-hero"><div className="uc-kicker"><Globe2 size={14} />{s('INTERFACES, PASSED ON', '让界面流动起来')}</div><h2>{s('Find your next interface.', '发现下一个适合你的界面。')}</h2><p>{s('Browse real GitHub posts, try a project starter, or share the way your workspace works.', '浏览真实 GitHub 帖子、试用项目示例，或分享你的工作空间设计。')}</p><button className="uc-button uc-primary" onClick={openPublish}><Send size={17} />{s('Post interface', '发布界面')}</button><span className="uc-hero-note">{s('Public GitHub posts · your data stays local', '公开 GitHub 帖子 · 你的数据留在本地')}</span></div>
    <div className="uc-feed-status" role="status"><span className={`uc-feed-dot ${feed.source === 'live' ? 'uc-live' : ''}`} /><div><strong>{loading ? s('Loading public posts…', '正在加载公开帖子…') : feed.source === 'live' ? s('Live GitHub community', '实时 GitHub 社区') : feed.source === 'cache' ? s('Cached GitHub posts', '已缓存的 GitHub 帖子') : s('GitHub feed unavailable', 'GitHub 动态暂不可用')}</strong><p>{!loading && feed.source === 'live' && feed.posts.length === 0 ? s('No valid interface posts yet. Project starters below are examples, not community activity.', '目前尚无有效界面帖子。下方项目示例不代表社区活动。') : feed.source === 'cache' ? s('Showing the last successful fetch. Refresh when online.', '正在显示上次成功获取的内容，联网后可刷新。') : feed.source === 'unavailable' && !loading ? s('Offline, rate limited, or GitHub unavailable. Project starters still work.', '可能离线、触发限流或 GitHub 不可用。项目示例仍可使用。') : s('Only labeled, schema-valid UDI packages appear here. Up to 50 open posts.', '这里只显示带指定标签且通过规范校验的 UDI 包，最多 50 条公开帖子。')}</p>{feed.fetchedAt && <small>{s('Fetched', '获取于')} {new Date(feed.fetchedAt).toLocaleString(locale)}</small>}<a className="uc-feed-link" href={`${COMMUNITY_ISSUES}?q=is%3Aissue+is%3Aopen+label%3Audi-interface`} target="_blank" rel="noopener noreferrer">{s('Browse posts on GitHub', '在 GitHub 浏览帖子')}<ArrowUpRight size={13} /></a></div><button className="uc-icon" aria-label={s('Refresh community', '刷新社区')} disabled={loading} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={18} className={loading ? 'uc-spin' : ''} /></button></div>
    <div className="uc-tools"><label className="uc-search"><Search size={17} /><input aria-label={s('Search interfaces', '搜索界面')} placeholder={s('Search interfaces…', '搜索界面…')} value={query} onChange={event => setQuery(event.target.value)} /></label><label className="uc-filter"><span>{s('Show', '显示')}</span><select aria-label={s('Interface source', '界面来源')} value={filter} onChange={event => setFilter(event.target.value as typeof filter)}><option value="all">{s('All interfaces', '全部界面')}</option><option value="github">{s('Community posts', '社区帖子')}</option><option value="starter">{s('Project starters', '项目示例')}</option></select></label></div>
    {notice && <p className="uc-notice" role="status"><Check size={17} />{notice}</p>}
    <div className="uc-grid">{items.map((post, index) => <article className="uc-card" key={post.id}>
      <div className={`uc-miniature uc-miniature-${index % 3}`} aria-hidden="true"><div /><div /><div /><div /><div /></div>
      <span className={`uc-badge ${post.source === 'github' ? 'uc-badge-public' : ''}`}>{post.source === 'github' ? s('Community post', '社区帖子') : s('UDI project starter', 'UDI 项目示例')}</span><h3>{post.title}</h3><p>{post.spec.metadata.description}</p><div className="uc-card-meta"><span>{post.source === 'github' ? `@${post.author}` : s('By the UDI project', '由 UDI 项目提供')}</span><span>{post.spec.views.filter(view => view.visible).length} {s('views', '个可见视图')}</span></div>
      <button className="uc-button uc-secondary" onClick={() => review(post)}>{s('Preview & install', '预览并安装')}<ArrowUpRight size={16} /></button>{post.url && <a className="uc-post-link" href={post.url} target="_blank" rel="noopener noreferrer">{s('View GitHub post', '查看 GitHub 帖子')} #{post.number}<ArrowUpRight size={13} /></a>}
    </article>)}</div>
    {items.length === 0 && <div className="uc-empty"><Search size={25} /><h3>{s('No matching interfaces.', '没有匹配的界面。')}</h3><p>{s('Try another search or include project starters.', '试试其他搜索词，或选择显示项目示例。')}</p></div>}
    <p className="uc-boundary"><ShieldCheck size={17} />{s('Community definitions are untrusted data. Installation is reviewed and clears local capability grants. No scripts or arbitrary components are accepted.', '社区定义属于不可信数据。安装前需要审阅，并会清除本地能力授权；不接受脚本或任意组件。')}</p>
    {selected && <CommunityDialog title={s('Review interface installation', '审阅界面安装')} onClose={() => setSelected(null)}>
      <span className="uc-kicker">{selected.source === 'github' ? `GITHUB · @${selected.author}` : s('UDI PROJECT STARTER', 'UDI 项目示例')}</span><h2>{selected.title}</h2><p>{selected.spec.metadata.description}</p><div className="uc-package-meta"><code>{selected.spec.metadata.id}</code><span>v{selected.spec.metadata.version} · {selected.spec.layout} · {selected.spec.views.length} {s('views', '个视图')}</span></div>
      <h3>{s('Visible interface', '可见界面')}</h3><ul className="uc-view-list">{selected.spec.views.filter(view => view.visible).map(view => <li key={view.id}><span>{t(view.title)}</span><code>{view.type}</code></li>)}</ul>
      <h3>{s('Requested capabilities', '请求的能力')}</h3><ul className="uc-capabilities">{selected.spec.capabilities.map(capability => <li key={capability}><ShieldCheck size={15} /><span>{t(capabilityLabels[capability])}<code>{capability}</code></span></li>)}</ul>
      <details className="uc-spec"><summary>{s('Inspect complete package JSON', '查看完整界面包 JSON')}</summary><pre tabIndex={0}>{exportPackage(selected.spec)}</pre></details>
      <label className="uc-review"><input type="checkbox" checked={installReviewed} onChange={event => setInstallReviewed(event.target.checked)} /><span>{s('Replace my current interface and clear grants for all local datasets. My dataset records and local notes stay in this browser. I will review data access next.', '替换当前界面并清除所有本地数据集的授权。数据集记录与本地笔记保留在此浏览器中；之后我将审阅数据访问权限。')}</span></label>
      {installError && <p className="uc-error" role="alert">{installError}</p>}
      <div className="uc-dialog-actions"><button className="uc-button uc-primary" disabled={!installReviewed} onClick={() => install(false)}><Download size={17} />{s('Install interface', '安装界面')}</button><button className="uc-button uc-secondary" disabled={!installReviewed} onClick={() => install(true)}><GitFork size={17} />{s('Fork & install', '分支并安装')}</button></div>
    </CommunityDialog>}
    {publishing && <CommunityDialog title={s('Post your interface', '发布你的界面')} onClose={() => setPublishing(false)}>
      <span className="uc-kicker">{s('YOUR DEFINITION, SHARED', '分享你的界面定义')}</span><h2>{s('Let someone make it theirs.', '让别人也能将它变成自己的。')}</h2><p>{s('Review this package, then open the real GitHub issue composer. Sign in and submit there. Opening the composer does not publish a post.', '检查界面包后，打开真实的 GitHub Issue 编辑器，登录并在 GitHub 提交。仅打开编辑器不会发布帖子。')}</p>
      <label className="uc-field"><span>{s('Post title', '帖子标题')}</span><input maxLength={120} value={title} onChange={event => { setTitle(event.target.value); setPublishReviewed(false); setCopied(false); }} /></label><label className="uc-field"><span>{s('Introduction', '简介')}</span><textarea maxLength={1000} rows={3} value={introduction} onChange={event => { setIntroduction(event.target.value); setPublishReviewed(false); setCopied(false); }} /></label>
      <div className="uc-privacy"><ShieldCheck size={19} /><p>{s('Only the interface definition is exported. Dataset records, bindings, grants, local notes, and activity are excluded. Names, descriptions, and other free text can still contain private information: review the complete JSON.', '仅导出界面定义，不包含数据集记录、绑定、授权、本地笔记或活动。但名称、描述等自由文本仍可能包含私人信息，请检查完整 JSON。')}</p></div>
      <details className="uc-spec" open><summary>{s('Review complete package JSON', '审阅完整界面包 JSON')}</summary><pre tabIndex={0}>{exportPackage(publishSpec)}</pre></details>
      <label className="uc-review"><input type="checkbox" checked={publishReviewed} onChange={event => setPublishReviewed(event.target.checked)} /><span>{s('I reviewed all free text and understand this will be public on GitHub after I submit it. My GitHub account identifies the author.', '我已检查所有自由文本，理解在 GitHub 提交后内容将公开，并使用我的 GitHub 账户标识作者。')}</span></label>
      {publicationError && <p className="uc-error" role="alert">{s('Choose a title of 1–120 characters and an introduction under 1,000 characters without Markdown code fences.', '请填写 1–120 字的标题和不超过 1,000 字且不含 Markdown 代码围栏的简介。')}</p>}
      {publication?.requiresPaste && <div className="uc-paste"><h3>{s('This package needs a copy-and-paste handoff.', '此界面包需要复制粘贴。')}</h3><p>{s('The package is too long for a reliable composer URL. Copy the post body below, open GitHub, paste it into the issue description, then submit.', '界面包过长，无法可靠地放入编辑器链接。请复制下方帖子正文，打开 GitHub 后粘贴到 Issue 描述中并提交。')}</p><button className="uc-button uc-secondary" disabled={!publishReviewed} onClick={copyBody}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? s('Post body copied', '已复制帖子正文') : s('Copy post body', '复制帖子正文')}</button>{copyFailed && <p role="alert">{s('Clipboard unavailable. Select and copy the text manually.', '无法使用剪贴板，请手动选择并复制正文。')}</p>}<label className="uc-field"><span>{s('Post body to copy', '待复制的帖子正文')}</span><textarea aria-label={s('Post body to copy', '待复制的帖子正文')} readOnly rows={7} value={publication.body} onFocus={event => event.target.select()} /></label></div>}
      {publication && publishReviewed ? <a className="uc-button uc-primary" href={publication.composerUrl} target="_blank" rel="noopener noreferrer"><Send size={17} />{s('Open GitHub composer', '打开 GitHub 编辑器')}<ArrowUpRight size={16} /></a> : <button className="uc-button uc-primary" disabled><Send size={17} />{s('Open GitHub composer', '打开 GitHub 编辑器')}</button>}
      <p className="uc-submit-note">{s('The GitHub template labels your post automatically. Submit it on GitHub, then return and refresh. Your post appears only after it is fetched and validated. Community uses public GitHub Issues; it is not a private sharing service.', 'GitHub 模板会自动为帖子添加标签。请在 GitHub 提交，然后返回并刷新。只有成功获取且通过校验的帖子才会显示。社区使用公开 GitHub Issues，不是私人分享服务。')}</p><a className="uc-post-link" href={COMMUNITY_ISSUES} target="_blank" rel="noopener noreferrer">{s('Open community on GitHub', '在 GitHub 查看社区')}<ArrowUpRight size={14} /></a>
    </CommunityDialog>}
  </section>;
}
