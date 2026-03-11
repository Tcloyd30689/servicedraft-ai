'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Search, RefreshCw, Crown,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown,
  FileText, Activity, UserCog, UserCheck, UserMinus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import LiquidCard from '@/components/ui/LiquidCard';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';

// ─── Interfaces ──────────────────────────────────────────
interface TeamInfo {
  id: string;
  name: string;
  access_code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface TeamMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: 'user' | 'admin' | 'owner';
  position: string | null;
  narrative_count: number;
  last_active: string | null;
}

// ─── Role Badges ─────────────────────────────────────────
const ROLE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  owner: { bg: 'rgba(168,85,247,0.15)', text: '#a855f7', label: 'Owner' },
  admin: { bg: 'rgba(234,179,8,0.15)', text: '#eab308', label: 'Admin' },
  user: { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af', label: 'User' },
};

// ─── Activity Log Constants ──────────────────────────────
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

const ACTIVITY_PAGE_SIZE = 25;

type MemberSortColumn = 'name' | 'email' | 'position' | 'role' | 'narrative_count' | 'last_active';

// ─── Date formatting ─────────────────────────────────────
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

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 };

const tabVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

type TabKey = 'overview' | 'members' | 'activity';

export default function TeamDashboardPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Team info
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [teamLoading, setTeamLoading] = useState(true);

  // Members
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Table state
  const [memberSearch, setMemberSearch] = useState('');
  const [sortCol, setSortCol] = useState<MemberSortColumn>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  // Role management
  const [promoteTarget, setPromoteTarget] = useState<{ id: string; name: string; currentRole: string } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Activity log state
  const [activityLogs, setActivityLogs] = useState<ActivityRow[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityTotalCount, setActivityTotalCount] = useState(0);
  const [activityPage, setActivityPage] = useState(1);
  const [activityFilter, setActivityFilter] = useState('all');
  const [activitySearch, setActivitySearch] = useState('');
  const [activitySortAsc, setActivitySortAsc] = useState(false);
  const [activityExpandedRow, setActivityExpandedRow] = useState<string | null>(null);

  // Title spotlight
  const titleRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveringTitle, setIsHoveringTitle] = useState(false);

  const handleTitleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!titleRef.current) return;
    const rect = titleRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  // ─── Route protection ──────────────────────────────────
  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role === 'user') {
        toast.error('Access denied. Team Dashboard is for admin users only.');
        router.replace('/dashboard');
      }
    }
  }, [authLoading, profile, router]);

  // ─── Fetch Team Info ───────────────────────────────────
  const fetchTeam = useCallback(async () => {
    setTeamLoading(true);
    try {
      const res = await fetch('/api/teams');
      const json = await res.json();
      if (json.success && json.data) {
        // Admin gets single team, owner gets array — handle both
        if (Array.isArray(json.data)) {
          // Owner viewing — pick the first team or their assigned team
          if (profile?.team_id) {
            const match = json.data.find((t: TeamInfo) => t.id === profile.team_id);
            setTeam(match || json.data[0] || null);
          } else {
            setTeam(json.data[0] || null);
          }
        } else {
          setTeam(json.data);
        }
      }
    } catch (err) {
      console.error('Team fetch error:', err);
    } finally {
      setTeamLoading(false);
    }
  }, [profile?.team_id]);

  useEffect(() => {
    if (profile && (profile.role === 'admin' || profile.role === 'owner')) {
      fetchTeam();
    }
  }, [profile, fetchTeam]);

  // ─── Fetch Members ─────────────────────────────────────
  const fetchMembers = useCallback(async () => {
    if (!team) return;
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/teams/members?team_id=${team.id}`);
      const json = await res.json();
      if (json.success) {
        setMembers(json.data || []);
      }
    } catch (err) {
      console.error('Members fetch error:', err);
    } finally {
      setMembersLoading(false);
    }
  }, [team]);

  useEffect(() => {
    if (team) {
      fetchMembers();
    }
  }, [team, fetchMembers]);

  // ─── Fetch Activity Logs ──────────────────────────────
  const fetchActivityLogs = useCallback(async () => {
    if (!team) return;
    setActivityLoading(true);
    try {
      const params = new URLSearchParams({
        team_id: team.id,
        page: String(activityPage),
        filter: activityFilter,
        search: activitySearch,
        sort: activitySortAsc ? 'asc' : 'desc',
      });
      const res = await fetch(`/api/teams/activity?${params}`);
      const json = await res.json();
      if (json.success) {
        setActivityLogs(json.data || []);
        setActivityTotalCount(json.totalCount ?? 0);
      } else {
        console.error('Activity fetch error:', json.error);
        setActivityLogs([]);
        setActivityTotalCount(0);
      }
    } catch (err) {
      console.error('Activity log fetch error:', err);
    } finally {
      setActivityLoading(false);
    }
  }, [team, activityPage, activityFilter, activitySearch, activitySortAsc]);

  useEffect(() => {
    if (activeTab === 'activity' && team) {
      fetchActivityLogs();
    }
  }, [activeTab, team, fetchActivityLogs]);

  useEffect(() => {
    setActivityPage(1);
  }, [activityFilter, activitySearch]);

  const activityTotalPages = Math.max(1, Math.ceil(activityTotalCount / ACTIVITY_PAGE_SIZE));

  const formatActionLabel = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDateReadable = (iso: string) => {
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

  // ─── Overview Stats ────────────────────────────────────
  const memberCount = members.length;
  const totalNarratives = members.reduce((sum, m) => sum + m.narrative_count, 0);

  // Active this week: members with last_active within 7 days
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const activeMembersThisWeek = members.filter(
    (m) => m.last_active && new Date(m.last_active) >= oneWeekAgo
  ).length;

  // Narratives today: approximate from activity (we'll show total for now since
  // we don't have daily breakdown per team — the count is still useful)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeMembersToday = members.filter(
    (m) => m.last_active && new Date(m.last_active) >= today
  ).length;

  // ─── Table Filtering / Sorting ─────────────────────────
  const filteredMembers = members.filter((m) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    const name = [m.first_name, m.last_name].filter(Boolean).join(' ').toLowerCase();
    return name.includes(q) || m.email.toLowerCase().includes(q);
  });

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    switch (sortCol) {
      case 'name': {
        const aName = [a.first_name, a.last_name].filter(Boolean).join(' ');
        const bName = [b.first_name, b.last_name].filter(Boolean).join(' ');
        return aName.localeCompare(bName) * dir;
      }
      case 'email':
        return a.email.localeCompare(b.email) * dir;
      case 'position':
        return (a.position || '').localeCompare(b.position || '') * dir;
      case 'role':
        return a.role.localeCompare(b.role) * dir;
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

  const toggleSort = (col: MemberSortColumn) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  // ─── Role Management ───────────────────────────────────
  const handlePromoteToggle = async () => {
    if (!promoteTarget) return;

    const isPromoting = promoteTarget.currentRole === 'user';

    setActionLoading(`promote-${promoteTarget.id}`);
    try {
      const res = await fetch('/api/teams/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: promoteTarget.id,
          newRole: isPromoting ? 'admin' : 'user',
        }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(
          isPromoting
            ? `${promoteTarget.name} promoted to Admin`
            : `${promoteTarget.name} demoted to User`
        );
        setMembers((prev) =>
          prev.map((m) =>
            m.id === promoteTarget.id
              ? { ...m, role: isPromoting ? 'admin' : 'user' }
              : m
          )
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

  // Can the current user manage this member's role?
  const canManageRole = (member: TeamMember): { allowed: boolean; reason?: string } => {
    if (!profile) return { allowed: false };

    // Owner can do anything
    if (profile.role === 'owner') return { allowed: true };

    // Cannot change own role
    if (member.id === profile.id) return { allowed: false, reason: 'Cannot change your own role' };

    // Cannot change another admin's role
    if (member.role === 'admin') return { allowed: false, reason: 'Contact the Owner to modify other admin roles' };

    // Cannot change an owner's role
    if (member.role === 'owner') return { allowed: false, reason: 'Cannot modify owner role' };

    // Admin can promote user to admin
    if (member.role === 'user') return { allowed: true };

    return { allowed: false };
  };

  // Can the current user remove this member from the team?
  const canRemoveMember = (member: TeamMember): boolean => {
    if (!profile) return false;
    // Cannot remove yourself
    if (member.id === profile.id) return false;
    // Cannot remove an owner
    if (member.role === 'owner') return false;
    // Owner can remove anyone else
    if (profile.role === 'owner') return true;
    // Admin can remove users (not other admins)
    if (profile.role === 'admin' && member.role === 'user') return true;
    return false;
  };

  // ─── Remove Member ───────────────────────────────────
  const handleRemoveMember = async () => {
    if (!removeTarget || !team) return;

    setActionLoading(`remove-${removeTarget.id}`);
    try {
      const res = await fetch('/api/teams/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: removeTarget.id }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(`${removeTarget.name} has been removed from the team`);
        setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id));
      } else {
        toast.error(json.error || 'Failed to remove member');
      }
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setActionLoading(null);
      setRemoveTarget(null);
    }
  };

  // ─── Loading / Auth guards ─────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" message="Loading..." />
      </div>
    );
  }

  if (!profile || profile.role === 'user') {
    return null;
  }

  if (teamLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" message="Loading team..." />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-[90vw] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <LiquidCard size="standard" className="!rounded-[16px]">
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Users size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            <p className="text-[var(--text-secondary)] text-base text-center">
              You are not assigned to any team yet.
            </p>
            <p className="text-[var(--text-muted)] text-sm text-center">
              Contact the platform owner to be assigned to a team.
            </p>
            <Button variant="secondary" size="medium" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </LiquidCard>
      </div>
    );
  }

  // ─── Overview Cards ────────────────────────────────────
  const overviewCards = [
    { label: 'Team Members', value: memberCount, icon: Users, color: 'var(--accent-bright)', sub: 'in this team' },
    { label: 'Active This Week', value: activeMembersThisWeek, icon: Activity, color: '#16a34a', sub: 'last 7 days' },
    { label: 'Total Narratives', value: totalNarratives, icon: FileText, color: 'var(--accent-primary)', sub: 'generated by team' },
    { label: 'Active Today', value: activeMembersToday, icon: UserCheck, color: '#f59e0b', sub: 'members active today' },
  ];

  const tabs: { key: TabKey; label: string; icon: typeof Users }[] = [
    { key: 'overview', label: 'Overview', icon: Users },
    { key: 'members', label: 'Team Members', icon: UserCog },
    { key: 'activity', label: 'Activity Log', icon: Activity },
  ];

  return (
    <div className="max-w-[90vw] mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header — Team Name with premium styling */}
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
                className="text-2xl sm:text-4xl font-bold uppercase tracking-widest"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: '2px var(--accent-bright)',
                  textShadow: '0 0 10px var(--accent-primary), 0 0 20px var(--accent-primary), 0 0 40px var(--accent-primary), 0 0 80px var(--accent-primary)',
                }}
              >
                {team.name}
              </h1>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
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

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════════════════════════
              OVERVIEW TAB
             ═══════════════════════════════════════════════════ */}
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
              {membersLoading && members.length === 0 ? (
                <LiquidCard size="standard">
                  <div className="py-12">
                    <LoadingSpinner size="medium" message="Loading team data..." />
                  </div>
                </LiquidCard>
              ) : (
                <>
                  {/* Metric Cards */}
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

                  {/* Team Info Card */}
                  {team.description && (
                    <LiquidCard size="standard" className="!rounded-[16px]">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">About This Team</h3>
                      <p className="text-[var(--text-secondary)] text-sm">{team.description}</p>
                    </LiquidCard>
                  )}

                  {/* Quick Member List Preview */}
                  <LiquidCard size="standard" className="!rounded-[16px]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">Team Members</h3>
                      <Button variant="ghost" size="small" onClick={() => setActiveTab('members')}>
                        View All
                      </Button>
                    </div>
                    {members.length === 0 ? (
                      <p className="text-[var(--text-muted)] text-sm text-center py-8">No members in this team yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {members.slice(0, 5).map((member) => {
                          const name = [member.first_name, member.last_name].filter(Boolean).join(' ') || 'No name';
                          const roleBadge = ROLE_BADGE[member.role] || ROLE_BADGE.user;
                          return (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-[var(--accent-5)] hover:bg-[var(--accent-10)] transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="text-[var(--text-primary)] font-medium text-sm">{name}</p>
                                  <p className="text-[var(--text-muted)] text-xs">{member.position || 'No position'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[var(--text-muted)] text-sm">{member.narrative_count} narratives</span>
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{ background: roleBadge.bg, color: roleBadge.text }}
                                >
                                  {member.role === 'admin' && <Crown size={10} />}
                                  {roleBadge.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {members.length > 5 && (
                          <p className="text-[var(--text-muted)] text-sm text-center pt-2">
                            + {members.length - 5} more members
                          </p>
                        )}
                      </div>
                    )}
                  </LiquidCard>
                </>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════
              TEAM MEMBERS TAB
             ═══════════════════════════════════════════════════ */}
          {activeTab === 'members' && (
            <motion.div
              key="members"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <LiquidCard size="standard" className="!rounded-[16px]">
                {/* Search & Sort Controls */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5 items-center">
                  <div className="relative w-full sm:w-[35%]">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent-hover)] transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">Sort by:</span>
                    <select
                      value={sortCol}
                      onChange={(e) => {
                        setSortCol(e.target.value as MemberSortColumn);
                        setSortAsc(e.target.value === 'name' || e.target.value === 'email');
                      }}
                      className="px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] text-sm cursor-pointer focus:outline-none focus:border-[var(--accent-hover)] appearance-none transition-all"
                    >
                      <option value="name">Name</option>
                      <option value="email">Email</option>
                      <option value="position">Position</option>
                      <option value="role">Role</option>
                      <option value="narrative_count">Narratives</option>
                      <option value="last_active">Last Active</option>
                    </select>
                    <button
                      onClick={() => setSortAsc(!sortAsc)}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-secondary)] text-sm hover:border-[var(--accent-hover)] transition-all cursor-pointer whitespace-nowrap"
                      title={sortAsc ? 'Ascending' : 'Descending'}
                    >
                      {sortAsc ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                      {sortAsc ? 'A\u2192Z' : 'Z\u2192A'}
                    </button>
                  </div>
                  <div className="ml-auto">
                    <Button variant="ghost" size="small" onClick={fetchMembers} disabled={membersLoading}>
                      <RefreshCw size={16} className={membersLoading ? 'animate-spin' : ''} />
                      Refresh
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-[var(--text-muted)] mb-3">
                  {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
                  {memberSearch.trim() ? ' matching' : ' total'}
                </p>

                {membersLoading ? (
                  <div className="py-12">
                    <LoadingSpinner size="medium" message="Loading team members..." />
                  </div>
                ) : sortedMembers.length === 0 ? (
                  <p className="text-center text-[var(--text-muted)] py-12 text-base">No members found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-center text-[var(--text-muted)] text-sm uppercase tracking-wider border-b border-[var(--accent-15)]">
                          {([
                            ['name', 'Name'],
                            ['email', 'Email'],
                            ['position', 'Position'],
                            ['role', 'Role'],
                            ['narrative_count', 'Narratives'],
                            ['last_active', 'Last Active'],
                          ] as [MemberSortColumn, string][]).map(([col, label]) => (
                            <th
                              key={col}
                              className={`pb-3 pr-3 text-center cursor-pointer hover:text-[var(--text-secondary)] transition-colors select-none whitespace-nowrap ${
                                col === 'email' || col === 'position' ? 'hidden md:table-cell' : ''
                              } ${col === 'last_active' ? 'hidden lg:table-cell' : ''}`}
                              onClick={() => toggleSort(col)}
                            >
                              <span className="inline-flex items-center justify-center gap-1">
                                {label}
                                {sortCol === col && (
                                  sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                                )}
                              </span>
                            </th>
                          ))}
                          <th className="pb-3 text-center whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedMembers.map((member) => {
                          const memberName = [member.first_name, member.last_name].filter(Boolean).join(' ') || 'No name';
                          const roleBadge = ROLE_BADGE[member.role] || ROLE_BADGE.user;
                          const roleAccess = canManageRole(member);
                          const isExpanded = expandedMemberId === member.id;

                          return (
                            <AnimatePresence key={member.id}>
                              <motion.tr
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="border-b border-[var(--accent-10)] transition-all duration-200 ease-in-out cursor-pointer text-sm"
                                onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
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
                                  {memberName}
                                </td>
                                <td className="py-3 pr-3 text-center hidden md:table-cell">
                                  <span className="inline-block max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-[var(--text-muted)]" title={member.email}>
                                    {member.email}
                                  </span>
                                </td>
                                <td className="py-3 pr-3 text-center text-[var(--text-muted)] whitespace-nowrap hidden md:table-cell">
                                  {member.position || '\u2014'}
                                </td>
                                <td className="py-3 pr-3 text-center whitespace-nowrap">
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium"
                                    style={{ background: roleBadge.bg, color: roleBadge.text }}
                                  >
                                    {member.role === 'admin' && <Crown size={12} />}
                                    {roleBadge.label}
                                  </span>
                                </td>
                                <td className="py-3 pr-3 text-[var(--text-secondary)] text-center whitespace-nowrap">
                                  {member.narrative_count}
                                </td>
                                <td className="py-3 pr-3 text-center whitespace-nowrap hidden lg:table-cell">
                                  {member.last_active ? (() => {
                                    const { date, time } = formatDateTimeStacked(member.last_active);
                                    return (
                                      <div className="flex flex-col items-center">
                                        <span className="text-[var(--text-secondary)]">{date}</span>
                                        <span className="text-[var(--text-muted)] text-xs">{time}</span>
                                      </div>
                                    );
                                  })() : '\u2014'}
                                </td>
                                <td className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-center gap-1">
                                    {roleAccess.allowed ? (
                                      <button
                                        onClick={() =>
                                          setPromoteTarget({
                                            id: member.id,
                                            name: memberName,
                                            currentRole: member.role,
                                          })
                                        }
                                        disabled={actionLoading === `promote-${member.id}`}
                                        className="p-2.5 rounded-lg hover:bg-[var(--accent-15)] text-[var(--text-muted)] hover:text-[var(--accent-bright)] transition-all cursor-pointer disabled:opacity-50"
                                        title={member.role === 'user' ? 'Promote to Admin' : 'Demote to User'}
                                      >
                                        <UserCog size={20} />
                                      </button>
                                    ) : (
                                      <div
                                        className="p-2.5 text-[var(--text-muted)] opacity-30 cursor-not-allowed"
                                        title={roleAccess.reason || 'Cannot modify role'}
                                      >
                                        <UserCog size={20} />
                                      </div>
                                    )}
                                    {canRemoveMember(member) ? (
                                      <button
                                        onClick={() =>
                                          setRemoveTarget({
                                            id: member.id,
                                            name: memberName,
                                          })
                                        }
                                        disabled={actionLoading === `remove-${member.id}`}
                                        className="p-2.5 rounded-lg hover:bg-[rgba(239,68,68,0.15)] text-[var(--text-muted)] hover:text-[#ef4444] transition-all cursor-pointer disabled:opacity-50"
                                        title="Remove from Team"
                                      >
                                        <UserMinus size={20} />
                                      </button>
                                    ) : (
                                      <div
                                        className="p-2.5 text-[var(--text-muted)] opacity-30 cursor-not-allowed"
                                        title="Cannot remove this member"
                                      >
                                        <UserMinus size={20} />
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </motion.tr>

                              {/* Expanded Member Details */}
                              {isExpanded && (
                                <motion.tr
                                  key={`${member.id}-detail`}
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                >
                                  <td colSpan={7} className="p-4 bg-[var(--bg-elevated)]">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                      <div>
                                        <p className="text-[var(--text-muted)] text-sm">Full Name</p>
                                        <p className="text-[var(--text-secondary)] font-medium">{memberName}</p>
                                      </div>
                                      <div>
                                        <p className="text-[var(--text-muted)] text-sm">Email</p>
                                        <p className="text-[var(--text-secondary)] font-mono text-sm break-all">{member.email}</p>
                                      </div>
                                      <div>
                                        <p className="text-[var(--text-muted)] text-sm">Position</p>
                                        <p className="text-[var(--text-secondary)]">{member.position || 'Not set'}</p>
                                      </div>
                                      <div>
                                        <p className="text-[var(--text-muted)] text-sm">Role</p>
                                        <span
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                          style={{ background: roleBadge.bg, color: roleBadge.text }}
                                        >
                                          {member.role === 'admin' && <Crown size={10} />}
                                          {roleBadge.label}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-[var(--text-muted)] text-sm">Narratives Generated</p>
                                        <p className="text-[var(--accent-bright)] font-bold text-lg">{member.narrative_count}</p>
                                      </div>
                                      <div>
                                        <p className="text-[var(--text-muted)] text-sm">Last Active</p>
                                        <p className="text-[var(--text-secondary)]">
                                          {member.last_active
                                            ? (() => {
                                                const { date, time } = formatDateTimeStacked(member.last_active);
                                                return `${date} at ${time}`;
                                              })()
                                            : 'Never'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[var(--text-muted)] text-sm">Member ID</p>
                                        <p className="text-[var(--text-secondary)] font-mono text-xs break-all">{member.id}</p>
                                      </div>
                                    </div>
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
          {/* ═══════════════════════════════════════════════════
              ACTIVITY LOG TAB
             ═══════════════════════════════════════════════════ */}
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
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--accent-hover)] transition-all"
                    />
                  </div>
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] text-sm cursor-pointer focus:outline-none focus:border-[var(--accent-hover)] appearance-none transition-all"
                  >
                    {ACTION_FILTERS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setActivitySortAsc(!activitySortAsc)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-secondary)] text-sm hover:border-[var(--accent-hover)] transition-all cursor-pointer whitespace-nowrap"
                  >
                    {activitySortAsc ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {activitySortAsc ? 'Oldest First' : 'Newest First'}
                  </button>
                  <button
                    onClick={fetchActivityLogs}
                    disabled={activityLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent-bright)] hover:bg-[var(--accent-10)] transition-all cursor-pointer disabled:opacity-50"
                    title="Refresh activity log"
                  >
                    <RefreshCw size={16} className={activityLoading ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>

                <p className="text-sm text-[var(--text-muted)] mb-3">
                  {activityTotalCount} {activityTotalCount === 1 ? 'entry' : 'entries'} found
                </p>

                {activityLoading ? (
                  <div className="py-12">
                    <LoadingSpinner size="medium" message="Loading activity logs..." />
                  </div>
                ) : activityLogs.length === 0 ? (
                  <p className="text-center text-[var(--text-muted)] py-12 text-base">No activity logs found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-center text-[var(--text-muted)] text-sm uppercase tracking-wider border-b border-[var(--accent-15)]">
                          <th className="pb-3 pr-4 text-center">Date/Time</th>
                          <th className="pb-3 pr-4 text-center">User</th>
                          <th className="pb-3 pr-4 text-center hidden md:table-cell">Email</th>
                          <th className="pb-3 pr-4 text-center">Action</th>
                          <th className="pb-3 pr-4 text-center hidden lg:table-cell">Story Type</th>
                          <th className="pb-3 text-left hidden lg:table-cell">Preview</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityLogs.map((log) => (
                          <AnimatePresence key={log.id}>
                            <motion.tr
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="border-b border-[var(--accent-10)] transition-all duration-200 ease-in-out cursor-pointer text-sm"
                              onClick={() => setActivityExpandedRow(activityExpandedRow === log.id ? null : log.id)}
                              style={{
                                borderLeft: `3px solid ${ACTION_BORDER_COLORS[log.action_type] || 'var(--accent-30)'}`,
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
                              <td className="py-3 pr-4 text-center text-[var(--text-secondary)] whitespace-nowrap">
                                {formatDateReadable(log.created_at)}
                              </td>
                              <td className="py-3 pr-4 text-center text-[var(--text-primary)] font-medium">
                                {log.user_name}
                              </td>
                              <td className="py-3 pr-4 text-center hidden md:table-cell">
                                <span className="inline-block max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-[var(--text-muted)]" title={log.user_email}>
                                  {log.user_email}
                                </span>
                              </td>
                              <td className="py-3 pr-4 text-center">
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
                              <td className="py-3 pr-4 text-center text-[var(--text-muted)] capitalize hidden lg:table-cell">
                                {log.story_type?.replace(/_/g, ' ') || '\u2014'}
                              </td>
                              <td className="py-3 text-left text-[var(--text-muted)] max-w-[200px] truncate hidden lg:table-cell">
                                {log.output_preview || '\u2014'}
                              </td>
                            </motion.tr>

                            {activityExpandedRow === log.id && (
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

                {activityTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-[var(--accent-15)]">
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => setActivityPage(Math.max(1, activityPage - 1))}
                      disabled={activityPage <= 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </Button>
                    <span className="text-sm text-[var(--text-muted)]">
                      Page {activityPage} of {activityTotalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => setActivityPage(Math.min(activityTotalPages, activityPage + 1))}
                      disabled={activityPage >= activityTotalPages}
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
        </AnimatePresence>

        {/* Promote/Demote Confirmation Modal */}
        <Modal
          isOpen={!!promoteTarget}
          onClose={() => setPromoteTarget(null)}
          title={promoteTarget?.currentRole === 'user' ? 'Promote to Admin' : 'Demote to User'}
          width="max-w-[460px]"
        >
          <div className="flex items-center gap-3 mb-4">
            <Crown
              size={28}
              style={{
                color: promoteTarget?.currentRole === 'user' ? '#eab308' : '#9ca3af',
              }}
            />
            <p className="text-[var(--text-secondary)] text-sm">
              {promoteTarget?.currentRole === 'user'
                ? `Promote ${promoteTarget?.name} to Team Admin? They will gain access to this Team Dashboard and team management features.`
                : `Demote ${promoteTarget?.name} from Admin to User? They will lose access to the Team Dashboard.`}
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
              {promoteTarget?.currentRole === 'user' ? 'Promote to Admin' : 'Demote to User'}
            </Button>
          </div>
        </Modal>
        {/* Remove from Team Confirmation Modal */}
        <Modal
          isOpen={!!removeTarget}
          onClose={() => setRemoveTarget(null)}
          title="Remove from Team"
          width="max-w-[460px]"
        >
          <div className="flex items-center gap-3 mb-4">
            <UserMinus
              size={28}
              style={{ color: '#ef4444' }}
            />
            <p className="text-[var(--text-secondary)] text-sm">
              Remove <strong>{removeTarget?.name}</strong> from <strong>{team?.name}</strong>? They will lose access to the team and its features.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" size="small" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleRemoveMember}
              disabled={!!actionLoading}
              className="!bg-[#ef4444] !border-[#ef4444] hover:!bg-[#dc2626]"
            >
              Remove
            </Button>
          </div>
        </Modal>
      </motion.div>
    </div>
  );
}
