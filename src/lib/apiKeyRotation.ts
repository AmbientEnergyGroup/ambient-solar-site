/**
 * API Key Rotation Utility
 * Rotates through multiple API keys to avoid rate limit errors
 */

type ApiProvider = 'openai' | 'anthropic' | 'replicate' | 'deepgram';

// Load API keys from environment variables
function loadApiKeys(prefix: string, count: number = 3): string[] {
  const keys: string[] = [];
  
  // Add the primary key using edge-compatible environment variable access
  const primaryKey = process.env[prefix] || '';
  if (primaryKey) keys.push(primaryKey);
  
  // Add additional keys
  for (let i = 2; i <= count; i++) {
    const key = process.env[`${prefix}_${i}`] || '';
    if (key) keys.push(key);
  }
  
  return keys.filter(Boolean);
}

// Use a different approach for edge runtime
// Initialize API keys lazily when needed rather than at module load
let API_KEYS: Record<ApiProvider, string[]> | null = null;

// Track the current index for each provider
const currentIndex: Record<ApiProvider, number> = {
  openai: 0,
  anthropic: 0,
  replicate: 0,
  deepgram: 0
};

/**
 * Get API keys for a provider, initializing them if needed
 */
function getApiKeys(provider: ApiProvider): string[] {
  // Initialize keys map if not done yet
  if (!API_KEYS) {
    API_KEYS = {
      openai: loadApiKeys('OPENAI_API_KEY'),
      anthropic: loadApiKeys('ANTHROPIC_API_KEY'),
      replicate: loadApiKeys('REPLICATE_API_TOKEN'),
      deepgram: loadApiKeys('DEEPGRAM_API_KEY')
    };
  }
  
  return API_KEYS[provider];
}

/**
 * Get the next API key in rotation for a specific provider
 */
export function getNextApiKey(provider: ApiProvider): string {
  const keys = getApiKeys(provider);
  
  if (keys.length === 0) {
    console.error(`No API keys configured for ${provider}`);
    return '';
  }
  
  // Get current key
  const key = keys[currentIndex[provider]];
  
  // Move to next key for next request
  currentIndex[provider] = (currentIndex[provider] + 1) % keys.length;
  
  return key;
}

/**
 * Reset the rotation to the first key
 */
export function resetApiKeyRotation(provider: ApiProvider): void {
  currentIndex[provider] = 0;
}

/**
 * Get the number of available API keys for a provider
 */
export function getKeyCount(provider: ApiProvider): number {
  return getApiKeys(provider).length;
} 