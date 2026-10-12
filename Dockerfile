# Orb — production image: Next.js studio + Remotion renderer + local Kokoro voices.
FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    NEXT_TELEMETRY_DISABLED=1 \
    PIP_BREAK_SYSTEM_PACKAGES=1

RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg espeak-ng python3 python3-pip ca-certificates fonts-noto-color-emoji \
      libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libgbm1 libasound2 \
      libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libpango-1.0-0 libcairo2 \
    && pip3 install --no-cache-dir kokoro-onnx soundfile faster-whisper yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
RUN npx remotion browser ensure

COPY . .
RUN npm run setup:voices && npm run build

ENV NODE_ENV=production PORT=3000 STORAGE_DIR=/data
VOLUME ["/data"]
EXPOSE 3000
CMD ["npm", "start"]
