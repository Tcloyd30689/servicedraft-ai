'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, Users, BarChart3, LayoutDashboard,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Search, Mail, Lock, Unlock, Trash2, TrendingUp,
  CreditCard, FileText, RefreshCw, Zap, Printer,
  CheckCircle, BookOpen, ShieldCheck, ArrowUp, ArrowDown,
  Database, Clock, Server,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import LiquidCard from '@/components/ui/LiquidCard';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';

// ─── Protected user — cannot be deleted or restricted ────────
const PROTECTED_EMAIL = 'hvcadip@gmail.com';

type TabKey = 'overview' | 'activity' | 'users' | 'analytics';

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

interface AnalyticsData {
  totalUsers: number;
  newUsersWeek: number;
  newUsersMonth: number;
  activeSubscriptions: number;
  totalNarratives: number;
  narrativesWeek: number;
  narrativesToday: number;
  totalGenerations: number;
  totalExports: number;
  totalProofreads: number;
  totalCustomizations: number;
  totalSavedTemplates: number;
  usageOverTime: Array<Record<string, string | number>>;
  actionTypes: string[];
  systemHealth: {
    dbRowCounts: { users: number; narratives: number; activity_log: number; saved_repairs: number };
    lastActivityTimestamp: string | null;
    appVersion: string;
  };
  activityByDay: Array<{ date: string; count: number }>;
  activityByType: Record<string, number>;
  dailyNarratives: Array<{ date: string; count: number }>;
  topUsers: Array<{ rank: number; name: string; position: string; count: number }>;
  storyTypes: Record<string, number>;
  subscriptionBreakdown: Record<string, number>;
}

const SUB_BADGE: Record<string, { bg: string; text: string }> = {
  active: { bg: 'rgba(22,163,74,0.15)', text: '#16a34a' },
  trial: { bg: 'rgba(234,179,8,0.15)', text: '#eab308' },
  expired: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
  bypass: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
};

type UserSortColumn = 'first_name' | 'last_name' | 'email' | 'position' | 'role' | 'created_at' | 'subscription_status' | 'narrative_count' | 'last_active';

// ─── Date formatting helpers ─────────────────────────────────
/** MM/DD/YYYY */
function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/** Returns { date: 'MM/DD/YYYY', time: 'H:MM AM/PM' } for stacked display */
function formatDateTimeStacked(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return { date: `${mm}/${dd}/${yyyy}`, time: `${hours}:${minutes} ${ampm}` };
}

/** Short readable format for activity log */
function formatDateReadable(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 };

