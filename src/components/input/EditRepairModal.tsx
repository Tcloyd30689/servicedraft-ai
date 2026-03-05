'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { SavedRepairTemplate } from '@/components/input/MyRepairsPanel';

interface EditRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: SavedRepairTemplate;
  onSaved: () => void;
}

interface EditableField {
  key: keyof SavedRepairTemplate;
  label: string;
  optionKey?: keyof SavedRepairTemplate;
}

const EDITABLE_FIELDS: EditableField[] = [
  { key: 'customer_concern', label: 'Customer Concern' },
  { key: 'codes_present', label: 'Codes Present', optionKey: 'codes_present_option' },
  { key: 'diagnostics_performed', label: 'Diagnostics Performed', optionKey: 'diagnostics_option' },
  { key: 'root_cause', label: 'Root Cause/Failure', optionKey: 'root_cause_option' },
  { key: 'repair_performed', label: 'Repair Performed', optionKey: 'repair_option' },
  { key: 'repair_verification', label: 'Repair Verification', optionKey: 'verification_option' },
  { key: 'recommended_action', label: 'Recommended Action', optionKey: 'recommended_option' },
];

export default function EditRepairModal({ isOpen, onClose, template, onSaved }: EditRepairModalProps) {
  const [templateName, setTemplateName] = useState(template.template_name);
  const [year, setYear] = useState(template.year || '');
  const [make, setMake] = useState(template.make || '');
  const [model, setModel] = useState(template.model || '');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const values: Record<string, string> = {};
    for (const f of EDITABLE_FIELDS) {
      values[f.key] = (template[f.key] as string) || '';
    }
    return values;
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Template name is required');
      return;
    }

    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        template_name: templateName.trim(),
        year: year || null,
        make: make || null,
        model: model || null,
      };

      for (const f of EDITABLE_FIELDS) {
        body[f.key] = fieldValues[f.key] || null;
      }

      const res = await fetch(`/api/saved-repairs/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update template');
      }

      toast.success('Template updated');
      onSaved();
      onClose();
    } catch (error) {
      console.error('Failed to update template:', error);
      toast.error('Failed to update template');
    } finally {
      setIsSaving(false);
    }
  };

  // Only show fields relevant to this template's story type
  const relevantFields = EDITABLE_FIELDS.filter((f) => {
    if (template.story_type === 'diagnostic') {
      return f.key !== 'repair_performed' && f.key !== 'repair_verification';
    } else {
      return f.key !== 'recommended_action';
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Template" width="max-w-lg">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <Input
          id="edit-template-name"
          label="Template Name"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />

        <div className="grid grid-cols-3 gap-3">
          <Input
            id="edit-year"
            label="Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
          <Input
            id="edit-make"
            label="Make"
            value={make}
            onChange={(e) => setMake(e.target.value)}
          />
          <Input
            id="edit-model"
            label="Model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>

        <div className="border-t border-[var(--accent-15)] pt-3">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
            Saved Field Values
          </p>
          {relevantFields.map((f) => (
            <div key={f.key} className="mb-3">
              <label className="block text-[var(--text-secondary)] text-xs font-medium mb-1.5">
                {f.label}
                {f.optionKey && template[f.optionKey] && (
                  <span className="ml-2 text-[var(--text-muted)] font-normal">
                    ({template[f.optionKey] === 'exclude' ? "Don't Include" :
                      template[f.optionKey] === 'generate' ? 'Generate' : 'Include'})
                  </span>
                )}
              </label>
              <textarea
                value={fieldValues[f.key] || ''}
                onChange={(e) => setFieldValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                rows={2}
                className="w-full p-2.5 font-data text-sm resize-none
                  bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg
                  text-[var(--text-primary)] placeholder-[var(--text-muted)]
                  focus:outline-none focus:border-[var(--accent-hover)] focus:shadow-[0_0_0_3px_var(--accent-20)]
                  transition-all duration-200"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--accent-15)] mt-4">
        <Button variant="ghost" size="medium" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="medium"
          disabled={!templateName.trim() || isSaving}
          onClick={handleSave}
          className="flex items-center gap-2"
        >
          <Save size={16} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </Modal>
  );
}
