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
// createClient removed — tracker data now fetched via admin API POST
import LiquidCard from '@/components/ui/LiquidCard';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import ActivityDetailModal from '@/components/dashboard/ActivityDetailModal';
// TokenCalculator removed — replaced by live API Usage tracker

// ─── Protected user — cannot be deleted or restricted ────────
const PROTECTED_EMAIL = 'hvcadip@gmail.com';

type TabKey = 'overview' | 'activity' | 'users' | 'analytics' | 'usage' | 'teams' | 'settings';

const TRACKER_FILTERS = [
  { value: 'all', label: 'All Actions' },
  { value: 'regenerated', label: 'Regenerated' },
  { value: 'customized', label: 'Customized' },
  { value: 'proofread', label: 'Proofread' },
  { value: 'saved', label: 'Saved' },
  { value: 'exported', label: 'Exported' },
];

const ACTION_BORDER_COLORS: Record<string, string> = {
  generate: 'var(--accent-primary)',
  regenerate: 'var(--accent-primary)',
  customize: 'var(--accent-hover)',
  proofread: '#f59e0b',
  proofread_apply: '#f59e0b',
  save: '#16a34a',
  export_copy: '#3b82f6',
  export_print: '#3b82f6',
  export_pdf: '#3b82f6',
  export_docx: '#3b82f6',
  login: '#6b7280',
};

interface TrackerEntry {
  id: string;
  user_id: string;
  ro_number: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  story_type: string | null;
  created_at: string;
  last_action_at: string;
  is_regenerated: boolean;
  is_customized: boolean;
  is_proofread: boolean;
  is_saved: boolean;
  is_exported: boolean;
  export_type: string | null;
  user_first_name: string | null;
  user_last_name: string | null;
  user_email: string;
}

const TRACKER_PILL_COLORS: Record<string, string> = {
  regenerated: '#f59e0b',
  customized: '#8b5cf6',
  proofread: '#06b6d4',
  saved: '#22c55e',
  pdf: '#ef4444',
  copy: '#64748b',
  print: '#64748b',
  docx: '#3b82f6',
};

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
  team_id: string | null;
  team_name: string | null;
}

interface TeamOption {
  id: string;
  name: string;
  member_count: number;
}

interface UserTrackerEntry {
  id: string;
  ro_number: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  story_type: string | null;
  created_at: string;
  last_action_at: string;
  is_regenerated: boolean;
  is_customized: boolean;
  is_proofread: boolean;
  is_saved: boolean;
  is_exported: boolean;
  export_type: string | null;
}

interface UserDetailData {
  profile: Record<string, unknown>;
  recent_activity: Array<Record<string, unknown>>;
  recent_narratives: Array<Record<string, unknown>>;
  recent_tracker_entries: UserTrackerEntry[];
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

