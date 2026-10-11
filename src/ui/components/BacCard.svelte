<script lang="ts">
  import { app } from '../../state/app.svelte';
  import type { DriveEstimate } from '../../logic';
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
  const ate = $derived(app.day(dayKey).ate);
  let readingOpen = $state(false);

  const early = $derived(est.belowLimitEarliest ? roundUp5(est.belowLimitEarliest) : null);
  const safe = $derived(est.belowLimitSafer ? roundUp5(est.belowLimitSafer) : null);
  const soberLo = $derived(est.soberEarliest ? roundUp5(est.soberEarliest) : null);
  const soberHi = $derived(est.soberSafer ? roundUp5(est.soberSafer) : null);

  const readings = $derived(
    app.readings.filter((r) => est.slow && r.time >= est.slow.start && r.time <= now),
  );

  function rel(t: number) {
    return t > now ? `za ${fmtDuration(t - now)}` : 'szacunkowo już minęło';
  }
</script>

<section class="card" aria-labelledby="bac-title">
  <h2 class="card-title" id="bac-title"><Icon name="car" /> Promile i jazda</h2>

  {#if live}
    <div class="now-row">
      <span class="muted small">Szacunek teraz</span>
      <span class="big num">
        {#if est.nowHigh < 0.005}ok. 0{:else}{fmtPermille(est.nowLow)}–{fmtPermille(est.nowHigh)}{/if}<small>‰</small>
      </span>
    </div>
  {:else}
    <div class="now-row">
      <span class="muted small">Szacowany szczyt</span>
      <span class="big num">{fmtPermille(est.peakLow)}–{fmtPermille(est.peakHigh)}<small>‰</small></span>
    </div>
  {/if}

  {#if est.exceededLimit && early && safe}
    <p class="label-line small muted">Szacowane zejście poniżej {fmtNum(limit, 2)}‰ – przedział:</p>
    <div class="times">
      <div class="time-box">
        <span class="t-label">Najwcześniej</span>
        <span class="t-val num">{fmtWhen(early, now)}</span>
        {#if live}<span class="t-rel">{rel(early)}</span>{/if}
        <span class="t-note">spalanie 0,15‰/h</span>
      </div>
      <div class="time-box strong">
        <span class="t-label">Bezpieczniej</span>
        <span class="t-val num">{fmtWhen(safe, now)}</span>
        {#if live}<span class="t-rel">{rel(safe)}</span>{/if}
        <span class="t-note">spalanie 0,10‰/h</span>
      </div>
    </div>
    {#if live && safe <= now}
      <p class="small muted">
        Według obu wariantów szacunek spadł poniżej limitu między {fmtTime(early)} a {fmtTime(safe)}. To nadal tylko
        obliczenie, nie pomiar.
      </p>
    {/if}
  {:else if soberLo && soberHi}
    <p class="small muted">
      Szacunek nie przekroczył {fmtNum(limit, 2)}‰, ale alkohol nadal jest w organizmie. Szacowane zejście do 0‰:
      <strong class="num">{fmtWhen(soberLo, now)}–{fmtWhen(soberHi, now)}</strong>.
    </p>
  {/if}

  <BacChart {est} {limit} {now} />

  <div class="note caution" role="note">
    <Icon name="info" size={18} />
    <span>
      <strong>To tylko przybliżenie.</strong> Ludzie spalają alkohol nawet dwukrotnie różnie szybko, a wynik zależy też od
      jedzenia, zmęczenia, leków i zdrowia. Przed jazdą sprawdź się alkomatem. W razie wątpliwości nie jedź.
    </span>
  </div>

  {#if live}
    <div class="controls">
      <label class="switch">
        <input
          type="checkbox"
          checked={ate}
          onchange={(e) => app.updateDay(dayKey, { ate: (e.currentTarget as HTMLInputElement).checked })}
        />
        <span class="track"></span>
        <span>
          <span class="row" style="gap:6px"><Icon name="meal" size={18} /> Jadłem/jadłam</span>
          <span class="hint">Po jedzeniu alkohol wchłania się wolniej.</span>
        </span>
      </label>
      <button class="btn btn-outline btn-block" onclick={() => (readingOpen = true)}>
        <Icon name="gauge" /> Wpisz wynik z alkomatu
      </button>
      {#if readings.length}
        <ul class="list readings">
          {#each readings as r (r.id)}
            <li class="spread">
              <span class="num">{fmtTime(r.time)} · alkomat: <strong>{fmtPermille(r.permille)}‰</strong></span>
              <button class="icon-btn" aria-label="Usuń pomiar z {fmtTime(r.time)}" onclick={() => app.removeReading(r.id)}>
                <Icon name="trash" size={18} />
              </button>
            </li>
          {/each}
        </ul>
        <p class="hint">Szacunek od chwili pomiaru liczony jest od wyniku alkomatu.</p>
      {/if}
    </div>
  {/if}
</section>

{#if readingOpen}
  <ReadingSheet onclose={() => (readingOpen = false)} />
{/if}

<style>
  .now-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }

  .big {
    font-size: 1.75rem;
    font-weight: 750;
  }

  .big small {
    font-size: 1rem;
    margin-left: 2px;
    color: var(--muted);
  }

  .label-line {
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

  .t-note {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .note {
    margin-top: 12px;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 14px;
  }

  .switch .hint {
    display: block;
  }

  .readings li {
    padding: 2px 0;
  }
</style>
