import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Locale = 'en' | 'zh-CN';
export const languageStorageKey = 'udi-studio:language';

// Translate the host UI at render time. Package definitions, fixture records,
// prepared write payloads, capability IDs, and bindings keep their original values.
const chinese: Record<string, string> = {
  'Workspace': '工作空间', 'Data & access': '数据与权限', 'Interface package': '界面包', 'Activity': '活动记录', 'Main navigation': '主导航',
  'Personal workspace': '个人工作空间', 'Local prototype': '本地原型', 'BUILD AROUND YOU': '围绕你的需求构建',
  'Your intent.': '你的意图。', 'Your interface.': '你的界面。', 'The software should': '让软件', 'take your shape.': '适应你的需要。',
  'Meet UDI': '了解 UDI', 'About this prototype': '关于此原型', 'Reset demo': '重置演示', 'Offline demo': '离线演示',
  'Toggle intent editor': '切换意图编辑器', 'Data stays in this browser': '数据保存在此浏览器中',
  'SOFTWARE, DEFINED BY YOU': '由你定义的软件', 'Your data. Your rules.': '你的数据，你的规则。',
  'An interface worth sharing.': '值得分享的界面。', 'Every change, in the open.': '每次更改，清晰可见。',
  'A workspace that works the way you think.': '让工作空间遵循你的思路。',
  'Bind the package to a dataset. Decide what it can access.': '将界面包绑定到数据集，自主决定其访问权限。',
  'Take the definition with you. Keep the instance here.': '带走界面定义，实例留在本地。',
  'A local record of revisions, permissions, and actions.': '在本地记录修订、权限和操作。',
  'Inspect spec': '查看规范', 'CONNECTED INSTANCE': '已连接的实例', 'Local dataset': '本地数据集', 'Fictional data': '虚构数据',
  'Actions, with your approval': '经你批准后执行操作', 'Preview the exact note before a local write.': '写入本地前，先预览完整笔记内容。',
  'Interface definition is shareable. Data bindings and grants stay in this browser.': '界面定义可以分享；数据绑定和授权保存在此浏览器中。',
  'Local source bindings': '本地数据源绑定', 'Logical source names are resolved by this instance.': '逻辑数据源名称由当前实例解析。',
  'Local fixture': '本地示例数据', 'Requested capabilities': '请求的能力', 'Requests are part of a package. Grants belong to an instance.': '请求属于界面包，授权属于实例。',
  'Local review notes': '本地审阅笔记', 'These are in-browser demonstration controls, not an authentication boundary for real services. No external accounts are connected.': '这些浏览器内的演示控件无法为真实服务提供身份验证保护。当前未连接任何外部账户。',
  'PORTABLE BY DEFINITION': '定义即可移植', 'Export package': '导出界面包', 'Fork': '创建分支副本', 'Import package': '导入界面包', 'Schema validated': 'Schema 校验通过',
  'The package has no record payloads, binding paths, grants, or audit history. Free-text titles and descriptions still need human review before publication.': '界面包不包含记录内容、绑定路径、授权或审计历史。发布前仍需人工检查标题和描述中的自由文本。',
  'Instance activity': '实例活动', 'Stored locally · last 100 events · editable browser state': '本地保存 · 最近 100 条事件 · 浏览器状态可编辑',
  'A clean slate.': '从空白开始。', 'Apply an interface change or switch the dataset to start a local activity history.': '应用一次界面更改或切换数据集，即可开始记录本地活动。',
  'Try your first revision': '尝试第一次修订', 'USER-DEFINED INTERFACE': '用户定义界面', 'An open idea. A working prototype.': '开放的想法，可运行的原型。', 'How it works': '工作原理',
  'Shape your workspace': '塑造你的工作空间', 'Close intent editor': '关闭意图编辑器', 'YOUR INTENT → YOUR INTERFACE': '你的意图 → 你的界面',
  'What would make': '怎样才能让', 'this work better for you?': '这里更适合你？', 'Start with a small change.': '从一个小改动开始。', 'The interface follows your lead.': '让界面跟随你的想法。',
  'Your research cockpit is ready. Try focusing on failed runs, or bring your paper library into view.': '研究驾驶舱已就绪。试试聚焦失败实验，或显示你的论文库。',
  'A FEW THINGS TO TRY': '试试这些操作', 'Proposed revision': '待审阅的修订', 'Review the change': '审阅更改',
  'No additional permissions': '无需额外权限', 'Apply change': '应用更改', 'Discard': '放弃', 'You stay in control.': '控制权始终在你手中。',
  'Changes are proposed first.': '先提出更改方案。', 'Data access is always a separate choice.': '数据访问始终需要单独决定。',
  'Describe an interface change': '描述界面更改', 'Describe a change…': '描述一个更改…', 'Planner mode': '规划器模式', 'Propose interface change': '提出界面更改',
  'Offline parser': '离线解析器', 'Local model · Ollama': '本地模型 · Ollama', 'Generating a proposal…': '正在生成方案…',
  'Limited grammar · no LLM · no API key': '有限语法 · 无大语言模型 · 无需 API 密钥', 'Local model · definition only · review before applying': '本地模型 · 仅处理定义 · 审阅后应用',
  'Undo': '撤销', 'Shape workspace': '塑造工作空间', 'Dismiss notification': '关闭通知', 'Close dialog': '关闭对话框',
  'Recorded evidence': '已记录的证据', 'Review local write': '审阅本地写入', 'APPROVE THE EXACT ACTION': '批准具体操作', 'Create a review note': '创建审阅笔记',
  'Approve & create local note': '批准并创建本地笔记', 'Export interface package': '导出界面包', 'Share the way it works.': '分享它的工作方式。',
  'Export a validated definition another instance can import and bind to its own data.': '导出经过校验的定义，供其他实例导入并绑定自己的数据。',
  'Views, filters, layout, and action definitions': '视图、筛选器、布局和操作定义', 'Logical sources and capability requests': '逻辑数据源和能力请求',
  'Record payloads, grants, and bindings excluded': '不包含记录内容、授权和绑定', 'Notes and activity history excluded': '不包含笔记和活动历史',
  'Review names and descriptions before sharing. Structured separation does not guarantee that free text contains no private information.': '分享前请检查名称和描述。结构上的分离并不保证自由文本中没有私人信息。',
  'Download .udi.json': '下载 .udi.json', 'Install an interface package': '安装界面包', 'Same definition. Your instance.': '同一个定义，你自己的实例。',
  'Choose a .udi.json file or paste a package. Installation clears local capability grants; you must review them again.': '选择 .udi.json 文件或粘贴界面包。安装会清除本地能力授权，需要重新审阅。',
  'Choose package': '选择界面包', 'Package JSON': '界面包 JSON', 'Install & review data access': '安装并审阅数据权限', 'Validate package': '校验界面包',
  'The UDI idea': 'UDI 理念', 'Software should': '让软件', 'UDI is a proposal for persistent personal software: users shape the interface; a runtime validates the definition, binds local data, and mediates actions.': 'UDI 提出一种可持续演进的个人软件：用户塑造界面，运行时校验定义、绑定本地数据，并管控操作。',
  'Intent': '意图', 'Definition': '定义', 'Runtime': '运行时', 'What this prototype demonstrates': '此原型展示的能力',
  'Reviewable revisions, five component types, independent dataset bindings, local capability checks, confirmed note creation, and package export/import.': '可审阅的修订、五种组件类型、独立的数据集绑定、本地能力检查、确认后创建笔记，以及界面包导出和导入。',
  'What is simulated': '模拟功能与局限', 'The hosted demo uses a small deterministic grammar. Local development also supports an optional Ollama model. Both datasets and paper titles are fictional; live connectors and background workflows are not implemented. Browser checks do not secure real accounts.': '托管演示使用少量确定性语法。本地开发也可选用 Ollama 模型。两个数据集及论文标题均为虚构；尚未实现实时连接器或后台工作流。浏览器内的检查无法保护真实账户。',
  'UDI builds on end-user programming and generative UI. This prototype does not claim a new transport protocol or compatibility with A2UI, AG-UI, or MCP Apps.': 'UDI 建立在终端用户编程和生成式界面的基础上。此原型不声称提出新的传输协议，也不声称兼容 A2UI、AG-UI 或 MCP Apps。',
  'Reset the local demo': '重置本地演示', 'Start with a fresh workspace?': '重新开始一个工作空间？',
  'This clears this prototype’s revisions, local notes, grants, and activity in this browser. Download your package first if you want to keep your changes.': '这会清除此浏览器中的原型修订、本地笔记、授权和活动记录。如需保留更改，请先下载界面包。', 'Cancel': '取消',
  'Access to this source is turned off.': '此数据源的访问权限已关闭。', 'Review data access': '审阅数据权限', 'Experiments': '实验', 'in this workspace': '当前工作空间', 'passed': '已通过', 'running': '运行中', 'failed': '失败',
  'Best PSNR': '最佳 PSNR', 'Best completed experiment': '最佳已完成实验', 'Needs a closer look': '需要进一步检查', 'failed runs': '失败实验', 'Linked to their recorded commits': '已关联到记录的提交',
  'Small experiments. Clearer answers.': '小实验，更清晰的答案。', 'runs': '次实验', 'EXPERIMENT': '实验', 'MODEL': '模型', 'CHANGE': '变化', 'STATUS': '状态', 'Open experiment': '打开实验',
  'Passed': '已通过', 'Failed': '失败', 'Running': '运行中', 'Every run has a recorded commit': '每次实验均有关联的提交记录', 'Filtered: failed': '筛选：失败', 'All experiments': '全部实验',
  'Best completed run · PSNR in dB': '最佳已完成实验 · PSNR 单位为 dB', '0–40 dB scale · running and failed runs excluded': '范围 0–40 dB · 不含运行中和失败的实验',
  'A little structure for what’s next.': '为接下来的工作安排一点秩序。', 'Bundled fictional papers; no live literature search.': '内置虚构论文；不提供实时文献检索。', 'papers': '篇论文',
  'EXPERIMENT PROVENANCE': '实验溯源', 'Change from baseline': '相对基线的变化', 'Recorded commit ID': '已记录的提交 ID',
  'Commit access is unavailable. Review permissions in Data & access.': '无法访问提交记录。请在“数据与权限”中检查授权。',
  'This is a join on the run’s recorded commit ID. It does not establish what caused a regression.': '这里根据实验记录的提交 ID 进行关联，并不证明性能回退的原因。',
  'Read experiment results': '读取实验结果', 'Read linked commits': '读取关联提交', 'Read project deadlines': '读取项目截止日期', 'Read research library': '读取论文库', 'Create local review notes': '创建本地审阅笔记',
  'Research cockpit': '研究驾驶舱', 'At a glance': '概览', 'Recent experiments': '最近的实验', 'Performance by model': '各模型表现', 'On the horizon': '近期安排', 'From your library': '你的论文库', 'Create review note': '创建审阅笔记',
  'An experiment workspace with commit provenance, research context, and approaching deadlines.': '包含提交溯源、研究资料和近期截止日期的实验工作空间。',
  'Milestone': '里程碑', 'Meeting': '会议', 'Writing': '写作', 'Research': '研究', 'revision': '修订', 'binding': '绑定', 'permission': '权限', 'package': '界面包', 'action': '操作',
  'Show only failed experiments': '只显示失败实验', 'Group experiments by model': '按模型分组实验', 'Add related papers': '添加相关论文', 'Focus on experiments': '聚焦实验', 'Add a review-note action': '添加审阅笔记操作',
  'Show failed experiments in the experiment table.': '在实验表中显示失败的实验。', 'Restore all experiments in the experiment table.': '在实验表中恢复显示全部实验。',
  'Group the experiment table by model.': '按模型对实验表分组。', 'Remove model grouping.': '移除模型分组。', 'Add a research-library panel using the declared papers source.': '使用已声明的论文数据源添加论文库面板。',
  'Focus on experiment metrics and the table; hide secondary panels until balanced layout is restored.': '聚焦实验指标和表格；隐藏次要面板，直到恢复均衡布局。', 'Restore the balanced workspace layout.': '恢复均衡的工作空间布局。',
  'Show the deadline panel.': '显示截止日期面板。', 'Hide the deadline panel.': '隐藏截止日期面板。', 'Add a local review-note action. This requests notes.write; it does not grant it.': '添加本地审阅笔记操作。这会请求 notes.write，授权仍需单独批准。',
  'Choose a regression threshold between 0 and 10 dB.': '请选择 0 到 10 dB 之间的回退阈值。',
  'This offline planner supports a small intent grammar. Try a suggestion, “Show all experiments”, “Hide deadlines”, or “Highlight regressions over 0.5 dB”.': '离线规划器仅支持有限语法，无法处理此请求。请尝试建议，或输入“显示全部实验”“隐藏截止日期”“高亮回退超过 0.5 dB 的实验”。',
  'This proposal is stale. Generate it again against the current revision.': '此方案已过期。请基于当前修订重新生成。', 'This package has no experiment table.': '此界面包没有实验表格。', 'The requested panel is absent from this package.': '此界面包中没有请求的面板。', 'This package has no declared paper source.': '此界面包未声明论文数据源。', 'Unknown operation.': '未知操作。',
  'Browser storage is unavailable or full. This session still works; export your package to save it.': '浏览器存储不可用或已满。当前会话仍可使用；请导出界面包以保存更改。',
  'Revision applied. Your data bindings stayed local.': '修订已应用，数据绑定仍保存在本地。', 'Restored the previous interface specification.': '已恢复之前的界面规范。', 'Previous interface restored. Revision counter advanced.': '已恢复之前的界面，修订编号已递增。', 'Same interface. A different local dataset.': '同一个界面，绑定另一个本地数据集。',
  'Exported the validated interface specification; instance state was excluded.': '已导出校验通过的界面规范，未包含实例状态。', 'Interface package downloaded. Review its free-text fields before publishing.': '界面包已下载。发布前请检查自由文本字段。', 'Forked the interface package.': '已创建界面包的分支副本。', 'Created a local fork. Bindings were preserved.': '已创建本地分支副本，绑定保持不变。',
  'Review note created. View it in Data & access.': '审阅笔记已创建，可在“数据与权限”中查看。', 'Package exceeds the 64 KiB limit.': '界面包超过 64 KiB 大小限制。', 'Package installed. Review and grant each capability to connect this instance.': '界面包已安装。请逐项审阅并授权，以连接当前实例。', 'Demo reset.': '演示已重置。',
  'Planner returned an invalid operation document. No changes were applied.': '规划器返回了无效的操作文档，未应用任何更改。', 'Local planner unavailable. Start npm run agent; see docs/AGENT.md.': '本地规划器不可用。请运行 npm run agent，参阅 docs/AGENT.md。',
  'Binding belongs to a different instance.': '此绑定属于另一个实例。', 'Unknown action.': '未知操作。', 'Missing experiment source.': '缺少实验数据源。', 'This write requires explicit confirmation.': '此写入需要明确确认。', 'Action preview is stale. Review it again.': '操作预览已过期，请重新审阅。', 'Action data changed. Review it again.': '操作数据已改变，请重新审阅。',
  '{count} views': '{count} 个视图', '{views} views · {actions} actions': '{views} 个视图 · {actions} 个操作', 'Requests: {capabilities}': '请求：{capabilities}',
  'Revision {revision}': '修订 {revision}', 'Inspect {id}': '查看 {id}', '{dataset} / {entity} records': '{dataset} / {entity} 记录',
  'experiment': '实验', 'commit': '提交', 'deadline': '截止日期', 'paper': '论文',
  'Grants apply to {dataset} only. A write also requires a separate action preview and confirmation.': '授权仅适用于 {dataset}。写入还需要单独预览操作并确认。',
  'New request: {capabilities}. Grant separately in Data & access.': '新增请求：{capabilities}。请在“数据与权限”中单独授权。',
  'This appends one note to the {dataset} instance in this browser.': '这将在此浏览器中的 {dataset} 实例内追加一条笔记。',
  'Requested: notes.write · Scope: {instance} · Revision: {revision}': '请求：notes.write · 范围：{instance} · 修订：{revision}',
};

