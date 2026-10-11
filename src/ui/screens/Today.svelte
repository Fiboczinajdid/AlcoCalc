<script lang="ts">
  import { app } from '../../state/app.svelte';
  import { estimateDriving, mlToGrams, toUnits, totalAlcoholMl, servingsCount, type Drink } from '../../logic';
  import { fmtDateLong, fmtNum, fmtUnits } from '../format';
  import Icon from '../components/Icon.svelte';
  import DrinkForm from '../components/DrinkForm.svelte';
  import DrinkList from '../components/DrinkList.svelte';
  import CheckSheet from '../components/CheckSheet.svelte';
  import BacCard from '../components/BacCard.svelte';
  import WaterCard from '../components/WaterCard.svelte';
  import NightCard from '../components/NightCard.svelte';

  type SheetState = { kind: 'add' } | { kind: 'edit'; drink: Drink } | { kind: 'check' } | null;
  let sheet = $state<SheetState>(null);

  const key = $derived(app.todayKey);
  const drinks = $derived(app.drinksOn(key));
  const alcoholMl = $derived(totalAlcoholMl(drinks));
  const unit = $derived(app.activeUnit);
  const extras = $derived(app.day(key).extras);

  const est = $derived(
    app.profile
      ? estimateDriving({
          drinks: app.drinks,
          readings: app.readings,
          profile: app.profile,
          ate: app.ateFor,
          now: app.now,
        })
      : null,
  );
  // Karta promili także rano po wieczorze (napoje z poprzedniego dnia logicznego).
  const showBac = $derived(
    !!est?.fast && (drinks.length > 0 || (est.soberSafer ?? 0) > app.now - 30 * 60_000),
  );
</script>

<div class="screen">
  <header class="screen-header">
    <div>
      <h1>Dziś</h1>
      <p class="sub">{fmtDateLong(key)}</p>
    </div>
    <img src="{import.meta.env.BASE_URL}icons/icon-192.png" alt="" width="40" height="40" class="logo" />
  </header>

  <section class="card hero" aria-label="Wypite dziś">
    {#if unit}
      <div class="hero-num num" aria-live="polite">{fmtUnits(toUnits(alcoholMl, unit))}</div>
      <div class="hero-unit">× {unit.name}</div>
      <div class="hero-sub num">
        {fmtNum(alcoholMl, 1)} ml czystego alkoholu · {fmtNum(mlToGrams(alcoholMl), 1)} g
      </div>
      {#if app.units.length > 1}
        <div class="chips units" role="group" aria-label="Jednostka licznika">
          {#each app.units as u (u.id)}
            <button
              class="chip num"
              aria-pressed={u.id === unit.id}
              onclick={() => app.setActiveUnit(u.id)}
              title="Pokazuj w tej jednostce"
            >
              {#if u.id === unit.id}<Icon name="check" size={16} />{:else}= {fmtUnits(toUnits(alcoholMl, u))} ×{/if}
              {u.name}
            </button>
          {/each}
        </div>
      {/if}
    {/if}
  </section>

  <div class="grid-2">
    <button class="btn btn-outline action" onclick={() => app.repeatLast()} disabled={!app.lastDrink}>
      <Icon name="repeat" />
      <span class="action-text">
        <span>Powtórz ostatni</span>
        {#if app.lastDrink}<small>{app.lastDrink.name}</small>{/if}
      </span>
    </button>
    <button class="btn btn-outline action" onclick={() => (sheet = { kind: 'check' })}>
      <Icon name="scale" />
      <span class="action-text"><span>Sprawdź</span><small>przed zakupem</small></span>
    </button>
  </div>

  {#if showBac && est}
    <BacCard {est} now={app.now} dayKey={key} />
  {/if}

  <section class="card" aria-labelledby="list-title">
    <h2 class="card-title" id="list-title"><Icon name="today" /> Napoje dziś</h2>
    {#if drinks.length}
      <DrinkList {drinks} onedit={(d) => (sheet = { kind: 'edit', drink: d })} />
    {:else}
      <p class="muted">Brak napojów.</p>
    {/if}
  </section>

  {#if drinks.length || extras.length}
    <NightCard dayKey={key} {drinks} {est} now={app.now} />
  {/if}

  <WaterCard dayKey={key} servings={servingsCount(drinks)} />
</div>

<button class="fab" onclick={() => (sheet = { kind: 'add' })}>
  <Icon name="plus" size={26} stroke={2.5} />
  <span>Dodaj napój</span>
</button>

{#if sheet?.kind === 'add'}
  <DrinkForm dayKey={key} onclose={() => (sheet = null)} />
{:else if sheet?.kind === 'edit'}
  <DrinkForm dayKey={key} drink={sheet.drink} onclose={() => (sheet = null)} />
{:else if sheet?.kind === 'check'}
  <CheckSheet onclose={() => (sheet = null)} />
{/if}

<style>
  .logo {
    border-radius: 12px;
  }

  .hero {
    text-align: center;
    padding: 22px 18px 18px;
    background:
      radial-gradient(120% 90% at 50% 0%, var(--amber-soft), transparent 70%),
      var(--surface);
  }

  .hero-num {
    font-size: clamp(4rem, 22vw, 5.5rem);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .hero-unit {
    font-size: 1.125rem;
    font-weight: 650;
    margin-top: 6px;
  }

  .hero-sub {
    color: var(--muted);
    margin-top: 4px;
  }

  .units {
    justify-content: center;
    margin-top: 16px;
  }


  .action {
    justify-content: flex-start;
    min-height: 60px;
    padding: 8px 14px;
    background: var(--surface);
  }

  .action-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    line-height: 1.2;
  }

  .action-text small {
    font-weight: 500;
    color: var(--muted);
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .action :global(svg) {
    flex: none;
    color: var(--amber-text);
  }

  .fab {
    position: fixed;
    right: max(16px, calc(50vw - 280px + 16px));
    bottom: calc(var(--nav-h) + env(safe-area-inset-bottom) + 16px);
    z-index: 20;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 60px;
    padding: 0 22px 0 18px;
    border: none;
    border-radius: 999px;
    background: var(--amber);
    color: var(--on-amber);
    font-weight: 750;
    font-size: 1.0625rem;
    box-shadow: var(--shadow-lg);
    transition: transform 0.15s var(--ease);
  }

  .fab:active {
    transform: scale(0.95);
  }
</style>
