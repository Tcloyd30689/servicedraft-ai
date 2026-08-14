'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, RefreshCw, Plus, Edit3, Eye, EyeOff,
  AlertTriangle, MessageSquare, XCircle, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LiquidCard from '@/components/ui/LiquidCard';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import type { SurveyQuestion } from '@/types/database';

// ─── Limits — mirror /api/admin/surveys server validation ────
const MAX_QUESTION_TEXT_LENGTH = 500;
const MAX_OPTIONS = 10;
const MAX_OPTION_LENGTH = 100;

type SurveyInputType = 'text' | 'choice';

/**
 * GET /api/admin/surveys returns each question with aggregated counts that are
 * NOT part of the stored row (and are not returned by POST/PATCH), so the list
 * rows use this extended shape.
 */
interface SurveyRow extends SurveyQuestion {
  response_count: number;
  dismiss_count: number;
}

interface SurveyFormState {
  question_text: string;
  input_type: SurveyInputType;
  /** Kept as a raw string list so a half-typed option never round-trips. */
  options: string[];
  /** Held as a string so the number field can be cleared while typing. */
  display_chance: string;
  is_active: boolean;
}

const emptyForm = (): SurveyFormState => ({
  question_text: '',
  input_type: 'text',
  options: [],
  display_chance: '25',
  is_active: true,
});

const inputClasses =
  'w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent-hover)] transition-all';

interface SurveyManagerProps {
  /** qa_tester — may see everything, may mutate nothing (Sprint G-4a/G-4b). */
  readOnly: boolean;
}

