/**
 * Shared export utilities for PDF and DOCX document generation.
 * Used by both ShareExportModal (narrative page) and NarrativeDetailModal (dashboard).
 */

export interface ExportNarrative {
  block_narrative: string;
  concern: string;
  cause: string;
  correction: string;
}

export interface ExportVehicleInfo {
  year: string;
  make: string;
  model: string;
  roNumber: string;
}

export interface ExportPayload {
  narrative: ExportNarrative;
  displayFormat: 'block' | 'ccc';
  vehicleInfo: ExportVehicleInfo;
}

/**
 * Calls the server-side export API and triggers a file download.
 * Shared by all export paths so documents are always generated identically.
 */
export async function downloadExport(
  type: 'pdf' | 'docx',
  payload: ExportPayload
): Promise<void> {
  const endpoint = type === 'pdf' ? '/api/export-pdf' : '/api/export-docx';
  const ext = type === 'pdf' ? 'pdf' : 'docx';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`${type.toUpperCase()} generation failed`);

  const blob = await res.blob();
  const filename = payload.vehicleInfo.roNumber
    ? `narrative_RO${payload.vehicleInfo.roNumber}.${ext}`
    : `narrative_${new Date().toISOString().slice(0, 10)}.${ext}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
