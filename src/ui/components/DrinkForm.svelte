<script lang="ts">
  import { untrack } from 'svelte';
  import { app } from '../../state/app.svelte';
  import {
    dayKey as toDayKey,
    mlToGrams,
    pureAlcoholMl,
    timeOnDay,
    toUnits,
    type Drink,
    type Preset,
  } from '../../logic';
  import { fmtAbv, fmtMoney, fmtNum, fmtTime, fmtUnits, fmtVolume, parseNum } from '../format';
  import Sheet from './Sheet.svelte';
  import Stepper from './Stepper.svelte';
  import Icon from './Icon.svelte';

  let {
    dayKey,
    drink = null,
    onclose,
  }: { dayKey: string; drink?: Drink | null; onclose: () => void } = $props();

  // Formularz startuje od wartości z chwili otwarcia.
  const init = untrack(() => ({ drink, isToday: dayKey === app.todayKey }));
  const editing = init.drink !== null;

  let name = $state(init.drink?.name ?? '');
  let volume = $state(init.drink ? String(init.drink.volumeMl) : '');
  let abv = $state(init.drink ? String(init.drink.abv).replace('.', ',') : '');
  let count = $state(init.drink?.count ?? 1);
  let time = $state(init.drink ? fmtTime(init.drink.time) : init.isToday ? fmtTime(Date.now()) : '20:00');
  let price = $state(init.drink?.price != null ? String(init.drink.price).replace('.', ',') : '');
  let picked = $state<string | null>(null);
  let submitted = $state(false);
  let saveAsPreset = $state(false);
  let managing = $state(false);

  const vol = $derived(parseNum(volume));
  const pct = $derived(parseNum(abv));
  const cost = $derived(parseNum(price));
  const volOk = $derived(vol !== null && vol > 0 && vol <= 5000);
  const pctOk = $derived(pct !== null && pct >= 0 && pct <= 100);
  const priceOk = $derived(price.trim() === '' || (cost !== null && cost >= 0));
  const valid = $derived(volOk && pctOk && priceOk && name.trim().length > 0 && /^\d{1,2}:\d{2}$/.test(time));

  const alcoholMl = $derived(volOk && pctOk ? pureAlcoholMl(vol!, pct!, count) : 0);
  const unit = $derived(app.activeUnit);

  const timestamp = $derived.by(() => {
    const [h, m] = time.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    // Edycja: zachowaj dzień logiczny napoju.
    const key = drink ? toDayKey(drink.time, app.startHour) : dayKey;
    return timeOnDay(key, h, m, app.startHour);
  });
  const inFuture = $derived(timestamp !== null && timestamp > Date.now() + 5 * 60_000);

  const presets = $derived([...app.presets].sort((a, b) => a.name.localeCompare(b.name, 'pl')));

  function pick(p: Preset) {
    picked = p.id;
    name = p.name;
    volume = String(p.volumeMl);
    abv = String(p.abv).replace('.', ',');
    price = p.price != null ? String(p.price).replace('.', ',') : '';
  }

  async function removePreset(p: Preset) {
    const copy = $state.snapshot(p) as Preset;
    await app.removePreset(p.id);
    if (picked === p.id) picked = null;
    if (!app.presets.length) managing = false;
    app.showToast(`Usunięto z listy: ${copy.name}`, 'Cofnij', () => app.savePreset(copy));
  }

  async function save() {
    submitted = true;
    if (!valid || timestamp === null) return;
    const data = {
      name: name.trim(),
      volumeMl: vol!,
      abv: pct!,
      count,
      time: timestamp,
      price: price.trim() === '' ? null : cost,
    };
    if (drink) await app.updateDrink({ ...data, id: drink.id });
    else await app.addDrink(data);
    if (saveAsPreset && !picked) {
      await app.savePreset({ name: data.name, volumeMl: data.volumeMl, abv: data.abv, price: data.price });
    }
    onclose();
  }

  async function remove() {
    if (!drink) return;
    await app.removeDrink(drink.id);
    onclose();
  }
</script>

