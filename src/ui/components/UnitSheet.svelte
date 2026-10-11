<script lang="ts">
  import { untrack } from 'svelte';
  import { app, uid } from '../../state/app.svelte';
  import { mlToGrams, pureAlcoholMl, type Unit } from '../../logic';
  import { fmtNum, parseNum } from '../format';
  import Sheet from './Sheet.svelte';
  import Icon from './Icon.svelte';

  let { unit = null, onclose }: { unit?: Unit | null; onclose: () => void } = $props();

  const initial = untrack(() => unit);
  let name = $state(initial?.name ?? '');
  let volume = $state(initial ? String(initial.volumeMl) : '');
  let abv = $state(initial ? String(initial.abv).replace('.', ',') : '');
  let submitted = $state(false);

  const vol = $derived(parseNum(volume));
  const pct = $derived(parseNum(abv));
  const ok = $derived(!!name.trim() && vol !== null && vol > 0 && vol <= 5000 && pct !== null && pct > 0 && pct <= 100);
  const ml = $derived(ok ? pureAlcoholMl(vol!, pct!) : 0);

  async function save() {
    submitted = true;
    if (!ok) return;
    await app.saveUnit({ id: unit?.id ?? uid(), name: name.trim(), volumeMl: vol!, abv: pct! });
    onclose();
  }

  async function remove() {
    if (!unit) return;
    await app.removeUnit(unit.id);
    onclose();
  }
</script>

<Sheet title={unit ? 'Edytuj jednostkę' : 'Nowa jednostka'} {onclose}>
  <form
    class="stack"
    onsubmit={(e) => {
      e.preventDefault();
      save();
    }}
    novalidate
  >
    <div class="field">
      <label for="un-name">Nazwa</label>
      <input id="un-name" class="input" bind:value={name} placeholder="np. Moje piwo 5% 500 ml" maxlength="40" />
    </div>
    <div class="grid-2">
      <div class="field">
        <label for="un-vol">Objętość</label>
        <div class="input-suffix">
          <input id="un-vol" class="input num" inputmode="numeric" bind:value={volume} placeholder="500" />
          <span>ml</span>
        </div>
      </div>
      <div class="field">
        <label for="un-abv">Moc</label>
        <div class="input-suffix">
          <input id="un-abv" class="input num" inputmode="decimal" bind:value={abv} placeholder="5" />
          <span>%</span>
        </div>
      </div>
    </div>
    {#if ok}
      <p class="hint num">{fmtNum(ml, 1)} ml alkoholu ({fmtNum(mlToGrams(ml), 1)} g)</p>
    {:else if submitted}
      <p class="error-text">Uzupełnij nazwę, objętość (ml) i moc (%).</p>
    {/if}
    {#if unit}
      <div class="grid-2">
        <button type="button" class="btn btn-danger btn-lg" onclick={remove} disabled={app.units.length <= 1}>
          <Icon name="trash" /> Usuń
        </button>
        <button type="submit" class="btn btn-primary btn-lg">Zapisz</button>
      </div>
      {#if app.units.length <= 1}<p class="hint">Musi zostać co najmniej jedna jednostka.</p>{/if}
    {:else}
      <button type="submit" class="btn btn-primary btn-lg btn-block">Dodaj jednostkę</button>
    {/if}
  </form>
</Sheet>
