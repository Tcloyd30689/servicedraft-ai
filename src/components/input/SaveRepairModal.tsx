'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { StoryType, DropdownOption } from '@/constants/fieldConfig';

interface SaveRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyType: StoryType;
  fieldValues: Record<string, string>;
  dropdownSelections: Record<string, DropdownOption>;
  roNumber: string;
}

export default function SaveRepairModal({
  isOpen,
  onClose,
  storyType,
  fieldValues,
  dropdownSelections,
  roNumber,
}: SaveRepairModalProps) {
  const [templateName, setTemplateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setIsSaving(true);
    try {
      // Map story type from store format to API format
      const apiStoryType = storyType === 'diagnostic_only' ? 'diagnostic' : 'repair';

      // Map dropdown options: store uses 'dont_include', API uses 'exclude'
      const mapOption = (opt: DropdownOption | undefined): string => {
        if (opt === 'dont_include') return 'exclude';
        return opt || 'include';
      };

      const body = {
        template_name: templateName.trim(),
        story_type: apiStoryType,
        year: null,
        make: null,
        model: null,
        customer_concern: null,
        codes_present: fieldValues['codes_present'] || null,
        codes_present_option: mapOption(dropdownSelections['codes_present']),
        diagnostics_performed: fieldValues['diagnostics_performed'] || null,
        diagnostics_option: mapOption(dropdownSelections['diagnostics_performed']),
        root_cause: fieldValues['root_cause'] || null,
        root_cause_option: mapOption(dropdownSelections['root_cause']),
        repair_performed: fieldValues['repair_performed'] || null,
        repair_option: mapOption(dropdownSelections['repair_performed']),
        repair_verification: fieldValues['repair_verification'] || null,
        verification_option: mapOption(dropdownSelections['repair_verification']),
        recommended_action: null,
        recommended_option: null,
      };

      const res = await fetch('/api/saved-repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save template');
      }

      toast.success('Repair template saved!');
      setTemplateName('');
      onClose();
    } catch (error) {
      console.error('Failed to save repair template:', error);
      toast.error('Failed to save repair template');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save as Repair Template" width="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-muted)]">
          Save the current repair data as a reusable template. Templates store your diagnostic and repair information so they can be applied to any vehicle.
        </p>

        <Input
          id="template-name"
          label="Template Name"
          placeholder="e.g., Misfire Diagnosis, Brake Job"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && templateName.trim()) handleSave();
          }}
        />

        {/* Summary of what will be saved */}
        <div className="bg-[var(--bg-input)] rounded-lg p-3 text-xs text-[var(--text-muted)] space-y-1">
          <p className="font-medium text-[var(--text-secondary)] mb-1">Will save:</p>
          <p>Story type: {storyType === 'diagnostic_only' ? 'Diagnostic Only' : 'Repair Complete'}</p>
          {fieldValues['codes_present'] && <p>Codes Present</p>}
          {fieldValues['diagnostics_performed'] && <p>Diagnostics Performed</p>}
          {fieldValues['root_cause'] && <p>Root Cause / Failure</p>}
          {fieldValues['repair_performed'] && <p>Repair Performed</p>}
          {fieldValues['repair_verification'] && <p>Repair Verification</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
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
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
