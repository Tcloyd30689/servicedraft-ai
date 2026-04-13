'use client';

import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Wrench, BookmarkPlus, RotateCcw } from 'lucide-react';
import { getFieldsForStoryType } from '@/constants/fieldConfig';
import type { StoryType, DropdownOption } from '@/constants/fieldConfig';
import { compileDataBlock } from '@/lib/compileDataBlock';
import { useNarrativeStore } from '@/stores/narrativeStore';
import LiquidCard from '@/components/ui/LiquidCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AutoTextarea from '@/components/ui/AutoTextarea';
import StoryTypeSelector from '@/components/input/StoryTypeSelector';
import ConditionalField from '@/components/input/ConditionalField';
import PreGenCustomization from '@/components/input/PreGenCustomization';
import MyRepairsPanel from '@/components/input/MyRepairsPanel';
import SaveRepairModal from '@/components/input/SaveRepairModal';
import type { SavedRepairTemplate } from '@/components/input/MyRepairsPanel';

export default function InputPage() {
  const router = useRouter();
  const {
    state,
    setStoryType,
    setFieldValue,
    setDropdownSelection,
    setRoNumber,
    setCompiledDataBlock,
    clearForNewGeneration,
    clearFormFields,
  } = useNarrativeStore();

  const [isRepairsPanelOpen, setIsRepairsPanelOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const fields = useMemo(
    () => (state.storyType ? getFieldsForStoryType(state.storyType) : []),
    [state.storyType],
  );

  // Validation: check if GENERATE STORY should be enabled
  const isFormValid = useMemo(() => {
    if (!state.storyType || fields.length === 0) return false;

    for (const field of fields) {
      if (field.required) {
        // Required fields (1-5) must have text
        const value = field.id === 'ro_number'
          ? state.roNumber
          : (state.fieldValues[field.id] || '');
        if (!value.trim()) return false;
      } else if (field.hasDropdown) {
        // Conditional fields: only require text if "include" is selected
        const dropdown = state.dropdownSelections[field.id] || 'include';
        if (dropdown === 'include') {
          const value = (state.fieldValues[field.id] || '').trim();
          if (!value) return false;
        }
      }
    }

    return true;
  }, [state.storyType, state.fieldValues, state.dropdownSelections, state.roNumber, fields]);

  const handleGenerate = async () => {
    if (!state.storyType || !isFormValid) return;

    // Save R.O. # to state
    setRoNumber(state.fieldValues['ro_number'] || state.roNumber);

    // Compile data block
    const dataBlock = compileDataBlock(fields, state.fieldValues, state.dropdownSelections);
    setCompiledDataBlock(dataBlock);

    // Clear previous narrative and reset customization so the narrative page auto-generates fresh
    clearForNewGeneration();

    // Navigate to narrative page — generation happens there
    router.push('/narrative');
  };

  // Load a saved template into the form
  const handleLoadTemplate = useCallback((template: SavedRepairTemplate) => {
    // Map API story_type to store StoryType
    const storeStoryType: StoryType = template.story_type === 'diagnostic'
      ? 'diagnostic_only'
      : 'repair_complete';

    // Set story type first — this clears fieldValues and dropdownSelections
    setStoryType(storeStoryType);

    // Map API option values back to store DropdownOption
    const mapOption = (opt: string | null): DropdownOption => {
      if (opt === 'exclude') return 'dont_include';
      if (opt === 'generate') return 'generate';
      return 'include';
    };

    // Use setTimeout to allow the story type state change to propagate and re-render fields
    setTimeout(() => {
      // Set conditional field values and dropdown options (5 core repair fields only)
      const conditionalFields: Array<{
        fieldId: string;
        value: string | null;
        option: string | null;
      }> = [
        { fieldId: 'codes_present', value: template.codes_present, option: template.codes_present_option },
        { fieldId: 'diagnostics_performed', value: template.diagnostics_performed, option: template.diagnostics_option },
        { fieldId: 'root_cause', value: template.root_cause, option: template.root_cause_option },
        { fieldId: 'repair_performed', value: template.repair_performed, option: template.repair_option },
        { fieldId: 'repair_verification', value: template.repair_verification, option: template.verification_option },
      ];

      for (const { fieldId, value, option } of conditionalFields) {
        const mappedOption = mapOption(option);
        setDropdownSelection(fieldId, mappedOption);

        if (mappedOption === 'include' && value) {
          setFieldValue(fieldId, value);
        } else if (mappedOption === 'dont_include' || mappedOption === 'generate') {
          // Clear text for excluded/generated fields
          setFieldValue(fieldId, '');
        }
      }
    }, 50);
  }, [setStoryType, setFieldValue, setDropdownSelection]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Story Type Selection */}
        <LiquidCard size="standard" className="mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            Select Story Type
          </h2>
          <StoryTypeSelector
            selected={state.storyType}
            onSelect={setStoryType}
          />
        </LiquidCard>

        {/* Input Fields */}
        {state.storyType && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <LiquidCard size="standard" className="mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Repair Order Information
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    clearFormFields();
                    toast.success('Form cleared');
                  }}
                  className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent-bright)] transition-colors"
                >
                  <RotateCcw size={14} />
                  CLEAR FORM
                </button>
              </div>

              {/* Required fields (1-5) */}
              {fields
                .filter((f) => f.required)
                .map((field) => {
                  const isShortField = ['ro_number', 'year', 'make', 'model'].includes(field.id);
                  const fieldValue =
                    field.id === 'ro_number'
                      ? state.roNumber
                      : state.fieldValues[field.id] || '';
                  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                    if (field.id === 'ro_number') {
                      setRoNumber(e.target.value);
                    } else {
                      setFieldValue(field.id, e.target.value);
                    }
                  };

                  return isShortField ? (
                    <Input
                      key={field.id}
                      id={field.id}
                      label={`${field.label} *`}
                      placeholder={field.placeholder}
                      value={fieldValue}
                      onChange={handleChange}
                    />
                  ) : (
                    <AutoTextarea
                      key={field.id}
                      id={field.id}
                      label={`${field.label} *`}
                      placeholder={field.placeholder}
                      value={fieldValue}
                      onChange={handleChange}
                    />
                  );
                })}

              {/* Conditional fields (6+) */}
              {fields.filter((f) => f.hasDropdown).length > 0 && (
                <>
                  <div className="border-t border-[var(--accent-15)] my-6" />
                  <div className="flex justify-center mb-10 mt-4">
                    <Button
                      variant="secondary"
                      size="medium"
                      className="flex items-center gap-2 whitespace-nowrap justify-center"
                      onClick={() => setIsRepairsPanelOpen(true)}
                    >
                      <Wrench size={18} />
                      IMPORT FROM MY REPAIRS
                    </Button>
                  </div>

                  {fields
                    .filter((f) => f.hasDropdown)
                    .map((field) => (
                      <ConditionalField
                        key={field.id}
                        field={field}
                        value={state.fieldValues[field.id] || ''}
                        dropdownSelection={state.dropdownSelections[field.id] || 'include'}
                        onValueChange={(val) => setFieldValue(field.id, val)}
                        onDropdownChange={(opt) => setDropdownSelection(field.id, opt)}
                      />
                    ))}
                </>
              )}
            </LiquidCard>

            <PreGenCustomization />

            {/* Bottom action buttons */}
            <div className="flex flex-col items-center gap-3">
              <Button
                size="fullWidth"
                disabled={!isFormValid}
                onClick={handleGenerate}
                className="max-w-md"
              >
                GENERATE STORY
              </Button>

              {/* Save as My Repair button */}
              <Button
                variant="ghost"
                size="medium"
                onClick={() => setIsSaveModalOpen(true)}
                className="flex items-center gap-2"
              >
                <BookmarkPlus size={16} />
                SAVE AS REPAIR TEMPLATE
              </Button>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!state.storyType && (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <p>Select a story type above to begin.</p>
          </div>
        )}
      </motion.div>

      {/* My Repairs Panel */}
      <MyRepairsPanel
        isOpen={isRepairsPanelOpen}
        onClose={() => setIsRepairsPanelOpen(false)}
        onLoadTemplate={handleLoadTemplate}
      />

      {/* Save Repair Modal */}
      {state.storyType && (
        <SaveRepairModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          storyType={state.storyType}
          fieldValues={state.fieldValues}
          dropdownSelections={state.dropdownSelections}
          roNumber={state.roNumber}
        />
      )}
    </div>
  );
}
