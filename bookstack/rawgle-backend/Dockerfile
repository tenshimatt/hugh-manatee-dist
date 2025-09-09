# Multi-stage Docker build for production optimization

# Stage 1: Dependencies and Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN rm -rf node_modules && npm ci --only=production --ignore-scripts

# Stage 2: Production Runtime
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S rawgle && \
    adduser -S rawgle -u 1001 -G rawgle

# Set working directory
WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    musl \
    giflib \
    pixman \
    pangomm \
    libjpeg-turbo \
    freetype \
    ttf-freefont

# Copy built application from builder stage
COPY --from=builder --chown=rawgle:rawgle /app/dist ./dist
COPY --from=builder --chown=rawgle:rawgle /app/node_modules ./node_modules
COPY --from=builder --chown=rawgle:rawgle /app/package*.json ./

# Create necessary directories
RUN mkdir -p logs uploads && chown -R rawgle:rawgle logs uploads

# Copy environment template
COPY --chown=rawgle:rawgle .env.example ./.env.example

# Switch to non-root user
USER rawgle

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
        const options = { hostname: 'localhost', port: process.env.PORT || 8000, path: '/health', timeout: 2000 }; \
        const req = http.request(options, (res) => { \
            if (res.statusCode === 200) { process.exit(0); } \
            else { process.exit(1); } \
        }); \
        req.on('error', () => process.exit(1)); \
        req.on('timeout', () => process.exit(1)); \
        req.end();"

# Start application
CMD ["node", "dist/server.js"]

# Development stage for hot reload
FROM node:20-alpine AS development

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev)
RUN npm ci

# Create directories
RUN mkdir -p logs uploads src

# Set environment variables
ENV NODE_ENV=development
ENV PORT=8000

# Expose port
EXPOSE 8000

# Start with hot reload
CMD ["npm", "run", "dev"]