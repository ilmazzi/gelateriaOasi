# Runtime prevedibile su Railway (evita mismatch Railpack ↔ processo Node).
FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Railway imposta PORT a runtime
CMD ["node", "server.js"]
