import { registerAssetPreview } from '@zveltio/sdk/studio';
import PdfAssetPreview from './components/PdfAssetPreview.svelte';

export default function register() {

  registerAssetPreview({
    match: (asset: { url: string; name?: string; mimeType?: string }) =>
      asset.mimeType === 'application/pdf' ||
      asset.name?.toLowerCase().endsWith('.pdf') ||
      asset.url?.toLowerCase().endsWith('.pdf'),
    component: PdfAssetPreview,
  });
}

register();
