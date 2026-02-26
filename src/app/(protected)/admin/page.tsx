'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Users, BarChart3, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search, Mail, Lock, Unlock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import LiquidCard from '@/components/ui/LiquidCard';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';

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

interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  subscription_status: 'active' | 'trial' | 'expired' | 'bypass';
  is_restricted: boolean;
  role: 'user' | 'admin';
  created_at: string;
  narrative_count: number;
  last_active: string | null;
}

interface UserDetailData {
  profile: Record<string, unknown>;
  recent_activity: Array<Record<string, unknown>>;
  recent_narratives: Array<Record<string, unknown>>;
}

const SUB_BADGE: Record<string, { bg: string; text: string }> = {
  active: { bg: 'rgba(22,163,74,0.15)', text: '#16a34a' },
  trial: { bg: 'rgba(234,179,8,0.15)', text: '#eab308' },
  expired: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
  bypass: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
};

type UserSortColumn = 'name' | 'email' | 'position' | 'created_at' | 'subscription_status' | 'narrative_count' | 'last_active';

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

  // User management state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userSortCol, setUserSortCol] = useState<UserSortColumn>('created_at');
  const [userSortAsc, setUserSortAsc] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<Record<string, UserDetailData>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; email: string; step: number } | null>(null);
  const [restrictTarget, setRestrictTarget] = useState<{ id: string; name: string; restricted: boolean } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  // ─── User Management ─────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_users' }),
      });
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      } else {
        console.error('Failed to fetch users:', json.error);
      }
    } catch (err) {
      console.error('User fetch error:', err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchUserDetails = useCallback(async (userId: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_user_details', userId }),
      });
      const json = await res.json();
      if (json.success) {
        setUserDetails((prev) => ({ ...prev, [userId]: json.data }));
      }
    } catch (err) {
      console.error('User detail fetch error:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && profile?.role === 'admin' && users.length === 0 && !usersLoading) {
      fetchUsers();
    }
  }, [activeTab, profile, users.length, usersLoading, fetchUsers]);

  const handleExpandUser = (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);
    if (!userDetails[userId]) {
      fetchUserDetails(userId);
    }
  };

  const adminAction = async (action: string, params: Record<string, unknown>) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...params }),
    });
    return res.json();
  };

  const handlePasswordReset = async (email: string) => {
    setActionLoading(`reset-${email}`);
    try {
      const json = await adminAction('send_password_reset', { email });
      if (json.success) {
        toast.success(`Password reset sent to ${email}`);
      } else {
        toast.error(json.error || 'Failed to send reset');
      }
    } catch {
      toast.error('Failed to send reset');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestrict = async () => {
    if (!restrictTarget) return;
    setActionLoading(`restrict-${restrictTarget.id}`);
    try {
      const json = await adminAction('restrict_user', {
        userId: restrictTarget.id,
        restricted: !restrictTarget.restricted,
      });
      if (json.success) {
        toast.success(restrictTarget.restricted ? 'User unrestricted' : 'User restricted');
        setUsers((prev) =>
          prev.map((u) =>
            u.id === restrictTarget.id ? { ...u, is_restricted: !restrictTarget.restricted } : u,
          ),
        );
      } else {
        toast.error(json.error || 'Failed to update restriction');
      }
    } catch {
      toast.error('Failed to update restriction');
    } finally {
      setActionLoading(null);
      setRestrictTarget(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(`delete-${deleteTarget.id}`);
    try {
      const json = await adminAction('delete_user', { userId: deleteTarget.id });
      if (json.success) {
        toast.success('User deleted permanently');
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
        if (expandedUserId === deleteTarget.id) setExpandedUserId(null);
      } else {
        toast.error(json.error || 'Failed to delete user');
      }
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(null);
      setDeleteTarget(null);
    }
  };

  const handleSubscriptionChange = async (userId: string, status: string) => {
    setActionLoading(`sub-${userId}`);
    try {
      const json = await adminAction('change_subscription', { userId, status });
      if (json.success) {
        toast.success(`Subscription updated to ${status}`);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, subscription_status: status as AdminUser['subscription_status'] }
              : u,
          ),
        );
      } else {
        toast.error(json.error || 'Failed to update subscription');
      }
    } catch {
      toast.error('Failed to update subscription');
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered and sorted users
  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ').toLowerCase();
    return name.includes(q) || u.email.toLowerCase().includes(q);
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const dir = userSortAsc ? 1 : -1;
    switch (userSortCol) {
      case 'name': {
        const aName = [a.first_name, a.last_name].filter(Boolean).join(' ');
        const bName = [b.first_name, b.last_name].filter(Boolean).join(' ');
        return aName.localeCompare(bName) * dir;
      }
      case 'email':
        return a.email.localeCompare(b.email) * dir;
      case 'position':
        return (a.position || '').localeCompare(b.position || '') * dir;
      case 'created_at':
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      case 'subscription_status':
        return a.subscription_status.localeCompare(b.subscription_status) * dir;
      case 'narrative_count':
        return (a.narrative_count - b.narrative_count) * dir;
      case 'last_active': {
        const aTime = a.last_active ? new Date(a.last_active).getTime() : 0;
        const bTime = b.last_active ? new Date(b.last_active).getTime() : 0;
        return (aTime - bTime) * dir;
      }
      default:
        return 0;
    }
  });

  const toggleUserSort = (col: UserSortColumn) => {
    if (userSortCol === col) {
      setUserSortAsc(!userSortAsc);
    } else {
      setUserSortCol(col);
      setUserSortAsc(true);
    }
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
          <LiquidCard size="standard" className="!rounded-[16px]">
            {/* Search + Refresh */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent-hover)] transition-all"
                />
              </div>
              <Button variant="ghost" size="small" onClick={fetchUsers} disabled={usersLoading}>
                Refresh
              </Button>
            </div>

            {/* Results count */}
            <p className="text-xs text-[var(--text-muted)] mb-3">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
              {userSearch.trim() ? ' matching' : ' total'}
            </p>

            {/* Table */}
            {usersLoading ? (
              <div className="py-12">
                <LoadingSpinner size="medium" message="Loading users..." />
              </div>
            ) : sortedUsers.length === 0 ? (
              <p className="text-center text-[var(--text-muted)] py-12">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--text-muted)] text-xs uppercase tracking-wider border-b border-[var(--accent-15)]">
                      {([
                        ['name', 'Name'],
                        ['email', 'Email'],
                        ['position', 'Position'],
                        ['created_at', 'Signed Up'],
                        ['subscription_status', 'Status'],
                        ['narrative_count', 'Narratives'],
                        ['last_active', 'Last Active'],
                      ] as [UserSortColumn, string][]).map(([col, label]) => (
                        <th
                          key={col}
                          className="pb-3 pr-4 cursor-pointer hover:text-[var(--text-secondary)] transition-colors select-none"
                          onClick={() => toggleUserSort(col)}
                        >
                          <span className="inline-flex items-center gap-1">
                            {label}
                            {userSortCol === col && (
                              userSortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                            )}
                          </span>
                        </th>
                      ))}
                      <th className="pb-3 pr-4">Flags</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((user) => {
                      const userName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'No name';
                      const subBadge = SUB_BADGE[user.subscription_status] || SUB_BADGE.trial;
                      const details = userDetails[user.id];

                      return (
                        <AnimatePresence key={user.id}>
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-b border-[var(--accent-10)] hover:bg-[var(--accent-10)] transition-colors cursor-pointer"
                            onClick={() => handleExpandUser(user.id)}
                          >
                            <td className="py-3 pr-4 text-[var(--text-primary)] font-medium">{userName}</td>
                            <td className="py-3 pr-4 text-[var(--text-muted)]">{user.email}</td>
                            <td className="py-3 pr-4 text-[var(--text-muted)]">{user.position || '—'}</td>
                            <td className="py-3 pr-4 text-[var(--text-secondary)] whitespace-nowrap">
                              {formatDate(user.created_at)}
                            </td>
                            <td className="py-3 pr-4">
                              <span
                                className="inline-block px-2 py-0.5 rounded text-xs font-medium capitalize"
                                style={{ background: subBadge.bg, color: subBadge.text }}
                              >
                                {user.subscription_status}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-[var(--text-secondary)] text-center">
                              {user.narrative_count}
                            </td>
                            <td className="py-3 pr-4 text-[var(--text-muted)] whitespace-nowrap">
                              {user.last_active ? formatDate(user.last_active) : '—'}
                            </td>
                            <td className="py-3 pr-4">
                              {user.is_restricted && (
                                <span
                                  className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                                >
                                  RESTRICTED
                                </span>
                              )}
                            </td>
                            <td className="py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1.5">
                                {/* Password Reset */}
                                <button
                                  onClick={() => handlePasswordReset(user.email)}
                                  disabled={actionLoading === `reset-${user.email}`}
                                  className="p-1.5 rounded hover:bg-[var(--accent-15)] text-[var(--text-muted)] hover:text-[var(--accent-bright)] transition-all cursor-pointer disabled:opacity-50"
                                  title="Send password reset"
                                >
                                  <Mail size={14} />
                                </button>

                                {/* Toggle Restrict */}
                                <button
                                  onClick={() =>
                                    setRestrictTarget({
                                      id: user.id,
                                      name: userName,
                                      restricted: user.is_restricted,
                                    })
                                  }
                                  disabled={actionLoading === `restrict-${user.id}`}
                                  className="p-1.5 rounded hover:bg-[var(--accent-15)] text-[var(--text-muted)] hover:text-[var(--accent-bright)] transition-all cursor-pointer disabled:opacity-50"
                                  title={user.is_restricted ? 'Unrestrict user' : 'Restrict user'}
                                >
                                  {user.is_restricted ? <Unlock size={14} /> : <Lock size={14} />}
                                </button>

                                {/* Subscription Change */}
                                <select
                                  value={user.subscription_status}
                                  onChange={(e) => handleSubscriptionChange(user.id, e.target.value)}
                                  disabled={actionLoading === `sub-${user.id}`}
                                  className="px-1.5 py-1 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded text-xs text-[var(--text-secondary)] cursor-pointer focus:outline-none focus:border-[var(--accent-hover)] disabled:opacity-50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="active">Active</option>
                                  <option value="trial">Trial</option>
                                  <option value="expired">Expired</option>
                                  <option value="bypass">Bypass</option>
                                </select>

                                {/* Delete */}
                                <button
                                  onClick={() =>
                                    setDeleteTarget({
                                      id: user.id,
                                      name: userName,
                                      email: user.email,
                                      step: 1,
                                    })
                                  }
                                  disabled={actionLoading === `delete-${user.id}`}
                                  className="p-1.5 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-all cursor-pointer disabled:opacity-50"
                                  title="Delete user"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>

                          {/* Expanded detail row */}
                          {expandedUserId === user.id && (
                            <motion.tr
                              key={`${user.id}-detail`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <td colSpan={9} className="p-4 bg-[var(--bg-elevated)]">
                                {!details ? (
                                  <LoadingSpinner size="small" message="Loading details..." />
                                ) : (
                                  <div className="space-y-4">
                                    {/* Profile Info */}
                                    <div>
                                      <h4 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 font-semibold">
                                        Profile
                                      </h4>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        {([
                                          ['User ID', user.id],
                                          ['Username', (details.profile as Record<string, unknown>)?.username || '—'],
                                          ['Location', (details.profile as Record<string, unknown>)?.location || '—'],
                                          ['Role', user.role],
                                        ] as [string, string][]).map(([label, val]) => (
                                          <div key={label}>
                                            <p className="text-[var(--text-muted)] text-xs">{label}</p>
                                            <p className="text-[var(--text-secondary)] font-mono text-xs break-all">
                                              {val}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Accent divider */}
                                    <div className="h-px bg-[var(--accent-30)]" />

                                    {/* Recent Activity */}
                                    <div>
                                      <h4 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 font-semibold">
                                        Recent Activity (Last 5)
                                      </h4>
                                      {details.recent_activity.length === 0 ? (
                                        <p className="text-[var(--text-muted)] text-xs">No activity recorded.</p>
                                      ) : (
                                        <div className="space-y-1.5">
                                          {details.recent_activity.map((a, i) => (
                                            <div
                                              key={i}
                                              className="flex items-center gap-3 text-xs text-[var(--text-secondary)]"
                                            >
                                              <span className="text-[var(--text-muted)] whitespace-nowrap">
                                                {formatDate(a.created_at as string)}
                                              </span>
                                              <span className="inline-block px-2 py-0.5 rounded bg-[var(--accent-10)] text-[var(--accent-bright)] font-medium">
                                                {formatActionLabel(a.action_type as string)}
                                              </span>
                                              {typeof a.output_preview === 'string' && a.output_preview && (
                                                <span className="truncate max-w-[300px] text-[var(--text-muted)]">
                                                  {a.output_preview}
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Accent divider */}
                                    <div className="h-px bg-[var(--accent-30)]" />

                                    {/* Recent Narratives */}
                                    <div>
                                      <h4 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 font-semibold">
                                        Recent Narratives (Last 5)
                                      </h4>
                                      {details.recent_narratives.length === 0 ? (
                                        <p className="text-[var(--text-muted)] text-xs">No narratives saved.</p>
                                      ) : (
                                        <div className="space-y-1.5">
                                          {details.recent_narratives.map((n, i) => (
                                            <div key={i} className="text-xs text-[var(--text-secondary)]">
                                              <span className="text-[var(--text-muted)] mr-2">
                                                {formatDate(n.created_at as string)}
                                              </span>
                                              <span className="font-medium mr-2">
                                                {[n.vehicle_year, n.vehicle_make, n.vehicle_model]
                                                  .filter(Boolean)
                                                  .join(' ') || 'No vehicle'}
                                              </span>
                                              {typeof n.ro_number === 'string' && n.ro_number && (
                                                <span className="text-[var(--text-muted)] mr-2">
                                                  RO# {n.ro_number}
                                                </span>
                                              )}
                                              {typeof n.full_narrative === 'string' && n.full_narrative && (
                                                <span className="text-[var(--text-muted)] truncate inline-block max-w-[400px] align-bottom">
                                                  {n.full_narrative.substring(0, 100)}...
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
        {/* Restrict Confirmation Modal */}
        <Modal
          isOpen={!!restrictTarget}
          onClose={() => setRestrictTarget(null)}
          title={restrictTarget?.restricted ? 'Unrestrict User' : 'Restrict User'}
          width="max-w-[420px]"
        >
          <p className="text-[var(--text-secondary)] text-sm mb-5">
            {restrictTarget?.restricted
              ? `Unrestrict ${restrictTarget?.name}? They will be able to generate narratives again.`
              : `Restrict ${restrictTarget?.name}? They won't be able to generate narratives.`}
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" size="small" onClick={() => setRestrictTarget(null)}>
              Cancel
            </Button>
            <Button
              variant={restrictTarget?.restricted ? 'primary' : 'secondary'}
              size="small"
              onClick={handleRestrict}
              disabled={!!actionLoading}
            >
              {restrictTarget?.restricted ? 'Unrestrict' : 'Restrict'}
            </Button>
          </div>
        </Modal>

        {/* Delete Confirmation Modal — Two-Step */}
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete User"
          width="max-w-[460px]"
        >
          {deleteTarget?.step === 1 ? (
            <>
              <p className="text-[var(--text-secondary)] text-sm mb-2">
                Are you sure you want to delete this user? This cannot be undone.
              </p>
              <div className="bg-[var(--bg-input)] rounded-lg p-3 mb-5 text-sm">
                <p className="text-[var(--text-primary)] font-medium">{deleteTarget?.name}</p>
                <p className="text-[var(--text-muted)]">{deleteTarget?.email}</p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" size="small" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </Button>
                <button
                  onClick={() => setDeleteTarget((prev) => (prev ? { ...prev, step: 2 } : null))}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-red-400 text-sm font-medium mb-4">
                Final confirmation: This will permanently delete {deleteTarget?.name} (
                {deleteTarget?.email}) and all their data.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" size="small" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </Button>
                <button
                  onClick={handleDelete}
                  disabled={!!actionLoading}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  DELETE PERMANENTLY
                </button>
              </div>
            </>
          )}
        </Modal>
      </motion.div>
    </div>
  );
}
