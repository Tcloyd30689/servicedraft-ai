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

  if (!profile || profile.role !== 'admin') return null;
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
    const range = searchParams.get('range') || '14'; // days for chart data
    const rangeDays = parseInt(range, 10) || 14;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const rangeStart = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000).toISOString();

    // Run all queries in parallel
    const [
      totalUsersRes,
      newUsersWeekRes,
      activeSubsRes,
      totalNarrativesRes,
      narrativesWeekRes,
      narrativesTodayRes,
      activityByTypeRes,
      dailyNarrativesRes,
      topUsersRes,
      storyTypeRes,
    ] = await Promise.all([
      // 1. Total registered users
      svc.from('users').select('id', { count: 'exact', head: true }),

      // 2. New users this week
      svc.from('users').select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo),

      // 3. Active subscriptions (active OR bypass)
      svc.from('users').select('id', { count: 'exact', head: true })
        .in('subscription_status', ['active', 'bypass']),

      // 4. Total narratives all-time
      svc.from('narratives').select('id', { count: 'exact', head: true }),

      // 5. Narratives this week
      svc.from('narratives').select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo),

      // 6. Narratives today
      svc.from('narratives').select('id', { count: 'exact', head: true })
        .gte('created_at', startOfToday),

      // 7. Activity by type (last 30 days)
      svc.from('activity_log').select('action_type')
        .gte('created_at', thirtyDaysAgo),

      // 8. Daily narrative counts for chart (based on range)
      svc.from('narratives').select('created_at')
        .gte('created_at', rangeStart),

      // 9. Top 5 users by narrative count
      svc.from('narratives').select('user_id'),

      // 10. Story type breakdown
      svc.from('narratives').select('story_type'),
    ]);

    // 7. Aggregate activity by type
    const activityByType: Record<string, number> = {};
    (activityByTypeRes.data || []).forEach((row: { action_type: string }) => {
      activityByType[row.action_type] = (activityByType[row.action_type] || 0) + 1;
    });

    // 8. Aggregate daily narratives
    const dailyCounts: Record<string, number> = {};
    // Initialize all days in range to 0
    for (let i = rangeDays - 1; i >= 0; i--) {
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

    // 9. Top 5 users by narrative count
    const userNarrativeCounts: Record<string, number> = {};
    (topUsersRes.data || []).forEach((row: { user_id: string }) => {
      userNarrativeCounts[row.user_id] = (userNarrativeCounts[row.user_id] || 0) + 1;
    });
    const topUserIds = Object.entries(userNarrativeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Fetch user details for top 5
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

    // 10. Story type breakdown
    const storyTypes: Record<string, number> = { diagnostic_only: 0, repair_complete: 0 };
    (storyTypeRes.data || []).forEach((row: { story_type: string }) => {
      if (row.story_type && storyTypes[row.story_type] !== undefined) {
        storyTypes[row.story_type]++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: totalUsersRes.count ?? 0,
        newUsersWeek: newUsersWeekRes.count ?? 0,
        activeSubscriptions: activeSubsRes.count ?? 0,
        totalNarratives: totalNarrativesRes.count ?? 0,
        narrativesWeek: narrativesWeekRes.count ?? 0,
        narrativesToday: narrativesTodayRes.count ?? 0,
        activityByType,
        dailyNarratives,
        topUsers,
        storyTypes,
      },
    });
  } catch (err) {
    console.error('Analytics API error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
