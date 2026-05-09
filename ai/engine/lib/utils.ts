/**
 * Generates a random ID using Bun/browser native crypto.getRandomValues().
 * Mirrors the engine's lib/utils.ts so AI routes don't need to import from engine internals.
 * @param size Number of characters (default 21, same as nanoid default)
 */
export function generateId(size: number = 21): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  const randomValues = new Uint8Array(size);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < size; i++) {
    id += chars[randomValues[i] % chars.length];
  }
  return id;
}
