import PdfAssetPreview from './components/PdfAssetPreview.svelte';

export default function register() {
  const zveltio = (window as any).__zveltio;
  if (!zveltio) return;

  zveltio.registerAssetPreview({
    match: (asset: { url: string; name?: string; mimeType?: string }) =>
      asset.mimeType === 'application/pdf' ||
      asset.name?.toLowerCase().endsWith('.pdf') ||
      asset.url?.toLowerCase().endsWith('.pdf'),
    component: PdfAssetPreview,
  });
}

register();
