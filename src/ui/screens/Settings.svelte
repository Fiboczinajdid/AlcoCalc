<script lang="ts">
  import { app } from '../../state/app.svelte';
  import { BackupError, parseBackup, pureAlcoholMl, type Unit } from '../../logic';
  import { fmtAbv, fmtNum, fmtVolume, parseNum } from '../format';
  import ProfileFields, { draftToProfile, type ProfileDraft } from '../components/ProfileFields.svelte';
  import UnitSheet from '../components/UnitSheet.svelte';
  import Icon from '../components/Icon.svelte';
  import { isNative, shareTextFile } from '../../native';

  const p = app.profile!;
  let draft = $state<ProfileDraft>({
    weight: String(p.weightKg).replace('.', ','),
    sex: p.sex,
    height: p.heightCm ? String(p.heightCm) : '',
    age: p.age ? String(p.age) : '',
  });
  let limit = $state(String(p.limitPermille).replace('.', ','));
  let currency = $state(p.currency);
  let rate = $state(p.hourlyRate ? String(p.hourlyRate).replace('.', ',') : '');
  let dayStart = $state(p.dayStartHour);
  let showErrors = $state(false);

  const CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP', 'CHF', 'CZK', 'NOK', 'SEK', 'DKK', 'UAH'];
  const currencyList = $derived(CURRENCIES.includes(currency) ? CURRENCIES : [currency, ...CURRENCIES]);

  const limitNum = $derived(parseNum(limit));
  const limitOk = $derived(limitNum !== null && limitNum >= 0 && limitNum <= 1);
  const rateNum = $derived(parseNum(rate));
  const rateOk = $derived(rate.trim() === '' || (rateNum !== null && rateNum >= 0));

  async function saveProfile() {
    showErrors = true;
    const base = draftToProfile(draft);
    if (!base || !limitOk || !rateOk) return;
    await app.saveProfile({
      ...base,
      limitPermille: limitNum!,
      currency,
      hourlyRate: rate.trim() === '' || !rateNum ? null : rateNum,
      dayStartHour: dayStart,
    });
    showErrors = false;
    app.showToast('Zapisano profil');
  }

  // ---------- jednostki ----------
  let unitSheet = $state<{ unit: Unit | null } | null>(null);

  // ---------- dane ----------
  let fileInput: HTMLInputElement;
  let importError = $state<string | null>(null);

  async function exportData() {
    const name = `alcocalc-kopia-${app.todayKey}.json`;
    const json = JSON.stringify(app.exportBackup(), null, 2);
    if (isNative) {
      try {
        await shareTextFile(name, json);
      } catch (e) {
        // Zamknięcie okna „Udostępnij” bez wyboru to nie błąd.
        if (!/cancel/i.test(String(e))) app.showToast('Nie udało się zapisać kopii');
      }
      return;
    }
    const file = new File([json], name, { type: 'application/json' });
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (ios && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Kopia AlcoCalc' });
        return;
      } catch (e) {
        if ((e as DOMException).name === 'AbortError') return;
      }
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    app.showToast('Zapisano plik kopii');
  }

  async function importData(e: Event) {
    importError = null;
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    try {
      const backup = parseBackup(JSON.parse(await f.text()));
      const when = backup.exportedAt ? new Date(backup.exportedAt).toLocaleString('pl-PL') : 'nieznana data';
      const ok = confirm(
        `Przywrócić kopię z ${when}?\n\nNapojów w kopii: ${backup.drinks.length}.\nObecne dane w aplikacji zostaną zastąpione.`,
      );
      if (!ok) return;
      await app.importBackup(backup);
      app.showToast('Przywrócono dane z kopii');
    } catch (err) {
      importError = err instanceof BackupError ? err.message : 'Nie udało się odczytać pliku. Czy to plik kopii AlcoCalc (JSON)?';
    }
  }

  async function wipe() {
    if (!confirm('Usunąć wszystkie dane z tego telefonu? Tej operacji nie da się cofnąć.')) return;
    if (!confirm('Na pewno? Jeśli chcesz zachować historię, najpierw zrób kopię (eksport).')) return;
    await app.wipe();
  }
</script>

