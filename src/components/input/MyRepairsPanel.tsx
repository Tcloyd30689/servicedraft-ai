'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Wrench, FileText, Loader2, Trash2, Pencil, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import EditRepairModal from '@/components/input/EditRepairModal';

export interface SavedRepairTemplate {
  id: string;
  template_name: string;
  story_type: 'diagnostic' | 'repair';
  year: string | null;
  make: string | null;
  model: string | null;
  customer_concern: string | null;
  codes_present: string | null;
  codes_present_option: string | null;
  diagnostics_performed: string | null;
  diagnostics_option: string | null;
  root_cause: string | null;
  root_cause_option: string | null;
  repair_performed: string | null;
  repair_option: string | null;
  repair_verification: string | null;
  verification_option: string | null;
  recommended_action: string | null;
  recommended_option: string | null;
  created_at: string;
  updated_at: string;
}

interface MyRepairsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (template: SavedRepairTemplate) => void;
}

export default function MyRepairsPanel({ isOpen, onClose, onLoadTemplate }: MyRepairsPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [templates, setTemplates] = useState<SavedRepairTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<SavedRepairTemplate | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/saved-repairs');
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch saved repairs:', error);
      toast.error('Failed to load saved repairs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setSearchQuery('');
      setDeleteConfirmId(null);
    }
  }, [isOpen, fetchTemplates]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/saved-repairs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirmId(null);
      toast.success('Template deleted');
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleLoad = (template: SavedRepairTemplate) => {
    onLoadTemplate(template);
    onClose();
    toast.success(`Template loaded: ${template.template_name}`);
  };

  const handleEditSaved = () => {
    setEditingTemplate(null);
    fetchTemplates();
  };

  const filteredTemplates = templates.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const vehicleStr = [t.year, t.make, t.model].filter(Boolean).join(' ').toLowerCase();
    return (
      t.template_name.toLowerCase().includes(q) ||
      vehicleStr.includes(q)
    );
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[4px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Slide-out panel */}
          <motion.div
            className="fixed right-0 bottom-0 z-50 w-full max-w-lg
              bg-[var(--bg-modal)] border-l-2 border-[var(--modal-border)]
              backdrop-blur-xl shadow-[var(--shadow-glow-lg)]
              flex flex-col"
            style={{ top: '156px' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-[var(--accent-15)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Wrench size={20} className="text-[var(--accent-bright)]" />
                  My Repairs
                </h2>
                <button
                  onClick={onClose}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer p-1"
                  aria-label="Close panel"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by name or vehicle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 font-data text-sm
                    bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg
                    text-[var(--text-primary)] placeholder-[var(--text-muted)]
                    focus:outline-none focus:border-[var(--accent-hover)] focus:shadow-[0_0_0_3px_var(--accent-20)]
                    transition-all duration-200"
                />
              </div>
            </div>

            {/* Template list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={24} className="animate-spin text-[var(--accent-bright)]" />
                  <span className="ml-3 text-[var(--text-muted)]">Loading templates...</span>
                </div>
              ) : filteredTemplates.length === 0 && templates.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Wrench size={40} className="mx-auto mb-4 text-[var(--accent-30)]" />
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                    No saved repairs yet — fill out the input form and click
                    &ldquo;Save as Repair Template&rdquo; to create your first template!
                  </p>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[var(--text-muted)] text-sm">No templates match your search.</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredTemplates.map((template) => (
                    <motion.div
                      key={template.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      transition={{ duration: 0.25 }}
                      className="bg-[var(--bg-card)] border border-[var(--card-border)] rounded-xl p-4
                        backdrop-blur-sm hover:shadow-[var(--shadow-glow-sm)] transition-shadow duration-200"
                    >
                      {/* Template header */}
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-[var(--text-primary)] text-sm leading-tight">
                          {template.template_name}
                        </h3>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-2
                            ${template.story_type === 'repair'
                              ? 'bg-[var(--accent-15)] text-[var(--accent-bright)]'
                              : 'bg-blue-500/15 text-blue-400'
                            }`}
                        >
                          {template.story_type === 'repair' ? 'Repair Complete' : 'Diagnostic Only'}
                        </span>
                      </div>

                      {/* Vehicle info */}
                      <p className="text-xs text-[var(--text-muted)] mb-1">
                        {[template.year, template.make, template.model].filter(Boolean).join(' ') || 'Any Vehicle'}
                      </p>

                      {/* Concern preview */}
                      {template.customer_concern && (
                        <p className="text-xs text-[var(--text-muted)] italic truncate mb-3">
                          {template.customer_concern.substring(0, 50)}
                          {template.customer_concern.length > 50 ? '...' : ''}
                        </p>
                      )}

                      {/* Action buttons */}
                      {deleteConfirmId === template.id ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2"
                        >
                          <p className="text-xs text-red-400 flex-1">Delete &ldquo;{template.template_name}&rdquo;? This cannot be undone.</p>
                          <Button
                            size="small"
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(null)}
                            className="!py-1.5 !px-3 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="small"
                            onClick={() => handleDelete(template.id)}
                            className="!py-1.5 !px-3 text-xs !bg-red-600 hover:!bg-red-700"
                          >
                            Delete
                          </Button>
                        </motion.div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            size="small"
                            onClick={() => handleLoad(template)}
                            className="!py-1.5 !px-3 text-xs flex items-center gap-1.5"
                          >
                            <Download size={12} />
                            Load
                          </Button>
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => setEditingTemplate(template)}
                            className="!py-1.5 !px-3 text-xs flex items-center gap-1.5"
                          >
                            <Pencil size={12} />
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(template.id)}
                            className="!py-1.5 !px-3 text-xs flex items-center gap-1.5 !text-red-400 hover:!text-red-300"
                          >
                            <Trash2 size={12} />
                            Delete
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>

          {/* Edit modal */}
          {editingTemplate && (
            <EditRepairModal
              isOpen={true}
              onClose={() => setEditingTemplate(null)}
              template={editingTemplate}
              onSaved={handleEditSaved}
            />
          )}
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
