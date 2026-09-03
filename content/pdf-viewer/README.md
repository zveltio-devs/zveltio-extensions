# content/pdf-viewer

Inline PDF viewing for the Studio asset manager, client apps, and page-builder
blocks.

## What it renders with

The browser's own PDF viewer, in an `<iframe>`. Every browser the Studio
supports has one, it needs no dependency, and it is what this extension uses
unless you opt into the enhanced viewer below.

## Optional: the enhanced viewer

`PdfViewer.svelte` tries `@embedpdf/svelte-pdf-viewer` first and falls back to
the iframe when it is not installed. The package is **not** a dependency of this
extension or of either host — it pulls a WebAssembly engine, and that is weight
an installation should choose rather than inherit.

To enable it, install it in the host that renders the component:

```sh
bun add @embedpdf/svelte-pdf-viewer
```

Nothing else changes: the component picks it up on the next load, and removing
it again returns you to the iframe.

## The bug this file exists to prevent coming back

Until 2026-09-03 the dynamic import's `catch` set `error`, and `error` is the
**first** branch of the template — so the `<iframe>` fallback written three
branches below, for exactly this case, was unreachable. Since the package was
declared nowhere and installed nowhere, that catch ran every single time, and
the feature had only ever shown *"Could not load PDF viewer."*

The catch now logs and leaves the viewer null, which is what reaches the
fallback. `error` is kept for a document that genuinely cannot be shown; a
viewer that could not be loaded is not one.
