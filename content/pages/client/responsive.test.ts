import { describe, expect, test } from 'bun:test';
import { spanClasses, spanKey, styleKey, styleVars } from './responsive.js';

describe('width across sizes', () => {
  test('a block with only col_span keeps exactly the classes it always had', () => {
    // Phone full width, chosen width from tablet up. Any change here resizes
    // every page already stored.
    expect(spanClasses({ col_span: 8 })).toBe('col-span-12 sm:col-span-8');
  });

  test('no width at all is full width everywhere', () => {
    expect(spanClasses({})).toBe('col-span-12 sm:col-span-12');
  });

  test('a phone override replaces the full-width default', () => {
    expect(spanClasses({ col_span: 4, col_span_mobile: 6 })).toBe('col-span-6 sm:col-span-4');
  });

  test('a desktop override is added on top', () => {
    expect(spanClasses({ col_span: 6, col_span_desktop: 3 })).toBe(
      'col-span-12 sm:col-span-6 lg:col-span-3',
    );
  });

  test('all three sizes at once', () => {
    expect(spanClasses({ col_span_mobile: 12, col_span: 6, col_span_desktop: 4 })).toBe(
      'col-span-12 sm:col-span-6 lg:col-span-4',
    );
  });

  test('nonsense widths fall back rather than emitting a class that does not exist', () => {
    expect(spanClasses({ col_span: 99 })).toBe('col-span-12 sm:col-span-12');
    expect(spanClasses({ col_span: 'wide' })).toBe('col-span-12 sm:col-span-12');
  });
});

describe('style custom properties', () => {
  test('a base style becomes unsuffixed properties', () => {
    expect(styleVars({ style: { paddingTop: 24, backgroundColor: '#eee' } })).toBe(
      '--zv-pt:24px;--zv-bg:#eee',
    );
  });

  test('each size gets its own suffix', () => {
    const out = styleVars({
      style: { paddingTop: 8 },
      style_tablet: { paddingTop: 16 },
      style_desktop: { paddingTop: 32 },
    });
    expect(out).toBe('--zv-pt:8px;--zv-pt-sm:16px;--zv-pt-lg:32px');
  });

  test('a size that overrides nothing contributes nothing', () => {
    expect(styleVars({ style: { paddingTop: 8 }, style_tablet: {} })).toBe('--zv-pt:8px');
  });

  test('a block that styles nothing gets no attribute at all', () => {
    expect(styleVars({})).toBeUndefined();
    expect(styleVars({ style: {} })).toBeUndefined();
  });
});

describe('value validation', () => {
  test('a non-numeric length is dropped, not passed through', () => {
    // A custom property holding nonsense is inherited silently rather than
    // ignored loudly, so it has to be caught here.
    expect(styleVars({ style: { paddingTop: 'huge' } })).toBeUndefined();
  });

  test('a colour must look like a colour', () => {
    expect(styleVars({ style: { backgroundColor: '#a1b2c3' } })).toBe('--zv-bg:#a1b2c3');
    expect(styleVars({ style: { backgroundColor: 'rgb(1, 2, 3)' } })).toBe('--zv-bg:rgb(1, 2, 3)');
    expect(styleVars({ style: { backgroundColor: 'red' } })).toBe('--zv-bg:red');
  });

  test('a colour field cannot smuggle a declaration', () => {
    // The field is free text in the editor and the result lands in a style
    // attribute on a public page.
    expect(styleVars({ style: { backgroundColor: 'red;position:fixed;top:0' } })).toBeUndefined();
    expect(styleVars({ style: { backgroundColor: 'url(javascript:alert(1))' } })).toBeUndefined();
    expect(styleVars({ style: { backgroundColor: 'expression(alert(1))' } })).toBeUndefined();
  });

  test('alignment is an enumeration, not free text', () => {
    expect(styleVars({ style: { textAlign: 'center' } })).toBe('--zv-ta:center');
    expect(styleVars({ style: { textAlign: 'sideways' } })).toBeUndefined();
  });
});

describe('key naming', () => {
  test('style keys follow the size names', () => {
    expect(styleKey('base')).toBe('style');
    expect(styleKey('tablet')).toBe('style_tablet');
    expect(styleKey('desktop')).toBe('style_desktop');
  });

  test('col_span stays the tablet key, so stored pages keep their shape', () => {
    expect(spanKey('tablet')).toBe('col_span');
    expect(spanKey('base')).toBe('col_span_mobile');
    expect(spanKey('desktop')).toBe('col_span_desktop');
  });
});
