'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Users, BarChart3, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import LiquidCard from '@/components/ui/LiquidCard';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

type TabKey = 'activity' | 'users' | 'analytics';

const ACTION_FILTERS = [
  { value: 'all', label: 'All Actions' },
  { value: 'generate', label: 'Generate' },
  { value: 'regenerate', label: 'Regenerate' },
  { value: 'save', label: 'Save' },
  { value: 'export_copy', label: 'Export (Copy)' },
  { value: 'export_print', label: 'Export (Print)' },
  { value: 'export_pdf', label: 'Export (PDF)' },
  { value: 'export_docx', label: 'Export (DOCX)' },
  { value: 'login', label: 'Login' },
  { value: 'customize', label: 'Customize' },
  { value: 'proofread', label: 'Proofread' },
];

const ACTION_BORDER_COLORS: Record<string, string> = {
  generate: 'var(--accent-primary)',
  regenerate: 'var(--accent-primary)',
  save: '#16a34a',
  export_copy: '#3b82f6',
  export_print: '#3b82f6',
  export_pdf: '#3b82f6',
  export_docx: '#3b82f6',
  login: '#6b7280',
  customize: 'var(--accent-hover)',
  proofread: '#f59e0b',
};

interface ActivityRow {
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

const PAGE_SIZE = 25;

export default function AdminPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('activity');

