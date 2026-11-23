// Harp-like notes on hover, made with WebAudio (no sound files).
// The visitor's mute choice is remembered in localStorage ('ls-muted').

let ac: AudioContext | null = null;

// Browsers keep all page audio silent until the visitor's first click, tap or key press
// (hovering doesn't count). So we start the audio engine on that very first gesture,
// wherever it happens, and every hover after it can play.
function unlock() {
  try {
    ac = ac || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
  } catch { /* no audio */ }
}
for (const ev of ['pointerdown', 'keydown', 'touchstart'])
  addEventListener(ev, unlock, { once: true, capture: true, passive: true });
const KEY = 'ls-muted';

export function isMuted(): boolean {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

function setMuted(m: boolean) {
  try { localStorage.setItem(KEY, m ? '1' : '0'); } catch { /* storage unavailable */ }
}

/** Play one harp pluck at frequency f (Hz). */
export function note(f: number) {
  if (isMuted()) return;
  try {
    ac = ac || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    const A = ac, t = A.currentTime;
    const out = A.createGain(); out.gain.value = 0.26;
    const lp = A.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6;
    lp.frequency.setValueAtTime(Math.min(8000, f * 12), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(700, f * 2.5), t + 0.35);
    lp.connect(out).connect(A.destination);
    // [harmonic, amplitude, decay seconds]
    const P = [[1, 1, 3.2], [2, .42, 1.8], [3, .22, 1.1], [4, .1, .7], [5, .06, .45], [6, .03, .3]];
    for (const [n, a, d] of P) {
      const o = A.createOscillator(), g = A.createGain();
      o.type = 'sine'; o.frequency.value = f * n * (1 + 0.00025 * n * n);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(a * 0.5, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(lp); o.start(t); o.stop(t + d + 0.05);
    }
    // the pluck itself
    const k = A.createOscillator(), kg = A.createGain();
    k.type = 'triangle';
    k.frequency.setValueAtTime(f * 4, t); k.frequency.exponentialRampToValueAtTime(f * 2, t + 0.02);
    kg.gain.setValueAtTime(0.06, t); kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    k.connect(kg).connect(lp); k.start(t); k.stop(t + 0.06);
  } catch { /* no audio */ }
}

const C4 = 261.6256;
const hz = (semitones: number) => C4 * Math.pow(2, semitones / 12);

/** Home: major 7 chord, до ми соль си, then up an octave. */
export function homeNote(i: number) {
  const steps = [0, 4, 7, 11];
  return hz(steps[i % 4] + 12 * Math.floor(i / 4));
}

/** Sidebar: Lydian pentatonic (до ми фа♯ соль си), starting an octave below middle C. */
export function sidebarNote(i: number) {
  const steps = [0, 4, 6, 7, 11];
  return hz(steps[i % 5] + 12 * Math.floor(i / 5) - 12);
}

/** Wire every [data-note] element and the sound toggle on the page. */
export function wireSound(noteFor: (i: number) => number) {
  document.querySelectorAll<HTMLElement>('[data-note]').forEach((el) => {
    const f = noteFor(Number(el.dataset.note));
    el.addEventListener('mouseenter', () => note(f));
    el.addEventListener('focus', () => note(f));
  });
  const btn = document.querySelector<HTMLButtonElement>('.snd');
  if (!btn) return;
  const paint = () => {
    const m = isMuted();
    btn.setAttribute('aria-pressed', String(m));
    btn.setAttribute('aria-label', m ? 'Turn sound on' : 'Turn sound off');
    btn.classList.toggle('muted', m);
  };
  paint();
  btn.addEventListener('click', () => { setMuted(!isMuted()); paint(); });
}
