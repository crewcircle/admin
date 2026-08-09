export type ServiceCategory = 'app' | 'infra' | 'saas';

export interface ServiceDescriptor {
  id: string;
  name: string;
  category: ServiceCategory;
  /** Public URL for linking out. */
  url: string;
  /** Endpoint actually checked (defaults to url). Prefer status pages. */
  checkUrl?: string;
}

/**
 * Service registry — everything the command center watches.
 * Extensible by design: add entries here, or later from user settings.
 * Categories drive severity: app=critical, infra=high, saas=medium.
 */
export const SERVICES: ServiceDescriptor[] = [
  // CrewCircle products
  { id: 'crewcircle-web', name: 'CrewCircle Web', category: 'app', url: 'https://crewcircle.com.au' },

  // Infrastructure
  { id: 'vercel', name: 'Vercel', category: 'infra', url: 'https://vercel.com', checkUrl: 'https://www.vercel-status.com' },
  { id: 'cloudflare', name: 'Cloudflare', category: 'infra', url: 'https://cloudflare.com', checkUrl: 'https://www.cloudflarestatus.com' },
  { id: 'supabase', name: 'Supabase', category: 'infra', url: 'https://supabase.com', checkUrl: 'https://status.supabase.com' },
  { id: 'digitalocean', name: 'DigitalOcean', category: 'infra', url: 'https://digitalocean.com', checkUrl: 'https://status.digitalocean.com' },

  // SaaS subscriptions
  { id: 'github', name: 'GitHub', category: 'saas', url: 'https://github.com', checkUrl: 'https://www.githubstatus.com' },
  { id: 'sentry', name: 'Sentry', category: 'saas', url: 'https://sentry.io', checkUrl: 'https://status.sentry.io' },
  { id: 'anthropic', name: 'Anthropic', category: 'saas', url: 'https://anthropic.com', checkUrl: 'https://status.anthropic.com' },
  { id: 'openai', name: 'OpenAI', category: 'saas', url: 'https://openai.com', checkUrl: 'https://status.openai.com' },
  { id: 'openrouter', name: 'OpenRouter', category: 'saas', url: 'https://openrouter.ai', checkUrl: 'https://status.openrouter.ai' },
  { id: 'doppler', name: 'Doppler', category: 'saas', url: 'https://doppler.com' },
];
