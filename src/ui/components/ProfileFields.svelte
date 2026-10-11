<script lang="ts" module>
  import { parseNum } from '../format';

  export interface ProfileDraft {
    weight: string;
    sex: 'm' | 'f' | '';
    height: string;
    age: string;
  }

  /** Zwraca dane profilu albo null, gdy formularz jest niepoprawny. */
  export function draftToProfile(d: ProfileDraft) {
    const weightKg = parseNum(d.weight);
    if (weightKg === null || weightKg < 30 || weightKg > 300 || !d.sex) return null;
    const h = parseNum(d.height);
    const a = parseNum(d.age);
    return {
      weightKg,
      sex: d.sex,
      heightCm: h !== null && h >= 120 && h <= 230 ? h : null,
      age: a !== null && a >= 18 && a <= 110 ? a : null,
    };
  }
</script>

<script lang="ts">
  let { draft = $bindable(), showErrors = false }: { draft: ProfileDraft; showErrors?: boolean } = $props();

  const w = $derived(parseNum(draft.weight));
  const weightOk = $derived(w !== null && w >= 30 && w <= 300);
</script>

<div class="stack">
  <div class="field">
    <span class="label" id="pf-sex">Płeć (do wzoru Widmarka)</span>
    <div class="segmented" role="group" aria-labelledby="pf-sex">
      <button type="button" aria-pressed={draft.sex === 'm'} onclick={() => (draft.sex = 'm')}>Mężczyzna</button>
      <button type="button" aria-pressed={draft.sex === 'f'} onclick={() => (draft.sex = 'f')}>Kobieta</button>
    </div>
    {#if showErrors && !draft.sex}<span class="error-text">Wybierz jedną opcję.</span>{/if}
  </div>
  <div class="field">
    <label for="pf-weight">Waga</label>
    <div class="input-suffix">
      <input id="pf-weight" class="input num" inputmode="decimal" bind:value={draft.weight} placeholder="np. 80" />
      <span>kg</span>
    </div>
    {#if showErrors && !weightOk}<span class="error-text">Podaj wagę w kg (30–300).</span>{/if}
  </div>
  <div class="grid-2">
    <div class="field">
      <label for="pf-height">Wzrost (opcjonalnie)</label>
      <div class="input-suffix">
        <input id="pf-height" class="input num" inputmode="numeric" bind:value={draft.height} placeholder="—" />
        <span>cm</span>
      </div>
    </div>
    <div class="field">
      <label for="pf-age">Wiek (opcjonalnie)</label>
      <div class="input-suffix">
        <input id="pf-age" class="input num" inputmode="numeric" bind:value={draft.age} placeholder="—" />
        <span>lat</span>
      </div>
    </div>
  </div>
  <p class="hint">Gdy podasz wzrost i wiek, szacunek użyje dokładniejszego wzoru Watsona (woda w organizmie).</p>
</div>
