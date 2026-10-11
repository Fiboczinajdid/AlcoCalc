<script lang="ts">
  import { app } from '../../state/app.svelte';
  import { GLASS_ML, suggestedWaterGlasses } from '../../logic';
  import { fmtVolume, plural } from '../format';
  import Icon from './Icon.svelte';

  let { dayKey, servings }: { dayKey: string; servings: number } = $props();

  const drunk = $derived(app.day(dayKey).waterGlasses);
  const suggested = $derived(suggestedWaterGlasses(servings));
  const pct = $derived(suggested > 0 ? Math.min(100, (drunk / suggested) * 100) : drunk > 0 ? 100 : 0);

  function change(delta: number) {
    app.updateDay(dayKey, { waterGlasses: Math.max(0, drunk + delta) });
  }
</script>

<section class="card" aria-labelledby="water-title">
  <h2 class="card-title" id="water-title"><Icon name="drop" /> Woda</h2>

  <div class="spread">
    <div>
      <div class="count num"><strong>{drunk}</strong>{#if suggested}&nbsp;/&nbsp;{suggested}{/if}&nbsp;<span>{plural(suggested || drunk, 'szklanka', 'szklanki', 'szklanek')}</span></div>
      <div class="muted small num">
        {fmtVolume(drunk * GLASS_ML)} wypite
        {#if suggested}· sugerowane {fmtVolume(suggested * GLASS_ML)}{/if}
      </div>
    </div>
    <div class="row">
      <button class="icon-btn minus" onclick={() => change(-1)} disabled={drunk === 0} aria-label="Odejmij szklankę">
        <Icon name="minus" />
      </button>
      <button class="btn btn-primary" onclick={() => change(1)}><Icon name="plus" /> Szklanka</button>
    </div>
  </div>

  <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax={suggested || 1} aria-valuenow={drunk} aria-label="Wypita woda">
    <div class="fill" style="width:{pct}%"></div>
  </div>
  <p class="hint">
    {#if suggested}
      Sugestia: szklanka wody (ok. 250 ml) do każdego napoju i jedna przed snem.
    {:else}
      Gdy pijesz alkohol, sugerujemy szklankę wody do każdego napoju i jedną przed snem.
    {/if}
  </p>

  <details>
    <summary>Kac – co realnie pomaga</summary>
    <div class="note" role="note">
      <Icon name="info" size={18} />
      <span>
        Nie da się całkowicie uniknąć kaca. Jedynym pewnym czynnikiem jest ilość wypitego alkoholu. Poniższe wskazówki
        mogą najwyżej trochę złagodzić samopoczucie. To nie są porady medyczne.
      </span>
    </div>
    <ul class="tips">
      <li><strong>Jedzenie</strong> przed piciem i w trakcie spowalnia wchłanianie.</li>
      <li><strong>Tempo:</strong> wolniej i z przerwami. Organizm spala ok. 0,1–0,15‰ na godzinę i nie da się tego przyspieszyć.</li>
      <li><strong>Woda</strong> między napojami i przed snem.</li>
      <li><strong>Elektrolity</strong> (np. woda mineralna, napój izotoniczny) mogą pomóc przy odwodnieniu.</li>
      <li><strong>Sen:</strong> alkohol pogarsza jego jakość, więc daj sobie więcej czasu na odpoczynek.</li>
    </ul>
  </details>
</section>

<style>
  .count {
    font-size: 1.125rem;
  }

  .count strong {
    font-size: 2rem;
    font-weight: 750;
  }

  .count span {
    color: var(--muted);
    font-size: 0.95rem;
  }

  .minus:disabled {
    opacity: 0.4;
  }

  .bar {
    height: 10px;
    border-radius: 999px;
    background: var(--surface-2);
    overflow: hidden;
    margin: 14px 0 8px;
  }

  .fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #8fb8d8, #5f9bc7);
    transition: width 0.35s var(--ease);
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
    margin: 12px 0 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.9375rem;
  }
</style>