export default function SurveyManager({ readOnly }: SurveyManagerProps) {
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [surveysLoading, setSurveysLoading] = useState(true);
  const [surveysError, setSurveysError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SurveyFormState>(emptyForm());

  // ─── Fetch ─────────────────────────────────────────────────
  const fetchSurveys = useCallback(async () => {
    setSurveysLoading(true);
    try {
      const res = await fetch('/api/admin/surveys');
      const json = await res.json();
      if (json.success) {
        setSurveys(json.data as SurveyRow[]);
        setSurveysError(null);
      } else {
        setSurveysError(json.error || 'Failed to load survey questions.');
      }
    } catch (err) {
      console.error('Surveys fetch error:', err);
      setSurveysError('Failed to load survey questions.');
    } finally {
      setSurveysLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  // ─── Form helpers ──────────────────────────────────────────
  const setInputType = (type: SurveyInputType) => {
    setForm((prev) => ({
      ...prev,
      input_type: type,
      // Seed a pair of blanks so a fresh choice question has somewhere to type.
      options: type === 'choice' && prev.options.length === 0 ? ['', ''] : prev.options,
    }));
  };

  const updateOption = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt)),
    }));
  };

  const addOption = () => {
    setForm((prev) =>
      prev.options.length >= MAX_OPTIONS ? prev : { ...prev, options: [...prev.options, ''] },
    );
  };

  const removeOption = (index: number) => {
    setForm((prev) => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));
  };

  const openCreate = () => {
    setForm(emptyForm());
    setShowCreate(true);
  };

  const openEdit = (q: SurveyRow) => {
    setForm({
      question_text: q.question_text,
      input_type: q.input_type === 'choice' ? 'choice' : 'text',
      options: q.options ?? [],
      display_chance: String(q.display_chance),
      is_active: q.is_active,
    });
    setEditingId(q.id);
  };

  /**
   * Client-side mirror of the server's validation, so the common mistakes are
   * caught before the round-trip. The server re-validates and trims regardless.
   */
  const buildPayload = (): { error: string } | { payload: Record<string, unknown> } => {
    const questionText = form.question_text.trim();
    if (!questionText) return { error: 'Question text is required.' };
    if (questionText.length > MAX_QUESTION_TEXT_LENGTH) {
      return { error: `Question text must be ${MAX_QUESTION_TEXT_LENGTH} characters or fewer.` };
    }

    const displayChance = Number(form.display_chance);
    if (!Number.isInteger(displayChance) || displayChance < 1 || displayChance > 100) {
      return { error: 'Display chance must be a whole number between 1 and 100.' };
    }

    const payload: Record<string, unknown> = {
      question_text: questionText,
      input_type: form.input_type,
      display_chance: displayChance,
      is_active: form.is_active,
    };

    // Sending input_type 'choice' obliges us to send options too; 'text'
    // questions leave options alone (the server force-writes null).
    if (form.input_type === 'choice') {
      const cleaned = form.options.map((opt) => opt.trim()).filter(Boolean);
      if (cleaned.length === 0) {
        return { error: 'Add at least one option for a multiple-choice question.' };
      }
      if (cleaned.length > MAX_OPTIONS) {
        return { error: `A question can have at most ${MAX_OPTIONS} options.` };
      }
      if (cleaned.some((opt) => opt.length > MAX_OPTION_LENGTH)) {
        return { error: `Each option must be ${MAX_OPTION_LENGTH} characters or fewer.` };
      }
      payload.options = cleaned;
    }

    return { payload };
  };

  // ─── Mutations ─────────────────────────────────────────────
  const handleCreate = async () => {
    if (readOnly) return;
    const built = buildPayload();
    if ('error' in built) {
      toast.error(built.error);
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(built.payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Survey question created');
        setShowCreate(false);
        setForm(emptyForm());
        // Counts only come back from GET, so refetch rather than splicing.
        await fetchSurveys();
      } else {
        toast.error(json.error || 'Failed to create survey question');
      }
    } catch (err) {
      console.error('Survey create error:', err);
      toast.error('Failed to create survey question');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (readOnly || !editingId) return;
    const built = buildPayload();
    if ('error' in built) {
      toast.error(built.error);
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/surveys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...built.payload }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Survey question updated');
        setEditingId(null);
        setForm(emptyForm());
        await fetchSurveys();
      } else {
        toast.error(json.error || 'Failed to update survey question');
      }
    } catch (err) {
      console.error('Survey update error:', err);
      toast.error('Failed to update survey question');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (q: SurveyRow) => {
    if (readOnly) return;
    const nextActive = !q.is_active;

    setActionLoading(true);
    try {
      // id + is_active only — PATCH writes just the keys it is given, so the
      // other columns cannot be blanked by a toggle.
      const res = await fetch('/api/admin/surveys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: q.id, is_active: nextActive }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(nextActive ? 'Question activated' : 'Question deactivated');
        setSurveys((prev) =>
          prev.map((row) => (row.id === q.id ? { ...row, is_active: nextActive } : row)),
        );
      } else {
        toast.error(json.error || 'Failed to update survey question');
      }
    } catch (err) {
      console.error('Survey toggle error:', err);
      toast.error('Failed to update survey question');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Shared form body (create + edit) ──────────────────────
  const optionCount = form.options.length;
  const formFields = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-1.5">Question Text *</label>
        <textarea
          spellCheck={true}
          value={form.question_text}
          onChange={(e) => setForm((prev) => ({ ...prev, question_text: e.target.value }))}
          placeholder="e.g. What would make ServiceDraft easier to use?"
          rows={3}
          maxLength={MAX_QUESTION_TEXT_LENGTH}
          className={`${inputClasses} resize-none`}
        />
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {form.question_text.trim().length}/{MAX_QUESTION_TEXT_LENGTH} characters
        </p>
      </div>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-1.5">Answer Type *</label>
        <div className="flex gap-2">
          {([
            { value: 'text' as const, label: 'Free Text' },
            { value: 'choice' as const, label: 'Multiple Choice' },
          ]).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setInputType(opt.value)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm border transition-all cursor-pointer ${
                form.input_type === opt.value
                  ? 'bg-[var(--accent-20)] border-[var(--accent-hover)] text-[var(--accent-bright)]'
                  : 'bg-[var(--bg-input)] border-[var(--accent-border)] text-[var(--text-secondary)] hover:bg-[var(--accent-10)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {form.input_type === 'choice' && (
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1.5">
            Options * <span className="text-xs">({optionCount}/{MAX_OPTIONS})</span>
          </label>
          <div className="space-y-2">
            {form.options.map((opt, index) => (
              <div key={`option-${index}`} className="flex gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  maxLength={MAX_OPTION_LENGTH}
                  className={`flex-1 ${inputClasses}`}
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="px-3 py-2.5 rounded-lg bg-[var(--accent-10)] border border-[var(--accent-border)] text-[var(--text-muted)] hover:bg-[var(--accent-20)] hover:text-[var(--accent-bright)] transition-all cursor-pointer"
                  title="Remove option"
                  aria-label={`Remove option ${index + 1}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            disabled={optionCount >= MAX_OPTIONS}
            className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-10)] hover:text-[var(--accent-bright)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={15} />
            Add Option
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-1.5">Display Chance *</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={100}
            step={1}
            value={form.display_chance}
            onChange={(e) => setForm((prev) => ({ ...prev, display_chance: e.target.value }))}
            placeholder="25"
            className={`flex-1 ${inputClasses}`}
          />
          <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">% of users</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Whole number from 1 to 100 — the share of eligible users who see this question.
        </p>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
          className="w-4 h-4 accent-[var(--accent-hover)] cursor-pointer"
        />
        <span className="text-sm text-[var(--text-secondary)]">
          Active — show this question to users
        </span>
      </label>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <LiquidCard size="standard" className="!rounded-[16px]">
        <div className="flex items-center gap-3 mb-4">
          <ClipboardList size={22} style={{ color: 'var(--accent-bright)' }} />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Survey Manager</h3>
        </div>

        <p className="text-sm text-[var(--text-muted)] mb-4">
          In-app questions shown at random to a share of users. Inactive questions are never
          displayed, and their existing responses are kept.
        </p>

        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            {surveys.length} {surveys.length === 1 ? 'question' : 'questions'} total
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="small" onClick={fetchSurveys} disabled={surveysLoading}>
              <RefreshCw size={16} className={surveysLoading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            {!readOnly && (
            <Button variant="primary" size="small" onClick={openCreate}>
              <Plus size={16} className="mr-1" />
              New Question
            </Button>
            )}
          </div>
        </div>
      </LiquidCard>

      {surveysError ? (
        <LiquidCard size="standard" className="!rounded-[16px]">
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <AlertTriangle size={40} className="text-red-400 opacity-70" />
            <p className="text-[var(--text-secondary)] text-base text-center">{surveysError}</p>
            <Button variant="secondary" size="small" onClick={fetchSurveys}>
              <RefreshCw size={16} className="mr-2" />
              Retry
            </Button>
          </div>
        </LiquidCard>
      ) : surveysLoading && surveys.length === 0 ? (
        <LiquidCard size="standard">
          <div className="py-12">
            <LoadingSpinner size="medium" message="Loading survey questions..." />
          </div>
        </LiquidCard>
      ) : surveys.length === 0 ? (
        <LiquidCard size="standard" className="!rounded-[16px]">
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <ClipboardList size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            <p className="text-[var(--text-secondary)] text-base text-center">
              No survey questions yet.
            </p>
            <p className="text-[var(--text-muted)] text-sm text-center">
              Create a question to start collecting in-app feedback.
            </p>
          </div>
        </LiquidCard>
      ) : (
        <div className="space-y-4">
          {surveys.map((q) => (
            <LiquidCard key={q.id} size="standard" className="!rounded-[16px]">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-start gap-2 flex-wrap mb-2">
                    <h4 className="text-base font-semibold text-[var(--text-primary)]">
                      {q.question_text}
                    </h4>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        q.is_active
                          ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {q.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-10)] border border-[var(--accent-15)] text-[var(--accent-bright)]">
                      {q.input_type === 'choice' ? 'Multiple choice' : 'Free text'}
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">
                      Shows to {q.display_chance}% of users
                    </span>
                  </div>
                </div>
              </div>

              {q.input_type === 'choice' && q.options && q.options.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-[var(--text-muted)] mb-1.5">Options</p>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt, index) => (
                      <span
                        key={`${q.id}-option-${index}`}
                        className="px-2.5 py-1 rounded-lg bg-[var(--accent-10)] border border-[var(--accent-15)] text-xs text-[var(--text-secondary)]"
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Response counts */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <MessageSquare size={16} style={{ color: 'var(--accent-bright)', opacity: 0.6 }} />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {q.response_count}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <XCircle size={16} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {q.dismiss_count}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">dismissed</span>
                </div>
              </div>

              {/* Mutation controls — every action here is hidden for read-only
                  (qa_tester) viewers, who still see the list, counts and status. */}
              {!readOnly && (
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--accent-15)]">
                <button
                  onClick={() => openEdit(q)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-10)] hover:text-[var(--accent-bright)] transition-all cursor-pointer"
                >
                  <Edit3 size={15} />
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(q)}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-10)] hover:text-[var(--accent-bright)] transition-all cursor-pointer disabled:opacity-50 ml-auto"
                >
                  {q.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                  {q.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
              )}
            </LiquidCard>
          ))}
        </div>
      )}

      {/* Create Question Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Survey Question"
        width="max-w-[520px]"
      >
        <div className="space-y-4">
          {formFields}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" size="small" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            {!readOnly && (
            <Button
              variant="primary"
              size="small"
              onClick={handleCreate}
              disabled={actionLoading || !form.question_text.trim()}
            >
              {actionLoading ? 'Creating...' : 'Create Question'}
            </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Question Modal */}
      <Modal
        isOpen={!!editingId}
        onClose={() => setEditingId(null)}
        title="Edit Survey Question"
        width="max-w-[520px]"
      >
        <div className="space-y-4">
          {formFields}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" size="small" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
            {!readOnly && (
            <Button
              variant="primary"
              size="small"
              onClick={handleEdit}
              disabled={actionLoading || !form.question_text.trim()}
            >
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
