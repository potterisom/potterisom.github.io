/**
 * Sound (spec §4): WebAudio only, and every sound is a soft bubble pop — a
 * sine whose pitch slides quickly. Never noise. One global on/off switch,
 * remembered between visits.
 */
const KEY = 'leyla-sound';
let ctx: AudioContext | null | undefined;

export function soundOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSound(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* private mode: just don't remember */
  }
  document.dispatchEvent(new CustomEvent('soundchange', { detail: on }));
}

export function audio(): AudioContext | null {
  if (ctx === undefined) {
    try {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      ctx = C ? new C() : null;
    } catch {
      ctx = null;
    }
  }
  if (ctx?.state === 'suspended') void ctx.resume().catch(() => {});
  return ctx ?? null;
}

/** A bubble pop. `up` rises (opening), otherwise it falls (closing). */
export function pop(up = true, gain = 0.1) {
  if (!soundOn()) return;
  const c = audio();
  if (!c || c.state !== 'running') return; // browsers stay silent until the first click or key
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(up ? 420 : 1250, t);
  o.frequency.exponentialRampToValueAtTime(up ? 1250 : 420, t + 0.05);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + 0.11);
}

/** Wire up every [data-sound-toggle] button on the page. */
export function initSoundToggles() {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-sound-toggle]');
  const paint = () => {
    const on = soundOn();
    buttons.forEach((b) => {
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? 'sound on' : 'sound off';
    });
  };
  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      setSound(!soundOn());
      paint();
      pop(true);
    }),
  );
  // wake the audio engine on the first interaction so hover sounds can play
  const wake = () => audio();
  window.addEventListener('pointerdown', wake, { once: true });
  window.addEventListener('keydown', wake, { once: true });
  paint();
}
