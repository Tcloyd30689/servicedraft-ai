import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service role configuration');
  }
  return createClient(url, serviceKey);
}

async function verifyAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'owner') return null;
  return { userId: user.id };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const svc = createServiceClient();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30';
    const rangeDays = range === 'all' ? 3650 : (parseInt(range, 10) || 30);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const rangeStart = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000).toISOString();

    // Run all queries in parallel
    const [
      totalUsersRes,
      newUsersWeekRes,
      newUsersMonthRes,
      activeSubsRes,
      totalNarrativesRes,
      narrativesWeekRes,
      narrativesTodayRes,
      allActivityRes,
      rangeActivityRes,
      dailyNarrativesRes,
      topUsersRes,
      storyTypeRes,
      subscriptionRes,
      savedTemplatesRes,
      totalActivityRes,
      lastActivityRes,
    ] = await Promise.all([
      // 1. Total registered users
      svc.from('users').select('id', { count: 'exact', head: true }),

      // 2. New users this week
      svc.from('users').select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo),

      // 3. New users this month (30 days)
      svc.from('users').select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo),

      // 4. Active subscriptions (active OR bypass)
      svc.from('users').select('id', { count: 'exact', head: true })
        .in('subscription_status', ['active', 'bypass']),

      // 5. Total narratives all-time
      svc.from('narratives').select('id', { count: 'exact', head: true }),

      // 6. Narratives this week
      svc.from('narratives').select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo),

      // 7. Narratives today
      svc.from('narratives').select('id', { count: 'exact', head: true })
        .gte('created_at', startOfToday),

      // 8. All activity (for type counts and totals — all-time)
      svc.from('activity_log').select('action_type'),

      // 9. Activity within range (for charts — includes action_type + created_at)
      svc.from('activity_log').select('action_type, created_at')
        .gte('created_at', rangeStart),

      // 10. Daily narrative counts for chart (based on range)
      svc.from('narratives').select('created_at')
        .gte('created_at', rangeStart),

      // 11. Top 10 users by narrative count
      svc.from('narratives').select('user_id'),

      // 12. Story type breakdown
      svc.from('narratives').select('story_type'),

      // 13. Subscription breakdown
      svc.from('users').select('subscription_status'),

      // 14. Total saved templates
      svc.from('saved_repairs').select('id', { count: 'exact', head: true }),

      // 15. Total activity log rows (system health)
      svc.from('activity_log').select('id', { count: 'exact', head: true }),

      // 16. Last activity timestamp (system health)
      svc.from('activity_log').select('created_at')
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    // 8. Aggregate activity by type (all-time) + compute specific totals
    const activityByType: Record<string, number> = {};
    let totalGenerations = 0;
    let totalExports = 0;
    let totalProofreads = 0;
    let totalCustomizations = 0;

    const exportTypes = ['export_copy', 'export_print', 'export_pdf', 'export_docx'];

    (allActivityRes.data || []).forEach((row: { action_type: string }) => {
      activityByType[row.action_type] = (activityByType[row.action_type] || 0) + 1;

      if (row.action_type === 'generate' || row.action_type === 'regenerate') {
        totalGenerations++;
      } else if (exportTypes.includes(row.action_type)) {
        totalExports++;
      } else if (row.action_type === 'proofread') {
        totalProofreads++;
      } else if (row.action_type === 'customize') {
        totalCustomizations++;
      }
    });

    // 9. Aggregate activity by day (range-based) — total + by action type
    const displayDays = Math.min(rangeDays, 365); // cap display at 365 days for all-time
    const activityDailyCounts: Record<string, number> = {};
    const activityByTypeByDay: Record<string, Record<string, number>> = {};

    for (let i = displayDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      activityDailyCounts[key] = 0;
      activityByTypeByDay[key] = {};
    }

    (rangeActivityRes.data || []).forEach((row: { action_type: string; created_at: string }) => {
      const key = row.created_at.split('T')[0];
      if (activityDailyCounts[key] !== undefined) {
        activityDailyCounts[key]++;
        activityByTypeByDay[key][row.action_type] = (activityByTypeByDay[key][row.action_type] || 0) + 1;
      }
    });

    const activityByDay = Object.entries(activityDailyCounts).map(([date, count]) => ({ date, count }));

    // Build stacked area data — each row has date + a key per action_type
    const allActionTypes = new Set<string>();
    Object.values(activityByTypeByDay).forEach((dayData) => {
      Object.keys(dayData).forEach((t) => allActionTypes.add(t));
    });

    const usageOverTime = Object.entries(activityByTypeByDay).map(([date, typeCounts]) => {
      const row: Record<string, string | number> = { date };
      allActionTypes.forEach((t) => {
        row[t] = typeCounts[t] || 0;
      });
      return row;
    });

    // 10. Aggregate daily narratives (range-based)
    const dailyCounts: Record<string, number> = {};
    for (let i = displayDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyCounts[key] = 0;
    }
    (dailyNarrativesRes.data || []).forEach((row: { created_at: string }) => {
      const key = row.created_at.split('T')[0];
      if (dailyCounts[key] !== undefined) {
        dailyCounts[key]++;
      }
    });
    const dailyNarratives = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

    // 11. Top 10 users by narrative count
    const userNarrativeCounts: Record<string, number> = {};
    (topUsersRes.data || []).forEach((row: { user_id: string }) => {
      userNarrativeCounts[row.user_id] = (userNarrativeCounts[row.user_id] || 0) + 1;
    });
    const topUserIds = Object.entries(userNarrativeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    let topUsers: Array<{ rank: number; name: string; position: string; count: number }> = [];
    if (topUserIds.length > 0) {
      const { data: userProfiles } = await svc
        .from('users')
        .select('id, first_name, last_name, position')
        .in('id', topUserIds.map(([id]) => id));

      const profileMap: Record<string, { name: string; position: string }> = {};
      (userProfiles || []).forEach((u: { id: string; first_name: string | null; last_name: string | null; position: string | null }) => {
        profileMap[u.id] = {
          name: [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unknown',
          position: u.position || '—',
        };
      });

      topUsers = topUserIds.map(([userId, count], i) => ({
        rank: i + 1,
        name: profileMap[userId]?.name || 'Unknown',
        position: profileMap[userId]?.position || '—',
        count,
      }));
    }

    // 12. Story type breakdown
    const storyTypes: Record<string, number> = { diagnostic_only: 0, repair_complete: 0 };
    (storyTypeRes.data || []).forEach((row: { story_type: string }) => {
      if (row.story_type && storyTypes[row.story_type] !== undefined) {
        storyTypes[row.story_type]++;
      }
    });

    // 13. Subscription breakdown
    const subscriptionBreakdown: Record<string, number> = {
      active: 0,
      trial: 0,
      expired: 0,
      bypass: 0,
    };
    (subscriptionRes.data || []).forEach((row: { subscription_status: string }) => {
      if (row.subscription_status && subscriptionBreakdown[row.subscription_status] !== undefined) {
        subscriptionBreakdown[row.subscription_status]++;
      }
    });

    // System health data
    const lastActivityTimestamp = lastActivityRes.data?.[0]?.created_at || null;

    const systemHealth = {
      dbRowCounts: {
        users: totalUsersRes.count ?? 0,
        narratives: totalNarrativesRes.count ?? 0,
        activity_log: totalActivityRes.count ?? 0,
        saved_repairs: savedTemplatesRes.count ?? 0,
      },
      lastActivityTimestamp,
      appVersion: 'v1.0.1-beta',
    };

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: totalUsersRes.count ?? 0,
        newUsersWeek: newUsersWeekRes.count ?? 0,
        newUsersMonth: newUsersMonthRes.count ?? 0,
        activeSubscriptions: activeSubsRes.count ?? 0,
        totalNarratives: totalNarrativesRes.count ?? 0,
        narrativesWeek: narrativesWeekRes.count ?? 0,
        narrativesToday: narrativesTodayRes.count ?? 0,
        totalGenerations,
        totalExports,
        totalProofreads,
        totalCustomizations,
        totalSavedTemplates: savedTemplatesRes.count ?? 0,
        activityByDay,
        activityByType,
        dailyNarratives,
        topUsers,
        storyTypes,
        subscriptionBreakdown,
        usageOverTime,
        actionTypes: Array.from(allActionTypes),
        systemHealth,
      },
    });
  } catch (err) {
    console.error('Analytics API error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
