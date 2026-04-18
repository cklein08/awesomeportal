// Add global typings so import.meta.env.BASE_URL is recognized by TypeScript.
interface ImportMetaEnv {
	readonly BASE_URL: string;
	// add other env vars here if needed, e.g. readonly VITE_API_URL?: string;
	readonly [key: string]: unknown;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
