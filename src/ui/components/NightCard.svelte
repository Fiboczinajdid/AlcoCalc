<script lang="ts">
  import { app, uid } from '../../state/app.svelte';
  import { nightSummary, type DriveEstimate, type Drink } from '../../logic';
  import { fmtDuration, fmtHours, fmtMoney, fmtNum, fmtUnits, fmtWhen, parseNum, roundUp5 } from '../format';
  import Icon from './Icon.svelte';

  let {
    dayKey,
    drinks,
    est,
    now,
    live = true,
  }: { dayKey: string; drinks: Drink[]; est: DriveEstimate | null; now: number; live?: boolean } = $props();

  const currency = $derived(app.profile?.currency ?? 'PLN');
  const extras = $derived(app.day(dayKey).extras);
  const unit = $derived(app.activeUnit);
  const s = $derived(unit ? nightSummary(drinks, extras, unit, app.profile?.hourlyRate ?? null) : null);

  const soberLo = $derived(est?.soberEarliest ? roundUp5(est.soberEarliest) : null);
  const soberHi = $derived(est?.soberSafer ? roundUp5(est.soberSafer) : null);

  let adding = $state(false);
  let label = $state('');
  let amount = $state('');
  const amt = $derived(parseNum(amount));

  async function addExtra() {
    if (amt === null || amt <= 0) return;
    await app.updateDay(dayKey, {
      extras: [...extras, { id: uid(), label: label.trim() || 'Dodatek', amount: amt }],
    });
    label = '';
    amount = '';
    adding = false;
  }

  function removeExtra(id: string) {
    app.updateDay(dayKey, { extras: extras.filter((e) => e.id !== id) });
  }
</script>

{#if s && unit}
  <section class="card night" aria-labelledby="night-title">
    <h2 class="card-title" id="night-title"><Icon name="receipt" /> Ile ta noc naprawdę kosztowała</h2>

    <div class="money">
      <span class="money-val num">{fmtMoney(s.totalCost, currency)}</span>
      {#if s.extrasCost > 0}
        <span class="muted small num">napoje {fmtMoney(s.drinksCost, currency)} · dodatki {fmtMoney(s.extrasCost, currency)}</span>
      {:else if !s.hasPrices && drinks.length}
        <span class="muted small">Dodaj ceny do napojów, żeby zobaczyć pełny koszt.</span>
      {/if}
    </div>

    <dl class="tiles">
      <div>
        <dt>Ilość</dt>
        <dd class="num">{fmtUnits(s.units)} <span>× {unit.name}</span></dd>
        <dd class="sub num">{fmtNum(s.grams, 0)} g czystego alkoholu</dd>
      </div>
      <div>
        <dt>Kalorie z alkoholu</dt>
        <dd class="num">ok. {fmtNum(s.kcal, 0)} <span>kcal</span></dd>
        <dd class="sub">bez cukru i dodatków</dd>
      </div>
      <div>
        <dt>Do trzeźwości (0‰)</dt>
        {#if soberLo && soberHi && soberHi > now && live}
          <dd class="num">{fmtDuration(Math.max(0, soberLo - now))}–{fmtDuration(soberHi - now)}</dd>
          <dd class="sub num">ok. {fmtWhen(soberLo, now)}–{fmtWhen(soberHi, now)}</dd>
        {:else if soberLo && soberHi}
          <dd class="num">{fmtWhen(soberLo, now)}–{fmtWhen(soberHi, now)}</dd>
          <dd class="sub">szacunek</dd>
        {:else}
          <dd class="num">—</dd>
        {/if}
      </div>
      {#if s.workHours !== null}
        <div>
          <dt>W godzinach pracy</dt>
          <dd class="num">{fmtHours(s.workHours)}</dd>
          <dd class="sub">przy stawce {fmtMoney(app.profile?.hourlyRate ?? 0, currency)}/h</dd>
        </div>
      {/if}
    </dl>

    {#if extras.length}
      <ul class="list extras">
        {#each extras as e (e.id)}
          <li class="spread">
            <span>{e.label}</span>
            <span class="row">
              <span class="num">{fmtMoney(e.amount, currency)}</span>
              <button class="icon-btn" aria-label="Usuń {e.label}" onclick={() => removeExtra(e.id)}>
                <Icon name="trash" size={18} />
              </button>
            </span>
          </li>
        {/each}
      </ul>
    {/if}

    {#if adding}
      <form
        class="stack fade-in"
        onsubmit={(e) => {
          e.preventDefault();
          addExtra();
        }}
      >
        <div class="chips">
          {#each ['Taxi', 'Jedzenie', 'Wejściówka', 'Napiwek'] as l (l)}
            <button type="button" class="chip" aria-pressed={label === l} onclick={() => (label = l)}>{l}</button>
          {/each}
        </div>
        <div class="grid-2">
          <input class="input" bind:value={label} placeholder="Opis" aria-label="Opis wydatku" maxlength="40" />
          <div class="input-suffix">
            <input class="input num" inputmode="decimal" bind:value={amount} placeholder="Kwota" aria-label="Kwota" />
            <span>{currency}</span>
          </div>
        </div>
        <div class="grid-2">
          <button type="button" class="btn btn-outline" onclick={() => (adding = false)}>Anuluj</button>
          <button type="submit" class="btn btn-primary" disabled={amt === null || amt <= 0}>Dodaj</button>
        </div>
      </form>
    {:else}
      <button class="btn btn-ghost add-extra" onclick={() => (adding = true)}>
        <Icon name="plus" size={18} /> Dodaj wydatek (taxi, jedzenie…)
      </button>
    {/if}
  </section>
{/if}

<style>
  .money {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 14px;
  }

  .money-val {
    font-size: 2.25rem;
    font-weight: 750;
    letter-spacing: -0.02em;
  }

  .tiles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 0;
  }

  .tiles > div {
    padding: 12px;
    border-radius: 14px;
    background: var(--surface-2);
    min-width: 0;
  }

  dt {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 4px;
  }

  dd {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  dd span {
    font-size: 0.875rem;
    font-weight: 550;
  }

  dd.sub {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--muted);
  }

  .extras {
    margin-top: 12px;
    border-top: 1px solid var(--border);
    padding-top: 4px;
  }

  .add-extra {
    margin-top: 10px;
    padding-left: 4px;
    color: var(--amber-text);
  }
</style>
