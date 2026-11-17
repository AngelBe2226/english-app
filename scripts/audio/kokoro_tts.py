"""Voz neuronal local con Kokoro (gratis, licencia Apache 2.0), en MP3.

Uso como módulo:  from kokoro_tts import Voice; Voice("af_heart").mp3("Hello")
Uso por línea de comandos (lotes, lo usa el generador):
    .venv/bin/python kokoro_tts.py --voice af_heart --out DIR < lista.jsonl
  cada línea: {"id": "...", "text": "..."}  →  DIR/<id>.mp3
"""
import argparse
import json
import sys
from pathlib import Path

import lameenc
import numpy as np
from kokoro_onnx import Kokoro

HERE = Path(__file__).resolve().parent
MODELS = HERE / ".models"
RATE = 24000


class Voice:
    def __init__(self, voice="af_heart", lang="en-us", speed=0.95, bitrate=48):
        self.kokoro = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
        self.voice, self.lang, self.speed, self.bitrate = voice, lang, speed, bitrate

    def samples(self, text):
        audio, rate = self.kokoro.create(text, voice=self.voice, speed=self.speed, lang=self.lang)
        assert rate == RATE
        return audio

    def encode(self, audio):
        # Recorta el silencio de los extremos y deja un margen corto y uniforme.
        loud = np.where(np.abs(audio) > 0.01)[0]
        if len(loud):
            pad = int(0.08 * RATE)
            audio = audio[max(0, loud[0] - pad) : loud[-1] + pad]
        pcm = (np.clip(audio, -1, 1) * 32767).astype(np.int16).tobytes()
        enc = lameenc.Encoder()
        enc.set_bit_rate(self.bitrate)
        enc.set_in_sample_rate(RATE)
        enc.set_channels(1)
        enc.set_quality(2)
        return enc.encode(pcm) + enc.flush()

    def mp3(self, text):
        return self.encode(self.samples(text))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="af_heart")
    ap.add_argument("--speed", type=float, default=0.95)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    v = Voice(a.voice, speed=a.speed)
    for line in sys.stdin:
        if not line.strip():
            continue
        item = json.loads(line)
        try:
            (out / f"{item['id']}.mp3").write_bytes(v.mp3(item["text"]))
            print(json.dumps({"id": item["id"], "ok": True}), flush=True)
        except Exception as e:  # noqa: BLE001 — se informa y se sigue con el resto
            print(json.dumps({"id": item["id"], "ok": False, "error": str(e)}), flush=True)


if __name__ == "__main__":
    main()
