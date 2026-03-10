import { NextResponse } from 'next/server';
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

async function verifyOwner() {
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

export async function GET(request: Request) {
  try {
    const owner = await verifyOwner();
    if (!owner) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30';

    const svc = createServiceClient();

    // Build date filter
    let dateFilter: string | null = null;
    if (range !== 'all') {
      const days = parseInt(range, 10);
      if (!isNaN(days) && days > 0) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        dateFilter = cutoff.toISOString();
      }
    }

    // Query all usage logs within range
    let query = svc.from('api_usage_log').select('*').order('created_at', { ascending: false });
    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }
    const { data: logs, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const rows = logs || [];

    // Aggregate totals
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    let totalEstimatedCost = 0;

    // Current month filter
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let currentMonthCost = 0;

    // Usage by day
    const byDay: Record<string, { promptTokens: number; completionTokens: number; totalTokens: number; cost: number; requestCount: number }> = {};

    // Usage by action
    const byAction: Record<string, { promptTokens: number; completionTokens: number; totalTokens: number; cost: number; count: number }> = {};

    // Usage by user
    const byUser: Record<string, { promptTokens: number; completionTokens: number; cost: number; count: number }> = {};

    for (const row of rows) {
      const prompt = row.prompt_tokens || 0;
      const completion = row.completion_tokens || 0;
      const total = row.total_tokens || 0;
      const cost = parseFloat(row.estimated_cost_usd) || 0;

      totalPromptTokens += prompt;
      totalCompletionTokens += completion;
      totalTokens += total;
      totalEstimatedCost += cost;

      // Current month cost
      if (new Date(row.created_at) >= monthStart) {
        currentMonthCost += cost;
      }

      // By day
      const day = row.created_at.substring(0, 10); // YYYY-MM-DD
      if (!byDay[day]) {
        byDay[day] = { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0, requestCount: 0 };
      }
      byDay[day].promptTokens += prompt;
      byDay[day].completionTokens += completion;
      byDay[day].totalTokens += total;
      byDay[day].cost += cost;
      byDay[day].requestCount += 1;

      // By action
      const action = row.action_type || 'unknown';
      if (!byAction[action]) {
        byAction[action] = { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0, count: 0 };
      }
      byAction[action].promptTokens += prompt;
      byAction[action].completionTokens += completion;
      byAction[action].totalTokens += total;
      byAction[action].cost += cost;
      byAction[action].count += 1;

      // By user
      const uid = row.user_id || 'unknown';
      if (!byUser[uid]) {
        byUser[uid] = { promptTokens: 0, completionTokens: 0, cost: 0, count: 0 };
      }
      byUser[uid].promptTokens += prompt;
      byUser[uid].completionTokens += completion;
      byUser[uid].cost += cost;
      byUser[uid].count += 1;
    }

    // Sort by day chronologically
    const usageByDay = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    // Sort by action by total tokens desc
    const usageByAction = Object.entries(byAction)
      .sort(([, a], [, b]) => b.totalTokens - a.totalTokens)
      .map(([actionType, data]) => ({ actionType, ...data }));

    // Top 10 users by token usage
    const topUserEntries = Object.entries(byUser)
      .sort(([, a], [, b]) => (b.promptTokens + b.completionTokens) - (a.promptTokens + a.completionTokens))
      .slice(0, 10);

    // Get user names for top users
    const topUserIds = topUserEntries.map(([uid]) => uid).filter((uid) => uid !== 'unknown');
    let userNameMap: Record<string, string> = {};
    if (topUserIds.length > 0) {
      const { data: userRows } = await svc
        .from('users')
        .select('id, first_name, last_name')
        .in('id', topUserIds);

      (userRows || []).forEach((u: { id: string; first_name: string | null; last_name: string | null }) => {
        const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unknown';
        userNameMap[u.id] = name;
      });
    }

    const usageByUser = topUserEntries.map(([userId, data]) => ({
      userId,
      userName: userNameMap[userId] || 'Unknown',
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      cost: data.cost,
      count: data.count,
    }));

    const totalRequests = rows.length;
    const averageCostPerRequest = totalRequests > 0 ? totalEstimatedCost / totalRequests : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalPromptTokens,
        totalCompletionTokens,
        totalTokens,
        totalEstimatedCost,
        totalRequests,
        currentMonthCost,
        averageCostPerRequest,
        usageByDay,
        usageByAction,
        usageByUser,
      },
    });
  } catch (err) {
    console.error('Usage API error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
