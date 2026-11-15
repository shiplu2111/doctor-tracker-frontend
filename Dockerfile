# Multi-stage Dockerfile for Doctor Tracker Frontend Client (Next.js)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared package and build
COPY shared ./shared
RUN cd shared && npm ci && npm run build

# Copy client package and build Next.js app
COPY client ./client
WORKDIR /app/client
RUN npm ci
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/shared ./shared
COPY --from=builder /app/client/package*.json ./client/
RUN cd client && npm ci --omit=dev

COPY --from=builder /app/client/.next ./client/.next
COPY --from=builder /app/client/public ./client/public
COPY --from=builder /app/client/next.config.ts ./client/

WORKDIR /app/client
EXPOSE 3000

CMD ["npm", "start"]
