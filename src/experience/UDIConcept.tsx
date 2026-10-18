import { useI18n } from '../i18n';

/** Explain the framework without asking ordinary users to handle its format. */
export function UDIConcept() {
  const { locale } = useI18n();
  const en = locale === 'en';
  return <section className="udi-concept">
    <p>{en
      ? 'The platform provides content, supported services, and an app you can use immediately. You use an agent or ordinary controls to shape how it looks, works, and organizes the data you allow. Share that experience so someone else can use it with their own data.'
      : '平台提供内容、受支持的服务和可直接使用的应用。你通过智能体或常规控件，决定它如何呈现、如何工作，以及如何组织获准使用的数据。你还可以分享这种体验，让别人配合自己的数据使用。'}</p>
    <p>{en
      ? 'UDI applies to reading, photos, travel, research, music, and other apps. This demo implements a small research-workspace profile.'
      : 'UDI 适用于阅读、照片、出行、研究、音乐及其他应用。当前演示实现的是范围较小的研究工作空间配置。'}</p>
    <a className="text-button" href={`https://github.com/deepbule0/UDI/blob/main/docs/${en ? '' : 'zh-CN/'}FRAMEWORK.md`} target="_blank" rel="noreferrer">{en ? 'Read the general UDI proposal ↗' : '阅读通用 UDI 提案 ↗'}</a>
  </section>;
}
