/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Data backend switch: "mock" | "supabase" | "hybrid" */
  readonly VITE_DATA_BACKEND: 'mock' | 'supabase' | 'hybrid';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
