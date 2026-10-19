/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The registration link every CTA opens from OPENS_AT (docs/architecture.md, Configuration). */
  readonly VITE_APPLY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
