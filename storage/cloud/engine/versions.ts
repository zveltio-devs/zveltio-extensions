import { ActionRefusal, type ExtensionAction, type HostCollections } from '@zveltio/sdk/extension';

// A file's version history is rows of `cloud_file_versions`, each naming a
// stored file of the engine: `file_id` is the file the history belongs to,
// `version_file_id` the file holding that version's bytes. Version 1 is the
// file itself. Nothing here decides who may read, add or remove a version: the
// engine's rules on the collection and on each stored file do.

type Row = Record<string, unknown>;

export const VERSIONS = 'cloud_file_versions';

/** Versions kept per file; older rows are pruned when a new one is added. */
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

/** A refusal the engine threw (a status below 500): the caller may not, so it is left as it is. */
const refused = (err: unknown) => {
  const status = (err as { status?: unknown }).status;
  return typeof status === 'number' && status < 500;
};

/**
 * A new version of `file_id`: the stored file the request hands in `$files.read`
 * and as `file` (ADR 0052) — a front end uploads it as the caller first. Reading
 * it through `host.files` is the check that it was handed and that the caller may
 * read it; no bytes move. Past KEEP_VERSIONS the oldest rows go, each only as far
 * as the caller may delete it; their files stay the caller's own.
 */
const addFileVersion: ExtensionAction = async (input, host) => {
  const { file_id, file, note } = input as { file_id: string; file: string; note?: string };
  // Present from engine 3.0.0-beta.123; the manifest asks for later.
  if (!host.files) throw new Error('This engine gives actions no host.files.');
  await host.files.read(file);
  const { row, versions } = await addVersion(host.collections, file_id, file, note || null);
  for (const old of versions.slice(KEEP_VERSIONS).reverse()) {
    try {
      await host.collections.delete(VERSIONS, String(old.id));
    } catch (err) {
      if (refused(err)) break;
      throw err;
    }
  }
  return row;
};

export const cloudActions = { restoreVersion, addFileVersion };
