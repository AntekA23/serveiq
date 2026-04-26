FROM node:20-alpine AS builder

WORKDIR /app
COPY . .

WORKDIR /app/client
RUN npm ci && npm run build

WORKDIR /app/server
RUN npm ci --omit=dev


FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server/src/index.js"]
