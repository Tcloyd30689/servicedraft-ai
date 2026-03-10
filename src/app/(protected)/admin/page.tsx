'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, Users, BarChart3, LayoutDashboard, Settings,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Search, Mail, Lock, Unlock, Trash2, TrendingUp,
  CreditCard, FileText, RefreshCw, Zap, Printer,
  CheckCircle, BookOpen, ShieldCheck, ArrowUp, ArrowDown,
  Database, Clock, Server, Download, Copy, Key, Globe, Info,
  UserCog, UserCheck, UserX, Crown,
  AlertTriangle, DollarSign, Plus, Edit3, Eye, EyeOff, Shuffle,
  Users as UsersIcon,
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
import TokenCalculator from '@/components/admin/TokenCalculator';

// ─── Protected user — cannot be deleted or restricted ────────
const PROTECTED_EMAIL = 'hvcadip@gmail.com';

type TabKey = 'overview' | 'activity' | 'users' | 'analytics' | 'costs' | 'teams' | 'settings';

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
  role: 'user' | 'admin' | 'owner';
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

const ROLE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  owner: { bg: 'rgba(168,85,247,0.15)', text: '#a855f7', label: 'Owner' },
  admin: { bg: 'rgba(234,179,8,0.15)', text: '#eab308', label: 'Team Manager' },
  user: { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af', label: 'User' },
};

type UserSortColumn = 'first_name' | 'last_name' | 'email' | 'position' | 'role' | 'created_at' | 'subscription_status' | 'narrative_count' | 'last_active';

// ─── Date formatting helpers ─────────────────────────────────
function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

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

