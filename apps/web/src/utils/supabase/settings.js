import { createClient } from './client.js';
import { idbGet, idbSet, idbDel } from './idb.js';

const supabase = createClient();

export const SETTINGS_KEYS = {
  THEME: 'scr700-theme',
  LOGO_DARK: 'scr700-logo-dark',
  LOGO_LIGHT: 'scr700-logo-light',
  LOGO_SIZE: 'scr700-logo-size',
};

export async function getSettings() {
  const localData = {};
  
  if (typeof window !== 'undefined') {
    for (const key of Object.values(SETTINGS_KEYS)) {
      localData[key] = (await idbGet(key)) || window.localStorage.getItem(key) || '';
    }
    const stationIds = ['win', 's01', 's02', 's03', 's04', 's05', 'wout'];
    for (const id of stationIds) {
      const key = `scr700-station-asset-${id}`;
      localData[key] = (await idbGet(key)) || window.localStorage.getItem(key) || '';
    }
  }

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value');

    if (error) {
      console.warn("Supabase settings query returned an error (using local cache fallback):", error.message);
      return localData;
    }

    if (data && data.length > 0) {
      const cloudData = {};
      for (const row of data) {
        cloudData[row.key] = row.value;
        if (typeof window !== 'undefined') {
          await idbSet(row.key, row.value);
          try {
            window.localStorage.setItem(row.key, row.value);
          } catch (localErr) {
            // Quota exceeded for localStorage is expected for multi-MB models; IndexedDB holds it.
          }
        }
      }
      return { ...localData, ...cloudData };
    }
  } catch (err) {
    console.warn("Could not retrieve settings from Supabase:", err);
  }

  return localData;
}

export async function setSetting(key, value) {
  if (typeof window !== 'undefined') {
    if (value === null || value === undefined) {
      await idbDel(key);
      try { window.localStorage.removeItem(key); } catch (e) {}
    } else {
      await idbSet(key, String(value));
      try { window.localStorage.setItem(key, String(value)); } catch (e) {}
    }
  }

  try {
    let result;
    if (value === null || value === undefined) {
      result = await supabase
        .from('settings')
        .delete()
        .eq('key', key);
    } else {
      result = await supabase
        .from('settings')
        .upsert({ 
          key, 
          value: String(value), 
          updated_at: new Date().toISOString() 
        });
    }

    if (result && result.error) {
      console.error(`Supabase database error saving setting ${key}:`, result.error.message);
    }
  } catch (err) {
    console.error(`Error saving setting ${key} to Supabase:`, err);
  }
}

export async function removeSetting(key) {
  await setSetting(key, null);
}
