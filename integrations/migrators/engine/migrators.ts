// Names and helpers the actions, the jobs and the import action share.

export const CONNECTIONS = 'migrator_connections';
export const FETCHES = 'migrator_fetches';
export const RUNS = 'migrator_runs';

/** Rows one fetch may hold: the import action writes them in one request. */
export const MAX_ROWS = 1000;

/** Source field name → safe snake_case field name. */
export function toColumn(field: string): string {
  // Diacritics dropped, not the letter: 'Preț' is `pret`, not `pre`.
  const c = field
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  return /^[a-z_]/.test(c) ? c : `f_${c}`;
}

// biome-ignore lint/suspicious/noExplicitAny: source values are untyped
export function inferType(values: any[]): string {
  const present = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (present.length === 0) return 'text';
  if (present.every((v) => typeof v === 'boolean')) return 'boolean';
  if (present.every((v) => typeof v === 'number')) return 'decimal';
  if (present.every((v) => typeof v === 'string' && !Number.isNaN(Date.parse(v)) && /\d{4}-\d{2}-\d{2}/.test(v))) {
    return 'datetime';
  }
  return 'text';
}
