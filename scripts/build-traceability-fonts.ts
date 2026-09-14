#!/usr/bin/env bun
/**
 * Regenerates `operations/traceability/engine/services/fonts.generated.ts`.
 *
 * ── Why the font is data and not a file ───────────────────────
 *
 * The traceability labels need `ă`, `ș` and `ț`; pdf-lib's built-in faces
 * encode WinAnsi and have none of them. The obvious way to ship a font is to
 * put the `.ttf` beside the extension and read it at runtime — and that is
 * exactly what `check-ambient-authority` refuses. Its allow-list is empty and
 * its own note says the list should only ever shrink, so reading the file would
 * have made this the single extension in the catalogue reaching for the
 * filesystem, to load an asset it ships itself.
 *
 * So the glyphs travel as base64 in a generated module.
 *
 * ── Why the whole face, and not a subset ──────────────────────
 *
 * The first attempt pre-subset the faces with fontkit, which took them from
 * 759 KB to 21 KB — and produced fonts pdf-lib cannot embed. `createSubset()`
 * drops the `name` table, and `CustomFontEmbedder` reads
 * `font.name.records.postscriptName`, so every label threw
 * `undefined is not an object`. Subsetting twice takes away what the second
 * pass needs.
 *
 * Measured instead of assumed, and it makes the subset unnecessary: pdf-lib
 * subsets at EMBED time, so a label PDF is about 5 KB whichever face goes in.
 * The whole face costs bundle size, not document size.
 *
 * ── Why Mono ──────────────────────────────────────────────────
 *
 * DejaVu Sans Mono rather than DejaVu Sans, measured on both counts that
 * matter:
 *
 *   base64   Sans 1,012,960 + 945,228 ≈ 1.96 MB
 *            Mono   457,520 + 445,692 ≈ 0.90 MB
 *
 *   fit      every realistic label field renders on ONE line in the 180 pt
 *            column; widest sample 152 pt in Mono against 124 pt in Sans.
 *            Roughly 18% headroom — a longer supplier name wraps to a second
 *            line, which the renderer already handles.
 *
 * Monospace is also the conventional choice for a lot label. Both faces cover
 * every Romanian character, in the comma-below and the cedilla forms.
 *
 * ── The source faces ──────────────────────────────────────────
 *
 * `scripts/fonts/` — deliberately at repository level, because
 * `sync-to-registry.mjs` excludes a top-level `scripts` directory from the
 * published archive. The sources stay reproducible without travelling to every
 * installation. The LICENCE does ship, inside the extension, because
 * attribution is the condition under which shipping the glyphs is legitimate.
 *
 * Usage: bun scripts/build-traceability-fonts.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const SRC = join(ROOT, 'scripts', 'fonts');
const OUT = join(ROOT, 'operations/traceability/engine/services/fonts.generated.ts');

const wrap = (b64: string): string =>
  b64
    .match(/.{1,100}/g)!
    .map((line) => `  '${line}' +`)
    .join('\n')
    .replace(/ \+$/, '');

const regular = readFileSync(join(SRC, 'DejaVuSansMono.ttf'));
const bold = readFileSync(join(SRC, 'DejaVuSansMono-Bold.ttf'));

const header = `/**
 * DejaVu Sans Mono, base64-encoded.
 *
 * GENERATED — do not edit. Regenerate with:
 *   bun scripts/build-traceability-fonts.ts
 *
 * The bytes are here rather than in a file because extensions must not import
 * authority-bearing \`node:*\` modules, and they are whole rather than subset
 * because fontkit's subset drops the \`name\` table pdf-lib needs. pdf-lib
 * subsets at embed time, so a label PDF is about 5 KB either way. That script
 * carries the measurements.
 *
 * Licence: \`../../fonts/LICENSE-DejaVu.txt\`.
 */

/** Decodes without importing anything, which is the point. */
export function decodeFont(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const DEJAVU_MONO_BASE64 =
`;

writeFileSync(
  OUT,
  `${header}${wrap(regular.toString('base64'))};\n\nexport const DEJAVU_MONO_BOLD_BASE64 =\n${wrap(
    bold.toString('base64'),
  )};\n`,
  'utf8',
);

console.log(
  `✓ ${OUT.replace(`${ROOT}/`, '')} — regular ${regular.length} B, bold ${bold.length} B`,
);
