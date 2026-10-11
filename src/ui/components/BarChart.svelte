<script lang="ts">
  let {
    values,
    labels,
    format,
    caption,
  }: { values: number[]; labels: string[]; format: (n: number) => string; caption: string } = $props();

  const W = 340;
  const H = 170;
  const P = { l: 4, r: 4, t: 22, b: 24 };
  const max = $derived(Math.max(...values, 0));
  const slot = $derived((W - P.l - P.r) / Math.max(1, values.length));
  const barW = $derived(Math.min(34, slot * 0.62));
  const showAll = $derived(values.length <= 8);
  const h = (v: number) => (max > 0 ? (v / max) * (H - P.t - P.b) : 0);
</script>

<svg viewBox="0 0 {W} {H}" class="chart" role="img" aria-label={caption}>
  <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} class="axis" />
  {#each values as v, i (i)}
    {@const cx = P.l + slot * i + slot / 2}
    {@const bh = h(v)}
    {@const last = i === values.length - 1}
    <rect
      x={cx - barW / 2}
      y={H - P.b - Math.max(bh, v > 0 ? 3 : 0)}
      width={barW}
      height={Math.max(bh, v > 0 ? 3 : 0)}
      rx="5"
      class="bar"
      class:last
    />
    {#if v > 0 && (showAll || last || v === max)}
      <text x={cx} y={H - P.b - bh - 6} class="val" text-anchor="middle">{format(v)}</text>
    {/if}
    {#if showAll || i % 2 === values.length % 2 || last}
      <text x={cx} y={H - 7} class="lbl" text-anchor="middle">{labels[i]}</text>
    {/if}
  {/each}
</svg>
<table class="visually-hidden">
  <caption>{caption}</caption>
  <tbody>
    {#each values as v, i (i)}
      <tr><th scope="row">{labels[i]}</th><td>{format(v)}</td></tr>
    {/each}
  </tbody>
</table>

<style>
  .chart {
    width: 100%;
    height: auto;
    display: block;
  }

  .axis {
    stroke: var(--border);
  }

  .bar {
    fill: var(--heat-2);
  }

  .bar.last {
    fill: var(--amber);
  }

  .val {
    font-size: 10px;
    font-weight: 650;
    fill: var(--text);
    font-variant-numeric: tabular-nums;
  }

  .lbl {
    font-size: 10px;
    fill: var(--muted);
  }
</style>
