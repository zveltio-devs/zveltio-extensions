import { ActionRefusal, type ExtensionAction, type HostCollections } from '@zveltio/sdk/extension';

// A file's version history is rows of `cloud_file_versions`, each naming a
// stored file of the engine: `file_id` is the file the history belongs to,
// `version_file_id` the file holding that version's bytes. Version 1 is the
// file itself. Nothing here decides who may read, add or remove a version: the
// engine's rules on the collection and on each stored file do.

type Row = Record<string, unknown>;

export const VERSIONS = 'cloud_file_versions';

/** Versions kept per file; older ones are pruned when a new one is uploaded. */
export const KEEP_VERSIONS = 20;

/** The file's newest 500 versions the caller can read (the data API's page), newest first. */
export async function versionsOf(collections: HostCollections, fileId: string): Promise<Row[]> {
  const { records } = await collections.list(VERSIONS, {
    filter: { file_id: fileId },
    sort: 'version',
    order: 'desc',
    limit: 500,
    count: 'none',
  });
  return records as Row[];
}

/**
 * Record `versionFileId` as the next version of `fileId`. A file with no
 * history first gets version 1, itself. Two writers racing for the same number
 * meet the collection's unique key (409), and the later one rolls back.
 */
export async function addVersion(
  collections: HostCollections,
  fileId: string,
  versionFileId: string,
  note: string | null,
): Promise<{ row: Row; versions: Row[] }> {
  const versions = await versionsOf(collections, fileId);
  if (versions.length === 0) {
    versions.push(await collections.insert(VERSIONS, { file_id: fileId, version: 1, version_file_id: fileId }));
  }
  const row = await collections.insert(VERSIONS, {
    file_id: fileId,
    version: Number(versions[0]!.version) + 1,
    version_file_id: versionFileId,
    note,
  });
  return { row, versions: [row, ...versions] };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Restore: a new version pointing at an older version's file. No bytes move. */
const restoreVersion: ExtensionAction = async (input, host) => {
  const { version_id } = input as { version_id: string };
  const old = UUID.test(version_id) ? await host.collections.read(VERSIONS, version_id) : null;
  if (!old) throw new ActionRefusal(404, 'version_not_found', 'No such version.');
  const { row } = await addVersion(
    host.collections,
    String(old.file_id),
    String(old.version_file_id),
    `Restored from version ${old.version}`,
  );
  return row;
};

export const cloudActions = { restoreVersion };
