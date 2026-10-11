<script lang="ts">
  import { app } from '../../state/app.svelte';
  import { DEFAULT_UNITS } from '../../logic';
  import ProfileFields, { draftToProfile, type ProfileDraft } from '../components/ProfileFields.svelte';
  import Icon from '../components/Icon.svelte';

  let draft = $state<ProfileDraft>({ weight: '', sex: '', height: '', age: '' });
  let showErrors = $state(false);
  let busy = $state(false);

  async function start() {
    showErrors = true;
    const p = draftToProfile(draft);
    if (!p) return;
    busy = true;
    await app.createProfile(
      { ...p, limitPermille: 0.2, currency: 'PLN', hourlyRate: null, dayStartHour: 6 },
      DEFAULT_UNITS,
    );
  }
</script>

<div class="screen onboarding">
  <div class="intro">
    <img src="{import.meta.env.BASE_URL}icons/icon-512.png" alt="" width="96" height="96" />
    <h1>AlcoCalc</h1>
    <p class="muted">Przelicznik alkoholu, promile i nawyki.</p>
  </div>

  <section class="card">
    <h2 class="card-title"><Icon name="settings" /> Twoje dane</h2>
    <form
      class="stack"
      onsubmit={(e) => {
        e.preventDefault();
        start();
      }}
      novalidate
    >
      <ProfileFields bind:draft {showErrors} />
      <button type="submit" class="btn btn-primary btn-lg btn-block" disabled={busy}>Zaczynamy</button>
    </form>
  </section>

  <div class="note" role="note">
    <Icon name="shield" size={18} />
    <span>Dane zostają tylko w tym telefonie.</span>
  </div>
</div>

<style>
  .onboarding {
    padding-bottom: calc(32px + env(safe-area-inset-bottom));
  }

  .intro {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 8px 4px;
  }

  .intro img {
    border-radius: 24px;
    box-shadow: var(--shadow);
  }

  .intro h1 {
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
</style>
