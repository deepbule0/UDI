import { expect, test } from '@playwright/test';

for (const phone of [false, true]) {
  test(`create and use a workspace without files on ${phone ? 'Chinese phone' : 'desktop'}`, async ({ page }) => {
    const chinese = phone;
    const text = (en: string, zh: string) => chinese ? zh : en;
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(phone ? '/mobile.html?lang=zh-CN&view=data' : '/?lang=en&view=access');
    const nav = page.getByRole('navigation', { name: phone ? '手机导航' : 'Main navigation' });
    await nav.getByRole('button', { name: phone ? '数据' : 'Data & access', exact: true }).click();
    const panel = page.getByRole('region', { name: text('YOUR WORKSPACE', '你的工作空间'), exact: true });
    await expect(page.getByRole('heading', { name: text('Choose what this interface can use', '选择让界面使用哪些内容'), exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: text('Import personal data', '导入个人数据'), exact: true })).not.toBeVisible();
    await expect(panel.getByText('experiments.read', { exact: true })).not.toBeVisible();
    await page.getByRole('button', { name: text('Create my workspace', '创建我的工作空间'), exact: true }).click();
    await page.getByRole('textbox', { name: text('Workspace name', '工作空间名称'), exact: true }).fill('My first workspace');
    await page.getByRole('textbox', { name: text('Experiment name', '实验名称'), exact: true }).fill('MY_OWN_FIRST_EXPERIMENT');
    await page.getByRole('textbox', { name: text('Model name', '模型名称'), exact: true }).fill('MyModel');
    await page.getByRole('combobox', { name: text('Result status', '结果状态'), exact: true }).selectOption('passed');
    await page.getByRole('spinbutton', { name: text('PSNR score', 'PSNR 分数'), exact: true }).fill('32.4');
    await page.getByRole('button', { name: text('Create workspace', '创建工作空间'), exact: true }).click();
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('udi-studio:0.1')!));
    expect(state.datasetId).toMatch(/^personal-/);
    expect(state.instances[state.datasetId].grants).toEqual([]);
    const personal = await page.evaluate(() => JSON.parse(localStorage.getItem('udi-studio:personal-datasets:0.1')!));
    expect(personal).toHaveLength(1);
    expect(personal[0].experiments[0]).toMatchObject({ name: 'MY_OWN_FIRST_EXPERIMENT', psnr: 32.4, status: 'passed' });
    expect(personal[0].experiments[0].commitId).toBe(personal[0].commits[0].id);
    const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'My first workspace', exact: true }) });
    await expect(card.getByRole('checkbox', { name: text('Read experiment results: My first workspace', '读取实验结果: My first workspace'), exact: true })).not.toBeChecked();
    await card.getByRole('button', { name: text('Allow reading this workspace', '允许读取此工作空间'), exact: true }).click();
    const allowed = await page.evaluate(() => JSON.parse(localStorage.getItem('udi-studio:0.1')!));
    expect(allowed.instances[allowed.datasetId].grants).toContain('experiments.read');
    expect(allowed.instances[allowed.datasetId].grants).not.toContain('notes.write');
    await nav.getByRole('button', { name: phone ? '首页' : 'Workspace', exact: true }).click();
    await expect(page.getByText('MY_OWN_FIRST_EXPERIMENT', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.reload();
    expect((await page.evaluate(() => JSON.parse(localStorage.getItem('udi-studio:0.1')!))).datasetId).toBe(state.datasetId);
  });
}

test('workspace form rejects unsupported text without changing stored data', async ({ page }) => {
  await page.goto('/?lang=en');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Data & access', exact: true }).click();
  const before = await page.evaluate(() => localStorage.getItem('udi-studio:0.1'));
  await page.getByRole('button', { name: 'Create my workspace', exact: true }).click();
  await page.getByRole('textbox', { name: 'Workspace name', exact: true }).fill('My workspace');
  await page.getByRole('textbox', { name: 'Experiment name', exact: true }).fill('<script>unsafe</script>');
  await page.getByRole('textbox', { name: 'Model name', exact: true }).fill('MyModel');
  await page.getByRole('spinbutton', { name: 'PSNR score', exact: true }).fill('30');
  await page.getByRole('button', { name: 'Create workspace', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Use plain text for names');
  expect(await page.evaluate(() => localStorage.getItem('udi-studio:personal-datasets:0.1'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('udi-studio:0.1'))).toBe(before);
});
