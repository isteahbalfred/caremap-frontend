import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  searchHistoryService,
  getActiveUserId,
  SearchHistoryEntry,
  SearchHistoryType,
} from '../../services/searchHistoryService';

const ICONS: Record<SearchHistoryType, string> = {
  medication: '💊',
  pharmacy: '🏪',
  clinic: '🏥',
  query: '🔍',
};

function timeAgo(ts: number): string {
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return "à l'instant";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `il y a ${diffD} j`;
  return new Date(ts).toLocaleDateString('fr-FR');
}

interface RecentSearchesProps {
  title?: string;
  /** Limite le nombre d'entrées affichées (par défaut : toutes) */
  limit?: number;
  className?: string;
}

export function RecentSearches({ title = 'Recherches récentes', limit, className = '' }: RecentSearchesProps) {
  const [entries, setEntries] = useState<SearchHistoryEntry[]>([]);
  const userId = getActiveUserId();

  useEffect(() => {
    setEntries(searchHistoryService.getAll(userId));
  }, [userId]);

  if (entries.length === 0) return null;

  const visible = limit ? entries.slice(0, limit) : entries;

  const handleClear = () => {
    searchHistoryService.clear(userId);
    setEntries([]);
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <button onClick={handleClear} className="text-xs text-gray-400 hover:text-red-500">
          Effacer
        </button>
      </div>
      <div className="space-y-1">
        {visible.map((e) => {
          const content = (
            <>
              <span className="text-lg leading-none">{ICONS[e.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{e.label}</p>
                {e.subtitle && <p className="text-xs text-gray-500 truncate">{e.subtitle}</p>}
              </div>
              <span className="text-xs text-gray-400 shrink-0">{timeAgo(e.timestamp)}</span>
            </>
          );
          return e.url ? (
            <Link
              key={e.id}
              to={e.url}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {content}
            </Link>
          ) : (
            <div key={e.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}