import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

interface SetupStatus {
  configured: string[];
  remaining: string[];
  isComplete: boolean;
}

const STEPS: { key: string; label: string; description: string }[] = [
  {
    key: 'github_token',
    label: 'GitHub',
    description: 'Personal access token with repo and org read scopes.',
  },
  {
    key: 'github_username',
    label: 'GitHub Username',
    description: 'Your CrewCircle GitHub username.',
  },
  {
    key: 'sentry_token',
    label: 'Sentry',
    description: 'Sentry auth token with org read permissions.',
  },
  {
    key: 'sentry_org',
    label: 'Sentry Org Slug',
    description: 'Your Sentry organization slug (e.g., crewcircle).',
  },
  {
    key: 'do_token',
    label: 'DigitalOcean',
    description: 'DigitalOcean personal access token.',
  },
  {
    key: 'vercel_token',
    label: 'Vercel',
    description: 'Vercel access token with team read permissions.',
  },
  {
    key: 'vercel_team_id',
    label: 'Vercel Team ID',
    description: 'Your Vercel team ID.',
  },
  {
    key: 'cloudflare_token',
    label: 'Cloudflare',
    description: 'Cloudflare API token with zone read permissions.',
  },
  {
    key: 'doppler_token',
    label: 'Doppler',
    description: 'Doppler service token for config access.',
  },
  {
    key: 'anthropic_api_key',
    label: 'Anthropic API',
    description: 'Anthropic API key for cost tracking.',
  },
  {
    key: 'openai_api_key',
    label: 'OpenAI API',
    description: 'OpenAI API key for cost tracking.',
  },
  {
    key: 'openrouter_api_key',
    label: 'OpenRouter API',
    description: 'OpenRouter API key for cost tracking.',
  },
];

export function SetupWizard() {
  const navigate = useNavigate();
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load setup status on mount
  useEffect(() => {
    window.adminAPI
      .invoke<SetupStatus>('setup:getStatus')
      .then((status) => {
        setSetupStatus(status);
        // Start at the first missing credential
        if (!status.isComplete && status.remaining.length > 0) {
          const firstMissing = STEPS.findIndex(
            (s) => s.key === status.remaining[0]
          );
          if (firstMissing >= 0) setCurrentStep(firstMissing);
        }
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const step = STEPS[currentStep];
  const isComplete = setupStatus?.isComplete;

  const handleNext = async () => {
    const value = values[step.key]?.trim();
    if (!value) return;

    setSaving(true);
    setError(null);
    try {
      await window.adminAPI.invoke('setup:saveCredential', {
        key: step.key,
        value,
      });
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setSetupStatus((prev) =>
          prev ? { ...prev, isComplete: true } : null
        );
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setSetupStatus((prev) => (prev ? { ...prev, isComplete: true } : null));
    }
  };

  const handleSkipAll = async () => {
    setSaving(true);
    try {
      await window.adminAPI.invoke('setup:skipAll');
      navigate('/');
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = () => {
    navigate('/');
  };

  if (!setupStatus) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[#8888a0]">Loading setup status...</p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#e4e4ed]">Setup Complete</h2>
          <p className="text-sm text-[#8888a0]">All credentials have been configured.</p>
          <button
            onClick={handleFinish}
            className="px-6 py-2 bg-[#6366f1] text-white rounded-lg hover:bg-[#818cf8] transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#8888a0]">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-[#e4e4ed]">{step.label}</span>
          </div>
          <div className="w-full bg-[#2a2a3a] rounded-full h-1.5">
            <div
              className="bg-[#6366f1] h-1.5 rounded-full transition-all"
              style={{
                width: `${((currentStep + 1) / STEPS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[#e4e4ed]">
              {step.label}
            </h2>
            <p className="text-sm text-[#8888a0] mt-1">{step.description}</p>
          </div>

          <input
            type="password"
            value={values[step.key] ?? ''}
            onChange={(e) =>
              setValues({ ...values, [step.key]: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNext();
            }}
            placeholder={`Enter ${step.label}...`}
            className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-4 py-2 text-sm text-[#e4e4ed] placeholder-[#8888a0] focus:outline-none focus:border-[#6366f1]"
            autoFocus
          />

          {error && <p className="text-sm text-[#ef4444]">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleNext}
              disabled={saving || !values[step.key]?.trim()}
              className="flex-1 px-4 py-2 bg-[#6366f1] text-white rounded-lg text-sm font-medium hover:bg-[#818cf8] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>
            <button
              onClick={handleSkip}
              disabled={saving}
              className="px-4 py-2 bg-[#1a1a24] text-[#8888a0] rounded-lg text-sm border border-[#2a2a3a] hover:text-[#e4e4ed] disabled:opacity-50 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>

        {/* Skip all */}
        <div className="text-center">
          <button
            onClick={handleSkipAll}
            className="text-xs text-[#8888a0] hover:text-[#e4e4ed] underline"
          >
            Skip all and use placeholder credentials
          </button>
        </div>
      </div>
    </div>
  );
}
