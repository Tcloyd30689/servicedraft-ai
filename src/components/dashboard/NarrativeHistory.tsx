'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import LiquidCard from '@/components/ui/LiquidCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import NarrativeDetailModal from './NarrativeDetailModal';
import type { Narrative } from '@/types/database';

interface NarrativeHistoryProps {
  userId: string;
}

export default function NarrativeHistory({ userId }: NarrativeHistoryProps) {
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNarrative, setSelectedNarrative] = useState<Narrative | null>(null);

  const fetchNarratives = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('narratives')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch narratives:', error.message);
      } else if (data) {
        setNarratives(data as Narrative[]);
      }
    } catch (err) {
      console.error('Error fetching narratives:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNarratives();
  }, [fetchNarratives]);

  const filtered = narratives.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (n.ro_number && n.ro_number.toLowerCase().includes(q)) ||
      (n.vehicle_make && n.vehicle_make.toLowerCase().includes(q)) ||
      (n.vehicle_model && n.vehicle_model.toLowerCase().includes(q)) ||
      (n.concern && n.concern.toLowerCase().includes(q)) ||
      (n.vehicle_year && String(n.vehicle_year).includes(q))
    );
  });

  return (
    <LiquidCard size="standard">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Saved Narratives</h2>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search narratives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-hover)] transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-8">
          <LoadingSpinner size="small" message="Loading saved narratives..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-muted)]">
          {narratives.length === 0
            ? 'No saved narratives yet. Generate and save a story to see it here.'
            : 'No narratives match your search.'}
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--accent-15)]">
                <th className="text-left py-2 px-2 text-[var(--text-secondary)] font-medium">Date</th>
                <th className="text-left py-2 px-2 text-[var(--text-secondary)] font-medium">Time</th>
                <th className="text-left py-2 px-2 text-[var(--text-secondary)] font-medium">R.O. #</th>
                <th className="text-left py-2 px-2 text-[var(--text-secondary)] font-medium">Year</th>
                <th className="text-left py-2 px-2 text-[var(--text-secondary)] font-medium">Make</th>
                <th className="text-left py-2 px-2 text-[var(--text-secondary)] font-medium">Model</th>
                <th className="text-left py-2 px-2 text-[var(--text-secondary)] font-medium">Saved Story</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => {
                const date = new Date(n.created_at);
                const preview = (n.concern || n.full_narrative || '').slice(0, 30);
                return (
                  <tr
                    key={n.id}
                    onClick={() => setSelectedNarrative(n)}
                    className="border-b border-[var(--accent-8)] hover:bg-[var(--accent-5)] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-2 text-[var(--text-muted)]">{date.toLocaleDateString()}</td>
                    <td className="py-2.5 px-2 text-[var(--text-muted)]">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-2.5 px-2 text-[var(--text-primary)]">{n.ro_number || '—'}</td>
                    <td className="py-2.5 px-2 text-[var(--text-muted)]">{n.vehicle_year || '—'}</td>
                    <td className="py-2.5 px-2 text-[var(--text-muted)]">{n.vehicle_make || '—'}</td>
                    <td className="py-2.5 px-2 text-[var(--text-muted)]">{n.vehicle_model || '—'}</td>
                    <td className="py-2.5 px-2 text-[var(--text-muted)] truncate max-w-[150px]">
                      {preview}{preview.length >= 30 ? '...' : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <NarrativeDetailModal
        isOpen={!!selectedNarrative}
        onClose={() => setSelectedNarrative(null)}
        narrative={selectedNarrative}
      />
    </LiquidCard>
  );
}
