<script lang="ts">
  import { app } from '../../state/app.svelte';
  import { intoxication, type DriveEstimate } from '../../logic';
  import { fmtDuration, fmtNum, fmtPermille, fmtTime, fmtWhen, roundUp5 } from '../format';
  import BacChart from './BacChart.svelte';
  import ReadingSheet from './ReadingSheet.svelte';
  import Icon from './Icon.svelte';

  let {
    est,
    now,
    live = true,
    dayKey,
  }: { est: DriveEstimate; now: number; live?: boolean; dayKey: string } = $props();

  const limit = $derived(app.profile?.limitPermille ?? 0.2);
  const sex = $derived(app.profile?.sex ?? 'm');
  const ate = $derived(app.day(dayKey).ate);
  let readingOpen = $state(false);

  const early = $derived(est.belowLimitEarliest ? roundUp5(est.belowLimitEarliest) : null);
  const safe = $derived(est.belowLimitSafer ? roundUp5(est.belowLimitSafer) : null);
  const soberLo = $derived(est.soberEarliest ? roundUp5(est.soberEarliest) : null);
  const soberHi = $derived(est.soberSafer ? roundUp5(est.soberSafer) : null);

  const nowState = $derived(intoxication((est.nowLow + est.nowHigh) / 2, sex));
  const peakState = $derived(intoxication((est.peakLow + est.peakHigh) / 2, sex));
  const peakAhead = $derived(est.peakAt !== null && est.peakAt > now);

  const readings = $derived(
    app.readings.filter((r) => est.slow && r.time >= est.slow.start && r.time <= now),
  );

  const range = (lo: number, hi: number) =>
    Math.abs(hi - lo) < 0.005 ? fmtPermille(hi) : `${fmtPermille(lo)}–${fmtPermille(hi)}`;
  const rel = (t: number) => (t > now ? `za ${fmtDuration(t - now)}` : 'minęło');
</script>

<section class="card" aria-labelledby="bac-title">
  <h2 class="card-title" id="bac-title"><Icon name="car" /> Promile</h2>

  <div class="levels">
    {#if live}
      <div class="lv-row">
        <span class="lv-label">Teraz</span>
        <span class="lv-val num">{est.nowHigh < 0.005 ? '0,00' : range(est.nowLow, est.nowHigh)}<small>‰</small></span>
        <span class="pill l{nowState.level}">{nowState.label}</span>
      </div>
    {/if}
    {#if est.peakAt}
      <div class="lv-row peak">
        <span class="lv-label">
          {live && peakAhead ? 'Szczyt' : 'Szczyt był'}
          <span class="lv-time num">ok. {fmtWhen(roundUp5(est.peakAt), now)}</span>
        </span>
        <span class="lv-val num">{range(est.peakLow, est.peakHigh)}<small>‰</small></span>
        <span class="pill l{peakState.level}">{peakState.label}</span>
      </div>
    {/if}
  </div>

  {#if est.exceededLimit && early && safe}
    <p class="sub-title">Poniżej {fmtNum(limit, 2)}‰</p>
    <div class="times">
      <div class="time-box">
        <span class="t-label">Najwcześniej</span>
        <span class="t-val num">{fmtWhen(early, now)}</span>
        {#if live}<span class="t-rel">{rel(early)}</span>{/if}
      </div>
      <div class="time-box strong">
        <span class="t-label">Bezpieczniej</span>
        <span class="t-val num">{fmtWhen(safe, now)}</span>
        {#if live}<span class="t-rel">{rel(safe)}</span>{/if}
      </div>
    </div>
  {:else if soberLo && soberHi}
    <p class="sub-title num">0‰ ok. {fmtWhen(soberLo, now)}–{fmtWhen(soberHi, now)}</p>
  {/if}

  <BacChart {est} {limit} {now} />

  {#if live}
    <div class="controls">
      <label class="switch">
        <input
          type="checkbox"
          checked={ate}
          onchange={(e) => app.updateDay(dayKey, { ate: (e.currentTarget as HTMLInputElement).checked })}
        />
        <span class="track"></span>
        <span class="row" style="gap:6px"><Icon name="meal" size={18} /> {sex === 'f' ? 'Jadłam' : 'Jadłem'}</span>
      </label>
      <button class="btn btn-outline btn-block" onclick={() => (readingOpen = true)}>
        <Icon name="gauge" /> Wynik z alkomatu
      </button>
      {#if readings.length}
        <ul class="list readings">
          {#each readings as r (r.id)}
            <li class="spread">
              <span class="num">{fmtTime(r.time)} · alkomat <strong>{fmtPermille(r.permille)}‰</strong></span>
              <button class="icon-btn" aria-label="Usuń pomiar z {fmtTime(r.time)}" onclick={() => app.removeReading(r.id)}>
                <Icon name="trash" size={18} />
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</section>

{#if readingOpen}
  <ReadingSheet onclose={() => (readingOpen = false)} />
{/if}

<style>
  .levels {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 14px;
  }

  .lv-row {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'label val'
      'pill pill';
    align-items: baseline;
    gap: 4px 8px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--surface-2);
  }

  .lv-row.peak {
    background: var(--amber-soft);
  }

  .lv-label {
    grid-area: label;
    font-weight: 650;
    display: flex;
    flex-direction: column;
  }

  .lv-time {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--muted);
  }

  .lv-val {
    grid-area: val;
    font-size: 1.75rem;
    font-weight: 750;
    text-align: right;
  }

  .lv-val small {
    font-size: 1rem;
    margin-left: 2px;
    color: var(--muted);
  }

  .pill {
    grid-area: pill;
    justify-self: start;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 0.875rem;
    font-weight: 650;
    background: var(--surface);
  }

  .pill.l1,
  .pill.l2 {
    background: var(--heat-1);
    color: #3a2600;
  }

  .pill.l3 {
    background: var(--heat-3);
    color: #2a1a00;
  }

  .pill.l4,
  .pill.l5 {
    background: var(--heat-4);
    color: #fff;
  }

  @media (prefers-color-scheme: dark) {
    .pill.l1,
    .pill.l2 {
      color: #f6e3bf;
    }
    .pill.l4,
    .pill.l5 {
      color: #1e1300;
    }
  }

  .sub-title {
    font-size: 0.875rem;
    font-weight: 650;
    color: var(--muted);
    margin-bottom: 8px;
  }

  .times {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 12px;
  }

  .time-box {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px;
    border-radius: 14px;
    background: var(--surface-2);
  }

  .time-box.strong {
    background: var(--amber-soft);
  }

  .t-label {
    font-size: 0.8125rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
  }

  .t-val {
    font-size: 1.5rem;
    font-weight: 750;
  }

  .t-rel {
    font-size: 0.875rem;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 14px;
  }

  .readings li {
    padding: 2px 0;
  }
</style>
