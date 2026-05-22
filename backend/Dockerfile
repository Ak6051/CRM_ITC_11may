# Use Node.js LTS version
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Build the application if needed (uncomment if you have a build step)
# RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application files from builder stage
COPY --from=builder /app/server.js .
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/controllers ./controllers
COPY --from=builder /app/models ./models
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/config ./config
COPY --from=builder /app/utils ./utils

# Copy environment and service account files
COPY --from=builder /app/.env .
COPY --from=builder /app/aqueous-nebula-454915-h7-3ee9fd1831ba.json .
RUN cp aqueous-nebula-454915-h7-3ee9fd1831ba.json serviceAccountKey.json

# Create uploads directory and set permissions
RUN mkdir -p uploads
RUN chown -R nodejs:nodejs /app
RUN chmod 644 serviceAccountKey.json

# Set environment variables
ENV NODE_ENV=production
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/aqueous-nebula-454915-h7-3ee9fd1831ba.json
ARG PORT=5000
ENV PORT=${PORT}

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE ${PORT}

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]