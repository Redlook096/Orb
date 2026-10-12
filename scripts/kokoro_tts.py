#!/usr/bin/env python3
"""Batch Kokoro synthesis with word timings.

Reads {"model", "voices", "items": [{"text", "voice", "speed", "lang", "out"}]} as JSON on
stdin, writes one WAV per item, and prints [{"out", "duration", "words": [...]}] as JSON.
Word times come from the model's phoneme durations, so captions follow the actual speech.
"""
import json
import re
import sys

import soundfile as sf
from kokoro_onnx import Kokoro

PUNCT_ONLY = re.compile(r"^[\s.,!?;:\"'()\[\]{}…—–\-«»“”‘’]*$")


def phoneme_groups(timings):
    """Splits phoneme timings into spoken-word groups at spaces, dropping punctuation-only groups."""
    groups, cur = [], []
    for t in timings:
        if t.phoneme == " ":
            if cur:
                groups.append(cur)
            cur = []
        else:
            cur.append(t)
    if cur:
        groups.append(cur)
    out = []
    for g in groups:
        text = "".join(t.phoneme for t in g)
        if PUNCT_ONLY.match(text):
            continue
        spoken = [t for t in g if not PUNCT_ONLY.match(t.phoneme)] or g
        out.append((spoken[0].start, spoken[-1].end))
    return out


def word_phoneme_count(kokoro, word, lang):
    clean = re.sub(r"^[^\w$£€%#@]+|[^\w%]+$", "", word)
    if not clean:
        return 0
    try:
        ph = kokoro.tokenizer.phonemize(clean, lang)
    except Exception:
        return 1
    return max(1, len([p for p in ph.split(" ") if p and not PUNCT_ONLY.match(p)]))


def align(kokoro, text, timings, duration, lang):
    words = text.split()
    groups = phoneme_groups(timings)
    if not words:
        return []
    if not groups:
        step = duration / len(words)
        return [{"text": w, "start": i * step, "end": (i + 1) * step} for i, w in enumerate(words)]
    if len(groups) == len(words):
        return [{"text": w, "start": s, "end": e} for w, (s, e) in zip(words, groups)]
    counts = [word_phoneme_count(kokoro, w, lang) for w in words]
    if sum(counts) == len(groups):
        out, i = [], 0
        for w, c in zip(words, counts):
            if c == 0:
                t = groups[min(i, len(groups) - 1)][0]
                out.append({"text": w, "start": t, "end": t})
                continue
            out.append({"text": w, "start": groups[i][0], "end": groups[i + c - 1][1]})
            i += c
        return out
    # Fall back to spreading words proportionally over the spoken groups.
    total = max(1, sum(max(c, 1) for c in counts))
    out, acc = [], 0
    n = len(groups)
    for w, c in zip(words, counts):
        a = acc / total
        acc += max(c, 1)
        b = acc / total
        gi = min(n - 1, int(a * n))
        gj = min(n - 1, max(gi, int(b * n) - 1))
        out.append({"text": w, "start": groups[gi][0], "end": groups[gj][1]})
    return out


def main():
    req = json.load(sys.stdin)
    kokoro = Kokoro(req["model"], req["voices"])
    results = []
    for item in req["items"]:
        lang = item.get("lang", "en-us")
        audio, sr, timings = kokoro.create_timed(item["text"], voice=item["voice"], speed=float(item.get("speed", 1.0)), lang=lang)
        sf.write(item["out"], audio, sr)
        duration = len(audio) / sr
        results.append({"out": item["out"], "duration": duration, "words": align(kokoro, item["text"], timings, duration, lang)})
        print(json.dumps({"progress": len(results), "total": len(req["items"])}), file=sys.stderr, flush=True)
    json.dump(results, sys.stdout)


if __name__ == "__main__":
    main()