  // Tracker (Activity Log) state
  const [trackerEntries, setTrackerEntries] = useState<TrackerEntry[]>([]);
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [trackerError, setTrackerError] = useState<string | null>(null);
  const [trackerTotalCount, setTrackerTotalCount] = useState(0);
  const [trackerPage, setTrackerPage] = useState(1);
  const [trackerSearch, setTrackerSearch] = useState('');
  const [trackerFilter, setTrackerFilter] = useState('all');
  const [trackerSortBy, setTrackerSortBy] = useState<string>('last_action_at');
  const [trackerSortAsc, setTrackerSortAsc] = useState(false);
  const [selectedTrackerId, setSelectedTrackerId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  // Team assignment state
  const [assignTarget, setAssignTarget] = useState<{ id: string; name: string; currentTeamName: string | null; currentTeamId: string | null } | null>(null);
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [teamOptionsLoading, setTeamOptionsLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [createTeamName, setCreateTeamName] = useState('');
  const [createTeamLoading, setCreateTeamLoading] = useState(false);

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

  // API Usage tracker state
  interface UsageData {
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalEstimatedCost: number;
    totalRequests: number;
    currentMonthCost: number;
    averageCostPerRequest: number;
    usageByDay: Array<{ date: string; promptTokens: number; completionTokens: number; totalTokens: number; cost: number; requestCount: number }>;
    usageByAction: Array<{ actionType: string; promptTokens: number; completionTokens: number; totalTokens: number; cost: number; count: number }>;
    usageByUser: Array<{ userId: string; userName: string; promptTokens: number; completionTokens: number; cost: number; count: number }>;
  }
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageRange, setUsageRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [usageLastUpdated, setUsageLastUpdated] = useState<Date | null>(null);
  const [usageSecondsAgo, setUsageSecondsAgo] = useState(0);

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

  // ─── Activity Log (Tracker) ────────────────────────────────
  const fetchTrackerEntries = useCallback(async () => {
    setTrackerLoading(true);
    setTrackerError(null);
    try {
      const offset = (trackerPage - 1) * PAGE_SIZE;
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list_tracker_entries',
          limit: PAGE_SIZE,
          offset,
          search: trackerSearch.trim() || undefined,
          filter: trackerFilter,
          sort_by: trackerSortBy,
          sort_asc: trackerSortAsc,
        }),
      });

      if (!response.ok) {
        console.error('Failed to fetch tracker entries');
        setTrackerError('Failed to load activity log. Please try again.');
        setTrackerEntries([]);
        setTrackerTotalCount(0);
        return;
      }

      const result = await response.json();
      setTrackerEntries(result.data || []);
      setTrackerTotalCount(result.total ?? 0);
    } catch (err) {
      console.error('Tracker fetch error:', err);
      setTrackerError('Failed to load activity log. Please try again.');
      setTrackerEntries([]);
      setTrackerTotalCount(0);
    } finally {
      setTrackerLoading(false);
    }
  }, [trackerPage, trackerSearch, trackerFilter, trackerSortBy, trackerSortAsc]);

  useEffect(() => {
    if (activeTab === 'activity' && profile?.role === 'owner') {
      fetchTrackerEntries();
    }
  }, [activeTab, profile, fetchTrackerEntries]);

  useEffect(() => {
    setTrackerPage(1);
  }, [trackerFilter, trackerSearch, trackerSortBy, trackerSortAsc]);

  const handleTrackerSort = (col: string) => {
    if (trackerSortBy === col) {
      setTrackerSortAsc(!trackerSortAsc);
    } else {
      setTrackerSortBy(col);
      setTrackerSortAsc(false);
    }
  };

  const trackerTotalPages = Math.max(1, Math.ceil(trackerTotalCount / PAGE_SIZE));

  const formatActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      generate: 'Generated',
      regenerate: 'Regenerated',
      customize: 'Customized',
      proofread: 'Proofread',
      proofread_apply: 'Edits Applied',
      save: 'Saved',
      export_copy: 'Copied',
      export_print: 'Printed',
      export_pdf: 'PDF Export',
      export_docx: 'Word Export',
    };
    return labels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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

  // ─── Team Assignment ────────────────────────────────────────
  const fetchTeamOptions = useCallback(async () => {
    setTeamOptionsLoading(true);
    try {
      const json = await adminAction('list_teams', {});
      if (json.success) {
        setTeamOptions(json.data || []);
      }
    } catch {
      console.error('Failed to fetch team options');
    } finally {
      setTeamOptionsLoading(false);
    }
  }, []);

  const handleOpenAssignModal = (user: AdminUser) => {
    const userName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'No name';
    setAssignTarget({
      id: user.id,
      name: userName,
      currentTeamName: user.team_name,
      currentTeamId: user.team_id,
    });
    setSelectedTeamId(user.team_id || '');
    fetchTeamOptions();
  };

  const handleAssignUser = async () => {
    if (!assignTarget || !selectedTeamId) return;
    setAssignLoading(true);
    try {
      const json = await adminAction('assign_user', {
        userId: assignTarget.id,
        teamId: selectedTeamId,
      });
      if (json.success) {
        const teamName = teamOptions.find((t) => t.id === selectedTeamId)?.name || 'team';
        toast.success(`${assignTarget.name} assigned to ${teamName}`);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === assignTarget.id
              ? { ...u, team_id: selectedTeamId, team_name: teamName }
              : u,
          ),
        );
        setAssignTarget(null);
      } else {
        toast.error(json.error || 'Failed to assign user');
      }
    } catch {
      toast.error('Failed to assign user');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleCreateTeamQuick = async () => {
    if (!createTeamName.trim()) return;
    setCreateTeamLoading(true);
    try {
      const json = await adminAction('create_team', { name: createTeamName.trim() });
      if (json.success) {
        toast.success(`Team '${createTeamName.trim()}' created successfully`);
        setCreateTeamName('');
        setShowCreateTeamModal(false);
        // Refresh team options if assign modal is open
        fetchTeamOptions();
      } else {
        toast.error(json.error || 'Failed to create team');
      }
    } catch {
      toast.error('Failed to create team');
    } finally {
      setCreateTeamLoading(false);
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

  // ─── API Usage Tracker ────────────────────────────────────────
  const fetchUsageData = useCallback(async () => {
    setUsageLoading(true);
    try {
      const res = await fetch(`/api/admin/usage?range=${usageRange}`);
      const json = await res.json();
      if (json.success) {
        setUsageData(json.data);
        setUsageLastUpdated(new Date());
        setUsageSecondsAgo(0);
      } else {
        console.error('Failed to fetch usage data:', json.error);
      }
    } catch (err) {
      console.error('Usage data fetch error:', err);
    } finally {
      setUsageLoading(false);
    }
  }, [usageRange]);

  useEffect(() => {
    if (activeTab === 'usage' && profile?.role === 'owner') {
      fetchUsageData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profile, usageRange]);

  useEffect(() => {
    if (activeTab !== 'usage' || !usageLastUpdated) return;
    const ticker = setInterval(() => {
      setUsageSecondsAgo(Math.floor((Date.now() - usageLastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(ticker);
  }, [activeTab, usageLastUpdated]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" message="Loading..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LiquidCard size="spacious">
          <div className="py-12 flex flex-col items-center gap-4">
            <p className="text-[var(--text-muted)] text-sm text-center">
              Unable to load your profile. This can happen if your session timed out.
            </p>
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="small"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  document.cookie.split(';').forEach((c) => {
                    const name = c.trim().split('=')[0];
                    if (name.startsWith('sb-')) {
                      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    }
                  });
                  localStorage.removeItem('sd-login-timestamp');
                  window.location.href = '/login';
                }}
              >
                Re-Login
              </Button>
            </div>
          </div>
        </LiquidCard>
      </div>
    );
  }

  if (profile.role !== 'owner') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LiquidCard size="spacious">
          <div className="py-8 text-center">
            <p className="text-[var(--text-primary)] font-medium mb-2">Access Denied</p>
            <p className="text-[var(--text-muted)] text-sm">This page is restricted to the application owner.</p>
          </div>
        </LiquidCard>
      </div>
    );
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
    { key: 'usage', label: 'API Usage', icon: DollarSign },
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
                {/* ─── Row 1: Search + Refresh ─── */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-full max-w-[260px]">
                    <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      placeholder="Search RO# or name..."
                      value={trackerSearch}
                      onChange={(e) => setTrackerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs focus:outline-none focus:border-[var(--accent-hover)] transition-all"
                    />
                  </div>
                  <button
                    onClick={fetchTrackerEntries}
                    disabled={trackerLoading}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-bright)] hover:bg-[var(--accent-10)] transition-all cursor-pointer disabled:opacity-50"
                    title="Refresh activity log"
                  >
                    <RefreshCw size={15} className={trackerLoading ? 'animate-spin' : ''} />
                  </button>
                  <span className="ml-auto text-xs text-[var(--text-muted)] whitespace-nowrap">
                    {trackerTotalCount} {trackerTotalCount === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {/* ─── Row 2: Filter pills ─── */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  {TRACKER_FILTERS.map((f) => {
                    const isActive = trackerFilter === f.value;
                    return (
                      <button
                        key={f.value}
                        onClick={() => setTrackerFilter(f.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                          isActive
                            ? 'bg-[var(--accent-20)] text-[var(--accent-bright)] border-[var(--accent-50)]'
                            : 'bg-transparent text-[var(--text-muted)] border-[var(--accent-15)] hover:text-[var(--text-secondary)] hover:border-[var(--accent-30)] hover:bg-[var(--accent-5)]'
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>

                {/* ─── Row 3: Sort toggles ─── */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mr-1">Sort:</span>
                  {([
                    { col: 'last_action_at', label: 'Last Activity' },
                    { col: 'created_at', label: 'Created' },
                    { col: 'ro_number', label: 'R.O. #' },
                    { col: 'story_type', label: 'Story Type' },
                  ] as const).map(({ col, label }) => {
                    const isActive = trackerSortBy === col;
                    return (
                      <button
                        key={col}
                        onClick={() => handleTrackerSort(col)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                          isActive
                            ? 'bg-[var(--accent-15)] text-[var(--accent-bright)] border-[var(--accent-40)]'
                            : 'bg-transparent text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)] hover:bg-[var(--accent-5)]'
                        }`}
                      >
                        {label}
                        {isActive && (
                          trackerSortAsc
                            ? <ArrowUp size={12} />
                            : <ArrowDown size={12} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {trackerLoading ? (
                  <div className="py-12">
                    <LoadingSpinner size="medium" message="Loading narrative tracker..." />
                  </div>
                ) : trackerError ? (
                  <ErrorState message={trackerError} onRetry={fetchTrackerEntries} />
                ) : trackerEntries.length === 0 ? (
                  <p className="text-center text-[var(--text-muted)] py-12 text-base">
                    No narrative activity recorded yet. Activity will appear here as users generate stories.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-center text-[var(--text-muted)] text-sm uppercase tracking-wider border-b border-[var(--accent-15)]">
                          <th className="pb-3 pr-4 text-center">User</th>
                          <th className="pb-3 pr-4 text-center">R.O. #</th>
                          <th className="pb-3 pr-4 text-center hidden md:table-cell">Vehicle</th>
                          <th className="pb-3 pr-4 text-center hidden lg:table-cell">Story Type</th>
                          <th className="pb-3 pr-4 text-center">Actions</th>
                          <th className="pb-3 text-center">Last Activity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trackerEntries.map((entry) => {
                          const userName = [entry.user_first_name, entry.user_last_name].filter(Boolean).join(' ') || 'Unknown';
                          const vehicle = [entry.vehicle_year, entry.vehicle_make, entry.vehicle_model].filter(Boolean).join(' ') || '—';
                          const storyLabel = entry.story_type === 'diagnostic_only' ? 'Diagnostic Only' : entry.story_type === 'repair_complete' ? 'Repair Complete' : '—';
                          const borderColor = entry.story_type === 'repair_complete' ? '#22c55e' : 'var(--accent-primary)';
                          const lastAct = entry.last_action_at ? formatDateTimeStacked(entry.last_action_at) : null;

                          // Build action pills
                          const pills: Array<{ label: string; color: string }> = [];
                          if (entry.is_regenerated) pills.push({ label: 'Regen', color: TRACKER_PILL_COLORS.regenerated });
                          if (entry.is_customized) pills.push({ label: 'Custom', color: TRACKER_PILL_COLORS.customized });
                          if (entry.is_proofread) pills.push({ label: 'Proofread', color: TRACKER_PILL_COLORS.proofread });
                          if (entry.is_saved) pills.push({ label: 'Saved', color: TRACKER_PILL_COLORS.saved });
                          if (entry.is_exported && entry.export_type) {
                            const etLabel = entry.export_type.toUpperCase();
                            const etColor = TRACKER_PILL_COLORS[entry.export_type] || '#64748b';
                            pills.push({ label: etLabel, color: etColor });
                          }

                          return (
                            <motion.tr
                              key={entry.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="border-b border-[var(--accent-10)] transition-all duration-200 ease-in-out cursor-pointer text-sm"
                              onClick={() => {
                                setSelectedTrackerId(entry.id);
                                setShowDetailModal(true);
                              }}
                              style={{
                                borderLeft: `3px solid ${borderColor}`,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 0 8px 1px rgba(168, 85, 247, 0.3)';
                                e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <td className="py-3 pr-4 text-center text-[var(--text-primary)] font-medium">
                                {userName}
                              </td>
                              <td className="py-3 pr-4 text-center text-[var(--text-secondary)] font-mono">
                                {entry.ro_number || '—'}
                              </td>
                              <td className="py-3 pr-4 text-center text-[var(--text-muted)] hidden md:table-cell">
                                {vehicle}
                              </td>
                              <td className="py-3 pr-4 text-center hidden lg:table-cell">
                                {entry.story_type ? (
                                  <span
                                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                                    style={{
                                      backgroundColor: entry.story_type === 'repair_complete'
                                        ? 'rgba(34,197,94,0.15)'
                                        : 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
                                      color: entry.story_type === 'repair_complete' ? '#22c55e' : 'var(--accent-bright)',
                                      border: `1px solid ${entry.story_type === 'repair_complete' ? 'rgba(34,197,94,0.3)' : 'var(--accent-30)'}`,
                                    }}
                                  >
                                    {storyLabel}
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="py-3 pr-4 text-center">
                                <div className="flex flex-wrap justify-center gap-1">
                                  {pills.map((pill, i) => (
                                    <span
                                      key={i}
                                      className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                                      style={{
                                        backgroundColor: `color-mix(in srgb, ${pill.color} 15%, transparent)`,
                                        color: pill.color,
                                        border: `1px solid ${pill.color}`,
                                      }}
                                    >
                                      {pill.label}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 text-center">
                                {lastAct ? (
                                  <div>
                                    <p className="text-[var(--text-secondary)] text-sm">{lastAct.date}</p>
                                    <p className="text-[var(--text-muted)] text-xs">{lastAct.time}</p>
                                  </div>
                                ) : '—'}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {trackerTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-[var(--accent-15)]">
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => setTrackerPage(Math.max(1, trackerPage - 1))}
                      disabled={trackerPage <= 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </Button>
                    <span className="text-sm text-[var(--text-muted)]">
                      Page {trackerPage} of {trackerTotalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => setTrackerPage(Math.min(trackerTotalPages, trackerPage + 1))}
                      disabled={trackerPage >= trackerTotalPages}
                      className="flex items-center gap-1"
                    >
                      Next
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                )}
              </LiquidCard>

              {/* Tracker Detail Modal */}
              <ActivityDetailModal
                isOpen={showDetailModal}
                onClose={() => {
                  setShowDetailModal(false);
                  setSelectedTrackerId(null);
                }}
                trackerId={selectedTrackerId}
              />
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
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => setShowCreateTeamModal(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-[var(--accent-border)] text-[var(--text-secondary)] hover:border-[var(--accent-hover)] hover:text-[var(--accent-bright)] bg-[var(--bg-input)] transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Plus size={14} />
                      CREATE TEAM
                    </button>
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
                          <th className="pb-3 pr-3 text-center whitespace-nowrap hidden lg:table-cell">Team</th>
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
                                className="border-b border-[var(--accent-10)] transition-all duration-200 ease-in-out cursor-pointer text-sm"
                                onClick={() => handleExpandUser(user.id)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.boxShadow = '0 0 8px 1px rgba(168, 85, 247, 0.3)';
                                  e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.boxShadow = 'none';
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <td className="py-3 pr-3 text-center text-[var(--text-primary)] font-medium whitespace-nowrap">
                                  {user.first_name || '—'}
                                </td>
                                <td className="py-3 pr-3 text-center text-[var(--text-primary)] font-medium whitespace-nowrap">
                                  {user.last_name || '—'}
                                </td>
                                <td className="py-3 pr-3 text-center hidden md:table-cell">
                                  <span className="inline-block max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-[var(--text-muted)]" title={user.email}>{user.email}</span>
                                </td>
                                <td className="py-3 pr-3 text-center text-[var(--text-muted)] whitespace-nowrap hidden md:table-cell">{user.position || '—'}</td>
                                <td className="py-3 pr-3 text-center whitespace-nowrap">
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium"
                                    style={{ background: roleBadge.bg, color: roleBadge.text }}
                                  >
                                    {user.role === 'owner' && <ShieldCheck size={12} />}
                                    {user.role === 'admin' && <Crown size={12} />}
                                    {roleBadge.label}
                                  </span>
                                </td>
                                <td className="py-3 pr-3 text-center whitespace-nowrap">
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
                                <td className="py-3 pr-3 text-center text-[var(--text-secondary)] whitespace-nowrap">
                                  {formatDateShort(user.created_at)}
                                </td>
                                <td className="py-3 pr-3 text-center whitespace-nowrap hidden lg:table-cell">
                                  {user.last_active ? (() => {
                                    const { date, time } = formatDateTimeStacked(user.last_active);
                                    return (
                                      <div className="flex flex-col items-center">
                                        <span className="text-[var(--text-secondary)]">{date}</span>
                                        <span className="text-[var(--text-muted)] text-xs">{time}</span>
                                      </div>
                                    );
                                  })() : '—'}
                                </td>
                                <td className="py-3 pr-3 text-center whitespace-nowrap hidden lg:table-cell">
                                  {user.team_name ? (
                                    <span className="inline-block max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-[var(--text-secondary)]" title={user.team_name}>
                                      {user.team_name}
                                    </span>
                                  ) : (
                                    <span className="text-[var(--text-muted)]">—</span>
                                  )}
                                </td>
                                <td className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
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

                                        {/* Assign to Team */}
                                        <button
                                          onClick={() => handleOpenAssignModal(user)}
                                          className="p-2.5 rounded-lg hover:bg-[var(--accent-15)] text-[var(--text-muted)] hover:text-[var(--accent-bright)] transition-all cursor-pointer"
                                          title="Assign to Team"
                                          style={{ color: 'var(--accent-bright)' }}
                                        >
                                          <UsersIcon size={20} />
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
                                  <td colSpan={11} className="p-4 bg-[var(--bg-elevated)]">
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
                                            Recent Narrative Activity (Last 5)
                                          </h4>
                                          {!details.recent_tracker_entries || details.recent_tracker_entries.length === 0 ? (
                                            <p className="text-[var(--text-muted)] text-sm">No narrative activity recorded.</p>
                                          ) : (
                                            <div className="space-y-2">
                                              {details.recent_tracker_entries.map((te) => {
                                                const vehicle = [te.vehicle_year, te.vehicle_make, te.vehicle_model].filter(Boolean).join(' ');
                                                const storyColor = te.story_type === 'repair_complete' ? '#22c55e' : 'var(--accent-primary)';
                                                const storyLabel = te.story_type === 'diagnostic_only' ? 'Diagnostic' : te.story_type === 'repair_complete' ? 'Repair' : '—';
                                                const tePills: Array<{ label: string; color: string }> = [];
                                                if (te.is_regenerated) tePills.push({ label: 'Regen', color: TRACKER_PILL_COLORS.regenerated });
                                                if (te.is_customized) tePills.push({ label: 'Custom', color: TRACKER_PILL_COLORS.customized });
                                                if (te.is_proofread) tePills.push({ label: 'Proofread', color: TRACKER_PILL_COLORS.proofread });
                                                if (te.is_saved) tePills.push({ label: 'Saved', color: TRACKER_PILL_COLORS.saved });
                                                if (te.is_exported && te.export_type) {
                                                  const etColor = TRACKER_PILL_COLORS[te.export_type] || '#64748b';
                                                  tePills.push({ label: te.export_type.toUpperCase(), color: etColor });
                                                }
                                                const teLastAct = te.last_action_at ? formatDateTimeStacked(te.last_action_at) : null;

                                                return (
                                                  <div
                                                    key={te.id}
                                                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--accent-5)] transition-all cursor-pointer hover:bg-[var(--accent-10)]"
                                                    style={{ borderLeft: `3px solid ${storyColor}` }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setSelectedTrackerId(te.id);
                                                      setShowDetailModal(true);
                                                    }}
                                                  >
                                                    <div className="flex-1 min-w-0">
                                                      <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-medium text-[var(--text-primary)]">
                                                          R.O. #{te.ro_number || '—'}
                                                        </span>
                                                        {vehicle && (
                                                          <span className="text-sm text-[var(--text-muted)]">{vehicle}</span>
                                                        )}
                                                        <span
                                                          className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                                                          style={{
                                                            backgroundColor: `color-mix(in srgb, ${storyColor} 15%, transparent)`,
                                                            color: storyColor,
                                                            border: `1px solid ${storyColor}`,
                                                          }}
                                                        >
                                                          {storyLabel}
                                                        </span>
                                                      </div>
                                                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                                                        {tePills.map((pill, i) => (
                                                          <span
                                                            key={i}
                                                            className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                                                            style={{
                                                              backgroundColor: `color-mix(in srgb, ${pill.color} 15%, transparent)`,
                                                              color: pill.color,
                                                              border: `1px solid ${pill.color}`,
                                                            }}
                                                          >
                                                            {pill.label}
                                                          </span>
                                                        ))}
                                                      </div>
                                                    </div>
                                                    {teLastAct && (
                                                      <div className="text-right shrink-0">
                                                        <p className="text-xs text-[var(--text-muted)]">{teLastAct.date}</p>
                                                        <p className="text-[10px] text-[var(--text-muted)]">{teLastAct.time}</p>
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })}
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

              {/* Tracker Detail Modal (for user expansion rows) */}
              <ActivityDetailModal
                isOpen={showDetailModal && activeTab === 'users'}
                onClose={() => {
                  setShowDetailModal(false);
                  setSelectedTrackerId(null);
                }}
                trackerId={selectedTrackerId}
              />
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
                            <tr className="text-center text-[var(--text-muted)] text-sm uppercase tracking-wider border-b border-[var(--accent-15)]">
                              <th className="pb-3 pr-4 w-16 text-center">Rank</th>
                              <th className="pb-3 pr-4 text-center">Name</th>
                              <th className="pb-3 pr-4 text-center">Position</th>
                              <th className="pb-3 text-center">Narratives</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analyticsData.topUsers.map((user) => {
                              const rankColors: Record<number, string> = { 1: '#fbbf24', 2: '#9ca3af', 3: '#cd7f32' };
                              const rankColor = rankColors[user.rank];
                              return (
                                <tr
                                  key={user.rank}
                                  className="border-b border-[var(--accent-10)] transition-all duration-200 ease-in-out"
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 0 8px 1px rgba(168, 85, 247, 0.3)';
                                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.05)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <td className="py-3 pr-4 text-center">
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
                                  <td className="py-3 pr-4 text-center text-[var(--text-primary)] font-medium text-base">{user.name}</td>
                                  <td className="py-3 pr-4 text-center text-[var(--text-muted)] text-sm">{user.position}</td>
                                  <td className="py-3 text-center text-[var(--accent-bright)] font-mono font-semibold text-base">
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
              API USAGE TAB
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'usage' && (
            <motion.div
              key="usage"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* Header with time range selector + refresh */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-sm text-[var(--text-muted)]">
                  {usageLastUpdated
                    ? `Last updated: ${usageSecondsAgo < 5 ? 'just now' : `${usageSecondsAgo}s ago`}`
                    : 'Loading...'}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {([
                    { value: '7' as const, label: 'Last 7 Days' },
                    { value: '30' as const, label: 'Last 30 Days' },
                    { value: '90' as const, label: 'Last 90 Days' },
                    { value: 'all' as const, label: 'All Time' },
                  ]).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setUsageRange(value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        usageRange === value
                          ? 'bg-[var(--accent-20)] text-[var(--accent-bright)] border border-[var(--accent-50)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--accent-10)] border border-transparent'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    onClick={fetchUsageData}
                    disabled={usageLoading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent-bright)] hover:bg-[var(--accent-10)] transition-all cursor-pointer disabled:opacity-50"
                    title="Refresh usage data"
                  >
                    <RefreshCw size={16} className={usageLoading ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Model Info Callout */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--accent-5)] border border-[var(--accent-15)]">
                <Info size={18} className="flex-shrink-0" style={{ color: 'var(--accent-hover)' }} />
                <p className="text-sm text-[var(--text-muted)]">
                  <span className="font-medium text-[var(--accent-bright)]">Model: gemini-3-flash-preview</span>
                  {' | Input: $0.50/1M tokens | Output: $3.00/1M tokens'}
                </p>
              </div>

              {usageLoading && !usageData ? (
                <LiquidCard size="standard">
                  <div className="py-12">
                    <LoadingSpinner size="medium" message="Loading API usage data..." />
                  </div>
                </LiquidCard>
              ) : usageData ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                      { label: 'Total Requests', value: usageData.totalRequests.toLocaleString(), icon: Zap, color: '#f59e0b' },
                      { label: 'Input Tokens', value: usageData.totalPromptTokens.toLocaleString(), icon: ArrowUp, color: '#3b82f6' },
                      { label: 'Output Tokens', value: usageData.totalCompletionTokens.toLocaleString(), icon: ArrowDown, color: '#16a34a' },
                      { label: 'Total Tokens', value: usageData.totalTokens.toLocaleString(), icon: Activity, color: 'var(--accent-primary)' },
                      { label: 'Estimated Cost', value: `$${usageData.totalEstimatedCost.toFixed(2)}`, icon: DollarSign, color: '#ef4444' },
                      { label: 'Current Month', value: `$${usageData.currentMonthCost.toFixed(2)}`, icon: DollarSign, color: '#f59e0b' },
                      { label: 'Avg Cost/Request', value: `$${usageData.averageCostPerRequest.toFixed(4)}`, icon: TrendingUp, color: 'var(--accent-bright)' },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <LiquidCard key={label} size="compact" className="!rounded-[16px] relative overflow-hidden">
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs sm:text-sm text-[var(--text-muted)] uppercase tracking-wider font-medium">{label}</p>
                            <Icon size={22} style={{ color, opacity: 0.6 }} />
                          </div>
                          <p className="text-xl sm:text-2xl font-bold" style={{ color }}>{value}</p>
                        </div>
                      </LiquidCard>
                    ))}
                  </div>

                  {/* Token Usage Over Time Chart */}
                  <LiquidCard size="standard" className="!rounded-[16px]">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                      Token Usage Over Time ({usageRange === 'all' ? 'All Time' : `Last ${usageRange} Days`})
                    </h3>
                    {usageData.usageByDay.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={usageData.usageByDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                          <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
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
                            formatter={(value) => typeof value === 'number' ? value.toLocaleString() : String(value ?? '')}
                          />
                          <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: 13 }} />
                          <Area type="monotone" dataKey="promptTokens" name="Input Tokens" stackId="tokens" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.5} />
                          <Area type="monotone" dataKey="completionTokens" name="Output Tokens" stackId="tokens" fill="#16a34a" stroke="#16a34a" fillOpacity={0.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-[var(--text-muted)] text-base text-center py-8">No usage data for this period.</p>
                    )}
                  </LiquidCard>

                  {/* Cost Over Time BarChart */}
                  <LiquidCard size="standard" className="!rounded-[16px]">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                      Cost Over Time ({usageRange === 'all' ? 'All Time' : `Last ${usageRange} Days`})
                    </h3>
                    {usageData.usageByDay.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={usageData.usageByDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                          <YAxis
                            stroke="var(--text-muted)"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v: number) => `$${v.toFixed(3)}`}
                          />
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
                            formatter={(value) => [`$${typeof value === 'number' ? value.toFixed(4) : value}`, 'Cost']}
                          />
                          <Bar dataKey="cost" name="Cost (USD)" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-[var(--text-muted)] text-base text-center py-8">No cost data for this period.</p>
                    )}
                  </LiquidCard>

                  {/* Usage by Action Type */}
                  <LiquidCard size="standard" className="!rounded-[16px]">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Usage by Action Type</h3>
                    {usageData.usageByAction.length > 0 ? (() => {
                      const barData = usageData.usageByAction.map((a) => ({
                        name: a.actionType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                        tokens: a.totalTokens,
                        cost: a.cost,
                        fill: ACTION_BORDER_COLORS[a.actionType] || 'var(--accent-30)',
                      }));
                      return (
                        <ResponsiveContainer width="100%" height={Math.max(barData.length * 45, 200)}>
                          <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--accent-15)" horizontal={false} />
                            <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="name" type="category" width={130} stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                            <Tooltip
                              contentStyle={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--accent-30)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: 13,
                              }}
                              formatter={(value) => typeof value === 'number' ? value.toLocaleString() : String(value ?? '')}
                            />
                            <Bar dataKey="tokens" name="Total Tokens" radius={[0, 4, 4, 0]}>
                              {barData.map((entry, idx) => (
                                <Cell key={idx} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })() : (
                      <p className="text-[var(--text-muted)] text-base text-center py-8">No usage data.</p>
                    )}
                  </LiquidCard>

                  {/* Top Users by Token Usage */}
                  <LiquidCard size="standard" className="!rounded-[16px]">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Top Users by Token Usage</h3>
                    {usageData.usageByUser.length === 0 ? (
                      <p className="text-[var(--text-muted)] text-base text-center py-8">No usage data yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-center text-[var(--text-muted)] text-sm uppercase tracking-wider border-b border-[var(--accent-15)]">
                              <th className="pb-3 pr-4 w-16 text-center">Rank</th>
                              <th className="pb-3 pr-4 text-center">Name</th>
                              <th className="pb-3 pr-4 text-center">Requests</th>
                              <th className="pb-3 pr-4 text-center">Input Tokens</th>
                              <th className="pb-3 pr-4 text-center">Output Tokens</th>
                              <th className="pb-3 text-center">Est. Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usageData.usageByUser.map((u, idx) => {
                              const rankColors: Record<number, string> = { 0: '#fbbf24', 1: '#9ca3af', 2: '#cd7f32' };
                              const rankColor = rankColors[idx];
                              return (
                                <tr
                                  key={u.userId}
                                  className="border-b border-[var(--accent-10)] text-center transition-all duration-200 ease-in-out"
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 0 8px 1px rgba(168, 85, 247, 0.3)';
                                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.05)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <td className="py-3 pr-4 text-center">
                                    <span
                                      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                                      style={rankColor ? {
                                        background: `${rankColor}20`,
                                        color: rankColor,
                                        border: `1px solid ${rankColor}40`,
                                      } : { color: 'var(--text-muted)' }}
                                    >
                                      {idx + 1}
                                    </span>
                                  </td>
                                  <td className="py-3 pr-4 text-[var(--text-primary)] font-medium text-center">{u.userName}</td>
                                  <td className="py-3 pr-4 text-[var(--text-secondary)] text-center">{u.count.toLocaleString()}</td>
                                  <td className="py-3 pr-4 text-[var(--text-secondary)] font-mono text-center">{u.promptTokens.toLocaleString()}</td>
                                  <td className="py-3 pr-4 text-[var(--text-secondary)] font-mono text-center">{u.completionTokens.toLocaleString()}</td>
                                  <td className="py-3 text-[var(--accent-bright)] font-mono font-semibold text-center">${u.cost.toFixed(4)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </LiquidCard>
                </>
              ) : (
                <LiquidCard size="standard" className="!rounded-[16px]">
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <DollarSign size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                    <p className="text-[var(--text-secondary)] text-base text-center">No API usage data available.</p>
                    <p className="text-[var(--text-muted)] text-sm text-center">Usage will be tracked as users generate narratives.</p>
                  </div>
                </LiquidCard>
              )}
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

        {/* Old Activity Detail Modal removed — replaced by tracker detail modal in Activity tab */}

        {/* Assign to Team Modal */}
        <Modal
          isOpen={!!assignTarget}
          onClose={() => setAssignTarget(null)}
          title={`Assign ${assignTarget?.name || 'User'} to Team`}
          width="max-w-[480px]"
        >
          {assignTarget?.currentTeamName && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--accent-10)] border border-[var(--accent-15)]">
              <p className="text-sm text-[var(--text-secondary)]">
                Currently assigned to: <strong className="text-[var(--accent-bright)]">{assignTarget.currentTeamName}</strong>
              </p>
            </div>
          )}

          {teamOptionsLoading ? (
            <div className="py-6">
              <LoadingSpinner size="medium" message="Loading teams..." />
            </div>
          ) : teamOptions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-[var(--text-muted)] text-sm mb-3">No teams available. Create a team first.</p>
              <Button
                variant="primary"
                size="small"
                onClick={() => {
                  setAssignTarget(null);
                  setShowCreateTeamModal(true);
                }}
              >
                <Plus size={14} />
                Create Team
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <label className="block text-sm text-[var(--text-muted)] mb-1.5">Select Team</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] text-sm cursor-pointer focus:outline-none focus:border-[var(--accent-hover)] transition-all"
                >
                  <option value="">— Select a team —</option>
                  {teamOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.member_count} {t.member_count === 1 ? 'member' : 'members'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="ghost" size="small" onClick={() => setAssignTarget(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  onClick={handleAssignUser}
                  disabled={!selectedTeamId || selectedTeamId === assignTarget?.currentTeamId || assignLoading}
                >
                  {assignLoading ? 'Assigning...' : 'Assign'}
                </Button>
              </div>
            </>
          )}
        </Modal>

        {/* Create Team Modal (User Management) */}
        <Modal
          isOpen={showCreateTeamModal}
          onClose={() => {
            setShowCreateTeamModal(false);
            setCreateTeamName('');
          }}
          title="Create New Team"
          width="max-w-[420px]"
        >
          <div className="mb-5">
            <label className="block text-sm text-[var(--text-muted)] mb-1.5">Team Name</label>
            <input
              type="text"
              value={createTeamName}
              onChange={(e) => setCreateTeamName(e.target.value)}
              placeholder="Enter team name..."
              className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent-hover)] transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && createTeamName.trim()) handleCreateTeamQuick();
              }}
              autoFocus
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              size="small"
              onClick={() => {
                setShowCreateTeamModal(false);
                setCreateTeamName('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleCreateTeamQuick}
              disabled={!createTeamName.trim() || createTeamLoading}
            >
              {createTeamLoading ? 'Creating...' : 'Create'}
            </Button>
          </div>
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
                  <tr className="text-center text-[var(--text-muted)] text-xs uppercase tracking-wider border-b border-[var(--accent-15)]">
                    <th className="pb-2 pr-3 text-center">Name</th>
                    <th className="pb-2 pr-3 text-center">Email</th>
                    <th className="pb-2 pr-3 text-center">Role</th>
                    <th className="pb-2 pr-3 text-center">Position</th>
                    <th className="pb-2 text-center">Narratives</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {teamMembers.map((m: any) => {
                    const mName = [m.first_name, m.last_name].filter(Boolean).join(' ') || 'No name';
                    const mBadge = ROLE_BADGE[m.role] || ROLE_BADGE.user;
                    return (
                      <tr
                        key={m.id}
                        className="border-b border-[var(--accent-10)] text-sm transition-all duration-200 ease-in-out"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 8px 1px rgba(168, 85, 247, 0.3)';
                          e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td className="py-2.5 pr-3 text-center text-[var(--text-primary)] font-medium">{mName}</td>
                        <td className="py-2.5 pr-3 text-center">
                          <span className="inline-block max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-[var(--text-muted)]" title={m.email}>{m.email}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-center">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: mBadge.bg, color: mBadge.text }}
                          >
                            {m.role === 'admin' && <Crown size={10} />}
                            {mBadge.label}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-center text-[var(--text-muted)]">{m.position || '\u2014'}</td>
                        <td className="py-2.5 text-center text-[var(--accent-bright)] font-mono font-medium">
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
