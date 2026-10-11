<script lang="ts">
  import { app } from '../../state/app.svelte';
  import { drinkAlcoholMl, toUnits, type Drink } from '../../logic';
  import { fmtAbv, fmtMoney, fmtTime, fmtUnits, fmtVolume } from '../format';
  import Icon from './Icon.svelte';

  let { drinks, onedit }: { drinks: Drink[]; onedit: (d: Drink) => void } = $props();
  const unit = $derived(app.activeUnit);
  const sorted = $derived([...drinks].sort((a, b) => b.time - a.time));
</script>

<ul class="list drinks">
  {#each sorted as d (d.id)}
    <li>
      <button class="item" onclick={() => onedit(d)} aria-label="Edytuj: {d.name}, {fmtTime(d.time)}">
        <span class="time num">{fmtTime(d.time)}</span>
        <span class="main">
          <span class="name">{d.count > 1 ? `${d.count} × ` : ''}{d.name}</span>
          <span class="meta num">
            {fmtVolume(d.volumeMl)} · {fmtAbv(d.abv)}{#if d.price}&nbsp;· {fmtMoney(d.price * d.count, app.profile?.currency ?? 'PLN')}{/if}
          </span>
        </span>
        {#if unit}<span class="eq num">{fmtUnits(toUnits(drinkAlcoholMl(d), unit))}</span>{/if}
        <Icon name="edit" size={16} />
      </button>
    </li>
  {/each}
</ul>

<style>
  .drinks li + li {
    border-top: 1px solid var(--border);
  }

  .item {
    width: 100%;
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 2px;
    background: none;
    border: none;
    text-align: left;
    color: var(--text);
  }

  .item :global(svg) {
    color: var(--faint);
  }

  .time {
    font-weight: 650;
    color: var(--muted);
    font-size: 0.9375rem;
  }

  .main {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .name {
    font-weight: 650;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta {
    font-size: 0.8125rem;
    color: var(--muted);
  }

  .eq {
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--amber-soft);
    font-size: 0.9375rem;
  }
</style>
