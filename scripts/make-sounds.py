"""
Makes the game's sound effects in public/sounds/.

They're synthesised here (plain sine sweeps and a little noise), so there's
nothing to license. To change a sound, tweak its function below and run this
again; the output is the same every run.

Run from the repo root:  python scripts/make-sounds.py
"""

import math
import random
import struct
import wave
from pathlib import Path

RATE = 44100
OUT = Path("public/sounds")
random.seed(5)  # same noise every run, so regenerating doesn't churn the files


def render(seconds, sample):
    """Samples `sample(t)` (t in seconds, result in -1..1) into a list."""
    return [sample(i / RATE) for i in range(int(seconds * RATE))]


def sweep(f0, f1, seconds, curve=2.0):
    """A sine whose pitch glides from f0 to f1 (fast at first), as a phase function."""
    phase = 0.0
    phases = []
    for i in range(int(seconds * RATE)):
        p = (i / RATE) / seconds
        freq = f1 + (f0 - f1) * (1 - p) ** curve
        phase += 2 * math.pi * freq / RATE
        phases.append(phase)
    return phases


def save(name, samples, volume=0.8):
    peak = max(abs(s) for s in samples) or 1
    # Short fade-out so nothing ends on a click.
    fade = int(0.01 * RATE)
    for i in range(1, fade + 1):
        samples[-i] *= i / fade
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / name), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(b"".join(struct.pack("<h", int(s / peak * volume * 32767)) for s in samples))


def bonk():
    """A soft, round thud: a quick downward pitch drop with a tiny click on top."""
    seconds = 0.18
    phases = sweep(260, 90, seconds, curve=3)
    return [
        math.sin(ph) * math.exp(-i / RATE * 22)
        + random.uniform(-1, 1) * 0.35 * math.exp(-i / RATE * 400)
        for i, ph in enumerate(phases)
    ]


def boing():
    """A springy wobble: a rising tone with fast vibrato that settles."""
    seconds = 0.45
    phase = 0.0
    out = []
    for i in range(int(seconds * RATE)):
        t = i / RATE
        wobble = 1 + 0.25 * math.sin(2 * math.pi * 14 * t) * math.exp(-t * 5)
        freq = (180 + 220 * min(1, t / 0.12)) * wobble
        phase += 2 * math.pi * freq / RATE
        out.append(math.sin(phase) * math.exp(-t * 7))
    return out


def wall_hit():
    """A heavier thump with a noisy smack: lower and punchier than a Bonk."""
    seconds = 0.25
    phases = sweep(160, 45, seconds, curve=3)
    return [
        math.sin(ph) * math.exp(-i / RATE * 14)
        + random.uniform(-1, 1) * 0.6 * math.exp(-i / RATE * 60)
        for i, ph in enumerate(phases)
    ]


def caught():
    """A bubble 'bloop' up, then a happy three-note chime."""
    bloop = sweep(300, 1100, 0.09, curve=0.5)
    out = [math.sin(ph) * 0.8 for ph in bloop]
    for start, freq in [(0.0, 1047), (0.08, 1319), (0.16, 1568)]:  # C6 E6 G6
        note_start = len(bloop) + int(start * RATE)
        note = render(0.5, lambda t, f=freq: math.sin(2 * math.pi * f * t) * math.exp(-t * 6))
        out.extend([0.0] * max(0, note_start + len(note) - len(out)))
        for i, s in enumerate(note):
            out[note_start + i] += s * 0.5
    return out


save("bonk.wav", bonk())
save("boing.wav", boing())
save("wall-hit.wav", wall_hit())
save("caught.wav", caught())
print("Wrote", ", ".join(sorted(p.name for p in OUT.glob("*.wav"))))
