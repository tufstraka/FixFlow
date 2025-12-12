# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bot/package*.json ./bot/
COPY shared/package*.json ./shared/

# Install dependencies
RUN npm ci --workspace=shared --workspace=bot

# Copy source files
COPY shared ./shared
COPY bot ./bot
COPY tsconfig.json ./

# Generate Prisma client
RUN npm run db:generate --workspace=bot

# Build shared library
RUN npm run build --workspace=shared

# Build bot
RUN npm run build --workspace=bot

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
COPY bot/package*.json ./bot/
COPY shared/package*.json ./shared/

# Install production dependencies only
RUN npm ci --workspace=shared --workspace=bot --omit=dev

# Copy built files
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/bot/dist ./bot/dist
COPY --from=builder /app/bot/prisma ./bot/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Run database migrations and start the server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./bot/prisma/schema.prisma && node bot/dist/index.js"]