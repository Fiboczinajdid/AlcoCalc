<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from '../../state/app.svelte';
  import type { UpdateOffer } from '../../updates';
  import { pushBack } from '../back';
  import Icon from './Icon.svelte';

  let { offer }: { offer: UpdateOffer } = $props();
  let busy = $state(false);

  const later = () => (app.update = null);

  async function apply() {
    busy = true;
    try {
      await offer.apply();
    } finally {
      busy = false;
      if (offer.kind === 'apk') app.update = null;
    }
  }

  onMount(() => pushBack(later));
</script>

<div class="backdrop" aria-hidden="true"></div>
<div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="upd-title" aria-describedby="upd-text">
  <div class="icon"><Icon name={offer.kind === 'apk' ? 'download' : 'repeat'} size={28} /></div>

  {#if offer.kind === 'apk'}
    <h2 id="upd-title">Nowa wersja aplikacji</h2>
    <div id="upd-text" class="text">
      <p>Ta aktualizacja wymaga nowego pliku APK. Dane zostają.</p>
      <ol>
        <li>Tapnij <strong>Pobierz</strong>.</li>
        <li>Na stronie tapnij <strong>Pobierz AlcoCalc.apk</strong>.</li>
        <li>Otwórz pobrany plik i wybierz <strong>Zainstaluj</strong> (aktualizuj).</li>
      </ol>
    </div>
  {:else}
    <h2 id="upd-title">Aktualizacja gotowa</h2>
    <p id="upd-text" class="text">
      Tapnij <strong>Zaktualizuj</strong>. Aplikacja uruchomi się ponownie, dane zostają.
    </p>
  {/if}
  {#if offer.version}<p class="ver num">Wersja {offer.version}</p>{/if}

  <div class="actions">
    <button class="btn btn-outline" onclick={later} disabled={busy}>Później</button>
    <button class="btn btn-primary" onclick={apply} disabled={busy}>
      {offer.kind === 'apk' ? 'Pobierz' : busy ? 'Aktualizuję…' : 'Zaktualizuj'}
    </button>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: rgba(20, 15, 5, 0.5);
    animation: fade 0.2s ease;
  }

  .dialog {
    position: fixed;
    z-index: 61;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(360px, calc(100vw - 32px));
    max-height: calc(100dvh - 48px);
    overflow-y: auto;
    padding: 24px 20px 18px;
    border-radius: 24px;
    background: var(--surface);
    box-shadow: var(--shadow-lg);
    text-align: center;
    animation: pop 0.25s var(--ease);
  }

  .icon {
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    margin: 0 auto 12px;
    border-radius: 50%;
    background: var(--amber-soft);
    color: var(--amber-text);
  }

  h2 {
    font-size: 1.25rem;
    margin-bottom: 8px;
  }

  .text {
    color: var(--muted);
  }

  ol {
    text-align: left;
    margin: 10px 0 0;
    padding-left: 22px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ver {
    margin-top: 10px;
    font-size: 0.8125rem;
    color: var(--faint);
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 18px;
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: translate(-50%, -46%) scale(0.96);
    }
  }
</style>
