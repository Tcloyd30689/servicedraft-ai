'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { StoryType, DropdownOption } from '@/constants/fieldConfig';

export interface NarrativeData {
  block_narrative: string;
  concern: string;
  cause: string;
  correction: string;
}

export interface NarrativeState {
  // Input page state
  storyType: StoryType | null;
  fieldValues: Record<string, string>;
  dropdownSelections: Record<string, DropdownOption>;
  roNumber: string;

  // Compiled data
  compiledDataBlock: string;

  // Generated narrative
  narrative: NarrativeData | null;
  displayFormat: 'block' | 'ccc';

  // Customization
  lengthSlider: 'short' | 'standard' | 'detailed';
  toneSlider: 'warranty' | 'standard' | 'customer_friendly';
  detailSlider: 'concise' | 'standard' | 'additional';
  customInstructions: string;

  // Generation tracking — increments when new generation is requested
  generationId: number;

  // Save tracking — navigation guard + auto-save dedup
  isSaved: boolean;
  savedNarrativeId: string | null;
}

const initialState: NarrativeState = {
  storyType: null,
  fieldValues: {},
  dropdownSelections: {},
  roNumber: '',
  compiledDataBlock: '',
  narrative: null,
  displayFormat: 'block',
  lengthSlider: 'standard',
  toneSlider: 'standard',
  detailSlider: 'standard',
  customInstructions: '',
  generationId: 0,
  isSaved: true, // true initially (no narrative to protect yet)
  savedNarrativeId: null,
};

// Simple hook-based store (avoids external dependency)
let globalState: NarrativeState = { ...initialState };
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

// Module-level subscribe/getSnapshot for useSyncExternalStore
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot() {
  return globalState;
}

export function useNarrativeStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setStoryType = useCallback((type: StoryType | null) => {
    globalState = { ...globalState, storyType: type, fieldValues: {}, dropdownSelections: {} };
    notifyListeners();
  }, []);

  const setFieldValue = useCallback((fieldId: string, value: string) => {
    globalState = {
      ...globalState,
      fieldValues: { ...globalState.fieldValues, [fieldId]: value },
    };
    notifyListeners();
  }, []);

  const setDropdownSelection = useCallback((fieldId: string, option: DropdownOption) => {
    globalState = {
      ...globalState,
      dropdownSelections: { ...globalState.dropdownSelections, [fieldId]: option },
    };
    notifyListeners();
  }, []);

  const setRoNumber = useCallback((value: string) => {
    globalState = { ...globalState, roNumber: value };
    notifyListeners();
  }, []);

  const setCompiledDataBlock = useCallback((block: string) => {
    globalState = { ...globalState, compiledDataBlock: block };
    notifyListeners();
  }, []);

  const setNarrative = useCallback((data: NarrativeData | null) => {
    globalState = { ...globalState, narrative: data, isSaved: false, savedNarrativeId: null };
    notifyListeners();
  }, []);

  const setDisplayFormat = useCallback((format: 'block' | 'ccc') => {
    globalState = { ...globalState, displayFormat: format };
    notifyListeners();
  }, []);

  const setLengthSlider = useCallback((val: NarrativeState['lengthSlider']) => {
    globalState = { ...globalState, lengthSlider: val };
    notifyListeners();
  }, []);

  const setToneSlider = useCallback((val: NarrativeState['toneSlider']) => {
    globalState = { ...globalState, toneSlider: val };
    notifyListeners();
  }, []);

  const setDetailSlider = useCallback((val: NarrativeState['detailSlider']) => {
    globalState = { ...globalState, detailSlider: val };
    notifyListeners();
  }, []);

  const setCustomInstructions = useCallback((val: string) => {
    globalState = { ...globalState, customInstructions: val };
    notifyListeners();
  }, []);

  const resetCustomization = useCallback(() => {
    globalState = {
      ...globalState,
      lengthSlider: 'standard',
      toneSlider: 'standard',
      detailSlider: 'standard',
      customInstructions: '',
    };
    notifyListeners();
  }, []);

  const clearForNewGeneration = useCallback(() => {
    globalState = {
      ...globalState,
      narrative: null,
      displayFormat: 'block',
      lengthSlider: 'standard',
      toneSlider: 'standard',
      detailSlider: 'standard',
      customInstructions: '',
      generationId: globalState.generationId + 1,
      isSaved: true,
      savedNarrativeId: null,
    };
    notifyListeners();
  }, []);

  const resetAll = useCallback(() => {
    globalState = { ...initialState };
    notifyListeners();
  }, []);

  const markSaved = useCallback((narrativeId: string) => {
    globalState = { ...globalState, isSaved: true, savedNarrativeId: narrativeId };
    notifyListeners();
  }, []);

  /** Set up state for a diagnostic→repair-complete update flow.
   *  Sets the narrative from the API response, storyType to repair_complete,
   *  and carries forward vehicle info + RO# from the original diagnostic entry. */
  const setForRepairUpdate = useCallback((data: {
    narrative: NarrativeData;
    roNumber: string;
    year: string;
    make: string;
    model: string;
  }) => {
    globalState = {
      ...globalState,
      narrative: data.narrative,
      storyType: 'repair_complete',
      roNumber: data.roNumber,
      fieldValues: {
        ...globalState.fieldValues,
        year: data.year,
        make: data.make,
        model: data.model,
      },
      compiledDataBlock: '', // Not needed — narrative already generated
      displayFormat: 'block',
      lengthSlider: 'standard',
      toneSlider: 'standard',
      detailSlider: 'standard',
      customInstructions: '',
      generationId: globalState.generationId + 1,
      isSaved: false,
      savedNarrativeId: null,
    };
    notifyListeners();
  }, []);

  return {
    state,
    setStoryType,
    setFieldValue,
    setDropdownSelection,
    setRoNumber,
    setCompiledDataBlock,
    setNarrative,
    setDisplayFormat,
    setLengthSlider,
    setToneSlider,
    setDetailSlider,
    setCustomInstructions,
    resetCustomization,
    clearForNewGeneration,
    resetAll,
    markSaved,
    setForRepairUpdate,
  };
}
