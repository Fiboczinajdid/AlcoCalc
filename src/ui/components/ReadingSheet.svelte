<script lang="ts">
  import { app } from '../../state/app.svelte';
  import { mglToPermille } from '../../logic';
  import { fmtPermille, fmtTime, parseNum } from '../format';
  import Sheet from './Sheet.svelte';

  let { onclose }: { onclose: () => void } = $props();

  let value = $state('');
  let unit = $state<'permille' | 'mgl'>('permille');
  let time = $state(fmtTime(Date.now()));
  let submitted = $state(false);

  const n = $derived(parseNum(value));
  const ok = $derived(n !== null && n >= 0 && n < 6);
  const permille = $derived(ok ? (unit === 'mgl' ? mglToPermille(n!) : n!) : null);

  async function save() {
    submitted = true;
    if (permille === null) return;
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    // Godzina „z przyszłości” to zapewne wczorajszy wieczór.
    if (d.getTime() > Date.now() + 60_000) d.setDate(d.getDate() - 1);
    await app.addReading(d.getTime(), permille);
    onclose();
  }
</script>

<Sheet title="Wynik z alkomatu" {onclose}>
  <p class="muted small">
    Wynik z alkomatu zastępuje szacunek od chwili pomiaru. Dalsze obliczenia nadal są tylko przybliżeniem.
  </p>
  <form
    class="stack"
    onsubmit={(e) => {
      e.preventDefault();
      save();
    }}
    novalidate
  >
    <div class="segmented" role="group" aria-label="Jednostka wyniku">
      <button type="button" aria-pressed={unit === 'permille'} onclick={() => (unit = 'permille')}>‰ (promile)</button>
      <button type="button" aria-pressed={unit === 'mgl'} onclick={() => (unit = 'mgl')}>mg/l (wydech)</button>
    </div>
    <div class="grid-2">
      <div class="field">
        <label for="rd-val">Wynik</label>
        <div class="input-suffix">
          <input id="rd-val" class="input num" inputmode="decimal" bind:value placeholder="0,00" />
          <span>{unit === 'mgl' ? 'mg/l' : '‰'}</span>
        </div>
      </div>
      <div class="field">
        <label for="rd-time">Godzina pomiaru</label>
        <input id="rd-time" class="input num" type="time" bind:value={time} />
      </div>
    </div>
    {#if unit === 'mgl' && permille !== null}
      <p class="hint num">≈ {fmtPermille(permille)}‰ (przelicznik jak w przepisach: 0,1 mg/l ≈ 0,2‰)</p>
    {/if}
    {#if submitted && !ok}<p class="error-text">Podaj wynik, np. 0,25.</p>{/if}
    <button type="submit" class="btn btn-primary btn-lg btn-block">Zapisz pomiar</button>
  </form>
</Sheet>
