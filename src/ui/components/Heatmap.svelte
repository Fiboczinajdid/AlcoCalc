<script lang="ts">
  import { WEEKDAYS_SHORT } from '../format';

  let { grid, startHour }: { grid: number[][]; startHour: number } = $props();

  // Kolumny zaczynamy od godziny początku dnia, żeby wieczór i noc były obok siebie.
  const hours = $derived(Array.from({ length: 24 }, (_, i) => (i + startHour) % 24));
  const max = $derived(Math.max(...grid.flat(), 0));

  function lv(v: number) {
    if (v <= 0 || max <= 0) return 0;
    const r = v / max;
    return r > 0.75 ? 4 : r > 0.5 ? 3 : r > 0.25 ? 2 : 1;
  }
</script>

{#if max > 0}
  <div class="hm" role="img" aria-label="Mapa cieplna: dzień tygodnia i godzina picia">
    <span></span>
    {#each hours as h (h)}
      <span class="hl num">{h % 3 === 0 ? h : ''}</span>
    {/each}
    {#each grid as row, d (d)}
      <span class="dl">{WEEKDAYS_SHORT[d]}</span>
      {#each hours as h (h)}
        <span class="c l{lv(row[h])}"></span>
      {/each}
    {/each}
  </div>
  <p class="hint">Im ciemniej, tym więcej alkoholu w danej godzinie. Noc po północy liczy się do dnia, w którym zaczął się wieczór.</p>
{:else}
  <p class="muted">Brak danych.</p>
{/if}

<style>
  .hm {
    display: grid;
    grid-template-columns: 22px repeat(24, 1fr);
    gap: 2px;
    align-items: center;
  }

  .hl {
    font-size: 9px;
    color: var(--muted);
    text-align: left;
    height: 14px;
  }

  .dl {
    font-size: 11px;
    color: var(--muted);
  }

  .c {
    aspect-ratio: 1;
    border-radius: 3px;
    background: var(--heat-0);
  }

  .l1 {
    background: var(--heat-1);
  }
  .l2 {
    background: var(--heat-2);
  }
  .l3 {
    background: var(--heat-3);
  }
  .l4 {
    background: var(--heat-4);
  }

  .hint {
    margin-top: 10px;
  }
</style>