<Sheet title={editing ? 'Edytuj napój' : 'Dodaj napój'} {onclose}>
  {#if !editing && presets.length}
    <section aria-labelledby="df-presets" class="stack">
      <div class="spread">
        <h3 id="df-presets" class="presets-title">Moje napoje</h3>
        <button type="button" class="btn btn-ghost small manage" onclick={() => (managing = !managing)}>
          {managing ? 'Gotowe' : 'Usuń z listy'}
        </button>
      </div>
      <div class="templates">
        {#each presets as p (p.id)}
          {#if managing}
            <button type="button" class="tpl removing" onclick={() => removePreset(p)} aria-label="Usuń z listy: {p.name}">
              <span class="tpl-name">{p.name}</span>
              <span class="tpl-meta num">{fmtVolume(p.volumeMl)} · {fmtAbv(p.abv)}</span>
              <span class="tpl-x"><Icon name="close" size={16} /></span>
            </button>
          {:else}
            <button type="button" class="tpl" aria-pressed={picked === p.id} onclick={() => pick(p)}>
              <span class="tpl-name">{p.name}</span>
              <span class="tpl-meta num">{fmtVolume(p.volumeMl)} · {fmtAbv(p.abv)}</span>
            </button>
          {/if}
        {/each}
      </div>
    </section>
  {/if}

  <form
    class="stack"
    onsubmit={(e) => {
      e.preventDefault();
      save();
    }}
    novalidate
  >
    <div class="field">
      <label for="df-name">Nazwa</label>
      <input id="df-name" class="input" bind:value={name} placeholder="np. Piwo 8%" autocomplete="off" maxlength="60" />
      {#if submitted && !name.trim()}<span class="error-text">Podaj nazwę.</span>{/if}
    </div>

    <div class="grid-2">
      <div class="field">
        <label for="df-vol">Objętość</label>
        <div class="input-suffix">
          <input id="df-vol" class="input num" inputmode="numeric" bind:value={volume} placeholder="500" />
          <span>ml</span>
        </div>
      </div>
      <div class="field">
        <label for="df-abv">Moc</label>
        <div class="input-suffix">
          <input id="df-abv" class="input num" inputmode="decimal" bind:value={abv} placeholder="5" />
          <span>%</span>
        </div>
      </div>
    </div>
    <div class="chips" aria-label="Szybka objętość">
      {#each [330, 400, 500, 150, 50] as v (v)}
        <button type="button" class="chip num" aria-pressed={vol === v} onclick={() => (volume = String(v))}>{v} ml</button>
      {/each}
    </div>
    {#if submitted && !volOk}<span class="error-text">Podaj objętość w ml (np. 500).</span>{/if}
    {#if submitted && !pctOk}<span class="error-text">Podaj moc w procentach (0–100).</span>{/if}

    <div class="field">
      <span class="label">Liczba sztuk</span>
      <Stepper bind:value={count} label="Liczba sztuk" />
    </div>

    <div class="grid-2">
      <div class="field">
        <label for="df-time">Godzina</label>
        <input id="df-time" class="input num" type="time" bind:value={time} />
      </div>
      <div class="field">
        <label for="df-price">Cena za sztukę</label>
        <div class="input-suffix">
          <input id="df-price" class="input num" inputmode="decimal" bind:value={price} placeholder="opcjonalnie" />
          <span>{app.profile?.currency ?? 'PLN'}</span>
        </div>
      </div>
    </div>
    {#if inFuture}<span class="hint">Godzina w przyszłości.</span>{/if}
    {#if submitted && !priceOk}<span class="error-text">Cena musi być liczbą.</span>{/if}

    {#if alcoholMl > 0 && unit}
      <div class="preview fade-in" aria-live="polite">
        <div class="preview-big num">= {fmtUnits(toUnits(alcoholMl, unit))} <span>× {unit.name}</span></div>
        <div class="muted small num">
          {fmtNum(alcoholMl, 1)} ml czystego alkoholu · {fmtNum(mlToGrams(alcoholMl), 1)} g
          {#if cost && cost > 0}· razem {fmtMoney(cost * count, app.profile?.currency ?? 'PLN')}{/if}
        </div>
      </div>
    {/if}

    {#if !editing && !picked}
      <label class="switch">
        <input type="checkbox" bind:checked={saveAsPreset} />
        <span class="track"></span>
        <span>Zapisz w „Moich napojach”</span>
      </label>
    {/if}

    <div class="footer">
      {#if editing}
        <div class="grid-2">
          <button type="button" class="btn btn-danger btn-lg" onclick={remove}><Icon name="trash" /> Usuń</button>
          <button type="submit" class="btn btn-primary btn-lg">Zapisz</button>
        </div>
      {:else}
        <button type="submit" class="btn btn-primary btn-lg btn-block" disabled={submitted && !valid}>
          <Icon name="plus" /> Dodaj{count > 1 ? ` ${count} szt.` : ''}
        </button>
      {/if}
    </div>
  </form>
</Sheet>

<style>
  .templates {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }

  .tpl {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    min-height: 60px;
    padding: 10px 12px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: var(--surface);
    text-align: left;
    transition: border-color 0.15s, background 0.15s, transform 0.1s;
  }

  .presets-title {
    font-size: 1rem;
  }

  .manage {
    min-height: 40px;
    color: var(--amber-text);
  }

  .tpl {
    position: relative;
  }

  .tpl.removing {
    border-style: dashed;
    padding-right: 34px;
  }

  .tpl-x {
    position: absolute;
    top: 8px;
    right: 8px;
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--surface-3);
  }

  .tpl:active {
    transform: scale(0.97);
  }

  .tpl[aria-pressed='true'] {
    border-color: var(--amber);
    background: var(--amber-soft);
  }

  .tpl-name {
    font-weight: 650;
    font-size: 0.9375rem;
    line-height: 1.2;
  }

  .tpl-meta {
    font-size: 0.8125rem;
    color: var(--muted);
  }

  .preview {
    padding: 14px;
    border-radius: 14px;
    background: var(--amber-soft);
  }

  .preview-big {
    font-size: 1.5rem;
    font-weight: 750;
  }

  .preview-big span {
    font-size: 1rem;
    font-weight: 600;
  }

  .footer {
    position: sticky;
    bottom: calc(-20px - env(safe-area-inset-bottom));
    padding: 10px 0 calc(4px + env(safe-area-inset-bottom));
    background: linear-gradient(to bottom, transparent, var(--bg) 14px);
  }
</style>
