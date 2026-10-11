<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';

  let {
    title,
    onclose,
    children,
  }: { title: string; onclose: () => void; children: Snippet } = $props();

  let panel: HTMLDivElement;
  const titleId = `sheet-${Math.random().toString(36).slice(2, 8)}`;

  onMount(() => {
    const prev = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.focus();
    return () => {
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  });

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }
</script>

<svelte:window {onkeydown} />

<div class="backdrop" onclick={onclose} aria-hidden="true"></div>
<div class="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} tabindex="-1" bind:this={panel}>
  <div class="handle" aria-hidden="true"></div>
  <header>
    <h2 id={titleId}>{title}</h2>
    <button class="icon-btn" onclick={onclose} aria-label="Zamknij"><Icon name="close" /></button>
  </header>
  <div class="body">
    {@render children()}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(20, 15, 5, 0.45);
    z-index: 40;
    animation: fade 0.2s ease;
  }

  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 41;
    max-width: 560px;
    margin: 0 auto;
    max-height: calc(100dvh - env(safe-area-inset-top) - 24px);
    display: flex;
    flex-direction: column;
    background: var(--bg);
    border-radius: 24px 24px 0 0;
    box-shadow: var(--shadow-lg);
    animation: up 0.28s var(--ease);
    outline: none;
  }

  .handle {
    width: 40px;
    height: 5px;
    border-radius: 3px;
    background: var(--surface-3);
    margin: 8px auto 0;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px 4px 20px;
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .body {
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 8px 16px calc(20px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  @keyframes up {
    from {
      transform: translateY(100%);
    }
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
