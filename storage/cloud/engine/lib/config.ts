/**
 * The extension's view of host configuration.
 *
 * Set once from `register()`. We hold the `ExtensionConfig` object rather than
 * copying values out of it because its accessors are live: storage settings
 * have an admin-editable overlay, and a snapshot taken at load would pin
 * whatever happened to be true at boot.
 */

import type { ExtensionConfig, ObjectStorageConfig } from '@zveltio/sdk/extension';

let _config: ExtensionConfig | undefined;

export function setConfig(config: ExtensionConfig | undefined): void {
  _config = config;
}

/** Object storage settings, or undefined when the instance has none. */
export function objectStorage(): ObjectStorageConfig | undefined {
  return _config?.objectStorage;
}

/** Base URL for user-facing links (share links). */
export function publicBaseUrl(): string {
  return _config?.publicUrl ?? 'http://localhost:3000';
}