<div class="screen">
  <header class="screen-header"><h1>Ustawienia</h1></header>

  <section class="card" aria-labelledby="prof-title">
    <h2 class="card-title" id="prof-title"><Icon name="settings" /> Profil</h2>
    <form
      class="stack"
      onsubmit={(e) => {
        e.preventDefault();
        saveProfile();
      }}
      novalidate
    >
      <ProfileFields bind:draft {showErrors} />
      <div class="divider"></div>
      <div class="grid-2">
        <div class="field">
          <label for="st-limit">Limit dla kierowcy</label>
          <div class="input-suffix">
            <input id="st-limit" class="input num" inputmode="decimal" bind:value={limit} />
            <span>‰</span>
          </div>
        </div>
        <div class="field">
          <label for="st-cur">Waluta</label>
          <select id="st-cur" class="input" bind:value={currency}>
            {#each currencyList as c (c)}<option value={c}>{c}</option>{/each}
          </select>
        </div>
      </div>
      {#if showErrors && !limitOk}<p class="error-text">Podaj limit między 0 a 1‰.</p>{/if}
      <div class="grid-2">
        <div class="field">
          <label for="st-rate">Stawka za godzinę pracy</label>
          <div class="input-suffix">
            <input id="st-rate" class="input num" inputmode="decimal" bind:value={rate} placeholder="—" />
            <span>/h</span>
          </div>
        </div>
        <div class="field">
          <label for="st-day">Nowy dzień od godz.</label>
          <select id="st-day" class="input" bind:value={dayStart}>
            {#each Array.from({ length: 13 }, (_, i) => i) as h (h)}
              <option value={h}>{h}:00{h === 0 ? ' (północ)' : ''}</option>
            {/each}
          </select>
        </div>
      </div>
      {#if showErrors && !rateOk}<p class="error-text">Stawka musi być liczbą.</p>{/if}
      <button type="submit" class="btn btn-primary btn-block">Zapisz profil</button>
    </form>
  </section>

  <section class="card" aria-labelledby="units-title">
    <h2 class="card-title" id="units-title"><Icon name="today" /> Jednostki odniesienia</h2>
    <ul class="list units">
      {#each app.units as u (u.id)}
        {@const active = u.id === app.activeUnit?.id}
        <li>
          <button class="unit-main" onclick={() => app.setActiveUnit(u.id)} aria-pressed={active} aria-label="Ustaw jako aktywną: {u.name}">
            <span class="radio" class:on={active} aria-hidden="true"></span>
            <span class="unit-text">
              <span class="unit-name">{u.name}</span>
              <span class="muted small num">
                {fmtVolume(u.volumeMl)} · {fmtAbv(u.abv)} = {fmtNum(pureAlcoholMl(u.volumeMl, u.abv), 1)} ml alkoholu
              </span>
            </span>
          </button>
          <button class="icon-btn" aria-label="Edytuj {u.name}" onclick={() => (unitSheet = { unit: u })}>
            <Icon name="edit" size={18} />
          </button>
        </li>
      {/each}
    </ul>
    <button class="btn btn-outline btn-block add" onclick={() => (unitSheet = { unit: null })}>
      <Icon name="plus" /> Dodaj jednostkę
    </button>
  </section>

  <section class="card" aria-labelledby="data-title">
    <h2 class="card-title" id="data-title"><Icon name="shield" /> Dane</h2>
    <p class="small muted">Dane są tylko w tym telefonie. Rób kopię co jakiś czas.</p>
    <div class="stack data-btns">
      <button class="btn btn-outline btn-block" onclick={exportData}><Icon name="download" /> Eksportuj kopię (JSON)</button>
      <button class="btn btn-outline btn-block" onclick={() => fileInput.click()}><Icon name="upload" /> Importuj kopię</button>
      <input bind:this={fileInput} type="file" accept="application/json,.json" class="visually-hidden" onchange={importData} tabindex="-1" />
      {#if importError}<p class="error-text" role="alert">{importError}</p>{/if}
      <button class="btn btn-danger btn-block" onclick={wipe}><Icon name="trash" /> Usuń wszystkie dane</button>
    </div>
  </section>

  <p class="small muted version">AlcoCalc {__APP_VERSION__}</p>
</div>

{#if unitSheet}
  <UnitSheet unit={unitSheet.unit} onclose={() => (unitSheet = null)} />
{/if}

<style>
  .units li {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .units li + li {
    border-top: 1px solid var(--border);
  }

  .unit-main {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 60px;
    padding: 8px 0;
    border: none;
    background: none;
    text-align: left;
    color: var(--text);
    min-width: 0;
  }

  .radio {
    flex: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid var(--faint);
    display: grid;
    place-items: center;
  }

  .radio.on {
    border-color: var(--amber);
  }

  .radio.on::after {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--amber);
  }

  .unit-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .unit-name {
    font-weight: 650;
  }

  .add {
    margin-top: 12px;
  }

  .data-btns {
    margin-top: 12px;
  }

  .version {
    text-align: center;
  }
</style>
