import { type FieldConfig, type DropdownOption } from '@/constants/fieldConfig';

const AI_INFERENCE_TEMPLATE = (fieldLabel: string) =>
  `This information was not specifically documented by the technician. Based on the provided customer concern, diagnostic steps, and any other available information, generate the most probable ${fieldLabel.toUpperCase()} using professional automotive terminology. Avoid any language that could suggest external damage, customer misuse, or conditions that would invalidate warranty coverage.`;

export function compileDataBlock(
  fields: FieldConfig[],
  fieldValues: Record<string, string>,
  dropdownSelections: Record<string, DropdownOption>,
): string {
  const lines: string[] = [];

  for (const field of fields) {
    // Skip R.O. # — never sent to API
    if (field.id === 'ro_number') continue;

    // Required fields (2-5) — always included
    if (field.required) {
      const value = (fieldValues[field.id] || '').trim();
      lines.push(`${field.label.toUpperCase()}: ${value}`);
      continue;
    }

    // Conditional fields (6+) — check dropdown selection
    const dropdown = dropdownSelections[field.id] || 'include';

    if (dropdown === 'include') {
      const value = (fieldValues[field.id] || '').trim();
      lines.push(`${field.label.toUpperCase()}: ${value}`);
    } else if (dropdown === 'generate') {
      lines.push(`${field.label.toUpperCase()}: ${AI_INFERENCE_TEMPLATE(field.label)}`);
    }
    // 'dont_include' — skip entirely
  }

  return lines.join('\n');
}
