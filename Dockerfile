# Multi-stage Docker build for Node.js TypeScript application
# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && ln -sf python3 /usr/bin/python

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci && npm cache clean --force

# Install tsconfig-paths for runtime path resolution
RUN npm install --save-prod tsconfig-paths

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine AS production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    openssl \
    openssl-dev \
    libssl3 \
    && rm -rf /var/cache/apk/*

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nodejs:nodejs /app/tsconfig.prod.json ./tsconfig.prod.json

# Copy additional files
COPY --chown=nodejs:nodejs .env.example .env.example

# Create necessary directories
RUN mkdir -p logs && chown nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application with migrations
CMD ["sh", "-c", "npx prisma migrate deploy && TS_NODE_PROJECT=tsconfig.prod.json node -r tsconfig-paths/register dist/index.js"]
