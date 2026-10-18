import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Check, ChevronDown, Database, MessageCircle, RotateCcw, Send, Settings2, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { StudioState } from '../core/session';
import type { Operation } from '../core/types';
import { capabilityLabels } from '../core/spec';
import { suggestedIntents } from '../core/planner';
import { proposalFromModel } from '../core/model-planner';
import { allDatasets } from '../data/sources';
import { useI18n } from '../i18n';
import { agentSnapshot, applyAgentProposal, planAgentCommand, proposeBinding, proposeInterfaceOperation, proposePermission, reviewInterface, undoAgentRevision, type AgentProposal } from './controller';
import './agent.css';

interface Message { role: 'user' | 'assistant'; text: string }
const chatKey = 'udi-agent:chat:0.1';
function loadChat(): Message[] {
  try {
    const text = localStorage.getItem(chatKey);
    if (!text || text.length > 50_000) return [];
    const value: unknown = JSON.parse(text);
    return Array.isArray(value) ? value.filter((m): m is Message => !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.length <= 1600).slice(-40) : [];
  } catch { return []; }
}

export default function AgentPanel({ state, onChange }: { state: StudioState; onChange: (next: StudioState) => void }) {
  const { locale, t, te } = useI18n();
  const zh = locale === 'zh-CN';
  const say = (en: string, cn: string) => zh ? cn : en;
  const [mode, setMode] = useState<'chat' | 'controls'>('chat');
  const [messages, setMessages] = useState<Message[]>(loadChat);
  const [command, setCommand] = useState('');
  const [review, setReview] = useState<AgentProposal | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [planner, setPlanner] = useState('offline');
  const [busy, setBusy] = useState(false);
  const latest = useRef(state); latest.current = state;
  const mounted = useRef(true);
  const conversation = useRef<HTMLDivElement>(null);
  const available = allDatasets();
  const dataset = available.find(d => d.id === state.datasetId);
  const instance = state.instances[state.datasetId];
  const table = state.spec.views.find(v => v.type === 'table');
  const stale = review !== null && review.snapshot !== agentSnapshot(state);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { try { localStorage.setItem(chatKey, JSON.stringify(messages.slice(-40))); } catch { /* The current conversation remains usable without storage. */ } }, [messages]);
  useEffect(() => { conversation.current?.scrollTo({ top: conversation.current.scrollHeight, behavior: 'smooth' }); }, [messages.length, busy]);
  const append = (message: Message) => setMessages(items => [...items, message].slice(-40));
  const stage = (create: () => AgentProposal) => {
    setNotice('');
    try { setReview(create()); setError(''); }
    catch (e) { setReview(null); setError((e as Error).message); }
  };
  const proposeControl = (operation: Operation, summary: string) => stage(() => proposeInterfaceOperation(state, operation, summary));

  async function send(text = command) {
    if (busy || !text.trim()) return;
    const prompt = text.trim().slice(0, 500);
    const base = latest.current;
    setCommand(''); setReview(null); setError(''); setNotice(''); append({ role: 'user', text: prompt }); setBusy(true);
    try {
      let next: AgentProposal;
      try { next = planAgentCommand(prompt, base); }
      catch (offlineError) {
        if (planner !== 'ollama' || !(offlineError instanceof Error) || !offlineError.message.startsWith('This offline planner supports')) throw offlineError;
        // The optional bridge receives the definition and prompt, never records,
        // grants, notes, credentials, or the conversation transcript.
        const response = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intent: prompt, spec: base.spec, revision: base.revision }), signal: AbortSignal.timeout(50_000) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? 'Local planner unavailable. Start npm run agent; see docs/AGENT.md.');
        next = reviewInterface(base, proposalFromModel(result, base.spec, base.revision));
      }
      if (!mounted.current) return;
      setReview(next); append({ role: 'assistant', text: say('I prepared a change for review. Nothing has been applied. Check the proposal below, then choose Apply change.', '已生成待审阅的更改，尚未应用。请检查下方提案，再选择“应用更改”。') });
    } catch (e) {
      if (!mounted.current) return;
      const message = (e as Error).message;
      setError(message); append({ role: 'assistant', text: say('I could not prepare that change. Try one of the supported examples or use Controls. No state was changed.', '无法生成此更改。请尝试支持的示例，或使用“控制面板”。状态未发生更改。') });
    } finally { if (mounted.current) setBusy(false); }
  }
  function apply() {
    if (!review) return;
    try {
      const next = applyAgentProposal(latest.current, review);
      const result = say('Applied the reviewed change. Your workspace now uses the updated state.', '已应用审阅过的更改，工作空间已更新。');
      append({ role: 'assistant', text: result }); setNotice(result); setReview(null); setError(''); onChange(next);
    } catch (e) { setError((e as Error).message); }
  }
  function undo() {
    try {
      const next = undoAgentRevision(latest.current);
      setReview(null); setError(''); setNotice(say('Restored the previous interface. Data bindings, permissions, and notes stay as they are.', '已恢复上一界面定义，数据绑定、权限及笔记保持当前状态。')); onChange(next);
    } catch (e) { setError((e as Error).message); }
  }
  function summary(item: AgentProposal) {
    if (item.kind === 'interface') {
      const operation = item.proposal.operations.length === 1 ? item.proposal.operations[0] : null;
      if (zh && operation?.op === 'visibility') {
        const view = state.spec.views.find(v => v.id === operation.viewId);
        return `${operation.value ? '显示' : '隐藏'}“${t(view?.title ?? operation.viewId)}”视图。`;
      }
      return t(item.summary);
    }
    if (item.kind === 'binding') return say(`Connect this interface to ${available.find(d => d.id === item.datasetId)?.name ?? item.datasetId}.`, `将此界面连接到 ${available.find(d => d.id === item.datasetId)?.name ?? item.datasetId}。`);
    return say(`${item.granted ? 'Grant' : 'Revoke'} ${capabilityLabels[item.capability]} for ${dataset?.name}.`, `${item.granted ? '授予' : '撤销'} ${dataset?.name} 的“${t(capabilityLabels[item.capability])}”权限。`);
  }

  return <section className="udi-agent" aria-label={say('Agent workspace', '智能体工作空间')}>
    <header className="udi-agent-heading"><div className="udi-agent-symbol"><Sparkles size={24} /></div><div><span className="udi-agent-eyebrow">{say('YOUR APP, UNDER YOUR CONTROL', '你的应用，由你掌控')}</span><h2>{say('Talk it into shape.', '聊出你想要的界面。')}</h2><p>{say('Change the interface and manage data access here. Review every change before applying it.', '在这里修改界面、管理数据权限。每次更改都先审阅，再应用。')}</p></div></header>
    <div className="udi-agent-context"><Database size={16} /><span><b>{dataset?.name ?? state.datasetId}</b><small>{say('Current data source', '当前数据源')}</small></span><span className="udi-agent-context-grants">{instance.grants.filter(c => state.spec.capabilities.includes(c)).length}/{state.spec.capabilities.length} {say('permissions granted', '项权限已授权')}</span></div>
    <div className="udi-agent-tabs" role="tablist" aria-label={say('Agent modes', '智能体模式')}><button role="tab" aria-selected={mode === 'chat'} aria-controls="udi-agent-chat" id="udi-chat-tab" onClick={() => setMode('chat')}><MessageCircle size={17} />{say('Chat', '对话')}</button><button role="tab" aria-selected={mode === 'controls'} aria-controls="udi-agent-controls" id="udi-controls-tab" onClick={() => setMode('controls')}><Settings2 size={17} />{say('Controls', '控制面板')}</button></div>
    {mode === 'chat' ? <div role="tabpanel" id="udi-agent-chat" aria-labelledby="udi-chat-tab" className="udi-agent-chat">
      <div className="udi-agent-mode"><i /><b>{planner === 'ollama' ? say('Local model · Ollama', '本地模型 · Ollama') : say('Offline command assistant', '离线指令助手')}</b><small>{planner === 'ollama' ? say('Definition + prompt only', '仅发送定义及提示词') : say('Supported commands · no LLM', '有限指令 · 不使用大模型')}</small></div>
      <div className="udi-agent-conversation" ref={conversation} role="log" aria-label={say('Agent conversation', '智能体对话')} aria-live="polite">
        <div className="udi-agent-message assistant"><span className="udi-agent-message-label">{say('Agent', '智能体')}</span><p>{say('Tell me what should change. I can reshape views, switch connected sources, or prepare permission changes. You can make the same choices in Controls.', '告诉我你想修改什么。我可以调整视图、切换已连接数据源，或生成权限更改提案。也可以在“控制面板”中做出相同选择。')}</p></div>
        {messages.map((m, index) => <div className={`udi-agent-message ${m.role}`} key={index}><span className="udi-agent-message-label">{m.role === 'user' ? say('You', '你') : say('Agent', '智能体')}</span><p>{m.text}</p></div>)}
        {busy && <div className="udi-agent-message assistant" role="status"><p>{say('Preparing a review…', '正在生成待审阅提案…')}</p></div>}
      </div>
      <form className="udi-agent-composer" onSubmit={(event: FormEvent) => { event.preventDefault(); void send(); }}><label htmlFor="udi-agent-prompt">{say('Message the agent', '向智能体发送指令')}</label><textarea id="udi-agent-prompt" value={command} onChange={e => setCommand(e.target.value)} maxLength={500} rows={3} placeholder={say('Show only failed experiments…', '只显示失败实验…')} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }} /><div>{import.meta.env.DEV ? <select aria-label={say('Agent planner', '智能体规划器')} value={planner} onChange={e => setPlanner(e.target.value)} disabled={busy}><option value="offline">{say('Offline commands', '离线指令')}</option><option value="ollama">{say('Local Ollama bridge', '本地 Ollama 桥接')}</option></select> : <small>{say('No API key · no network required', '无需 API 密钥 · 无需联网')}</small>}<button type="submit" aria-label={say('Send to agent', '发送给智能体')} disabled={!command.trim() || busy}><Send size={16} />{say('Send', '发送')}</button></div></form>
      <details className="udi-agent-examples" open={!messages.length}><summary>{say('Supported examples', '支持的示例')}<ChevronDown size={14} /></summary><div>{[...suggestedIntents, 'Use Atlas lab', 'Revoke experiment access', 'Grant experiment access'].map(example => { const text = example === 'Use Atlas lab' ? say(example, '切换到 Atlas lab') : example === 'Revoke experiment access' ? say(example, '撤销实验访问权限') : example === 'Grant experiment access' ? say(example, '授予实验访问权限') : t(example); return <button key={example} onClick={() => { setMode('chat'); void send(text); }} disabled={busy}>{text}<ArrowRight size={13} /></button>; })}</div></details>
      {!!messages.length && <button className="udi-agent-clear" onClick={() => { setMessages([]); setReview(null); setError(''); }}>{say('Clear local conversation', '清除本地对话')}</button>}
    </div> : <div role="tabpanel" id="udi-agent-controls" aria-labelledby="udi-controls-tab" className="udi-agent-controls">
      <section><h3>{say('Interface', '界面')}</h3><p>{say('These controls propose the same validated revisions as chat.', '这些控件与对话使用相同的校验和修订机制。')}</p><label className="udi-agent-setting"><span>{say('Layout', '布局')}</span><select aria-label={say('Interface layout', '界面布局')} value={state.spec.layout} onChange={e => proposeControl({ op: 'layout', value: e.target.value as 'balanced' | 'focus' }, e.target.value === 'focus' ? 'Focus on experiment metrics and the table; hide secondary panels until balanced layout is restored.' : 'Restore the balanced workspace layout.')}><option value="balanced">{say('Balanced', '均衡')}</option><option value="focus">{say('Focus', '聚焦')}</option></select></label>
        {table && <label className="udi-agent-setting"><span>{say('Experiment filter', '实验筛选')}</span><select aria-label={say('Experiment filter', '实验筛选')} value={table.filter ?? 'all'} onChange={e => proposeControl({ op: 'filter', value: e.target.value as 'all' | 'failed' }, e.target.value === 'failed' ? 'Show failed experiments in the experiment table.' : 'Restore all experiments in the experiment table.')}><option value="all">{say('All experiments', '全部实验')}</option><option value="failed">{say('Failed only', '仅失败实验')}</option></select></label>}
        {state.spec.views.map(view => <div className="udi-agent-setting" key={view.id}><span>{t(view.title)}<small>{view.id}</small></span><button role="switch" aria-checked={view.visible} aria-label={say(`Show ${view.title}`, `显示${t(view.title)}`)} className={`udi-agent-switch ${view.visible ? 'on' : ''}`} onClick={() => proposeControl({ op: 'visibility', viewId: view.id, value: !view.visible }, `${view.visible ? 'Hide' : 'Show'} the ${view.title} panel.`)}><i /></button></div>)}
      </section><section><h3>{say('Data & permissions', '数据与权限')}</h3><p>{say('Choose a connected source. Grants apply to its instance only.', '选择已连接数据源。授权仅作用于该数据源的实例。')}</p><label className="udi-agent-setting"><span>{say('Connected source', '已连接数据源')}</span><select aria-label={say('Agent data source', '智能体数据源')} value={state.datasetId} onChange={e => stage(() => proposeBinding(state, e.target.value))}>{available.filter(d => state.instances[d.id]).map(d => <option value={d.id} key={d.id}>{d.name}</option>)}</select></label>
        {state.spec.capabilities.map(capability => <div className="udi-agent-setting" key={capability}><span>{t(capabilityLabels[capability])}<small>{say('This workspace only', '仅此工作空间')}</small></span><button role="switch" aria-checked={instance.grants.includes(capability)} aria-label={t(capabilityLabels[capability])} className={`udi-agent-switch ${instance.grants.includes(capability) ? 'on' : ''}`} onClick={() => stage(() => proposePermission(state, capability, !instance.grants.includes(capability)))}><i /></button></div>)}
        <p className="udi-agent-scope"><ShieldCheck size={16} />{say('Granting notes.write only enables a separate write preview. Creating a note still needs its own confirmation.', '授予 notes.write 仅启用独立的写入预览。创建笔记仍需另行确认。')}</p>
      </section>
    </div>}
    {review && <section className="udi-agent-review" aria-label={say('Proposed revision', '待审阅的修订')}><div className="udi-agent-review-title"><Sparkles size={17} /><b>{say('Review the change', '审阅更改')}</b><span>{review.kind === 'interface' ? `r${state.revision + 1}` : say('Instance change', '实例更改')}</span></div><p>{summary(review)}</p>{review.kind === 'interface' ? <><details className="udi-agent-technical"><summary>{say('Technical details', '技术细节')}</summary><pre>{JSON.stringify(review.proposal.operations, null, 2)}</pre></details><p className="udi-agent-scope"><ShieldCheck size={15} />{review.proposal.additions.length ? say(`New capability request: ${review.proposal.additions.map(item => t(capabilityLabels[item])).join(', ')}. It will not be granted automatically.`, `新增能力请求：${review.proposal.additions.map(item => t(capabilityLabels[item])).join('、')}。不会自动授权。`) : say('Existing data grants and notes are preserved.', '现有数据授权与笔记保持不变。')}</p></> : <dl><div><dt>{say('Scope', '范围')}</dt><dd>{review.kind === 'binding' ? say('Current browser instance', '当前浏览器实例') : instance.id}</dd></div><div><dt>{say('Result', '结果')}</dt><dd>{review.kind === 'binding' ? say('Switch source; preserve each source’s grants and notes', '切换数据源；保留各数据源的授权及笔记') : review.granted ? say('Allow the requested capability', '允许该请求能力') : say('Block this capability immediately', '立即阻止此能力')}</dd></div></dl>}{stale && <p role="alert" className="udi-agent-error">{say('The workspace changed. Discard this review and propose again.', '工作空间已更改，请丢弃此提案并重新生成。')}</p>}<div className="udi-agent-review-actions"><button onClick={apply} disabled={stale || busy}><Check size={16} />{say('Apply change', '应用更改')}</button><button onClick={() => { setReview(null); setError(''); }}><X size={15} />{say('Discard', '丢弃')}</button></div></section>}
    {error && <p className="udi-agent-error" role="alert">{te(error)}</p>}{notice && <p className="udi-agent-notice" role="status">{notice}</p>}
    <footer className="udi-agent-footer"><span>{say(`Revision ${state.revision}`, `修订 ${state.revision}`)} · {say('Last 40 chat messages kept locally', '本地保留最近 40 条对话')}</span><button onClick={undo} disabled={!state.history.length}><RotateCcw size={14} />{say('Undo', '撤销')}</button><p>{say('Undo restores the interface only. Data access and completed writes need separate decisions.', '撤销仅恢复界面定义。数据权限及已完成的写入需要分别处理。')}</p></footer>
  </section>;
}
