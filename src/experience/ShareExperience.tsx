import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Copy, Link2, Share2, ShieldCheck, X } from 'lucide-react';
import type { UDISpec } from '../core/types';
import { useI18n } from '../i18n';
import { createExperienceLink } from './links';
import './experience.css';

export function ExperienceDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { locale } = useI18n();
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} className="udi-experience-dialog" aria-label={title}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.currentTarget === event.target) onClose(); }}>
    <header><strong>{title}</strong><button type="button" className="ue-icon" onClick={onClose} aria-label={locale === 'en' ? 'Close sharing dialog' : '关闭分享对话框'}><X size={21} /></button></header>
    <div className="ue-body">{children}</div>
  </dialog>;
}

export function ShareExperience({ spec, triggerLabel }: { spec: UDISpec; triggerLabel?: string }) {
  const { locale } = useI18n();
  const s = (en: string, zh: string) => locale === 'en' ? en : zh;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(spec.metadata.title);
  const [description, setDescription] = useState(spec.metadata.description);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'copied' | 'shared' | 'select' | null>(null);
  const linkField = useRef<HTMLTextAreaElement>(null);
  const [showLink, setShowLink] = useState(false);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLink(''); setStatus(null); setError('');
    if (!name.trim()) return;
    const definition = { ...spec, metadata: { ...spec.metadata, title: name.trim(), description: description.trim() } };
    createExperienceLink(definition).then(value => { if (active) setLink(value); }).catch(() => {
      if (active) setError(s('A share link could not be created. Check the name and description. Very large interfaces can use the advanced file tools.', '无法创建分享链接。请检查名称和介绍。较大的界面可使用高级文件工具。'));
    });
    return () => { active = false; };
  }, [open, name, description, spec, locale]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setStatus('copied');
    } catch {
      setShowLink(true); setStatus('select');
      // A visible selected field also works where Clipboard API is unavailable.
      requestAnimationFrame(() => { linkField.current?.focus(); linkField.current?.select(); });
    }
  }
  async function share() {
    try {
      await navigator.share({ title: name.trim(), text: description.trim(), url: link });
      setStatus('shared');
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') return;
      setError(s('Sharing is unavailable here. Use Copy link instead.', '这里暂时无法使用系统分享，请使用“复制链接”。'));
    }
  }
  function begin() {
    setName(spec.metadata.title); setDescription(spec.metadata.description); setShowLink(false); setOpen(true);
  }
  return <>
    <button type="button" className="ue-button ue-primary ue-share-trigger" onClick={begin}><Share2 size={18} />{triggerLabel ?? s('Share this interface', '分享这个界面')}</button>
    {open && <ExperienceDialog title={s('Share this interface', '分享这个界面')} onClose={() => setOpen(false)}>
      <span className="ue-kicker"><Link2 size={15} />{s('A LINK, READY TO TRY', '打开链接，即可试用')}</span>
      <h2>{s('Pass on your way of working.', '分享适合你的使用方式。')}</h2>
      <p>{s('Send a link in any conversation. Your friend can see a preview and make a copy for themselves.', '把链接发到聊天中。朋友打开后就能预览，并使用自己的副本。')}</p>
      <label className="ue-field"><span>{s('Give it a name', '给它起个名字')}</span><input value={name} onChange={event => setName(event.target.value)} maxLength={80} required autoComplete="off" /></label>
      <label className="ue-field"><span>{s('What makes it useful?', '它适合用来做什么？')}</span><textarea value={description} onChange={event => setDescription(event.target.value)} maxLength={240} rows={3} /></label>
      <div className="ue-privacy"><ShieldCheck size={21} /><div><strong>{s('Share the interface, keep your data.', '分享界面，保留自己的数据。')}</strong><p>{s('The link contains its name, description, layout, filters, and requested features. It leaves out your records, notes, connected data, access approvals, chat, and activity. Anyone with the link can read its names and descriptions—check those before sharing.', '链接只包含名称、介绍、布局、筛选方式和所需功能，不包含你的记录、笔记、已连接的数据、授权、聊天或活动。拿到链接的人可以读取名称和介绍，分享前请检查这些文字。')}</p></div></div>
      <div className="ue-actions">
        {canShare && <button type="button" className="ue-button ue-primary" disabled={!link} onClick={share}><Share2 size={18} />{s('Share…', '分享…')}</button>}
        <button type="button" className={`ue-button ${canShare ? 'ue-secondary' : 'ue-primary'}`} disabled={!link} onClick={copy}>{status === 'copied' ? <Check size={18} /> : <Copy size={18} />}{status === 'copied' ? s('Link copied', '链接已复制') : s('Copy link', '复制链接')}</button>
      </div>
      <p className="ue-status" role="status">{status === 'copied' ? s('Ready to paste into a message. No account or upload needed.', '现在可以粘贴到聊天中，无需注册或上传。') : status === 'shared' ? s('Your interface was sent to the sharing app.', '已将界面链接交给分享应用。') : status === 'select' ? s('Select and copy the link below.', '请选择并复制下方链接。') : ''}</p>
      {error && <p className="ue-error" role="alert">{error}</p>}
      <details className="ue-link-options" open={showLink} onToggle={event => setShowLink(event.currentTarget.open)}><summary>{s('View link', '查看链接')}</summary><textarea ref={linkField} aria-label={s('Interface share link', '界面分享链接')} value={link} readOnly rows={3} onFocus={event => event.target.select()} /><p>{s('This link carries the interface itself. Very long links may be shortened or rejected by some messaging apps.', '链接本身包含界面定义。部分聊天应用可能会截断或拒绝过长的链接。')}</p></details>
    </ExperienceDialog>}
  </>;
}