export default function AdminPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Activity log state
  const [logs, setLogs] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(false);
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

  // Analytics / Overview state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Title spotlight state
  const titleRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveringTitle, setIsHoveringTitle] = useState(false);

  const handleTitleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!titleRef.current) return;
    const rect = titleRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'admin') {
      router.replace('/main-menu');
    }
  }, [authLoading, profile, router]);

  // ─── Activity Log ──────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

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
    if (activeTab === 'activity' && profile?.role === 'admin') {
      fetchLogs();
    }
  }, [activeTab, profile, fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [filterAction, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ').toLowerCase();
    return name.includes(q) || u.email.toLowerCase().includes(q);
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const dir = userSortAsc ? 1 : -1;
    switch (userSortCol) {
      case 'first_name':
        return (a.first_name || '').localeCompare(b.first_name || '') * dir;
      case 'last_name':
        return (a.last_name || '').localeCompare(b.last_name || '') * dir;
      case 'email':
        return a.email.localeCompare(b.email) * dir;
      case 'position':
        return (a.position || '').localeCompare(b.position || '') * dir;
      case 'role':
        return a.role.localeCompare(b.role) * dir;
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

  // ─── Analytics / Overview Data ──────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const rangeParam = analyticsRange === 'all' ? 'all' : analyticsRange;
      const res = await fetch(`/api/admin/analytics?range=${rangeParam}`);
      const json = await res.json();
      if (json.success) {
        setAnalyticsData(json.data);
        setLastUpdated(new Date());
        setSecondsAgo(0);
      } else {
        console.error('Failed to fetch analytics:', json.error);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsRange]);

  useEffect(() => {
    if ((activeTab === 'analytics' || activeTab === 'overview') && profile?.role === 'admin') {
      fetchAnalytics();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profile, analyticsRange]);

  useEffect(() => {
    if (activeTab !== 'analytics' && activeTab !== 'overview') return;
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, [activeTab, fetchAnalytics]);

  useEffect(() => {
    if ((activeTab !== 'analytics' && activeTab !== 'overview') || !lastUpdated) return;
    const ticker = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(ticker);
  }, [activeTab, lastUpdated]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" message="Loading..." />
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  // ─── Overview Tab Metric Cards ─────────────────────────────
  const overviewCards = analyticsData ? [
    { label: 'Total Users', value: analyticsData.totalUsers, icon: Users, color: 'var(--accent-bright)', sub: `+${analyticsData.newUsersWeek} this week` },
    { label: 'Active Subscriptions', value: analyticsData.activeSubscriptions, icon: CreditCard, color: '#3b82f6', sub: `${analyticsData.totalUsers > 0 ? Math.round((analyticsData.activeSubscriptions / analyticsData.totalUsers) * 100) : 0}% of users` },
    { label: 'Total Narratives', value: analyticsData.totalNarratives, icon: FileText, color: 'var(--accent-primary)', sub: `+${analyticsData.narrativesWeek} this week` },
    { label: 'Narratives Today', value: analyticsData.narrativesToday, icon: Activity, color: '#ef4444', sub: 'today' },
    { label: 'Total Generations', value: analyticsData.totalGenerations, icon: Zap, color: '#f59e0b', sub: 'generate + regenerate' },
    { label: 'Total Exports', value: analyticsData.totalExports, icon: Printer, color: '#3b82f6', sub: 'copy / print / pdf / docx' },
    { label: 'Total Proofreads', value: analyticsData.totalProofreads, icon: CheckCircle, color: '#16a34a', sub: 'all time' },
    { label: 'Saved Templates', value: analyticsData.totalSavedTemplates, icon: BookOpen, color: 'var(--accent-hover)', sub: 'My Repairs' },
  ] : [];

  // ─── Tab definitions ───────────────────────────────────────
  const tabs: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'activity', label: 'Activity Log', icon: Activity },
    { key: 'users', label: 'User Management', icon: Users },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="max-w-[90vw] mx-auto px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header — OWNER DASHBOARD with premium styling */}
        <div className="flex items-center justify-center mb-8">
          <div
            ref={titleRef}
            className="relative overflow-hidden rounded-[16px] px-10 py-5 cursor-default select-none"
            style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid var(--accent-20)',
            }}
            onMouseMove={handleTitleMouseMove}
            onMouseEnter={() => setIsHoveringTitle(true)}
            onMouseLeave={() => setIsHoveringTitle(false)}
          >
            {/* Spotlight overlay */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                opacity: isHoveringTitle ? 1 : 0,
                background: `radial-gradient(circle 150px at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.08), transparent)`,
                borderRadius: 'inherit',
              }}
            />
            {/* Title content */}
            <div className="relative z-10 flex items-center justify-center gap-4">
              <Shield
                size={44}
                style={{
                  color: 'var(--accent-bright)',
                  filter: 'drop-shadow(0 0 10px var(--accent-primary)) drop-shadow(0 0 20px var(--accent-primary))',
                }}
              />
              <h1
                className="text-5xl font-bold uppercase tracking-widest"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: '2px var(--accent-bright)',
                  textShadow: '0 0 10px var(--accent-primary), 0 0 20px var(--accent-primary), 0 0 40px var(--accent-primary), 0 0 80px var(--accent-primary)',
                }}
              >
                OWNER DASHBOARD
              </h1>
            </div>
          </div>
        </div>

        {/* Tab Navigation — centered, large styled buttons */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {tabs.map(({ key, label, icon: Icon }) => (
            <motion.button
              key={key}
              onClick={() => setActiveTab(key)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={springTransition}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-base font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === key
                  ? 'bg-[var(--accent-primary)] text-white border border-[var(--accent-primary)] shadow-[var(--shadow-glow-sm)]'
                  : 'bg-[var(--accent-10)] text-[var(--text-secondary)] border border-[var(--accent-border)] hover:bg-[var(--accent-20)] hover:text-[var(--accent-bright)]'
              }`}
            >
              <Icon size={20} />
              {label}
            </motion.button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            OVERVIEW TAB
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--text-muted)]">
                {lastUpdated
                  ? `Last updated: ${secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}`
                  : 'Loading...'}
              </p>
              <button
                onClick={fetchAnalytics}
                disabled={analyticsLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent-bright)] hover:bg-[var(--accent-10)] transition-all cursor-pointer disabled:opacity-50"
                title="Refresh metrics"
              >
                <RefreshCw size={16} className={analyticsLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {analyticsLoading && !analyticsData ? (
              <LiquidCard size="standard">
                <div className="py-12">
                  <LoadingSpinner size="medium" message="Loading overview metrics..." />
                </div>
              </LiquidCard>
            ) : analyticsData ? (
              <>
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {overviewCards.map(({ label, value, icon: Icon, color, sub }) => (
                    <LiquidCard key={label} size="compact" className="!rounded-[16px] relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-[var(--text-muted)] uppercase tracking-wider font-medium">{label}</p>
                          <Icon size={22} style={{ color, opacity: 0.6 }} />
                        </div>
                        <p className="text-4xl font-bold" style={{ color }}>{value.toLocaleString()}</p>
                        <p className="text-[var(--text-muted)] text-sm mt-1">{sub}</p>
                      </div>
                    </LiquidCard>
                  ))}
                </div>

                {/* Subscription Breakdown */}
                <LiquidCard size="standard" className="!rounded-[16px]">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Subscription Breakdown</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(analyticsData.subscriptionBreakdown).map(([status, count]) => {
                      const badge = SUB_BADGE[status] || SUB_BADGE.trial;
                      return (
                        <div key={status} className="flex items-center gap-3 p-4 rounded-lg bg-[var(--accent-5)]">
                          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: badge.text }} />
                          <div>
                            <p className="text-xl font-bold" style={{ color: badge.text }}>{count}</p>
                            <p className="text-sm text-[var(--text-muted)] capitalize">{status}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </LiquidCard>

                {/* Activity by Day (30 days) — LineChart */}
                <LiquidCard size="standard" className="!rounded-[16px]">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Activity Trend (Last 30 Days)</h3>
                  {analyticsData.activityByDay.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={analyticsData.activityByDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--accent-15)" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d: string) => {
                            const dt = new Date(d + 'T12:00:00');
                            return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                          stroke="var(--text-muted)"
                          tick={{ fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--accent-30)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontSize: 12,
                          }}
                          labelFormatter={(d) => {
                            const dt = new Date(String(d) + 'T12:00:00');
                            return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="var(--accent-primary)"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: 'var(--accent-bright)' }}
                          name="Actions"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-[var(--text-muted)] text-base text-center py-8">No activity data.</p>
                  )}
                </LiquidCard>

                {/* System Health Indicators */}
                <LiquidCard size="standard" className="!rounded-[16px]">
                  <div className="flex items-center gap-3 mb-4">
                    <Server size={20} style={{ color: 'var(--accent-bright)' }} />
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">System Health</h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {([
                      { label: 'Users', count: analyticsData.systemHealth.dbRowCounts.users, icon: Users },
                      { label: 'Narratives', count: analyticsData.systemHealth.dbRowCounts.narratives, icon: FileText },
                      { label: 'Activity Logs', count: analyticsData.systemHealth.dbRowCounts.activity_log, icon: Activity },
                      { label: 'Saved Repairs', count: analyticsData.systemHealth.dbRowCounts.saved_repairs, icon: BookOpen },
                    ]).map(({ label, count, icon: Icon }) => (
                      <div key={label} className="flex items-center gap-3 p-4 rounded-lg bg-[var(--accent-5)]">
                        <Database size={18} style={{ color: 'var(--accent-hover)', opacity: 0.7 }} />
                        <div>
                          <p className="text-xl font-bold text-[var(--text-primary)]">{count.toLocaleString()}</p>
                          <p className="text-sm text-[var(--text-muted)]">{label} rows</p>
                        </div>
                        <Icon size={16} className="ml-auto" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock size={15} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-[var(--text-muted)]">Last Activity:</span>
                      <span className="text-[var(--text-secondary)] font-medium">
                        {analyticsData.systemHealth.lastActivityTimestamp
                          ? formatDateReadable(analyticsData.systemHealth.lastActivityTimestamp)
                          : 'None'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Server size={15} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-[var(--text-muted)]">App Version:</span>
                      <span className="text-[var(--accent-bright)] font-mono font-medium">
                        {analyticsData.systemHealth.appVersion}
                      </span>
                    </div>
                  </div>
                </LiquidCard>
              </>
            ) : null}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            ACTIVITY LOG TAB
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'activity' && (
          <LiquidCard size="standard" className="!rounded-[16px]">
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent-hover)] transition-all"
                />
              </div>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] text-sm cursor-pointer focus:outline-none focus:border-[var(--accent-hover)] appearance-none transition-all"
              >
                {ACTION_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-secondary)] text-sm hover:border-[var(--accent-hover)] transition-all cursor-pointer whitespace-nowrap"
              >
                {sortAsc ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {sortAsc ? 'Oldest First' : 'Newest First'}
              </button>
            </div>

            <p className="text-sm text-[var(--text-muted)] mb-3">
              {totalCount} {totalCount === 1 ? 'entry' : 'entries'} found
            </p>

            {loading ? (
              <div className="py-12">
                <LoadingSpinner size="medium" message="Loading activity logs..." />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-center text-[var(--text-muted)] py-12 text-base">No activity logs found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[var(--text-muted)] text-sm uppercase tracking-wider border-b border-[var(--accent-15)]">
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
                          className="border-b border-[var(--accent-10)] hover:bg-[var(--accent-10)] transition-colors cursor-pointer text-sm"
                          onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                          style={{
                            borderLeft: `3px solid ${ACTION_BORDER_COLORS[log.action_type] || 'var(--accent-30)'}`,
                          }}
                        >
                          <td className="py-3 pr-4 text-[var(--text-secondary)] whitespace-nowrap">
                            {formatDateReadable(log.created_at)}
                          </td>
                          <td className="py-3 pr-4 text-[var(--text-primary)] font-medium">
                            {log.user_name}
                          </td>
                          <td className="py-3 pr-4 text-[var(--text-muted)]">
                            {log.user_email}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className="inline-block px-2.5 py-1 rounded-full text-sm font-medium"
                              style={{
                                background: `${ACTION_BORDER_COLORS[log.action_type] || 'var(--accent-30)'}20`,
                                color: ACTION_BORDER_COLORS[log.action_type] || 'var(--accent-bright)',
                                border: `1px solid ${ACTION_BORDER_COLORS[log.action_type] || 'var(--accent-30)'}40`,
                              }}
                            >
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
                                  <p className="text-[var(--text-muted)] text-sm uppercase mb-1">User ID</p>
                                  <p className="text-[var(--text-secondary)] font-mono text-sm break-all">{log.user_id}</p>
                                </div>
                                <div>
                                  <p className="text-[var(--text-muted)] text-sm uppercase mb-1">Timestamp</p>
                                  <p className="text-[var(--text-secondary)]">{new Date(log.created_at).toISOString()}</p>
                                </div>
                                {log.output_preview && (
                                  <div className="md:col-span-2">
                                    <p className="text-[var(--text-muted)] text-sm uppercase mb-1">Output Preview</p>
                                    <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{log.output_preview}</p>
                                  </div>
                                )}
                                {log.input_data && Object.keys(log.input_data).length > 0 && (
                                  <div className="md:col-span-2">
                                    <p className="text-[var(--text-muted)] text-sm uppercase mb-1">Input Data</p>
                                    <pre className="text-[var(--text-secondary)] text-sm bg-[var(--bg-input)] p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
                                      {JSON.stringify(log.input_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                  <div className="md:col-span-2">
                                    <p className="text-[var(--text-muted)] text-sm uppercase mb-1">Metadata</p>
                                    <pre className="text-[var(--text-secondary)] text-sm bg-[var(--bg-input)] p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-[var(--accent-15)]">
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft size={16} />
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
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </LiquidCard>
        )}

        {/* ═══════════════════════════════════════════════════════════
            USER MANAGEMENT TAB
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <LiquidCard size="standard" className="!rounded-[16px]">
            <div className="flex flex-col sm:flex-row gap-3 mb-5 items-center">
              <div className="relative w-full sm:w-[35%]">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent-hover)] transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">Sort by:</span>
                <select
                  value={userSortCol}
                  onChange={(e) => {
                    setUserSortCol(e.target.value as UserSortColumn);
                    setUserSortAsc(e.target.value === 'first_name' || e.target.value === 'last_name' || e.target.value === 'email');
                  }}
                  className="px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] text-sm cursor-pointer focus:outline-none focus:border-[var(--accent-hover)] appearance-none transition-all"
                >
                  <option value="first_name">First Name</option>
                  <option value="last_name">Last Name</option>
                  <option value="email">Email</option>
                  <option value="subscription_status">Subscription</option>
                  <option value="narrative_count">Narratives</option>
                  <option value="created_at">Sign Up Date</option>
                  <option value="last_active">Last Active</option>
                </select>
                <button
                  onClick={() => setUserSortAsc(!userSortAsc)}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-secondary)] text-sm hover:border-[var(--accent-hover)] transition-all cursor-pointer whitespace-nowrap"
                  title={userSortAsc ? 'Ascending' : 'Descending'}
                >
                  {userSortAsc ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  {userSortAsc ? 'A→Z' : 'Z→A'}
                </button>
              </div>
              <div className="ml-auto">
                <Button variant="ghost" size="small" onClick={fetchUsers} disabled={usersLoading}>
                  <RefreshCw size={16} className={usersLoading ? 'animate-spin' : ''} />
                  Refresh
                </Button>
              </div>
            </div>

            <p className="text-sm text-[var(--text-muted)] mb-3">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
              {userSearch.trim() ? ' matching' : ' total'}
            </p>

            {usersLoading ? (
              <div className="py-12">
                <LoadingSpinner size="medium" message="Loading users..." />
              </div>
            ) : sortedUsers.length === 0 ? (
              <p className="text-center text-[var(--text-muted)] py-12 text-base">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-center text-[var(--text-muted)] text-sm uppercase tracking-wider border-b border-[var(--accent-15)]">
                      {([
                        ['first_name', 'First Name'],
                        ['last_name', 'Last Name'],
                        ['email', 'Email'],
                        ['position', 'Position'],
                        ['role', 'Role'],
                        ['subscription_status', 'Subscription'],
                        ['narrative_count', 'Narratives'],
                        ['created_at', 'Sign Up'],
                        ['last_active', 'Last Activity'],
                      ] as [UserSortColumn, string][]).map(([col, label]) => (
                        <th
                          key={col}
                          className="pb-3 pr-3 text-center cursor-pointer hover:text-[var(--text-secondary)] transition-colors select-none whitespace-nowrap"
                          onClick={() => toggleUserSort(col)}
                        >
                          <span className="inline-flex items-center justify-center gap-1">
                            {label}
                            {userSortCol === col && (
                              userSortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                            )}
                          </span>
                        </th>
                      ))}
                      <th className="pb-3 text-center whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((user) => {
                      const userName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'No name';
                      const subBadge = SUB_BADGE[user.subscription_status] || SUB_BADGE.trial;
                      const details = userDetails[user.id];
                      const isProtected = user.email.toLowerCase() === PROTECTED_EMAIL;

                      return (
                        <AnimatePresence key={user.id}>
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-b border-[var(--accent-10)] hover:bg-[var(--accent-10)] transition-colors cursor-pointer text-sm"
                            onClick={() => handleExpandUser(user.id)}
                          >
                            <td className="py-3 pr-3 text-[var(--text-primary)] font-medium whitespace-nowrap">
                              {user.first_name || '—'}
                            </td>
                            <td className="py-3 pr-3 text-[var(--text-primary)] font-medium whitespace-nowrap">
                              {user.last_name || '—'}
                            </td>
                            <td className="py-3 pr-3 text-[var(--text-muted)] whitespace-nowrap">{user.email}</td>
                            <td className="py-3 pr-3 text-[var(--text-muted)] whitespace-nowrap">{user.position || '—'}</td>
                            <td className="py-3 pr-3 text-[var(--text-muted)] whitespace-nowrap capitalize">{user.role}</td>
                            <td className="py-3 pr-3 whitespace-nowrap">
                              <span
                                className="inline-block px-2.5 py-0.5 rounded text-sm font-medium capitalize"
                                style={{ background: subBadge.bg, color: subBadge.text }}
                              >
                                {user.subscription_status}
                              </span>
                            </td>
                            <td className="py-3 pr-3 text-[var(--text-secondary)] text-center whitespace-nowrap">
                              {user.narrative_count}
                            </td>
                            <td className="py-3 pr-3 text-[var(--text-secondary)] whitespace-nowrap">
                              {formatDateShort(user.created_at)}
                            </td>
                            <td className="py-3 pr-3 whitespace-nowrap">
                              {user.last_active ? (() => {
                                const { date, time } = formatDateTimeStacked(user.last_active);
                                return (
                                  <div className="flex flex-col">
                                    <span className="text-[var(--text-secondary)]">{date}</span>
                                    <span className="text-[var(--text-muted)] text-xs">{time}</span>
                                  </div>
                                );
                              })() : '—'}
                            </td>
                            <td className="py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-2">
                                {isProtected ? (
                                  /* Protected user — show badge instead of destructive actions */
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium bg-[var(--accent-20)] text-[var(--accent-bright)]">
                                    <ShieldCheck size={14} />
                                    Protected
                                  </span>
                                ) : (
                                  <>
                                    {/* Password Reset */}
                                    <button
                                      onClick={() => handlePasswordReset(user.email)}
                                      disabled={actionLoading === `reset-${user.email}`}
                                      className="p-2.5 rounded-lg hover:bg-[var(--accent-15)] text-[var(--text-muted)] hover:text-[var(--accent-bright)] transition-all cursor-pointer disabled:opacity-50"
                                      title="Send password reset"
                                    >
                                      <Mail size={20} />
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
                                      className="p-2.5 rounded-lg hover:bg-[var(--accent-15)] text-[var(--text-muted)] hover:text-[var(--accent-bright)] transition-all cursor-pointer disabled:opacity-50"
                                      title={user.is_restricted ? 'Unrestrict user' : 'Restrict user'}
                                    >
                                      {user.is_restricted ? <Unlock size={20} /> : <Lock size={20} />}
                                    </button>

                                    {/* Subscription Change */}
                                    <select
                                      value={user.subscription_status}
                                      onChange={(e) => handleSubscriptionChange(user.id, e.target.value)}
                                      disabled={actionLoading === `sub-${user.id}`}
                                      className="px-2 py-1.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-sm text-[var(--text-secondary)] cursor-pointer focus:outline-none focus:border-[var(--accent-hover)] disabled:opacity-50"
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
                                      className="p-2.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-all cursor-pointer disabled:opacity-50"
                                      title="Delete user"
                                    >
                                      <Trash2 size={20} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </motion.tr>

                          {expandedUserId === user.id && (
                            <motion.tr
                              key={`${user.id}-detail`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <td colSpan={10} className="p-4 bg-[var(--bg-elevated)]">
                                {!details ? (
                                  <LoadingSpinner size="small" message="Loading details..." />
                                ) : (
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="text-sm uppercase tracking-wider text-[var(--text-muted)] mb-2 font-semibold">
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
                                            <p className="text-[var(--text-muted)] text-sm">{label}</p>
                                            <p className="text-[var(--text-secondary)] font-mono text-sm break-all">
                                              {val}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="h-px bg-[var(--accent-30)]" />

                                    <div>
                                      <h4 className="text-sm uppercase tracking-wider text-[var(--text-muted)] mb-2 font-semibold">
                                        Recent Activity (Last 5)
                                      </h4>
                                      {details.recent_activity.length === 0 ? (
                                        <p className="text-[var(--text-muted)] text-sm">No activity recorded.</p>
                                      ) : (
                                        <div className="space-y-1.5">
                                          {details.recent_activity.map((a, i) => (
                                            <div
                                              key={i}
                                              className="flex items-center gap-3 text-sm text-[var(--text-secondary)]"
                                            >
                                              <span className="text-[var(--text-muted)] whitespace-nowrap">
                                                {formatDateReadable(a.created_at as string)}
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

                                    <div className="h-px bg-[var(--accent-30)]" />

                                    <div>
                                      <h4 className="text-sm uppercase tracking-wider text-[var(--text-muted)] mb-2 font-semibold">
                                        Recent Narratives (Last 5)
                                      </h4>
                                      {details.recent_narratives.length === 0 ? (
                                        <p className="text-[var(--text-muted)] text-sm">No narratives saved.</p>
                                      ) : (
                                        <div className="space-y-1.5">
                                          {details.recent_narratives.map((n, i) => (
                                            <div key={i} className="text-sm text-[var(--text-secondary)]">
                                              <span className="text-[var(--text-muted)] mr-2">
                                                {formatDateReadable(n.created_at as string)}
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

        {/* ═══════════════════════════════════════════════════════════
            ANALYTICS TAB
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Header with time range selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-sm text-[var(--text-muted)]">
                {lastUpdated
                  ? `Last updated: ${secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}`
                  : 'Loading...'}
              </p>
              <div className="flex items-center gap-2">
                {([
                  { value: '7' as const, label: 'Last 7 Days' },
                  { value: '30' as const, label: 'Last 30 Days' },
                  { value: '90' as const, label: 'Last 90 Days' },
                  { value: 'all' as const, label: 'All Time' },
                ]).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setAnalyticsRange(value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      analyticsRange === value
                        ? 'bg-[var(--accent-20)] text-[var(--accent-bright)] border border-[var(--accent-50)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--accent-10)] border border-transparent'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={fetchAnalytics}
                  disabled={analyticsLoading}
                  className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-bright)] hover:bg-[var(--accent-10)] transition-all cursor-pointer disabled:opacity-50"
                  title="Refresh analytics"
                >
                  <RefreshCw size={18} className={analyticsLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {analyticsLoading && !analyticsData ? (
              <LiquidCard size="standard">
                <div className="py-12">
                  <LoadingSpinner size="medium" message="Loading analytics..." />
                </div>
              </LiquidCard>
            ) : analyticsData ? (
              <>
                {/* Activity Trend — LineChart */}
                <LiquidCard size="standard" className="!rounded-[16px]">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                    Activity Trend ({analyticsRange === 'all' ? 'All Time' : `Last ${analyticsRange} Days`})
                  </h3>
                  {analyticsData.activityByDay.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={analyticsData.activityByDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--accent-15)" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d: string) => {
                            const dt = new Date(d + 'T12:00:00');
                            return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                          stroke="var(--text-muted)"
                          tick={{ fontSize: 11 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--accent-30)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontSize: 13,
                          }}
                          labelFormatter={(d) => {
                            const dt = new Date(String(d) + 'T12:00:00');
                            return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="var(--accent-primary)"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5, fill: 'var(--accent-bright)' }}
                          name="Actions"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-[var(--text-muted)] text-base text-center py-8">No activity data for this period.</p>
                  )}
                </LiquidCard>

                {/* Two-Column: Feature Usage BarChart + Story Type PieChart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Feature Usage — horizontal BarChart */}
                  <LiquidCard size="standard" className="!rounded-[16px]">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Feature Usage (All Time)</h3>
                    {Object.keys(analyticsData.activityByType).length === 0 ? (
                      <p className="text-[var(--text-muted)] text-base text-center py-8">No activity recorded.</p>
                    ) : (() => {
                      const barData = Object.entries(analyticsData.activityByType)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, count]) => ({
                          name: type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                          count,
                          fill: ACTION_BORDER_COLORS[type] || 'var(--accent-30)',
                        }));
                      return (
                        <ResponsiveContainer width="100%" height={Math.max(barData.length * 40, 200)}>
                          <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--accent-15)" horizontal={false} />
                            <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={110}
                              stroke="var(--text-muted)"
                              tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                              contentStyle={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--accent-30)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: 13,
                              }}
                            />
                            <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                              {barData.map((entry, idx) => (
                                <Cell key={idx} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </LiquidCard>

                  {/* Story Type Distribution — PieChart */}
                  <LiquidCard size="standard" className="!rounded-[16px]">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Story Type Distribution</h3>
                    {(() => {
                      const diag = analyticsData.storyTypes.diagnostic_only || 0;
                      const repair = analyticsData.storyTypes.repair_complete || 0;
                      const total = diag + repair;
                      if (total === 0) {
                        return <p className="text-[var(--text-muted)] text-base text-center py-8">No narratives generated yet.</p>;
                      }
                      const pieData = [
                        { name: 'Diagnostic Only', value: diag, fill: 'var(--accent-primary)' },
                        { name: 'Repair Complete', value: repair, fill: '#16a34a' },
                      ];
                      return (
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={3}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {pieData.map((entry, idx) => (
                                <Cell key={idx} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--accent-30)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: 13,
                              }}
                            />
                            <Legend
                              wrapperStyle={{ color: 'var(--text-secondary)', fontSize: 13 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </LiquidCard>
                </div>

                {/* Two-Column: Subscription PieChart + Usage Over Time AreaChart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Subscription Breakdown — PieChart */}
                  <LiquidCard size="standard" className="!rounded-[16px]">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Subscription Breakdown</h3>
                    {(() => {
                      const subColors: Record<string, string> = {
                        active: '#16a34a',
                        trial: '#eab308',
                        expired: '#ef4444',
                        bypass: '#3b82f6',
                      };
                      const subData = Object.entries(analyticsData.subscriptionBreakdown)
                        .filter(([, count]) => count > 0)
                        .map(([status, count]) => ({
                          name: status.charAt(0).toUpperCase() + status.slice(1),
                          value: count,
                          fill: subColors[status] || 'var(--accent-30)',
                        }));
                      if (subData.length === 0) {
                        return <p className="text-[var(--text-muted)] text-base text-center py-8">No subscription data.</p>;
                      }
                      return (
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={subData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={3}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                              labelLine={false}
                            >
                              {subData.map((entry, idx) => (
                                <Cell key={idx} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--accent-30)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: 13,
                              }}
                            />
                            <Legend
                              wrapperStyle={{ color: 'var(--text-secondary)', fontSize: 13 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </LiquidCard>

                  {/* Usage Over Time — stacked AreaChart */}
                  <LiquidCard size="standard" className="!rounded-[16px]">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                      Usage Over Time ({analyticsRange === 'all' ? 'All Time' : `Last ${analyticsRange} Days`})
                    </h3>
                    {analyticsData.usageOverTime && analyticsData.usageOverTime.length > 0 && analyticsData.actionTypes.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={analyticsData.usageOverTime} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--accent-15)" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(d: string) => {
                              const dt = new Date(d + 'T12:00:00');
                              return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            }}
                            stroke="var(--text-muted)"
                            tick={{ fontSize: 11 }}
                            interval="preserveStartEnd"
                          />
                          <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--accent-30)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                              fontSize: 13,
                            }}
                            labelFormatter={(d) => {
                              const dt = new Date(d + 'T12:00:00');
                              return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                            }}
                          />
                          {analyticsData.actionTypes.map((actionType, idx) => {
                            const stackColors = [
                              'var(--accent-primary)', '#3b82f6', '#16a34a', '#f59e0b',
                              '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899',
                              '#6b7280', '#d946ef', '#14b8a6',
                            ];
                            return (
                              <Area
                                key={actionType}
                                type="monotone"
                                dataKey={actionType}
                                stackId="usage"
                                fill={ACTION_BORDER_COLORS[actionType] || stackColors[idx % stackColors.length]}
                                stroke={ACTION_BORDER_COLORS[actionType] || stackColors[idx % stackColors.length]}
                                fillOpacity={0.5}
                                name={actionType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                              />
                            );
                          })}
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-[var(--text-muted)] text-base text-center py-8">No usage data for this period.</p>
                    )}
                  </LiquidCard>
                </div>

                {/* Top 10 Users Leaderboard */}
                <LiquidCard size="standard" className="!rounded-[16px]">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Top Users Leaderboard</h3>
                  {analyticsData.topUsers.length === 0 ? (
                    <p className="text-[var(--text-muted)] text-base text-center py-8">No data yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-[var(--text-muted)] text-sm uppercase tracking-wider border-b border-[var(--accent-15)]">
                            <th className="pb-3 pr-4 w-16">Rank</th>
                            <th className="pb-3 pr-4">Name</th>
                            <th className="pb-3 pr-4">Position</th>
                            <th className="pb-3 text-right">Narratives</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.topUsers.map((user) => {
                            const rankColors: Record<number, string> = { 1: '#fbbf24', 2: '#9ca3af', 3: '#cd7f32' };
                            const rankColor = rankColors[user.rank];
                            return (
                              <tr key={user.rank} className="border-b border-[var(--accent-10)]">
                                <td className="py-3 pr-4">
                                  <span
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                                    style={rankColor ? {
                                      background: `${rankColor}20`,
                                      color: rankColor,
                                      border: `1px solid ${rankColor}40`,
                                    } : { color: 'var(--text-muted)' }}
                                  >
                                    {user.rank}
                                  </span>
                                </td>
                                <td className="py-3 pr-4 text-[var(--text-primary)] font-medium text-base">{user.name}</td>
                                <td className="py-3 pr-4 text-[var(--text-muted)] text-sm">{user.position}</td>
                                <td className="py-3 text-right text-[var(--accent-bright)] font-mono font-semibold text-base">
                                  {user.count.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </LiquidCard>
              </>
            ) : null}
          </div>
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
