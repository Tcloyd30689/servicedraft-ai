'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getFieldsForStoryType } from '@/constants/fieldConfig';
import { compileDataBlock } from '@/lib/compileDataBlock';
import { useNarrativeStore } from '@/stores/narrativeStore';
import LiquidCard from '@/components/ui/LiquidCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AutoTextarea from '@/components/ui/AutoTextarea';
import StoryTypeSelector from '@/components/input/StoryTypeSelector';
import ConditionalField from '@/components/input/ConditionalField';

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
  } = useNarrativeStore();

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Story Type Selection */}
        <LiquidCard size="standard" className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
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
              <h2 className="text-xl font-semibold text-white mb-6">
                Repair Order Information
              </h2>

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
                  <h3 className="text-sm font-medium text-[var(--text-muted)] mb-4 uppercase tracking-wide">
                    Additional Information
                  </h3>

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

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button
                size="fullWidth"
                disabled={!isFormValid}
                onClick={handleGenerate}
                className="max-w-md"
              >
                GENERATE STORY
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
    </div>
  );
}
