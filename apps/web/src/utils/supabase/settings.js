import { createClient } from './client.js';

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
      localData[key] = window.localStorage.getItem(key) || '';
    }
    for (let i = 1; i <= 10; i++) {
      const key = `scr700-station-asset-${i}`;
      localData[key] = window.localStorage.getItem(key) || '';
    }
  }

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value');

    if (error) {
      console.warn("Supabase settings query returned an error (using localStorage fallback):", error.message);
      return localData;
    }

    if (data && data.length > 0) {
      const cloudData = {};
      data.forEach(row => {
        cloudData[row.key] = row.value;
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(row.key, row.value);
          } catch (localErr) {
            console.warn(`Could not sync setting ${row.key} to localStorage (quota exceeded):`, localErr.message);
          }
        }
      });
      return { ...localData, ...cloudData };
    }
  } catch (err) {
    console.warn("Could not retrieve settings from Supabase:", err);
  }

  return localData;
}

export async function setSetting(key, value) {
  if (typeof window !== 'undefined') {
    try {
      if (value === null || value === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, String(value));
      }
    } catch (localErr) {
      console.warn(`LocalStorage write skipped for ${key} (quota exceeded):`, localErr.message);
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
