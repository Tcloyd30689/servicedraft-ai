'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wrench, Plus, Pencil, Trash2, Save, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { SavedRepairTemplate } from '@/components/input/MyRepairsPanel';

interface SavedRepairsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EditableField {
  key: keyof SavedRepairTemplate;
  label: string;
}

const CORE_FIELDS: EditableField[] = [
  { key: 'codes_present', label: 'Codes Present' },
  { key: 'diagnostics_performed', label: 'Diagnostics Performed' },
  { key: 'root_cause', label: 'Root Cause / Failure' },
  { key: 'repair_performed', label: 'Repair Performed' },
  { key: 'repair_verification', label: 'Repair Verification' },
];

export default function SavedRepairsModal({ isOpen, onClose }: SavedRepairsModalProps) {
  const [templates, setTemplates] = useState<SavedRepairTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New template form state
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStoryType, setNewStoryType] = useState<'diagnostic' | 'repair'>('repair');
  const [newFields, setNewFields] = useState<Record<string, string>>({});
  const [isSavingNew, setIsSavingNew] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Expanded row state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/saved-repairs');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      toast.error('Failed to load saved repairs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setShowNewForm(false);
      setEditingId(null);
      setDeleteConfirmId(null);
      setExpandedId(null);
    }
  }, [isOpen, fetchTemplates]);

  // --- New Template ---
  const handleCreateNew = async () => {
    if (!newName.trim()) {
      toast.error('Template name is required');
      return;
    }
    setIsSavingNew(true);
    try {
      const body: Record<string, unknown> = {
        template_name: newName.trim(),
        story_type: newStoryType,
      };
      for (const f of CORE_FIELDS) {
        body[f.key] = newFields[f.key] || null;
      }

      const res = await fetch('/api/saved-repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create template');
      }

      toast.success('Template created');
      setShowNewForm(false);
      setNewName('');
      setNewFields({});
      setNewStoryType('repair');
      fetchTemplates();
    } catch {
      toast.error('Failed to create template');
    } finally {
      setIsSavingNew(false);
    }
  };

  // --- Edit Template ---
  const startEdit = (template: SavedRepairTemplate) => {
    setEditingId(template.id);
    setEditName(template.template_name);
    const values: Record<string, string> = {};
    for (const f of CORE_FIELDS) {
      values[f.key] = (template[f.key] as string) || '';
    }
    setEditFields(values);
    setDeleteConfirmId(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      toast.error('Template name is required');
      return;
    }
    setIsSavingEdit(true);
    try {
      const body: Record<string, unknown> = {
        template_name: editName.trim(),
      };
      for (const f of CORE_FIELDS) {
        body[f.key] = editFields[f.key] || null;
      }

      const res = await fetch(`/api/saved-repairs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }

      toast.success('Template updated');
      setEditingId(null);
      fetchTemplates();
    } catch {
      toast.error('Failed to update template');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // --- Delete Template ---
  const handleDelete = async (id: string) => {
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/saved-repairs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirmId(null);
      toast.success('Template deleted');
    } catch {
      toast.error('Failed to delete template');
    } finally {
      setIsDeletingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Saved Repairs">
      <div className="space-y-4">
        {/* New Template Button */}
        {!showNewForm && (
          <button
            onClick={() => { setShowNewForm(true); setEditingId(null); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold w-full justify-center transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--btn-text-on-accent)',
              border: '1px solid var(--accent-primary)',
            }}
          >
            <Plus size={16} />
            NEW REPAIR TEMPLATE
          </button>
        )}

        {/* New Template Form */}
        <AnimatePresence>
          {showNewForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                className="rounded-xl p-4 space-y-3 border"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--accent-vivid)',
                }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">New Repair Template</h3>
                  <button
                    onClick={() => setShowNewForm(false)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer p-1"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Template Name */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Template Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Brake Pad Replacement"
                    className="w-full px-3 py-2 text-sm font-data bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-hover)] transition-colors"
                  />
                </div>

                {/* Story Type */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Story Type *</label>
                  <div className="flex gap-2">
                    {(['diagnostic', 'repair'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setNewStoryType(type)}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        style={{
                          backgroundColor: newStoryType === type ? 'var(--accent-primary)' : 'var(--bg-input)',
                          color: newStoryType === type ? 'var(--btn-text-on-accent)' : 'var(--text-secondary)',
                          border: newStoryType === type ? '1px solid var(--accent-primary)' : '1px solid var(--accent-border)',
                        }}
                      >
                        {type === 'diagnostic' ? 'Diagnostic Only' : 'Repair Complete'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Core Fields */}
                {CORE_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{f.label}</label>
                    <textarea
                      spellCheck={true}
                      value={newFields[f.key] || ''}
                      onChange={(e) => setNewFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      rows={2}
                      placeholder={`Enter ${f.label.toLowerCase()}...`}
                      className="w-full px-3 py-2 text-sm font-data resize-none bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-hover)] transition-colors"
                    />
                  </div>
                ))}

                {/* Save / Cancel */}
                <div className="flex gap-2 pt-1">
                  <Button variant="secondary" size="medium" onClick={() => setShowNewForm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    size="medium"
                    disabled={!newName.trim() || isSavingNew}
                    onClick={handleCreateNew}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    {isSavingNew ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {isSavingNew ? 'Saving...' : 'Save Template'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Template List */}
        <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[var(--accent-bright)]" />
              <span className="ml-3 text-[var(--text-muted)] text-sm">Loading templates...</span>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-10">
              <Wrench size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
              <p className="text-sm text-[var(--text-muted)]">
                No saved repair templates yet. Click &ldquo;New Repair Template&rdquo; above to create one.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {templates.map((template) => {
                const isEditing = editingId === template.id;
                const isExpanded = expandedId === template.id;
                const isDeleting = isDeletingId === template.id;

                return (
                  <motion.div
                    key={template.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border backdrop-blur-sm"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: isEditing ? 'var(--accent-vivid)' : 'var(--card-border)',
                    }}
                  >
                    {/* Template Header Row */}
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Expand toggle */}
                          <button
                            onClick={() => toggleExpand(template.id)}
                            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm text-[var(--text-primary)] truncate">
                              {template.template_name}
                            </h3>
                            <span
                              className="inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full mt-1"
                              style={{
                                backgroundColor: template.story_type === 'repair'
                                  ? 'rgba(34, 197, 94, 0.15)'
                                  : 'rgba(234, 179, 8, 0.15)',
                                color: template.story_type === 'repair' ? '#22c55e' : '#eab308',
                                border: `1px solid ${template.story_type === 'repair' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                              }}
                            >
                              {template.story_type === 'repair' ? 'Repair Complete' : 'Diagnostic Only'}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {deleteConfirmId === template.id ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 shrink-0"
                          >
                            <span className="text-xs text-red-400">Delete?</span>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 text-xs rounded-md cursor-pointer transition-colors"
                              style={{ color: 'var(--text-secondary)', border: '1px solid var(--accent-border)' }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDelete(template.id)}
                              disabled={isDeleting}
                              className="px-2 py-1 text-xs rounded-md bg-red-600 text-white cursor-pointer hover:bg-red-500 transition-colors disabled:opacity-50"
                            >
                              {isDeleting ? 'Deleting...' : 'Confirm'}
                            </button>
                          </motion.div>
                        ) : (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => startEdit(template)}
                              className="p-1.5 rounded-md cursor-pointer transition-all duration-200 hover:shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                              style={{ color: 'var(--accent-vivid)', backgroundColor: 'var(--accent-8)' }}
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(template.id)}
                              className="p-1.5 rounded-md cursor-pointer transition-all duration-200 hover:shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                              style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' }}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Fields / Edit Form */}
                    <AnimatePresence>
                      {(isExpanded || isEditing) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-2 border-t border-[var(--accent-8)] pt-3">
                            {isEditing ? (
                              <>
                                {/* Edit Template Name */}
                                <div>
                                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Template Name</label>
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-3 py-2 text-sm font-data bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-hover)] transition-colors"
                                  />
                                </div>

                                {/* Edit Core Fields */}
                                {CORE_FIELDS.map((f) => (
                                  <div key={f.key}>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{f.label}</label>
                                    <textarea
                                      spellCheck={true}
                                      value={editFields[f.key] || ''}
                                      onChange={(e) => setEditFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                                      rows={2}
                                      className="w-full px-3 py-2 text-sm font-data resize-none bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-hover)] transition-colors"
                                    />
                                  </div>
                                ))}

                                {/* Save / Cancel Edit */}
                                <div className="flex gap-2 pt-1">
                                  <Button variant="secondary" size="small" onClick={() => setEditingId(null)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    size="small"
                                    disabled={!editName.trim() || isSavingEdit}
                                    onClick={() => handleSaveEdit(template.id)}
                                    className="flex items-center gap-1.5"
                                  >
                                    {isSavingEdit ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                    {isSavingEdit ? 'Saving...' : 'Save'}
                                  </Button>
                                </div>
                              </>
                            ) : (
                              /* Read-only expanded view */
                              <>
                                {CORE_FIELDS.map((f) => {
                                  const value = template[f.key] as string | null;
                                  return (
                                    <div key={f.key}>
                                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                                        {f.label}
                                      </span>
                                      <p className="text-sm font-data text-[var(--text-primary)] mt-0.5 leading-relaxed">
                                        {value || <span className="text-[var(--text-muted)] italic">Not set</span>}
                                      </p>
                                    </div>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </Modal>
  );
}