  // Activity log state
  const [logs, setLogs] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(false);
  const [filterAction, setFilterAction] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'admin') {
      router.replace('/main-menu');
    }
  }, [authLoading, profile, router]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Build query — we use a service-role-powered RPC or direct join
      // Since RLS may block cross-user reads, we use the admin's own session
      // The admin should have a policy allowing full read on activity_log
      let query = supabase
        .from('activity_log')
        .select(`
          id,
          user_id,
          action_type,
          story_type,
          input_data,
          output_preview,
          metadata,
          created_at,
          users!activity_log_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `, { count: 'exact' });

      if (filterAction !== 'all') {
        query = query.eq('action_type', filterAction);
      }

      if (searchQuery.trim()) {
        // Search by user email or name — filter on the joined users table
        query = query.or(
          `users.email.ilike.%${searchQuery.trim()}%,users.first_name.ilike.%${searchQuery.trim()}%,users.last_name.ilike.%${searchQuery.trim()}%`
        );
      }

      query = query
        .order('created_at', { ascending: sortAsc })
        .range(from, to);

      const { data, count, error } = await query;

      if (error) {
        console.error('Failed to fetch activity logs:', error.message);
        setLogs([]);
        setTotalCount(0);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: ActivityRow[] = (data || []).map((row: any) => {
        const user = row.users;
        return {
          id: row.id,
          user_id: row.user_id,
          action_type: row.action_type,
          story_type: row.story_type,
          input_data: row.input_data,
          output_preview: row.output_preview,
          metadata: row.metadata || {},
          created_at: row.created_at,
          user_name: user
            ? [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown'
            : 'Unknown',
          user_email: user?.email || 'N/A',
        };
      });

      setLogs(mapped);
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error('Activity log fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, sortAsc, filterAction, searchQuery]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchLogs();
    }
  }, [profile, fetchLogs]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterAction, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatActionLabel = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Show loading while auth resolves
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" message="Loading..." />
      </div>
    );
  }

  // Non-admin guard (will redirect via useEffect)
  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Shield size={28} className="text-[var(--accent-primary)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Admin Dashboard</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {([
            { key: 'activity' as TabKey, label: 'Activity Log', icon: Activity },
            { key: 'users' as TabKey, label: 'User Management', icon: Users },
            { key: 'analytics' as TabKey, label: 'Analytics', icon: BarChart3 },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === key
                  ? 'bg-[var(--accent-20)] text-[var(--accent-bright)] border border-[var(--accent-50)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--accent-10)] border border-transparent'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'activity' && (
          <LiquidCard size="standard" className="!rounded-[16px]">
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent-hover)] transition-all"
                />
              </div>

              {/* Action filter */}
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] text-sm cursor-pointer focus:outline-none focus:border-[var(--accent-hover)] appearance-none transition-all"
              >
                {ACTION_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>

              {/* Sort toggle */}
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-secondary)] text-sm hover:border-[var(--accent-hover)] transition-all cursor-pointer whitespace-nowrap"
              >
                {sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {sortAsc ? 'Oldest First' : 'Newest First'}
              </button>
            </div>

            {/* Results count */}
            <p className="text-xs text-[var(--text-muted)] mb-3">
              {totalCount} {totalCount === 1 ? 'entry' : 'entries'} found
            </p>

            {/* Table */}
            {loading ? (
              <div className="py-12">
                <LoadingSpinner size="medium" message="Loading activity logs..." />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-center text-[var(--text-muted)] py-12">No activity logs found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--text-muted)] text-xs uppercase tracking-wider border-b border-[var(--accent-15)]">
                      <th className="pb-3 pr-4">Date/Time</th>
                      <th className="pb-3 pr-4">User</th>
                      <th className="pb-3 pr-4">Email</th>
                      <th className="pb-3 pr-4">Action</th>
                      <th className="pb-3 pr-4">Story Type</th>
                      <th className="pb-3">Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <AnimatePresence key={log.id}>
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b border-[var(--accent-10)] hover:bg-[var(--accent-10)] transition-colors cursor-pointer"
                          onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                          style={{
                            borderLeft: `3px solid ${ACTION_BORDER_COLORS[log.action_type] || 'var(--accent-30)'}`,
                          }}
                        >
                          <td className="py-3 pr-4 text-[var(--text-secondary)] whitespace-nowrap">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="py-3 pr-4 text-[var(--text-primary)] font-medium">
                            {log.user_name}
                          </td>
                          <td className="py-3 pr-4 text-[var(--text-muted)]">
                            {log.user_email}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-[var(--accent-10)] text-[var(--accent-bright)]">
                              {formatActionLabel(log.action_type)}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-[var(--text-muted)] capitalize">
                            {log.story_type?.replace(/_/g, ' ') || '—'}
                          </td>
                          <td className="py-3 text-[var(--text-muted)] max-w-[200px] truncate">
                            {log.output_preview || '—'}
                          </td>
                        </motion.tr>

                        {/* Expanded detail row */}
                        {expandedRow === log.id && (
                          <motion.tr
                            key={`${log.id}-detail`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <td colSpan={6} className="p-4 bg-[var(--bg-elevated)]">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-[var(--text-muted)] text-xs uppercase mb-1">User ID</p>
                                  <p className="text-[var(--text-secondary)] font-mono text-xs break-all">{log.user_id}</p>
                                </div>
                                <div>
                                  <p className="text-[var(--text-muted)] text-xs uppercase mb-1">Timestamp</p>
                                  <p className="text-[var(--text-secondary)]">{new Date(log.created_at).toISOString()}</p>
                                </div>
                                {log.output_preview && (
                                  <div className="md:col-span-2">
                                    <p className="text-[var(--text-muted)] text-xs uppercase mb-1">Output Preview</p>
                                    <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{log.output_preview}</p>
                                  </div>
                                )}
                                {log.input_data && Object.keys(log.input_data).length > 0 && (
                                  <div className="md:col-span-2">
                                    <p className="text-[var(--text-muted)] text-xs uppercase mb-1">Input Data</p>
                                    <pre className="text-[var(--text-secondary)] text-xs bg-[var(--bg-input)] p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
                                      {JSON.stringify(log.input_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                  <div className="md:col-span-2">
                                    <p className="text-[var(--text-muted)] text-xs uppercase mb-1">Metadata</p>
                                    <pre className="text-[var(--text-secondary)] text-xs bg-[var(--bg-input)] p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-[var(--accent-15)]">
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  Previous
                </Button>
                <span className="text-sm text-[var(--text-muted)]">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </LiquidCard>
        )}

        {activeTab === 'users' && (
          <LiquidCard size="standard">
            <div className="flex flex-col items-center justify-center py-16">
              <Users size={48} className="text-[var(--accent-30)] mb-4" />
              <p className="text-[var(--text-muted)] text-lg">User Management</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">Coming in next session</p>
            </div>
          </LiquidCard>
        )}

        {activeTab === 'analytics' && (
          <LiquidCard size="standard">
            <div className="flex flex-col items-center justify-center py-16">
              <BarChart3 size={48} className="text-[var(--accent-30)] mb-4" />
              <p className="text-[var(--text-muted)] text-lg">Analytics</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">Coming in next session</p>
            </div>
          </LiquidCard>
        )}
      </motion.div>
    </div>
  );
}