const dynamicTranslations: [RegExp, (...groups: string[]) => string][] = [
  [/^Highlight PSNR changes below −([\d.]+) dB\.$/, value => `高亮 PSNR 变化低于 −${value} dB 的实验。`],
  [/^Permission required: (.+)$/, capability => `需要授权：${capability}`],
  [/^Undeclared capability: (.+)$/, capability => `未声明的能力：${capability}`],
  [/^Unknown source: (.+)$/, source => `未知数据源：${source}`],
  [/^Bound the same package to (.+)\.$/, name => `已将同一界面包绑定到 ${name}。`],
  [/^(Granted|Revoked) (.+) for (.+)\.$/, (verb, capability, name) => `${verb === 'Granted' ? '已授予' : '已撤销'} ${name} 的 ${capability} 权限。`],
  [/^Created one confirmed local review note in (.+)\.$/, name => `经确认后，已在 ${name} 中创建一条本地审阅笔记。`],
  [/^Installed (.+); cleared grants for all local instances\.$/, id => `已安装 ${id}，并清除所有本地实例的授权。`],
];

export function translate(locale: Locale, message: string, values: Record<string, string | number> = {}): string {
  let output = message;
  if (locale === 'zh-CN') {
    const trimmed = message.trim();
    if (Object.hasOwn(chinese, trimmed)) output = message.replace(trimmed, chinese[trimmed]);
    else for (const [pattern, render] of dynamicTranslations) {
      const match = message.match(pattern);
      if (match) { output = render(...match.slice(1)); break; }
    }
  }
  return output.replace(/\{(\w+)\}/g, (token, key: string) => String(values[key] ?? token));
}

