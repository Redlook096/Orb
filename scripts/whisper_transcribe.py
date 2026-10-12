#!/usr/bin/env python3
"""Local word-level transcription with faster-whisper.

Usage: whisper_transcribe.py <audio> <model-size>
Prints {"words": [{"text", "start", "end"}], "language": "..."} as JSON.
"""
import json
import sys

from faster_whisper import WhisperModel


def main():
    audio, size = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "base"
    model = WhisperModel(size, device="cpu", compute_type="int8")
    segments, info = model.transcribe(audio, word_timestamps=True, vad_filter=True)
    words = []
    for seg in segments:
        for w in seg.words or []:
            text = w.word.strip()
            if text:
                words.append({"text": text, "start": float(w.start), "end": float(w.end)})
    json.dump({"words": words, "language": info.language}, sys.stdout)


if __name__ == "__main__":
    main()
