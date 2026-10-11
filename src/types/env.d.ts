/// <reference types="vite/client" />

/**
 * The env vars this app reads.
 *
 * Vite only exposes variables prefixed `VITE_` to the client bundle, so this
 * is the complete list -- see .env.example. Declared optional because both are
 * genuinely absent in a default checkout: services/axios.ts falls back to a
 * hard-coded default URL rather than requiring configuration, and an unset
 * VITE_LEGAL_PUBLISHED means the legal pages are drafts (constants/legal.ts).
 *
 * This augments (rather than replaces) vite/client's own ImportMetaEnv, so
 * MODE, BASE_URL, DEV, PROD and SSR stay available.
 */
interface ImportMetaEnv {
  readonly VITE_AQRA_API_URL?: string;
  /** The string 'true' publishes the legal pages; anything else is a draft. */
  readonly VITE_LEGAL_PUBLISHED?: string;
}
