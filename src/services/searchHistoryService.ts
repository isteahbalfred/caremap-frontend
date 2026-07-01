export type SearchHistoryType = 'medication' | 'pharmacy' | 'clinic' | 'query';

export interface SearchHistoryEntry {
  id: string;
  type: SearchHistoryType;
  label: string;
  subtitle?: string;
  /** Lien direct vers la fiche (ex: /medication/12). Absent pour une simple requête texte. */
  url?: string;
  timestamp: number;
}

const STORAGE_PREFIX = 'caremap_search_history';
const MAX_ENTRIES = 30;

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}_${userId}`;
}

function readAll(userId: string): SearchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(userId: string, entries: SearchHistoryEntry[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // Stockage plein ou indisponible (mode privé, etc.) : on ignore silencieusement
  }
}

export const searchHistoryService = {
  /**
   * Ajoute une entrée en tête d'historique (la plus récente en premier).
   * Supprime les doublons existants sur le même élément pour éviter de polluer
   * la liste si l'utilisateur revisite plusieurs fois la même fiche.
   */
  add(userId: string, entry: Omit<SearchHistoryEntry, 'id' | 'timestamp'>): SearchHistoryEntry {
    const all = readAll(userId);
    const deduped = all.filter((e) => !(e.type === entry.type && e.label === entry.label));
    const newEntry: SearchHistoryEntry = {
      ...entry,
      id: `${entry.type}-${entry.label}-${Date.now()}`,
      timestamp: Date.now(),
    };
    writeAll(userId, [newEntry, ...deduped]);

    // TODO backend : dès qu'un endpoint existe, décommenter pour synchroniser
    // l'historique côté serveur (utile pour le retrouver sur un autre appareil).
    // fetch('/api/search-history', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(newEntry),
    // }).catch(() => {});

    return newEntry;
  },

  getAll(userId: string): SearchHistoryEntry[] {
    return readAll(userId).sort((a, b) => b.timestamp - a.timestamp);
  },

  remove(userId: string, id: string) {
    writeAll(userId, readAll(userId).filter((e) => e.id !== id));
  },

  clear(userId: string) {
    writeAll(userId, []);
  },
};

/**
 * Détermine l'identifiant à utiliser pour namespacer l'historique.
 * Hypothèse : les infos utilisateur sont stockées sous la clé "caremap_user"
 * dans localStorage après connexion (adapte cette fonction à ton contexte
 * d'authentification réel si le nom de clé ou la source diffère, ex: Redux store).
 * Un visiteur non connecté partage le bucket "guest".
 */
export function getActiveUserId(): string {
  try {
    const raw = localStorage.getItem('caremap_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id) return String(parsed.id);
    }
  } catch {
    // ignore
  }
  return 'guest';
}