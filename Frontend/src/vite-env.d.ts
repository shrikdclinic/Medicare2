/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ALLOWED_EMAIL: string; // New environment variable for allowed email
}