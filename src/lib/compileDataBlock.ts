import { type FieldConfig, type DropdownOption } from '@/constants/fieldConfig';

const AI_INFERENCE_TEMPLATE = (fieldLabel: string) =>
  `This information was not specifically documented by the technician. Based on the provided customer concern, diagnostic steps, and any other available information, generate the most probable ${fieldLabel.toUpperCase()} in GENERAL, qualitative, professional automotive terms ONLY. State what was done or checked in general terms (for example TESTED BATTERY VOLTAGE), and do NOT invent any specific values, measurements, or readings (such as voltages, resistances, amperages, pressures, temperatures, frequencies, or torque specs), any specific circuit, pin, terminal, or connector numbers, any document, reference, case, or claim IDs, or any DTC codes that were not actually provided. Fabricating specifics that the technician did not provide could make the documentation false and expose the user and the business to serious liability, so write TESTED BATTERY VOLTAGE, never TESTED BATTERY VOLTAGE ON CIRCUIT 2214 AND FOUND 13.2 VOLTS. Avoid any language that could suggest external damage, customer misuse, or conditions that would invalidate warranty coverage.`;

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
