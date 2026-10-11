<script lang="ts" module>
  interface Candidate {
    id: number;
    name: string;
    volumeMl: number;
    abv: number;
    count: number;
    price: number | null;
  }
  // Porównanie żyje do zamknięcia aplikacji – nic nie trafia do bazy.
  let compare = $state<Candidate[]>([]);
</script>

<script lang="ts">
  import { app } from '../../state/app.svelte';
  import { mlToGrams, pricePerUnit, pureAlcoholMl, toUnits } from '../../logic';
  import { fmtAbv, fmtMoney, fmtNum, fmtUnits, fmtVolume, parseNum } from '../format';
  import Sheet from './Sheet.svelte';
  import Stepper from './Stepper.svelte';
  import Icon from './Icon.svelte';

  let { onclose }: { onclose: () => void } = $props();

  let name = $state('');
  let volume = $state('');
  let abv = $state('');
  let count = $state(1);
  let price = $state('');

  const vol = $derived(parseNum(volume));
  const pct = $derived(parseNum(abv));
  const cost = $derived(parseNum(price));
  const ok = $derived(vol !== null && vol > 0 && pct !== null && pct > 0 && pct <= 100);
  const alcoholMl = $derived(ok ? pureAlcoholMl(vol!, pct!, count) : 0);
  const unit = $derived(app.activeUnit);
  const currency = $derived(app.profile?.currency ?? 'PLN');
  const others = $derived(app.units.filter((u) => u.id !== unit?.id));
  const perUnit = $derived(ok && unit && cost && cost > 0 ? pricePerUnit(vol!, pct!, cost, unit) : null);

  const label = () => name.trim() || `Napój ${fmtAbv(pct!)}`;

  function addToCompare() {
    if (!ok) return;
    compare.push({ id: Date.now(), name: name.trim() || `Opcja ${compare.length + 1}`, volumeMl: vol!, abv: pct!, count, price: cost && cost > 0 ? cost : null });
    name = '';
    volume = '';
    abv = '';
    price = '';
    count = 1;
  }

  async function logIt() {
    if (!ok) return;
    await app.addDrink({
      name: label(),
      volumeMl: vol!,
      abv: pct!,
      count,
      time: Date.now(),
      price: cost && cost > 0 ? cost : null,
    });
    onclose();
  }
</script>

<Sheet title="Sprawdź przed zakupem" {onclose}>
  <p class="muted small">Tylko przeliczenie. Nic nie zapisuje się do wieczoru, dopóki sam/sama tego nie zrobisz.</p>

  <div class="stack">
    <div class="field">
      <label for="ck-name">Nazwa (opcjonalnie)</label>
      <input id="ck-name" class="input" bind:value={name} placeholder="np. Piwo mocne w puszce" maxlength="60" />
    </div>
    <div class="grid-2">
      <div class="field">
        <label for="ck-vol">Objętość</label>
        <div class="input-suffix">
          <input id="ck-vol" class="input num" inputmode="numeric" bind:value={volume} placeholder="400" />
          <span>ml</span>
        </div>
      </div>
      <div class="field">
        <label for="ck-abv">Moc</label>
        <div class="input-suffix">
          <input id="ck-abv" class="input num" inputmode="decimal" bind:value={abv} placeholder="8" />
          <span>%</span>
        </div>
      </div>
    </div>
    <div class="grid-2">
      <div class="field">
        <span class="label">Sztuk</span>
        <Stepper bind:value={count} label="Liczba sztuk" />
      </div>
      <div class="field">
        <label for="ck-price">Cena za sztukę</label>
        <div class="input-suffix">
          <input id="ck-price" class="input num" inputmode="decimal" bind:value={price} placeholder="opcj." />
          <span>{currency}</span>
        </div>
      </div>
    </div>
  </div>

  {#if ok && unit}
    <div class="result fade-in" aria-live="polite">
      <div class="calc num small muted">
        {count} × {fmtNum(vol!, 0)} ml × {fmtAbv(pct!)} = <strong>{fmtNum(alcoholMl, 1)} ml</strong> czystego alkoholu
        ({fmtNum(mlToGrams(alcoholMl), 1)} g)
      </div>
      <div class="big num">= {fmtUnits(toUnits(alcoholMl, unit))} <span>× {unit.name}</span></div>
      {#if others.length}
        <div class="chips">
          {#each others as u (u.id)}
            <span class="chip static num">= {fmtUnits(toUnits(alcoholMl, u))} × {u.name}</span>
          {/each}
        </div>
      {/if}
      {#if perUnit !== null}
        <p class="num">Cena za 1 × {unit.name}: <strong>{fmtMoney(perUnit, currency)}</strong></p>
      {/if}
      <div class="grid-2">
        <button class="btn btn-outline" onclick={addToCompare}><Icon name="scale" size={18} /> Porównaj</button>
        <button class="btn btn-primary" onclick={logIt}><Icon name="plus" size={18} /> Zapisz wypite</button>
      </div>
    </div>
  {/if}

  {#if compare.length && unit}
    <section aria-labelledby="cmp-title" class="stack">
      <div class="spread">
        <h3 id="cmp-title" class="cmp-title">Porównanie</h3>
        <button class="btn btn-ghost small" onclick={() => (compare.length = 0)}>Wyczyść</button>
      </div>
      <ul class="list cmp">
        {#each compare as c (c.id)}
          {@const ml = pureAlcoholMl(c.volumeMl, c.abv, c.count)}
          {@const pu = c.price ? pricePerUnit(c.volumeMl, c.abv, c.price, unit) : null}
          <li>
            <div class="cmp-main">
              <span class="cmp-name">{c.count > 1 ? `${c.count} × ` : ''}{c.name}</span>
              <span class="muted small num">
                {fmtVolume(c.volumeMl)} · {fmtAbv(c.abv)}{#if c.price}&nbsp;· {fmtMoney(c.price * c.count, currency)}{/if}
              </span>
            </div>
            <div class="cmp-val num">
              <strong>{fmtUnits(toUnits(ml, unit))}</strong>
              {#if pu !== null}<span class="small muted">{fmtMoney(pu, currency)}/jedn.</span>{/if}
            </div>
            <button class="icon-btn" aria-label="Usuń {c.name} z porównania" onclick={() => compare.splice(compare.findIndex((x) => x.id === c.id), 1)}>
              <Icon name="close" size={18} />
            </button>
          </li>
        {/each}
      </ul>
      <p class="hint">Wartości w jednostce: {unit.name}. „/jedn.” to cena za jedną taką jednostkę alkoholu.</p>
    </section>
  {/if}
</Sheet>

<style>
  .result {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-radius: 18px;
    background: var(--amber-soft);
  }

  .big {
    font-size: 2rem;
    font-weight: 750;
    line-height: 1.15;
  }

  .big span {
    font-size: 1rem;
    font-weight: 600;
  }

  .chip.static {
    background: var(--surface);
    min-height: 36px;
  }

  .cmp-title {
    font-size: 1.05rem;
  }

  .cmp li {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
  }

  .cmp li + li {
    border-top: 1px solid var(--border);
  }

  .cmp-main {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .cmp-name {
    font-weight: 650;
  }

  .cmp-val {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .cmp-val strong {
    font-size: 1.25rem;
  }
</style>
