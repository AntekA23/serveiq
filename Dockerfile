FROM node:20-alpine AS client-builder

WORKDIR /app/client

COPY client/package.json client/package-lock.json* ./
RUN npm ci

COPY client/ ./
RUN npm run build


FROM node:20-alpine AS server-deps

WORKDIR /app/server

COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev


FROM node:20-alpine

WORKDIR /app

COPY server/package.json server/package-lock.json* ./server/
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server/ ./server/

COPY --from=client-builder /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server/src/index.js"]
