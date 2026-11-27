import { readPreference, writePreference } from './preference.js';

const form = document.querySelector('form');
const reminder = form.elements.weeklyReminder;
const status = form.querySelector('[role="status"]');

try {
  reminder.checked = readPreference(window.localStorage);
} catch {
  status.textContent = '无法读取已保存的偏好。';
}

reminder.addEventListener('change', () => {
  status.textContent = '';
});

form.addEventListener('submit', event => {
  event.preventDefault();
  try {
    writePreference(window.localStorage, reminder.checked);
    status.textContent = '偏好已保存。';
  } catch {
    status.textContent = '未保存。偏好已保留在当前页面，请重试。';
  }
});
