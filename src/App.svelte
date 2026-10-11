<script lang="ts">
  import { app } from './state/app.svelte';
  import Today from './ui/screens/Today.svelte';
  import Calendar from './ui/screens/Calendar.svelte';
  import Stats from './ui/screens/Stats.svelte';
  import Settings from './ui/screens/Settings.svelte';
  import Onboarding from './ui/screens/Onboarding.svelte';
  import Icon, { type IconName } from './ui/components/Icon.svelte';

  type Tab = 'today' | 'calendar' | 'stats' | 'settings';
  const TABS: { id: Tab; label: string; icon: IconName }[] = [
    { id: 'today', label: 'Dziś', icon: 'today' },
    { id: 'calendar', label: 'Kalendarz', icon: 'calendar' },
    { id: 'stats', label: 'Statystyki', icon: 'chart' },
    { id: 'settings', label: 'Ustawienia', icon: 'settings' },
  ];

  let tab = $state<Tab>('today');

  function go(t: Tab) {
    tab = t;
    window.scrollTo({ top: 0 });
  }
</script>

{#if !app.loaded}
  <div class="splash" aria-busy="true"></div>
{:else if app.loadError}
  <div class="screen"><div class="note caution" role="alert">{app.loadError}</div></div>
{:else if !app.profile}
  <Onboarding />
{:else}
  <main>
    {#if tab === 'today'}
      <Today />
    {:else if tab === 'calendar'}
      <Calendar />
    {:else if tab === 'stats'}
      <Stats />
    {:else}
      {#key app.profile.startedAt}<Settings />{/key}
    {/if}
  </main>

  <nav class="tabbar" aria-label="Nawigacja">
    {#each TABS as t (t.id)}
      <button class="tab" aria-current={tab === t.id ? 'page' : undefined} onclick={() => go(t.id)}>
        <span class="tab-icon"><Icon name={t.icon} size={24} /></span>
        <span class="tab-label">{t.label}</span>
      </button>
    {/each}
  </nav>
{/if}

{#if app.toast}
  {#key app.toast.id}
    <div class="toast" role="status">
      <span>{app.toast.message}</span>
      {#if app.toast.action}
        <button
          class="toast-action"
          onclick={() => {
            app.toast?.action?.();
            app.dismissToast();
          }}>{app.toast.actionLabel}</button
        >
      {/if}
    </div>
  {/key}
{/if}

<style>
  .splash {
    min-height: 100dvh;
  }

  .tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    height: calc(var(--nav-h) + env(safe-area-inset-bottom));
    padding: 0 8px env(safe-area-inset-bottom);
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-top: 1px solid var(--border);
  }

  .tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    border: none;
    background: none;
    color: var(--muted);
    font-size: 0.75rem;
    font-weight: 600;
    min-height: 44px;
  }

  .tab-icon {
    display: grid;
    place-items: center;
    width: 56px;
    height: 30px;
    border-radius: 999px;
    transition: background 0.2s var(--ease);
  }

  .tab[aria-current='page'] {
    color: var(--text);
  }

  .tab[aria-current='page'] .tab-icon {
    background: var(--amber-soft);
    color: var(--amber-text);
  }

  .toast {
    position: fixed;
    left: 50%;
    bottom: calc(var(--nav-h) + env(safe-area-inset-bottom) + 88px);
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: calc(100vw - 32px);
    padding: 8px 8px 8px 16px;
    min-height: 48px;
    border-radius: 14px;
    background: var(--text);
    color: var(--bg);
    box-shadow: var(--shadow-lg);
    font-size: 0.9375rem;
    animation: toast-in 0.25s var(--ease);
  }

  .toast-action {
    border: none;
    background: none;
    color: var(--amber);
    font-weight: 750;
    min-height: 40px;
    padding: 0 10px;
    border-radius: 10px;
  }

  @media (prefers-color-scheme: dark) {
    .toast-action {
      color: #9a5c00;
    }
  }

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translate(-50%, 10px);
    }
  }
</style>
