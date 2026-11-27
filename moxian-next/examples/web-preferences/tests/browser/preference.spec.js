import { expect, test } from '@playwright/test';
import { storageKey } from '../../preference.js';

test('AC-save persists the submitted preference and discards an unsubmitted edit', async ({ page }) => {
  await page.goto('/');
  const reminder = page.getByRole('checkbox', { name: '接收每周提醒' });
  await expect(reminder).not.toBeChecked();
  await reminder.check();
  await page.reload();
  await expect(reminder).not.toBeChecked();

  await reminder.check();
  await page.getByRole('button', { name: '保存偏好' }).click();
  await expect(page.getByRole('status')).toHaveText('偏好已保存。');
  await page.reload();
  await expect(reminder).toBeChecked();
});

test('AC-retry retains the current edit when saving fails and lets the user retry', async ({ page }) => {
  await page.addInitScript(key => {
    const save = Storage.prototype.setItem;
    let rejectOnce = true;
    Storage.prototype.setItem = function (name, value) {
      if (name === key && rejectOnce) {
        rejectOnce = false;
        throw new DOMException('Storage is full', 'QuotaExceededError');
      }
      return save.call(this, name, value);
    };
  }, storageKey);

  await page.goto('/');
  const reminder = page.getByRole('checkbox', { name: '接收每周提醒' });
  const save = page.getByRole('button', { name: '保存偏好' });
  const status = page.getByRole('status');

  await reminder.check();
  await save.click();
  await expect(status).toHaveText('未保存。偏好已保留在当前页面，请重试。');
  await expect(reminder).toBeChecked();
  await save.click();
  await expect(status).toHaveText('偏好已保存。');
  await page.reload();
  await expect(reminder).toBeChecked();
});
