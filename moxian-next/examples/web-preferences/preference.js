export const storageKey = 'weekly-reminder-preference';

export function readPreference(storage) {
  return storage.getItem(storageKey) === 'on';
}

export function writePreference(storage, enabled) {
  storage.setItem(storageKey, enabled ? 'on' : 'off');
}