// ─── Tab transition variants ────────────────────────────────
const tabVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

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
  const [promoteTarget, setPromoteTarget] = useState<{ id: string; name: string; currentRole: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Analytics / Overview state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analyticsRange, setAnalyticsRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Settings state
  const [accessCode, setAccessCode] = useState<string>('');
  const [accessCodeLoading, setAccessCodeLoading] = useState(false);

  // Teams management state
  interface TeamData {
    id: string;
    name: string;
    access_code: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    member_count: number;
  }
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamData | null>(null);
  const [viewingTeamMembers, setViewingTeamMembers] = useState<{ id: string; name: string } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', access_code: '', description: '' });
  const [teamActionLoading, setTeamActionLoading] = useState(false);

  // Title spotlight state
  const titleRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveringTitle, setIsHoveringTitle] = useState(false);

  const handleTitleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!titleRef.current) return;
    const rect = titleRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  // Redirect non-owner users
  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'owner') {
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
        const { data: matchingUsers } = await supabase
          .from('users')
          .select('id')
          .or(`email.ilike.%${searchQuery.trim()}%,first_name.ilike.%${searchQuery.trim()}%,last_name.ilike.%${searchQuery.trim()}%`);

        if (matchingUsers && matchingUsers.length > 0) {
          const userIds = matchingUsers.map((u: { id: string }) => u.id);
          query = query.in('user_id', userIds);
        } else {
          // No matching users found — return empty results
          setLogs([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
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
    if (activeTab === 'activity' && profile?.role === 'owner') {
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
    if (activeTab === 'users' && profile?.role === 'owner' && users.length === 0 && !usersLoading) {
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

  const handlePromoteToggle = async () => {
    if (!promoteTarget) return;
    // Owner role cannot be changed
    if (promoteTarget.currentRole === 'owner') {
      toast.error('Cannot change owner role');
      setPromoteTarget(null);
      return;
    }
    const isPromoting = promoteTarget.currentRole === 'user';
    const action = isPromoting ? 'promote_to_admin' : 'demote_to_user';
    setActionLoading(`promote-${promoteTarget.id}`);
    try {
      const json = await adminAction(action, { userId: promoteTarget.id });
      if (json.success) {
        toast.success(isPromoting ? `${promoteTarget.name} promoted to Team Manager` : `${promoteTarget.name} demoted to User`);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === promoteTarget.id ? { ...u, role: isPromoting ? 'admin' : 'user' } : u,
          ),
        );
      } else {
        toast.error(json.error || 'Failed to change role');
      }
    } catch {
      toast.error('Failed to change role');
    } finally {
      setActionLoading(null);
      setPromoteTarget(null);
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

  // User count stats
  const totalUserCount = users.length;
  const activeUserCount = users.filter((u) => u.subscription_status === 'active' || u.subscription_status === 'bypass').length;
  const inactiveUserCount = users.filter((u) => u.subscription_status === 'expired' || u.subscription_status === 'trial').length;

  // ─── Analytics / Overview Data ──────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const rangeParam = analyticsRange === 'all' ? 'all' : analyticsRange;
      const res = await fetch(`/api/admin/analytics?range=${rangeParam}`);
      const json = await res.json();
      if (json.success) {
        setAnalyticsData(json.data);
        setLastUpdated(new Date());
        setSecondsAgo(0);
      } else {
        setAnalyticsError(json.error || 'Failed to load analytics');
        console.error('Failed to fetch analytics:', json.error);
      }
    } catch (err) {
      setAnalyticsError('Network error — could not reach the server');
      console.error('Analytics fetch error:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsRange]);

  useEffect(() => {
    if ((activeTab === 'analytics' || activeTab === 'overview') && profile?.role === 'owner') {
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

  // ─── Settings: Fetch Access Code ───────────────────────────
  const fetchAccessCode = useCallback(async () => {
    setAccessCodeLoading(true);
    try {
      const json = await adminAction('get_access_code', {});
      if (json.success) {
        setAccessCode(json.data.code);
      }
    } catch (err) {
      console.error('Access code fetch error:', err);
    } finally {
      setAccessCodeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'settings' && profile?.role === 'owner') {
      fetchAccessCode();
    }
  }, [activeTab, profile, fetchAccessCode]);

  const generateNewAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const seg1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const seg2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const newCode = `SDRAFT-${seg1}-${seg2}`;
    setAccessCode(newCode);
    toast.success('New code generated — update your Vercel env var ACCESS_CODE');
  };

  const copyAccessCode = () => {
    navigator.clipboard.writeText(accessCode);
    toast.success('Access code copied to clipboard');
  };

  // ─── CSV Export ────────────────────────────────────────────
  const exportAnalyticsCSV = () => {
    if (!analyticsData) return;

    const rows: string[][] = [];

    // Summary section
    rows.push(['ServiceDraft.AI — Analytics Report']);
    rows.push([`Generated: ${new Date().toLocaleString()}`]);
    rows.push([`Time Range: ${analyticsRange === 'all' ? 'All Time' : `Last ${analyticsRange} Days`}`]);
    rows.push([]);

    // Key Metrics
    rows.push(['KEY METRICS']);
    rows.push(['Metric', 'Value']);
    rows.push(['Total Users', String(analyticsData.totalUsers)]);
    rows.push(['New Users (7d)', String(analyticsData.newUsersWeek)]);
    rows.push(['Active Subscriptions', String(analyticsData.activeSubscriptions)]);
    rows.push(['Total Narratives', String(analyticsData.totalNarratives)]);
    rows.push(['Narratives This Week', String(analyticsData.narrativesWeek)]);
    rows.push(['Narratives Today', String(analyticsData.narrativesToday)]);
    rows.push(['Total Generations', String(analyticsData.totalGenerations)]);
    rows.push(['Total Exports', String(analyticsData.totalExports)]);
    rows.push(['Total Proofreads', String(analyticsData.totalProofreads)]);
    rows.push(['Total Customizations', String(analyticsData.totalCustomizations)]);
    rows.push(['Saved Templates', String(analyticsData.totalSavedTemplates)]);
    rows.push([]);

    // Subscription Breakdown
    rows.push(['SUBSCRIPTION BREAKDOWN']);
    rows.push(['Status', 'Count']);
    Object.entries(analyticsData.subscriptionBreakdown).forEach(([status, count]) => {
      rows.push([status, String(count)]);
    });
    rows.push([]);

    // Story Type Breakdown
    rows.push(['STORY TYPE BREAKDOWN']);
    rows.push(['Type', 'Count']);
    Object.entries(analyticsData.storyTypes).forEach(([type, count]) => {
      rows.push([type.replace(/_/g, ' '), String(count)]);
    });
    rows.push([]);

    // Activity by Type
    rows.push(['ACTIVITY BY TYPE']);
    rows.push(['Action', 'Count']);
    Object.entries(analyticsData.activityByType)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        rows.push([type.replace(/_/g, ' '), String(count)]);
      });
    rows.push([]);

    // Daily Activity
    rows.push(['DAILY ACTIVITY']);
    rows.push(['Date', 'Actions']);
    analyticsData.activityByDay.forEach(({ date, count }) => {
      rows.push([date, String(count)]);
    });
    rows.push([]);

    // Top Users
    rows.push(['TOP USERS']);
    rows.push(['Rank', 'Name', 'Position', 'Narratives']);
    analyticsData.topUsers.forEach((u) => {
      rows.push([String(u.rank), u.name, u.position, String(u.count)]);
    });

    // Build CSV string
    const csvContent = rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `servicedraft-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Analytics report exported');
  };

  // ─── Teams Management ──────────────────────────────────
  const fetchTeams = useCallback(async () => {
    setTeamsLoading(true);
    try {
      const res = await fetch('/api/teams');
      const json = await res.json();
      if (json.success) {
        setTeams(Array.isArray(json.data) ? json.data : json.data ? [json.data] : []);
      }
    } catch (err) {
      console.error('Teams fetch error:', err);
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'teams' && profile?.role === 'owner' && teams.length === 0 && !teamsLoading) {
      fetchTeams();
    }
  }, [activeTab, profile, teams.length, teamsLoading, fetchTeams]);

  const generateTeamAccessCode = (teamName: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const seg1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const seg2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const prefix = teamName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8) || 'TEAM';
    return `${prefix}-${seg1}-${seg2}`;
  };

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim() || !newTeam.access_code.trim()) {
      toast.error('Team name and access code are required');
      return;
    }
    setTeamActionLoading(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Team created successfully');
        setTeams((prev) => [{ ...json.data, member_count: 0 }, ...prev]);
        setNewTeam({ name: '', access_code: '', description: '' });
        setShowCreateTeam(false);
      } else {
        toast.error(json.error || 'Failed to create team');
      }
    } catch {
      toast.error('Failed to create team');
    } finally {
      setTeamActionLoading(false);
    }
  };

  const handleEditTeam = async () => {
    if (!editingTeam) return;
    setTeamActionLoading(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTeam.id,
          name: editingTeam.name,
          access_code: editingTeam.access_code,
          description: editingTeam.description,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Team updated successfully');
        setTeams((prev) =>
          prev.map((t) => (t.id === editingTeam.id ? { ...t, ...json.data } : t))
        );
        setEditingTeam(null);
      } else {
        toast.error(json.error || 'Failed to update team');
      }
    } catch {
      toast.error('Failed to update team');
    } finally {
      setTeamActionLoading(false);
    }
  };

  const handleToggleTeamActive = async (teamItem: TeamData) => {
    if (!teamItem.is_active) {
      // Re-activate: use PUT to set is_active back (we'll update name to trigger save)
      setTeamActionLoading(true);
      try {
        const res = await fetch('/api/teams', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: teamItem.id, name: teamItem.name }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success('Team reactivated');
          fetchTeams();
        } else {
          toast.error(json.error || 'Failed to reactivate team');
        }
      } catch {
        toast.error('Failed to reactivate team');
      } finally {
        setTeamActionLoading(false);
      }
      return;
    }
    // Deactivate
    setTeamActionLoading(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: teamItem.id }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Team deactivated');
        setTeams((prev) =>
          prev.map((t) => (t.id === teamItem.id ? { ...t, is_active: false } : t))
        );
      } else {
        toast.error(json.error || 'Failed to deactivate team');
      }
    } catch {
      toast.error('Failed to deactivate team');
    } finally {
      setTeamActionLoading(false);
    }
  };

  const fetchTeamMembers = useCallback(async (teamId: string) => {
    setTeamMembersLoading(true);
    try {
      const res = await fetch(`/api/teams/members?team_id=${teamId}`);
      const json = await res.json();
      if (json.success) {
        setTeamMembers(json.data || []);
      }
    } catch (err) {
      console.error('Team members fetch error:', err);
    } finally {
      setTeamMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewingTeamMembers) {
      fetchTeamMembers(viewingTeamMembers.id);
    }
  }, [viewingTeamMembers, fetchTeamMembers]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" message="Loading..." />
      </div>
    );
  }

  if (!profile || profile.role !== 'owner') {
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
    { key: 'costs', label: 'Cost Calculator', icon: DollarSign },
    { key: 'teams', label: 'Teams', icon: UsersIcon },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  // ─── Error State Component ─────────────────────────────────
  const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <LiquidCard size="standard" className="!rounded-[16px]">
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertTriangle size={40} style={{ color: '#ef4444', opacity: 0.7 }} />
        <p className="text-[var(--text-secondary)] text-base text-center">{message}</p>
        <Button variant="secondary" size="small" onClick={onRetry}>
          <RefreshCw size={16} className="mr-2" />
          Retry
        </Button>
      </div>
    </LiquidCard>
  );

  return (
    <div className="max-w-[90vw] mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header — OWNER DASHBOARD with premium styling */}
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <div
            ref={titleRef}
            className="relative overflow-hidden rounded-[16px] px-6 sm:px-10 py-4 sm:py-5 cursor-default select-none"
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
            <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-4">
              <Shield
                size={36}
                className="sm:hidden"
                style={{
                  color: 'var(--accent-bright)',
                  filter: 'drop-shadow(0 0 10px var(--accent-primary)) drop-shadow(0 0 20px var(--accent-primary))',
                }}
              />
              <Shield
                size={44}
                className="hidden sm:block"
                style={{
                  color: 'var(--accent-bright)',
                  filter: 'drop-shadow(0 0 10px var(--accent-primary)) drop-shadow(0 0 20px var(--accent-primary))',
                }}
              />
              <h1
                className="text-3xl sm:text-5xl font-bold uppercase tracking-widest"
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

        {/* Tab Navigation — centered, large styled buttons, responsive */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 flex-wrap">
          {tabs.map(({ key, label, icon: Icon }) => (
            <motion.button
              key={key}
              onClick={() => setActiveTab(key)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={springTransition}
              className={`flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === key
                  ? 'bg-[var(--accent-primary)] text-white border border-[var(--accent-primary)] shadow-[var(--shadow-glow-sm)]'
                  : 'bg-[var(--accent-10)] text-[var(--text-secondary)] border border-[var(--accent-border)] hover:bg-[var(--accent-20)] hover:text-[var(--accent-bright)]'
              }`}
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{label}</span>
            </motion.button>
          ))}
        </div>

        {/* Tab Content with AnimatePresence transitions */}
        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════════════════════════════════
              OVERVIEW TAB
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-6"
            >
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
              ) : analyticsError && !analyticsData ? (
                <ErrorState message={analyticsError} onRetry={fetchAnalytics} />
              ) : analyticsData ? (
                <>
                  {/* Metric Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {overviewCards.map(({ label, value, icon: Icon, color, sub }) => (
                      <LiquidCard key={label} size="compact" className="!rounded-[16px] relative overflow-hidden">
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs sm:text-sm text-[var(--text-muted)] uppercase tracking-wider font-medium">{label}</p>
                            <Icon size={22} style={{ color, opacity: 0.6 }} />
                          </div>
                          <p className="text-2xl sm:text-4xl font-bold" style={{ color }}>{value.toLocaleString()}</p>
                          <p className="text-[var(--text-muted)] text-xs sm:text-sm mt-1">{sub}</p>
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
                        <div key={label} className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-[var(--accent-5)]">
                          <Database size={18} style={{ color: 'var(--accent-hover)', opacity: 0.7 }} />
                          <div>
                            <p className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">{count.toLocaleString()}</p>
                            <p className="text-xs sm:text-sm text-[var(--text-muted)]">{label} rows</p>
                          </div>
                          <Icon size={16} className="ml-auto hidden sm:block" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
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
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              ACTIVITY LOG TAB
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
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
                          <th className="pb-3 pr-4 hidden md:table-cell">Email</th>
                          <th className="pb-3 pr-4">Action</th>
                          <th className="pb-3 pr-4 hidden lg:table-cell">Story Type</th>
                          <th className="pb-3 hidden lg:table-cell">Preview</th>
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
                              <td className="py-3 pr-4 text-[var(--text-muted)] hidden md:table-cell">
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
                              <td className="py-3 pr-4 text-[var(--text-muted)] capitalize hidden lg:table-cell">
                                {log.story_type?.replace(/_/g, ' ') || '—'}
                              </td>
                              <td className="py-3 text-[var(--text-muted)] max-w-[200px] truncate hidden lg:table-cell">
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
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              USER MANAGEMENT TAB
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {/* User Count Summary Cards */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                <LiquidCard size="compact" className="!rounded-[16px]">
                  <div className="flex items-center gap-3">
                    <Users size={24} style={{ color: 'var(--accent-bright)', opacity: 0.7 }} />
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">{totalUserCount}</p>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)]">Total Users</p>
                    </div>
                  </div>
                </LiquidCard>
                <LiquidCard size="compact" className="!rounded-[16px]">
                  <div className="flex items-center gap-3">
                    <UserCheck size={24} style={{ color: '#16a34a', opacity: 0.7 }} />
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#16a34a' }}>{activeUserCount}</p>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)]">Active</p>
                    </div>
                  </div>
                </LiquidCard>
                <LiquidCard size="compact" className="!rounded-[16px]">
                  <div className="flex items-center gap-3">
                    <UserX size={24} style={{ color: '#ef4444', opacity: 0.7 }} />
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#ef4444' }}>{inactiveUserCount}</p>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)]">Inactive</p>
                    </div>
                  </div>
                </LiquidCard>
              </div>

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
                      <option value="role">Role</option>
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
                              className={`pb-3 pr-3 text-center cursor-pointer hover:text-[var(--text-secondary)] transition-colors select-none whitespace-nowrap ${
                                col === 'email' || col === 'position' ? 'hidden md:table-cell' : ''
                              } ${col === 'last_active' ? 'hidden lg:table-cell' : ''}`}
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
                          const roleBadge = ROLE_BADGE[user.role] || ROLE_BADGE.user;
                          const details = userDetails[user.id];
                          const isProtected = user.email.toLowerCase() === PROTECTED_EMAIL || user.role === 'owner';

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
                                <td className="py-3 pr-3 text-[var(--text-muted)] whitespace-nowrap hidden md:table-cell">{user.email}</td>
                                <td className="py-3 pr-3 text-[var(--text-muted)] whitespace-nowrap hidden md:table-cell">{user.position || '—'}</td>
                                <td className="py-3 pr-3 whitespace-nowrap">
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium"
                                    style={{ background: roleBadge.bg, color: roleBadge.text }}
                                  >
                                    {user.role === 'owner' && <ShieldCheck size={12} />}
                                    {user.role === 'admin' && <Crown size={12} />}
                                    {roleBadge.label}
                                  </span>
                                </td>
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
                                <td className="py-3 pr-3 whitespace-nowrap hidden lg:table-cell">
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

                                        {/* Promote / Demote */}
                                        <button
                                          onClick={() =>
                                            setPromoteTarget({
                                              id: user.id,
                                              name: userName,
                                              currentRole: user.role,
                                            })
                                          }
                                          disabled={actionLoading === `promote-${user.id}`}
                                          className="p-2.5 rounded-lg hover:bg-[var(--accent-15)] text-[var(--text-muted)] hover:text-[var(--accent-bright)] transition-all cursor-pointer disabled:opacity-50"
                                          title={user.role === 'admin' ? 'Demote to User' : 'Promote to Team Manager'}
                                        >
                                          <UserCog size={20} />
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
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              ANALYTICS TAB
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* Header with time range selector + export button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-sm text-[var(--text-muted)]">
                  {lastUpdated
                    ? `Last updated: ${secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}`
                    : 'Loading...'}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {([
                    { value: '7' as const, label: '7d' },
                    { value: '30' as const, label: '30d' },
                    { value: '90' as const, label: '90d' },
                    { value: 'all' as const, label: 'All' },
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
                  <button
                    onClick={exportAnalyticsCSV}
                    disabled={!analyticsData}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--accent-10)] text-[var(--accent-bright)] border border-[var(--accent-border)] hover:bg-[var(--accent-20)] transition-all cursor-pointer disabled:opacity-50"
                    title="Export analytics as CSV"
                  >
                    <Download size={16} />
                    Export Report
                  </button>
                </div>
              </div>

              {analyticsLoading && !analyticsData ? (
                <LiquidCard size="standard">
                  <div className="py-12">
                    <LoadingSpinner size="medium" message="Loading analytics..." />
                  </div>
                </LiquidCard>
              ) : analyticsError && !analyticsData ? (
                <ErrorState message={analyticsError} onRetry={fetchAnalytics} />
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
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              SETTINGS TAB
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'costs' && (
            <motion.div
              key="costs"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <TokenCalculator />
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TEAMS TAB
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'teams' && (
            <motion.div
              key="teams"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* Header with Create button */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--text-muted)]">
                  {teams.length} {teams.length === 1 ? 'team' : 'teams'} total
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="small" onClick={fetchTeams} disabled={teamsLoading}>
                    <RefreshCw size={16} className={teamsLoading ? 'animate-spin' : ''} />
                    Refresh
                  </Button>
                  <Button variant="primary" size="small" onClick={() => setShowCreateTeam(true)}>
                    <Plus size={16} className="mr-1" />
                    New Team
                  </Button>
                </div>
              </div>

              {teamsLoading && teams.length === 0 ? (
                <LiquidCard size="standard">
                  <div className="py-12">
                    <LoadingSpinner size="medium" message="Loading teams..." />
                  </div>
                </LiquidCard>
              ) : teams.length === 0 ? (
                <LiquidCard size="standard" className="!rounded-[16px]">
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <UsersIcon size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                    <p className="text-[var(--text-secondary)] text-base text-center">No teams created yet.</p>
                    <p className="text-[var(--text-muted)] text-sm text-center">
                      Create a team to start organizing users.
                    </p>
                  </div>
                </LiquidCard>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {teams.map((t) => (
                    <LiquidCard key={t.id} size="standard" className="!rounded-[16px]">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{t.name}</h3>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                t.is_active
                                  ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
                              }`}
                            >
                              {t.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {t.description && (
                            <p className="text-[var(--text-muted)] text-sm mb-2">{t.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Access Code */}
                      <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-[var(--accent-5)]">
                        <Key size={16} style={{ color: 'var(--accent-hover)', opacity: 0.7 }} />
                        <span className="text-sm text-[var(--text-muted)]">Access Code:</span>
                        <span className="font-mono text-sm text-[var(--accent-bright)] tracking-wider select-all">
                          {t.access_code}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(t.access_code);
                            toast.success('Access code copied');
                          }}
                          className="ml-auto p-1.5 rounded hover:bg-[var(--accent-15)] text-[var(--text-muted)] hover:text-[var(--accent-bright)] transition-all cursor-pointer"
                          title="Copy access code"
                        >
                          <Copy size={14} />
                        </button>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Users size={16} style={{ color: 'var(--accent-bright)', opacity: 0.6 }} />
                          <span className="text-sm font-medium text-[var(--text-primary)]">{t.member_count}</span>
                          <span className="text-sm text-[var(--text-muted)]">members</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={16} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
                          <span className="text-xs text-[var(--text-muted)]">
                            Created {formatDateShort(t.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-3 border-t border-[var(--accent-15)]">
                        <button
                          onClick={() => setViewingTeamMembers({ id: t.id, name: t.name })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-10)] hover:text-[var(--accent-bright)] transition-all cursor-pointer"
                        >
                          <Eye size={15} />
                          Members
                        </button>
                        <button
                          onClick={() => setEditingTeam({ ...t })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-10)] hover:text-[var(--accent-bright)] transition-all cursor-pointer"
                        >
                          <Edit3 size={15} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleTeamActive(t)}
                          disabled={teamActionLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-10)] hover:text-[var(--accent-bright)] transition-all cursor-pointer disabled:opacity-50 ml-auto"
                        >
                          {t.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                          {t.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </LiquidCard>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* Access Code Management */}
              <LiquidCard size="standard" className="!rounded-[16px]">
                <div className="flex items-center gap-3 mb-4">
                  <Key size={22} style={{ color: 'var(--accent-bright)' }} />
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Access Code Management</h3>
                </div>

                <p className="text-sm text-[var(--text-muted)] mb-4">
                  The access code allows new users to bypass Stripe payment during the prototype phase.
                  Share this code with authorized beta testers.
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 px-4 py-3 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg font-mono text-lg text-[var(--accent-bright)] tracking-wider select-all">
                      {accessCodeLoading ? (
                        <span className="text-[var(--text-muted)] text-sm">Loading...</span>
                      ) : (
                        accessCode
                      )}
                    </div>
                    <button
                      onClick={copyAccessCode}
                      disabled={!accessCode}
                      className="p-3 rounded-lg bg-[var(--accent-10)] border border-[var(--accent-border)] text-[var(--accent-bright)] hover:bg-[var(--accent-20)] transition-all cursor-pointer disabled:opacity-50"
                      title="Copy to clipboard"
                    >
                      <Copy size={20} />
                    </button>
                  </div>
                  <Button
                    variant="secondary"
                    size="medium"
                    onClick={generateNewAccessCode}
                  >
                    Generate New Code
                  </Button>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--accent-5)] border border-[var(--accent-15)]">
                  <Info size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-hover)' }} />
                  <p className="text-sm text-[var(--text-muted)]">
                    After generating a new code, update the <code className="text-[var(--accent-bright)] font-mono">ACCESS_CODE</code> environment
                    variable in your Vercel project settings. The app reads this variable on every access code check.
                  </p>
                </div>
              </LiquidCard>

              {/* Quick Stats Summary */}
              <LiquidCard size="standard" className="!rounded-[16px]">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp size={22} style={{ color: 'var(--accent-bright)' }} />
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Quick Stats Summary</h3>
                </div>

                {analyticsData ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Users', value: analyticsData.totalUsers, icon: Users, color: 'var(--accent-bright)' },
                      { label: 'Active Subs', value: analyticsData.activeSubscriptions, icon: CreditCard, color: '#3b82f6' },
                      { label: 'Narratives', value: analyticsData.totalNarratives, icon: FileText, color: 'var(--accent-primary)' },
                      { label: 'Generations', value: analyticsData.totalGenerations, icon: Zap, color: '#f59e0b' },
                      { label: 'Exports', value: analyticsData.totalExports, icon: Printer, color: '#3b82f6' },
                      { label: 'Proofreads', value: analyticsData.totalProofreads, icon: CheckCircle, color: '#16a34a' },
                      { label: 'Customizations', value: analyticsData.totalCustomizations, icon: Settings, color: 'var(--accent-hover)' },
                      { label: 'Saved Templates', value: analyticsData.totalSavedTemplates, icon: BookOpen, color: '#f59e0b' },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--accent-5)]">
                        <Icon size={18} style={{ color, opacity: 0.7 }} />
                        <div>
                          <p className="text-xl font-bold" style={{ color }}>{value.toLocaleString()}</p>
                          <p className="text-xs text-[var(--text-muted)]">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8">
                    <LoadingSpinner size="small" message="Loading stats..." />
                  </div>
                )}
              </LiquidCard>

              {/* System Information */}
              <LiquidCard size="standard" className="!rounded-[16px]">
                <div className="flex items-center gap-3 mb-4">
                  <Server size={22} style={{ color: 'var(--accent-bright)' }} />
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">System Information</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-[var(--accent-5)]">
                    <div className="flex items-center gap-2 mb-2">
                      <Info size={16} style={{ color: 'var(--text-muted)' }} />
                      <p className="text-sm text-[var(--text-muted)] uppercase tracking-wider font-medium">Version</p>
                    </div>
                    <p className="text-lg font-mono text-[var(--accent-bright)] font-semibold">
                      {analyticsData?.systemHealth.appVersion || 'Loading...'}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[var(--accent-5)]">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe size={16} style={{ color: 'var(--text-muted)' }} />
                      <p className="text-sm text-[var(--text-muted)] uppercase tracking-wider font-medium">Environment</p>
                    </div>
                    <p className="text-lg font-mono text-[var(--accent-bright)] font-semibold">
                      {typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'Development' : 'Production'}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[var(--accent-5)]">
                    <div className="flex items-center gap-2 mb-2">
                      <Database size={16} style={{ color: 'var(--text-muted)' }} />
                      <p className="text-sm text-[var(--text-muted)] uppercase tracking-wider font-medium">Database</p>
                    </div>
                    <p className="text-lg font-mono text-[var(--accent-bright)] font-semibold">Supabase (PostgreSQL)</p>
                    {analyticsData && (
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        {(
                          analyticsData.systemHealth.dbRowCounts.users +
                          analyticsData.systemHealth.dbRowCounts.narratives +
                          analyticsData.systemHealth.dbRowCounts.activity_log +
                          analyticsData.systemHealth.dbRowCounts.saved_repairs
                        ).toLocaleString()} total rows
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-[var(--accent-5)]">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe size={16} style={{ color: 'var(--text-muted)' }} />
                      <p className="text-sm text-[var(--text-muted)] uppercase tracking-wider font-medium">Deployment</p>
                    </div>
                    <p className="text-lg font-mono text-[var(--accent-bright)] font-semibold">Vercel</p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Next.js App Router</p>
                  </div>
                </div>
              </LiquidCard>
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* Promote/Demote Confirmation Modal */}
        <Modal
          isOpen={!!promoteTarget}
          onClose={() => setPromoteTarget(null)}
          title={promoteTarget?.currentRole === 'admin' ? 'Demote to User' : 'Promote to Team Manager'}
          width="max-w-[460px]"
        >
          <div className="flex items-center gap-3 mb-4">
            <Crown
              size={28}
              style={{
                color: promoteTarget?.currentRole === 'admin' ? '#9ca3af' : '#eab308',
              }}
            />
            <p className="text-[var(--text-secondary)] text-sm">
              {promoteTarget?.currentRole === 'admin'
                ? `Demote ${promoteTarget?.name} from Team Manager to User? They will lose team management access.`
                : `Promote ${promoteTarget?.name} to Team Manager? They will be able to manage their assigned team.`}
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" size="small" onClick={() => setPromoteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handlePromoteToggle}
              disabled={!!actionLoading}
            >
              {promoteTarget?.currentRole === 'admin' ? 'Demote to User' : 'Promote to Team Manager'}
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

        {/* Create Team Modal */}
        <Modal
          isOpen={showCreateTeam}
          onClose={() => setShowCreateTeam(false)}
          title="Create New Team"
          width="max-w-[520px]"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1.5">Team Name *</label>
              <input
                type="text"
                value={newTeam.name}
                onChange={(e) => setNewTeam((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Downtown Service Center"
                className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent-hover)] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1.5">Access Code *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTeam.access_code}
                  onChange={(e) => setNewTeam((prev) => ({ ...prev, access_code: e.target.value }))}
                  placeholder="e.g. DOWNTOWN-A1B2-C3D4"
                  className="flex-1 px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm font-mono focus:outline-none focus:border-[var(--accent-hover)] transition-all"
                />
                <button
                  onClick={() =>
                    setNewTeam((prev) => ({
                      ...prev,
                      access_code: generateTeamAccessCode(prev.name),
                    }))
                  }
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[var(--accent-10)] border border-[var(--accent-border)] text-[var(--accent-bright)] hover:bg-[var(--accent-20)] transition-all cursor-pointer text-sm whitespace-nowrap"
                  title="Generate random code"
                >
                  <Shuffle size={16} />
                  Generate
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Users will enter this code during signup to join this team.
              </p>
            </div>

            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1.5">Description</label>
              <textarea
                value={newTeam.description}
                onChange={(e) => setNewTeam((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of the team..."
                rows={3}
                className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent-hover)] transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" size="small" onClick={() => setShowCreateTeam(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={handleCreateTeam}
                disabled={teamActionLoading || !newTeam.name.trim() || !newTeam.access_code.trim()}
              >
                {teamActionLoading ? 'Creating...' : 'Create Team'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Team Modal */}
        <Modal
          isOpen={!!editingTeam}
          onClose={() => setEditingTeam(null)}
          title="Edit Team"
          width="max-w-[520px]"
        >
          {editingTeam && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1.5">Team Name</label>
                <input
                  type="text"
                  value={editingTeam.name}
                  onChange={(e) =>
                    setEditingTeam((prev) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                  className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-hover)] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1.5">Access Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingTeam.access_code}
                    onChange={(e) =>
                      setEditingTeam((prev) => (prev ? { ...prev, access_code: e.target.value } : null))
                    }
                    className="flex-1 px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--accent-hover)] transition-all"
                  />
                  <button
                    onClick={() =>
                      setEditingTeam((prev) =>
                        prev ? { ...prev, access_code: generateTeamAccessCode(prev.name) } : null
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[var(--accent-10)] border border-[var(--accent-border)] text-[var(--accent-bright)] hover:bg-[var(--accent-20)] transition-all cursor-pointer text-sm whitespace-nowrap"
                    title="Generate new code"
                  >
                    <Shuffle size={16} />
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1.5">Description</label>
                <textarea
                  value={editingTeam.description || ''}
                  onChange={(e) =>
                    setEditingTeam((prev) => (prev ? { ...prev, description: e.target.value } : null))
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent-hover)] transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button variant="ghost" size="small" onClick={() => setEditingTeam(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  onClick={handleEditTeam}
                  disabled={teamActionLoading}
                >
                  {teamActionLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* View Team Members Modal */}
        <Modal
          isOpen={!!viewingTeamMembers}
          onClose={() => {
            setViewingTeamMembers(null);
            setTeamMembers([]);
          }}
          title={`${viewingTeamMembers?.name || 'Team'} — Members`}
          width="max-w-[700px]"
        >
          {teamMembersLoading ? (
            <div className="py-8">
              <LoadingSpinner size="medium" message="Loading members..." />
            </div>
          ) : teamMembers.length === 0 ? (
            <p className="text-center text-[var(--text-muted)] py-8 text-sm">No members in this team yet.</p>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[var(--text-muted)] text-xs uppercase tracking-wider border-b border-[var(--accent-15)]">
                    <th className="pb-2 pr-3">Name</th>
                    <th className="pb-2 pr-3">Email</th>
                    <th className="pb-2 pr-3">Role</th>
                    <th className="pb-2 pr-3">Position</th>
                    <th className="pb-2 text-right">Narratives</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {teamMembers.map((m: any) => {
                    const mName = [m.first_name, m.last_name].filter(Boolean).join(' ') || 'No name';
                    const mBadge = ROLE_BADGE[m.role] || ROLE_BADGE.user;
                    return (
                      <tr key={m.id} className="border-b border-[var(--accent-10)] text-sm">
                        <td className="py-2.5 pr-3 text-[var(--text-primary)] font-medium">{mName}</td>
                        <td className="py-2.5 pr-3 text-[var(--text-muted)]">{m.email}</td>
                        <td className="py-2.5 pr-3">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: mBadge.bg, color: mBadge.text }}
                          >
                            {m.role === 'admin' && <Crown size={10} />}
                            {mBadge.label}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-[var(--text-muted)]">{m.position || '\u2014'}</td>
                        <td className="py-2.5 text-right text-[var(--accent-bright)] font-mono font-medium">
                          {m.narrative_count || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      </motion.div>
    </div>
  );
}
