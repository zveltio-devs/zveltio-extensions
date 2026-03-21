/**
 * content/page-builder — Client Components
 *
 * Import in your SvelteKit app:
 *   import { HeroSection, GridSection, CTASection, TextSection } from 'zveltio-extensions/content/page-builder/client';
 *
 * Usage with dynamic page rendering:
 *   {#each page.sections as section}
 *     {#if section.type === 'hero'}   <HeroSection {...section.data} />
 *     {:else if section.type === 'grid'}  <GridSection {...section.data} />
 *     {:else if section.type === 'cta'}   <CTASection {...section.data} />
 *     {:else if section.type === 'text'}  <TextSection {...section.data} />
 *     {/if}
 *   {/each}
 *
 * Requires: content/page-builder extension active on your Zveltio instance.
 */
export { default as HeroSection } from './HeroSection.svelte';
export { default as GridSection } from './GridSection.svelte';
export { default as CTASection } from './CTASection.svelte';
export { default as TextSection } from './TextSection.svelte';
