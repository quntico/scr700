import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) || "https://lbgionyukqjbmlisemhi.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) || "sb_publishable_wnHv2fsg6iXDpP-bFcq-EQ_YooJx4cb";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
