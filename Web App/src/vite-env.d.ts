/// <reference types="vite/client" />

// App version injected at build time
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_KEY: string;
  readonly VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
