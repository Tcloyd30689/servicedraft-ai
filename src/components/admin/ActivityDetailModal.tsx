'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, Car, FileText, Wrench, Clipboard } from 'lucide-react';

interface ActivityEntry {
  id: string;
  user_id: string;
  action_type: string;
  story_type: string | null;
  input_data: Record<string, unknown> | null;
  output_preview: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  user_name: string;
  user_email: string;
}

const ACTION_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  generate: { bg: 'var(--accent-primary)', text: '#fff', border: 'var(--accent-primary)' },
  regenerate: { bg: 'var(--accent-primary)', text: '#fff', border: 'var(--accent-primary)' },
  save: { bg: '#16a34a', text: '#fff', border: '#16a34a' },
  export_copy: { bg: '#3b82f6', text: '#fff', border: '#3b82f6' },
  export_print: { bg: '#3b82f6', text: '#fff', border: '#3b82f6' },
  export_pdf: { bg: '#3b82f6', text: '#fff', border: '#3b82f6' },
  export_docx: { bg: '#3b82f6', text: '#fff', border: '#3b82f6' },
  login: { bg: '#6b7280', text: '#fff', border: '#6b7280' },
  customize: { bg: 'var(--accent-hover)', text: '#fff', border: 'var(--accent-hover)' },
  proofread: { bg: '#f59e0b', text: '#fff', border: '#f59e0b' },
};

function formatActionLabel(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${mm}/${dd}/${yyyy} ${hours}:${minutes} ${ampm}`;
}

function formatStoryType(st: string): string {
  if (st === 'diagnostic_only') return 'Diagnostic Only';
  if (st === 'repair_complete') return 'Repair Complete';
  return st.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ActivityDetailModalProps {
  activity: ActivityEntry | null;
  onClose: () => void;
}

export default function ActivityDetailModal({ activity, onClose }: ActivityDetailModalProps) {
  const [showRawData, setShowRawData] = useState(false);

  if (!activity) return null;

  const meta = activity.metadata || {};
  const vehicleYear = meta.vehicle_year as string | null;
  const vehicleMake = meta.vehicle_make as string | null;
  const vehicleModel = meta.vehicle_model as string | null;
  const roNumber = meta.ro_number as string | null;
  const storyType = (meta.story_type as string | null) || activity.story_type;
  const narrativePreview = meta.narrative_preview as string | null;
  const hasVehicleInfo = vehicleYear || vehicleMake || vehicleModel;

  const badgeColors = ACTION_BADGE_COLORS[activity.action_type] || {
    bg: 'var(--accent-30)',
    text: 'var(--accent-bright)',
    border: 'var(--accent-30)',
  };

  // Build raw data object for collapsible section
  const rawData: Record<string, unknown> = {};
  if (activity.metadata && Object.keys(activity.metadata).length > 0) rawData.metadata = activity.metadata;
  if (activity.input_data && Object.keys(activity.input_data).length > 0) rawData.input_data = activity.input_data;
  rawData.user_id = activity.user_id;
  rawData.action_type = activity.action_type;
  rawData.story_type = activity.story_type;
  rawData.output_preview = activity.output_preview;
  rawData.created_at = activity.created_at;
  const hasRawData = Object.keys(rawData).length > 0;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[4px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 pt-20 pb-4 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-[90vw] max-w-[600px] pointer-events-auto bg-[var(--bg-modal)] border-2 border-[var(--modal-border)] rounded-[23px] backdrop-blur-xl shadow-[var(--shadow-glow-lg)]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="p-6 md:p-8 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-[23px]">
            {/* Header: Action badge + Timestamp + Close button */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="inline-block px-3 py-1.5 rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${badgeColors.bg} 20%, transparent)`,
                    color: badgeColors.text === '#fff' ? badgeColors.bg : badgeColors.text,
                    border: `1.5px solid ${badgeColors.border}`,
                  }}
                >
                  {formatActionLabel(activity.action_type)}
                </span>
                <span className="text-sm text-[var(--text-muted)]">
                  {formatTimestamp(activity.created_at)}
                </span>
              </div>
              <button
                onClick={onClose}
                className="ml-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer p-1 flex-shrink-0"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Info */}
            <div className="mb-4 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent-10)]">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">User</p>
              <p className="text-[var(--text-primary)] font-medium">{activity.user_name}</p>
              <p className="text-sm text-[var(--text-muted)]">{activity.user_email}</p>
            </div>

            {/* Vehicle Info */}
            {hasVehicleInfo && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent-10)]">
                <div className="flex items-center gap-2 mb-1">
                  <Car size={14} className="text-[var(--text-muted)]" />
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Vehicle</p>
                </div>
                <p className="text-[var(--text-primary)] font-medium">
                  {[vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(' ')}
                </p>
              </div>
            )}

            {/* RO Number */}
            {roNumber && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent-10)]">
                <div className="flex items-center gap-2 mb-1">
                  <Clipboard size={14} className="text-[var(--text-muted)]" />
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">R.O. #</p>
                </div>
                <p className="text-[var(--text-primary)] font-semibold text-lg">{roNumber}</p>
              </div>
            )}

            {/* Story Type */}
            {storyType && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent-10)]">
                <div className="flex items-center gap-2 mb-1">
                  <Wrench size={14} className="text-[var(--text-muted)]" />
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Story Type</p>
                </div>
                <span
                  className="inline-block px-2.5 py-1 rounded-full text-sm font-medium"
                  style={{
                    background: storyType === 'diagnostic_only'
                      ? 'rgba(59,130,246,0.15)'
                      : 'rgba(22,163,74,0.15)',
                    color: storyType === 'diagnostic_only' ? '#3b82f6' : '#16a34a',
                    border: `1px solid ${storyType === 'diagnostic_only' ? 'rgba(59,130,246,0.3)' : 'rgba(22,163,74,0.3)'}`,
                  }}
                >
                  {formatStoryType(storyType)}
                </span>
              </div>
            )}

            {/* Narrative Preview */}
            {narrativePreview && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent-10)]">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={14} className="text-[var(--text-muted)]" />
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Narrative</p>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--accent-10)]">
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                    {narrativePreview}
                  </p>
                </div>
              </div>
            )}

            {/* Input Data */}
            {activity.input_data && Object.keys(activity.input_data).length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent-10)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Input Data</p>
                <div className="space-y-1">
                  {Object.entries(activity.input_data).map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-sm">
                      <span className="text-[var(--text-muted)] font-medium min-w-[120px]">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}:
                      </span>
                      <span className="text-[var(--text-secondary)]">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value || '—')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collapsible Raw Data */}
            {hasRawData && (
              <div className="mt-2">
                <button
                  onClick={() => setShowRawData(!showRawData)}
                  className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                >
                  {showRawData ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {showRawData ? 'Hide Raw Data' : 'View Raw Data'}
                </button>
                <AnimatePresence>
                  {showRawData && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <pre className="mt-2 p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--accent-10)] text-xs text-[var(--text-secondary)] font-mono overflow-x-auto whitespace-pre-wrap max-h-[250px] overflow-y-auto">
                        {JSON.stringify(rawData, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
