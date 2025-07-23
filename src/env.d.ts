/// <reference types="vite/client" />

/**
 * Custom environment variable type definitions
 * These ensure TypeScript type safety when accessing environment variables
 */
interface ImportMetaEnv {
  // Azure API key for authentication with Azure services
  readonly VITE_AZURE_API_KEY: string
  
  // GitHub token for accessing GitHub API (if needed)
  readonly VITE_GITHUB_TOKEN: string
  
  // Base URL for the deployed application
  readonly VITE_SITE_URL: string
  
  // Display name of the application
  readonly VITE_SITE_NAME: string
}

/**
 * Extends the ImportMeta interface from Vite
 * Makes our custom env variables available via import.meta.env
 */
interface ImportMeta {
  readonly env: ImportMetaEnv
} 