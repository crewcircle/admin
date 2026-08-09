import { useParams } from 'react-router';
import { useEffect, useState } from 'react';

const PROVIDER_NAMES: Record<string, string> = {
  supabase: 'Supabase',
  sentry: 'Sentry',
  cloudflare: 'Cloudflare',
  digitalocean: 'DigitalOcean',
  vercel: 'Vercel',
  doppler: 'Doppler',
  anthropic: 'Anthropic Console',
  openai: 'OpenAI Console',
  openrouter: 'OpenRouter',
  github: 'GitHub',
};

export function SaaSPanel() {
  const { provider } = useParams<{ provider: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provider) return;

    setError(null);
    window.adminAPI
      .invoke<{ success: boolean }>('saas:openView', { provider })
      .then((result) => {
        if (!result.success) {
          setError('Failed to open SaaS view');
        }
      })
      .catch((err: Error) => setError(err.message));

    return () => {
      window.adminAPI.invoke('saas:closeView', { provider }).catch(() => {});
    };
  }, [provider]);

  const name = provider ? PROVIDER_NAMES[provider] ?? provider : '';

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-[#ef4444] mb-2">Failed to load {name}</p>
          <p className="text-sm text-[#8888a0]">{error}</p>
          <p className="text-sm text-[#8888a0] mt-4">
            Make sure you have the required credentials configured in Setup.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* The main process overlays a BrowserView on this container */}
      <div className="absolute inset-0 flex items-center justify-center text-[#8888a0]">
        <p>Loading {name} dashboard...</p>
      </div>
      <div id="saas-view-container" className="h-full w-full" />
    </div>
  );
}
