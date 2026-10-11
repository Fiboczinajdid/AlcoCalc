<script lang="ts">
  import { app } from '../../state/app.svelte';
  import { aggregateDays, hourHeatmap, keyToDate, mlToGrams, monthlyStats, toUnits, weeklyStats } from '../../logic';
  import { MONTHS_SHORT, fmtDateShort, fmtMoney, fmtNum, fmtUnits } from '../format';
  import Icon from '../components/Icon.svelte';
  import BarChart from '../components/BarChart.svelte';
  import Heatmap from '../components/Heatmap.svelte';

  let period = $state<'week' | 'month'>('week');
  let measure = $state<'unit' | 'grams'>('unit');

  const unit = $derived(app.activeUnit);
  const currency = $derived(app.profile?.currency ?? 'PLN');
  const agg = $derived(aggregateDays(app.drinks, app.days, app.startHour));
  const weeks = $derived(weeklyStats(agg, app.firstKey, app.todayKey, 8));
  const months = $derived(monthlyStats(agg, app.firstKey, app.todayKey, 12));
  const list = $derived(period === 'week' ? weeks : months);

  const label = (start: string) =>
    period === 'week' ? fmtDateShort(start).replace(' ', ' ') : MONTHS_SHORT[keyToDate(start).getMonth()];

  const amount = (ml: number) => (measure === 'grams' ? mlToGrams(ml) : unit ? toUnits(ml, unit) : 0);
  const fmtAmount = (n: number) => (measure === 'grams' ? `${fmtNum(n, 0)}` : fmtUnits(n));

  const trendValues = $derived(list.map((p) => amount(p.alcoholMl)));
  const trendLabels = $derived(list.map((p) => label(p.start)));
  const avg = $derived.by(() => {
    const tracked = list.filter((p) => p.trackedDays > 0);
    if (!tracked.length) return 0;
    // Pełne okresy ważymy proporcjonalnie do liczby śledzonych dni.
    const days = tracked.reduce((s, p) => s + p.trackedDays, 0);
    const total = tracked.reduce((s, p) => s + amount(p.alcoholMl), 0);
    return (total / days) * (period === 'week' ? 7 : 30.4);
  });

  const thisWeek = $derived(weeks.at(-1)!);
  const thisMonth = $derived(months.at(-1)!);
  const costMonths = $derived(months.slice(-6));
  const heat = $derived(hourHeatmap(app.drinks, app.startHour));
  const hasData = $derived(app.drinks.length > 0);
</script>

<div class="screen">
  <header class="screen-header"><h1>Statystyki</h1></header>

  <div class="segmented" role="group" aria-label="Okres">
    <button aria-pressed={period === 'week'} onclick={() => (period = 'week')}>Tygodnie</button>
    <button aria-pressed={period === 'month'} onclick={() => (period = 'month')}>Miesiące</button>
  </div>

  <section class="card" aria-labelledby="trend-title">
    <div class="spread head">
      <h2 class="card-title" id="trend-title"><Icon name="chart" /> Trend</h2>
      <div class="segmented small-seg" role="group" aria-label="Miara">
        <button aria-pressed={measure === 'unit'} onclick={() => (measure = 'unit')}>jednostki</button>
        <button aria-pressed={measure === 'grams'} onclick={() => (measure = 'grams')}>gramy</button>
      </div>
    </div>
    {#if hasData}
      <BarChart
        values={trendValues}
        labels={trendLabels}
        format={fmtAmount}
        caption={`Ilość alkoholu w ${period === 'week' ? 'kolejnych tygodniach' : 'kolejnych miesiącach'}`}
      />
      <p class="small muted">
        {#if measure === 'unit' && unit}Wartości w jednostce: {unit.name}.{:else}Gramy czystego alkoholu.{/if}
        Średnio <strong class="num">{fmtAmount(avg)}{measure === 'grams' ? ' g' : ''}</strong>
        {period === 'week' ? 'na tydzień' : 'na miesiąc'}.
      </p>
    {:else}
      <p class="muted">Statystyki pojawią się po dodaniu pierwszych napojów.</p>
    {/if}
  </section>

  <section class="card" aria-labelledby="sober-title">
    <h2 class="card-title" id="sober-title"><Icon name="moon" /> Dni bez alkoholu</h2>
    <div class="grid-2">
      <div class="tile">
        <span class="muted small">Ten tydzień</span>
        <span class="tile-val num">{thisWeek.soberDays}<small> / {thisWeek.trackedDays}</small></span>
      </div>
      <div class="tile">
        <span class="muted small">Ten miesiąc</span>
        <span class="tile-val num">{thisMonth.soberDays}<small> / {thisMonth.trackedDays}</small></span>
      </div>
    </div>
    <BarChart
      values={list.map((p) => p.soberDays)}
      labels={trendLabels}
      format={(n) => String(n)}
      caption="Liczba dni bez alkoholu w kolejnych okresach"
    />
  </section>

  <section class="card" aria-labelledby="cost-title">
    <h2 class="card-title" id="cost-title"><Icon name="wallet" /> Koszty miesięczne</h2>
    <div class="tile wide">
      <span class="muted small">Ten miesiąc (napoje i dodatki)</span>
      <span class="tile-val num">{fmtMoney(thisMonth.cost, currency)}</span>
    </div>
    <BarChart
      values={costMonths.map((p) => p.cost)}
      labels={costMonths.map((p) => MONTHS_SHORT[keyToDate(p.start).getMonth()])}
      format={(n) => fmtNum(n, 0)}
      caption={`Koszty w ostatnich miesiącach (${currency})`}
    />
  </section>

  <section class="card" aria-labelledby="heat-title">
    <h2 class="card-title" id="heat-title"><Icon name="clock" /> Kiedy faktycznie pijesz</h2>
    <Heatmap grid={heat} startHour={app.startHour} />
  </section>
</div>

<style>
  .head {
    align-items: flex-start;
  }

  .small-seg button {
    min-height: 32px;
    padding: 0 10px;
    font-size: 0.8125rem;
  }

  .tile {
    display: flex;
    flex-direction: column;
    padding: 12px;
    border-radius: 14px;
    background: var(--surface-2);
    margin-bottom: 12px;
  }

  .tile-val {
    font-size: 1.75rem;
    font-weight: 750;
  }

  .tile-val small {
    font-size: 1rem;
    color: var(--muted);
    font-weight: 600;
  }

  p.small {
    margin-top: 8px;
  }
</style>
