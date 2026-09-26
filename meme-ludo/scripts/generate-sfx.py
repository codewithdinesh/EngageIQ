#!/usr/bin/env python3
"""Write original Hostel Roast stingers. Sine tones only — no sampled audio."""

import math
import os
import struct
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "sounds")
RATE = 22050


def clamp(sample: float) -> float:
    return max(-1.0, min(1.0, sample))


def envelope(n: int, attack: int, decay: int, sustain: float, release: int) -> list[float]:
    values = []
    for i in range(n):
        if i < attack:
            values.append(i / max(1, attack))
        elif i < attack + decay:
            t = (i - attack) / max(1, decay)
            values.append(1 - (1 - sustain) * t)
        elif i < n - release:
            values.append(sustain)
        else:
            t = (i - (n - release)) / max(1, release)
            values.append(sustain * (1 - t))
    return values


def tone(freq: float, dur: float, vol: float = 0.4, slide: float = 0.0) -> list[float]:
    n = int(RATE * dur)
    env = envelope(n, int(0.01 * RATE), int(0.08 * RATE), 0.7, int(0.06 * RATE))
    samples = []
    phase = 0.0
    for i in range(n):
        f = freq + slide * (i / max(1, n - 1))
        phase += 2 * math.pi * f / RATE
        samples.append(vol * env[i] * math.sin(phase))
    return samples


def thud(dur: float, vol: float = 0.3, freq: float = 120) -> list[float]:
    n = int(RATE * dur)
    env = envelope(n, int(0.005 * RATE), int(dur * 0.4 * RATE), 0.2, int(0.05 * RATE))
    samples = []
    seed = 123456789
    phase = 0.0
    for i in range(n):
        seed = (1103515245 * seed + 12345) & 0x7FFFFFFF
        white = (seed / 0x7FFFFFFF) * 2 - 1
        phase += 2 * math.pi * freq / RATE
        samples.append(vol * env[i] * (0.65 * math.sin(phase) + 0.35 * white))
    return samples


def mix(*tracks: list[float]) -> list[float]:
    length = max(len(track) for track in tracks)
    out = [0.0] * length
    for track in tracks:
        for i, sample in enumerate(track):
            out[i] += sample
    peak = max(1e-6, max(abs(sample) for sample in out))
    scale = 0.82 / peak
    return [clamp(sample * scale) for sample in out]


def at(sample: list[float], seconds: float) -> list[float]:
    return [0.0] * int(RATE * seconds) + sample


def write(name: str, samples: list[float]) -> None:
    path = os.path.join(OUT, name)
    with wave.open(path, "w") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(RATE)
        frames = b"".join(struct.pack("<h", int(clamp(sample) * 32767)) for sample in samples)
        handle.writeframes(frames)
    duration = len(samples) / RATE
    if duration > 1.5:
        raise SystemExit(f"{name} is {duration:.3f}s, over the 1.5s cap")
    print(f"{name}: {duration:.3f}s")


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    write("capture.wav", mix(
        at(tone(523.25, 0.16, 0.5), 0.0),
        at(tone(659.25, 0.16, 0.5), 0.12),
        at(tone(783.99, 0.16, 0.5), 0.24),
        at(tone(1046.5, 0.42, 0.55), 0.36),
    ))
    write("captured.wav", mix(tone(494, 0.85, 0.45, slide=-280), at(tone(247, 0.5, 0.2, slide=-80), 0.25)))
    write("six.wav", mix(at(tone(880, 0.12, 0.55), 0.0), at(tone(1318.5, 0.22, 0.5), 0.1)))
    write("chaos.wav", mix(
        tone(311, 1.1, 0.28, slide=40),
        tone(330, 1.1, 0.28, slide=-30),
        at(tone(196, 0.4, 0.35), 0.15),
        at(tone(155, 0.35, 0.3), 0.55),
        at(thud(0.18, 0.22, 90), 0.85),
    ))
    write("home.wav", mix(
        at(tone(523.25, 0.18, 0.4), 0.0),
        at(tone(659.25, 0.18, 0.4), 0.14),
        at(tone(783.99, 0.18, 0.42), 0.28),
        at(tone(1046.5, 0.4, 0.48), 0.42),
    ))
    write("blocked.wav", thud(0.34, 0.7, 92))
    write("safe.wav", mix(tone(740, 0.5, 0.35), at(tone(1480, 0.35, 0.12), 0.0)))
    write("win.wav", mix(
        at(tone(523.25, 0.2, 0.45), 0.0),
        at(tone(659.25, 0.2, 0.45), 0.16),
        at(tone(783.99, 0.2, 0.48), 0.32),
        at(tone(1046.5, 0.55, 0.5), 0.48),
        at(tone(783.99, 0.3, 0.2), 0.7),
    ))


if __name__ == "__main__":
    main()
