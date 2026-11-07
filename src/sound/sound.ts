/*
 * Plays the Catch's sound effects. Holds no game rules: the shell tells it
 * which effect to play and in which Monster's voice, both taken from what the
 * core reported.
 *
 * Browsers block audio until the page has been touched, so no AudioContext
 * exists (and nothing plays) before the first touch. The sound files are
 * fetched and decoded up front, off to the side, so even the very first Bonk
 * has its sound ready. A file that fails to load just stays silent.
 */

/** A sound effect the Catch can make. */
export type Effect = "bonk" | "boing" | "wallHit" | "caught";

export interface Sound {
  /** Plays an effect, pitched by `voice` (a playback-rate multiplier, 1 = as recorded). */
  play(effect: Effect, voice: number): void;
}

/** Each effect's file under `public/sounds/`. See CREDITS.md for where they come from. */
const FILES: Record<Effect, string> = {
  bonk: "sounds/bonk.wav",
  boing: "sounds/boing.wav",
  wallHit: "sounds/wall-hit.wav",
  caught: "sounds/caught.wav",
};

/** Overall loudness, so effects don't startle. */
const VOLUME = 0.7;

export function createSound(): Sound {
  let audio: AudioContext | undefined;
  let output: GainNode | undefined;
  const buffers = new Map<Effect, AudioBuffer>();

  // An offline context can decode without touching the speakers, so it's
  // allowed before the first touch. Its buffers play in any context.
  const decoder = new OfflineAudioContext(1, 1, 44100);
  for (const [effect, file] of Object.entries(FILES) as [Effect, string][]) {
    const url = new URL(import.meta.env.BASE_URL + file, document.baseURI);
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} ${url}`);
        return response.arrayBuffer();
      })
      .then((data) => decoder.decodeAudioData(data))
      .then((buffer) => buffers.set(effect, buffer))
      .catch((error) => console.warn(`Sound "${effect}" is unavailable:`, error));
  }

  function unlock() {
    // Wait for an event the browser counts as permission to play (a touch's
    // finger-down doesn't count), or Chrome warns that audio wasn't allowed.
    if (navigator.userActivation && !navigator.userActivation.isActive) return;
    if (!audio) {
      audio = new AudioContext();
      output = audio.createGain();
      output.gain.value = VOLUME;
      output.connect(audio.destination);
    }
    // Also wakes audio up again if the browser suspended it (e.g. tab hidden).
    if (audio.state === "suspended") void audio.resume();
  }
  // Chrome only lets a touch unlock audio when the finger lifts (pointerup);
  // a mouse unlocks on press. Capture phase, so this runs before the gesture
  // layer judges the touch and asks for a sound.
  window.addEventListener("pointerdown", unlock, { capture: true });
  window.addEventListener("pointerup", unlock, { capture: true });

  return {
    play(effect, voice) {
      const buffer = buffers.get(effect);
      if (!audio || !output || !buffer) return;
      const source = audio.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = voice;
      source.connect(output);
      source.start();
    },
  };
}
