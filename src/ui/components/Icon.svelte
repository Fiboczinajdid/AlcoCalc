<script lang="ts" module>
  const PATHS = {
    today: 'M6 3h10l-1 18H7L6 3Zm0 5h10M16 8h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2.4',
    calendar: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Zm0 4h16M8 2v4M16 2v4',
    chart: 'M4 20h16M7 16v-5M12 16V6M17 16v-8',
    settings:
      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.3l2-1.6-2-3.4-2.4.9a7.5 7.5 0 0 0-2.2-1.3L14.3 3h-4l-.4 2.3a7.5 7.5 0 0 0-2.2 1.3l-2.4-.9-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.6l-2 1.6 2 3.4 2.4-.9c.7.6 1.4 1 2.2 1.3l.4 2.3h4l.4-2.3c.8-.3 1.5-.7 2.2-1.3l2.4.9 2-3.4-2-1.6c.1-.4.1-.9.1-1.3Z',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    repeat: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4',
    scale: 'M12 3v18M7 21h10M5 7h14M5 7l-3 7a3.5 3.5 0 0 0 6 0L5 7Zm14 0-3 7a3.5 3.5 0 0 0 6 0l-3-7Z',
    drop: 'M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z',
    car: 'M5 17h14M5 17v2M19 17v2M3 13l2-6a2 2 0 0 1 2-1.4h10A2 2 0 0 1 19 7l2 6v4H3v-4Zm0 0h18M7 15h.01M17 15h.01',
    wallet: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Zm13 7h.01',
    close: 'M6 6l12 12M18 6 6 18',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    edit: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z',
    left: 'M15 6l-6 6 6 6',
    right: 'M9 6l6 6-6 6',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-6v-5m0-3h.01',
    meal: 'M7 3v8a2 2 0 0 0 2 2v8M5 3v6M9 3v6M17 21V3c-2 1-3 3.5-3 7v3h3',
    download: 'M12 4v11m-5-5 5 5 5-5M5 20h14',
    upload: 'M12 20V9m-5 5 5-5 5 5M5 4h14',
    medal: 'M12 22a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm-4-11L5 3h4l3 6m4 2 3-8h-4l-3 6',
    flame: 'M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8a7 7 0 0 0 7 7Z',
    gauge: 'M4 18a8 8 0 1 1 16 0M12 18l4-6',
    moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-15v5l3 2',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z',
    check: 'M5 12l5 5L19 7',
    receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6M9 16h3',
  } as const;
  export type IconName = keyof typeof PATHS;
</script>

<script lang="ts">
  let { name, size = 22, stroke = 2 }: { name: IconName; size?: number; stroke?: number } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={stroke}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"><path d={PATHS[name]} /></svg>
