export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatTimestamp(seconds: number): string {
  return formatDuration(seconds);
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatGroupLabel(timestamp: number): 'TODAY' | 'PAST WEEK' | 'OLDER' {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'TODAY';
  if (diffDays <= 7) return 'PAST WEEK';
  return 'OLDER';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Cloud provider detection ─────────────────────────────────────────────────

export type CloudProvider = 'openai' | 'gemini' | 'anthropic' | 'github';

/**
 * Detects the cloud provider from an API key based on its prefix format:
 *   sk-ant-…       → Anthropic Claude
 *   sk-proj-… / sk-… → OpenAI
 *   AIza…          → Google Gemini
 *   github_pat_… / ghp_… → GitHub Models (OpenAI-compatible)
 */
export function detectProvider(key: string): CloudProvider | null {
  const k = key.trim();
  if (!k) return null;
  if (k.startsWith('sk-ant-')) return 'anthropic';
  if (k.startsWith('sk-proj-') || k.startsWith('sk-')) return 'openai';
  if (k.startsWith('AIza')) return 'gemini';
  if (k.startsWith('github_pat_') || k.startsWith('ghp_')) return 'github';
  return null;
}

export function providerEndpoint(provider: CloudProvider): string {
  switch (provider) {
    case 'openai':    return 'https://api.openai.com/v1';
    case 'gemini':    return 'https://generativelanguage.googleapis.com/v1beta';
    case 'anthropic': return 'https://api.anthropic.com/v1';
    case 'github':    return 'https://models.inference.ai.azure.com';
  }
}

export function providerLabel(provider: CloudProvider): string {
  switch (provider) {
    case 'openai':    return 'OpenAI';
    case 'gemini':    return 'Google Gemini';
    case 'anthropic': return 'Anthropic Claude';
    case 'github':    return 'GitHub Models';
  }
}

export function generateTitle(): string {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `Recording – ${date} at ${time}`;
}

export function ensureUniqueTitle(title: string, existingTitles: string[]): string {
  if (!existingTitles.includes(title)) return title;
  let counter = 2;
  while (existingTitles.includes(`${title} (${counter})`)) {
    counter++;
  }
  return `${title} (${counter})`;
}
