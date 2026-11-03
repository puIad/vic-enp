/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The registration link every CTA opens from OPENS_AT (docs/architecture.md, Configuration). */
  readonly VITE_APPLY_URL?: string
  /** Set on Vercel Production to force the off-season; any non-empty value forces it (docs/site-states.md). */
  readonly VITE_FORCE_OFF_SEASON?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
