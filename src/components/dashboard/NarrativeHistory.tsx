'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, X, ArrowDown, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import LiquidCard from '@/components/ui/LiquidCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import NarrativeDetailModal from './NarrativeDetailModal';
import type { Narrative } from '@/types/database';

interface NarrativeHistoryProps {
  userId: string;
}

type SortOption = 'date-newest' | 'date-oldest' | 'vehicle-az' | 'ro-asc';
type FilterOption = 'all' | 'diagnostic_only' | 'repair_complete';

const SORT_OPTIONS: { key: SortOption; label: string; icon: 'up' | 'down' }[] = [
  { key: 'date-newest', label: 'Date (Newest)', icon: 'down' },
  { key: 'date-oldest', label: 'Date (Oldest)', icon: 'up' },
  { key: 'vehicle-az', label: 'Vehicle (A-Z)', icon: 'down' },
  { key: 'ro-asc', label: 'R.O. # (Asc)', icon: 'up' },
];

const FILTER_OPTIONS: { key: FilterOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'diagnostic_only', label: 'Diagnostic Only' },
  { key: 'repair_complete', label: 'Repair Complete' },
];

export default function NarrativeHistory({ userId }: NarrativeHistoryProps) {
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeSort, setActiveSort] = useState<SortOption>('date-newest');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [selectedNarrative, setSelectedNarrative] = useState<Narrative | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchInput);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchInput]);

  const fetchNarratives = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('narratives')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

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

  // Filter + Search + Sort pipeline
  const processedNarratives = useMemo(() => {
    let result = [...narratives];

    // Filter by story_type
    if (activeFilter !== 'all') {
      result = result.filter((n) => n.story_type === activeFilter);
    }

    // Search across all visible columns
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter((n) => {
        const dateStr = new Date(n.updated_at || n.created_at).toLocaleDateString().toLowerCase();
        return (
          (n.ro_number && n.ro_number.toLowerCase().includes(q)) ||
          (n.vehicle_year && String(n.vehicle_year).includes(q)) ||
          (n.vehicle_make && n.vehicle_make.toLowerCase().includes(q)) ||
          (n.vehicle_model && n.vehicle_model.toLowerCase().includes(q)) ||
          (n.concern && n.concern.toLowerCase().includes(q)) ||
          (n.cause && n.cause.toLowerCase().includes(q)) ||
          (n.correction && n.correction.toLowerCase().includes(q)) ||
          dateStr.includes(q)
        );
      });
    }

    // Sort
    switch (activeSort) {
      case 'date-newest':
        result.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
        break;
      case 'date-oldest':
        result.sort((a, b) => new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime());
        break;
      case 'vehicle-az':
        result.sort((a, b) => {
          const makeA = (a.vehicle_make || '').toLowerCase();
          const makeB = (b.vehicle_make || '').toLowerCase();
          if (makeA !== makeB) return makeA.localeCompare(makeB);
          return (a.vehicle_model || '').toLowerCase().localeCompare((b.vehicle_model || '').toLowerCase());
        });
        break;
      case 'ro-asc':
        result.sort((a, b) => (a.ro_number || '').localeCompare(b.ro_number || '', undefined, { numeric: true }));
        break;
    }

    return result;
  }, [narratives, debouncedQuery, activeSort, activeFilter]);

  const clearAllFilters = () => {
    setSearchInput('');
    setDebouncedQuery('');
    setActiveSort('date-newest');
    setActiveFilter('all');
  };

  const hasActiveFilters = searchInput.trim() !== '' || activeFilter !== 'all';

  return (
    <LiquidCard size="standard">
      {/* Sticky search/sort/filter header */}
      <div
        className="sticky top-0 z-10 pb-3 -mx-6 px-6 pt-1"
        style={{ backgroundColor: 'var(--bg-card-glass, transparent)' }}
      >
        {/* Title + Search row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Saved Narratives</h2>

          {/* Enhanced Search Input */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search narratives..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-hover)] transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setDebouncedQuery(''); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Sort Buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          {SORT_OPTIONS.map((opt) => {
            const isActive = activeSort === opt.key;
            const ArrowIcon = opt.icon === 'up' ? ArrowUp : ArrowDown;
            return (
              <motion.button
                key={opt.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveSort(opt.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--bg-input)',
                  color: isActive ? 'var(--btn-text-on-accent)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--accent-border)',
                }}
              >
                <ArrowIcon size={12} />
                {opt.label}
              </motion.button>
            );
          })}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = activeFilter === opt.key;
            return (
              <motion.button
                key={opt.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilter(opt.key)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--accent-8)' : 'transparent',
                  color: isActive ? 'var(--accent-vivid)' : 'var(--text-muted)',
                  border: isActive ? '1px solid var(--accent-vivid)' : '1px solid var(--accent-15)',
                }}
              >
                {opt.label}
              </motion.button>
            );
          })}
        </div>

        {/* Results Count */}
        <div className="text-xs text-[var(--text-muted)]">
          {loading ? null : processedNarratives.length === narratives.length ? (
            <span>Showing {narratives.length} narrative{narratives.length !== 1 ? 's' : ''}</span>
          ) : (
            <span>Showing {processedNarratives.length} of {narratives.length} narratives</span>
          )}
        </div>
      </div>

      {/* Table / Empty State */}
      {loading ? (
        <div className="py-8">
          <LoadingSpinner size="small" message="Loading saved narratives..." />
        </div>
      ) : processedNarratives.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-muted)]">
          {narratives.length === 0 ? (
            'No saved narratives yet. Generate and save a story to see it here.'
          ) : (
            <div className="space-y-3">
              <p>No matching narratives found</p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    border: '1px solid var(--accent-border)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'transparent',
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
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
              <AnimatePresence mode="popLayout">
                {processedNarratives.map((n) => {
                  const date = new Date(n.updated_at || n.created_at);
                  const preview = (n.concern || n.full_narrative || '').slice(0, 30);
                  return (
                    <motion.tr
                      key={n.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
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
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
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
