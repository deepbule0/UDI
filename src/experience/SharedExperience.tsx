import { useState } from 'react';
import { ArrowRight, CopyCheck, ShieldCheck } from 'lucide-react';
import type { UDISpec } from '../core/types';
import { capabilityLabels } from '../core/spec';
import { useI18n } from '../i18n';
import { ExperiencePreview } from './ExperiencePreview';
import { ExperienceDialog } from './ShareExperience';
import './experience.css';

export function SharedExperience({ spec, onUse, onClose }: { spec: UDISpec; onUse: (spec: UDISpec) => void; onClose: () => void }) {
  const { locale, t } = useI18n();
  const s = (en: string, zh: string) => locale === 'en' ? en : zh;
  const [error, setError] = useState('');
  function use() {
    try { onUse(structuredClone(spec)); }
    catch { setError(s('This interface could not be used. Your current interface is unchanged.', '暂时无法使用这个界面，当前界面未更改。')); }
  }
  return <ExperienceDialog title={s('An interface shared with you', '与你分享的界面')} onClose={onClose}>
    <span className="ue-kicker"><CopyCheck size={16} />{s('TRY IT. MAKE IT YOURS.', '先试试，再变成自己的。')}</span>
    <h2>{spec.metadata.title}</h2>
    <p>{spec.metadata.description}</p>
    <div className="ue-preview"><ExperiencePreview spec={spec} /></div>
    <div className="ue-privacy"><ShieldCheck size={21} /><div><strong>{s('Your copy. Your choice of data.', '你的副本，由你决定使用什么数据。')}</strong><p>{s('The preview uses bundled sample data. Using this interface replaces your current layout and starts with all data access turned off. Choose data and approve access next. It cannot bring someone else’s data or permissions with it.', '预览使用应用内置的示例数据。使用后会替换当前布局，所有数据访问权限都默认关闭。接下来由你选择数据并决定是否授权，不会带入他人的数据或权限。')}</p></div></div>
    <details className="ue-link-options"><summary>{s('What this interface asks to use', '这个界面需要哪些功能')}</summary><ul className="ue-capabilities">{spec.capabilities.map(capability => <li key={capability}>{t(capabilityLabels[capability])}</li>)}</ul><p>{s('These are requests, not access approvals. Nothing is granted by opening this link.', '这些只是功能请求。打开链接不会自动授予任何访问权限。')}</p></details>
    <div className="ue-actions"><button type="button" className="ue-button ue-primary" onClick={use}>{s('Use this interface', '使用这个界面')}<ArrowRight size={18} /></button><button type="button" className="ue-button ue-secondary" onClick={onClose}>{s('Keep my current interface', '保留当前界面')}</button></div>
    {error && <p className="ue-error" role="alert">{error}</p>}
  </ExperienceDialog>;
}
