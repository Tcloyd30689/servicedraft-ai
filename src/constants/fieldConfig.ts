export type StoryType = 'diagnostic_only' | 'repair_complete';

export type DropdownOption = 'include' | 'dont_include' | 'generate';

export interface FieldConfig {
  id: string;
  label: string;
  fieldNumber: number;
  required: boolean;       // true = always required, no dropdown
  hasDropdown: boolean;     // true = conditional field with dropdown
  placeholder: string;
}

export const diagnosticOnlyFields: FieldConfig[] = [
  { id: 'ro_number', label: 'R.O. #', fieldNumber: 1, required: true, hasDropdown: false, placeholder: 'e.g., 123456' },
  { id: 'year', label: 'Year', fieldNumber: 2, required: true, hasDropdown: false, placeholder: 'e.g., 2022' },
  { id: 'make', label: 'Make', fieldNumber: 3, required: true, hasDropdown: false, placeholder: 'e.g., Chevrolet' },
  { id: 'model', label: 'Model', fieldNumber: 4, required: true, hasDropdown: false, placeholder: 'e.g., Silverado 1500' },
  { id: 'customer_concern', label: 'Customer Concern', fieldNumber: 5, required: true, hasDropdown: false, placeholder: 'What did the customer report?' },
  { id: 'codes_present', label: 'Codes Present', fieldNumber: 6, required: false, hasDropdown: true, placeholder: 'e.g., P0300, P0301 — random/multiple misfires' },
  { id: 'diagnostics_performed', label: 'Diagnostics Performed', fieldNumber: 7, required: false, hasDropdown: true, placeholder: 'e.g., Scanned for codes, performed cylinder balance test' },
  { id: 'root_cause', label: 'Root Cause/Failure', fieldNumber: 8, required: false, hasDropdown: true, placeholder: 'e.g., Worn spark plugs with degraded electrode gaps' },
  { id: 'recommended_action', label: 'Recommended Action', fieldNumber: 9, required: false, hasDropdown: true, placeholder: 'e.g., Recommend replacing spark plugs and ignition coils' },
];

export const repairCompleteFields: FieldConfig[] = [
  { id: 'ro_number', label: 'R.O. #', fieldNumber: 1, required: true, hasDropdown: false, placeholder: 'e.g., 123456' },
  { id: 'year', label: 'Year', fieldNumber: 2, required: true, hasDropdown: false, placeholder: 'e.g., 2022' },
  { id: 'make', label: 'Make', fieldNumber: 3, required: true, hasDropdown: false, placeholder: 'e.g., Chevrolet' },
  { id: 'model', label: 'Model', fieldNumber: 4, required: true, hasDropdown: false, placeholder: 'e.g., Silverado 1500' },
  { id: 'customer_concern', label: 'Customer Concern', fieldNumber: 5, required: true, hasDropdown: false, placeholder: 'What did the customer report?' },
  { id: 'codes_present', label: 'Codes Present', fieldNumber: 6, required: false, hasDropdown: true, placeholder: 'e.g., P0300, P0301 — random/multiple misfires' },
  { id: 'diagnostics_performed', label: 'Diagnostics Performed', fieldNumber: 7, required: false, hasDropdown: true, placeholder: 'e.g., Scanned for codes, performed cylinder balance test' },
  { id: 'root_cause', label: 'Root Cause/Failure', fieldNumber: 8, required: false, hasDropdown: true, placeholder: 'e.g., Worn spark plugs with degraded electrode gaps' },
  { id: 'repair_performed', label: 'Repair Performed', fieldNumber: 9, required: false, hasDropdown: true, placeholder: 'e.g., Replaced spark plugs and ignition coils' },
  { id: 'repair_verification', label: 'Repair Verification', fieldNumber: 10, required: false, hasDropdown: true, placeholder: 'e.g., Cleared codes, road tested, no misfires present' },
];

export function getFieldsForStoryType(storyType: StoryType): FieldConfig[] {
  return storyType === 'diagnostic_only' ? diagnosticOnlyFields : repairCompleteFields;
}

export const dropdownOptions: { value: DropdownOption; label: string }[] = [
  { value: 'include', label: 'Include Information' },
  { value: 'dont_include', label: "Don't Include Information" },
  { value: 'generate', label: 'Generate Applicable Info' },
];
