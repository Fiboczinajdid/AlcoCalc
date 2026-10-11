<script lang="ts">
  import { app } from '../../state/app.svelte';
  import {
    STREAK_MILESTONES,
    aggregateDays,
    computeStreaks,
    dateToKey,
    drinkDaySet,
    keyToDate,
    toUnits,
  } from '../../logic';
  import { MONTHS, WEEKDAYS_SHORT, days, fmtUnits, fmtDateLong } from '../format';
  import Icon from '../components/Icon.svelte';
  import DaySheet from '../components/DaySheet.svelte';

  const agg = $derived(aggregateDays(app.drinks, app.days, app.startHour));
  const streak = $derived(computeStreaks(drinkDaySet(agg), app.firstKey, app.todayKey));
  const unit = $derived(app.activeUnit);

  const today = $derived(keyToDate(app.todayKey));
  let offset = $state(0); // 0 = bieżący miesiąc
  const month = $derived(new Date(today.getFullYear(), today.getMonth() + offset, 1));
  let openDay = $state<string | null>(null);

  const cells = $derived.by(() => {
    const first = month;
    const lead = (first.getDay() + 6) % 7;
    const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const out: ({ key: string; day: number } | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= daysIn; d++) out.push({ key: dateToKey(new Date(first.getFullYear(), first.getMonth(), d)), day: d });
    return out;
  });

  function level(key: string): number {
    const a = agg.get(key);
    if (!a || a.alcoholMl <= 0 || !unit) return 0;
    const u = toUnits(a.alcoholMl, unit);
    if (u <= 1) return 1;
    if (u <= 3) return 2;
    if (u <= 5) return 3;
    return 4;
  }

  function describe(key: string): string {
    const a = agg.get(key);
    const date = fmtDateLong(key);
    if (key > app.todayKey) return date;
    if (key < app.firstKey && !a) return `${date}, przed rozpoczęciem śledzenia`;
    if (!a || a.alcoholMl <= 0) return `${date}, bez alkoholu`;
    return `${date}, ${unit ? fmtUnits(toUnits(a.alcoholMl, unit)) + ' × ' + unit.name : ''}`;
  }

  const monthSober = $derived.by(() => {
    let sober = 0;
    let tracked = 0;
    for (const c of cells) {
      if (!c || c.key > app.todayKey || c.key < app.firstKey) continue;
      tracked++;
      if (level(c.key) === 0) sober++;
    }
    return { sober, tracked };
  });
</script>

