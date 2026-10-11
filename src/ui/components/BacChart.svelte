<script lang="ts">
  import { valueAt, type DriveEstimate } from '../../logic';
  import { fmtNum, fmtPermille } from '../format';

  let { est, limit, now }: { est: DriveEstimate; limit: number; now: number } = $props();

  const W = 340;
  const H = 190;
  const P = { l: 34, r: 10, t: 12, b: 26 };
  const HOUR = 3_600_000;

  const range = $derived.by(() => {
    const start = Math.min(est.slow?.start ?? now, est.fast?.start ?? now);
    const endData = Math.max(est.soberSafer ?? 0, est.belowLimitSafer ?? 0, now);
    let end = endData + 0.5 * HOUR;
    if (end - start < 3 * HOUR) end = start + 3 * HOUR;
    return { start, end };
  });

  const yMax = $derived.by(() => {
    const m = Math.max(est.peakHigh, limit * 1.6, 0.4) * 1.15;
    const step = m > 1.5 ? 0.5 : m > 0.8 ? 0.25 : 0.1;
    return Math.ceil(m / step) * step;
  });

  const yTicks = $derived.by(() => {
    const step = yMax > 1.5 ? 0.5 : yMax > 0.8 ? 0.25 : 0.1;
    const out: number[] = [];
    for (let v = 0; v <= yMax + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
    return out.length > 6 ? out.filter((_, i) => i % 2 === 0) : out;
  });

  const x = (t: number) => P.l + ((t - range.start) / (range.end - range.start)) * (W - P.l - P.r);
  const y = (v: number) => H - P.b - (v / yMax) * (H - P.t - P.b);

  const samples = $derived.by(() => {
    const pts: { t: number; lo: number; hi: number }[] = [];
    const step = Math.max(60_000, (range.end - range.start) / 160);
    for (let t = range.start; t <= range.end; t += step) {
      pts.push({ t, lo: valueAt(est.fast, t), hi: valueAt(est.slow, t) });
    }
    return pts;
  });

  const line = (key: 'lo' | 'hi') =>
    samples.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p[key]).toFixed(1)}`).join('');

  const band = $derived(
    samples.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.hi).toFixed(1)}`).join('') +
      [...samples].reverse().map((p) => `L${x(p.t).toFixed(1)},${y(p.lo).toFixed(1)}`).join('') +
      'Z',
  );

  const xTicks = $derived.by(() => {
    const span = range.end - range.start;
    const stepH = span > 12 * HOUR ? 4 : span > 6 * HOUR ? 2 : 1;
    const first = new Date(range.start);
    first.setMinutes(0, 0, 0);
    first.setHours(first.getHours() + 1);
    const out: { t: number; label: string }[] = [];
    for (let t = first.getTime(); t < range.end; t += HOUR) {
      const h = new Date(t).getHours();
      if (h % stepH === 0) out.push({ t, label: `${String(h).padStart(2, '0')}:00` });
    }
    return out;
  });

  const showNow = $derived(now >= range.start && now <= range.end);
  const summary = $derived(
    `Wykres szacowanych promili. Szczyt około ${fmtPermille(est.peakLow)}–${fmtPermille(est.peakHigh)} promila.`,
  );
</script>

<svg viewBox="0 0 {W} {H}" role="img" aria-label={summary} class="chart">
  {#each yTicks as v (v)}
    <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} class="grid" />
    <text x={P.l - 6} y={y(v) + 4} class="tick" text-anchor="end">{fmtNum(v, 2)}</text>
  {/each}
  {#each xTicks as t (t.t)}
    <text x={x(t.t)} y={H - 8} class="tick" text-anchor="middle">{t.label}</text>
  {/each}

  <path d={band} class="band" />
  <path d={line('hi')} class="line hi" />
  <path d={line('lo')} class="line lo" />

  <line x1={P.l} x2={W - P.r} y1={y(limit)} y2={y(limit)} class="limit" />
  <text x={W - P.r - 2} y={y(limit) - 5} class="limit-label" text-anchor="end">limit {fmtNum(limit, 2)}‰</text>

  {#if showNow}
    <line x1={x(now)} x2={x(now)} y1={P.t} y2={H - P.b} class="now" />
    <text x={x(now) + 4} y={P.t + 9} class="now-label">teraz</text>
  {/if}
</svg>
<div class="legend small muted">
  <span><i class="sw lo"></i>spalanie 0,15‰/h</span>
  <span><i class="sw hi"></i>spalanie 0,10‰/h</span>
</div>

<style>
  .chart {
    width: 100%;
    height: auto;
    display: block;
    overflow: visible;
  }

  .grid {
    stroke: var(--border);
    stroke-width: 1;
  }

  .tick {
    font-size: 10px;
    fill: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .band {
    fill: var(--chart-band);
  }

  .line {
    fill: none;
    stroke: var(--chart-line);
    stroke-width: 2;
    stroke-linejoin: round;
  }

  .line.hi {
    stroke-dasharray: 5 4;
  }

  .limit {
    stroke: var(--chart-limit);
    stroke-width: 1.5;
    stroke-dasharray: 2 4;
  }

  .limit-label {
    font-size: 10px;
    font-weight: 600;
    fill: var(--muted);
  }

  .now {
    stroke: var(--text);
    stroke-width: 1;
    opacity: 0.5;
  }

  .now-label {
    font-size: 10px;
    fill: var(--muted);
  }

  .legend {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .sw {
    display: inline-block;
    width: 18px;
    height: 0;
    border-top: 2px solid var(--chart-line);
  }

  .sw.hi {
    border-top-style: dashed;
  }
</style>
