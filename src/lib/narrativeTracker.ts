/**
 * Narrative Lifecycle Tracker — client-side utility.
 * Fire-and-forget pattern: failures are caught silently and NEVER break user workflows.
 * Same philosophy as activityLogger.ts.
 */

interface CreateTrackerData {
  ro_number?: string;
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  story_type?: string;
  full_narrative: string;
  concern?: string;
  cause?: string;
  correction?: string;
  customization?: {
    length: string;
    tone: string;
    detail: string;
    custom_instructions: string;
  };
}

interface UpdateTrackerData {
  narrative_text?: string;
  concern?: string;
  cause?: string;
  correction?: string;
  customization?: {
    length: string;
    tone: string;
    detail: string;
    custom_instructions: string;
  };
  export_type?: string;
}

/**
 * Creates a new tracker entry for a generated narrative.
 * Returns the tracker row id on success, null on failure.
 */
export async function createTrackerEntry(data: CreateTrackerData): Promise<string | null> {
  try {
    const response = await fetch('/api/narrative-tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...data }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Tracker create failed:', err.error);
      return null;
    }

    const result = await response.json();
    return result.data?.id || null;
  } catch (err) {
    console.error('Tracker create error:', err);
    return null;
  }
}

/**
 * Records an action on an existing tracker entry.
 * Returns true on success, false on failure.
 */
export async function updateTrackerAction(
  trackerId: string,
  actionType: string,
  data?: UpdateTrackerData,
): Promise<boolean> {
  try {
    const response = await fetch('/api/narrative-tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', trackerId, actionType, ...data }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Tracker update failed:', err.error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Tracker update error:', err);
    return false;
  }
}
