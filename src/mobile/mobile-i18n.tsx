import { useI18n } from '../i18n';

const messages: Record<string, string> = {
  'Home': '首页', 'Shape': '塑造', 'Data': '数据', 'Share': '分享', 'Phone navigation': '手机导航',
  'UDI mobile': 'UDI 移动版', 'Your research,': '你的研究，', 'your rhythm.': '你的节奏。',
  'A little less friction. A lot more you.': '少一点阻力，多一点你的方式。',
  'LOCAL BY DESIGN': '为本地使用而设计', 'Shape this space': '塑造这个空间', 'Change one thing.': '从一个改动开始。',
  'Make it yours.': '让它适合你。', 'Describe what you need. Review the definition before anything changes.': '说出你的需要。先审阅定义，再应用更改。',
  'Deterministic offline planner': '确定性离线规划器', 'Supported suggestions': '支持的建议',
  'No model or live connector is running. These suggestions use a small, deterministic grammar.': '当前未运行模型或实时连接器。这些建议使用有限的确定性语法。',
  'Your next revision': '你的下一次修订', 'Nothing changes until you apply.': '应用前不会更改任何内容。',
  'Definition changes': '定义更改', 'View your updated workspace': '查看更新后的工作空间',
  'Your definition travels.': '让定义随你同行。', 'Your data stays here.': '让数据留在本地。',
  'One portable package. Independent local instances.': '一个可移植的界面包，彼此独立的本地实例。',
  'Inside the package': '界面包包含', 'Stays in this browser': '保存在此浏览器中',
  'Views, layout & filters': '视图、布局与筛选器', 'Capability requests': '能力请求', 'Action definitions': '操作定义',
  'Records & source bindings': '记录与数据源绑定', 'Permissions & local notes': '授权与本地笔记', 'Revision history & activity': '修订历史与活动',
  'Inspect definition': '查看定义', 'Package file': '界面包文件', 'Choose a .udi.json file': '选择 .udi.json 文件',
  'Paste package JSON': '粘贴界面包 JSON', 'Validated. Ready to review.': '校验通过，可以审阅。',
  'Import replaces the definition and clears grants for both local datasets. Your notes stay local.': '导入会替换界面定义，并清除两个本地数据集的授权。笔记仍保存在本地。',
  'Data on your terms.': '数据，由你掌控。', 'Same package. Two separate worlds.': '同一个界面包，两个独立的数据空间。',
  'Choose your local instance': '选择本地实例', 'Switch datasets without changing your interface definition. Grants and notes belong to each instance.': '切换数据集不改变界面定义。授权和笔记分别属于各个实例。',
  'Active instance': '当前实例', 'Requested access': '请求的权限', 'Read access': '读取权限', 'Write access': '写入权限',
  'Local only': '仅限本地', 'No notes yet. Add a review-note action in Shape, grant notes.write here, then preview the exact write from Home.': '暂无笔记。在“塑造”中添加审阅笔记操作，在这里授予 notes.write 权限，再从首页预览具体写入内容。',
  'A trace of your choices.': '记录你的每次选择。', 'Your revisions, bindings, and approvals, kept in one local timeline.': '你的修订、绑定和批准都保存在本地时间线中。',
  'No activity yet': '暂无活动', 'Start with a suggestion in Shape. Your first change will appear here.': '从“塑造”中的建议开始。第一次更改会显示在这里。',
  'Source unavailable': '数据源不可用', 'This view has no matching records.': '此视图没有匹配的记录。',
  'No visible views': '没有可见视图', 'Import a package with visible views to build your workspace.': '导入包含可见视图的界面包，构建你的工作空间。',
  'ALL RUNS': '全部实验', 'FAILED RUNS': '失败实验', 'Recorded commit': '关联提交', 'Provenance': '溯源',
  'Compared with baseline': '相对基线', 'Demo records, not live research results.': '演示记录，并非实时研究结果。',
  'Your interface, in your pocket.': '把你的界面装进口袋。',
  'An installable web app demo of User-Defined Interface. Same definition and runtime as the desktop prototype, designed for your phone.': '可安装的用户定义界面网页应用演示。与桌面原型共用定义和运行时，为手机重新设计。',
  'Install on this device': '安装到此设备', 'Installed on this device': '已安装到此设备',
  'Open in your browser, then use “Add to Home Screen” or “Install app”. On iPhone, open in Safari and choose Share → Add to Home Screen.': '在浏览器中打开，然后选择“添加到主屏幕”或“安装应用”。在 iPhone 上，用 Safari 打开，选择“分享”→“添加到主屏幕”。',
  'This is a web app demo, with no App Store or Play Store release.': '这是网页应用演示，尚未发布到 App Store 或 Play Store。',
  'Desktop workspace': '桌面工作空间', 'Open source on GitHub': '在 GitHub 查看源码', 'About & install': '关于与安装',
  'Ready for offline use': '可离线使用', 'You are offline': '当前处于离线状态',
  'Preparing offline access': '正在准备离线访问', 'Update available': '有可用更新', 'Update app': '更新应用',
  'Browser data can be cleared by your device. Export your definition to keep a portable copy.': '设备可能清除浏览器数据。请导出定义，保留可移植副本。',
  'Installed and browser copies may use separate local storage. Export and import transfer the definition only.': '已安装的应用和浏览器版本可能使用独立的本地存储。导出和导入仅传递界面定义。',
  'Review this export': '审阅导出内容', 'Export contains the definition only. Review names and descriptions for private information before sharing.': '导出仅包含定义。分享前请检查名称和描述是否包含私人信息。',
  'One confirmed write': '一次确认后的写入', 'The exact note below will be added to this dataset only.': '下方完整笔记仅会添加到当前数据集。',
  'Saved locally': '已保存到本地', 'Package installed': '界面包已安装', 'Data access was reset. Review each grant before reading records.': '数据权限已重置。读取记录前，请逐项审阅并授权。',
  'Same interface. New perspective.': '同一个界面，另一种视角。', 'Applied. Your workspace is ready.': '已应用，工作空间已更新。',
  'Your previous definition is restored.': '已恢复之前的定义。', 'Failed to read this file.': '无法读取此文件。',
  'Latest revision': '最新修订', 'view definitions': '视图定义', 'Preview first. Confirm once.': '先预览，再确认。',
  'Stored in this browser only': '仅保存在此浏览器中', 'A small, honest prototype.': '一个能力边界明确的小原型。',
  'The planner is a bounded offline parser; datasets and papers are fictional. No external accounts, model calls, or background workflows are connected. Capability checks demonstrate the architecture and do not secure real services.': '规划器使用有限语法的离线解析器；数据集和论文均为虚构。未连接外部账户、模型调用或后台工作流。能力检查仅用于演示架构，无法保护真实服务。',
  'One definition. Your local data.': '一个定义，你的本地数据。',
  'Reset demo and clear local state': '重置演示并清除本地状态', 'This also resets the desktop demo on this origin. Export your package first to keep your interface changes.': '这也会重置同一来源的桌面演示。如需保留界面更改，请先导出界面包。',
};

export function useMobileI18n() {
  const context = useI18n();
  return { ...context, t: (message: string, values?: Record<string, string | number>) => {
    const translated = context.locale === 'zh-CN' && messages[message] ? messages[message] : context.t(message, values);
    return translated.replace(/\{(\w+)\}/g, (token, key: string) => String(values?.[key] ?? token));
  } };
}
