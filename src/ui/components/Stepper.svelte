<script lang="ts">
  import Icon from './Icon.svelte';

  let {
    value = $bindable(1),
    min = 1,
    max = 99,
    label,
  }: { value: number; min?: number; max?: number; label: string } = $props();
</script>

<div class="stepper" role="group" aria-label={label}>
  <button class="btn" type="button" onclick={() => (value = Math.max(min, value - 1))} disabled={value <= min} aria-label="Mniej">
    <Icon name="minus" />
  </button>
  <output class="num" aria-live="polite">{value}</output>
  <button class="btn" type="button" onclick={() => (value = Math.min(max, value + 1))} disabled={value >= max} aria-label="Więcej">
    <Icon name="plus" />
  </button>
</div>

<style>
  .stepper {
    display: grid;
    grid-template-columns: 56px 1fr 56px;
    align-items: center;
    gap: 8px;
  }

  .stepper .btn {
    padding: 0;
  }

  output {
    text-align: center;
    font-size: 1.5rem;
    font-weight: 700;
  }
</style>
