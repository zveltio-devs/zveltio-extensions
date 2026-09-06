/**
 * The admin page offers seventeen settings. Eleven of them were write-only.
 *
 * An operator set `max_accounts_per_user`, `auto_collect_contacts`,
 * `max_messages_sync` and eight others, the save answered success, the row was
 * written — and nothing anywhere read the value. This extension already had that
 * defect on record once: the note in `index.ts` calls `sync_interval_minutes`
 * "a knob that looked like a schedule and was not one". It was eleven more of
 * them, in the same file.
 *
 * The last test in this file is the one that matters. A one-off measurement goes
 * stale the first time someone adds a setting; this re-derives the partition
 * from the source on every run, so a new write-only knob fails the suite and an
 * implemented one stops being advertised as missing.
 *
 * It also has to see COMPUTED keys. The `oauth2_*` family is reached as
 * ``config[`oauth2_${provider}_client_id`]``, and my first pass at this
 * measurement — a literal string search — reported all four as dead. They are
 * not. That mistake is the reason the check below matches on the key's tail as
 * well as the whole key.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  UNIMPLEMENTED_SETTINGS,
  enabledSetting,
  intSetting,
  parseMailConfig,
} from './config.js';

describe('parseMailConfig — rows written before the ::text::jsonb fix', () => {
  test('an object comes back as itself', () => {
    expect(parseMailConfig({ enabled: true })).toEqual({ enabled: true });
  });

  test('a JSON string scalar — what the old `::jsonb` write stored — is parsed', () => {
    expect(parseMailConfig('{"max_messages_sync":500}')).toEqual({ max_messages_sync: 500 });
  });

  test('a string that is not JSON gives an empty config, not a crash', () => {
    expect(parseMailConfig('not json at all')).toEqual({});
  });

  test('a JSON string holding a non-object gives an empty config', () => {
    // `"[1,2,3]"` and `"7"` parse fine and are not configurations. Spreading
    // either of them over the existing config is how this extension lost every
    // mail setting on the second save.
    expect(parseMailConfig('[1,2,3]')).toEqual({});
    expect(parseMailConfig('7')).toEqual({});
  });

  test('null and undefined give an empty config', () => {
    expect(parseMailConfig(null)).toEqual({});
    expect(parseMailConfig(undefined)).toEqual({});
  });
});

describe('intSetting — an absent limit is not a limit of zero', () => {
  test('a positive integer is used', () => {
    expect(intSetting({ max_accounts_per_user: 3 }, 'max_accounts_per_user', 0)).toBe(3);
  });

  test('absent, null, zero, negative and fractional all fall back', () => {
    // Zero matters most: read literally it means "you may have no mail accounts",
    // which is never what an unset setting means.
    for (const v of [undefined, null, 0, -5, 2.5, '', 'many', {}, true]) {
      expect(intSetting({ k: v }, 'k', 42)).toBe(42);
    }
  });

  test('a numeric string is accepted, because jsonb round-trips are not typed', () => {
    expect(intSetting({ k: '500' }, 'k', 50)).toBe(500);
  });
});

describe('enabledSetting — only an explicit false turns a feature off', () => {
  test('unset means on, so repairing a dead knob is not a behaviour change', () => {
    expect(enabledSetting({}, 'auto_collect_contacts')).toBe(true);
    expect(enabledSetting({ auto_collect_contacts: undefined }, 'auto_collect_contacts')).toBe(true);
  });

  test('false means off', () => {
    expect(enabledSetting({ auto_collect_contacts: false }, 'auto_collect_contacts')).toBe(false);
  });

  test('true means on', () => {
    expect(enabledSetting({ auto_collect_contacts: true }, 'auto_collect_contacts')).toBe(true);
  });
});

describe('every setting the admin page offers is either honoured or declared missing', () => {
  const ENGINE = join(import.meta.dir, '..');

  function sources(): Record<string, string> {
    const out: Record<string, string> = {};
    const add = (rel: string) => {
      out[rel] = readFileSync(join(ENGINE, rel), 'utf8');
    };
    add('routes.ts');
    add('index.ts');
    for (const f of readdirSync(join(ENGINE, 'lib'))) {
      if (f.endsWith('.ts') && !f.endsWith('.test.ts')) add(`lib/${f}`);
    }
    return out;
  }

  /** Keys the `PUT /admin/config` validator accepts. */
  function advertisedSettings(routes: string): string[] {
    const block = /app\.put\(\s*'\/admin\/config'[\s\S]*?\)\),\s*async/.exec(routes);
    expect(block).not.toBeNull();
    return [...block![0].matchAll(/^\s{4}(\w+):\s*z\./gm)].map((m) => m[1]!);
  }

  /**
   * Is this setting consulted anywhere?
   *
   * Comment lines are excluded — a key NAMED in a note explaining that nothing
   * reads it would otherwise count as a reader, which would make this whole test
   * self-defeating. `config.ts` is excluded for the same reason: it is where the
   * missing list lives.
   */
  function isRead(key: string, files: Record<string, string>): boolean {
    // The `oauth2_gmail_client_id` family is reached by a computed key, so the
    // tail after the provider is what appears in the source.
    const tail = key.replace(/^oauth2_(gmail|outlook)_/, '');
    for (const [name, body] of Object.entries(files)) {
      if (name === 'lib/config.ts') continue;
      for (const line of body.split('\n')) {
        const t = line.trim();
        if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) continue;
        if (new RegExp(`^\\s{4}${key}:\\s*z\\.`).test(line)) continue; // the validator
        if (line.includes(key)) return true;
        if (tail !== key && line.includes(`_${tail}\``)) return true; // computed
      }
    }
    return false;
  }

  test('the partition is exactly what UNIMPLEMENTED_SETTINGS says', () => {
    const files = sources();
    const advertised = advertisedSettings(files['routes.ts']!);
    expect(advertised.length).toBeGreaterThan(10);

    const declaredMissing = new Set<string>(UNIMPLEMENTED_SETTINGS);
    const actuallyDead = advertised.filter((k) => !isRead(k, files));

    // A new setting nobody wired up. Add the reader, or add it to
    // UNIMPLEMENTED_SETTINGS so `GET /admin/config` stops promising it.
    expect(actuallyDead.filter((k) => !declaredMissing.has(k))).toEqual([]);

    // A setting listed as missing that something now reads. Take it off the
    // list, so the admin page stops calling a working control decoration.
    const deadSet = new Set(actuallyDead);
    expect([...declaredMissing].filter((k) => !deadSet.has(k))).toEqual([]);
  });

  test('every name on the missing list is a setting the page actually offers', () => {
    const files = sources();
    const advertised = new Set(advertisedSettings(files['routes.ts']!));
    for (const k of UNIMPLEMENTED_SETTINGS) expect(advertised.has(k)).toBe(true);
  });
});
