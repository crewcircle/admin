import { useState } from 'react';
import { useNavigate } from 'react-router';

export function ProvisionWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    id: '',
    name: '',
    description: '',
    priceCents: 0,
  });
  const [jobId, setJobId] = useState<string | null>(null);
  const [log, setLog] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (step < 2) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await window.adminAPI.invoke<{ jobId: string }>(
        'provision:startJob',
        {
          projectId: form.id,
          name: form.name,
          description: form.description,
          priceCents: form.priceCents,
        }
      );
      setJobId(result.jobId);
      setStep(3);

      // Poll for job status
      const interval = setInterval(async () => {
        try {
          const job = await window.adminAPI.invoke<{
            status: string;
            output_log: string;
            error_message: string | null;
          }>('provision:getJobStatus', { jobId: result.jobId });
          if (job) {
            setLog(job.output_log ?? '');
            if (job.status === 'completed' || job.status === 'failed') {
              clearInterval(interval);
              if (job.status === 'failed' && job.error_message) {
                setError(job.error_message);
              }
            }
          }
        } catch {
          // Ignore poll errors
        }
      }, 2000);
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold text-[#e4e4ed]">New Project</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['Details', 'Pricing', 'Confirm', 'Provision'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                i <= step
                  ? 'bg-[#6366f1] text-white'
                  : 'bg-[#2a2a3a] text-[#8888a0]'
              }`}
            >
              {i + 1}
            </span>
            <span
              className={i <= step ? 'text-[#e4e4ed]' : 'text-[#8888a0]'}
            >
              {label}
            </span>
            {i < 3 && <span className="text-[#2a2a3a]">→</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === 0 && (
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#e4e4ed]">Project Details</h2>
          <div>
            <label className="block text-sm text-[#8888a0] mb-1">Project ID</label>
            <input
              type="text"
              value={form.id}
              onChange={(e) => updateField('id', e.target.value)}
              placeholder="e.g., cardSnap"
              className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-4 py-2 text-sm text-[#e4e4ed] placeholder-[#8888a0] focus:outline-none focus:border-[#6366f1]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#8888a0] mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., CardSnap"
              className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-4 py-2 text-sm text-[#e4e4ed] placeholder-[#8888a0] focus:outline-none focus:border-[#6366f1]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#8888a0] mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Brief description..."
              rows={3}
              className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-4 py-2 text-sm text-[#e4e4ed] placeholder-[#8888a0] focus:outline-none focus:border-[#6366f1] resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => navigate('/projects')}
              className="px-4 py-2 text-sm text-[#8888a0] hover:text-[#e4e4ed]"
            >
              Cancel
            </button>
            <button
              onClick={handleNextStep}
              disabled={!form.id.trim() || !form.name.trim()}
              className="px-4 py-2 bg-[#6366f1] text-white rounded-lg text-sm font-medium hover:bg-[#818cf8] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Pricing */}
      {step === 1 && (
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#e4e4ed]">Pricing</h2>
          <div>
            <label className="block text-sm text-[#8888a0] mb-1">Price (cents)</label>
            <input
              type="number"
              value={form.priceCents || ''}
              onChange={(e) => updateField('priceCents', parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-4 py-2 text-sm text-[#e4e4ed] placeholder-[#8888a0] focus:outline-none focus:border-[#6366f1]"
            />
          </div>
          <div className="flex justify-between">
            <button onClick={handlePrevStep} className="px-4 py-2 text-sm text-[#8888a0] hover:text-[#e4e4ed]">
              ← Back
            </button>
            <button
              onClick={handleNextStep}
              className="px-4 py-2 bg-[#6366f1] text-white rounded-lg text-sm font-medium hover:bg-[#818cf8]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 2 && (
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#e4e4ed]">Confirm</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#8888a0]">ID</span>
              <span className="text-[#e4e4ed]">{form.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8888a0]">Name</span>
              <span className="text-[#e4e4ed]">{form.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8888a0]">Price</span>
              <span className="text-[#e4e4ed]">${(form.priceCents / 100).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-between">
            <button onClick={handlePrevStep} className="px-4 py-2 text-sm text-[#8888a0] hover:text-[#e4e4ed]">
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-[#22c55e] text-white rounded-lg text-sm font-medium hover:bg-[#16a34a] disabled:opacity-50"
            >
              {submitting ? 'Provisioning...' : 'Start Provisioning'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Output log */}
      {step === 3 && (
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#e4e4ed]">Provisioning</h2>
          {jobId && (
            <p className="text-xs text-[#8888a0]">Job ID: {jobId}</p>
          )}
          <pre className="bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg p-4 text-xs text-[#e4e4ed] font-mono whitespace-pre-wrap max-h-64 overflow-auto">
            {log || 'Waiting for output...'}
          </pre>
          {error && <p className="text-sm text-[#ef4444]">{error}</p>}
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-[#6366f1] text-white rounded-lg text-sm font-medium hover:bg-[#818cf8]"
          >
            Back to Projects
          </button>
        </div>
      )}
    </div>
  );
}
