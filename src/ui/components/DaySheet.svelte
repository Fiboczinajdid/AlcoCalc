<script lang="ts">
  import { app } from '../../state/app.svelte';
  import { dayRange, estimateDriving, type Drink } from '../../logic';
  import { fmtDateLong } from '../format';
  import Sheet from './Sheet.svelte';
  import DrinkList from './DrinkList.svelte';
  import DrinkForm from './DrinkForm.svelte';
  import NightCard from './NightCard.svelte';
  import BacCard from './BacCard.svelte';
  import Icon from './Icon.svelte';

  let { dayKey, onclose }: { dayKey: string; onclose: () => void } = $props();

  type Sub = { kind: 'add' } | { kind: 'edit'; drink: Drink } | null;
  let sub = $state<Sub>(null);

  const drinks = $derived(app.drinksOn(dayKey));
  const extras = $derived(app.day(dayKey).extras);
  const isToday = $derived(dayKey === app.todayKey);

  const est = $derived.by(() => {
    if (!app.profile || !drinks.length) return null;
    const [start, end] = dayRange(dayKey, app.startHour);
    return estimateDriving({
      drinks: app.drinks,
      readings: app.readings,
      profile: app.profile,
      ate: app.ateFor,
      now: isToday ? app.now : end,
      windowStart: start - 12 * 3_600_000,
      windowEnd: end,
    });
  });
</script>

<Sheet title={fmtDateLong(dayKey)} {onclose}>
  {#if drinks.length}
    <section class="card">
      <DrinkList {drinks} onedit={(d) => (sub = { kind: 'edit', drink: d })} />
    </section>
  {:else}
    <div class="sober card">
      <p><strong>Dzień bez alkoholu</strong></p>
      <p class="muted small">Brak wpisów z tego dnia.</p>
    </div>
  {/if}

  <button class="btn btn-outline btn-block" onclick={() => (sub = { kind: 'add' })}>
    <Icon name="plus" /> Dodaj napój do tego dnia
  </button>

  {#if drinks.length || extras.length}
    <NightCard {dayKey} {drinks} {est} now={app.now} live={isToday} />
  {/if}

  {#if est?.fast}
    <BacCard {est} now={app.now} live={false} {dayKey} />
  {/if}
</Sheet>

{#if sub?.kind === 'add'}
  <DrinkForm {dayKey} onclose={() => (sub = null)} />
{:else if sub?.kind === 'edit'}
  <DrinkForm {dayKey} drink={sub.drink} onclose={() => (sub = null)} />
{/if}

<style>
  .sober {
    text-align: center;
  }
</style>
