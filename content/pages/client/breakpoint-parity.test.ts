/**
 * The editor and the renderer must name the same keys.
 *
 * `studio/src/lib/breakpoints.ts` is a deliberate copy of the key mapping in
 * `client/responsive.ts`, because a studio-tree file cannot import outside
 * `studio/src/`. This test is what makes the copy safe: it imports both and
 * compares them, so a rename in one is a failure rather than a control that
 * silently writes a key nothing reads.
 */

import { describe, expect, test } from 'bun:test';
import { BREAKPOINTS, spanKey, styleKey } from './responsive.js';
import {
  BREAKPOINTS as EDITOR_BREAKPOINTS,
  spanKey as editorSpanKey,
  styleKey as editorStyleKey,
} from '../studio/src/lib/breakpoints.js';

describe('breakpoint key parity', () => {
  test('both sides know the same sizes, in the same order', () => {
    expect([...EDITOR_BREAKPOINTS]).toEqual([...BREAKPOINTS]);
  });

  test('the style key agrees for every size', () => {
    for (const bp of BREAKPOINTS) expect(editorStyleKey(bp)).toBe(styleKey(bp));
  });

  test('the width key agrees for every size', () => {
    for (const bp of BREAKPOINTS) expect(editorSpanKey(bp)).toBe(spanKey(bp));
  });
});
