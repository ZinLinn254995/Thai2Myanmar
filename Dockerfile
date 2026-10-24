# Multi-stage production Dockerfile for Thai2Myanmar AI Studio
FROM node:22-bookworm-slim AS runner

# Install FFmpeg with libx264, librsvg, and authentic Southeast Asian Noto fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    fonts-noto-core \
    fonts-noto-extra \
    fonts-noto-ui-core \
    fonts-thai-tlwg \
    fontconfig \
    ca-certificates \
    && fc-cache -f -v \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm ci --include=dev

# Copy application source code
COPY . .

# Build frontend production bundle with Vite
RUN npm run build

# Ensure persistent data directory structure exists
RUN mkdir -p /app/data/videos /app/data/audio /app/data/temp_render

# Cloud Run / Container port
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

# Start Express full-stack application (serving API + static production frontend)
CMD ["npx", "tsx", "server.ts"]
