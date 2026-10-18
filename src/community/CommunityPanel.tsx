import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, Check, Copy, Download, GitFork, Globe2, RefreshCw, Search, Send, ShieldCheck, X } from 'lucide-react';
import { capabilityLabels, exportPackage, forkPackage, importPackage } from '../core/spec';
import type { UDISpec } from '../core/types';
import { useI18n } from '../i18n';
import { ExperiencePreview } from '../experience/ExperiencePreview';
import { ShareExperience } from '../experience/ShareExperience';
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
  const postTitle = (post: CommunityPost) => post.source === 'starter' && post.id === 'starter-1' ? s('Focused experiments', '专注实验') : post.source === 'starter' && post.id === 'starter-2' ? s('Regression review', '回归检查') : t(post.title);
  const postDescription = (post: CommunityPost) => post.source !== 'starter' ? post.spec.metadata.description : post.id === 'starter-1' ? s('Keep experiment results at the center, with fewer distractions.', '让实验结果成为中心，减少干扰。') : post.id === 'starter-2' ? s('Bring failed experiments to the front so you can see what needs attention.', '优先显示失败的实验，快速找到需要关注的问题。') : s('Results, model comparisons, and upcoming dates together in one workspace.', '在同一工作空间中查看结果、模型对比和近期安排。');
  const items = all.filter(post => (filter === 'all' || post.source === filter) && `${post.title} ${post.author} ${post.spec.metadata.description} ${postTitle(post)} ${postDescription(post)}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  let publication: ReturnType<typeof createPublication> | undefined;
  let publicationError = '';
  if (publishing) try { publication = createPublication(publishSpec, title, introduction); } catch (error) { publicationError = error instanceof Error ? error.message : String(error); }
  const review = (post: CommunityPost) => { setSelected(post); setInstallError(''); };
  const install = (fork: boolean) => {
    if (!selected) return;
    try {
      const next = importPackage(exportPackage(selected.spec));
      onInstall(fork ? forkPackage(next) : next);
      setSelected(null);
      setNotice(s('Your interface is ready. Choose which data it can use next.', '你的界面已就绪。接下来选择它可以使用的数据。'));
    } catch (error) { setInstallError(error instanceof Error ? error.message : String(error)); }
  };
  const openPublish = () => { setPublishSpec(importPackage(exportPackage(spec))); setTitle(spec.metadata.title); setIntroduction(spec.metadata.description); setPublishReviewed(false); setCopied(false); setCopyFailed(false); setPublishing(true); };
  async function copyBody() {
    if (!publication) return;
    try { await navigator.clipboard.writeText(publication.body); setCopied(true); setCopyFailed(false); } catch { setCopyFailed(true); }
  }

  return <section className="udi-community" aria-label={s('Interface community', '界面社区')}>
    <div className="uc-hero"><div className="uc-kicker"><Globe2 size={14} />{s('MADE BY YOU, ENJOYED BY OTHERS', '由你定义，让更多人使用')}</div><h2>{s('Find your next interface.', '发现下一个适合你的界面。')}</h2><p>{s('See how an interface works, make it yours, then share a link. Your layout travels; your personal data stays with you.', '先看看界面如何工作，再变成自己的，最后用链接分享。分享的是使用方式，个人数据留在你这里。')}</p><ShareExperience spec={spec} triggerLabel={s('Share my interface', '分享我的界面')} /><span className="uc-hero-note">{s('No files to upload. No code to write.', '不用上传文件，也不用编写代码。')}</span></div>
    <p className="uc-feed-summary" role="status">{loading ? s('Finding shared interfaces…', '正在查找分享的界面…') : feed.source === 'unavailable' ? s('Community is temporarily unavailable. Try the project examples below.', '社区暂不可用，可以先试试下方项目示例。') : feed.source === 'cache' ? s('Showing saved community posts and project examples.', '正在显示已保存的社区帖子和项目示例。') : feed.posts.length === 0 ? s('No community posts yet. These three examples are made by the UDI project.', '社区还没有用户帖子。下方三个示例由 UDI 项目提供。') : s(`${feed.posts.length} community ${feed.posts.length === 1 ? 'interface' : 'interfaces'} to explore, plus project examples.`, `${feed.posts.length} 个社区界面和项目示例，等你探索。`)}</p>
    <div className="uc-tools"><label className="uc-search"><Search size={17} /><input aria-label={s('Search interfaces', '搜索界面')} placeholder={s('Search interfaces…', '搜索界面…')} value={query} onChange={event => setQuery(event.target.value)} /></label><label className="uc-filter"><span>{s('Show', '显示')}</span><select aria-label={s('Interface source', '界面来源')} value={filter} onChange={event => setFilter(event.target.value as typeof filter)}><option value="all">{s('All interfaces', '全部界面')}</option><option value="github">{s('Community posts', '社区帖子')}</option><option value="starter">{s('Project starters', '项目示例')}</option></select></label></div>
    {notice && <p className="uc-notice" role="status"><Check size={17} />{notice}</p>}
    <div className="uc-grid">{items.map(post => <article className="uc-card" key={post.id}>
      <div className="uc-card-preview" aria-hidden="true"><ExperiencePreview spec={post.spec} compact /></div>
      <span className={`uc-badge ${post.source === 'github' ? 'uc-badge-public' : ''}`}>{post.source === 'github' ? s('Community post', '社区帖子') : s('UDI project starter', 'UDI 项目示例')}</span><h3>{postTitle(post)}</h3><p>{postDescription(post)}</p><div className="uc-card-meta"><span>{post.source === 'github' ? `@${post.author}` : s('By the UDI project', '由 UDI 项目提供')}</span><span>{post.spec.layout === 'focus' ? s('Focused layout', '专注布局') : s('Balanced layout', '均衡布局')}</span></div>
      <button className="uc-button uc-secondary" onClick={() => review(post)}>{s('Try this interface', '试试这个界面')}<ArrowUpRight size={16} /></button>
    </article>)}</div>
    {items.length === 0 && <div className="uc-empty"><Search size={25} /><h3>{s('No matching interfaces.', '没有匹配的界面。')}</h3><p>{s('Try another search or include project starters.', '试试其他搜索词，或选择显示项目示例。')}</p></div>}
    <p className="uc-boundary"><ShieldCheck size={17} />{s('Trying an interface uses sample data. Using it never gives it access to your personal data automatically.', '试用界面时使用示例数据。使用界面不会自动授权它访问你的个人数据。')}</p>
    <details className="uc-details"><summary>{s('Community details', '社区详情')}</summary><div className="uc-feed-status"><span className={`uc-feed-dot ${feed.source === 'live' ? 'uc-live' : ''}`} /><div><strong>{loading ? s('Loading public posts…', '正在加载公开帖子…') : feed.source === 'live' ? s('Live GitHub community', '实时 GitHub 社区') : feed.source === 'cache' ? s('Cached GitHub posts', '已缓存的 GitHub 帖子') : s('GitHub feed unavailable', 'GitHub 动态暂不可用')}</strong><p>{s('Public posts are fetched from GitHub and checked before display. Project examples are labeled separately. Offline or rate-limited requests may show saved posts.', '公开帖子从 GitHub 获取，通过检查后显示。项目示例会单独标注。离线或触发限流时，可能显示已保存的帖子。')}</p>{feed.fetchedAt && <small>{s('Fetched', '获取于')} {new Date(feed.fetchedAt).toLocaleString(locale)}</small>}<a className="uc-feed-link" href={`${COMMUNITY_ISSUES}?q=is%3Aissue+is%3Aopen+label%3Audi-interface`} target="_blank" rel="noopener noreferrer">{s('Browse posts on GitHub', '在 GitHub 浏览帖子')}<ArrowUpRight size={13} /></a></div><button className="uc-icon" aria-label={s('Refresh community', '刷新社区')} disabled={loading} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={18} className={loading ? 'uc-spin' : ''} /></button></div></details>
    <details className="uc-details uc-advanced"><summary>{s('Advanced publishing', '高级发布')}</summary><div className="uc-advanced-body"><p>{s('Want your interface listed publicly here? This prototype uses GitHub for public posts. You will review the content, then sign in and submit on GitHub.', '想让你的界面出现在公开列表中？此原型使用 GitHub 承载公开帖子。你可以先审阅内容，再登录 GitHub 提交。')}</p><button className="uc-button uc-secondary" onClick={openPublish}><Send size={17} />{s('Publish to public community', '发布到公开社区')}</button></div></details>
    {selected && <CommunityDialog title={s('Try this interface', '试试这个界面')} onClose={() => setSelected(null)}>
      <span className="uc-kicker">{selected.source === 'github' ? `@${selected.author}` : s('MADE BY THE UDI PROJECT', '由 UDI 项目提供')}</span><h2>{postTitle(selected)}</h2><p>{postDescription(selected)}</p>
      <div className="uc-full-preview"><ExperiencePreview spec={selected.spec} /></div>
      <h3>{s('What it can help you do', '它能帮你做什么')}</h3><ul className="uc-view-list">{selected.spec.views.filter(view => view.visible).map(view => <li key={view.id}><span>{t(view.title)}{view.type === 'table' && view.filter === 'failed' ? s(' · failed results only', ' · 仅显示失败结果') : ''}{view.type === 'table' && view.groupBy === 'model' ? s(' · grouped by model', ' · 按模型分组') : ''}</span><Check size={15} /></li>)}</ul>
      <h3>{s('Data you can choose to connect', '你可以选择连接的数据')}</h3><ul className="uc-capabilities">{selected.spec.capabilities.map(capability => <li key={capability}><ShieldCheck size={15} /><span>{t(capabilityLabels[capability])}</span></li>)}</ul>
      <div className="uc-use-note"><ShieldCheck size={18} /><p>{s('This replaces your current layout. Your records and notes stay here. Existing data access is cleared; choose what this interface can use next.', '这会替换当前布局。记录和笔记仍留在这里；现有数据授权会清除，接下来由你选择此界面可以使用的数据。')}</p></div>
      {installError && <p className="uc-error" role="alert">{installError}</p>}
      <div className="uc-dialog-actions"><button className="uc-button uc-primary" onClick={() => install(false)}><Download size={17} />{s('Use this interface', '使用这个界面')}</button><button className="uc-button uc-secondary" onClick={() => install(true)}><GitFork size={17} />{s('Make a copy & use', '复制并使用')}</button></div>
      <details className="uc-spec"><summary>{s('Technical details', '技术详情')}</summary><pre tabIndex={0}>{exportPackage(selected.spec)}</pre>{selected.url && <a className="uc-post-link" href={selected.url} target="_blank" rel="noopener noreferrer">{s('View original post', '查看原始帖子')}<ArrowUpRight size={13} /></a>}</details>
    </CommunityDialog>}
    {publishing && <CommunityDialog title={s('Post your interface', '发布你的界面')} onClose={() => setPublishing(false)}>
      <span className="uc-kicker">{s('YOUR DEFINITION, SHARED', '分享你的界面定义')}</span><h2>{s('Let someone make it theirs.', '让别人也能将它变成自己的。')}</h2><p>{s('Review this package, then open the real GitHub issue composer. Sign in and submit there. Opening the composer does not publish a post.', '检查界面包后，打开真实的 GitHub Issue 编辑器，登录并在 GitHub 提交。仅打开编辑器不会发布帖子。')}</p>
      <label className="uc-field"><span>{s('Post title', '帖子标题')}</span><input maxLength={120} value={title} onChange={event => { setTitle(event.target.value); setPublishReviewed(false); setCopied(false); }} /></label><label className="uc-field"><span>{s('Introduction', '简介')}</span><textarea maxLength={1000} rows={3} value={introduction} onChange={event => { setIntroduction(event.target.value); setPublishReviewed(false); setCopied(false); }} /></label>
      <div className="uc-privacy"><ShieldCheck size={19} /><p>{s('Only the interface definition is exported. Dataset records, bindings, grants, local notes, and activity are excluded. Names, descriptions, and other free text can still contain private information: review the complete JSON.', '仅导出界面定义，不包含数据集记录、绑定、授权、本地笔记或活动。但名称、描述等自由文本仍可能包含私人信息，请检查完整 JSON。')}</p></div>
      <ExperiencePreview spec={publishSpec} />
      <details className="uc-spec"><summary>{s('Review complete package JSON', '审阅完整界面包 JSON')}</summary><pre tabIndex={0}>{exportPackage(publishSpec)}</pre></details>
      <label className="uc-review"><input type="checkbox" checked={publishReviewed} onChange={event => setPublishReviewed(event.target.checked)} /><span>{s('I reviewed all free text and understand this will be public on GitHub after I submit it. My GitHub account identifies the author.', '我已检查所有自由文本，理解在 GitHub 提交后内容将公开，并使用我的 GitHub 账户标识作者。')}</span></label>
      {publicationError && <p className="uc-error" role="alert">{s('Choose a title of 1–120 characters and an introduction under 1,000 characters without Markdown code fences.', '请填写 1–120 字的标题和不超过 1,000 字且不含 Markdown 代码围栏的简介。')}</p>}
      {publication?.requiresPaste && <div className="uc-paste"><h3>{s('This package needs a copy-and-paste handoff.', '此界面包需要复制粘贴。')}</h3><p>{s('The package is too long for a reliable composer URL. Copy the post body below, open GitHub, paste it into the issue description, then submit.', '界面包过长，无法可靠地放入编辑器链接。请复制下方帖子正文，打开 GitHub 后粘贴到 Issue 描述中并提交。')}</p><button className="uc-button uc-secondary" disabled={!publishReviewed} onClick={copyBody}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? s('Post body copied', '已复制帖子正文') : s('Copy post body', '复制帖子正文')}</button>{copyFailed && <p role="alert">{s('Clipboard unavailable. Select and copy the text manually.', '无法使用剪贴板，请手动选择并复制正文。')}</p>}<label className="uc-field"><span>{s('Post body to copy', '待复制的帖子正文')}</span><textarea aria-label={s('Post body to copy', '待复制的帖子正文')} readOnly rows={7} value={publication.body} onFocus={event => event.target.select()} /></label></div>}
      {publication && publishReviewed ? <a className="uc-button uc-primary" href={publication.composerUrl} target="_blank" rel="noopener noreferrer"><Send size={17} />{s('Open GitHub composer', '打开 GitHub 编辑器')}<ArrowUpRight size={16} /></a> : <button className="uc-button uc-primary" disabled><Send size={17} />{s('Open GitHub composer', '打开 GitHub 编辑器')}</button>}
      <p className="uc-submit-note">{s('The GitHub template labels your post automatically. Submit it on GitHub, then return and refresh. Your post appears only after it is fetched and validated. Community uses public GitHub Issues; it is not a private sharing service.', 'GitHub 模板会自动为帖子添加标签。请在 GitHub 提交，然后返回并刷新。只有成功获取且通过校验的帖子才会显示。社区使用公开 GitHub Issues，不是私人分享服务。')}</p><a className="uc-post-link" href={COMMUNITY_ISSUES} target="_blank" rel="noopener noreferrer">{s('Open community on GitHub', '在 GitHub 查看社区')}<ArrowUpRight size={14} /></a>
    </CommunityDialog>}
  </section>;
}
