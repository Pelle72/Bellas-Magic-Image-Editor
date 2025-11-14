/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string
  readonly XAI_API_KEY?: string
  readonly HF_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
