# content/pdf-viewer

Two Svelte components for showing a PDF: `PdfViewer` (a URL) and `PdfBlock` (a
titled section wrapping it).

## What this extension is, and is not

It is a **component library**. Import it in your own page:

```svelte
<script>
  import { PdfViewer } from 'zveltio-extensions/content/pdf-viewer/client';
</script>

<PdfViewer src="/files/contract.pdf" height={800} />
```

It is **not** a page-builder block. `content/pages`' `BlockRenderer` handles
eighteen block types and `pdf` is not among them, so dropping a PDF into a page
through the builder is not something this extension makes possible today. The
manifest used to describe it as serving "page builder blocks"; that sentence was
never true, and it is corrected rather than implemented, because registering a
block type here would mean one extension reaching into another's renderer — a
design call, not a bug fix.

Measured, so the claim is not a guess: nothing in `packages/studio` or
`packages/client` imports `PdfViewer` or `PdfBlock`, and neither built bundle
contains a single byte of either component.

## What it renders with

The browser's own PDF viewer, in an `<iframe>`. Every browser the Studio supports
has one, it needs no dependency, and it is what you get unless you opt into the
enhanced viewer below. `toolbar={false}` reaches it through the standard
`#toolbar=0` PDF fragment, which Chromium and Edge honour.

## Optional: the enhanced viewer

`PdfViewer` tries `@embedpdf/svelte-pdf-viewer` first and falls back to the
iframe when it is absent. It is deliberately **not** a dependency of this
extension or of either host, and the numbers are why:

| | |
|---|---|
| install size | ~200 MB, 88 packages — mostly CJK fallback fonts |
| runtime | pulls Preact, a second UI framework, and a WebAssembly engine |
| in the bundle today | **nothing** — no host imports the component, so nothing is compiled in |

Installing it into a host that never renders the component buys 200 MB and zero
bytes of shipped code. If you are building an app that *does* render it:

```sh
bun add @embedpdf/svelte-pdf-viewer
```

The component picks it up on the next load; removing it returns you to the
iframe. The import is dynamic, so it lands in its own chunk — a page that never
shows a PDF never downloads it.

### One setting worth knowing

The component passes `fontFallback: null`. Left at its default, EmbedPDF fetches
substitute fonts from jsDelivr the first time a document needs one — an outbound
request to a third party, from a product whose buyers run it self-hosted
precisely so that does not happen. If you want the fallback, serve the fonts
yourself.

## Two bugs this file records

**The fallback was unreachable.** Until 2026-09-03 the dynamic import's `catch`
set `error`, and `error` is the *first* branch of the template — so the
`<iframe>` written three branches below, for exactly this case, could never run.
Since the package was declared nowhere, that catch ran every single time, and the
feature had only ever shown *"Could not load PDF viewer."*

**Two props were fiction.** `config={{ src, toolbar }}` passed `toolbar` into
`PDFViewerConfig`, which has no such key — the viewer's toolbar was never
controllable — and `mod.PDFViewer ?? mod.default` fell back to an export the
module does not have. Neither was visible while the package was absent: nothing
could typecheck a module nobody declared.
