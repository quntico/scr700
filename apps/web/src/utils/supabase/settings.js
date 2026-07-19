import { createClient } from './client';

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
          window.localStorage.setItem(row.key, row.value);
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
    if (value === null || value === undefined) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, String(value));
    }
  }

  try {
    if (value === null || value === undefined) {
      await supabase
        .from('settings')
        .delete()
        .eq('key', key);
    } else {
      await supabase
        .from('settings')
        .upsert({ 
          key, 
          value: String(value), 
          updated_at: new Date().toISOString() 
        });
    }
  } catch (err) {
    console.error(`Error saving setting ${key} to Supabase:`, err);
  }
}

export async function removeSetting(key) {
  await setSetting(key, null);
}