export function translateError(locale: Locale, message: string): string {
  const translated = translate(locale, message);
  return locale === 'zh-CN' && translated === message ? `无法完成此操作。详细信息：${message}` : translated;
}

export function resolveLocale(search: string, stored: string | null): Locale {
  const requested = new URLSearchParams(search).get('lang');
  if (requested === 'en' || requested === 'zh-CN') return requested;
  return stored === 'zh-CN' ? 'zh-CN' : 'en';
}

function loadLocale(): Locale {
  let stored: string | null = null;
  try { stored = localStorage.getItem(languageStorageKey); } catch { /* Direct language links still work. */ }
  return resolveLocale(window.location.search, stored);
}
interface I18n { locale: Locale; setLocale: (locale: Locale) => void; t: (message: string, values?: Record<string, string | number>) => string; te: (message: string) => string }
const LocaleContext = createContext<I18n | null>(null);
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState<Locale>(loadLocale);
  function setLocale(next: Locale) {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', next);
    window.history.replaceState(window.history.state, '', url);
    updateLocale(next);
  }
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = locale === 'zh-CN' ? 'UDI Studio — 用户定义界面' : 'UDI Studio — User-Defined Interface';
    try { localStorage.setItem(languageStorageKey, locale); } catch { /* Language still works for this session. */ }
  }, [locale]);
  return <LocaleContext.Provider value={{ locale, setLocale, t: (message, values) => translate(locale, message, values), te: message => translateError(locale, message) }}>{children}</LocaleContext.Provider>;
}
export function useI18n(): I18n {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useI18n requires I18nProvider');
  return context;
}

export function LanguageSwitch() {
  const { locale, setLocale } = useI18n();
  return <div className="language-switch" role="group" aria-label={locale === 'en' ? 'Interface language' : '界面语言'}>
    <button lang="en" aria-label="English" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>EN</button>
    <button lang="zh-CN" aria-label="简体中文" aria-pressed={locale === 'zh-CN'} onClick={() => setLocale('zh-CN')}>中文</button>
  </div>;
}
