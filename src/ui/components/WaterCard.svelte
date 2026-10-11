<script lang="ts">
  import { app } from '../../state/app.svelte';
  import { suggestedWaterMl } from '../../logic';
  import { fmtVolume, parseNum } from '../format';
  import Icon from './Icon.svelte';

  let { dayKey, servings }: { dayKey: string; servings: number } = $props();

  const drunk = $derived(app.day(dayKey).waterMl);
  const suggested = $derived(suggestedWaterMl(servings));
  const pct = $derived(suggested > 0 ? Math.min(100, (drunk / suggested) * 100) : drunk > 0 ? 100 : 0);

  let amount = $state('');
  const ml = $derived(parseNum(amount));
  const ok = $derived(ml !== null && ml > 0 && ml <= 5000);

  function change(sign: 1 | -1) {
    if (!ok) return;
    app.updateDay(dayKey, { waterMl: Math.max(0, Math.round(drunk + sign * ml!)) });
    amount = '';
  }
</script>

<section class="card" aria-labelledby="water-title">
  <h2 class="card-title" id="water-title"><Icon name="drop" /> Woda</h2>

  <div class="total num">
    <strong>{fmtVolume(drunk)}</strong>
    {#if suggested}<span> / {fmtVolume(suggested)}</span>{/if}
  </div>
  <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax={suggested || 1} aria-valuenow={drunk} aria-label="Wypita woda">
    <div class="fill" style="width:{pct}%"></div>
  </div>

  <form
    class="add"
    onsubmit={(e) => {
      e.preventDefault();
      change(1);
    }}
  >
    <div class="input-suffix">
      <input class="input num" inputmode="numeric" bind:value={amount} placeholder="np. 330" aria-label="Ilość wody w ml" />
      <span>ml</span>
    </div>
    <button type="button" class="icon-btn minus" onclick={() => change(-1)} disabled={!ok || drunk === 0} aria-label="Odejmij">
      <Icon name="minus" />
    </button>
    <button type="submit" class="btn btn-primary" disabled={!ok}><Icon name="plus" /> Dodaj</button>
  </form>

  <details>
    <summary>Kac</summary>
    <ul class="tips">
      <li>Jedz przed piciem i w trakcie.</li>
      <li>Pij wolniej, z przerwami.</li>
      <li>Woda między napojami i przed snem.</li>
      <li>Elektrolity (woda mineralna, izotonik).</li>
      <li>Więcej snu.</li>
    </ul>
    <p class="hint">Całkiem uniknąć kaca się nie da, liczy się głównie ilość alkoholu.</p>
  </details>
</section>

<style>
  .total {
    font-size: 1rem;
    color: var(--muted);
  }

  .total strong {
    font-size: 2rem;
    font-weight: 750;
    color: var(--text);
  }

  .bar {
    height: 10px;
    border-radius: 999px;
    background: var(--surface-2);
    overflow: hidden;
    margin: 10px 0 14px;
  }

  .fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #8fb8d8, #5f9bc7);
    transition: width 0.35s var(--ease);
  }

  .add {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 8px;
    align-items: center;
  }

  .minus:disabled {
    opacity: 0.35;
  }

  details {
    margin-top: 12px;
    border-top: 1px solid var(--border);
    padding-top: 6px;
  }

  summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    font-weight: 650;
    cursor: pointer;
    list-style: none;
  }

  summary::after {
    content: '';
    margin-left: auto;
    width: 9px;
    height: 9px;
    border-right: 2px solid var(--muted);
    border-bottom: 2px solid var(--muted);
    transform: rotate(45deg);
    transition: transform 0.2s;
  }

  details[open] summary::after {
    transform: rotate(-135deg);
  }

  summary::-webkit-details-marker {
    display: none;
  }

  .tips {
    margin: 4px 0 8px;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.9375rem;
  }
</style>
