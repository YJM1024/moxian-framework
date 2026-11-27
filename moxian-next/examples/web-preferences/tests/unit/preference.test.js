import { describe, expect, test } from 'vitest';
import { readPreference, storageKey, writePreference } from '../../preference.js';

function memoryStorage(initialValue = null) {
  const values = new Map([[storageKey, initialValue]]);
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe('weekly reminder storage', () => {
  test('missing or unrecognized saved values leave the preference off', () => {
    expect(readPreference(memoryStorage())).toBe(false);
    expect(readPreference(memoryStorage('unrecognized'))).toBe(false);
  });

  test('saving on then off preserves each selected value', () => {
    const storage = memoryStorage();
    writePreference(storage, true);
    expect(readPreference(storage)).toBe(true);
    writePreference(storage, false);
    expect(readPreference(storage)).toBe(false);
  });
});