<div class="screen">
  <header class="screen-header"><h1>Kalendarz</h1></header>

  <section class="card streak" aria-label="Seria dni bez alkoholu">
    <div class="streak-main">
      <span class="streak-num num">{streak.current}</span>
      <span class="streak-label">
        {streak.current === 1 ? 'dzień' : 'dni'} bez alkoholu<br /><span class="muted small">bieżąca seria</span>
      </span>
    </div>
    <div class="streak-side">
      <div><span class="muted small">Najdłuższa</span><strong class="num">{days(streak.longest)}</strong></div>
      {#if streak.next}
        <div><span class="muted small">Następny próg</span><strong class="num">{days(streak.next)}</strong></div>
      {/if}
    </div>
    {#if streak.current === 0 && streak.previous}
      <p class="small muted msg">Poprzednia seria: {days(streak.previous)}</p>
    {/if}
  </section>

  <section class="card" aria-label="Kalendarz miesiąca">
    <div class="month-nav">
      <button class="icon-btn" onclick={() => offset--} aria-label="Poprzedni miesiąc"><Icon name="left" /></button>
      <h2>{MONTHS[month.getMonth()]} {month.getFullYear()}</h2>
      <button class="icon-btn" onclick={() => offset++} disabled={offset >= 0} aria-label="Następny miesiąc">
        <Icon name="right" />
      </button>
    </div>

    <div class="grid">
      {#each WEEKDAYS_SHORT as w (w)}
        <div class="wd" aria-hidden="true">{w}</div>
      {/each}
      {#each cells as c, i (c?.key ?? 'e' + i)}
        {#if c}
          {@const future = c.key > app.todayKey}
          {@const untracked = c.key < app.firstKey && level(c.key) === 0}
          <button
            class="cell lv{level(c.key)}"
            class:today={c.key === app.todayKey}
            class:future
            class:untracked
            disabled={future}
            aria-label={describe(c.key)}
            onclick={() => (openDay = c.key)}
          >
            <span class="num">{c.day}</span>
          </button>
        {:else}
          <div></div>
        {/if}
      {/each}
    </div>

    <div class="legend small muted">
      <span><i class="sw lv0"></i>bez alkoholu</span>
      <span><i class="sw lv1"></i>≤1</span>
      <span><i class="sw lv2"></i>≤3</span>
      <span><i class="sw lv3"></i>≤5</span>
      <span><i class="sw lv4"></i>&gt;5</span>
      {#if unit}<span>× {unit.name}</span>{/if}
    </div>
    {#if monthSober.tracked}
      <p class="small month-sum">
        W tym miesiącu: <strong class="num">{monthSober.sober}</strong> z {days(monthSober.tracked)} bez alkoholu.
      </p>
    {/if}
  </section>

  <section class="card" aria-labelledby="ach-title">
    <h2 class="card-title" id="ach-title"><Icon name="medal" /> Osiągnięcia</h2>
    <ul class="list badges">
      {#each STREAK_MILESTONES as m (m)}
        {@const got = streak.achieved.includes(m)}
        <li class="badge" class:got>
          <Icon name={got ? 'medal' : 'moon'} size={26} />
          <strong class="num">{m}</strong>
          <span class="small">dni</span>
          <span class="visually-hidden">{got ? 'zdobyte' : 'jeszcze nie'}</span>
        </li>
      {/each}
    </ul>
  </section>
</div>

{#if openDay}
  <DaySheet dayKey={openDay} onclose={() => (openDay = null)} />
{/if}

<style>
  .streak {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 12px;
    align-items: center;
  }

  .streak-main {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .streak-num {
    font-size: 3.5rem;
    font-weight: 800;
    line-height: 1;
    color: var(--amber-text);
  }

  .streak-label {
    font-weight: 650;
    line-height: 1.25;
  }

  .streak-side {
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: right;
  }

  .streak-side div {
    display: flex;
    flex-direction: column;
  }

  .msg {
    grid-column: 1 / -1;
  }

  .month-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .month-nav h2 {
    font-size: 1.125rem;
  }

  .month-nav .icon-btn:disabled {
    opacity: 0.3;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 5px;
  }

  .wd {
    text-align: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted);
    padding-bottom: 4px;
  }

  .cell {
    aspect-ratio: 1;
    min-height: 40px;
    border: none;
    border-radius: 10px;
    display: grid;
    place-items: center;
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--text);
    background: var(--heat-0);
    transition: transform 0.1s;
  }

  .cell:active {
    transform: scale(0.92);
  }

  .lv1 {
    background: var(--heat-1);
  }
  .lv2 {
    background: var(--heat-2);
  }
  .lv3 {
    background: var(--heat-3);
    color: #2a1a00;
  }
  .lv4 {
    background: var(--heat-4);
    color: #fff;
  }

  @media (prefers-color-scheme: dark) {
    .lv4 {
      color: #1e1300;
    }
  }

  .cell.today {
    box-shadow:
      0 0 0 2px var(--bg),
      0 0 0 4px var(--text);
  }

  .cell.future,
  .cell.untracked {
    background: transparent;
    color: var(--faint);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    margin-top: 12px;
  }

  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .sw {
    width: 14px;
    height: 14px;
    border-radius: 4px;
    display: inline-block;
    background: var(--heat-0);
  }
  .sw.lv1 {
    background: var(--heat-1);
  }
  .sw.lv2 {
    background: var(--heat-2);
  }
  .sw.lv3 {
    background: var(--heat-3);
  }
  .sw.lv4 {
    background: var(--heat-4);
  }

  .month-sum {
    margin-top: 10px;
  }

  .badges {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 10px;
  }

  .badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 14px 6px;
    border-radius: 16px;
    background: var(--surface-2);
    color: var(--faint);
  }

  .badge strong {
    font-size: 1.375rem;
    color: var(--muted);
  }

  .badge.got {
    background: var(--amber-soft);
    color: var(--amber-text);
  }

  .badge.got strong {
    color: var(--text);
  }
</style>
