FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server ./server
COPY public ./public

ENV NODE_ENV=production \
    PORT=5000 \
    DB_FILE=/app/data/store.db

RUN mkdir -p /app/data && chown node:node /app/data
USER node

EXPOSE 5000

# Seed sample products on first run (no-op if products already exist), then start.
CMD ["sh", "-c", "node server/seed.js && node server/server.js"]
