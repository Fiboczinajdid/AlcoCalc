/**
 * Stos akcji dla systemowego przycisku „Wstecz” (Android). Otwarty arkusz rejestruje swoje
 * zamknięcie; przycisk zamyka najwyżej położony.
 */
const stack: (() => void)[] = [];

export function pushBack(fn: () => void): () => void {
  stack.push(fn);
  return () => {
    const i = stack.lastIndexOf(fn);
    if (i >= 0) stack.splice(i, 1);
  };
}

/** Wykonuje najwyższą akcję; false, gdy nic nie było otwarte. */
export function handleBack(): boolean {
  const fn = stack.at(-1);
  if (!fn) return false;
  fn();
  return true;
}
